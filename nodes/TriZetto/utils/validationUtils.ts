/**
 * TriZetto Validation Utilities - Healthcare Input Validation
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import { IDataObject } from 'n8n-workflow';
import { calculateNpiCheckDigit } from './ediUtils';

/**
 * Validation result interface
 */
export interface IValidationResult {
	valid: boolean;
	errors: string[];
	warnings?: string[];
	sanitized?: unknown;
}

/**
 * Validate NPI (National Provider Identifier)
 */
export function validateNpi(npi: string): IValidationResult {
	const errors: string[] = [];
	const clean = npi.replace(/\D/g, '');

	if (clean.length !== 10) {
		errors.push(`NPI must be 10 digits, got ${clean.length}`);
		return { valid: false, errors };
	}

	// First digit must be 1 or 2
	if (!['1', '2'].includes(clean.charAt(0))) {
		errors.push('NPI must start with 1 or 2');
	}

	// Validate check digit using Luhn algorithm
	const npi9 = clean.substring(0, 9);
	const expectedCheckDigit = calculateNpiCheckDigit(npi9);

	if (expectedCheckDigit !== clean.charAt(9)) {
		errors.push('Invalid NPI check digit');
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate Tax ID (EIN or SSN)
 */
export function validateTaxId(taxId: string): IValidationResult {
	const errors: string[] = [];
	const clean = taxId.replace(/\D/g, '');

	if (clean.length !== 9) {
		errors.push(`Tax ID must be 9 digits, got ${clean.length}`);
		return { valid: false, errors };
	}

	// Check for invalid patterns
	if (/^0{9}$/.test(clean)) {
		errors.push('Tax ID cannot be all zeros');
	}

	// EIN first two digits must be valid campus code
	const validEinPrefixes = [
		'10', '11', '12', '13', '14', '15', '16',
		'20', '21', '22', '23', '24', '25', '26', '27',
		'30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
		'40', '41', '42', '43', '44', '45', '46', '47', '48',
		'50', '51', '52', '53', '54', '55', '56', '57', '58', '59',
		'60', '61', '62', '63', '64', '65', '66', '67', '68',
		'71', '72', '73', '74', '75', '76', '77', '78', '80', '81', '82', '83', '84', '85', '86', '87', '88',
		'90', '91', '92', '93', '94', '95', '98', '99',
	];

	const prefix = clean.substring(0, 2);
	const isLikelyEin = validEinPrefixes.includes(prefix);

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
		warnings: isLikelyEin ? [] : ['Tax ID may be SSN, not EIN'],
	};
}

/**
 * Validate ICD-10 code
 */
export function validateIcd10(code: string): IValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Clean the code
	const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

	// ICD-10-CM format: Letter + 2 digits + optional decimal + up to 4 more characters
	// Valid lengths: 3-7 characters
	if (clean.length < 3 || clean.length > 7) {
		errors.push(`ICD-10 code must be 3-7 characters, got ${clean.length}`);
		return { valid: false, errors };
	}

	// First character must be a letter (except U)
	if (!/^[A-TV-Z]/.test(clean)) {
		errors.push('ICD-10 code must start with a letter A-T or V-Z');
	}

	// Second and third characters must be digits
	if (!/^[A-Z]\d{2}/.test(clean)) {
		errors.push('ICD-10 code positions 2-3 must be digits');
	}

	// Characters 4-7 must be alphanumeric
	if (clean.length > 3 && !/^[A-Z]\d{2}[A-Z0-9]{1,4}$/.test(clean)) {
		errors.push('ICD-10 code characters 4-7 must be alphanumeric');
	}

	// Format with decimal point
	let formatted = clean;
	if (clean.length > 3) {
		formatted = `${clean.substring(0, 3)}.${clean.substring(3)}`;
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		sanitized: formatted,
	};
}

/**
 * Validate CPT code
 */
export function validateCpt(code: string): IValidationResult {
	const errors: string[] = [];
	const clean = code.replace(/\D/g, '');

	// CPT codes are 5 digits
	if (clean.length !== 5) {
		errors.push(`CPT code must be 5 digits, got ${clean.length}`);
		return { valid: false, errors };
	}

	// Category I codes: 00100-99499
	// Category II codes: 0001F-9999F (tracking codes)
	// Category III codes: 0001T-9999T (temporary codes)

	const numericValue = parseInt(clean, 10);

	// Check for valid ranges
	const validRanges = [
		{ min: 100, max: 1999 }, // Anesthesia
		{ min: 10000, max: 69990 }, // Surgery
		{ min: 70000, max: 79999 }, // Radiology
		{ min: 80000, max: 89398 }, // Pathology
		{ min: 90000, max: 99499 }, // Medicine/E&M
		{ min: 99500, max: 99607 }, // Home services
	];

	const inValidRange = validRanges.some((range) => numericValue >= range.min && numericValue <= range.max);

	if (!inValidRange) {
		errors.push('CPT code not in valid range');
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate HCPCS code
 */
export function validateHcpcs(code: string): IValidationResult {
	const errors: string[] = [];
	const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

	// HCPCS Level I = CPT codes (5 digits)
	// HCPCS Level II = Letter + 4 digits (e.g., A0001-V5999)

	if (clean.length !== 5) {
		errors.push(`HCPCS code must be 5 characters, got ${clean.length}`);
		return { valid: false, errors };
	}

	// Check if it's Level I (CPT) or Level II
	if (/^\d{5}$/.test(clean)) {
		// Level I - delegate to CPT validation
		return validateCpt(clean);
	}

	// Level II validation - Letter + 4 digits
	if (!/^[A-V]\d{4}$/.test(clean)) {
		errors.push('HCPCS Level II code must be letter A-V followed by 4 digits');
	}

	// Check valid Level II ranges
	const letter = clean.charAt(0);
	const validLetters = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'J', 'K', 'L', 'M', 'P', 'Q', 'R', 'S', 'T', 'V'];

	if (!validLetters.includes(letter)) {
		errors.push(`HCPCS code letter '${letter}' not in valid range`);
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate Revenue Code
 */
export function validateRevenueCode(code: string): IValidationResult {
	const errors: string[] = [];
	const clean = code.replace(/\D/g, '');

	// Revenue codes are 4 digits (0001-9999)
	if (clean.length < 3 || clean.length > 4) {
		errors.push(`Revenue code must be 3-4 digits, got ${clean.length}`);
		return { valid: false, errors };
	}

	const padded = clean.padStart(4, '0');
	const numericValue = parseInt(padded, 10);

	// Common revenue code ranges
	const validRanges = [
		{ min: 100, max: 219 }, // Room & Board
		{ min: 220, max: 229 }, // ICU
		{ min: 250, max: 259 }, // Pharmacy
		{ min: 260, max: 269 }, // IV Therapy
		{ min: 270, max: 279 }, // Supplies
		{ min: 280, max: 289 }, // Oncology
		{ min: 290, max: 299 }, // DME
		{ min: 300, max: 319 }, // Lab
		{ min: 320, max: 329 }, // Radiology - Diagnostic
		{ min: 330, max: 339 }, // Radiology - Therapeutic
		{ min: 340, max: 359 }, // Nuclear Medicine
		{ min: 360, max: 379 }, // OR Services
		{ min: 380, max: 399 }, // Blood
		{ min: 400, max: 409 }, // Other Imaging
		{ min: 410, max: 419 }, // Respiratory
		{ min: 420, max: 449 }, // PT/OT/Speech
		{ min: 450, max: 459 }, // Emergency Room
		{ min: 460, max: 469 }, // Pulmonary
		{ min: 470, max: 479 }, // Audiology
		{ min: 480, max: 489 }, // Cardiology
		{ min: 490, max: 499 }, // Ambulatory Surgical Care
		{ min: 500, max: 509 }, // Outpatient Services
		{ min: 510, max: 519 }, // Clinic
		{ min: 520, max: 529 }, // Free-standing Clinic
		{ min: 530, max: 549 }, // Osteopathic Services
		{ min: 550, max: 559 }, // Ambulance
		{ min: 560, max: 569 }, // Home Health - Skilled Nursing
		{ min: 570, max: 599 }, // Home Health - Other
		{ min: 600, max: 619 }, // Magnetic Resonance
		{ min: 620, max: 629 }, // Medical/Surgical Supplies
		{ min: 630, max: 639 }, // Pharmacy Extension
		{ min: 700, max: 729 }, // Cast Room
		{ min: 730, max: 749 }, // EKG
		{ min: 750, max: 759 }, // Gastro Services
		{ min: 760, max: 769 }, // Treatment Room
		{ min: 770, max: 779 }, // Preventive Care
		{ min: 780, max: 789 }, // Telemedicine
		{ min: 790, max: 799 }, // Lithotripsy
		{ min: 800, max: 809 }, // Inpatient Renal Dialysis
		{ min: 810, max: 819 }, // Organ Acquisition
		{ min: 820, max: 829 }, // Hemodialysis - Outpatient
		{ min: 830, max: 839 }, // Peritoneal Dialysis
		{ min: 840, max: 849 }, // CAPD - Outpatient
		{ min: 850, max: 859 }, // CCPD - Outpatient
		{ min: 880, max: 889 }, // Miscellaneous Dialysis
		{ min: 900, max: 919 }, // Behavioral Health
		{ min: 920, max: 929 }, // Other Diagnostic Services
		{ min: 940, max: 949 }, // Other Therapeutic Services
		{ min: 960, max: 989 }, // Professional Fees
		{ min: 990, max: 999 }, // Patient Convenience
		{ min: 1, max: 99 }, // Reserved
	];

	const inValidRange = validRanges.some((range) => numericValue >= range.min && numericValue <= range.max);

	if (!inValidRange && numericValue !== 0 && numericValue !== 1) {
		errors.push(`Revenue code ${padded} not in standard range`);
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: padded,
	};
}

/**
 * Validate Taxonomy Code (Provider Specialty)
 */
export function validateTaxonomyCode(code: string): IValidationResult {
	const errors: string[] = [];
	const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');

	// Taxonomy codes are 10 characters: 3 letters + 7 alphanumeric
	if (clean.length !== 10) {
		errors.push(`Taxonomy code must be 10 characters, got ${clean.length}`);
		return { valid: false, errors };
	}

	// Format: XXX#######X
	if (!/^[0-9]{3}[A-Z0-9]{6}[0-9X]$/.test(clean)) {
		errors.push('Invalid taxonomy code format');
	}

	// Check for common valid first digits
	const validFirstDigits = ['1', '2', '3'];
	if (!validFirstDigits.includes(clean.charAt(0))) {
		errors.push('Taxonomy code should start with 1, 2, or 3');
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate Payer ID
 */
export function validatePayerId(payerId: string): IValidationResult {
	const errors: string[] = [];
	const clean = payerId.toUpperCase().replace(/\s/g, '');

	// Payer IDs are typically 5-10 alphanumeric characters
	if (clean.length < 5 || clean.length > 10) {
		errors.push(`Payer ID should be 5-10 characters, got ${clean.length}`);
	}

	// Must be alphanumeric
	if (!/^[A-Z0-9]+$/.test(clean)) {
		errors.push('Payer ID must be alphanumeric');
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate Member ID
 */
export function validateMemberId(memberId: string): IValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const clean = memberId.replace(/\s/g, '');

	// Member IDs vary greatly by payer
	if (clean.length < 5) {
		errors.push(`Member ID seems too short: ${clean.length} characters`);
	}

	if (clean.length > 30) {
		errors.push(`Member ID seems too long: ${clean.length} characters`);
	}

	// Check for common issues
	if (/^0+$/.test(clean)) {
		errors.push('Member ID cannot be all zeros');
	}

	// Warning for SSN-like patterns
	if (/^\d{9}$/.test(clean)) {
		warnings.push('Member ID matches SSN format - verify this is not a Social Security Number');
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		sanitized: clean,
	};
}

/**
 * Validate Date of Birth
 */
export function validateDateOfBirth(dob: string): IValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Try to parse the date
	const date = new Date(dob);

	if (isNaN(date.getTime())) {
		errors.push('Invalid date format');
		return { valid: false, errors };
	}

	const today = new Date();
	const age = Math.floor((today.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

	// Check reasonable age range
	if (date > today) {
		errors.push('Date of birth cannot be in the future');
	}

	if (age > 150) {
		errors.push('Date of birth indicates age over 150 years');
	}

	if (age < 0) {
		errors.push('Invalid date of birth');
	}

	// Warnings for edge cases
	if (age > 120) {
		warnings.push(`Age ${age} is unusually high - please verify`);
	}

	// Format as YYYY-MM-DD
	const formatted = date.toISOString().split('T')[0];

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		sanitized: formatted,
	};
}

/**
 * Validate Gender Code
 */
export function validateGenderCode(gender: string): IValidationResult {
	const errors: string[] = [];
	const clean = gender.toUpperCase().trim();

	const validCodes: Record<string, string> = {
		M: 'Male',
		F: 'Female',
		U: 'Unknown',
		MALE: 'M',
		FEMALE: 'F',
		UNKNOWN: 'U',
	};

	if (!validCodes[clean]) {
		errors.push(`Invalid gender code: ${gender}. Valid values: M, F, U`);
	}

	// Convert to single letter code
	const sanitized = validCodes[clean] || clean;
	const finalCode = sanitized.length === 1 ? sanitized : validCodes[sanitized];

	return {
		valid: errors.length === 0,
		errors,
		sanitized: finalCode,
	};
}

/**
 * Validate Claim Amount
 */
export function validateClaimAmount(amount: number | string): IValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	let numericAmount: number;

	if (typeof amount === 'string') {
		numericAmount = parseFloat(amount.replace(/[$,]/g, ''));
	} else {
		numericAmount = amount;
	}

	if (isNaN(numericAmount)) {
		errors.push('Invalid amount format');
		return { valid: false, errors };
	}

	if (numericAmount < 0) {
		errors.push('Amount cannot be negative');
	}

	if (numericAmount === 0) {
		warnings.push('Amount is zero');
	}

	if (numericAmount > 10000000) {
		warnings.push('Amount exceeds $10,000,000 - please verify');
	}

	// Round to 2 decimal places
	const sanitized = Math.round(numericAmount * 100) / 100;

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		sanitized,
	};
}

/**
 * Validate Service Date
 */
export function validateServiceDate(
	date: string,
	options: { allowFuture?: boolean; maxDaysBack?: number } = {}
): IValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	const { allowFuture = false, maxDaysBack = 365 } = options;

	const serviceDate = new Date(date);

	if (isNaN(serviceDate.getTime())) {
		errors.push('Invalid date format');
		return { valid: false, errors };
	}

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (!allowFuture && serviceDate > today) {
		errors.push('Service date cannot be in the future');
	}

	const daysDiff = Math.floor((today.getTime() - serviceDate.getTime()) / (24 * 60 * 60 * 1000));

	if (daysDiff > maxDaysBack) {
		warnings.push(`Service date is ${daysDiff} days ago - may be past timely filing deadline`);
	}

	// Common timely filing warnings
	if (daysDiff > 365) {
		warnings.push('Service date is over 1 year old - check payer timely filing limits');
	}

	const formatted = serviceDate.toISOString().split('T')[0];

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		sanitized: formatted,
	};
}

/**
 * Validate Modifier Code
 */
export function validateModifier(modifier: string): IValidationResult {
	const errors: string[] = [];
	const clean = modifier.toUpperCase().replace(/\s/g, '');

	// Modifiers are 2 characters, alphanumeric
	if (clean.length !== 2) {
		errors.push(`Modifier must be 2 characters, got ${clean.length}`);
		return { valid: false, errors };
	}

	if (!/^[A-Z0-9]{2}$/.test(clean)) {
		errors.push('Modifier must be alphanumeric');
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate Place of Service Code
 */
export function validatePlaceOfService(pos: string): IValidationResult {
	const errors: string[] = [];
	const clean = pos.replace(/\D/g, '').padStart(2, '0');

	if (clean.length !== 2) {
		errors.push(`Place of Service must be 2 digits, got ${clean.length}`);
		return { valid: false, errors };
	}

	// Valid POS codes (CMS)
	const validPosCodes = [
		'01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
		'11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
		'21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
		'31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
		'41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
		'51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
		'61', '62', '63', '64', '65', '71', '72', '81', '99',
	];

	if (!validPosCodes.includes(clean)) {
		errors.push(`Invalid Place of Service code: ${clean}`);
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Validate Phone Number
 */
export function validatePhoneNumber(phone: string): IValidationResult {
	const errors: string[] = [];
	const clean = phone.replace(/\D/g, '');

	// US phone numbers
	if (clean.length !== 10 && clean.length !== 11) {
		errors.push(`Phone number should be 10-11 digits, got ${clean.length}`);
		return { valid: false, errors };
	}

	// Remove leading 1 for US numbers
	const normalized = clean.length === 11 && clean.charAt(0) === '1' ? clean.substring(1) : clean;

	// Check for invalid patterns
	if (/^0{10}$/.test(normalized)) {
		errors.push('Phone number cannot be all zeros');
	}

	// Format as (XXX) XXX-XXXX
	const formatted = `(${normalized.substring(0, 3)}) ${normalized.substring(3, 6)}-${normalized.substring(6)}`;

	return {
		valid: errors.length === 0,
		errors,
		sanitized: normalized,
	};
}

/**
 * Validate ZIP Code
 */
export function validateZipCode(zip: string): IValidationResult {
	const errors: string[] = [];
	const clean = zip.replace(/[^0-9-]/g, '');

	// US ZIP codes: 5 digits or 9 digits (ZIP+4)
	if (!/^\d{5}(-?\d{4})?$/.test(clean)) {
		errors.push('ZIP code must be 5 digits or 9 digits (ZIP+4)');
		return { valid: false, errors };
	}

	const zip5 = clean.substring(0, 5);

	// Check for invalid patterns
	if (/^0{5}$/.test(zip5)) {
		errors.push('ZIP code cannot be all zeros');
	}

	// Format ZIP+4
	const formatted = clean.length === 9 ? `${zip5}-${clean.substring(5)}` : zip5;

	return {
		valid: errors.length === 0,
		errors,
		sanitized: formatted,
	};
}

/**
 * Validate Email Address
 */
export function validateEmail(email: string): IValidationResult {
	const errors: string[] = [];
	const clean = email.toLowerCase().trim();

	// Basic email regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(clean)) {
		errors.push('Invalid email format');
	}

	// Check length
	if (clean.length > 254) {
		errors.push('Email address too long');
	}

	return {
		valid: errors.length === 0,
		errors,
		sanitized: clean,
	};
}

/**
 * Batch validate multiple fields
 */
export function validateFields(
	fields: Record<string, { value: unknown; validator: string; options?: IDataObject }>
): { valid: boolean; results: Record<string, IValidationResult> } {
	const results: Record<string, IValidationResult> = {};
	let allValid = true;

	const validators: Record<string, (value: unknown, options?: IDataObject) => IValidationResult> = {
		npi: (v) => validateNpi(String(v)),
		taxId: (v) => validateTaxId(String(v)),
		icd10: (v) => validateIcd10(String(v)),
		cpt: (v) => validateCpt(String(v)),
		hcpcs: (v) => validateHcpcs(String(v)),
		revenueCode: (v) => validateRevenueCode(String(v)),
		taxonomyCode: (v) => validateTaxonomyCode(String(v)),
		payerId: (v) => validatePayerId(String(v)),
		memberId: (v) => validateMemberId(String(v)),
		dateOfBirth: (v) => validateDateOfBirth(String(v)),
		gender: (v) => validateGenderCode(String(v)),
		amount: (v) => validateClaimAmount(v as number | string),
		serviceDate: (v, o) => validateServiceDate(String(v), o as { allowFuture?: boolean; maxDaysBack?: number }),
		modifier: (v) => validateModifier(String(v)),
		placeOfService: (v) => validatePlaceOfService(String(v)),
		phone: (v) => validatePhoneNumber(String(v)),
		zip: (v) => validateZipCode(String(v)),
		email: (v) => validateEmail(String(v)),
	};

	for (const [fieldName, config] of Object.entries(fields)) {
		const validator = validators[config.validator];
		if (validator) {
			results[fieldName] = validator(config.value, config.options);
			if (!results[fieldName].valid) {
				allValid = false;
			}
		} else {
			results[fieldName] = {
				valid: false,
				errors: [`Unknown validator: ${config.validator}`],
			};
			allValid = false;
		}
	}

	return { valid: allValid, results };
}

export default {
	validateNpi,
	validateTaxId,
	validateIcd10,
	validateCpt,
	validateHcpcs,
	validateRevenueCode,
	validateTaxonomyCode,
	validatePayerId,
	validateMemberId,
	validateDateOfBirth,
	validateGenderCode,
	validateClaimAmount,
	validateServiceDate,
	validateModifier,
	validatePlaceOfService,
	validatePhoneNumber,
	validateZipCode,
	validateEmail,
	validateFields,
};
