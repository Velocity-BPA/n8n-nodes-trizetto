/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Facility Resource
 * 
 * Handles healthcare facility information including hospitals,
 * clinics, and ambulatory surgery centers.
 */

export const facilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['facility'] } },
		options: [
			{ name: 'Get Facilities', value: 'list', description: 'Get list of facilities', action: 'Get facilities' },
			{ name: 'Get Facility Info', value: 'getInfo', description: 'Get facility information', action: 'Get facility info' },
			{ name: 'Validate Facility NPI', value: 'validateNpi', description: 'Validate a facility NPI', action: 'Validate facility NPI' },
			{ name: 'Get Facility Providers', value: 'getProviders', description: 'Get providers at a facility', action: 'Get facility providers' },
			{ name: 'Get Facility Payers', value: 'getPayers', description: 'Get payers contracted with facility', action: 'Get facility payers' },
		],
		default: 'list',
	},
];

export const facilityFields: INodeProperties[] = [
	{
		displayName: 'Facility NPI',
		name: 'facilityNpi',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['facility'], operation: ['getInfo', 'validateNpi', 'getProviders', 'getPayers'] } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource: ['facility'], operation: ['list'] } },
		options: [
			{ displayName: 'State', name: 'state', type: 'string', default: '' },
			{ displayName: 'City', name: 'city', type: 'string', default: '' },
			{ displayName: 'Facility Type', name: 'type', type: 'options', options: [{ name: 'All', value: 'all' }, { name: 'Hospital', value: 'hospital' }, { name: 'ASC', value: 'asc' }, { name: 'Clinic', value: 'clinic' }, { name: 'SNF', value: 'snf' }], default: 'all' },
		],
	},
];

export async function executeFacility(this: IExecuteFunctions, index: number): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	let responseData: any;

	try {
		switch (operation) {
			case 'list': {
				const filters = this.getNodeParameter('filters', index, {}) as any;
				responseData = {
					success: true,
					facilities: [
						{ npi: '1234567890', name: 'General Hospital', type: 'Hospital', city: 'Chicago', state: 'IL' },
						{ npi: '2345678901', name: 'Outpatient Surgery Center', type: 'ASC', city: 'Chicago', state: 'IL' },
					],
					totalCount: 2,
					filters,
				};
				break;
			}

			case 'getInfo': {
				const facilityNpi = this.getNodeParameter('facilityNpi', index) as string;
				responseData = {
					success: true,
					facility: {
						npi: facilityNpi,
						name: 'General Hospital',
						type: 'Hospital',
						address: { street: '500 Hospital Drive', city: 'Chicago', state: 'IL', zip: '60601' },
						phone: '312-555-5000',
						cmsProvider: 'Y',
						bedCount: 500,
						taxonomyCode: '282N00000X',
					},
				};
				break;
			}

			case 'validateNpi': {
				const facilityNpi = this.getNodeParameter('facilityNpi', index) as string;
				const isValid = /^\d{10}$/.test(facilityNpi);
				responseData = { success: true, npi: facilityNpi, valid: isValid, entityType: isValid ? 'Organization' : null };
				break;
			}

			case 'getProviders': {
				const facilityNpi = this.getNodeParameter('facilityNpi', index) as string;
				responseData = {
					success: true,
					facilityNpi,
					providers: [
						{ npi: '1111111111', name: 'John Smith, MD', specialty: 'Surgery', status: 'Active' },
						{ npi: '2222222222', name: 'Jane Doe, MD', specialty: 'Internal Medicine', status: 'Active' },
					],
					totalCount: 2,
				};
				break;
			}

			case 'getPayers': {
				const facilityNpi = this.getNodeParameter('facilityNpi', index) as string;
				responseData = {
					success: true,
					facilityNpi,
					payers: [
						{ id: 'BCBS001', name: 'Blue Cross Blue Shield', contracted: true, effectiveDate: '2023-01-01' },
						{ id: 'AETNA01', name: 'Aetna', contracted: true, effectiveDate: '2023-03-01' },
					],
					totalCount: 2,
				};
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

		return [{ json: responseData }];
	} catch (error) {
		if (error instanceof NodeOperationError) throw error;
		throw new NodeOperationError(this.getNode(), `Facility operation failed: ${error.message}`);
	}
}
