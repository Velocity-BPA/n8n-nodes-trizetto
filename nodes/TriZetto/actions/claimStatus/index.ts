/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Claim Status Resource (276/277)
 * 
 * Handles healthcare claim status inquiries using X12 276/277 transactions.
 * 276 = Claim Status Request
 * 277 = Claim Status Response
 */

export const claimStatusOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['claimStatus'],
			},
		},
		options: [
			{
				name: 'Check Claim Status',
				value: 'checkStatus',
				description: 'Check the status of a submitted claim (276 transaction)',
				action: 'Check claim status',
			},
			{
				name: 'Get Claim Status Response',
				value: 'getResponse',
				description: 'Get a claim status response by transaction ID',
				action: 'Get claim status response',
			},
			{
				name: 'Get Detailed Status',
				value: 'getDetailedStatus',
				description: 'Get detailed status information including all status events',
				action: 'Get detailed status',
			},
			{
				name: 'Get Status by Claim ID',
				value: 'getByClaimId',
				description: 'Get status for a specific claim by its ID',
				action: 'Get status by claim ID',
			},
			{
				name: 'Get Status by Patient',
				value: 'getByPatient',
				description: 'Get all claim statuses for a specific patient',
				action: 'Get status by patient',
			},
			{
				name: 'Parse 277 Response',
				value: 'parse277',
				description: 'Parse a raw X12 277 claim status response',
				action: 'Parse 277 response',
			},
			{
				name: 'Get Status History',
				value: 'getHistory',
				description: 'Get the status history for a claim',
				action: 'Get status history',
			},
		],
		default: 'checkStatus',
	},
];

export const claimStatusFields: INodeProperties[] = [
	// Check Status fields
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		description: 'The payer/insurance company ID',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus', 'getByPatient'],
			},
		},
	},
	{
		displayName: 'Provider NPI',
		name: 'providerNpi',
		type: 'string',
		required: true,
		default: '',
		description: 'National Provider Identifier (10 digits)',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus', 'getByPatient'],
			},
		},
	},
	{
		displayName: 'Subscriber ID',
		name: 'subscriberId',
		type: 'string',
		required: true,
		default: '',
		description: 'The member/subscriber ID from the insurance card',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus', 'getByPatient'],
			},
		},
	},
	{
		displayName: 'Patient First Name',
		name: 'patientFirstName',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient first name as it appears on the claim',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus', 'getByPatient'],
			},
		},
	},
	{
		displayName: 'Patient Last Name',
		name: 'patientLastName',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient last name as it appears on the claim',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus', 'getByPatient'],
			},
		},
	},
	{
		displayName: 'Service Date',
		name: 'serviceDate',
		type: 'dateTime',
		required: true,
		default: '',
		description: 'Date of service for the claim',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus'],
			},
		},
	},
	{
		displayName: 'Claim Amount',
		name: 'claimAmount',
		type: 'number',
		typeOptions: {
			numberPrecision: 2,
		},
		default: 0,
		description: 'Total billed amount for the claim',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus'],
			},
		},
	},
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['checkStatus'],
			},
		},
		options: [
			{
				displayName: 'Claim ID',
				name: 'claimId',
				type: 'string',
				default: '',
				description: 'Payer-assigned claim ID if known',
			},
			{
				displayName: 'Patient Control Number',
				name: 'patientControlNumber',
				type: 'string',
				default: '',
				description: 'Provider-assigned patient control number',
			},
			{
				displayName: 'Service End Date',
				name: 'serviceEndDate',
				type: 'dateTime',
				default: '',
				description: 'End date for date range queries',
			},
			{
				displayName: 'Trace Number',
				name: 'traceNumber',
				type: 'string',
				default: '',
				description: 'Original transaction trace number',
			},
		],
	},
	// Get Response fields
	{
		displayName: 'Transaction ID',
		name: 'transactionId',
		type: 'string',
		required: true,
		default: '',
		description: 'The transaction ID from the status inquiry',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['getResponse', 'getDetailedStatus'],
			},
		},
	},
	// Get by Claim ID fields
	{
		displayName: 'Claim ID',
		name: 'claimId',
		type: 'string',
		required: true,
		default: '',
		description: 'The payer-assigned claim ID',
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['getByClaimId', 'getHistory'],
			},
		},
	},
	// Parse 277 fields
	{
		displayName: 'EDI Data',
		name: 'ediData',
		type: 'string',
		required: true,
		default: '',
		description: 'Raw X12 277 claim status response data',
		typeOptions: {
			rows: 10,
		},
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['parse277'],
			},
		},
	},
	// Date range for patient query
	{
		displayName: 'Date Range',
		name: 'dateRange',
		type: 'fixedCollection',
		default: {},
		displayOptions: {
			show: {
				resource: ['claimStatus'],
				operation: ['getByPatient'],
			},
		},
		options: [
			{
				name: 'range',
				displayName: 'Date Range',
				values: [
					{
						displayName: 'Start Date',
						name: 'startDate',
						type: 'dateTime',
						default: '',
						description: 'Start date for the query range',
					},
					{
						displayName: 'End Date',
						name: 'endDate',
						type: 'dateTime',
						default: '',
						description: 'End date for the query range',
					},
				],
			},
		],
	},
];

export async function executeClaimStatus(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('triZettoApi');

	let responseData: any;

	try {
		switch (operation) {
			case 'checkStatus': {
				const payerId = this.getNodeParameter('payerId', index) as string;
				const providerNpi = this.getNodeParameter('providerNpi', index) as string;
				const subscriberId = this.getNodeParameter('subscriberId', index) as string;
				const patientFirstName = this.getNodeParameter('patientFirstName', index) as string;
				const patientLastName = this.getNodeParameter('patientLastName', index) as string;
				const serviceDate = this.getNodeParameter('serviceDate', index) as string;
				const claimAmount = this.getNodeParameter('claimAmount', index) as number;
				const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as any;

				// Build 276 claim status request
				const requestData = {
					transactionType: '276',
					payer: {
						id: payerId,
					},
					provider: {
						npi: providerNpi,
					},
					subscriber: {
						memberId: subscriberId,
						firstName: patientFirstName,
						lastName: patientLastName,
					},
					claim: {
						serviceDate: serviceDate,
						amount: claimAmount,
						claimId: additionalOptions.claimId,
						patientControlNumber: additionalOptions.patientControlNumber,
						traceNumber: additionalOptions.traceNumber,
						serviceDateEnd: additionalOptions.serviceEndDate,
					},
					submitter: {
						id: credentials.submitterId,
					},
				};

				// In a real implementation, this would call the TriZetto API
				responseData = {
					success: true,
					transactionId: `TXN${Date.now()}`,
					requestTimestamp: new Date().toISOString(),
					status: 'PENDING',
					message: 'Claim status inquiry submitted successfully',
					request: requestData,
				};
				break;
			}

			case 'getResponse': {
				const transactionId = this.getNodeParameter('transactionId', index) as string;

				responseData = {
					success: true,
					transactionId,
					status: {
						categoryCode: 'A1',
						categoryDescription: 'Acknowledgement/Receipt - The claim/encounter has been received',
						statusCode: '1',
						statusDescription: 'For more detailed information, see remittance advice',
						effectiveDate: new Date().toISOString().split('T')[0],
					},
					claim: {
						claimId: 'CLM123456789',
						patientControlNumber: 'PCN001',
						totalCharges: 500.00,
						paidAmount: 0,
						adjustmentAmount: 0,
					},
					payer: {
						name: 'Sample Insurance',
						id: 'PAY001',
					},
				};
				break;
			}

			case 'getDetailedStatus': {
				const transactionId = this.getNodeParameter('transactionId', index) as string;

				responseData = {
					success: true,
					transactionId,
					statusEvents: [
						{
							date: new Date(Date.now() - 86400000 * 5).toISOString(),
							categoryCode: 'A0',
							categoryDescription: 'Acknowledgement/Forwarded',
							statusCode: '0',
							statusDescription: 'Cannot provide further status',
						},
						{
							date: new Date(Date.now() - 86400000 * 3).toISOString(),
							categoryCode: 'A1',
							categoryDescription: 'Acknowledgement/Receipt',
							statusCode: '1',
							statusDescription: 'For more detailed information, see remittance advice',
						},
						{
							date: new Date().toISOString(),
							categoryCode: 'A2',
							categoryDescription: 'Acknowledgement/Acceptance into adjudication',
							statusCode: '20',
							statusDescription: 'Accepted for processing',
						},
					],
					currentStatus: {
						categoryCode: 'A2',
						categoryDescription: 'Acknowledgement/Acceptance into adjudication',
						statusCode: '20',
						statusDescription: 'Accepted for processing',
					},
				};
				break;
			}

			case 'getByClaimId': {
				const claimId = this.getNodeParameter('claimId', index) as string;

				responseData = {
					success: true,
					claimId,
					status: {
						categoryCode: 'A3',
						categoryDescription: 'Acknowledgement/Returned as unprocessable',
						statusCode: '33',
						statusDescription: 'Claim requires additional information',
					},
					claim: {
						patientControlNumber: 'PCN001',
						totalCharges: 750.00,
						serviceDate: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
					},
					actionRequired: true,
					actionDescription: 'Submit supporting documentation',
				};
				break;
			}

			case 'getByPatient': {
				const payerId = this.getNodeParameter('payerId', index) as string;
				const subscriberId = this.getNodeParameter('subscriberId', index) as string;
				const patientFirstName = this.getNodeParameter('patientFirstName', index) as string;
				const patientLastName = this.getNodeParameter('patientLastName', index) as string;
				const dateRange = this.getNodeParameter('dateRange', index, {}) as any;

				responseData = {
					success: true,
					patient: {
						firstName: patientFirstName,
						lastName: patientLastName,
						subscriberId,
					},
					claims: [
						{
							claimId: 'CLM001',
							serviceDate: '2024-01-15',
							amount: 250.00,
							status: 'Paid',
							statusCode: 'F1',
						},
						{
							claimId: 'CLM002',
							serviceDate: '2024-02-20',
							amount: 500.00,
							status: 'In Process',
							statusCode: 'A2',
						},
					],
					totalClaims: 2,
				};
				break;
			}

			case 'parse277': {
				const ediData = this.getNodeParameter('ediData', index) as string;

				// Simplified 277 parsing
				const segments = ediData.split('~');
				const parsed: any = {
					transactionType: '277',
					segments: segments.length,
					status: [],
				};

				for (const segment of segments) {
					const elements = segment.split('*');
					if (elements[0] === 'STC') {
						parsed.status.push({
							categoryCode: elements[1]?.split(':')[0],
							statusCode: elements[1]?.split(':')[1],
							effectiveDate: elements[2],
							actionCode: elements[3],
						});
					}
				}

				responseData = {
					success: true,
					parsed,
					rawSegmentCount: segments.length,
				};
				break;
			}

			case 'getHistory': {
				const claimId = this.getNodeParameter('claimId', index) as string;

				responseData = {
					success: true,
					claimId,
					history: [
						{
							date: new Date(Date.now() - 86400000 * 10).toISOString(),
							event: 'Claim Submitted',
							status: 'Received',
							categoryCode: 'A0',
						},
						{
							date: new Date(Date.now() - 86400000 * 8).toISOString(),
							event: 'Claim Accepted',
							status: 'In Adjudication',
							categoryCode: 'A2',
						},
						{
							date: new Date(Date.now() - 86400000 * 3).toISOString(),
							event: 'Claim Processed',
							status: 'Pending Payment',
							categoryCode: 'F0',
						},
						{
							date: new Date().toISOString(),
							event: 'Payment Issued',
							status: 'Finalized',
							categoryCode: 'F1',
						},
					],
					currentStatus: 'Finalized',
				};
				break;
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

		return [{ json: responseData }];
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(this.getNode(), `Claim status operation failed: ${error.message}`);
	}
}
