/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

import { TriZettoClient } from '../../transport/trizettoClient';
import { SoapClient } from '../../transport/soapClient';
import { EdiParser, generate270Request, parse271Response } from '../../transport/ediParser';
import { validateNpi, validateMemberId, validateDateOfBirth } from '../../utils/validationUtils';
import { maskPhiInObject, createSafeLogEntry } from '../../utils/hipaaUtils';
import { formatEdiDate } from '../../utils/ediUtils';
import { getServiceTypeDescription, getEligibilityStatusDescription } from '../../utils/codeUtils';

/**
 * Eligibility Resource - 270/271 Transactions
 * 
 * Handles healthcare eligibility verification using X12 270/271 transaction sets.
 * The 270 is the eligibility inquiry sent to the payer.
 * The 271 is the eligibility response received from the payer.
 */

export const eligibilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['eligibility'],
			},
		},
		options: [
			{
				name: 'Check Eligibility',
				value: 'checkEligibility',
				description: 'Submit a 270 eligibility inquiry to verify patient coverage',
				action: 'Check eligibility',
			},
			{
				name: 'Batch Eligibility Check',
				value: 'batchEligibility',
				description: 'Submit multiple eligibility requests in a batch',
				action: 'Batch eligibility check',
			},
			{
				name: 'Get Eligibility Response',
				value: 'getResponse',
				description: 'Retrieve a 271 eligibility response by transaction ID',
				action: 'Get eligibility response',
			},
			{
				name: 'Get Benefits Summary',
				value: 'getBenefitsSummary',
				description: 'Get a summary of patient benefits from eligibility response',
				action: 'Get benefits summary',
			},
			{
				name: 'Get Coverage Details',
				value: 'getCoverageDetails',
				description: 'Get detailed coverage information for a patient',
				action: 'Get coverage details',
			},
			{
				name: 'Get Deductible Info',
				value: 'getDeductibleInfo',
				description: 'Get patient deductible information',
				action: 'Get deductible info',
			},
			{
				name: 'Get Copay Info',
				value: 'getCopayInfo',
				description: 'Get patient copay amounts by service type',
				action: 'Get copay info',
			},
			{
				name: 'Get Coinsurance',
				value: 'getCoinsurance',
				description: 'Get patient coinsurance percentages',
				action: 'Get coinsurance',
			},
			{
				name: 'Get Prior Auth Requirements',
				value: 'getPriorAuthRequirements',
				description: 'Check if prior authorization is required for services',
				action: 'Get prior auth requirements',
			},
			{
				name: 'Parse 271 Response',
				value: 'parse271',
				description: 'Parse a raw 271 EDI response into structured data',
				action: 'Parse 271 response',
			},
			{
				name: 'Get Eligibility History',
				value: 'getHistory',
				description: 'Get eligibility check history for a patient',
				action: 'Get eligibility history',
			},
		],
		default: 'checkEligibility',
	},
];

export const eligibilityFields: INodeProperties[] = [
	// Provider Information (required for eligibility)
	{
		displayName: 'Provider NPI',
		name: 'providerNpi',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1234567890',
		description: 'National Provider Identifier (10-digit NPI)',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility', 'getCoverageDetails'],
			},
		},
	},
	{
		displayName: 'Provider Name',
		name: 'providerName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the healthcare provider or organization',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility'],
			},
		},
	},

	// Payer Information
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BCBSIL',
		description: 'TriZetto/Clearinghouse payer identifier',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility', 'getCoverageDetails', 'getPriorAuthRequirements'],
			},
		},
	},

	// Subscriber/Patient Information
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient member/subscriber ID from insurance card',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility', 'getCoverageDetails', 'getDeductibleInfo', 'getCopayInfo', 'getCoinsurance', 'getPriorAuthRequirements', 'getHistory'],
			},
		},
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient first name as on insurance card',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility'],
			},
		},
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient last name as on insurance card',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility'],
			},
		},
	},
	{
		displayName: 'Date of Birth',
		name: 'dateOfBirth',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Patient date of birth in ISO format',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility'],
			},
		},
	},
	{
		displayName: 'Gender',
		name: 'gender',
		type: 'options',
		options: [
			{ name: 'Male', value: 'M' },
			{ name: 'Female', value: 'F' },
			{ name: 'Unknown', value: 'U' },
		],
		default: 'U',
		description: 'Patient gender',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'batchEligibility'],
			},
		},
	},

	// Service Type Selection
	{
		displayName: 'Service Type Code',
		name: 'serviceTypeCode',
		type: 'options',
		options: [
			{ name: '30 - Health Benefit Plan Coverage', value: '30' },
			{ name: '1 - Medical Care', value: '1' },
			{ name: '2 - Surgical', value: '2' },
			{ name: '3 - Consultation', value: '3' },
			{ name: '4 - Diagnostic X-Ray', value: '4' },
			{ name: '5 - Diagnostic Lab', value: '5' },
			{ name: '6 - Radiation Therapy', value: '6' },
			{ name: '7 - Anesthesia', value: '7' },
			{ name: '8 - Surgical Assistance', value: '8' },
			{ name: '12 - Durable Medical Equipment Purchase', value: '12' },
			{ name: '14 - Renal Supplies in the Home', value: '14' },
			{ name: '18 - Durable Medical Equipment Rental', value: '18' },
			{ name: '23 - Diagnostic Dental', value: '23' },
			{ name: '24 - Periodontics', value: '24' },
			{ name: '25 - Restorative', value: '25' },
			{ name: '26 - Endodontics', value: '26' },
			{ name: '27 - Maxillofacial Prosthetics', value: '27' },
			{ name: '33 - Chiropractic', value: '33' },
			{ name: '34 - Chiropractic Office Visits', value: '34' },
			{ name: '35 - Dental Care', value: '35' },
			{ name: '36 - Dental Crowns', value: '36' },
			{ name: '37 - Dental Accident', value: '37' },
			{ name: '38 - Orthodontics', value: '38' },
			{ name: '39 - Prosthodontics', value: '39' },
			{ name: '40 - Oral Surgery', value: '40' },
			{ name: '42 - Home Health Care', value: '42' },
			{ name: '45 - Hospice', value: '45' },
			{ name: '48 - Hospital - Inpatient', value: '48' },
			{ name: '50 - Hospital - Outpatient', value: '50' },
			{ name: '51 - Hospital - Emergency Accident', value: '51' },
			{ name: '52 - Hospital - Emergency Medical', value: '52' },
			{ name: '53 - Hospital - Ambulatory Surgical', value: '53' },
			{ name: '54 - Long Term Care', value: '54' },
			{ name: '55 - Major Medical', value: '55' },
			{ name: '56 - Medically Related Transportation', value: '56' },
			{ name: '60 - Mental Health', value: '60' },
			{ name: '61 - Inpatient Mental Health', value: '61' },
			{ name: '62 - Outpatient Mental Health', value: '62' },
			{ name: '63 - Mental Health Facility - Inpatient', value: '63' },
			{ name: '64 - Mental Health Facility - Outpatient', value: '64' },
			{ name: '68 - Dental Implants', value: '68' },
			{ name: '69 - Maternity', value: '69' },
			{ name: '76 - Dialysis', value: '76' },
			{ name: '82 - Physical Therapy', value: '82' },
			{ name: '83 - Speech Therapy', value: '83' },
			{ name: '84 - Occupational Therapy', value: '84' },
			{ name: '86 - Emergency Services', value: '86' },
			{ name: '88 - Pharmacy', value: '88' },
			{ name: '90 - Psychiatric', value: '90' },
			{ name: '91 - Psychiatric - Inpatient', value: '91' },
			{ name: '92 - Psychiatric - Outpatient', value: '92' },
			{ name: '93 - Rehabilitation', value: '93' },
			{ name: '94 - Rehabilitation - Inpatient', value: '94' },
			{ name: '95 - Rehabilitation - Outpatient', value: '95' },
			{ name: '96 - Skilled Nursing Care', value: '96' },
			{ name: '98 - Substance Abuse', value: '98' },
			{ name: '99 - Substance Abuse Facility Inpatient', value: '99' },
			{ name: 'A3 - Substance Abuse Facility Outpatient', value: 'A3' },
			{ name: 'A4 - Psychiatric - Partial Hospitalization', value: 'A4' },
			{ name: 'A6 - Psychotherapy', value: 'A6' },
			{ name: 'A7 - Psychiatric - Intensive Outpatient', value: 'A7' },
			{ name: 'A8 - Psychiatric - Residential Treatment', value: 'A8' },
			{ name: 'AL - Vision', value: 'AL' },
			{ name: 'BB - Partial Hospitalization', value: 'BB' },
			{ name: 'UC - Urgent Care', value: 'UC' },
		],
		default: '30',
		description: 'Type of service to check eligibility for',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'getCoverageDetails', 'getCopayInfo', 'getCoinsurance', 'getPriorAuthRequirements'],
			},
		},
	},

	// Date of Service
	{
		displayName: 'Date of Service',
		name: 'dateOfService',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD (defaults to today)',
		description: 'Date of service to check eligibility for',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['checkEligibility', 'getCoverageDetails', 'getPriorAuthRequirements'],
			},
		},
	},

	// Transaction/Response Lookup
	{
		displayName: 'Transaction ID',
		name: 'transactionId',
		type: 'string',
		required: true,
		default: '',
		description: 'TriZetto transaction ID for the eligibility request',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['getResponse', 'getBenefitsSummary'],
			},
		},
	},

	// Raw EDI Input
	{
		displayName: '271 EDI Content',
		name: 'ediContent',
		type: 'string',
		required: true,
		typeOptions: {
			rows: 10,
		},
		default: '',
		description: 'Raw X12 271 EDI content to parse',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['parse271'],
			},
		},
	},

	// Batch Eligibility
	{
		displayName: 'Eligibility Requests',
		name: 'eligibilityRequests',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Array of eligibility request objects for batch processing',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['batchEligibility'],
			},
		},
	},

	// History Filters
	{
		displayName: 'Date Range Start',
		name: 'dateRangeStart',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Start date for eligibility history lookup',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['getHistory'],
			},
		},
	},
	{
		displayName: 'Date Range End',
		name: 'dateRangeEnd',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'End date for eligibility history lookup',
		displayOptions: {
			show: {
				resource: ['eligibility'],
				operation: ['getHistory'],
			},
		},
	},

	// Additional Options
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['eligibility'],
			},
		},
		options: [
			{
				displayName: 'Include Dependent Information',
				name: 'includeDependent',
				type: 'boolean',
				default: false,
				description: 'Whether to include dependent information if checking as subscriber',
			},
			{
				displayName: 'Relationship to Subscriber',
				name: 'relationship',
				type: 'options',
				options: [
					{ name: 'Self', value: '18' },
					{ name: 'Spouse', value: '01' },
					{ name: 'Child', value: '19' },
					{ name: 'Other', value: '21' },
				],
				default: '18',
				description: 'Relationship of patient to the subscriber',
			},
			{
				displayName: 'Subscriber ID (If Dependent)',
				name: 'subscriberId',
				type: 'string',
				default: '',
				description: 'Subscriber member ID if patient is a dependent',
			},
			{
				displayName: 'Group Number',
				name: 'groupNumber',
				type: 'string',
				default: '',
				description: 'Insurance group number if available',
			},
			{
				displayName: 'Real-Time Mode',
				name: 'realTime',
				type: 'boolean',
				default: true,
				description: 'Whether to use real-time (synchronous) or batch (asynchronous) processing',
			},
			{
				displayName: 'Trace Number',
				name: 'traceNumber',
				type: 'string',
				default: '',
				description: 'Optional trace number for tracking the request',
			},
		],
	},
];

/**
 * Execute eligibility operations
 */
export async function executeEligibility(
	this: IExecuteFunctions,
	index: number,
	client: TriZettoClient,
	soapClient: SoapClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'checkEligibility') {
			// Gather all input parameters
			const providerNpi = this.getNodeParameter('providerNpi', index) as string;
			const providerName = this.getNodeParameter('providerName', index) as string;
			const payerId = this.getNodeParameter('payerId', index) as string;
			const memberId = this.getNodeParameter('memberId', index) as string;
			const firstName = this.getNodeParameter('firstName', index) as string;
			const lastName = this.getNodeParameter('lastName', index) as string;
			const dateOfBirth = this.getNodeParameter('dateOfBirth', index) as string;
			const gender = this.getNodeParameter('gender', index) as string;
			const serviceTypeCode = this.getNodeParameter('serviceTypeCode', index) as string;
			const dateOfService = this.getNodeParameter('dateOfService', index) as string || new Date().toISOString().split('T')[0];
			const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as {
				includeDependent?: boolean;
				relationship?: string;
				subscriberId?: string;
				groupNumber?: string;
				realTime?: boolean;
				traceNumber?: string;
			};

			// Validate inputs
			const npiValidation = validateNpi(providerNpi);
			if (!npiValidation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid Provider NPI: ${npiValidation.errors.join(', ')}`);
			}

			const memberIdValidation = validateMemberId(memberId);
			if (!memberIdValidation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid Member ID: ${memberIdValidation.errors.join(', ')}`);
			}

			const dobValidation = validateDateOfBirth(dateOfBirth);
			if (!dobValidation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid Date of Birth: ${dobValidation.errors.join(', ')}`);
			}

			// Build eligibility request
			const eligibilityRequest = {
				provider: {
					npi: providerNpi,
					name: providerName,
				},
				payer: {
					payerId,
				},
				subscriber: {
					memberId,
					firstName,
					lastName,
					dateOfBirth,
					gender,
					groupNumber: additionalOptions.groupNumber,
				},
				dependent: additionalOptions.relationship !== '18' ? {
					relationship: additionalOptions.relationship,
					subscriberId: additionalOptions.subscriberId,
				} : undefined,
				serviceType: serviceTypeCode,
				dateOfService,
				traceNumber: additionalOptions.traceNumber || `TRN${Date.now()}`,
			};

			// Generate 270 EDI or use API based on configuration
			if (additionalOptions.realTime !== false) {
				// Real-time eligibility check via API
				const response = await client.post('/eligibility/realtime', eligibilityRequest);
				
				returnData.push({
					json: {
						success: true,
						transactionId: response.transactionId,
						status: response.status,
						eligibility: {
							isActive: response.isActive,
							coverageStatus: response.coverageStatus,
							coverageStatusDescription: getEligibilityStatusDescription(response.coverageStatus),
							effectiveDate: response.effectiveDate,
							terminationDate: response.terminationDate,
							planName: response.planName,
							groupNumber: response.groupNumber,
							payerName: response.payerName,
						},
						benefits: response.benefits?.map((b: any) => ({
							...b,
							serviceTypeDescription: getServiceTypeDescription(b.serviceTypeCode),
						})),
						requestTimestamp: new Date().toISOString(),
					},
				});
			} else {
				// Batch mode - generate 270 EDI
				const ediContent = generate270Request(eligibilityRequest);
				
				const response = await client.post('/eligibility/batch', {
					ediContent,
					payerId,
				});

				returnData.push({
					json: {
						success: true,
						transactionId: response.transactionId,
						status: 'pending',
						message: 'Batch eligibility request submitted. Use getResponse to retrieve results.',
						ediControlNumber: response.controlNumber,
					},
				});
			}

		} else if (operation === 'getResponse') {
			const transactionId = this.getNodeParameter('transactionId', index) as string;

			const response = await client.get(`/eligibility/response/${transactionId}`);

			// Parse 271 if raw EDI is returned
			let parsedResponse = response;
			if (response.rawEdi) {
				parsedResponse = {
					...response,
					parsed: parse271Response(response.rawEdi),
				};
			}

			returnData.push({
				json: {
					success: true,
					transactionId,
					...parsedResponse,
				},
			});

		} else if (operation === 'getBenefitsSummary') {
			const transactionId = this.getNodeParameter('transactionId', index) as string;

			const response = await client.get(`/eligibility/response/${transactionId}`);

			// Extract benefits summary
			const benefits = response.benefits || [];
			const summary = {
				transactionId,
				subscriber: {
					memberId: response.subscriber?.memberId,
					name: `${response.subscriber?.firstName} ${response.subscriber?.lastName}`,
				},
				coverage: {
					isActive: response.isActive,
					status: response.coverageStatus,
					effectiveDate: response.effectiveDate,
					terminationDate: response.terminationDate,
				},
				benefitsSummary: benefits.map((b: any) => ({
					serviceType: b.serviceTypeCode,
					serviceTypeDescription: getServiceTypeDescription(b.serviceTypeCode),
					inNetwork: b.inNetwork,
					outOfNetwork: b.outOfNetwork,
					deductible: b.deductible,
					copay: b.copay,
					coinsurance: b.coinsurance,
					outOfPocketMax: b.outOfPocketMax,
					priorAuthRequired: b.priorAuthRequired,
				})),
			};

			returnData.push({ json: summary });

		} else if (operation === 'getCoverageDetails') {
			const payerId = this.getNodeParameter('payerId', index) as string;
			const memberId = this.getNodeParameter('memberId', index) as string;
			const serviceTypeCode = this.getNodeParameter('serviceTypeCode', index) as string;
			const dateOfService = this.getNodeParameter('dateOfService', index) as string || new Date().toISOString().split('T')[0];
			const providerNpi = this.getNodeParameter('providerNpi', index) as string;

			const response = await client.get('/eligibility/coverage', {
				payerId,
				memberId,
				serviceTypeCode,
				dateOfService,
				providerNpi,
			});

			returnData.push({
				json: {
					success: true,
					memberId,
					serviceType: serviceTypeCode,
					serviceTypeDescription: getServiceTypeDescription(serviceTypeCode),
					coverage: response,
				},
			});

		} else if (operation === 'getDeductibleInfo') {
			const memberId = this.getNodeParameter('memberId', index) as string;

			const response = await client.get(`/eligibility/deductible/${memberId}`);

			returnData.push({
				json: {
					success: true,
					memberId,
					deductibles: {
						individual: {
							inNetwork: response.individualInNetwork,
							outOfNetwork: response.individualOutOfNetwork,
							metInNetwork: response.individualMetInNetwork,
							metOutOfNetwork: response.individualMetOutOfNetwork,
							remainingInNetwork: response.individualRemainingInNetwork,
							remainingOutOfNetwork: response.individualRemainingOutOfNetwork,
						},
						family: {
							inNetwork: response.familyInNetwork,
							outOfNetwork: response.familyOutOfNetwork,
							metInNetwork: response.familyMetInNetwork,
							metOutOfNetwork: response.familyMetOutOfNetwork,
							remainingInNetwork: response.familyRemainingInNetwork,
							remainingOutOfNetwork: response.familyRemainingOutOfNetwork,
						},
					},
					planYear: response.planYear,
				},
			});

		} else if (operation === 'getCopayInfo') {
			const memberId = this.getNodeParameter('memberId', index) as string;
			const serviceTypeCode = this.getNodeParameter('serviceTypeCode', index) as string;

			const response = await client.get(`/eligibility/copay/${memberId}`, {
				serviceTypeCode,
			});

			returnData.push({
				json: {
					success: true,
					memberId,
					serviceType: serviceTypeCode,
					serviceTypeDescription: getServiceTypeDescription(serviceTypeCode),
					copays: response.copays,
				},
			});

		} else if (operation === 'getCoinsurance') {
			const memberId = this.getNodeParameter('memberId', index) as string;
			const serviceTypeCode = this.getNodeParameter('serviceTypeCode', index) as string;

			const response = await client.get(`/eligibility/coinsurance/${memberId}`, {
				serviceTypeCode,
			});

			returnData.push({
				json: {
					success: true,
					memberId,
					serviceType: serviceTypeCode,
					serviceTypeDescription: getServiceTypeDescription(serviceTypeCode),
					coinsurance: response.coinsurance,
				},
			});

		} else if (operation === 'getPriorAuthRequirements') {
			const payerId = this.getNodeParameter('payerId', index) as string;
			const memberId = this.getNodeParameter('memberId', index) as string;
			const serviceTypeCode = this.getNodeParameter('serviceTypeCode', index) as string;
			const dateOfService = this.getNodeParameter('dateOfService', index) as string || new Date().toISOString().split('T')[0];

			const response = await client.get('/eligibility/priorauth-requirements', {
				payerId,
				memberId,
				serviceTypeCode,
				dateOfService,
			});

			returnData.push({
				json: {
					success: true,
					memberId,
					serviceType: serviceTypeCode,
					serviceTypeDescription: getServiceTypeDescription(serviceTypeCode),
					priorAuthRequired: response.required,
					authTypes: response.authTypes,
					instructions: response.instructions,
					contactInfo: response.contactInfo,
				},
			});

		} else if (operation === 'parse271') {
			const ediContent = this.getNodeParameter('ediContent', index) as string;

			const parsed = parse271Response(ediContent);

			returnData.push({
				json: {
					success: true,
					parsed,
				},
			});

		} else if (operation === 'batchEligibility') {
			const providerNpi = this.getNodeParameter('providerNpi', index) as string;
			const providerName = this.getNodeParameter('providerName', index) as string;
			const payerId = this.getNodeParameter('payerId', index) as string;
			const eligibilityRequestsJson = this.getNodeParameter('eligibilityRequests', index) as string;

			let eligibilityRequests: any[];
			try {
				eligibilityRequests = JSON.parse(eligibilityRequestsJson);
			} catch (e) {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON format for eligibility requests');
			}

			if (!Array.isArray(eligibilityRequests) || eligibilityRequests.length === 0) {
				throw new NodeOperationError(this.getNode(), 'Eligibility requests must be a non-empty array');
			}

			// Validate and prepare batch
			const validatedRequests = eligibilityRequests.map((req, idx) => {
				const memberIdValidation = validateMemberId(req.memberId);
				if (!memberIdValidation.valid) {
					throw new NodeOperationError(this.getNode(), `Request ${idx + 1}: Invalid Member ID`);
				}

				return {
					provider: { npi: providerNpi, name: providerName },
					payer: { payerId },
					subscriber: {
						memberId: req.memberId,
						firstName: req.firstName,
						lastName: req.lastName,
						dateOfBirth: req.dateOfBirth,
						gender: req.gender || 'U',
					},
					serviceType: req.serviceTypeCode || '30',
					dateOfService: req.dateOfService || new Date().toISOString().split('T')[0],
				};
			});

			const response = await client.post('/eligibility/batch', {
				requests: validatedRequests,
				payerId,
			});

			returnData.push({
				json: {
					success: true,
					batchId: response.batchId,
					transactionCount: validatedRequests.length,
					status: 'submitted',
					message: 'Batch eligibility requests submitted successfully',
				},
			});

		} else if (operation === 'getHistory') {
			const memberId = this.getNodeParameter('memberId', index) as string;
			const dateRangeStart = this.getNodeParameter('dateRangeStart', index) as string;
			const dateRangeEnd = this.getNodeParameter('dateRangeEnd', index) as string;

			const params: any = { memberId };
			if (dateRangeStart) params.startDate = dateRangeStart;
			if (dateRangeEnd) params.endDate = dateRangeEnd;

			const response = await client.get('/eligibility/history', params);

			returnData.push({
				json: {
					success: true,
					memberId,
					history: response.transactions?.map((t: any) => ({
						transactionId: t.transactionId,
						date: t.date,
						payerId: t.payerId,
						serviceType: t.serviceTypeCode,
						serviceTypeDescription: getServiceTypeDescription(t.serviceTypeCode),
						status: t.status,
						isActive: t.isActive,
					})),
					totalCount: response.totalCount,
				},
			});

		} else {
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

	} catch (error: any) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(this.getNode(), `Eligibility operation failed: ${error.message}`);
	}

	return returnData;
}
