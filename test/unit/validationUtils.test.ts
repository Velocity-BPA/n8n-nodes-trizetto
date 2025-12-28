/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	validateNpi,
	validateTaxId,
	validateMemberId,
	validatePayerId,
	validateIcd10,
	validateCpt,
	validateHcpcs,
	validateRevenueCode,
	validateTaxonomyCode,
	validateModifier,
	validatePlaceOfService,
	validateDateOfBirth,
	validateGenderCode,
	validateClaimAmount,
	validateServiceDate,
	validatePhoneNumber,
	validateZipCode,
	validateEmail,
} from '../../nodes/TriZetto/utils/validationUtils';

describe('Validation Utils', () => {
	describe('validateNpi', () => {
		it('should validate a correct NPI', () => {
			const result = validateNpi('1234567893');
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject an NPI with incorrect check digit', () => {
			const result = validateNpi('1234567890');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Invalid NPI check digit (Luhn validation failed)');
		});

		it('should reject an NPI with wrong length', () => {
			const result = validateNpi('123456789');
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('NPI must be exactly 10 digits');
		});

		it('should reject non-numeric NPI', () => {
			const result = validateNpi('123456789A');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateTaxId', () => {
		it('should validate a correct EIN', () => {
			const result = validateTaxId('12-3456789');
			expect(result.valid).toBe(true);
			expect(result.sanitized).toBe('123456789');
		});

		it('should validate a correct SSN', () => {
			const result = validateTaxId('123-45-6789', 'SSN');
			expect(result.valid).toBe(true);
		});

		it('should reject an invalid Tax ID', () => {
			const result = validateTaxId('12-34567');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateMemberId', () => {
		it('should validate a correct member ID', () => {
			const result = validateMemberId('ABC123456789');
			expect(result.valid).toBe(true);
		});

		it('should reject an empty member ID', () => {
			const result = validateMemberId('');
			expect(result.valid).toBe(false);
		});

		it('should reject a member ID that is too long', () => {
			const result = validateMemberId('A'.repeat(100));
			expect(result.valid).toBe(false);
		});
	});

	describe('validateIcd10', () => {
		it('should validate a correct ICD-10 code', () => {
			const result = validateIcd10('J45.909');
			expect(result.valid).toBe(true);
		});

		it('should validate ICD-10 without decimal', () => {
			const result = validateIcd10('J45909');
			expect(result.valid).toBe(true);
		});

		it('should reject an invalid ICD-10 format', () => {
			const result = validateIcd10('12345');
			expect(result.valid).toBe(false);
		});

		it('should reject ICD-10 that is too short', () => {
			const result = validateIcd10('J4');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateCpt', () => {
		it('should validate a correct CPT code', () => {
			const result = validateCpt('99213');
			expect(result.valid).toBe(true);
		});

		it('should validate anesthesia CPT range', () => {
			const result = validateCpt('00100');
			expect(result.valid).toBe(true);
		});

		it('should reject CPT with wrong length', () => {
			const result = validateCpt('9921');
			expect(result.valid).toBe(false);
		});

		it('should reject non-numeric CPT', () => {
			const result = validateCpt('9921A');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateHcpcs', () => {
		it('should validate Level I HCPCS (CPT)', () => {
			const result = validateHcpcs('99213');
			expect(result.valid).toBe(true);
		});

		it('should validate Level II HCPCS', () => {
			const result = validateHcpcs('A1234');
			expect(result.valid).toBe(true);
		});

		it('should validate J-code HCPCS', () => {
			const result = validateHcpcs('J1234');
			expect(result.valid).toBe(true);
		});

		it('should reject invalid HCPCS', () => {
			const result = validateHcpcs('Z1234');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateRevenueCode', () => {
		it('should validate a correct revenue code', () => {
			const result = validateRevenueCode('0120');
			expect(result.valid).toBe(true);
		});

		it('should reject revenue code with wrong length', () => {
			const result = validateRevenueCode('012');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateTaxonomyCode', () => {
		it('should validate a correct taxonomy code', () => {
			const result = validateTaxonomyCode('207Q00000X');
			expect(result.valid).toBe(true);
		});

		it('should reject taxonomy with wrong length', () => {
			const result = validateTaxonomyCode('207Q0000');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateModifier', () => {
		it('should validate a correct modifier', () => {
			const result = validateModifier('25');
			expect(result.valid).toBe(true);
		});

		it('should validate alphanumeric modifier', () => {
			const result = validateModifier('TC');
			expect(result.valid).toBe(true);
		});

		it('should reject modifier with wrong length', () => {
			const result = validateModifier('ABC');
			expect(result.valid).toBe(false);
		});
	});

	describe('validatePlaceOfService', () => {
		it('should validate a correct POS code', () => {
			const result = validatePlaceOfService('11');
			expect(result.valid).toBe(true);
		});

		it('should reject POS with wrong length', () => {
			const result = validatePlaceOfService('1');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateDateOfBirth', () => {
		it('should validate a valid date of birth', () => {
			const result = validateDateOfBirth('1980-01-15');
			expect(result.valid).toBe(true);
		});

		it('should reject future date of birth', () => {
			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 1);
			const result = validateDateOfBirth(futureDate.toISOString().split('T')[0]);
			expect(result.valid).toBe(false);
		});

		it('should warn for very old date of birth', () => {
			const result = validateDateOfBirth('1900-01-01');
			expect(result.valid).toBe(true);
			expect(result.warnings.length).toBeGreaterThan(0);
		});
	});

	describe('validateGenderCode', () => {
		it('should validate M gender code', () => {
			const result = validateGenderCode('M');
			expect(result.valid).toBe(true);
		});

		it('should validate F gender code', () => {
			const result = validateGenderCode('F');
			expect(result.valid).toBe(true);
		});

		it('should validate U gender code', () => {
			const result = validateGenderCode('U');
			expect(result.valid).toBe(true);
		});

		it('should reject invalid gender code', () => {
			const result = validateGenderCode('X');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateClaimAmount', () => {
		it('should validate a valid claim amount', () => {
			const result = validateClaimAmount(1500.00);
			expect(result.valid).toBe(true);
		});

		it('should reject negative amount', () => {
			const result = validateClaimAmount(-100);
			expect(result.valid).toBe(false);
		});

		it('should warn for zero amount', () => {
			const result = validateClaimAmount(0);
			expect(result.valid).toBe(true);
			expect(result.warnings).toContain('Claim amount is zero');
		});

		it('should round to 2 decimal places', () => {
			const result = validateClaimAmount(100.999);
			expect(result.sanitized).toBe(101.00);
		});
	});

	describe('validateServiceDate', () => {
		it('should validate a past service date', () => {
			const pastDate = new Date();
			pastDate.setDate(pastDate.getDate() - 30);
			const result = validateServiceDate(pastDate.toISOString().split('T')[0]);
			expect(result.valid).toBe(true);
		});

		it('should validate today as service date', () => {
			const today = new Date().toISOString().split('T')[0];
			const result = validateServiceDate(today);
			expect(result.valid).toBe(true);
		});

		it('should reject future service date', () => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			const result = validateServiceDate(futureDate.toISOString().split('T')[0]);
			expect(result.valid).toBe(false);
		});
	});

	describe('validatePhoneNumber', () => {
		it('should validate a 10-digit phone number', () => {
			const result = validatePhoneNumber('5551234567');
			expect(result.valid).toBe(true);
		});

		it('should validate formatted phone number', () => {
			const result = validatePhoneNumber('(555) 123-4567');
			expect(result.valid).toBe(true);
			expect(result.sanitized).toBe('5551234567');
		});

		it('should reject invalid phone number', () => {
			const result = validatePhoneNumber('123');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateZipCode', () => {
		it('should validate 5-digit zip code', () => {
			const result = validateZipCode('12345');
			expect(result.valid).toBe(true);
		});

		it('should validate 9-digit zip code', () => {
			const result = validateZipCode('12345-6789');
			expect(result.valid).toBe(true);
		});

		it('should validate 9-digit zip without hyphen', () => {
			const result = validateZipCode('123456789');
			expect(result.valid).toBe(true);
		});

		it('should reject invalid zip code', () => {
			const result = validateZipCode('1234');
			expect(result.valid).toBe(false);
		});
	});

	describe('validateEmail', () => {
		it('should validate a correct email', () => {
			const result = validateEmail('test@example.com');
			expect(result.valid).toBe(true);
		});

		it('should reject invalid email', () => {
			const result = validateEmail('not-an-email');
			expect(result.valid).toBe(false);
		});

		it('should reject email without domain', () => {
			const result = validateEmail('test@');
			expect(result.valid).toBe(false);
		});
	});
});
