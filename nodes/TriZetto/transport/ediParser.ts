/**
 * TriZetto EDI Parser - X12 Transaction Parsing and Generation
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import { IExecuteFunctions, ILoadOptionsFunctions, IDataObject, NodeApiError } from 'n8n-workflow';

/**
 * EDI Segment interface
 */
export interface IEdiSegment {
	id: string;
	elements: string[];
	raw: string;
}

/**
 * EDI Transaction interface
 */
export interface IEdiTransaction {
	type: string;
	controlNumber: string;
	segments: IEdiSegment[];
	loops: Record<string, IEdiSegment[]>;
}

/**
 * EDI Interchange interface
 */
export interface IEdiInterchange {
	senderId: string;
	receiverId: string;
	date: string;
	time: string;
	controlNumber: string;
	functionalGroups: IEdiFunctionalGroup[];
}

/**
 * EDI Functional Group interface
 */
export interface IEdiFunctionalGroup {
	functionalId: string;
	senderId: string;
	receiverId: string;
	date: string;
	time: string;
	controlNumber: string;
	transactions: IEdiTransaction[];
}

/**
 * Parsed 271 Eligibility Response
 */
export interface IParsed271Response {
	transactionType: string;
	controlNumber: string;
	receiver: {
		entityType: string;
		name: string;
		identification: string;
	};
	subscriber: {
		memberId: string;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		gender: string;
		address?: {
			street: string;
			city: string;
			state: string;
			zip: string;
		};
	};
	payer: {
		name: string;
		payerId: string;
	};
	coverageInfo: {
		planName: string;
		groupNumber: string;
		coverageType: string;
		effectiveDate: string;
		terminationDate?: string;
		status: string;
		statusCode: string;
	};
	benefits: IBenefitInfo[];
	errors?: IEdiError[];
}

/**
 * Benefit information from 271
 */
export interface IBenefitInfo {
	serviceType: string;
	serviceTypeCode: string;
	coverageLevel: string;
	benefitType: string;
	benefitAmount?: number;
	benefitPercent?: number;
	timePeriod?: string;
	quantity?: number;
	quantityQualifier?: string;
	inNetwork: boolean;
	authRequired: boolean;
	additionalInfo?: string[];
}

/**
 * Parsed 277 Claim Status Response
 */
export interface IParsed277Response {
	transactionType: string;
	controlNumber: string;
	payer: {
		name: string;
		payerId: string;
	};
	provider: {
		name: string;
		npi: string;
		taxId?: string;
	};
	claims: IClaimStatusInfo[];
	errors?: IEdiError[];
}

/**
 * Claim status information from 277
 */
export interface IClaimStatusInfo {
	patientControlNumber: string;
	payerClaimNumber?: string;
	claimStatus: string;
	statusCategoryCode: string;
	statusCode: string;
	effectiveDate: string;
	chargeAmount: number;
	paidAmount?: number;
	patientName: string;
	serviceDate: string;
	trackingNumber?: string;
	additionalStatus?: Array<{
		categoryCode: string;
		statusCode: string;
		entityCode?: string;
		freeFormText?: string;
	}>;
}

/**
 * Parsed 835 Remittance Advice
 */
export interface IParsed835Response {
	transactionType: string;
	controlNumber: string;
	payer: {
		name: string;
		payerId: string;
		address?: {
			street: string;
			city: string;
			state: string;
			zip: string;
		};
	};
	payee: {
		name: string;
		npi: string;
		taxId: string;
		address?: {
			street: string;
			city: string;
			state: string;
			zip: string;
		};
	};
	financialInfo: {
		paymentMethod: string;
		paymentFormat?: string;
		checkEftNumber: string;
		paymentDate: string;
		totalPaymentAmount: number;
	};
	claims: IRemittanceClaim[];
	providerAdjustments?: IProviderAdjustment[];
	errors?: IEdiError[];
}

/**
 * Remittance claim from 835
 */
export interface IRemittanceClaim {
	patientControlNumber: string;
	payerClaimNumber: string;
	claimStatus: string;
	chargedAmount: number;
	paidAmount: number;
	patientResponsibility: number;
	claimFilingIndicator: string;
	patientName: string;
	memberId?: string;
	serviceDate: string;
	serviceLines: IRemittanceServiceLine[];
	adjustments: IClaimAdjustment[];
	remarks: string[];
}

/**
 * Service line from 835
 */
export interface IRemittanceServiceLine {
	procedureCode: string;
	modifiers?: string[];
	chargedAmount: number;
	paidAmount: number;
	quantity: number;
	serviceDate: string;
	adjustments: IClaimAdjustment[];
	remarks: string[];
}

/**
 * Claim adjustment
 */
export interface IClaimAdjustment {
	groupCode: string;
	reasonCode: string;
	amount: number;
	quantity?: number;
}

/**
 * Provider level adjustment
 */
export interface IProviderAdjustment {
	fiscalPeriodDate: string;
	adjustmentIdentifier: string;
	referenceIdentifier?: string;
	adjustmentAmount: number;
}

/**
 * EDI Error
 */
export interface IEdiError {
	segmentId?: string;
	elementPosition?: number;
	errorCode: string;
	errorDescription: string;
}

/**
 * 997/999 Acknowledgment
 */
export interface IEdiAcknowledgment {
	type: '997' | '999';
	controlNumber: string;
	functionalGroupControlNumber: string;
	acknowledgmentCode: string;
	acceptedTransactions: number;
	rejectedTransactions: number;
	errors?: IEdiError[];
}

/**
 * Default segment/element delimiters
 */
const DEFAULT_SEGMENT_DELIMITER = '~';
const DEFAULT_ELEMENT_DELIMITER = '*';
const DEFAULT_SUBELEMENT_DELIMITER = ':';

/**
 * Parse raw EDI content into structured interchange
 */
export function parseEdiInterchange(ediContent: string): IEdiInterchange {
	// Clean and normalize content
	const cleanContent = ediContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

	// Detect delimiters from ISA segment
	const segmentDelimiter = detectSegmentDelimiter(cleanContent);
	const elementDelimiter = detectElementDelimiter(cleanContent);

	// Split into segments
	const segments = cleanContent.split(segmentDelimiter).filter(s => s.trim());

	// Parse ISA (Interchange Control Header)
	const isaSegment = segments.find(s => s.trim().startsWith('ISA'));
	if (!isaSegment) {
		throw new Error('Invalid EDI: Missing ISA segment');
	}

	const isaElements = isaSegment.split(elementDelimiter);

	const interchange: IEdiInterchange = {
		senderId: isaElements[6]?.trim() || '',
		receiverId: isaElements[8]?.trim() || '',
		date: isaElements[9]?.trim() || '',
		time: isaElements[10]?.trim() || '',
		controlNumber: isaElements[13]?.trim() || '',
		functionalGroups: [],
	};

	// Parse functional groups
	let currentGroup: IEdiFunctionalGroup | null = null;
	let currentTransaction: IEdiTransaction | null = null;

	for (const segmentRaw of segments) {
		const segment = parseSegment(segmentRaw, elementDelimiter);

		switch (segment.id) {
			case 'GS': // Functional Group Header
				currentGroup = {
					functionalId: segment.elements[0] || '',
					senderId: segment.elements[1] || '',
					receiverId: segment.elements[2] || '',
					date: segment.elements[3] || '',
					time: segment.elements[4] || '',
					controlNumber: segment.elements[5] || '',
					transactions: [],
				};
				break;

			case 'GE': // Functional Group Trailer
				if (currentGroup) {
					interchange.functionalGroups.push(currentGroup);
					currentGroup = null;
				}
				break;

			case 'ST': // Transaction Set Header
				currentTransaction = {
					type: segment.elements[0] || '',
					controlNumber: segment.elements[1] || '',
					segments: [],
					loops: {},
				};
				break;

			case 'SE': // Transaction Set Trailer
				if (currentTransaction && currentGroup) {
					currentGroup.transactions.push(currentTransaction);
					currentTransaction = null;
				}
				break;

			default:
				if (currentTransaction) {
					currentTransaction.segments.push(segment);
				}
		}
	}

	return interchange;
}

/**
 * Parse a single segment
 */
function parseSegment(raw: string, elementDelimiter: string): IEdiSegment {
	const trimmed = raw.trim();
	const parts = trimmed.split(elementDelimiter);
	return {
		id: parts[0] || '',
		elements: parts.slice(1),
		raw: trimmed,
	};
}

/**
 * Detect segment delimiter from ISA
 */
function detectSegmentDelimiter(content: string): string {
	// ISA is fixed length, segment terminator is at position 105
	if (content.length >= 106 && content.startsWith('ISA')) {
		return content.charAt(105);
	}
	// Fallback to common delimiters
	if (content.includes('~')) return '~';
	if (content.includes('\n')) return '\n';
	return DEFAULT_SEGMENT_DELIMITER;
}

/**
 * Detect element delimiter from ISA
 */
function detectElementDelimiter(content: string): string {
	// Element delimiter is at position 3 (after 'ISA')
	if (content.length >= 4 && content.startsWith('ISA')) {
		return content.charAt(3);
	}
	return DEFAULT_ELEMENT_DELIMITER;
}

/**
 * Parse 271 Eligibility Response
 */
export function parse271Response(ediContent: string): IParsed271Response {
	const interchange = parseEdiInterchange(ediContent);
	const transaction = interchange.functionalGroups[0]?.transactions[0];

	if (!transaction || transaction.type !== '271') {
		throw new Error('Invalid EDI: Expected 271 transaction');
	}

	const response: IParsed271Response = {
		transactionType: '271',
		controlNumber: transaction.controlNumber,
		receiver: { entityType: '', name: '', identification: '' },
		subscriber: {
			memberId: '',
			firstName: '',
			lastName: '',
			dateOfBirth: '',
			gender: '',
		},
		payer: { name: '', payerId: '' },
		coverageInfo: {
			planName: '',
			groupNumber: '',
			coverageType: '',
			effectiveDate: '',
			status: '',
			statusCode: '',
		},
		benefits: [],
	};

	let currentLoop = '';
	let currentBenefit: Partial<IBenefitInfo> | null = null;

	for (const segment of transaction.segments) {
		switch (segment.id) {
			case 'HL': // Hierarchical Level
				currentLoop = segment.elements[2] || '';
				break;

			case 'NM1': // Entity Name
				processNM1Segment(segment, response, currentLoop);
				break;

			case 'N3': // Address
				if (currentLoop === '22') {
					response.subscriber.address = response.subscriber.address || {
						street: '',
						city: '',
						state: '',
						zip: '',
					};
					response.subscriber.address.street = segment.elements[0] || '';
				}
				break;

			case 'N4': // City/State/Zip
				if (currentLoop === '22') {
					response.subscriber.address = response.subscriber.address || {
						street: '',
						city: '',
						state: '',
						zip: '',
					};
					response.subscriber.address.city = segment.elements[0] || '';
					response.subscriber.address.state = segment.elements[1] || '';
					response.subscriber.address.zip = segment.elements[2] || '';
				}
				break;

			case 'DMG': // Demographic Information
				response.subscriber.dateOfBirth = formatEdiDate(segment.elements[1] || '');
				response.subscriber.gender = segment.elements[2] || '';
				break;

			case 'INS': // Member Level Detail
				// Subscriber indicator
				break;

			case 'REF': // Reference Identification
				processRefSegment(segment, response);
				break;

			case 'DTP': // Date/Time Period
				processDtpSegment(segment, response, currentBenefit);
				break;

			case 'EB': // Eligibility/Benefit
				if (currentBenefit) {
					response.benefits.push(currentBenefit as IBenefitInfo);
				}
				currentBenefit = parseEBSegment(segment);
				break;

			case 'MSG': // Message Text
				if (currentBenefit) {
					currentBenefit.additionalInfo = currentBenefit.additionalInfo || [];
					currentBenefit.additionalInfo.push(segment.elements[0] || '');
				}
				break;

			case 'AAA': // Request Validation
				response.errors = response.errors || [];
				response.errors.push({
					errorCode: segment.elements[2] || '',
					errorDescription: getAAAErrorDescription(segment.elements[2] || ''),
				});
				break;
		}
	}

	if (currentBenefit) {
		response.benefits.push(currentBenefit as IBenefitInfo);
	}

	return response;
}

/**
 * Process NM1 segment for 271
 */
function processNM1Segment(segment: IEdiSegment, response: IParsed271Response, currentLoop: string): void {
	const entityCode = segment.elements[0];

	switch (entityCode) {
		case 'PR': // Payer
			response.payer.name = `${segment.elements[2] || ''}`.trim();
			response.payer.payerId = segment.elements[8] || '';
			break;

		case 'IL': // Insured/Subscriber
		case '03': // Dependent
			response.subscriber.lastName = segment.elements[2] || '';
			response.subscriber.firstName = segment.elements[3] || '';
			response.subscriber.memberId = segment.elements[8] || '';
			break;

		case '1P': // Provider
			response.receiver.entityType = 'Provider';
			response.receiver.name = `${segment.elements[2] || ''} ${segment.elements[3] || ''}`.trim();
			response.receiver.identification = segment.elements[8] || '';
			break;
	}
}

/**
 * Process REF segment
 */
function processRefSegment(segment: IEdiSegment, response: IParsed271Response): void {
	const qualifier = segment.elements[0];

	switch (qualifier) {
		case '18': // Plan Number
			response.coverageInfo.planName = segment.elements[1] || '';
			break;
		case '6P': // Group Number
			response.coverageInfo.groupNumber = segment.elements[1] || '';
			break;
	}
}

/**
 * Process DTP segment
 */
function processDtpSegment(
	segment: IEdiSegment,
	response: IParsed271Response,
	currentBenefit: Partial<IBenefitInfo> | null
): void {
	const qualifier = segment.elements[0];
	const date = formatEdiDate(segment.elements[2] || '');

	switch (qualifier) {
		case '291': // Plan Begin
			response.coverageInfo.effectiveDate = date;
			break;
		case '292': // Plan End
			response.coverageInfo.terminationDate = date;
			break;
	}
}

/**
 * Parse EB (Eligibility/Benefit) segment
 */
function parseEBSegment(segment: IEdiSegment): Partial<IBenefitInfo> {
	const benefit: Partial<IBenefitInfo> = {
		serviceType: getServiceTypeDescription(segment.elements[2] || ''),
		serviceTypeCode: segment.elements[2] || '',
		coverageLevel: segment.elements[1] || '',
		benefitType: getBenefitTypeDescription(segment.elements[0] || ''),
		inNetwork: segment.elements[5] === 'Y',
		authRequired: segment.elements[10] === 'Y',
	};

	// Amount
	if (segment.elements[6]) {
		benefit.benefitAmount = parseFloat(segment.elements[6]);
	}

	// Percent
	if (segment.elements[7]) {
		benefit.benefitPercent = parseFloat(segment.elements[7]) * 100;
	}

	// Time Period
	if (segment.elements[5]) {
		benefit.timePeriod = getTimePeriodDescription(segment.elements[5]);
	}

	// Quantity
	if (segment.elements[8]) {
		benefit.quantity = parseFloat(segment.elements[8]);
		benefit.quantityQualifier = segment.elements[9] || '';
	}

	return benefit;
}

/**
 * Parse 277 Claim Status Response
 */
export function parse277Response(ediContent: string): IParsed277Response {
	const interchange = parseEdiInterchange(ediContent);
	const transaction = interchange.functionalGroups[0]?.transactions[0];

	if (!transaction || (transaction.type !== '277' && transaction.type !== '277CA')) {
		throw new Error('Invalid EDI: Expected 277 transaction');
	}

	const response: IParsed277Response = {
		transactionType: transaction.type,
		controlNumber: transaction.controlNumber,
		payer: { name: '', payerId: '' },
		provider: { name: '', npi: '' },
		claims: [],
	};

	let currentClaim: Partial<IClaimStatusInfo> | null = null;

	for (const segment of transaction.segments) {
		switch (segment.id) {
			case 'NM1':
				const entityCode = segment.elements[0];
				if (entityCode === 'PR') {
					response.payer.name = segment.elements[2] || '';
					response.payer.payerId = segment.elements[8] || '';
				} else if (entityCode === '1P' || entityCode === '85') {
					response.provider.name = `${segment.elements[2] || ''} ${segment.elements[3] || ''}`.trim();
					response.provider.npi = segment.elements[8] || '';
				} else if (entityCode === 'QC' || entityCode === 'IL') {
					if (currentClaim) {
						currentClaim.patientName = `${segment.elements[3] || ''} ${segment.elements[2] || ''}`.trim();
					}
				}
				break;

			case 'TRN': // Trace Number
				if (currentClaim) {
					currentClaim.trackingNumber = segment.elements[1] || '';
				}
				break;

			case 'STC': // Status Information
				if (!currentClaim) {
					currentClaim = {
						patientControlNumber: '',
						claimStatus: '',
						statusCategoryCode: '',
						statusCode: '',
						effectiveDate: '',
						chargeAmount: 0,
						patientName: '',
						serviceDate: '',
					};
				}
				const statusInfo = (segment.elements[0] || '').split(':');
				currentClaim.statusCategoryCode = statusInfo[0] || '';
				currentClaim.statusCode = statusInfo[1] || '';
				currentClaim.claimStatus = getClaimStatusDescription(statusInfo[0] || '', statusInfo[1] || '');
				currentClaim.effectiveDate = formatEdiDate(segment.elements[1] || '');
				if (segment.elements[3]) {
					currentClaim.chargeAmount = parseFloat(segment.elements[3]);
				}
				if (segment.elements[4]) {
					currentClaim.paidAmount = parseFloat(segment.elements[4]);
				}
				break;

			case 'REF':
				if (currentClaim) {
					const refQual = segment.elements[0];
					if (refQual === '1K') {
						currentClaim.payerClaimNumber = segment.elements[1] || '';
					} else if (refQual === 'EJ' || refQual === 'D9') {
						currentClaim.patientControlNumber = segment.elements[1] || '';
					}
				}
				break;

			case 'DTP':
				if (currentClaim && segment.elements[0] === '472') {
					currentClaim.serviceDate = formatEdiDate(segment.elements[2] || '');
				}
				break;

			case 'SE': // Transaction end - push last claim
				if (currentClaim && currentClaim.statusCode) {
					response.claims.push(currentClaim as IClaimStatusInfo);
					currentClaim = null;
				}
				break;
		}
	}

	return response;
}

/**
 * Parse 835 Remittance Advice
 */
export function parse835Response(ediContent: string): IParsed835Response {
	const interchange = parseEdiInterchange(ediContent);
	const transaction = interchange.functionalGroups[0]?.transactions[0];

	if (!transaction || transaction.type !== '835') {
		throw new Error('Invalid EDI: Expected 835 transaction');
	}

	const response: IParsed835Response = {
		transactionType: '835',
		controlNumber: transaction.controlNumber,
		payer: { name: '', payerId: '' },
		payee: { name: '', npi: '', taxId: '' },
		financialInfo: {
			paymentMethod: '',
			checkEftNumber: '',
			paymentDate: '',
			totalPaymentAmount: 0,
		},
		claims: [],
	};

	let currentClaim: Partial<IRemittanceClaim> | null = null;
	let currentServiceLine: Partial<IRemittanceServiceLine> | null = null;
	let inClaimLoop = false;
	let inServiceLoop = false;

	for (const segment of transaction.segments) {
		switch (segment.id) {
			case 'BPR': // Financial Information
				response.financialInfo.paymentMethod = getPaymentMethodDescription(segment.elements[0] || '');
				response.financialInfo.totalPaymentAmount = parseFloat(segment.elements[1] || '0');
				response.financialInfo.paymentFormat = segment.elements[2] || '';
				response.financialInfo.paymentDate = formatEdiDate(segment.elements[15] || '');
				break;

			case 'TRN': // Check/EFT Number
				response.financialInfo.checkEftNumber = segment.elements[1] || '';
				break;

			case 'N1':
				const entityId = segment.elements[0];
				if (entityId === 'PR') {
					response.payer.name = segment.elements[1] || '';
					response.payer.payerId = segment.elements[3] || '';
				} else if (entityId === 'PE') {
					response.payee.name = segment.elements[1] || '';
					if (segment.elements[2] === 'XX') {
						response.payee.npi = segment.elements[3] || '';
					} else if (segment.elements[2] === 'FI') {
						response.payee.taxId = segment.elements[3] || '';
					}
				}
				break;

			case 'CLP': // Claim Payment
				if (currentClaim) {
					if (currentServiceLine) {
						currentClaim.serviceLines = currentClaim.serviceLines || [];
						currentClaim.serviceLines.push(currentServiceLine as IRemittanceServiceLine);
					}
					response.claims.push(currentClaim as IRemittanceClaim);
				}
				currentClaim = {
					patientControlNumber: segment.elements[0] || '',
					claimStatus: getClaimPaymentStatus(segment.elements[1] || ''),
					chargedAmount: parseFloat(segment.elements[2] || '0'),
					paidAmount: parseFloat(segment.elements[3] || '0'),
					patientResponsibility: parseFloat(segment.elements[4] || '0'),
					claimFilingIndicator: segment.elements[5] || '',
					payerClaimNumber: segment.elements[6] || '',
					patientName: '',
					serviceDate: '',
					serviceLines: [],
					adjustments: [],
					remarks: [],
				};
				currentServiceLine = null;
				inClaimLoop = true;
				inServiceLoop = false;
				break;

			case 'CAS': // Adjustment
				const adjustment: IClaimAdjustment = {
					groupCode: segment.elements[0] || '',
					reasonCode: segment.elements[1] || '',
					amount: parseFloat(segment.elements[2] || '0'),
					quantity: segment.elements[3] ? parseFloat(segment.elements[3]) : undefined,
				};
				if (inServiceLoop && currentServiceLine) {
					currentServiceLine.adjustments = currentServiceLine.adjustments || [];
					currentServiceLine.adjustments.push(adjustment);
				} else if (inClaimLoop && currentClaim) {
					currentClaim.adjustments = currentClaim.adjustments || [];
					currentClaim.adjustments.push(adjustment);
				}
				break;

			case 'NM1':
				if (currentClaim && segment.elements[0] === 'QC') {
					currentClaim.patientName = `${segment.elements[3] || ''} ${segment.elements[2] || ''}`.trim();
					currentClaim.memberId = segment.elements[8] || '';
				}
				break;

			case 'SVC': // Service Line
				if (currentServiceLine && currentClaim) {
					currentClaim.serviceLines = currentClaim.serviceLines || [];
					currentClaim.serviceLines.push(currentServiceLine as IRemittanceServiceLine);
				}
				const procedureInfo = (segment.elements[0] || '').split(':');
				currentServiceLine = {
					procedureCode: procedureInfo[1] || '',
					modifiers: procedureInfo.slice(2).filter(m => m),
					chargedAmount: parseFloat(segment.elements[1] || '0'),
					paidAmount: parseFloat(segment.elements[2] || '0'),
					quantity: parseFloat(segment.elements[4] || '1'),
					serviceDate: '',
					adjustments: [],
					remarks: [],
				};
				inServiceLoop = true;
				break;

			case 'DTM': // Service Date
				if (currentServiceLine && segment.elements[0] === '472') {
					currentServiceLine.serviceDate = formatEdiDate(segment.elements[1] || '');
				} else if (currentClaim && segment.elements[0] === '472') {
					currentClaim.serviceDate = formatEdiDate(segment.elements[1] || '');
				}
				break;

			case 'LQ': // Remark Code
				const remarkCode = segment.elements[1] || '';
				if (inServiceLoop && currentServiceLine) {
					currentServiceLine.remarks = currentServiceLine.remarks || [];
					currentServiceLine.remarks.push(remarkCode);
				} else if (inClaimLoop && currentClaim) {
					currentClaim.remarks = currentClaim.remarks || [];
					currentClaim.remarks.push(remarkCode);
				}
				break;

			case 'PLB': // Provider Level Adjustment
				response.providerAdjustments = response.providerAdjustments || [];
				response.providerAdjustments.push({
					fiscalPeriodDate: formatEdiDate(segment.elements[1] || ''),
					adjustmentIdentifier: segment.elements[2] || '',
					referenceIdentifier: segment.elements[3] || '',
					adjustmentAmount: parseFloat(segment.elements[4] || '0'),
				});
				break;
		}
	}

	// Push last claim
	if (currentClaim) {
		if (currentServiceLine) {
			currentClaim.serviceLines = currentClaim.serviceLines || [];
			currentClaim.serviceLines.push(currentServiceLine as IRemittanceServiceLine);
		}
		response.claims.push(currentClaim as IRemittanceClaim);
	}

	return response;
}

/**
 * Parse 997/999 Acknowledgment
 */
export function parseAcknowledgment(ediContent: string): IEdiAcknowledgment {
	const interchange = parseEdiInterchange(ediContent);
	const transaction = interchange.functionalGroups[0]?.transactions[0];

	if (!transaction || (transaction.type !== '997' && transaction.type !== '999')) {
		throw new Error('Invalid EDI: Expected 997 or 999 transaction');
	}

	const ack: IEdiAcknowledgment = {
		type: transaction.type as '997' | '999',
		controlNumber: transaction.controlNumber,
		functionalGroupControlNumber: '',
		acknowledgmentCode: '',
		acceptedTransactions: 0,
		rejectedTransactions: 0,
		errors: [],
	};

	for (const segment of transaction.segments) {
		switch (segment.id) {
			case 'AK1': // Functional Group Response Header
				ack.functionalGroupControlNumber = segment.elements[1] || '';
				break;

			case 'AK9': // Functional Group Response Trailer (997)
				ack.acknowledgmentCode = segment.elements[0] || '';
				ack.acceptedTransactions = parseInt(segment.elements[2] || '0', 10);
				ack.rejectedTransactions =
					parseInt(segment.elements[1] || '0', 10) - parseInt(segment.elements[2] || '0', 10);
				break;

			case 'IK5': // Transaction Set Response Trailer (999)
				ack.acknowledgmentCode = segment.elements[0] || '';
				break;

			case 'AK5': // Transaction Set Response Trailer (997)
				// Already captured in AK9
				break;

			case 'IK4': // Implementation Data Element Note (999)
			case 'AK4': // Data Element Note (997)
				ack.errors = ack.errors || [];
				ack.errors.push({
					elementPosition: parseInt(segment.elements[0] || '0', 10),
					errorCode: segment.elements[2] || '',
					errorDescription: getAckErrorDescription(segment.elements[2] || ''),
				});
				break;
		}
	}

	return ack;
}

/**
 * Generate 270 Eligibility Request
 */
export function generate270Request(data: {
	senderId: string;
	receiverId: string;
	submitterId: string;
	provider: {
		npi: string;
		name: string;
		taxId?: string;
	};
	subscriber: {
		memberId: string;
		firstName: string;
		lastName: string;
		dateOfBirth: string;
		gender?: string;
	};
	payer: {
		payerId: string;
		name?: string;
	};
	serviceTypes?: string[];
	serviceDate?: string;
}): string {
	const controlNumber = generateControlNumber();
	const today = new Date();
	const dateStr = formatDateForEdi(today);
	const timeStr = formatTimeForEdi(today);

	const segments: string[] = [];

	// ISA - Interchange Control Header
	segments.push(
		`ISA*00*          *00*          *ZZ*${padRight(data.senderId, 15)}*ZZ*${padRight(data.receiverId, 15)}*${dateStr.slice(2)}*${timeStr}*^*00501*${padLeft(controlNumber, 9, '0')}*0*P*:~`
	);

	// GS - Functional Group Header
	segments.push(`GS*HS*${data.submitterId}*${data.payer.payerId}*${dateStr}*${timeStr}*${controlNumber}*X*005010X279A1~`);

	// ST - Transaction Set Header
	segments.push(`ST*270*${padLeft(controlNumber, 4, '0')}*005010X279A1~`);

	// BHT - Beginning of Hierarchical Transaction
	segments.push(`BHT*0022*13*${controlNumber}*${dateStr}*${timeStr}~`);

	// HL - Information Source (Payer)
	segments.push(`HL*1**20*1~`);
	segments.push(`NM1*PR*2*${data.payer.name || 'PAYER'}*****PI*${data.payer.payerId}~`);

	// HL - Information Receiver (Provider)
	segments.push(`HL*2*1*21*1~`);
	segments.push(`NM1*1P*${data.provider.name.includes(' ') ? '1' : '2'}*${data.provider.name}*****XX*${data.provider.npi}~`);
	if (data.provider.taxId) {
		segments.push(`REF*EI*${data.provider.taxId}~`);
	}

	// HL - Subscriber
	segments.push(`HL*3*2*22*0~`);
	segments.push(`TRN*1*${controlNumber}*${data.submitterId}~`);
	segments.push(`NM1*IL*1*${data.subscriber.lastName}*${data.subscriber.firstName}****MI*${data.subscriber.memberId}~`);
	if (data.subscriber.dateOfBirth || data.subscriber.gender) {
		segments.push(
			`DMG*D8*${data.subscriber.dateOfBirth?.replace(/-/g, '') || ''}*${data.subscriber.gender || ''}~`
		);
	}

	// DTP - Service Date
	const svcDate = data.serviceDate?.replace(/-/g, '') || dateStr;
	segments.push(`DTP*291*D8*${svcDate}~`);

	// EQ - Eligibility Inquiry
	const serviceTypes = data.serviceTypes || ['30']; // Default to health benefit plan coverage
	for (const svcType of serviceTypes) {
		segments.push(`EQ*${svcType}~`);
	}

	// SE - Transaction Set Trailer
	const segmentCount = segments.length - 2 + 1; // Exclude ISA, GS, add SE
	segments.push(`SE*${segmentCount}*${padLeft(controlNumber, 4, '0')}~`);

	// GE - Functional Group Trailer
	segments.push(`GE*1*${controlNumber}~`);

	// IEA - Interchange Control Trailer
	segments.push(`IEA*1*${padLeft(controlNumber, 9, '0')}~`);

	return segments.join('\n');
}

/**
 * Generate 276 Claim Status Request
 */
export function generate276Request(data: {
	senderId: string;
	receiverId: string;
	submitterId: string;
	provider: {
		npi: string;
		name: string;
		taxId?: string;
	};
	subscriber: {
		memberId: string;
		firstName: string;
		lastName: string;
		dateOfBirth?: string;
	};
	payer: {
		payerId: string;
		name?: string;
	};
	claim: {
		patientControlNumber?: string;
		payerClaimNumber?: string;
		serviceDate?: string;
		chargeAmount?: number;
	};
}): string {
	const controlNumber = generateControlNumber();
	const today = new Date();
	const dateStr = formatDateForEdi(today);
	const timeStr = formatTimeForEdi(today);

	const segments: string[] = [];

	// ISA
	segments.push(
		`ISA*00*          *00*          *ZZ*${padRight(data.senderId, 15)}*ZZ*${padRight(data.receiverId, 15)}*${dateStr.slice(2)}*${timeStr}*^*00501*${padLeft(controlNumber, 9, '0')}*0*P*:~`
	);

	// GS
	segments.push(`GS*HR*${data.submitterId}*${data.payer.payerId}*${dateStr}*${timeStr}*${controlNumber}*X*005010X212~`);

	// ST
	segments.push(`ST*276*${padLeft(controlNumber, 4, '0')}*005010X212~`);

	// BHT
	segments.push(`BHT*0010*13*${controlNumber}*${dateStr}*${timeStr}~`);

	// HL - Payer
	segments.push(`HL*1**20*1~`);
	segments.push(`NM1*PR*2*${data.payer.name || 'PAYER'}*****PI*${data.payer.payerId}~`);

	// HL - Provider
	segments.push(`HL*2*1*21*1~`);
	segments.push(`NM1*1P*2*${data.provider.name}*****XX*${data.provider.npi}~`);
	if (data.provider.taxId) {
		segments.push(`REF*EI*${data.provider.taxId}~`);
	}

	// HL - Subscriber
	segments.push(`HL*3*2*22*0~`);
	segments.push(`NM1*IL*1*${data.subscriber.lastName}*${data.subscriber.firstName}****MI*${data.subscriber.memberId}~`);
	if (data.subscriber.dateOfBirth) {
		segments.push(`DMG*D8*${data.subscriber.dateOfBirth.replace(/-/g, '')}~`);
	}

	// TRN - Trace
	segments.push(`TRN*1*${controlNumber}*${data.submitterId}~`);

	// Claim Reference
	if (data.claim.patientControlNumber) {
		segments.push(`REF*EJ*${data.claim.patientControlNumber}~`);
	}
	if (data.claim.payerClaimNumber) {
		segments.push(`REF*1K*${data.claim.payerClaimNumber}~`);
	}

	// Service Date
	if (data.claim.serviceDate) {
		segments.push(`DTP*472*D8*${data.claim.serviceDate.replace(/-/g, '')}~`);
	}

	// Charge Amount
	if (data.claim.chargeAmount) {
		segments.push(`AMT*T3*${data.claim.chargeAmount.toFixed(2)}~`);
	}

	// SE
	const segmentCount = segments.length - 2 + 1;
	segments.push(`SE*${segmentCount}*${padLeft(controlNumber, 4, '0')}~`);

	// GE
	segments.push(`GE*1*${controlNumber}~`);

	// IEA
	segments.push(`IEA*1*${padLeft(controlNumber, 9, '0')}~`);

	return segments.join('\n');
}

/**
 * Validate EDI format
 */
export function validateEdiFormat(ediContent: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check for ISA segment
	if (!ediContent.includes('ISA')) {
		errors.push('Missing ISA (Interchange Control Header) segment');
	}

	// Check for IEA segment
	if (!ediContent.includes('IEA')) {
		errors.push('Missing IEA (Interchange Control Trailer) segment');
	}

	// Check for GS segment
	if (!ediContent.includes('GS')) {
		errors.push('Missing GS (Functional Group Header) segment');
	}

	// Check for GE segment
	if (!ediContent.includes('GE')) {
		errors.push('Missing GE (Functional Group Trailer) segment');
	}

	// Check for ST segment
	if (!ediContent.includes('ST')) {
		errors.push('Missing ST (Transaction Set Header) segment');
	}

	// Check for SE segment
	if (!ediContent.includes('SE')) {
		errors.push('Missing SE (Transaction Set Trailer) segment');
	}

	// Check ISA length (should be 106 characters including terminator)
	const isaMatch = ediContent.match(/ISA.{103}/);
	if (isaMatch) {
		const isaLength = isaMatch[0].length;
		if (isaLength !== 106) {
			errors.push(`ISA segment length should be 106 characters, found ${isaLength}`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

// Helper functions

function generateControlNumber(): string {
	return Math.floor(Math.random() * 999999999)
		.toString()
		.padStart(9, '0');
}

function formatDateForEdi(date: Date): string {
	return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function formatTimeForEdi(date: Date): string {
	return date.toISOString().slice(11, 16).replace(/:/g, '');
}

function formatEdiDate(ediDate: string): string {
	if (!ediDate || ediDate.length < 8) return ediDate;
	return `${ediDate.slice(0, 4)}-${ediDate.slice(4, 6)}-${ediDate.slice(6, 8)}`;
}

function padRight(str: string, length: number, char: string = ' '): string {
	return str.padEnd(length, char).slice(0, length);
}

function padLeft(str: string, length: number, char: string = '0'): string {
	return str.padStart(length, char).slice(-length);
}

function getServiceTypeDescription(code: string): string {
	const serviceTypes: Record<string, string> = {
		'1': 'Medical Care',
		'2': 'Surgical',
		'3': 'Consultation',
		'4': 'Diagnostic X-Ray',
		'5': 'Diagnostic Lab',
		'6': 'Radiation Therapy',
		'7': 'Anesthesia',
		'8': 'Surgical Assistance',
		'12': 'Durable Medical Equipment Purchase',
		'14': 'Renal Supplies in the Home',
		'18': 'Durable Medical Equipment Rental',
		'30': 'Health Benefit Plan Coverage',
		'33': 'Chiropractic',
		'35': 'Dental Care',
		'36': 'Dental Crowns',
		'37': 'Dental Accident',
		'38': 'Orthodontics',
		'39': 'Prosthodontics',
		'40': 'Oral Surgery',
		'41': 'Routine Preventive Dental',
		'42': 'Home Health Care',
		'47': 'Hospital',
		'48': 'Hospital Inpatient',
		'50': 'Hospital Outpatient',
		'51': 'Hospital Emergency Accident',
		'52': 'Hospital Emergency Medical',
		'53': 'Hospital Ambulatory Surgical',
		'54': 'Long Term Care',
		'55': 'Major Medical',
		'56': 'Medically Related Transportation',
		'57': 'Air Transportation',
		'58': 'Cabulance',
		'59': 'Licensed Ambulance',
		'60': 'General Benefits',
		'61': 'In-vitro Fertilization',
		'62': 'MRI/CAT Scan',
		'63': 'Donor Procedures',
		'64': 'Acupuncture',
		'65': 'Newborn Care',
		'66': 'Pathology',
		'67': 'Smoking Cessation',
		'68': 'Well Baby Care',
		'69': 'Maternity',
		'70': 'Transplants',
		'72': 'Psychiatric',
		'73': 'Psychotherapy',
		'74': 'Psychiatric Room and Board',
		'75': 'Psychiatric Inpatient',
		'76': 'Psychotherapy Inpatient',
		'77': 'Psychiatric Outpatient',
		'78': 'Psychotherapy Outpatient',
		'79': 'Psychiatric Partial Hospitalization',
		'80': 'Psychotherapy Partial Hospitalization',
		'81': 'Substance Abuse',
		'82': 'Alcoholism',
		'83': 'Skilled Nursing Care',
		'84': 'Skilled Nursing Care Room and Board',
		'86': 'Emergency Services',
		'88': 'Pharmacy',
		'89': 'Free Standing Prescription Drug',
		'90': 'Mail Order Prescription Drug',
		'91': 'Brand Name Prescription Drug',
		'92': 'Generic Prescription Drug',
		'93': 'Podiatry',
		'94': 'Podiatry Nursing Home Visits',
		'95': 'Podiatry Office Visits',
		'96': 'Professional (Physician)',
		'98': 'Professional (Physician) Visit Office',
		'99': 'Professional (Physician) Visit Inpatient',
		'A4': 'Psychiatric',
		'A6': 'Psychotherapy',
		'A7': 'Psychiatric Inpatient',
		'A8': 'Psychiatric Outpatient',
		'AG': 'Skilled Nursing Care',
		'AL': 'Vision (Optometry)',
		'MH': 'Mental Health',
		'UC': 'Urgent Care',
	};
	return serviceTypes[code] || `Service Type ${code}`;
}

function getBenefitTypeDescription(code: string): string {
	const benefitTypes: Record<string, string> = {
		'1': 'Active Coverage',
		'2': 'Active - Full Risk Capitation',
		'3': 'Active - Services Capitated',
		'4': 'Active - Services Capitated to Primary Care Physician',
		'5': 'Active - Pending Investigation',
		'6': 'Inactive',
		'7': 'Inactive - Pending Eligibility Update',
		'8': 'Inactive - Pending Investigation',
		'A': 'Co-Insurance',
		'B': 'Co-Payment',
		'C': 'Deductible',
		'CB': 'Coverage Basis',
		'D': 'Benefit Description',
		'E': 'Exclusions',
		'F': 'Limitations',
		'G': 'Out of Pocket (Stop Loss)',
		'H': 'Unlimited',
		'I': 'Non-Covered',
		'J': 'Cost Containment',
		'K': 'Reserve',
		'L': 'Primary Care Provider',
		'M': 'Pre-existing Condition',
		'MC': 'Managed Care Coordinator',
		'N': 'Services Restricted to Following Provider',
		'O': 'Not Deemed a Medical Necessity',
		'P': 'Benefit Disclaimer',
		'Q': 'Second Surgical Opinion Required',
		'R': 'Other or Additional Payor',
		'S': 'Prior Year(s) History',
		'T': 'Card(s) Reported Lost/Stolen',
		'U': 'Contact Following Entity for Eligibility or Benefit Information',
		'V': 'Cannot Process',
		'W': 'Other Source of Data',
		'X': 'Health Care Facility',
		'Y': 'Spend Down',
	};
	return benefitTypes[code] || `Benefit Type ${code}`;
}

function getTimePeriodDescription(code: string): string {
	const timePeriods: Record<string, string> = {
		'6': 'Hour',
		'7': 'Day',
		'13': 'Service Year',
		'21': 'Years',
		'22': 'Service Year',
		'23': 'Calendar Year',
		'24': 'Year to Date',
		'25': 'Contract',
		'26': 'Episode',
		'27': 'Visit',
		'28': 'Outlier',
		'29': 'Remaining',
		'30': 'Exceeded',
		'31': 'Not Exceeded',
		'32': 'Lifetime',
		'33': 'Lifetime Remaining',
		'34': 'Month',
		'35': 'Week',
	};
	return timePeriods[code] || `Time Period ${code}`;
}

function getClaimStatusDescription(categoryCode: string, statusCode: string): string {
	const categories: Record<string, string> = {
		A0: 'Acknowledgment/Receipt',
		A1: 'Acknowledgment/Acceptance into adjudication system',
		A2: 'Acknowledgment/Acceptance into adjudication system-Duplicate',
		A3: 'Acknowledgment/Return',
		A4: 'Acknowledgment/Not Found',
		A5: 'Acknowledgment/Split Claim',
		A6: 'Acknowledgment/Rejected for Missing Information',
		A7: 'Acknowledgment/Rejected for Invalid Information',
		P0: 'Pending: Adjudication/Details',
		P1: 'Pending/In Process',
		P2: 'Pending/Payer Review',
		P3: 'Pending/Provider Requested Information',
		P4: 'Pending/Patient Requested Information',
		P5: 'Pending/Payer Administrative/System Hold',
		F0: 'Finalized',
		F1: 'Finalized/Payment',
		F2: 'Finalized/Denial',
		F3: 'Finalized/Revised',
		F4: 'Finalized/Forwarded',
		R0: 'Requests for additional Information/General',
		R1: 'Requests for additional Information/Entity',
		R3: 'Requests for additional Information/Claim/Line',
		R4: 'Requests for additional Information/Documentation',
		R5: 'Request for additional information/more specific detail',
		E0: 'Response not possible',
		E1: 'Response not possible/Entity not found',
		E2: 'Response not possible/Claim not found',
		E3: 'Response not possible/Claim data not available',
		E4: 'Response not possible/Entity not available',
	};
	return categories[categoryCode] || `Status ${categoryCode}-${statusCode}`;
}

function getClaimPaymentStatus(code: string): string {
	const statuses: Record<string, string> = {
		'1': 'Processed as Primary',
		'2': 'Processed as Secondary',
		'3': 'Processed as Tertiary',
		'4': 'Denied',
		'19': 'Processed as Primary, Forwarded to Additional Payer(s)',
		'20': 'Processed as Secondary, Forwarded to Additional Payer(s)',
		'21': 'Processed as Tertiary, Forwarded to Additional Payer(s)',
		'22': 'Reversal of Previous Payment',
		'23': 'Not Our Claim, Forwarded to Additional Payer(s)',
		'25': 'Predetermination Pricing Only - No Payment',
	};
	return statuses[code] || `Payment Status ${code}`;
}

function getPaymentMethodDescription(code: string): string {
	const methods: Record<string, string> = {
		C: 'Payment Accompanies Remittance Advice',
		D: 'Make Payment Only',
		H: 'Notification Only',
		I: 'Remittance Information Only',
		P: 'Prenotification of Future Transfers',
		U: 'Split Payment and Remittance',
		X: 'Handling Party\'s Option to Split Payment and Remittance',
	};
	return methods[code] || `Payment Method ${code}`;
}

function getAAAErrorDescription(code: string): string {
	const errors: Record<string, string> = {
		'04': 'Authorized Quantity Exceeded',
		'15': 'Required application data missing',
		'33': 'Input Errors',
		'35': 'Out of Network',
		'41': 'Authorization/Access Restrictions',
		'42': 'Unable to Respond at Current Time',
		'43': 'Invalid/Missing Provider Identification',
		'44': 'Invalid/Missing Provider Name',
		'45': 'Invalid/Missing Provider Specialty',
		'46': 'Invalid/Missing Provider Phone Number',
		'47': 'Invalid/Missing Provider State',
		'48': 'Invalid/Missing Referring Provider Identification Number',
		'49': 'Provider is Not Primary Care Physician',
		'50': 'Provider Ineligible for Inquiries',
		'51': 'Provider Not on File',
		'52': 'Service Dates Not Within Provider Plan Enrollment',
		'53': 'Inquired Benefit Inconsistent with Provider Type',
		'54': 'Inappropriate Product/Service ID Qualifier',
		'55': 'Inappropriate Product/Service ID',
		'56': 'Inappropriate Date',
		'57': 'Invalid/Missing Date(s) of Service',
		'58': 'Invalid/Missing Date-of-Birth',
		'60': 'Date of Birth Follows Date(s) of Service',
		'61': 'Date of Death Precedes Date(s) of Service',
		'62': 'Date of Service Not Within Allowable Inquiry Period',
		'63': 'Date of Service in Future',
		'64': 'Invalid/Missing Patient ID',
		'65': 'Invalid/Missing Patient Name',
		'66': 'Invalid/Missing Patient Gender Code',
		'67': 'Patient Not Found',
		'68': 'Duplicate Patient ID Number',
		'69': 'Inconsistent with Patient\'s Age',
		'70': 'Inconsistent with Patient\'s Gender',
		'71': 'Patient Birth Date Does Not Match That for the Patient on the Database',
		'72': 'Invalid/Missing Subscriber/Insured ID',
		'73': 'Invalid/Missing Subscriber/Insured Name',
		'74': 'Invalid/Missing Subscriber/Insured Gender Code',
		'75': 'Subscriber/Insured Not Found',
		'76': 'Duplicate Subscriber/Insured ID Number',
		'77': 'Subscriber Found, Patient Not Found',
		'78': 'Subscriber/Insured Not in Group/Plan Identified',
		'79': 'Invalid Participant Identification',
		'80': 'No Response received - Transaction Terminated',
		'97': 'Invalid or Missing Provider Address',
		'98': 'Experimental Service or Procedure',
	};
	return errors[code] || `Error ${code}`;
}

function getAckErrorDescription(code: string): string {
	const errors: Record<string, string> = {
		'1': 'Unrecognized segment ID',
		'2': 'Unexpected segment',
		'3': 'Mandatory segment missing',
		'4': 'Loop occurs over maximum times',
		'5': 'Segment exceeds maximum use',
		'6': 'Segment not in defined transaction set',
		'7': 'Segment not in proper sequence',
		'8': 'Segment has data element errors',
		I4: 'Implementation "Not Used" data element present',
		I5: 'Conditional Required Data Element Missing',
		I6: 'Exclusion Condition Violated',
		I7: 'Code Value Not Used in Implementation',
		I8: 'Code Value Used in Implementation',
	};
	return errors[code] || `Acknowledgment Error ${code}`;
}

export default {
	parseEdiInterchange,
	parse271Response,
	parse277Response,
	parse835Response,
	parseAcknowledgment,
	generate270Request,
	generate276Request,
	validateEdiFormat,
};
