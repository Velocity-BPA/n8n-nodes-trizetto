/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Remittance Resource (835)
 * 
 * Handles Electronic Remittance Advice (ERA) processing using X12 835 transactions.
 * The 835 is the healthcare payment/remittance advice standard.
 */

export const remittanceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['remittance'],
			},
		},
		options: [
			{
				name: 'Get Remittance Advice',
				value: 'getRemittance',
				description: 'Get a specific remittance advice by ID',
				action: 'Get remittance advice',
			},
			{
				name: 'List Remittances',
				value: 'listRemittances',
				description: 'List all remittance advices with optional filters',
				action: 'List remittances',
			},
			{
				name: 'Get ERA by Check Number',
				value: 'getByCheckNumber',
				description: 'Find ERA by check or EFT trace number',
				action: 'Get ERA by check number',
			},
			{
				name: 'Get ERA by Date',
				value: 'getByDate',
				description: 'Get all ERAs for a specific date or date range',
				action: 'Get ERA by date',
			},
			{
				name: 'Parse 835 Response',
				value: 'parse835',
				description: 'Parse a raw X12 835 remittance file',
				action: 'Parse 835 response',
			},
			{
				name: 'Get Payment Details',
				value: 'getPaymentDetails',
				description: 'Get detailed payment information for a remittance',
				action: 'Get payment details',
			},
			{
				name: 'Get Adjustment Codes',
				value: 'getAdjustmentCodes',
				description: 'Get adjustment reason codes from a remittance',
				action: 'Get adjustment codes',
			},
			{
				name: 'Get Remark Codes',
				value: 'getRemarkCodes',
				description: 'Get remark codes (RARC) from a remittance',
				action: 'Get remark codes',
			},
			{
				name: 'Reconcile Payments',
				value: 'reconcilePayments',
				description: 'Reconcile ERA payments with claims',
				action: 'Reconcile payments',
			},
			{
				name: 'Download ERA File',
				value: 'downloadEra',
				description: 'Download the raw 835 file',
				action: 'Download ERA file',
			},
		],
		default: 'listRemittances',
	},
];

export const remittanceFields: INodeProperties[] = [
	// Get Remittance fields
	{
		displayName: 'Remittance ID',
		name: 'remittanceId',
		type: 'string',
		required: true,
		default: '',
		description: 'The unique remittance advice ID',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['getRemittance', 'getPaymentDetails', 'getAdjustmentCodes', 'getRemarkCodes', 'downloadEra'],
			},
		},
	},
	// List Remittances fields
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['listRemittances'],
			},
		},
		options: [
			{
				displayName: 'Payer ID',
				name: 'payerId',
				type: 'string',
				default: '',
				description: 'Filter by payer ID',
			},
			{
				displayName: 'Provider NPI',
				name: 'providerNpi',
				type: 'string',
				default: '',
				description: 'Filter by provider NPI',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
				description: 'Filter by payment date (start)',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				default: '',
				description: 'Filter by payment date (end)',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Check', value: 'CHK' },
					{ name: 'ACH/EFT', value: 'ACH' },
					{ name: 'Wire', value: 'WIR' },
				],
				default: 'all',
				description: 'Filter by payment method',
			},
			{
				displayName: 'Minimum Amount',
				name: 'minAmount',
				type: 'number',
				default: 0,
				description: 'Minimum payment amount',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Maximum number of results to return',
			},
		],
	},
	// Get by Check Number fields
	{
		displayName: 'Check/Trace Number',
		name: 'checkNumber',
		type: 'string',
		required: true,
		default: '',
		description: 'Check number or EFT trace number',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['getByCheckNumber'],
			},
		},
	},
	// Get by Date fields
	{
		displayName: 'Payment Date',
		name: 'paymentDate',
		type: 'dateTime',
		required: true,
		default: '',
		description: 'Payment date to search',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['getByDate'],
			},
		},
	},
	{
		displayName: 'Date Range',
		name: 'useDateRange',
		type: 'boolean',
		default: false,
		description: 'Whether to use a date range instead of single date',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['getByDate'],
			},
		},
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		description: 'End date for range query',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['getByDate'],
				useDateRange: [true],
			},
		},
	},
	// Parse 835 fields
	{
		displayName: 'EDI Data',
		name: 'ediData',
		type: 'string',
		required: true,
		default: '',
		description: 'Raw X12 835 remittance data',
		typeOptions: {
			rows: 10,
		},
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['parse835'],
			},
		},
	},
	{
		displayName: 'Parse Options',
		name: 'parseOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['parse835'],
			},
		},
		options: [
			{
				displayName: 'Include Raw Segments',
				name: 'includeRawSegments',
				type: 'boolean',
				default: false,
				description: 'Whether to include raw EDI segments in output',
			},
			{
				displayName: 'Decode Adjustment Codes',
				name: 'decodeAdjustments',
				type: 'boolean',
				default: true,
				description: 'Whether to decode CARC/RARC codes to descriptions',
			},
			{
				displayName: 'Group by Claim',
				name: 'groupByClaim',
				type: 'boolean',
				default: true,
				description: 'Whether to group service lines by claim',
			},
		],
	},
	// Reconcile fields
	{
		displayName: 'Claims to Reconcile',
		name: 'claims',
		type: 'json',
		required: true,
		default: '[]',
		description: 'JSON array of claims to reconcile with ERA',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['reconcilePayments'],
			},
		},
	},
	{
		displayName: 'ERA Data',
		name: 'eraData',
		type: 'json',
		required: true,
		default: '{}',
		description: 'ERA payment data to reconcile',
		displayOptions: {
			show: {
				resource: ['remittance'],
				operation: ['reconcilePayments'],
			},
		},
	},
];

export async function executeRemittance(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('triZettoApi');

	let responseData: any;

	try {
		switch (operation) {
			case 'getRemittance': {
				const remittanceId = this.getNodeParameter('remittanceId', index) as string;

				responseData = {
					success: true,
					remittance: {
						id: remittanceId,
						paymentDate: new Date().toISOString().split('T')[0],
						paymentMethod: 'ACH',
						checkNumber: 'EFT123456',
						paymentAmount: 12500.00,
						payer: {
							name: 'Sample Insurance Co',
							id: 'PAY001',
						},
						payee: {
							name: 'Sample Medical Practice',
							npi: '1234567890',
						},
						claimCount: 15,
						claims: [
							{
								claimId: 'CLM001',
								patientName: '***MASKED***',
								chargedAmount: 500.00,
								paidAmount: 425.00,
								adjustmentAmount: 75.00,
								adjustments: [
									{ code: 'CO-45', amount: 75.00, description: 'Charges exceed your contracted fee arrangement' },
								],
							},
						],
					},
				};
				break;
			}

			case 'listRemittances': {
				const filters = this.getNodeParameter('filters', index, {}) as any;

				responseData = {
					success: true,
					remittances: [
						{
							id: 'ERA001',
							paymentDate: '2024-03-15',
							paymentMethod: 'ACH',
							amount: 12500.00,
							payer: 'Blue Cross',
							claimCount: 25,
						},
						{
							id: 'ERA002',
							paymentDate: '2024-03-14',
							paymentMethod: 'CHK',
							amount: 8750.00,
							payer: 'Aetna',
							claimCount: 18,
						},
						{
							id: 'ERA003',
							paymentDate: '2024-03-13',
							paymentMethod: 'ACH',
							amount: 22300.00,
							payer: 'UnitedHealthcare',
							claimCount: 42,
						},
					],
					totalCount: 3,
					filters: filters,
				};
				break;
			}

			case 'getByCheckNumber': {
				const checkNumber = this.getNodeParameter('checkNumber', index) as string;

				responseData = {
					success: true,
					checkNumber,
					remittance: {
						id: 'ERA001',
						paymentDate: '2024-03-15',
						paymentMethod: 'ACH',
						amount: 12500.00,
						payer: {
							name: 'Blue Cross Blue Shield',
							id: 'BCBS001',
						},
					},
				};
				break;
			}

			case 'getByDate': {
				const paymentDate = this.getNodeParameter('paymentDate', index) as string;
				const useDateRange = this.getNodeParameter('useDateRange', index, false) as boolean;

				responseData = {
					success: true,
					dateQuery: {
						startDate: paymentDate,
						endDate: useDateRange ? this.getNodeParameter('endDate', index) : paymentDate,
					},
					remittances: [
						{
							id: 'ERA001',
							paymentDate: '2024-03-15',
							amount: 12500.00,
							claimCount: 25,
						},
						{
							id: 'ERA002',
							paymentDate: '2024-03-15',
							amount: 8750.00,
							claimCount: 18,
						},
					],
					totalAmount: 21250.00,
					totalClaims: 43,
				};
				break;
			}

			case 'parse835': {
				const ediData = this.getNodeParameter('ediData', index) as string;
				const parseOptions = this.getNodeParameter('parseOptions', index, {}) as any;

				// Simplified 835 parsing
				const segments = ediData.split('~');
				const parsed: any = {
					transactionType: '835',
					header: {},
					payments: [],
					claims: [],
					summary: {
						totalPayment: 0,
						totalClaims: 0,
						totalAdjustments: 0,
					},
				};

				let currentClaim: any = null;

				for (const segment of segments) {
					const elements = segment.trim().split('*');
					const segmentId = elements[0];

					switch (segmentId) {
						case 'BPR':
							parsed.header.paymentMethod = elements[4];
							parsed.header.paymentAmount = parseFloat(elements[2] || '0');
							parsed.summary.totalPayment = parsed.header.paymentAmount;
							break;
						case 'TRN':
							parsed.header.traceNumber = elements[2];
							parsed.header.originatingCompanyId = elements[3];
							break;
						case 'CLP':
							if (currentClaim) {
								parsed.claims.push(currentClaim);
							}
							currentClaim = {
								claimId: elements[1],
								statusCode: elements[2],
								chargedAmount: parseFloat(elements[3] || '0'),
								paidAmount: parseFloat(elements[4] || '0'),
								patientResponsibility: parseFloat(elements[5] || '0'),
								payerClaimId: elements[7],
								serviceLines: [],
								adjustments: [],
							};
							parsed.summary.totalClaims++;
							break;
						case 'CAS':
							if (currentClaim) {
								const adjustmentGroup = elements[1];
								for (let i = 2; i < elements.length; i += 3) {
									if (elements[i]) {
										const adj = {
											group: adjustmentGroup,
											code: elements[i],
											amount: parseFloat(elements[i + 1] || '0'),
											quantity: parseInt(elements[i + 2] || '0', 10),
										};
										currentClaim.adjustments.push(adj);
										parsed.summary.totalAdjustments += adj.amount;
									}
								}
							}
							break;
						case 'SVC':
							if (currentClaim) {
								currentClaim.serviceLines.push({
									procedureCode: elements[1]?.split(':')[1],
									chargedAmount: parseFloat(elements[2] || '0'),
									paidAmount: parseFloat(elements[3] || '0'),
									quantity: parseInt(elements[5] || '1', 10),
								});
							}
							break;
					}
				}

				if (currentClaim) {
					parsed.claims.push(currentClaim);
				}

				responseData = {
					success: true,
					parsed,
					options: parseOptions,
				};
				break;
			}

			case 'getPaymentDetails': {
				const remittanceId = this.getNodeParameter('remittanceId', index) as string;

				responseData = {
					success: true,
					remittanceId,
					payment: {
						method: 'ACH',
						traceNumber: 'EFT123456789',
						paymentDate: '2024-03-15',
						effectiveDate: '2024-03-17',
						amount: 12500.00,
						originatingCompany: 'Blue Cross Blue Shield',
						receivingAccount: '****5678',
					},
					breakdown: {
						totalCharged: 15000.00,
						totalAllowed: 13500.00,
						totalPaid: 12500.00,
						totalPatientResponsibility: 1000.00,
						totalAdjustments: 2500.00,
					},
				};
				break;
			}

			case 'getAdjustmentCodes': {
				const remittanceId = this.getNodeParameter('remittanceId', index) as string;

				responseData = {
					success: true,
					remittanceId,
					adjustments: [
						{
							group: 'CO',
							groupDescription: 'Contractual Obligations',
							code: '45',
							codeDescription: 'Charges exceed your contracted/legislated fee arrangement',
							totalAmount: 1500.00,
							occurrences: 15,
						},
						{
							group: 'PR',
							groupDescription: 'Patient Responsibility',
							code: '1',
							codeDescription: 'Deductible',
							totalAmount: 500.00,
							occurrences: 5,
						},
						{
							group: 'PR',
							groupDescription: 'Patient Responsibility',
							code: '2',
							codeDescription: 'Coinsurance',
							totalAmount: 500.00,
							occurrences: 10,
						},
					],
					summary: {
						totalContractualAdjustments: 1500.00,
						totalPatientResponsibility: 1000.00,
						totalOtherAdjustments: 0,
					},
				};
				break;
			}

			case 'getRemarkCodes': {
				const remittanceId = this.getNodeParameter('remittanceId', index) as string;

				responseData = {
					success: true,
					remittanceId,
					remarkCodes: [
						{
							code: 'N130',
							description: 'Consult our provider website for additional information',
							occurrences: 8,
						},
						{
							code: 'MA01',
							description: 'If you do not agree with what we approved, you may appeal',
							occurrences: 3,
						},
						{
							code: 'N381',
							description: 'Partial payment for this claim',
							occurrences: 5,
						},
					],
				};
				break;
			}

			case 'reconcilePayments': {
				const claims = JSON.parse(this.getNodeParameter('claims', index) as string);
				const eraData = JSON.parse(this.getNodeParameter('eraData', index) as string);

				// Simulated reconciliation
				responseData = {
					success: true,
					reconciliation: {
						matched: 12,
						unmatched: 3,
						totalExpected: claims.length,
						totalInERA: 15,
						variance: 0,
					},
					matchedClaims: [
						{ claimId: 'CLM001', expected: 500.00, actual: 500.00, status: 'MATCHED' },
						{ claimId: 'CLM002', expected: 750.00, actual: 750.00, status: 'MATCHED' },
					],
					unmatchedClaims: [
						{ claimId: 'CLM003', expected: 300.00, actual: null, status: 'NOT_IN_ERA' },
					],
					unmatchedERAItems: [
						{ claimId: 'CLM010', amount: 425.00, status: 'NOT_IN_CLAIMS' },
					],
				};
				break;
			}

			case 'downloadEra': {
				const remittanceId = this.getNodeParameter('remittanceId', index) as string;

				// Simulated ERA file content
				const eraContent = `ISA*00*          *00*          *ZZ*PAYERID        *ZZ*PROVIDERID     *240315*1200*^*00501*000000001*0*P*:~
GS*HP*PAYERID*PROVIDERID*20240315*1200*1*X*005010X221A1~
ST*835*0001~
BPR*I*12500.00*C*ACH*CTX*01*123456789*DA*987654321*1234567890**01*123456789*DA*111222333*20240317~
TRN*1*EFT123456789*1234567890~
REF*EV*SAMPLE INSURANCE CO~
N1*PR*SAMPLE INSURANCE CO~
N1*PE*SAMPLE MEDICAL PRACTICE*XX*1234567890~
CLP*CLM001*1*500*425*75*12*PAYERCLM001~
CAS*CO*45*75~
NM1*QC*1*DOE*JOHN****MI*MEMBER001~
SVC*HC:99213*500*425**1~
SE*12*0001~
GE*1*1~
IEA*1*000000001~`;

				responseData = {
					success: true,
					remittanceId,
					fileName: `${remittanceId}.835`,
					contentType: 'application/edi-x12',
					content: eraContent,
					size: eraContent.length,
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
		throw new NodeOperationError(this.getNode(), `Remittance operation failed: ${error.message}`);
	}
}
