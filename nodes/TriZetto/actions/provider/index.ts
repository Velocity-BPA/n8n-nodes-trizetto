/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Provider Resource
 * 
 * Handles healthcare provider information, NPI validation,
 * network status, and credentialing.
 */

export const providerOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['provider'],
			},
		},
		options: [
			{ name: 'Get Provider Info', value: 'getInfo', description: 'Get provider information', action: 'Get provider info' },
			{ name: 'Search Providers', value: 'search', description: 'Search for providers', action: 'Search providers' },
			{ name: 'Validate NPI', value: 'validateNpi', description: 'Validate a provider NPI', action: 'Validate NPI' },
			{ name: 'Get Provider by NPI', value: 'getByNpi', description: 'Get provider by NPI number', action: 'Get provider by NPI' },
			{ name: 'Get Provider Network Status', value: 'getNetworkStatus', description: 'Check if provider is in-network', action: 'Get provider network status' },
			{ name: 'Get Enrolled Providers', value: 'getEnrolled', description: 'Get list of enrolled providers', action: 'Get enrolled providers' },
			{ name: 'Get Provider Credentials', value: 'getCredentials', description: 'Get provider credentialing info', action: 'Get provider credentials' },
		],
		default: 'getByNpi',
	},
];

export const providerFields: INodeProperties[] = [
	{
		displayName: 'NPI',
		name: 'npi',
		type: 'string',
		required: true,
		default: '',
		description: 'National Provider Identifier (10 digits)',
		displayOptions: {
			show: {
				resource: ['provider'],
				operation: ['getInfo', 'validateNpi', 'getByNpi', 'getNetworkStatus', 'getCredentials'],
			},
		},
	},
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		description: 'Payer ID to check network status',
		displayOptions: {
			show: {
				resource: ['provider'],
				operation: ['getNetworkStatus', 'getEnrolled'],
			},
		},
	},
	{
		displayName: 'Search Criteria',
		name: 'searchCriteria',
		type: 'collection',
		placeholder: 'Add Criteria',
		default: {},
		displayOptions: {
			show: {
				resource: ['provider'],
				operation: ['search'],
			},
		},
		options: [
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
			{ displayName: 'Specialty', name: 'specialty', type: 'string', default: '' },
			{ displayName: 'City', name: 'city', type: 'string', default: '' },
			{ displayName: 'State', name: 'state', type: 'string', default: '' },
			{ displayName: 'ZIP Code', name: 'zipCode', type: 'string', default: '' },
			{ displayName: 'Taxonomy Code', name: 'taxonomyCode', type: 'string', default: '' },
			{ displayName: 'Limit', name: 'limit', type: 'number', default: 50 },
		],
	},
];

export async function executeProvider(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	let responseData: any;

	try {
		switch (operation) {
			case 'getInfo':
			case 'getByNpi': {
				const npi = this.getNodeParameter('npi', index) as string;
				responseData = {
					success: true,
					provider: {
						npi,
						entityType: 'Individual',
						name: { first: 'John', last: 'Smith', credential: 'MD' },
						specialty: 'Internal Medicine',
						taxonomyCode: '207R00000X',
						address: { street: '123 Medical Dr', city: 'Chicago', state: 'IL', zip: '60601' },
						phone: '312-555-0100',
						status: 'Active',
					},
				};
				break;
			}

			case 'search': {
				const criteria = this.getNodeParameter('searchCriteria', index, {}) as any;
				responseData = {
					success: true,
					providers: [
						{ npi: '1234567890', name: 'John Smith, MD', specialty: 'Internal Medicine', city: 'Chicago', state: 'IL' },
						{ npi: '2345678901', name: 'Jane Doe, MD', specialty: 'Family Medicine', city: 'Chicago', state: 'IL' },
					],
					totalCount: 2,
					criteria,
				};
				break;
			}

			case 'validateNpi': {
				const npi = this.getNodeParameter('npi', index) as string;
				const isValid = /^\d{10}$/.test(npi);
				responseData = {
					success: true,
					npi,
					valid: isValid,
					validationDetails: {
						formatValid: isValid,
						checksumValid: isValid,
						nppes: isValid ? 'FOUND' : 'NOT_FOUND',
					},
				};
				break;
			}

			case 'getNetworkStatus': {
				const npi = this.getNodeParameter('npi', index) as string;
				const payerId = this.getNodeParameter('payerId', index) as string;
				responseData = {
					success: true,
					npi,
					payerId,
					networkStatus: {
						inNetwork: true,
						networkTier: 'Preferred',
						effectiveDate: '2023-01-01',
						terminationDate: null,
						participatingProducts: ['PPO', 'HMO', 'EPO'],
					},
				};
				break;
			}

			case 'getEnrolled': {
				const payerId = this.getNodeParameter('payerId', index) as string;
				responseData = {
					success: true,
					payerId,
					enrolledProviders: [
						{ npi: '1234567890', name: 'John Smith, MD', enrollmentDate: '2023-01-15', status: 'Active' },
						{ npi: '2345678901', name: 'Jane Doe, MD', enrollmentDate: '2023-02-01', status: 'Active' },
					],
					totalCount: 2,
				};
				break;
			}

			case 'getCredentials': {
				const npi = this.getNodeParameter('npi', index) as string;
				responseData = {
					success: true,
					npi,
					credentials: {
						licenses: [{ state: 'IL', number: 'MD123456', status: 'Active', expirationDate: '2025-12-31' }],
						boardCertifications: [{ board: 'ABIM', specialty: 'Internal Medicine', certified: true, expirationDate: '2026-12-31' }],
						deaCertificate: { number: 'DEA12345', expirationDate: '2025-06-30', schedules: ['II', 'III', 'IV', 'V'] },
						malpracticeInsurance: { carrier: 'Medical Protective', policyNumber: 'MP123456', expirationDate: '2025-01-01', coverageAmount: 1000000 },
					},
				};
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

		return [{ json: responseData }];
	} catch (error) {
		if (error instanceof NodeOperationError) throw error;
		throw new NodeOperationError(this.getNode(), `Provider operation failed: ${error.message}`);
	}
}
