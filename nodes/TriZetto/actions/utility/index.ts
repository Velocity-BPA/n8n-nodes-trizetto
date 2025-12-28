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
import { validateNpi, validateTaxId, validateIcd10, validateCpt, validateHcpcs } from '../../utils/validationUtils';
import {
	getCarcDescription,
	getRarcDescription,
	getPlaceOfServiceDescription,
	getTaxonomyDescription,
	searchCodesByDescription,
	getAllCodes,
	getCommonDenialReasons,
} from '../../utils/codeUtils';
import { PLACE_OF_SERVICE_CODES, TAXONOMY_CODES, SERVICE_TYPE_CODES } from '../../constants/transactionTypes';
import { CARC_CODES, RARC_CODES, ADJUSTMENT_GROUPS } from '../../constants/adjustmentCodes';
import { createSafeLogEntry } from '../../utils/hipaaUtils';

/**
 * Utility Resource
 * 
 * Provides utility functions for healthcare data validation,
 * code lookups, and connection testing.
 */

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['utility'],
			},
		},
		options: [
			{
				name: 'Validate NPI',
				value: 'validateNpi',
				description: 'Validate a National Provider Identifier (NPI)',
				action: 'Validate NPI',
			},
			{
				name: 'Validate Tax ID',
				value: 'validateTaxId',
				description: 'Validate a Tax Identification Number (EIN or SSN)',
				action: 'Validate tax ID',
			},
			{
				name: 'Get Place of Service Codes',
				value: 'getPlaceOfServiceCodes',
				description: 'Get list of CMS Place of Service codes',
				action: 'Get place of service codes',
			},
			{
				name: 'Get Taxonomy Codes',
				value: 'getTaxonomyCodes',
				description: 'Get healthcare provider taxonomy codes',
				action: 'Get taxonomy codes',
			},
			{
				name: 'Get Adjustment Reason Codes',
				value: 'getAdjustmentCodes',
				description: 'Get Claim Adjustment Reason Codes (CARC)',
				action: 'Get adjustment reason codes',
			},
			{
				name: 'Get Remark Codes',
				value: 'getRemarkCodes',
				description: 'Get Remittance Advice Remark Codes (RARC)',
				action: 'Get remark codes',
			},
			{
				name: 'Get Service Type Codes',
				value: 'getServiceTypeCodes',
				description: 'Get healthcare service type codes',
				action: 'Get service type codes',
			},
			{
				name: 'Search Codes',
				value: 'searchCodes',
				description: 'Search for codes by description',
				action: 'Search codes',
			},
			{
				name: 'Validate Medical Code',
				value: 'validateMedicalCode',
				description: 'Validate ICD-10, CPT, or HCPCS codes',
				action: 'Validate medical code',
			},
			{
				name: 'Get Common Denial Reasons',
				value: 'getDenialReasons',
				description: 'Get common claim denial reasons and required actions',
				action: 'Get common denial reasons',
			},
			{
				name: 'Test Connection',
				value: 'testConnection',
				description: 'Test connection to TriZetto services',
				action: 'Test connection',
			},
			{
				name: 'Get API Status',
				value: 'getApiStatus',
				description: 'Get TriZetto API status and availability',
				action: 'Get API status',
			},
		],
		default: 'validateNpi',
	},
];

export const utilityFields: INodeProperties[] = [
	// NPI Validation
	{
		displayName: 'NPI',
		name: 'npi',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateNpi'],
			},
		},
		default: '',
		placeholder: '1234567890',
		description: 'The 10-digit National Provider Identifier to validate',
	},

	// Tax ID Validation
	{
		displayName: 'Tax ID',
		name: 'taxId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateTaxId'],
			},
		},
		default: '',
		placeholder: '12-3456789',
		description: 'The Tax ID (EIN or SSN) to validate',
	},
	{
		displayName: 'Tax ID Type',
		name: 'taxIdType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateTaxId'],
			},
		},
		options: [
			{ name: 'EIN (Employer Identification Number)', value: 'EIN' },
			{ name: 'SSN (Social Security Number)', value: 'SSN' },
			{ name: 'Auto-Detect', value: 'auto' },
		],
		default: 'auto',
		description: 'Type of Tax ID',
	},

	// Code search
	{
		displayName: 'Search Query',
		name: 'searchQuery',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['searchCodes'],
			},
		},
		default: '',
		placeholder: 'denied',
		description: 'Text to search for in code descriptions',
	},
	{
		displayName: 'Code Type',
		name: 'codeType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['searchCodes'],
			},
		},
		options: [
			{ name: 'All Types', value: 'all' },
			{ name: 'Adjustment Reason (CARC)', value: 'carc' },
			{ name: 'Remark (RARC)', value: 'rarc' },
			{ name: 'Place of Service', value: 'pos' },
			{ name: 'Taxonomy', value: 'taxonomy' },
			{ name: 'Service Type', value: 'serviceType' },
		],
		default: 'all',
		description: 'Type of codes to search',
	},

	// Medical code validation
	{
		displayName: 'Medical Code',
		name: 'medicalCode',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateMedicalCode'],
			},
		},
		default: '',
		placeholder: 'J45.909 or 99213',
		description: 'The medical code to validate',
	},
	{
		displayName: 'Medical Code Type',
		name: 'medicalCodeType',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['validateMedicalCode'],
			},
		},
		options: [
			{ name: 'ICD-10 (Diagnosis)', value: 'icd10' },
			{ name: 'CPT (Procedure)', value: 'cpt' },
			{ name: 'HCPCS (Healthcare Common)', value: 'hcpcs' },
		],
		default: 'icd10',
		description: 'Type of medical code',
	},

	// Filter options for code lists
	{
		displayName: 'Filter',
		name: 'filter',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getPlaceOfServiceCodes', 'getTaxonomyCodes', 'getAdjustmentCodes', 'getRemarkCodes', 'getServiceTypeCodes'],
			},
		},
		default: '',
		placeholder: 'office',
		description: 'Filter codes by description (optional)',
	},

	// Limit for results
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['utility'],
				operation: ['getPlaceOfServiceCodes', 'getTaxonomyCodes', 'getAdjustmentCodes', 'getRemarkCodes', 'getServiceTypeCodes', 'searchCodes'],
			},
		},
		default: 100,
		description: 'Maximum number of results to return',
	},
];

/**
 * Execute Utility operations
 */
export async function executeUtilityOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	try {
		switch (operation) {
			case 'validateNpi': {
				const npi = this.getNodeParameter('npi', index) as string;
				const result = validateNpi(npi);

				return [
					{
						json: {
							success: true,
							operation: 'validateNpi',
							npi: result.sanitized || npi,
							valid: result.valid,
							errors: result.errors,
							warnings: result.warnings,
							format: 'Standard NPI (10 digits with Luhn check)',
						},
					},
				];
			}

			case 'validateTaxId': {
				const taxId = this.getNodeParameter('taxId', index) as string;
				const taxIdType = this.getNodeParameter('taxIdType', index) as string;
				
				const result = validateTaxId(taxId, taxIdType !== 'auto' ? taxIdType : undefined);

				return [
					{
						json: {
							success: true,
							operation: 'validateTaxId',
							taxId: result.sanitized || taxId,
							valid: result.valid,
							type: taxIdType,
							errors: result.errors,
							warnings: result.warnings,
						},
					},
				];
			}

			case 'getPlaceOfServiceCodes': {
				const filter = this.getNodeParameter('filter', index, '') as string;
				const limit = this.getNodeParameter('limit', index, 100) as number;

				let codes = Object.entries(PLACE_OF_SERVICE_CODES).map(([code, description]) => ({
					code,
					description,
				}));

				if (filter) {
					const filterLower = filter.toLowerCase();
					codes = codes.filter(
						(c) =>
							c.code.toLowerCase().includes(filterLower) ||
							c.description.toLowerCase().includes(filterLower),
					);
				}

				codes = codes.slice(0, limit);

				return codes.map((code) => ({
					json: code,
				}));
			}

			case 'getTaxonomyCodes': {
				const filter = this.getNodeParameter('filter', index, '') as string;
				const limit = this.getNodeParameter('limit', index, 100) as number;

				let codes = Object.entries(TAXONOMY_CODES).map(([code, description]) => ({
					code,
					description,
				}));

				if (filter) {
					const filterLower = filter.toLowerCase();
					codes = codes.filter(
						(c) =>
							c.code.toLowerCase().includes(filterLower) ||
							c.description.toLowerCase().includes(filterLower),
					);
				}

				codes = codes.slice(0, limit);

				return codes.map((code) => ({
					json: code,
				}));
			}

			case 'getAdjustmentCodes': {
				const filter = this.getNodeParameter('filter', index, '') as string;
				const limit = this.getNodeParameter('limit', index, 100) as number;

				let codes = Object.entries(CARC_CODES).map(([code, description]) => ({
					code,
					description,
					type: 'CARC',
				}));

				if (filter) {
					const filterLower = filter.toLowerCase();
					codes = codes.filter(
						(c) =>
							c.code.toLowerCase().includes(filterLower) ||
							c.description.toLowerCase().includes(filterLower),
					);
				}

				codes = codes.slice(0, limit);

				return codes.map((code) => ({
					json: code,
				}));
			}

			case 'getRemarkCodes': {
				const filter = this.getNodeParameter('filter', index, '') as string;
				const limit = this.getNodeParameter('limit', index, 100) as number;

				let codes = Object.entries(RARC_CODES).map(([code, description]) => ({
					code,
					description,
					type: 'RARC',
				}));

				if (filter) {
					const filterLower = filter.toLowerCase();
					codes = codes.filter(
						(c) =>
							c.code.toLowerCase().includes(filterLower) ||
							c.description.toLowerCase().includes(filterLower),
					);
				}

				codes = codes.slice(0, limit);

				return codes.map((code) => ({
					json: code,
				}));
			}

			case 'getServiceTypeCodes': {
				const filter = this.getNodeParameter('filter', index, '') as string;
				const limit = this.getNodeParameter('limit', index, 100) as number;

				let codes = Object.entries(SERVICE_TYPE_CODES).map(([code, description]) => ({
					code,
					description,
				}));

				if (filter) {
					const filterLower = filter.toLowerCase();
					codes = codes.filter(
						(c) =>
							c.code.toLowerCase().includes(filterLower) ||
							c.description.toLowerCase().includes(filterLower),
					);
				}

				codes = codes.slice(0, limit);

				return codes.map((code) => ({
					json: code,
				}));
			}

			case 'searchCodes': {
				const searchQuery = this.getNodeParameter('searchQuery', index) as string;
				const codeType = this.getNodeParameter('codeType', index) as string;
				const limit = this.getNodeParameter('limit', index, 100) as number;

				let results = searchCodesByDescription(searchQuery, limit);

				if (codeType !== 'all') {
					results = results.filter((r) => r.type.toLowerCase() === codeType.toLowerCase());
				}

				return results.map((result) => ({
					json: result,
				}));
			}

			case 'validateMedicalCode': {
				const medicalCode = this.getNodeParameter('medicalCode', index) as string;
				const medicalCodeType = this.getNodeParameter('medicalCodeType', index) as string;

				let result;
				switch (medicalCodeType) {
					case 'icd10':
						result = validateIcd10(medicalCode);
						break;
					case 'cpt':
						result = validateCpt(medicalCode);
						break;
					case 'hcpcs':
						result = validateHcpcs(medicalCode);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown code type: ${medicalCodeType}`);
				}

				return [
					{
						json: {
							success: true,
							operation: 'validateMedicalCode',
							code: result.sanitized || medicalCode,
							codeType: medicalCodeType,
							valid: result.valid,
							errors: result.errors,
							warnings: result.warnings,
						},
					},
				];
			}

			case 'getDenialReasons': {
				const denialReasons = getCommonDenialReasons();

				return denialReasons.map((reason) => ({
					json: reason,
				}));
			}

			case 'testConnection': {
				const credentials = await this.getCredentials('triZettoApi');

				const client = new TriZettoClient({
					baseUrl: credentials.baseUrl as string,
					clientId: credentials.clientId as string,
					clientSecret: credentials.clientSecret as string,
					username: credentials.username as string,
					password: credentials.password as string,
					submitterId: credentials.submitterId as string,
				});

				try {
					// Test by attempting to get an access token
					await client.get('/health');
					
					return [
						{
							json: {
								success: true,
								operation: 'testConnection',
								status: 'connected',
								environment: credentials.environment || 'production',
								baseUrl: credentials.baseUrl,
								testedAt: new Date().toISOString(),
							},
						},
					];
				} catch (error) {
					return [
						{
							json: {
								success: false,
								operation: 'testConnection',
								status: 'failed',
								error: error instanceof Error ? error.message : 'Connection failed',
								environment: credentials.environment || 'production',
								baseUrl: credentials.baseUrl,
								testedAt: new Date().toISOString(),
							},
						},
					];
				}
			}

			case 'getApiStatus': {
				const credentials = await this.getCredentials('triZettoApi');

				const client = new TriZettoClient({
					baseUrl: credentials.baseUrl as string,
					clientId: credentials.clientId as string,
					clientSecret: credentials.clientSecret as string,
					username: credentials.username as string,
					password: credentials.password as string,
					submitterId: credentials.submitterId as string,
				});

				try {
					const response = await client.get('/status');

					return [
						{
							json: {
								success: true,
								operation: 'getApiStatus',
								...response,
								checkedAt: new Date().toISOString(),
							},
						},
					];
				} catch (error) {
					// Return status info even if the endpoint isn't available
					return [
						{
							json: {
								success: true,
								operation: 'getApiStatus',
								status: 'unknown',
								message: 'Status endpoint not available',
								environment: credentials.environment || 'production',
								baseUrl: credentials.baseUrl,
								checkedAt: new Date().toISOString(),
							},
						},
					];
				}
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}
	} catch (error) {
		const safeError = createSafeLogEntry('Utility operation failed', {
			operation,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw new NodeOperationError(this.getNode(), safeError.message);
	}
}
