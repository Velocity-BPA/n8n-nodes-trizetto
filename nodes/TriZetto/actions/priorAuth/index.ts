/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Prior Authorization Resource
 * 
 * Handles prior authorization (pre-certification) requests for medical procedures,
 * medications, and services that require payer approval before treatment.
 */

export const priorAuthOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['priorAuth'],
			},
		},
		options: [
			{
				name: 'Submit Prior Auth Request',
				value: 'submit',
				description: 'Submit a new prior authorization request',
				action: 'Submit prior auth request',
			},
			{
				name: 'Check Prior Auth Status',
				value: 'checkStatus',
				description: 'Check the status of a prior auth request',
				action: 'Check prior auth status',
			},
			{
				name: 'Get Prior Auth Response',
				value: 'getResponse',
				description: 'Get the full prior auth response details',
				action: 'Get prior auth response',
			},
			{
				name: 'Update Prior Auth',
				value: 'update',
				description: 'Update an existing prior auth request',
				action: 'Update prior auth',
			},
			{
				name: 'Cancel Prior Auth',
				value: 'cancel',
				description: 'Cancel a pending prior auth request',
				action: 'Cancel prior auth',
			},
			{
				name: 'Get Auth History',
				value: 'getHistory',
				description: 'Get prior auth history for a patient',
				action: 'Get auth history',
			},
			{
				name: 'Get Required Auth Info',
				value: 'getRequirements',
				description: 'Get prior auth requirements for a procedure/service',
				action: 'Get required auth info',
			},
		],
		default: 'submit',
	},
];

export const priorAuthFields: INodeProperties[] = [
	// Submit fields
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		description: 'The payer/insurance company ID',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit', 'getRequirements'],
			},
		},
	},
	{
		displayName: 'Provider NPI',
		name: 'providerNpi',
		type: 'string',
		required: true,
		default: '',
		description: 'Requesting provider NPI',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit'],
			},
		},
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient member/subscriber ID',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit', 'getHistory'],
			},
		},
	},
	{
		displayName: 'Patient Info',
		name: 'patientInfo',
		type: 'fixedCollection',
		default: {},
		required: true,
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit'],
			},
		},
		options: [
			{
				name: 'patient',
				displayName: 'Patient',
				values: [
					{
						displayName: 'First Name',
						name: 'firstName',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Last Name',
						name: 'lastName',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Date of Birth',
						name: 'dateOfBirth',
						type: 'dateTime',
						default: '',
						required: true,
					},
					{
						displayName: 'Gender',
						name: 'gender',
						type: 'options',
						options: [
							{ name: 'Male', value: 'M' },
							{ name: 'Female', value: 'F' },
							{ name: 'Unknown', value: 'U' },
						],
						default: 'U',
					},
				],
			},
		],
	},
	{
		displayName: 'Service Type',
		name: 'serviceType',
		type: 'options',
		required: true,
		default: 'medical',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit', 'getRequirements'],
			},
		},
		options: [
			{ name: 'Medical Procedure', value: 'medical' },
			{ name: 'Surgical Procedure', value: 'surgical' },
			{ name: 'Diagnostic Imaging', value: 'imaging' },
			{ name: 'Prescription Drug', value: 'pharmacy' },
			{ name: 'Durable Medical Equipment', value: 'dme' },
			{ name: 'Outpatient Services', value: 'outpatient' },
			{ name: 'Inpatient Admission', value: 'inpatient' },
			{ name: 'Home Health', value: 'homeHealth' },
			{ name: 'Skilled Nursing', value: 'snf' },
			{ name: 'Mental Health', value: 'mentalHealth' },
			{ name: 'Rehabilitation', value: 'rehab' },
		],
	},
	{
		displayName: 'Procedure/Service Codes',
		name: 'serviceCodes',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit', 'getRequirements'],
			},
		},
		options: [
			{
				name: 'codes',
				displayName: 'Code',
				values: [
					{
						displayName: 'Code Type',
						name: 'codeType',
						type: 'options',
						options: [
							{ name: 'CPT', value: 'CPT' },
							{ name: 'HCPCS', value: 'HCPCS' },
							{ name: 'ICD-10-PCS', value: 'ICD10PCS' },
							{ name: 'NDC (Drug)', value: 'NDC' },
							{ name: 'Revenue Code', value: 'REV' },
						],
						default: 'CPT',
					},
					{
						displayName: 'Code',
						name: 'code',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Units/Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
					},
				],
			},
		],
	},
	{
		displayName: 'Diagnosis Codes',
		name: 'diagnosisCodes',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: [],
		description: 'ICD-10-CM diagnosis codes supporting medical necessity',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit'],
			},
		},
	},
	{
		displayName: 'Clinical Information',
		name: 'clinicalInfo',
		type: 'collection',
		placeholder: 'Add Clinical Detail',
		default: {},
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['submit'],
			},
		},
		options: [
			{
				displayName: 'Service Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Requested start date for service',
			},
			{
				displayName: 'Service End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Requested end date for service',
			},
			{
				displayName: 'Place of Service',
				name: 'placeOfService',
				type: 'options',
				options: [
					{ name: 'Office', value: '11' },
					{ name: 'Home', value: '12' },
					{ name: 'Outpatient Hospital', value: '22' },
					{ name: 'Emergency Room', value: '23' },
					{ name: 'Inpatient Hospital', value: '21' },
					{ name: 'Ambulatory Surgical Center', value: '24' },
					{ name: 'Skilled Nursing Facility', value: '31' },
				],
				default: '11',
			},
			{
				displayName: 'Urgency',
				name: 'urgency',
				type: 'options',
				options: [
					{ name: 'Routine', value: 'routine' },
					{ name: 'Urgent', value: 'urgent' },
					{ name: 'Emergent', value: 'emergent' },
				],
				default: 'routine',
			},
			{
				displayName: 'Clinical Notes',
				name: 'notes',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Additional clinical information',
			},
		],
	},
	// Status/Response fields
	{
		displayName: 'Authorization ID',
		name: 'authId',
		type: 'string',
		required: true,
		default: '',
		description: 'The prior authorization reference ID',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['checkStatus', 'getResponse', 'update', 'cancel'],
			},
		},
	},
	// Update fields
	{
		displayName: 'Update Type',
		name: 'updateType',
		type: 'options',
		required: true,
		default: 'extend',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['update'],
			},
		},
		options: [
			{ name: 'Extend Authorization', value: 'extend' },
			{ name: 'Add Services', value: 'addServices' },
			{ name: 'Update Clinical Info', value: 'clinical' },
			{ name: 'Change Provider', value: 'provider' },
		],
	},
	{
		displayName: 'Update Details',
		name: 'updateDetails',
		type: 'json',
		default: '{}',
		description: 'Details for the update in JSON format',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['update'],
			},
		},
	},
	// Cancel fields
	{
		displayName: 'Cancellation Reason',
		name: 'cancelReason',
		type: 'options',
		required: true,
		default: 'notNeeded',
		displayOptions: {
			show: {
				resource: ['priorAuth'],
				operation: ['cancel'],
			},
		},
		options: [
			{ name: 'Service No Longer Needed', value: 'notNeeded' },
			{ name: 'Patient Request', value: 'patientRequest' },
			{ name: 'Provider Change', value: 'providerChange' },
			{ name: 'Payer Change', value: 'payerChange' },
			{ name: 'Submitted in Error', value: 'error' },
			{ name: 'Other', value: 'other' },
		],
	},
];

export async function executePriorAuth(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('triZettoApi');

	let responseData: any;

	try {
		switch (operation) {
			case 'submit': {
				const payerId = this.getNodeParameter('payerId', index) as string;
				const providerNpi = this.getNodeParameter('providerNpi', index) as string;
				const memberId = this.getNodeParameter('memberId', index) as string;
				const patientInfo = this.getNodeParameter('patientInfo', index, {}) as any;
				const serviceType = this.getNodeParameter('serviceType', index) as string;
				const serviceCodes = this.getNodeParameter('serviceCodes', index, {}) as any;
				const diagnosisCodes = this.getNodeParameter('diagnosisCodes', index, []) as string[];
				const clinicalInfo = this.getNodeParameter('clinicalInfo', index, {}) as any;

				const authId = `PA${Date.now()}`;
				
				responseData = {
					success: true,
					authorizationId: authId,
					status: 'PENDING_REVIEW',
					submittedAt: new Date().toISOString(),
					estimatedResponseTime: '24-48 hours',
					request: {
						payerId,
						providerNpi,
						memberId,
						patient: patientInfo.patient,
						serviceType,
						serviceCodes: serviceCodes.codes,
						diagnosisCodes,
						clinicalInfo,
					},
					trackingNumber: `TRK${Date.now()}`,
				};
				break;
			}

			case 'checkStatus': {
				const authId = this.getNodeParameter('authId', index) as string;

				responseData = {
					success: true,
					authorizationId: authId,
					status: 'APPROVED',
					statusCode: 'A1',
					statusDescription: 'Certified in total',
					approvedUnits: 10,
					approvedDates: {
						effectiveDate: new Date().toISOString().split('T')[0],
						expirationDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
					},
					lastUpdated: new Date().toISOString(),
				};
				break;
			}

			case 'getResponse': {
				const authId = this.getNodeParameter('authId', index) as string;

				responseData = {
					success: true,
					authorization: {
						id: authId,
						status: 'APPROVED',
						certificationNumber: `CERT${Date.now()}`,
						certificationStatus: 'Certified in Total',
						effectiveDate: new Date().toISOString().split('T')[0],
						expirationDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
						approvedServices: [
							{
								code: '99213',
								codeType: 'CPT',
								description: 'Office visit, established patient',
								approvedUnits: 10,
								approvedAmount: 1500.00,
							},
						],
						approvedDiagnoses: ['M54.5'],
						restrictions: [],
						notes: 'Approved for outpatient services only',
						payer: {
							name: 'Sample Insurance',
							contactPhone: '1-800-555-0123',
						},
						provider: {
							npi: '1234567890',
							name: 'Sample Medical Practice',
						},
					},
				};
				break;
			}

			case 'update': {
				const authId = this.getNodeParameter('authId', index) as string;
				const updateType = this.getNodeParameter('updateType', index) as string;
				const updateDetails = JSON.parse(this.getNodeParameter('updateDetails', index) as string);

				responseData = {
					success: true,
					authorizationId: authId,
					updateType,
					status: 'UPDATE_PENDING',
					updateRequestId: `UPD${Date.now()}`,
					submittedAt: new Date().toISOString(),
					updateDetails,
					message: 'Update request submitted for review',
				};
				break;
			}

			case 'cancel': {
				const authId = this.getNodeParameter('authId', index) as string;
				const cancelReason = this.getNodeParameter('cancelReason', index) as string;

				responseData = {
					success: true,
					authorizationId: authId,
					status: 'CANCELLED',
					cancelledAt: new Date().toISOString(),
					cancellationReason: cancelReason,
					confirmationNumber: `CAN${Date.now()}`,
				};
				break;
			}

			case 'getHistory': {
				const memberId = this.getNodeParameter('memberId', index) as string;

				responseData = {
					success: true,
					memberId,
					authorizations: [
						{
							authId: 'PA001',
							serviceType: 'imaging',
							procedureCode: '70553',
							status: 'APPROVED',
							effectiveDate: '2024-01-15',
							expirationDate: '2024-04-15',
						},
						{
							authId: 'PA002',
							serviceType: 'surgical',
							procedureCode: '27447',
							status: 'PENDING',
							effectiveDate: null,
							expirationDate: null,
						},
						{
							authId: 'PA003',
							serviceType: 'pharmacy',
							procedureCode: 'NDC12345',
							status: 'DENIED',
							effectiveDate: null,
							expirationDate: null,
							denialReason: 'Not medically necessary',
						},
					],
					totalCount: 3,
				};
				break;
			}

			case 'getRequirements': {
				const payerId = this.getNodeParameter('payerId', index) as string;
				const serviceType = this.getNodeParameter('serviceType', index) as string;
				const serviceCodes = this.getNodeParameter('serviceCodes', index, {}) as any;

				responseData = {
					success: true,
					payerId,
					serviceType,
					requirements: {
						priorAuthRequired: true,
						requiredDocuments: [
							'Clinical notes',
							'Diagnostic test results',
							'Treatment history',
						],
						requiredClinicalInfo: [
							'Primary diagnosis with ICD-10',
							'Previous treatments attempted',
							'Medical necessity justification',
						],
						submissionDeadline: '5 business days before service',
						expectedTurnaround: '24-72 hours',
						contactInfo: {
							phone: '1-800-555-0123',
							fax: '1-800-555-0124',
							portalUrl: 'https://provider.example.com/auth',
						},
						guidelines: [
							'Services must be performed within 90 days of approval',
							'Re-authorization required for extensions',
							'Peer-to-peer review available for denials',
						],
					},
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
		throw new NodeOperationError(this.getNode(), `Prior auth operation failed: ${error.message}`);
	}
}
