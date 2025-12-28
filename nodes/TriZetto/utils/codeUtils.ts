/**
 * TriZetto Code Utilities - Healthcare Code Lookups and Descriptions
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import {
	CLAIM_ADJUSTMENT_REASON_CODES,
	REMITTANCE_ADVICE_REMARK_CODES,
	CLAIM_ADJUSTMENT_GROUPS,
} from '../constants/adjustmentCodes';
import {
	CLAIM_STATUS_CATEGORIES,
	ELIGIBILITY_STATUS_CODES,
	SERVICE_TYPE_CODES,
	ACKNOWLEDGMENT_STATUS_CODES,
	PRIOR_AUTH_STATUS_CODES,
} from '../constants/statusCodes';
import {
	PLACE_OF_SERVICE_CODES,
	TYPE_OF_BILL_CODES,
	REVENUE_CODES,
	TAXONOMY_CODES,
	MODIFIER_CODES,
} from '../constants/transactionTypes';

/**
 * Get description for Claim Adjustment Reason Code (CARC)
 */
export function getCarcDescription(code: string): string | null {
	return CLAIM_ADJUSTMENT_REASON_CODES[code] || null;
}

/**
 * Get description for Remittance Advice Remark Code (RARC)
 */
export function getRarcDescription(code: string): string | null {
	return REMITTANCE_ADVICE_REMARK_CODES[code] || null;
}

/**
 * Get description for Claim Adjustment Group Code
 */
export function getAdjustmentGroupDescription(code: string): string | null {
	return CLAIM_ADJUSTMENT_GROUPS[code] || null;
}

/**
 * Get description for Claim Status Category Code
 */
export function getClaimStatusDescription(categoryCode: string): string | null {
	return CLAIM_STATUS_CATEGORIES[categoryCode] || null;
}

/**
 * Get description for Eligibility Status Code
 */
export function getEligibilityStatusDescription(code: string): string | null {
	return ELIGIBILITY_STATUS_CODES[code] || null;
}

/**
 * Get description for Service Type Code
 */
export function getServiceTypeDescription(code: string): string | null {
	return SERVICE_TYPE_CODES[code] || null;
}

/**
 * Get description for Acknowledgment Status Code (997/999/TA1)
 */
export function getAcknowledgmentStatusDescription(code: string): string | null {
	return ACKNOWLEDGMENT_STATUS_CODES[code] || null;
}

/**
 * Get description for Prior Authorization Status Code
 */
export function getPriorAuthStatusDescription(code: string): string | null {
	return PRIOR_AUTH_STATUS_CODES[code] || null;
}

/**
 * Get description for Place of Service Code
 */
export function getPlaceOfServiceDescription(code: string): string | null {
	const normalized = code.padStart(2, '0');
	return PLACE_OF_SERVICE_CODES[normalized] || null;
}

/**
 * Get description for Type of Bill Code
 */
export function getTypeOfBillDescription(code: string): string | null {
	return TYPE_OF_BILL_CODES[code] || null;
}

/**
 * Get description for Revenue Code
 */
export function getRevenueCodeDescription(code: string): string | null {
	const normalized = code.padStart(4, '0');
	return REVENUE_CODES[normalized] || null;
}

/**
 * Get description for Taxonomy Code (Provider Specialty)
 */
export function getTaxonomyDescription(code: string): string | null {
	return TAXONOMY_CODES[code] || null;
}

/**
 * Get description for Modifier Code
 */
export function getModifierDescription(code: string): string | null {
	return MODIFIER_CODES[code.toUpperCase()] || null;
}

/**
 * Search codes by description keyword
 */
export function searchCodesByDescription(
	codeType: 'carc' | 'rarc' | 'serviceType' | 'pos' | 'tob' | 'revenue' | 'taxonomy' | 'modifier',
	keyword: string
): Array<{ code: string; description: string }> {
	const codeMaps: Record<string, Record<string, string>> = {
		carc: CLAIM_ADJUSTMENT_REASON_CODES,
		rarc: REMITTANCE_ADVICE_REMARK_CODES,
		serviceType: SERVICE_TYPE_CODES,
		pos: PLACE_OF_SERVICE_CODES,
		tob: TYPE_OF_BILL_CODES,
		revenue: REVENUE_CODES,
		taxonomy: TAXONOMY_CODES,
		modifier: MODIFIER_CODES,
	};

	const codeMap = codeMaps[codeType];
	if (!codeMap) {
		return [];
	}

	const searchTerm = keyword.toLowerCase();
	const results: Array<{ code: string; description: string }> = [];

	for (const [code, description] of Object.entries(codeMap)) {
		if (description.toLowerCase().includes(searchTerm)) {
			results.push({ code, description });
		}
	}

	return results;
}

/**
 * Get all codes of a specific type
 */
export function getAllCodes(
	codeType: 'carc' | 'rarc' | 'adjustmentGroup' | 'claimStatus' | 'eligibilityStatus' | 'serviceType' | 'ackStatus' | 'priorAuthStatus' | 'pos' | 'tob' | 'revenue' | 'taxonomy' | 'modifier'
): Array<{ code: string; description: string }> {
	const codeMaps: Record<string, Record<string, string>> = {
		carc: CLAIM_ADJUSTMENT_REASON_CODES,
		rarc: REMITTANCE_ADVICE_REMARK_CODES,
		adjustmentGroup: CLAIM_ADJUSTMENT_GROUPS,
		claimStatus: CLAIM_STATUS_CATEGORIES,
		eligibilityStatus: ELIGIBILITY_STATUS_CODES,
		serviceType: SERVICE_TYPE_CODES,
		ackStatus: ACKNOWLEDGMENT_STATUS_CODES,
		priorAuthStatus: PRIOR_AUTH_STATUS_CODES,
		pos: PLACE_OF_SERVICE_CODES,
		tob: TYPE_OF_BILL_CODES,
		revenue: REVENUE_CODES,
		taxonomy: TAXONOMY_CODES,
		modifier: MODIFIER_CODES,
	};

	const codeMap = codeMaps[codeType];
	if (!codeMap) {
		return [];
	}

	return Object.entries(codeMap).map(([code, description]) => ({
		code,
		description,
	}));
}

/**
 * Parse adjustment with code descriptions
 */
export interface IParsedAdjustment {
	groupCode: string;
	groupDescription: string;
	reasonCode: string;
	reasonDescription: string;
	amount: number;
	quantity?: number;
}

export function parseAdjustment(
	groupCode: string,
	reasonCode: string,
	amount: number,
	quantity?: number
): IParsedAdjustment {
	return {
		groupCode,
		groupDescription: getAdjustmentGroupDescription(groupCode) || 'Unknown Group',
		reasonCode,
		reasonDescription: getCarcDescription(reasonCode) || 'Unknown Reason',
		amount,
		quantity,
	};
}

/**
 * Parse multiple adjustments from CAS segment
 */
export function parseAdjustmentsFromCas(casElements: string[]): IParsedAdjustment[] {
	const adjustments: IParsedAdjustment[] = [];

	if (casElements.length < 2) {
		return adjustments;
	}

	const groupCode = casElements[0];

	// CAS segments have triplets of: reason code, amount, quantity
	for (let i = 1; i < casElements.length; i += 3) {
		const reasonCode = casElements[i];
		const amount = parseFloat(casElements[i + 1] || '0');
		const quantity = casElements[i + 2] ? parseFloat(casElements[i + 2]) : undefined;

		if (reasonCode) {
			adjustments.push(parseAdjustment(groupCode, reasonCode, amount, quantity));
		}
	}

	return adjustments;
}

/**
 * Get common denial reason descriptions
 */
export function getCommonDenialReasons(): Array<{ code: string; description: string; actionRequired: string }> {
	return [
		{
			code: '1',
			description: 'Deductible Amount',
			actionRequired: 'Bill patient for deductible amount',
		},
		{
			code: '2',
			description: 'Coinsurance Amount',
			actionRequired: 'Bill patient for coinsurance portion',
		},
		{
			code: '3',
			description: 'Co-payment Amount',
			actionRequired: 'Bill patient for copay amount',
		},
		{
			code: '4',
			description: 'Procedure not covered',
			actionRequired: 'Review coverage or appeal if appropriate',
		},
		{
			code: '5',
			description: 'Service not covered by plan',
			actionRequired: 'Verify patient benefits or bill patient',
		},
		{
			code: '16',
			description: 'Claim lacks information',
			actionRequired: 'Resubmit with complete information',
		},
		{
			code: '18',
			description: 'Duplicate claim/service',
			actionRequired: 'Verify if duplicate or appeal',
		},
		{
			code: '22',
			description: 'Coordination of Benefits',
			actionRequired: 'Bill primary payer first',
		},
		{
			code: '23',
			description: 'Payment included in another service',
			actionRequired: 'Review bundling rules',
		},
		{
			code: '29',
			description: 'Filing deadline passed',
			actionRequired: 'Document timely filing or appeal',
		},
		{
			code: '45',
			description: 'Charge exceeds fee schedule',
			actionRequired: 'Write off difference per contract',
		},
		{
			code: '50',
			description: 'Non-covered service',
			actionRequired: 'Bill patient or verify ABN',
		},
		{
			code: '96',
			description: 'Non-covered charge',
			actionRequired: 'Review coverage and potentially bill patient',
		},
		{
			code: '97',
			description: 'Service bundled',
			actionRequired: 'Review unbundling possibilities',
		},
		{
			code: '109',
			description: 'Claim not covered by payer',
			actionRequired: 'Verify correct payer was billed',
		},
		{
			code: '197',
			description: 'Prior authorization required',
			actionRequired: 'Obtain authorization and resubmit',
		},
	];
}

/**
 * Categorize CARC codes by denial type
 */
export function categorizeCarc(
	code: string
): 'patient_responsibility' | 'contractual' | 'medical_necessity' | 'authorization' | 'timely_filing' | 'coding' | 'other' {
	const patientResponsibilityCodes = ['1', '2', '3', '45', '253'];
	const contractualCodes = ['4', '5', '23', '24', '45', '50', '96', '97'];
	const medicalNecessityCodes = ['50', '55', '56', '57', '58', '59', '150', '151'];
	const authorizationCodes = ['15', '27', '197', '198', '199'];
	const timelyFilingCodes = ['29', '105', '106', '107', '108'];
	const codingCodes = ['4', '9', '11', '12', '13', '16', '17', '18', '19', '22'];

	if (patientResponsibilityCodes.includes(code)) return 'patient_responsibility';
	if (contractualCodes.includes(code)) return 'contractual';
	if (medicalNecessityCodes.includes(code)) return 'medical_necessity';
	if (authorizationCodes.includes(code)) return 'authorization';
	if (timelyFilingCodes.includes(code)) return 'timely_filing';
	if (codingCodes.includes(code)) return 'coding';
	return 'other';
}

/**
 * Get Place of Service code for common settings
 */
export function getPosCodeByName(name: string): string | null {
	const posNames: Record<string, string> = {
		office: '11',
		home: '12',
		assisted_living: '13',
		group_home: '14',
		mobile_unit: '15',
		temporary_lodging: '16',
		walk_in_retail: '17',
		school: '03',
		homeless_shelter: '04',
		indian_health_service: '05',
		telehealth_patient_home: '10',
		telehealth: '02',
		inpatient_hospital: '21',
		outpatient_hospital: '22',
		emergency_room: '23',
		ambulatory_surgical_center: '24',
		birthing_center: '25',
		military_treatment_facility: '26',
		skilled_nursing_facility: '31',
		nursing_facility: '32',
		custodial_care_facility: '33',
		hospice: '34',
		ambulance_land: '41',
		ambulance_air_water: '42',
		independent_clinic: '49',
		federally_qualified_health_center: '50',
		inpatient_psych: '51',
		psych_partial_hospitalization: '52',
		community_mental_health: '53',
		intermediate_care_facility: '54',
		residential_substance_abuse: '55',
		psychiatric_residential: '56',
		mass_immunization: '60',
		comprehensive_inpatient_rehab: '61',
		comprehensive_outpatient_rehab: '62',
		end_stage_renal_disease: '65',
		public_health_clinic: '71',
		rural_health_clinic: '72',
		independent_lab: '81',
		other: '99',
	};

	const normalized = name.toLowerCase().replace(/[\s-]/g, '_');
	return posNames[normalized] || null;
}

/**
 * Get Type of Bill components
 */
export interface ITypeOfBillComponents {
	facilityType: string;
	facilityTypeDescription: string;
	billClassification: string;
	billClassificationDescription: string;
	frequency: string;
	frequencyDescription: string;
}

export function parseTypeOfBill(tob: string): ITypeOfBillComponents | null {
	if (tob.length !== 4) {
		return null;
	}

	const facilityTypes: Record<string, string> = {
		'1': 'Hospital',
		'2': 'Skilled Nursing Facility',
		'3': 'Home Health',
		'4': 'Religious Non-Medical Health Care Institution',
		'5': 'Religious Non-Medical Health Care Institution',
		'6': 'Intermediate Care',
		'7': 'Clinic',
		'8': 'Special Facility',
	};

	const billClassifications: Record<string, Record<string, string>> = {
		'1': {
			'1': 'Inpatient (Including Medicare Part A)',
			'2': 'Inpatient (Medicare Part B Only)',
			'3': 'Outpatient',
			'4': 'Other (Medicare Part B)',
			'5': 'Intermediate Care - Level I',
			'6': 'Intermediate Care - Level II',
			'7': 'Subacute Inpatient',
			'8': 'Swing Bed',
		},
		'2': {
			'1': 'Inpatient (Including Medicare Part A)',
			'2': 'Inpatient (Medicare Part B Only)',
			'3': 'Outpatient',
			'4': 'Other (Medicare Part B)',
			'5': 'Level I',
			'6': 'Level II',
			'7': 'Subacute Inpatient',
			'8': 'Swing Bed',
		},
	};

	const frequencies: Record<string, string> = {
		'0': 'Non-Payment/Zero Claim',
		'1': 'Admit Through Discharge Claim',
		'2': 'Interim - First Claim',
		'3': 'Interim - Continuing Claims',
		'4': 'Interim - Last Claim',
		'5': 'Late Charge Only',
		'6': 'Reserved',
		'7': 'Replacement of Prior Claim',
		'8': 'Void/Cancel Prior Claim',
		'9': 'Final Claim for a Home Health PPS Episode',
		A: 'Admission/Election Notice',
		B: 'Termination/Revocation Notice',
		C: 'Change of Provider Notice',
		D: 'Void/Cancel Admission/Election Notice',
		E: 'Void/Cancel Termination/Revocation Notice',
		F: 'Void/Cancel Change of Provider Notice',
		G: 'Common Working File (CWF) Transition Claim',
		H: 'Cancel Only to Realign Beneficiary Submit to CWF',
		I: 'Informational Claim Submitted from SNF/HH',
		J: 'Adjustment of a Hospice Notice',
		K: 'OIG Subpoena Claim',
		M: 'Medicare Hospice Reconciliation Notice',
		P: 'Report of Admission',
		Q: 'CWF Hospice Transition Claim',
	};

	const firstDigit = tob.charAt(0);
	const secondDigit = tob.charAt(1);
	const thirdDigit = tob.charAt(2);
	const fourthChar = tob.charAt(3);

	return {
		facilityType: secondDigit,
		facilityTypeDescription: facilityTypes[secondDigit] || 'Unknown Facility Type',
		billClassification: thirdDigit,
		billClassificationDescription:
			billClassifications[secondDigit]?.[thirdDigit] ||
			billClassifications['1']?.[thirdDigit] ||
			'Unknown Classification',
		frequency: fourthChar,
		frequencyDescription: frequencies[fourthChar] || 'Unknown Frequency',
	};
}

/**
 * Format code with description
 */
export function formatCodeWithDescription(
	codeType: string,
	code: string,
	separator: string = ' - '
): string {
	let description: string | null = null;

	switch (codeType.toLowerCase()) {
		case 'carc':
			description = getCarcDescription(code);
			break;
		case 'rarc':
			description = getRarcDescription(code);
			break;
		case 'pos':
			description = getPlaceOfServiceDescription(code);
			break;
		case 'tob':
			description = getTypeOfBillDescription(code);
			break;
		case 'revenue':
			description = getRevenueCodeDescription(code);
			break;
		case 'taxonomy':
			description = getTaxonomyDescription(code);
			break;
		case 'modifier':
			description = getModifierDescription(code);
			break;
		case 'servicetype':
			description = getServiceTypeDescription(code);
			break;
	}

	return description ? `${code}${separator}${description}` : code;
}

/**
 * Check if a code is valid for a given code type
 */
export function isValidCode(
	codeType: 'carc' | 'rarc' | 'pos' | 'tob' | 'revenue' | 'taxonomy' | 'modifier' | 'serviceType',
	code: string
): boolean {
	switch (codeType) {
		case 'carc':
			return getCarcDescription(code) !== null;
		case 'rarc':
			return getRarcDescription(code) !== null;
		case 'pos':
			return getPlaceOfServiceDescription(code) !== null;
		case 'tob':
			return getTypeOfBillDescription(code) !== null;
		case 'revenue':
			return getRevenueCodeDescription(code) !== null;
		case 'taxonomy':
			return getTaxonomyDescription(code) !== null;
		case 'modifier':
			return getModifierDescription(code) !== null;
		case 'serviceType':
			return getServiceTypeDescription(code) !== null;
		default:
			return false;
	}
}

export default {
	getCarcDescription,
	getRarcDescription,
	getAdjustmentGroupDescription,
	getClaimStatusDescription,
	getEligibilityStatusDescription,
	getServiceTypeDescription,
	getAcknowledgmentStatusDescription,
	getPriorAuthStatusDescription,
	getPlaceOfServiceDescription,
	getTypeOfBillDescription,
	getRevenueCodeDescription,
	getTaxonomyDescription,
	getModifierDescription,
	searchCodesByDescription,
	getAllCodes,
	parseAdjustment,
	parseAdjustmentsFromCas,
	getCommonDenialReasons,
	categorizeCarc,
	getPosCodeByName,
	parseTypeOfBill,
	formatCodeWithDescription,
	isValidCode,
};
