/**
 * TriZetto SOAP Client
 * Handles SOAP-based healthcare transactions (eligibility, claims, etc.)
 * 
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	NodeApiError,
} from 'n8n-workflow';
import { parseStringPromise, Builder } from 'xml2js';
import { SOAP_ENDPOINTS, ENVIRONMENTS } from '../constants/endpoints';
import { ITriZettoApiCredentials, getBaseUrl } from './trizettoClient';

export interface ISoapResponse {
	success: boolean;
	data?: unknown;
	rawXml?: string;
	error?: {
		code: string;
		message: string;
		faultString?: string;
	};
}

export interface ISoapRequestOptions {
	soapAction: string;
	namespace: string;
	operationName: string;
	parameters: Record<string, unknown>;
	timeout?: number;
}

// SOAP namespaces used by TriZetto
const NAMESPACES = {
	soap: 'http://schemas.xmlsoap.org/soap/envelope/',
	soap12: 'http://www.w3.org/2003/05/soap-envelope',
	wsse: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd',
	wsu: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
	trizetto: 'http://trizetto.com/services/healthcare',
	eligibility: 'http://trizetto.com/services/eligibility',
	claims: 'http://trizetto.com/services/claims',
	remittance: 'http://trizetto.com/services/remittance',
};

/**
 * Build WS-Security header for SOAP authentication
 */
function buildSecurityHeader(username: string, password: string): string {
	const timestamp = new Date().toISOString();
	const expires = new Date(Date.now() + 300000).toISOString(); // 5 minutes
	
	return `
		<wsse:Security xmlns:wsse="${NAMESPACES.wsse}" xmlns:wsu="${NAMESPACES.wsu}">
			<wsu:Timestamp wsu:Id="Timestamp">
				<wsu:Created>${timestamp}</wsu:Created>
				<wsu:Expires>${expires}</wsu:Expires>
			</wsu:Timestamp>
			<wsse:UsernameToken wsu:Id="UsernameToken">
				<wsse:Username>${escapeXml(username)}</wsse:Username>
				<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${escapeXml(password)}</wsse:Password>
			</wsse:UsernameToken>
		</wsse:Security>
	`;
}

/**
 * Escape special characters for XML
 */
function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Convert JavaScript object to XML elements
 */
function objectToXml(obj: Record<string, unknown>, namespace?: string): string {
	const builder = new Builder({
		headless: true,
		renderOpts: { pretty: false },
	});
	
	const wrapped: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		const tagName = namespace ? `${namespace}:${key}` : key;
		wrapped[tagName] = value;
	}
	
	return builder.buildObject(wrapped);
}

/**
 * Build complete SOAP envelope
 */
function buildSoapEnvelope(
	options: ISoapRequestOptions,
	credentials: ITriZettoApiCredentials,
): string {
	const securityHeader = buildSecurityHeader(credentials.username, credentials.password);
	const bodyContent = objectToXml(options.parameters, 'triz');
	
	return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope 
	xmlns:soap="${NAMESPACES.soap}"
	xmlns:triz="${options.namespace}"
	xmlns:wsse="${NAMESPACES.wsse}"
	xmlns:wsu="${NAMESPACES.wsu}">
	<soap:Header>
		${securityHeader}
		<triz:SubmitterInfo>
			<triz:SubmitterId>${escapeXml(credentials.submitterId)}</triz:SubmitterId>
			${credentials.siteId ? `<triz:SiteId>${escapeXml(credentials.siteId)}</triz:SiteId>` : ''}
			${credentials.vendorId ? `<triz:VendorId>${escapeXml(credentials.vendorId)}</triz:VendorId>` : ''}
		</triz:SubmitterInfo>
	</soap:Header>
	<soap:Body>
		<triz:${options.operationName}>
			${bodyContent}
		</triz:${options.operationName}>
	</soap:Body>
</soap:Envelope>`;
}

/**
 * Parse SOAP response and extract data
 */
async function parseSoapResponse(
	xml: string,
	operationName: string,
): Promise<ISoapResponse> {
	try {
		const result = await parseStringPromise(xml, {
			explicitArray: false,
			ignoreAttrs: false,
			tagNameProcessors: [(name: string) => name.replace(/^[^:]+:/, '')], // Remove namespace prefixes
		});
		
		const envelope = result.Envelope || result['soap:Envelope'] || result['SOAP-ENV:Envelope'];
		
		if (!envelope) {
			return {
				success: false,
				rawXml: xml,
				error: {
					code: 'PARSE_ERROR',
					message: 'Could not parse SOAP envelope',
				},
			};
		}
		
		const body = envelope.Body || envelope['soap:Body'];
		
		// Check for SOAP fault
		const fault = body.Fault || body['soap:Fault'];
		if (fault) {
			return {
				success: false,
				rawXml: xml,
				error: {
					code: fault.faultcode || fault.Code?.Value || 'SOAP_FAULT',
					message: fault.faultstring || fault.Reason?.Text || 'SOAP Fault occurred',
					faultString: fault.detail || fault.Detail,
				},
			};
		}
		
		// Extract response data
		const responseElement = body[`${operationName}Response`] || body[operationName + 'Response'];
		
		return {
			success: true,
			data: responseElement || body,
			rawXml: xml,
		};
	} catch (error) {
		return {
			success: false,
			rawXml: xml,
			error: {
				code: 'PARSE_ERROR',
				message: `Failed to parse SOAP response: ${(error as Error).message}`,
			},
		};
	}
}

/**
 * Make a SOAP request to TriZetto
 */
export async function soapRequest(
	this: IExecuteFunctions,
	endpoint: string,
	options: ISoapRequestOptions,
): Promise<ISoapResponse> {
	const credentials = await this.getCredentials('trizettoApi') as unknown as ITriZettoApiCredentials;
	const baseUrl = getBaseUrl(credentials);
	const soapEndpoint = `${baseUrl}${endpoint}`;
	
	const soapEnvelope = buildSoapEnvelope(options, credentials);
	
	const requestOptions: IHttpRequestOptions = {
		method: 'POST' as IHttpRequestMethods,
		url: soapEndpoint,
		headers: {
			'Content-Type': 'text/xml; charset=utf-8',
			'SOAPAction': options.soapAction,
			'Accept': 'text/xml',
		},
		body: soapEnvelope,
		timeout: options.timeout || 30000,
		returnFullResponse: true,
	};
	
	try {
		const response = await this.helpers.httpRequest(requestOptions) as {
			body: string;
			statusCode: number;
		};
		
		const parsedResponse = await parseSoapResponse(response.body, options.operationName);
		
		if (!parsedResponse.success) {
			throw new NodeApiError(this.getNode(), new Error(parsedResponse.error?.message || 'SOAP request failed'), {
				message: parsedResponse.error?.message || 'SOAP request failed',
				description: `SOAP Fault Code: ${parsedResponse.error?.code}`,
			});
		}
		
		return parsedResponse;
	} catch (error: unknown) {
		if (error instanceof NodeApiError) {
			throw error;
		}
		
		throw new NodeApiError(this.getNode(), error as Error, {
			message: 'SOAP request failed',
		});
	}
}

/**
 * Eligibility check via SOAP (270/271)
 */
export async function checkEligibilitySoap(
	this: IExecuteFunctions,
	subscriberInfo: {
		memberId: string;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		payerId: string;
	},
	providerInfo: {
		npi: string;
		taxId?: string;
	},
	serviceTypeCode = '30', // Health benefit plan coverage
	serviceDate?: string,
): Promise<ISoapResponse> {
	return soapRequest.call(this, SOAP_ENDPOINTS.eligibility, {
		soapAction: 'http://trizetto.com/services/eligibility/CheckEligibility',
		namespace: NAMESPACES.eligibility,
		operationName: 'CheckEligibility',
		parameters: {
			EligibilityRequest: {
				Subscriber: {
					MemberId: subscriberInfo.memberId,
					FirstName: subscriberInfo.firstName,
					LastName: subscriberInfo.lastName,
					DateOfBirth: subscriberInfo.dateOfBirth,
				},
				Payer: {
					PayerId: subscriberInfo.payerId,
				},
				Provider: {
					NPI: providerInfo.npi,
					TaxId: providerInfo.taxId,
				},
				ServiceTypeCode: serviceTypeCode,
				ServiceDate: serviceDate || new Date().toISOString().split('T')[0],
			},
		},
	});
}

/**
 * Submit claim via SOAP (837)
 */
export async function submitClaimSoap(
	this: IExecuteFunctions,
	claimData: {
		claimType: '837P' | '837I' | '837D';
		patient: {
			memberId: string;
			firstName: string;
			lastName: string;
			dateOfBirth: string;
			gender: string;
		};
		subscriber?: {
			memberId: string;
			firstName: string;
			lastName: string;
			dateOfBirth: string;
			relationshipCode: string;
		};
		provider: {
			npi: string;
			taxId: string;
			name: string;
			address?: {
				line1: string;
				city: string;
				state: string;
				zip: string;
			};
		};
		payer: {
			payerId: string;
			name?: string;
		};
		claimInfo: {
			patientAccountNumber: string;
			totalChargeAmount: number;
			placeOfService?: string;
			frequencyCode?: string;
		};
		diagnoses: Array<{
			code: string;
			codeType: 'ICD10' | 'ICD9';
			sequence: number;
		}>;
		serviceLines: Array<{
			procedureCode: string;
			modifiers?: string[];
			chargeAmount: number;
			units: number;
			serviceDate: string;
			diagnosisPointers?: number[];
		}>;
	},
): Promise<ISoapResponse> {
	return soapRequest.call(this, SOAP_ENDPOINTS.claims, {
		soapAction: 'http://trizetto.com/services/claims/SubmitClaim',
		namespace: NAMESPACES.claims,
		operationName: 'SubmitClaim',
		parameters: {
			ClaimSubmission: {
				ClaimType: claimData.claimType,
				Patient: claimData.patient,
				Subscriber: claimData.subscriber || claimData.patient,
				BillingProvider: claimData.provider,
				Payer: claimData.payer,
				ClaimInformation: claimData.claimInfo,
				Diagnoses: {
					Diagnosis: claimData.diagnoses,
				},
				ServiceLines: {
					ServiceLine: claimData.serviceLines,
				},
			},
		},
		timeout: 60000, // Claims may take longer
	});
}

/**
 * Check claim status via SOAP (276/277)
 */
export async function checkClaimStatusSoap(
	this: IExecuteFunctions,
	statusRequest: {
		claimId?: string;
		payerClaimNumber?: string;
		patientAccountNumber?: string;
		memberId: string;
		providerNpi: string;
		payerId: string;
		serviceDateFrom?: string;
		serviceDateTo?: string;
	},
): Promise<ISoapResponse> {
	return soapRequest.call(this, SOAP_ENDPOINTS.claimStatus, {
		soapAction: 'http://trizetto.com/services/claims/CheckClaimStatus',
		namespace: NAMESPACES.claims,
		operationName: 'CheckClaimStatus',
		parameters: {
			ClaimStatusRequest: {
				ClaimId: statusRequest.claimId,
				PayerClaimNumber: statusRequest.payerClaimNumber,
				PatientAccountNumber: statusRequest.patientAccountNumber,
				MemberId: statusRequest.memberId,
				ProviderNPI: statusRequest.providerNpi,
				PayerId: statusRequest.payerId,
				ServiceDateFrom: statusRequest.serviceDateFrom,
				ServiceDateTo: statusRequest.serviceDateTo,
			},
		},
	});
}

/**
 * Get remittance advice via SOAP (835)
 */
export async function getRemittanceAdviceSoap(
	this: IExecuteFunctions,
	remittanceRequest: {
		checkNumber?: string;
		eftTraceNumber?: string;
		paymentDateFrom?: string;
		paymentDateTo?: string;
		providerNpi?: string;
		payerId?: string;
	},
): Promise<ISoapResponse> {
	return soapRequest.call(this, SOAP_ENDPOINTS.remittance, {
		soapAction: 'http://trizetto.com/services/remittance/GetRemittanceAdvice',
		namespace: NAMESPACES.remittance,
		operationName: 'GetRemittanceAdvice',
		parameters: {
			RemittanceRequest: {
				CheckNumber: remittanceRequest.checkNumber,
				EFTTraceNumber: remittanceRequest.eftTraceNumber,
				PaymentDateFrom: remittanceRequest.paymentDateFrom,
				PaymentDateTo: remittanceRequest.paymentDateTo,
				ProviderNPI: remittanceRequest.providerNpi,
				PayerId: remittanceRequest.payerId,
			},
		},
	});
}

/**
 * Submit prior authorization via SOAP (278)
 */
export async function submitPriorAuthSoap(
	this: IExecuteFunctions,
	authRequest: {
		patient: {
			memberId: string;
			firstName: string;
			lastName: string;
			dateOfBirth: string;
		};
		requestingProvider: {
			npi: string;
			name: string;
		};
		servicingProvider?: {
			npi: string;
			name: string;
		};
		facility?: {
			npi: string;
			name: string;
		};
		payer: {
			payerId: string;
		};
		serviceInfo: {
			serviceTypeCode: string;
			procedureCodes?: string[];
			diagnosisCodes?: string[];
			requestedUnits?: number;
			requestedDays?: number;
			levelOfService?: string;
		};
		clinicalInfo?: {
			narrative?: string;
			attachments?: Array<{
				type: string;
				content: string;
			}>;
		};
	},
): Promise<ISoapResponse> {
	return soapRequest.call(this, SOAP_ENDPOINTS.priorAuth, {
		soapAction: 'http://trizetto.com/services/priorauth/SubmitAuthorizationRequest',
		namespace: 'http://trizetto.com/services/priorauth',
		operationName: 'SubmitAuthorizationRequest',
		parameters: {
			AuthorizationRequest: {
				Patient: authRequest.patient,
				RequestingProvider: authRequest.requestingProvider,
				ServicingProvider: authRequest.servicingProvider,
				Facility: authRequest.facility,
				Payer: authRequest.payer,
				ServiceInformation: authRequest.serviceInfo,
				ClinicalInformation: authRequest.clinicalInfo,
			},
		},
		timeout: 60000,
	});
}
