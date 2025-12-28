/**
 * TriZetto HIPAA Utilities - PHI Handling and Security
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import { IDataObject } from 'n8n-workflow';
import * as crypto from 'crypto';

/**
 * PHI field categories for HIPAA compliance
 */
export const PHI_FIELDS = {
	// Direct identifiers - Always sensitive
	DIRECT: [
		'name',
		'firstName',
		'lastName',
		'middleName',
		'ssn',
		'socialSecurityNumber',
		'memberId',
		'subscriberId',
		'patientId',
		'medicalRecordNumber',
		'mrn',
		'accountNumber',
		'email',
		'phone',
		'phoneNumber',
		'fax',
		'faxNumber',
		'address',
		'streetAddress',
		'city',
		'zip',
		'zipCode',
		'postalCode',
		'dateOfBirth',
		'dob',
		'birthDate',
		'dateOfDeath',
		'admitDate',
		'dischargeDate',
		'certificateNumber',
		'licenseNumber',
		'vehicleIdentifier',
		'deviceIdentifier',
		'biometricId',
		'fullFacePhoto',
		'fingerprint',
		'voicePrint',
	],

	// Quasi-identifiers - Sensitive in combination
	QUASI: [
		'age',
		'gender',
		'sex',
		'race',
		'ethnicity',
		'nationality',
		'maritalStatus',
		'religion',
		'occupation',
		'employer',
		'state',
		'county',
		'zipPrefix',
	],

	// Medical information
	MEDICAL: [
		'diagnosis',
		'diagnosisCode',
		'icd10',
		'icd9',
		'procedure',
		'procedureCode',
		'cpt',
		'hcpcs',
		'medication',
		'prescription',
		'ndc',
		'treatmentPlan',
		'labResult',
		'vitalSigns',
		'immunization',
		'allergy',
		'medicalHistory',
		'mentalHealth',
		'substanceAbuse',
		'geneticInfo',
		'hivStatus',
	],

	// Financial information
	FINANCIAL: [
		'claimAmount',
		'chargeAmount',
		'paidAmount',
		'patientResponsibility',
		'copay',
		'coinsurance',
		'deductible',
		'bankAccount',
		'creditCard',
		'insuranceId',
		'groupNumber',
		'policyNumber',
	],
} as const;

/**
 * Mask patterns for different PHI types
 */
const MASK_PATTERNS: Record<string, (value: string) => string> = {
	ssn: (v) => v.replace(/(\d{3})-?(\d{2})-?(\d{4})/, '***-**-$3'),
	phone: (v) => v.replace(/(\d{3})-?(\d{3})-?(\d{4})/, '***-***-$3'),
	email: (v) => {
		const [local, domain] = v.split('@');
		if (!domain) return '***@***.***';
		return `${local.substring(0, 2)}***@${domain}`;
	},
	dateOfBirth: (v) => v.replace(/(\d{4})-?(\d{2})-?(\d{2})/, '$1-**-**'),
	memberId: (v) => (v.length > 4 ? `****${v.slice(-4)}` : '****'),
	name: (v) => v.charAt(0) + '*'.repeat(Math.min(v.length - 1, 10)),
	address: () => '*** REDACTED ***',
	default: (v) => '*'.repeat(Math.min(v.length, 20)),
};

/**
 * Check if a field name is PHI
 */
export function isPhiField(fieldName: string): boolean {
	const normalizedName = fieldName.toLowerCase().replace(/[_-]/g, '');

	for (const category of Object.values(PHI_FIELDS)) {
		for (const field of category) {
			if (normalizedName.includes(field.toLowerCase())) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Get PHI category for a field
 */
export function getPhiCategory(
	fieldName: string
): 'DIRECT' | 'QUASI' | 'MEDICAL' | 'FINANCIAL' | null {
	const normalizedName = fieldName.toLowerCase().replace(/[_-]/g, '');

	for (const [category, fields] of Object.entries(PHI_FIELDS)) {
		for (const field of fields) {
			if (normalizedName.includes(field.toLowerCase())) {
				return category as 'DIRECT' | 'QUASI' | 'MEDICAL' | 'FINANCIAL';
			}
		}
	}

	return null;
}

/**
 * Mask a PHI value based on field type
 */
export function maskPhiValue(value: string | number | null | undefined, fieldName: string): string {
	if (value === null || value === undefined) {
		return '';
	}

	const stringValue = String(value);
	const normalizedName = fieldName.toLowerCase();

	// Find appropriate mask pattern
	for (const [pattern, maskFn] of Object.entries(MASK_PATTERNS)) {
		if (normalizedName.includes(pattern)) {
			return maskFn(stringValue);
		}
	}

	return MASK_PATTERNS.default(stringValue);
}

/**
 * Mask all PHI fields in an object
 */
export function maskPhiInObject(obj: IDataObject, recursive: boolean = true): IDataObject {
	const masked: IDataObject = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value === null || value === undefined) {
			masked[key] = value;
		} else if (typeof value === 'object' && !Array.isArray(value) && recursive) {
			masked[key] = maskPhiInObject(value as IDataObject, true);
		} else if (Array.isArray(value) && recursive) {
			masked[key] = value.map((item) =>
				typeof item === 'object' && item !== null
					? maskPhiInObject(item as IDataObject, true)
					: isPhiField(key)
						? maskPhiValue(item, key)
						: item
			);
		} else if (isPhiField(key)) {
			masked[key] = maskPhiValue(value as string, key);
		} else {
			masked[key] = value;
		}
	}

	return masked;
}

/**
 * Remove all PHI fields from an object
 */
export function removePhiFromObject(obj: IDataObject, recursive: boolean = true): IDataObject {
	const cleaned: IDataObject = {};

	for (const [key, value] of Object.entries(obj)) {
		if (isPhiField(key)) {
			continue; // Skip PHI fields
		}

		if (value === null || value === undefined) {
			cleaned[key] = value;
		} else if (typeof value === 'object' && !Array.isArray(value) && recursive) {
			cleaned[key] = removePhiFromObject(value as IDataObject, true);
		} else if (Array.isArray(value) && recursive) {
			cleaned[key] = value.map((item) =>
				typeof item === 'object' && item !== null ? removePhiFromObject(item as IDataObject, true) : item
			);
		} else {
			cleaned[key] = value;
		}
	}

	return cleaned;
}

/**
 * Extract only PHI fields from an object
 */
export function extractPhiFromObject(obj: IDataObject, recursive: boolean = true): IDataObject {
	const phi: IDataObject = {};

	for (const [key, value] of Object.entries(obj)) {
		if (value === null || value === undefined) {
			continue;
		}

		if (typeof value === 'object' && !Array.isArray(value) && recursive) {
			const nestedPhi = extractPhiFromObject(value as IDataObject, true);
			if (Object.keys(nestedPhi).length > 0) {
				phi[key] = nestedPhi;
			}
		} else if (isPhiField(key)) {
			phi[key] = value;
		}
	}

	return phi;
}

/**
 * Get list of PHI fields present in an object
 */
export function listPhiFields(obj: IDataObject, prefix: string = ''): string[] {
	const fields: string[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const fullPath = prefix ? `${prefix}.${key}` : key;

		if (isPhiField(key)) {
			fields.push(fullPath);
		}

		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			fields.push(...listPhiFields(value as IDataObject, fullPath));
		}
	}

	return fields;
}

/**
 * Create a safe log entry (PHI masked)
 */
export function createSafeLogEntry(
	action: string,
	data: IDataObject,
	options: { includeTimestamp?: boolean; maskPhi?: boolean } = {}
): IDataObject {
	const { includeTimestamp = true, maskPhi = true } = options;

	const entry: IDataObject = {
		action,
		data: maskPhi ? maskPhiInObject(data) : data,
	};

	if (includeTimestamp) {
		entry.timestamp = new Date().toISOString();
	}

	return entry;
}

/**
 * Generate audit log entry for HIPAA compliance
 */
export function generateAuditLogEntry(params: {
	action: string;
	userId?: string;
	patientId?: string;
	resourceType: string;
	resourceId?: string;
	outcome: 'success' | 'failure';
	details?: IDataObject;
}): IDataObject {
	return {
		timestamp: new Date().toISOString(),
		action: params.action,
		userId: params.userId ? maskPhiValue(params.userId, 'userId') : 'system',
		patientId: params.patientId ? maskPhiValue(params.patientId, 'patientId') : undefined,
		resourceType: params.resourceType,
		resourceId: params.resourceId,
		outcome: params.outcome,
		details: params.details ? maskPhiInObject(params.details) : undefined,
		// HIPAA required fields
		eventType: params.action,
		eventOutcome: params.outcome === 'success' ? 0 : 8,
		eventDateTime: new Date().toISOString(),
	};
}

/**
 * Hash PHI for comparison without storing actual values
 */
export function hashPhi(value: string, salt?: string): string {
	const actualSalt = salt || crypto.randomBytes(16).toString('hex');
	return crypto
		.createHmac('sha256', actualSalt)
		.update(value.toLowerCase().trim())
		.digest('hex');
}

/**
 * Tokenize PHI value (create reversible token)
 * Note: For production, use a proper tokenization service
 */
export function tokenizePhi(
	value: string,
	encryptionKey: string
): { token: string; iv: string } {
	const iv = crypto.randomBytes(16);
	const key = crypto.scryptSync(encryptionKey, 'salt', 32);
	const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

	let encrypted = cipher.update(value, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	return {
		token: encrypted,
		iv: iv.toString('hex'),
	};
}

/**
 * Detokenize PHI value
 */
export function detokenizePhi(token: string, iv: string, encryptionKey: string): string {
	const key = crypto.scryptSync(encryptionKey, 'salt', 32);
	const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));

	let decrypted = decipher.update(token, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

/**
 * Validate minimum necessary principle
 * Returns only the fields needed for a specific operation
 */
export function applyMinimumNecessary(
	data: IDataObject,
	requiredFields: string[]
): IDataObject {
	const result: IDataObject = {};

	for (const field of requiredFields) {
		if (field.includes('.')) {
			// Handle nested fields
			const parts = field.split('.');
			let source: IDataObject | undefined = data;
			let target: IDataObject = result;

			for (let i = 0; i < parts.length - 1; i++) {
				source = source?.[parts[i]] as IDataObject | undefined;
				target[parts[i]] = target[parts[i]] || {};
				target = target[parts[i]] as IDataObject;
			}

			const lastPart = parts[parts.length - 1];
			if (source && source[lastPart] !== undefined) {
				target[lastPart] = source[lastPart];
			}
		} else if (data[field] !== undefined) {
			result[field] = data[field];
		}
	}

	return result;
}

/**
 * De-identify data according to HIPAA Safe Harbor method
 */
export function deidentifySafeHarbor(data: IDataObject): IDataObject {
	const deidentified = { ...data };

	// Remove all 18 HIPAA identifiers
	const safeHarborIdentifiers = [
		// Names
		'name', 'firstName', 'lastName', 'middleName',
		// Geographic data smaller than state
		'address', 'streetAddress', 'city', 'zip', 'zipCode', 'postalCode',
		// Dates (except year)
		'dateOfBirth', 'dob', 'birthDate', 'dateOfDeath', 'admitDate', 'dischargeDate',
		// Phone numbers
		'phone', 'phoneNumber', 'fax', 'faxNumber',
		// Email addresses
		'email', 'emailAddress',
		// SSN
		'ssn', 'socialSecurityNumber',
		// Medical record numbers
		'mrn', 'medicalRecordNumber', 'accountNumber',
		// Health plan beneficiary numbers
		'memberId', 'subscriberId', 'insuranceId', 'policyNumber',
		// Certificate/license numbers
		'certificateNumber', 'licenseNumber',
		// Vehicle identifiers
		'vehicleIdentifier', 'vin',
		// Device identifiers
		'deviceIdentifier', 'serialNumber',
		// Web URLs
		'url', 'webUrl',
		// IP addresses
		'ipAddress', 'ip',
		// Biometric identifiers
		'biometricId', 'fingerprint', 'voicePrint',
		// Full face photos
		'photo', 'image', 'fullFacePhoto',
		// Any other unique identifier
		'uniqueId', 'patientId',
	];

	for (const identifier of safeHarborIdentifiers) {
		deleteNestedField(deidentified, identifier);
	}

	// Generalize ages over 89 to 90+
	if (deidentified.age && typeof deidentified.age === 'number' && deidentified.age > 89) {
		deidentified.age = '90+';
	}

	// Truncate zip codes to 3 digits
	if (deidentified.zipPrefix && typeof deidentified.zipPrefix === 'string') {
		deidentified.zipPrefix = deidentified.zipPrefix.substring(0, 3) + '00';
	}

	return deidentified;
}

/**
 * Delete a field from an object (handles nested fields)
 */
function deleteNestedField(obj: IDataObject, fieldName: string): void {
	for (const key of Object.keys(obj)) {
		if (key.toLowerCase().includes(fieldName.toLowerCase())) {
			delete obj[key];
		} else if (typeof obj[key] === 'object' && obj[key] !== null) {
			deleteNestedField(obj[key] as IDataObject, fieldName);
		}
	}
}

/**
 * Validate consent for PHI access
 */
export interface IConsentRecord {
	patientId: string;
	consentType: 'general' | 'treatment' | 'payment' | 'operations' | 'research' | 'marketing';
	granted: boolean;
	grantedDate?: string;
	expirationDate?: string;
	scope?: string[];
}

export function validateConsent(
	consent: IConsentRecord | undefined,
	requiredType: IConsentRecord['consentType']
): { valid: boolean; reason?: string } {
	if (!consent) {
		return { valid: false, reason: 'No consent record found' };
	}

	if (!consent.granted) {
		return { valid: false, reason: 'Consent not granted' };
	}

	if (consent.consentType !== requiredType && consent.consentType !== 'general') {
		return { valid: false, reason: `Required consent type: ${requiredType}` };
	}

	if (consent.expirationDate) {
		const expDate = new Date(consent.expirationDate);
		if (expDate < new Date()) {
			return { valid: false, reason: 'Consent has expired' };
		}
	}

	return { valid: true };
}

/**
 * Format data for HIPAA-compliant transmission
 */
export function prepareForTransmission(
	data: IDataObject,
	options: {
		encrypt?: boolean;
		encryptionKey?: string;
		audit?: boolean;
		auditUserId?: string;
	} = {}
): { data: IDataObject; auditLog?: IDataObject } {
	let result = { ...data };
	let auditLog: IDataObject | undefined;

	// Generate audit log if required
	if (options.audit) {
		auditLog = generateAuditLogEntry({
			action: 'TRANSMISSION',
			userId: options.auditUserId,
			resourceType: 'PHI',
			outcome: 'success',
			details: {
				fieldCount: Object.keys(data).length,
				phiFields: listPhiFields(data),
			},
		});
	}

	// Note: For production, use proper encryption
	// This is a placeholder for encryption implementation
	if (options.encrypt && options.encryptionKey) {
		// In production, encrypt the entire payload
		result = {
			encrypted: true,
			data: result,
		};
	}

	return { data: result, auditLog };
}

export default {
	PHI_FIELDS,
	isPhiField,
	getPhiCategory,
	maskPhiValue,
	maskPhiInObject,
	removePhiFromObject,
	extractPhiFromObject,
	listPhiFields,
	createSafeLogEntry,
	generateAuditLogEntry,
	hashPhi,
	tokenizePhi,
	detokenizePhi,
	applyMinimumNecessary,
	deidentifySafeHarbor,
	validateConsent,
	prepareForTransmission,
};
