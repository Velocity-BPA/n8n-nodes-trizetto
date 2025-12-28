/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	generateIsaControlNumber,
	generateGsControlNumber,
	generateStControlNumber,
	formatEdiDate,
	formatEdiTime,
	parseEdiDate,
	formatEdiAmount,
	parseEdiAmount,
	padRight,
	padLeft,
	cleanEdiString,
	escapeEdiString,
	buildEdiSegment,
	parseEdiSegment,
	validateEdiFormat,
	countSegments,
	extractSegments,
	detectDelimiters,
	calculateNpiCheckDigit,
	formatNpi,
	validateNpi,
	getTransactionType,
	generateTraceNumber,
} from '../../nodes/TriZetto/utils/ediUtils';

describe('EDI Utils', () => {
	describe('Control Number Generation', () => {
		it('should generate unique ISA control numbers', () => {
			const num1 = generateIsaControlNumber();
			const num2 = generateIsaControlNumber();
			expect(num1).toHaveLength(9);
			expect(num1).not.toBe(num2);
		});

		it('should generate unique GS control numbers', () => {
			const num1 = generateGsControlNumber();
			const num2 = generateGsControlNumber();
			expect(num1).toHaveLength(9);
			expect(num1).not.toBe(num2);
		});

		it('should generate unique ST control numbers', () => {
			const num1 = generateStControlNumber();
			const num2 = generateStControlNumber();
			expect(num1).toHaveLength(4);
			expect(num1).not.toBe(num2);
		});
	});

	describe('Date/Time Formatting', () => {
		it('should format date in EDI format (CCYYMMDD)', () => {
			const date = new Date('2024-01-15');
			const result = formatEdiDate(date);
			expect(result).toBe('20240115');
		});

		it('should format date with custom format', () => {
			const date = new Date('2024-01-15');
			const result = formatEdiDate(date, 'YYMMDD');
			expect(result).toBe('240115');
		});

		it('should format time in HHMM format', () => {
			const date = new Date('2024-01-15T14:30:00');
			const result = formatEdiTime(date);
			expect(result).toBe('1430');
		});

		it('should format time with seconds', () => {
			const date = new Date('2024-01-15T14:30:45');
			const result = formatEdiTime(date, 'HHMMSS');
			expect(result).toBe('143045');
		});

		it('should parse EDI date CCYYMMDD', () => {
			const result = parseEdiDate('20240115');
			expect(result.getFullYear()).toBe(2024);
			expect(result.getMonth()).toBe(0); // January
			expect(result.getDate()).toBe(15);
		});

		it('should parse EDI date YYMMDD', () => {
			const result = parseEdiDate('240115');
			expect(result.getFullYear()).toBe(2024);
		});
	});

	describe('Amount Formatting', () => {
		it('should format amount with no decimals', () => {
			const result = formatEdiAmount(1500.50);
			expect(result).toBe('150050');
		});

		it('should format amount with 2 decimal places', () => {
			const result = formatEdiAmount(1500.50, 2);
			expect(result).toBe('1500.50');
		});

		it('should parse EDI amount', () => {
			const result = parseEdiAmount('150050');
			expect(result).toBe(1500.50);
		});

		it('should parse amount with explicit decimal', () => {
			const result = parseEdiAmount('1500.50');
			expect(result).toBe(1500.50);
		});
	});

	describe('String Padding', () => {
		it('should pad string on right', () => {
			const result = padRight('TEST', 10);
			expect(result).toBe('TEST      ');
			expect(result).toHaveLength(10);
		});

		it('should pad string on left with zeros', () => {
			const result = padLeft('123', 9, '0');
			expect(result).toBe('000000123');
		});

		it('should truncate if longer than max', () => {
			const result = padRight('TESTSTRING', 5);
			expect(result).toBe('TESTS');
		});
	});

	describe('EDI String Handling', () => {
		it('should clean EDI string of invalid characters', () => {
			const result = cleanEdiString('Test~String*With:Delimiters');
			expect(result).not.toContain('~');
			expect(result).not.toContain('*');
			expect(result).not.toContain(':');
		});

		it('should escape EDI string', () => {
			const result = escapeEdiString('Test\\String');
			expect(result).toBe('Test\\\\String');
		});
	});

	describe('Segment Building/Parsing', () => {
		it('should build EDI segment', () => {
			const result = buildEdiSegment('NM1', ['1P', '2', 'DOE', 'JOHN', '', '', '', 'XX', '1234567890']);
			expect(result).toBe('NM1*1P*2*DOE*JOHN****XX*1234567890');
		});

		it('should build segment with custom delimiter', () => {
			const result = buildEdiSegment('NM1', ['1P', '2'], '|');
			expect(result).toBe('NM1|1P|2');
		});

		it('should parse EDI segment', () => {
			const result = parseEdiSegment('NM1*1P*2*DOE*JOHN');
			expect(result).toEqual(['NM1', '1P', '2', 'DOE', 'JOHN']);
		});

		it('should parse segment with custom delimiter', () => {
			const result = parseEdiSegment('NM1|1P|2', '|');
			expect(result).toEqual(['NM1', '1P', '2']);
		});
	});

	describe('EDI Validation', () => {
		it('should validate correct EDI format', () => {
			const edi = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240115*1430*^*00501*000000001*0*P*:~GS*HS*SENDER*RECEIVER*20240115*1430*1*X*005010X279A1~ST*270*0001*005010X279A1~SE*1*0001~GE*1*1~IEA*1*000000001~';
			const result = validateEdiFormat(edi);
			expect(result.valid).toBe(true);
		});

		it('should detect missing ISA segment', () => {
			const edi = 'GS*HS*SENDER*RECEIVER~ST*270~SE*1~GE*1~';
			const result = validateEdiFormat(edi);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Missing ISA segment');
		});

		it('should detect missing IEA segment', () => {
			const edi = 'ISA*00*~GS*HS~ST*270~SE*1~GE*1~';
			const result = validateEdiFormat(edi);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Missing IEA segment');
		});
	});

	describe('Segment Operations', () => {
		it('should count segments', () => {
			const edi = 'ISA*00~GS*HS~ST*270~BHT*0022~SE*2~GE*1~IEA*1~';
			const count = countSegments(edi);
			expect(count).toBe(7);
		});

		it('should extract specific segments', () => {
			const edi = 'ISA*00~GS*HS~ST*270~NM1*1P*2~NM1*IL*1~SE*3~GE*1~IEA*1~';
			const nm1Segments = extractSegments(edi, 'NM1');
			expect(nm1Segments).toHaveLength(2);
		});
	});

	describe('Delimiter Detection', () => {
		it('should detect standard delimiters', () => {
			const edi = 'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240115*1430*^*00501*000000001*0*P*:~';
			const delimiters = detectDelimiters(edi);
			expect(delimiters.element).toBe('*');
			expect(delimiters.segment).toBe('~');
			expect(delimiters.subelement).toBe(':');
		});

		it('should detect alternate delimiters', () => {
			const edi = 'ISA|00|          |00|          |ZZ|SENDER         |ZZ|RECEIVER       |240115|1430|^|00501|000000001|0|P|>\\n';
			const delimiters = detectDelimiters(edi);
			expect(delimiters.element).toBe('|');
		});
	});

	describe('NPI Utilities', () => {
		it('should calculate NPI check digit', () => {
			const checkDigit = calculateNpiCheckDigit('123456789');
			expect(typeof checkDigit).toBe('number');
		});

		it('should format NPI correctly', () => {
			const result = formatNpi('1234567893');
			expect(result).toBe('1234567893');
		});

		it('should validate correct NPI', () => {
			const result = validateNpi('1234567893');
			expect(result).toBe(true);
		});

		it('should reject invalid NPI', () => {
			const result = validateNpi('1234567890');
			expect(result).toBe(false);
		});
	});

	describe('Transaction Type Detection', () => {
		it('should detect 270 transaction type', () => {
			const edi = 'ISA*00~GS*HS~ST*270~';
			const type = getTransactionType(edi);
			expect(type).toBe('270');
		});

		it('should detect 837P transaction type', () => {
			const edi = 'ISA*00~GS*HC~ST*837*0001*005010X222A1~BHT*0019*00~';
			const type = getTransactionType(edi);
			expect(type).toBe('837');
		});

		it('should return null for unknown transaction', () => {
			const edi = 'INVALID~DATA~';
			const type = getTransactionType(edi);
			expect(type).toBeNull();
		});
	});

	describe('Trace Number Generation', () => {
		it('should generate unique trace numbers', () => {
			const trace1 = generateTraceNumber('SENDER123');
			const trace2 = generateTraceNumber('SENDER123');
			expect(trace1).not.toBe(trace2);
		});

		it('should include sender ID prefix', () => {
			const trace = generateTraceNumber('SENDER123');
			expect(trace).toContain('SENDER123');
		});
	});
});
