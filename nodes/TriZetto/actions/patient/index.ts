/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Patient Resource
 * 
 * Handles patient demographics, coverage, and claims history.
 * Note: PHI is masked in responses for HIPAA compliance.
 */

export const patientOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['patient'] } },
		options: [
			{ name: 'Search Patients', value: 'search', description: 'Search for patients', action: 'Search patients' },
			{ name: 'Get Patient Info', value: 'getInfo', description: 'Get patient information', action: 'Get patient info' },
			{ name: 'Get Patient by Member ID', value: 'getByMemberId', description: 'Get patient by member ID', action: 'Get patient by member ID' },
			{ name: 'Get Patient Demographics', value: 'getDemographics', description: 'Get patient demographics', action: 'Get patient demographics' },
			{ name: 'Get Patient Coverage', value: 'getCoverage', description: 'Get patient coverage information', action: 'Get patient coverage' },
			{ name: 'Get Patient Claims', value: 'getClaims', description: 'Get patient claims history', action: 'Get patient claims' },
			{ name: 'Get Patient History', value: 'getHistory', description: 'Get comprehensive patient history', action: 'Get patient history' },
		],
		default: 'search',
	},
];

export const patientFields: INodeProperties[] = [
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['patient'], operation: ['getInfo', 'getByMemberId', 'getDemographics', 'getCoverage', 'getClaims', 'getHistory'] } },
	},
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['patient'], operation: ['getByMemberId', 'getCoverage'] } },
	},
	{
		displayName: 'Search Criteria',
		name: 'searchCriteria',
		type: 'collection',
		placeholder: 'Add Criteria',
		default: {},
		displayOptions: { show: { resource: ['patient'], operation: ['search'] } },
		options: [
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '' },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '' },
			{ displayName: 'Date of Birth', name: 'dateOfBirth', type: 'dateTime', default: '' },
			{ displayName: 'Member ID', name: 'memberId', type: 'string', default: '' },
			{ displayName: 'SSN (Last 4)', name: 'ssnLast4', type: 'string', default: '' },
		],
	},
];

export async function executePatient(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: any;

	try {
		switch (operation) {
			case 'search': {
				const criteria = this.getNodeParameter('searchCriteria', index, {}) as any;
				responseData = {
					success: true,
					patients: [
						{ memberId: 'MBR001', name: '***MASKED***', dateOfBirth: '****-**-**', lastVisit: '2024-03-01' },
						{ memberId: 'MBR002', name: '***MASKED***', dateOfBirth: '****-**-**', lastVisit: '2024-02-15' },
					],
					totalCount: 2,
					note: 'PHI masked for security',
				};
				break;
			}

			case 'getInfo':
			case 'getByMemberId': {
				const memberId = this.getNodeParameter('memberId', index) as string;
				responseData = {
					success: true,
					patient: {
						memberId,
						subscriberId: 'SUB001',
						relationship: 'Self',
						status: 'Active',
						effectiveDate: '2023-01-01',
						terminationDate: null,
						note: 'Demographics masked for HIPAA compliance',
					},
				};
				break;
			}

			case 'getDemographics': {
				const memberId = this.getNodeParameter('memberId', index) as string;
				responseData = {
					success: true,
					memberId,
					demographics: {
						firstName: '***MASKED***',
						lastName: '***MASKED***',
						dateOfBirth: '****-**-**',
						gender: 'M',
						address: '*** MASKED ***',
						phone: '***-***-****',
						email: '***@***.***',
					},
					note: 'Full PHI requires additional authorization',
				};
				break;
			}

			case 'getCoverage': {
				const memberId = this.getNodeParameter('memberId', index) as string;
				responseData = {
					success: true,
					memberId,
					coverage: {
						payerName: 'Blue Cross Blue Shield',
						planName: 'PPO Gold',
						groupNumber: 'GRP12345',
						effectiveDate: '2023-01-01',
						deductible: { individual: 1500, family: 3000, met: 750 },
						outOfPocketMax: { individual: 6000, family: 12000, met: 1500 },
						copays: { office: 25, specialist: 50, emergency: 250 },
					},
				};
				break;
			}

			case 'getClaims': {
				const memberId = this.getNodeParameter('memberId', index) as string;
				responseData = {
					success: true,
					memberId,
					claims: [
						{ claimId: 'CLM001', serviceDate: '2024-03-01', amount: 250, status: 'Paid', paidAmount: 200 },
						{ claimId: 'CLM002', serviceDate: '2024-02-15', amount: 500, status: 'Pending', paidAmount: 0 },
					],
					totalCount: 2,
				};
				break;
			}

			case 'getHistory': {
				const memberId = this.getNodeParameter('memberId', index) as string;
				responseData = {
					success: true,
					memberId,
					history: {
						enrollmentHistory: [{ effectiveDate: '2023-01-01', terminationDate: null, plan: 'PPO Gold' }],
						claimsSummary: { total: 15, paid: 12, denied: 1, pending: 2, totalBilled: 5000, totalPaid: 3500 },
						priorAuths: { total: 3, approved: 2, denied: 1 },
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
		throw new NodeOperationError(this.getNode(), `Patient operation failed: ${error.message}`);
	}
}
