/**
 * TriZetto EDI Utilities - Helper functions for EDI processing
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import { IDataObject } from 'n8n-workflow';

/**
 * EDI Transaction types
 */
export const EDI_TRANSACTION_TYPES = {
	'270': 'Eligibility Inquiry',
	'271': 'Eligibility Response',
	'276': 'Claim Status Inquiry',
	'277': 'Claim Status Response',
	'278': 'Prior Authorization',
	'835': 'Remittance Advice',
	'837I': 'Institutional Claim',
	'837P': 'Professional Claim',
	'837D': 'Dental Claim',
	'997': 'Functional Acknowledgment',
	'999': 'Implementation Acknowledgment',
	'TA1': 'Interchange Acknowledgment',
} as const;

/**
 * Generate ISA control number (9 digits)
 */
export function generateIsaControlNumber(): string {
	return Math.floor(Math.random() * 999999999)
		.toString()
		.padStart(9, '0');
}

/**
 * Generate GS control number (1-9 digits)
 */
export function generateGsControlNumber(): string {
	return Math.floor(Math.random() * 999999999).toString();
}

/**
 * Generate ST control number (4-9 digits)
 */
export function generateStControlNumber(): string {
	return Math.floor(Math.random() * 9999)
		.toString()
		.padStart(4, '0');
}

/**
 * Format date for EDI (YYMMDD or CCYYMMDD)
 */
export function formatEdiDate(date: Date, fullYear: boolean = true): string {
	const year = fullYear ? date.getFullYear() : date.getFullYear() % 100;
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	return `${year}${month}${day}`;
}

/**
 * Format time for EDI (HHMM or HHMMSS)
 */
export function formatEdiTime(date: Date, includeSeconds: boolean = false): string {
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	const seconds = date.getSeconds().toString().padStart(2, '0');
	return includeSeconds ? `${hours}${minutes}${seconds}` : `${hours}${minutes}`;
}

/**
 * Parse EDI date (CCYYMMDD or YYMMDD) to Date object
 */
export function parseEdiDate(ediDate: string): Date | null {
	if (!ediDate) return null;

	let year: number;
	let month: number;
	let day: number;

	if (ediDate.length === 8) {
		// CCYYMMDD
		year = parseInt(ediDate.substring(0, 4), 10);
		month = parseInt(ediDate.substring(4, 6), 10) - 1;
		day = parseInt(ediDate.substring(6, 8), 10);
	} else if (ediDate.length === 6) {
		// YYMMDD
		const yy = parseInt(ediDate.substring(0, 2), 10);
		year = yy >= 50 ? 1900 + yy : 2000 + yy;
		month = parseInt(ediDate.substring(2, 4), 10) - 1;
		day = parseInt(ediDate.substring(4, 6), 10);
	} else {
		return null;
	}

	return new Date(year, month, day);
}

/**
 * Parse EDI date range (CCYYMMDD-CCYYMMDD)
 */
export function parseEdiDateRange(dateRange: string): { start: Date | null; end: Date | null } {
	const parts = dateRange.split('-');
	return {
		start: parseEdiDate(parts[0]),
		end: parts[1] ? parseEdiDate(parts[1]) : null,
	};
}

/**
 * Format date range for EDI
 */
export function formatEdiDateRange(start: Date, end?: Date): string {
	const startStr = formatEdiDate(start);
	if (!end || start.getTime() === end.getTime()) {
		return startStr;
	}
	return `${startStr}-${formatEdiDate(end)}`;
}

/**
 * Format currency amount for EDI (no decimal point)
 */
export function formatEdiAmount(amount: number): string {
	return amount.toFixed(2);
}

/**
 * Parse EDI amount to number
 */
export function parseEdiAmount(amount: string): number {
	return parseFloat(amount) || 0;
}

/**
 * Pad string to the right
 */
export function padRight(str: string, length: number, char: string = ' '): string {
	return str.padEnd(length, char).substring(0, length);
}

/**
 * Pad string to the left
 */
export function padLeft(str: string, length: number, char: string = '0'): string {
	return str.padStart(length, char).substring(str.padStart(length, char).length - length);
}

/**
 * Clean EDI string (remove invalid characters)
 */
export function cleanEdiString(str: string): string {
	// Remove segment and element delimiters, control characters
	return str
		.replace(/[~*:^]/g, ' ')
		.replace(/[\x00-\x1F\x7F]/g, '')
		.trim();
}

/**
 * Escape special characters for EDI
 */
export function escapeEdiString(str: string, delimiter: string = '*'): string {
	// Replace delimiter with space
	return str.replace(new RegExp(`\\${delimiter}`, 'g'), ' ');
}

/**
 * Build EDI segment from elements
 */
export function buildEdiSegment(
	segmentId: string,
	elements: (string | number | undefined | null)[],
	delimiter: string = '*',
	terminator: string = '~'
): string {
	const cleanElements = elements.map((el) => {
		if (el === undefined || el === null) return '';
		return String(el);
	});

	// Remove trailing empty elements
	while (cleanElements.length > 0 && cleanElements[cleanElements.length - 1] === '') {
		cleanElements.pop();
	}

	return `${segmentId}${delimiter}${cleanElements.join(delimiter)}${terminator}`;
}

/**
 * Parse EDI segment into elements
 */
export function parseEdiSegment(
	segment: string,
	delimiter: string = '*'
): { id: string; elements: string[] } {
	const parts = segment.replace(/~$/, '').split(delimiter);
	return {
		id: parts[0] || '',
		elements: parts.slice(1),
	};
}

/**
 * Get transaction type from ISA/GS/ST segments
 */
export function getTransactionType(ediContent: string): string | null {
	const stMatch = ediContent.match(/ST\*(\d{3})/);
	if (stMatch) {
		return stMatch[1];
	}
	return null;
}

/**
 * Get control number from ISA segment
 */
export function getIsaControlNumber(ediContent: string): string | null {
	const isaMatch = ediContent.match(/ISA\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*[^*]*\*(\d+)/);
	if (isaMatch) {
		return isaMatch[1];
	}
	return null;
}

/**
 * Validate EDI format
 */
export function validateEdiFormat(ediContent: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!ediContent || typeof ediContent !== 'string') {
		errors.push('EDI content is empty or invalid');
		return { valid: false, errors };
	}

	// Check for required segments
	if (!ediContent.includes('ISA')) {
		errors.push('Missing ISA (Interchange Control Header) segment');
	}

	if (!ediContent.includes('IEA')) {
		errors.push('Missing IEA (Interchange Control Trailer) segment');
	}

	if (!ediContent.includes('GS')) {
		errors.push('Missing GS (Functional Group Header) segment');
	}

	if (!ediContent.includes('GE')) {
		errors.push('Missing GE (Functional Group Trailer) segment');
	}

	if (!ediContent.includes('ST')) {
		errors.push('Missing ST (Transaction Set Header) segment');
	}

	if (!ediContent.includes('SE')) {
		errors.push('Missing SE (Transaction Set Trailer) segment');
	}

	// Validate ISA length
	const isaMatch = ediContent.match(/^ISA.{103}/);
	if (isaMatch) {
		// ISA should be exactly 106 characters including the segment terminator
	}

	// Count segments
	const stCount = (ediContent.match(/ST\*/g) || []).length;
	const seCount = (ediContent.match(/SE\*/g) || []).length;
	if (stCount !== seCount) {
		errors.push(`Mismatched ST/SE segments: ${stCount} ST, ${seCount} SE`);
	}

	const gsCount = (ediContent.match(/GS\*/g) || []).length;
	const geCount = (ediContent.match(/GE\*/g) || []).length;
	if (gsCount !== geCount) {
		errors.push(`Mismatched GS/GE segments: ${gsCount} GS, ${geCount} GE`);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Count segments in EDI content
 */
export function countSegments(ediContent: string, segmentId?: string): number {
	if (segmentId) {
		const regex = new RegExp(`${segmentId}\\*`, 'g');
		return (ediContent.match(regex) || []).length;
	}
	// Count all segments (by counting segment terminators)
	return (ediContent.match(/~/g) || []).length;
}

/**
 * Extract specific segments from EDI content
 */
export function extractSegments(ediContent: string, segmentId: string): string[] {
	const regex = new RegExp(`${segmentId}\\*[^~]*~`, 'g');
	return ediContent.match(regex) || [];
}

/**
 * Build ISA segment
 */
export function buildIsaSegment(data: {
	authQualifier?: string;
	authInfo?: string;
	securityQualifier?: string;
	securityInfo?: string;
	senderQualifier: string;
	senderId: string;
	receiverQualifier: string;
	receiverId: string;
	date: Date;
	controlNumber: string;
	usageIndicator?: string;
	componentSeparator?: string;
}): string {
	const dateStr = formatEdiDate(data.date, false); // YYMMDD
	const timeStr = formatEdiTime(data.date);

	return buildEdiSegment('ISA', [
		padRight(data.authQualifier || '00', 2),
		padRight(data.authInfo || '', 10),
		padRight(data.securityQualifier || '00', 2),
		padRight(data.securityInfo || '', 10),
		padRight(data.senderQualifier || 'ZZ', 2),
		padRight(data.senderId, 15),
		padRight(data.receiverQualifier || 'ZZ', 2),
		padRight(data.receiverId, 15),
		dateStr,
		timeStr,
		'^', // Repetition Separator
		'00501', // Version
		padLeft(data.controlNumber, 9),
		'0', // Ack Requested
		data.usageIndicator || 'P',
		data.componentSeparator || ':',
	]);
}

/**
 * Build IEA segment
 */
export function buildIeaSegment(groupCount: number, controlNumber: string): string {
	return buildEdiSegment('IEA', [groupCount.toString(), padLeft(controlNumber, 9)]);
}

/**
 * Build GS segment
 */
export function buildGsSegment(data: {
	functionalId: string;
	senderId: string;
	receiverId: string;
	date: Date;
	controlNumber: string;
	versionCode?: string;
}): string {
	const dateStr = formatEdiDate(data.date);
	const timeStr = formatEdiTime(data.date);

	return buildEdiSegment('GS', [
		data.functionalId,
		data.senderId,
		data.receiverId,
		dateStr,
		timeStr,
		data.controlNumber,
		'X',
		data.versionCode || '005010X279A1',
	]);
}

/**
 * Build GE segment
 */
export function buildGeSegment(transactionCount: number, controlNumber: string): string {
	return buildEdiSegment('GE', [transactionCount.toString(), controlNumber]);
}

/**
 * Build ST segment
 */
export function buildStSegment(
	transactionType: string,
	controlNumber: string,
	versionCode?: string
): string {
	return buildEdiSegment('ST', [transactionType, padLeft(controlNumber, 4), versionCode]);
}

/**
 * Build SE segment
 */
export function buildSeSegment(segmentCount: number, controlNumber: string): string {
	return buildEdiSegment('SE', [segmentCount.toString(), padLeft(controlNumber, 4)]);
}

/**
 * Detect EDI delimiters from content
 */
export function detectDelimiters(ediContent: string): {
	segment: string;
	element: string;
	component: string;
	repetition: string;
} {
	// Default delimiters
	let segment = '~';
	let element = '*';
	let component = ':';
	let repetition = '^';

	// ISA segment is fixed length, delimiters are at known positions
	if (ediContent.startsWith('ISA') && ediContent.length >= 106) {
		element = ediContent.charAt(3); // Position 3 after 'ISA'
		component = ediContent.charAt(104); // Position 104
		segment = ediContent.charAt(105); // Position 105
		repetition = ediContent.charAt(82); // Position 82 (ISA11)
	}

	return { segment, element, component, repetition };
}

/**
 * Split EDI content into segments
 */
export function splitIntoSegments(ediContent: string): string[] {
	const { segment: delimiter } = detectDelimiters(ediContent);
	return ediContent
		.split(delimiter)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
}

/**
 * Calculate check digit for NPI using Luhn algorithm
 */
export function calculateNpiCheckDigit(npi9: string): string {
	// Add the prefix "80840" for NPI
	const npiWithPrefix = '80840' + npi9;

	let sum = 0;
	let alternate = false;

	for (let i = npiWithPrefix.length - 1; i >= 0; i--) {
		let digit = parseInt(npiWithPrefix.charAt(i), 10);

		if (alternate) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}

		sum += digit;
		alternate = !alternate;
	}

	return ((10 - (sum % 10)) % 10).toString();
}

/**
 * Format NPI with check digit
 */
export function formatNpi(npi: string): string {
	const clean = npi.replace(/\D/g, '');

	if (clean.length === 10) {
		return clean;
	}

	if (clean.length === 9) {
		return clean + calculateNpiCheckDigit(clean);
	}

	return clean;
}

/**
 * Validate NPI format and check digit
 */
export function validateNpi(npi: string): boolean {
	const clean = npi.replace(/\D/g, '');

	if (clean.length !== 10) {
		return false;
	}

	// Validate check digit using Luhn algorithm
	const npi9 = clean.substring(0, 9);
	const checkDigit = calculateNpiCheckDigit(npi9);

	return checkDigit === clean.charAt(9);
}

/**
 * Generate unique trace/reference number
 */
export function generateTraceNumber(prefix?: string): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return prefix ? `${prefix}${timestamp}${random}`.toUpperCase() : `${timestamp}${random}`.toUpperCase();
}

export default {
	EDI_TRANSACTION_TYPES,
	generateIsaControlNumber,
	generateGsControlNumber,
	generateStControlNumber,
	formatEdiDate,
	formatEdiTime,
	parseEdiDate,
	parseEdiDateRange,
	formatEdiDateRange,
	formatEdiAmount,
	parseEdiAmount,
	padRight,
	padLeft,
	cleanEdiString,
	escapeEdiString,
	buildEdiSegment,
	parseEdiSegment,
	getTransactionType,
	getIsaControlNumber,
	validateEdiFormat,
	countSegments,
	extractSegments,
	buildIsaSegment,
	buildIeaSegment,
	buildGsSegment,
	buildGeSegment,
	buildStSegment,
	buildSeSegment,
	detectDelimiters,
	splitIntoSegments,
	calculateNpiCheckDigit,
	formatNpi,
	validateNpi,
	generateTraceNumber,
};
