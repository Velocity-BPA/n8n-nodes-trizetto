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
import { SoapClient } from '../../transport/soapClient';
import { validateNpi, validateTaxId, validateIcd10, validateCpt, validateClaimAmount } from '../../utils/validationUtils';
import { maskPhiInObject, createSafeLogEntry } from '../../utils/hipaaUtils';

/**
 * Claim Submission Resource - 837 Transactions
 * 
 * Handles healthcare claim submission using X12 837 transaction sets.
 * - 837P: Professional claims (CMS-1500)
 * - 837I: Institutional claims (UB-04)
 * - 837D: Dental claims (ADA)
 */

export const claimSubmissionOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
			},
		},
		options: [
			{
				name: 'Submit Professional Claim',
				value: 'submitProfessional',
				description: 'Submit an 837P professional claim (CMS-1500)',
				action: 'Submit professional claim',
			},
			{
				name: 'Submit Institutional Claim',
				value: 'submitInstitutional',
				description: 'Submit an 837I institutional claim (UB-04)',
				action: 'Submit institutional claim',
			},
			{
				name: 'Submit Dental Claim',
				value: 'submitDental',
				description: 'Submit an 837D dental claim',
				action: 'Submit dental claim',
			},
			{
				name: 'Validate Claim',
				value: 'validateClaim',
				description: 'Validate a claim before submission',
				action: 'Validate claim',
			},
			{
				name: 'Get Claim Status',
				value: 'getClaimStatus',
				description: 'Get the status of a submitted claim',
				action: 'Get claim status',
			},
			{
				name: 'Get Claim Acknowledgment',
				value: 'getAcknowledgment',
				description: 'Get the 997/999 acknowledgment for a claim',
				action: 'Get claim acknowledgment',
			},
			{
				name: 'Batch Submit Claims',
				value: 'batchSubmit',
				description: 'Submit multiple claims in a batch',
				action: 'Batch submit claims',
			},
			{
				name: 'Get Submission History',
				value: 'getSubmissionHistory',
				description: 'Get claim submission history',
				action: 'Get submission history',
			},
			{
				name: 'Resubmit Claim',
				value: 'resubmitClaim',
				description: 'Resubmit a previously rejected claim',
				action: 'Resubmit claim',
			},
			{
				name: 'Correct Claim',
				value: 'correctClaim',
				description: 'Submit a corrected claim (frequency code 7)',
				action: 'Correct claim',
			},
		],
		default: 'submitProfessional',
	},
];

export const claimSubmissionFields: INodeProperties[] = [
	// Payer Information
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'BCBSIL',
		description: 'TriZetto/Clearinghouse payer identifier',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim', 'batchSubmit'],
			},
		},
	},

	// Claim Type Selection
	{
		displayName: 'Claim Type',
		name: 'claimType',
		type: 'options',
		options: [
			{ name: 'Professional (837P)', value: '837P' },
			{ name: 'Institutional (837I)', value: '837I' },
			{ name: 'Dental (837D)', value: '837D' },
		],
		default: '837P',
		description: 'Type of claim to submit',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['validateClaim', 'batchSubmit'],
			},
		},
	},

	// Billing Provider Information
	{
		displayName: 'Billing Provider NPI',
		name: 'billingProviderNpi',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1234567890',
		description: 'Billing provider National Provider Identifier',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},
	{
		displayName: 'Billing Provider Name',
		name: 'billingProviderName',
		type: 'string',
		required: true,
		default: '',
		description: 'Name of the billing provider or organization',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},
	{
		displayName: 'Billing Provider Tax ID',
		name: 'billingProviderTaxId',
		type: 'string',
		required: true,
		default: '',
		placeholder: '12-3456789',
		description: 'Billing provider federal tax ID (EIN or SSN)',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},

	// Rendering Provider (for professional claims)
	{
		displayName: 'Rendering Provider NPI',
		name: 'renderingProviderNpi',
		type: 'string',
		default: '',
		placeholder: '1234567890',
		description: 'Rendering provider NPI (if different from billing)',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional'],
			},
		},
	},

	// Patient Information
	{
		displayName: 'Patient Member ID',
		name: 'patientMemberId',
		type: 'string',
		required: true,
		default: '',
		description: 'Patient member/subscriber ID from insurance card',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim', 'getSubmissionHistory'],
			},
		},
	},
	{
		displayName: 'Patient First Name',
		name: 'patientFirstName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},
	{
		displayName: 'Patient Last Name',
		name: 'patientLastName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},
	{
		displayName: 'Patient Date of Birth',
		name: 'patientDob',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},
	{
		displayName: 'Patient Gender',
		name: 'patientGender',
		type: 'options',
		options: [
			{ name: 'Male', value: 'M' },
			{ name: 'Female', value: 'F' },
			{ name: 'Unknown', value: 'U' },
		],
		default: 'U',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
	},
	{
		displayName: 'Patient Address',
		name: 'patientAddress',
		type: 'fixedCollection',
		default: {},
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
		options: [
			{
				name: 'address',
				displayName: 'Address',
				values: [
					{ displayName: 'Street', name: 'street', type: 'string', default: '' },
					{ displayName: 'City', name: 'city', type: 'string', default: '' },
					{ displayName: 'State', name: 'state', type: 'string', default: '' },
					{ displayName: 'Zip Code', name: 'zip', type: 'string', default: '' },
				],
			},
		],
	},

	// Diagnosis Codes
	{
		displayName: 'Diagnosis Codes',
		name: 'diagnosisCodes',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		description: 'ICD-10 diagnosis codes',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
		options: [
			{
				name: 'diagnoses',
				displayName: 'Diagnosis',
				values: [
					{
						displayName: 'ICD-10 Code',
						name: 'code',
						type: 'string',
						default: '',
						placeholder: 'J06.9',
						description: 'ICD-10-CM diagnosis code',
					},
					{
						displayName: 'Sequence',
						name: 'sequence',
						type: 'number',
						default: 1,
						description: 'Diagnosis sequence (1 = primary)',
					},
				],
			},
		],
	},

	// Service Lines
	{
		displayName: 'Service Lines',
		name: 'serviceLines',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		required: true,
		default: {},
		description: 'Claim service lines with procedure codes',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitProfessional', 'submitInstitutional', 'submitDental', 'validateClaim'],
			},
		},
		options: [
			{
				name: 'lines',
				displayName: 'Service Line',
				values: [
					{
						displayName: 'Procedure Code',
						name: 'procedureCode',
						type: 'string',
						default: '',
						placeholder: '99213',
						description: 'CPT or HCPCS procedure code',
					},
					{
						displayName: 'Modifiers',
						name: 'modifiers',
						type: 'string',
						default: '',
						placeholder: '25,59',
						description: 'Comma-separated procedure modifiers',
					},
					{
						displayName: 'Units',
						name: 'units',
						type: 'number',
						default: 1,
						description: 'Number of units/services',
					},
					{
						displayName: 'Charge Amount',
						name: 'chargeAmount',
						type: 'number',
						typeOptions: {
							numberPrecision: 2,
						},
						default: 0,
						description: 'Billed amount for this service',
					},
					{
						displayName: 'Service Date',
						name: 'serviceDate',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
						description: 'Date of service',
					},
					{
						displayName: 'Place of Service',
						name: 'placeOfService',
						type: 'options',
						options: [
							{ name: '11 - Office', value: '11' },
							{ name: '12 - Home', value: '12' },
							{ name: '21 - Inpatient Hospital', value: '21' },
							{ name: '22 - Outpatient Hospital', value: '22' },
							{ name: '23 - Emergency Room - Hospital', value: '23' },
							{ name: '24 - Ambulatory Surgical Center', value: '24' },
							{ name: '31 - Skilled Nursing Facility', value: '31' },
							{ name: '32 - Nursing Facility', value: '32' },
							{ name: '81 - Independent Laboratory', value: '81' },
							{ name: '99 - Other', value: '99' },
						],
						default: '11',
						description: 'Place of service code',
					},
					{
						displayName: 'Diagnosis Pointers',
						name: 'diagnosisPointers',
						type: 'string',
						default: '1',
						placeholder: '1,2,3',
						description: 'Comma-separated diagnosis code references',
					},
					{
						displayName: 'Revenue Code',
						name: 'revenueCode',
						type: 'string',
						default: '',
						placeholder: '0450',
						description: 'Revenue code (for institutional claims)',
					},
				],
			},
		],
	},

	// Claim IDs for lookup operations
	{
		displayName: 'Claim ID',
		name: 'claimId',
		type: 'string',
		required: true,
		default: '',
		description: 'TriZetto claim identifier',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['getClaimStatus', 'getAcknowledgment', 'resubmitClaim', 'correctClaim'],
			},
		},
	},

	// Original Claim Reference (for corrections)
	{
		displayName: 'Original Claim Reference',
		name: 'originalClaimReference',
		type: 'string',
		required: true,
		default: '',
		description: 'Original claim control number for corrections',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['correctClaim'],
			},
		},
	},

	// Batch Claims JSON
	{
		displayName: 'Claims',
		name: 'claims',
		type: 'json',
		required: true,
		default: '[]',
		description: 'Array of claim objects for batch submission',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['batchSubmit'],
			},
		},
	},

	// Institutional-specific fields
	{
		displayName: 'Admission Date',
		name: 'admissionDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Patient admission date',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitInstitutional'],
			},
		},
	},
	{
		displayName: 'Discharge Date',
		name: 'dischargeDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		description: 'Patient discharge date',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitInstitutional'],
			},
		},
	},
	{
		displayName: 'Type of Bill',
		name: 'typeOfBill',
		type: 'string',
		default: '',
		placeholder: '131',
		description: 'UB-04 type of bill code (3 digits)',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitInstitutional'],
			},
		},
	},
	{
		displayName: 'Admission Type',
		name: 'admissionType',
		type: 'options',
		options: [
			{ name: '1 - Emergency', value: '1' },
			{ name: '2 - Urgent', value: '2' },
			{ name: '3 - Elective', value: '3' },
			{ name: '4 - Newborn', value: '4' },
			{ name: '5 - Trauma Center', value: '5' },
			{ name: '9 - Information Not Available', value: '9' },
		],
		default: '3',
		description: 'Admission type code',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitInstitutional'],
			},
		},
	},
	{
		displayName: 'Admission Source',
		name: 'admissionSource',
		type: 'options',
		options: [
			{ name: '1 - Physician Referral', value: '1' },
			{ name: '2 - Clinic Referral', value: '2' },
			{ name: '3 - HMO Referral', value: '3' },
			{ name: '4 - Transfer from Hospital', value: '4' },
			{ name: '5 - Transfer from SNF', value: '5' },
			{ name: '6 - Transfer from Another Facility', value: '6' },
			{ name: '7 - Emergency Room', value: '7' },
			{ name: '8 - Court/Law Enforcement', value: '8' },
			{ name: '9 - Information Not Available', value: '9' },
		],
		default: '1',
		description: 'Patient admission source code',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitInstitutional'],
			},
		},
	},
	{
		displayName: 'Patient Status',
		name: 'patientStatus',
		type: 'options',
		options: [
			{ name: '01 - Discharged Home', value: '01' },
			{ name: '02 - Discharged to Short-term Hospital', value: '02' },
			{ name: '03 - Discharged to SNF', value: '03' },
			{ name: '04 - Discharged to ICF', value: '04' },
			{ name: '05 - Discharged to Another Facility', value: '05' },
			{ name: '06 - Discharged Home Under Care', value: '06' },
			{ name: '07 - Left Against Medical Advice', value: '07' },
			{ name: '20 - Expired', value: '20' },
			{ name: '30 - Still Patient', value: '30' },
		],
		default: '01',
		description: 'Patient discharge status code',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['submitInstitutional'],
			},
		},
	},

	// Date range for history
	{
		displayName: 'Date Range Start',
		name: 'dateRangeStart',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['getSubmissionHistory'],
			},
		},
	},
	{
		displayName: 'Date Range End',
		name: 'dateRangeEnd',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
				operation: ['getSubmissionHistory'],
			},
		},
	},

	// Additional Options
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['claimSubmission'],
			},
		},
		options: [
			{
				displayName: 'Prior Authorization Number',
				name: 'priorAuthNumber',
				type: 'string',
				default: '',
				description: 'Prior authorization or referral number if required',
			},
			{
				displayName: 'Claim Frequency Code',
				name: 'frequencyCode',
				type: 'options',
				options: [
					{ name: '1 - Original', value: '1' },
					{ name: '6 - Corrected (Adjustment of Prior Claim)', value: '6' },
					{ name: '7 - Replacement of Prior Claim', value: '7' },
					{ name: '8 - Void/Cancel of Prior Claim', value: '8' },
				],
				default: '1',
				description: 'Claim frequency code for resubmissions',
			},
			{
				displayName: 'Assignment of Benefits',
				name: 'assignmentOfBenefits',
				type: 'boolean',
				default: true,
				description: 'Whether benefits are assigned to the provider',
			},
			{
				displayName: 'Release of Information',
				name: 'releaseOfInfo',
				type: 'boolean',
				default: true,
				description: 'Whether patient authorized release of information',
			},
			{
				displayName: 'Accept Assignment',
				name: 'acceptAssignment',
				type: 'boolean',
				default: true,
				description: 'Whether provider accepts insurance assignment',
			},
			{
				displayName: 'Delay Reason Code',
				name: 'delayReasonCode',
				type: 'options',
				options: [
					{ name: '1 - Proof of Eligibility Unknown or Unavailable', value: '1' },
					{ name: '2 - Litigation', value: '2' },
					{ name: '3 - Authorization Delays', value: '3' },
					{ name: '4 - Delay in Certifying Provider', value: '4' },
					{ name: '5 - Delay in Supplying Billing Forms', value: '5' },
					{ name: '7 - Third Party Processing Delay', value: '7' },
					{ name: '8 - Delay in Eligibility Determination', value: '8' },
					{ name: '9 - Original Claim Rejected or Denied', value: '9' },
					{ name: '10 - Administration Delay in Prior Authorization', value: '10' },
					{ name: '11 - Other', value: '11' },
				],
				default: '',
				description: 'Reason code for late claim submission',
			},
			{
				displayName: 'Referring Provider NPI',
				name: 'referringProviderNpi',
				type: 'string',
				default: '',
				description: 'NPI of the referring physician',
			},
			{
				displayName: 'Supervising Provider NPI',
				name: 'supervisingProviderNpi',
				type: 'string',
				default: '',
				description: 'NPI of the supervising physician',
			},
			{
				displayName: 'Facility NPI',
				name: 'facilityNpi',
				type: 'string',
				default: '',
				description: 'NPI of the service facility',
			},
			{
				displayName: 'Secondary Payer ID',
				name: 'secondaryPayerId',
				type: 'string',
				default: '',
				description: 'Secondary insurance payer ID for COB',
			},
			{
				displayName: 'Patient Account Number',
				name: 'patientAccountNumber',
				type: 'string',
				default: '',
				description: 'Internal patient account number',
			},
			{
				displayName: 'Medical Record Number',
				name: 'medicalRecordNumber',
				type: 'string',
				default: '',
				description: 'Patient medical record number',
			},
		],
	},
];

/**
 * Execute claim submission operations
 */
export async function executeClaimSubmission(
	this: IExecuteFunctions,
	index: number,
	client: TriZettoClient,
	soapClient: SoapClient,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const returnData: INodeExecutionData[] = [];

	try {
		if (operation === 'submitProfessional' || operation === 'submitInstitutional' || operation === 'submitDental') {
			// Get common claim data
			const payerId = this.getNodeParameter('payerId', index) as string;
			const billingProviderNpi = this.getNodeParameter('billingProviderNpi', index) as string;
			const billingProviderName = this.getNodeParameter('billingProviderName', index) as string;
			const billingProviderTaxId = this.getNodeParameter('billingProviderTaxId', index) as string;
			const patientMemberId = this.getNodeParameter('patientMemberId', index) as string;
			const patientFirstName = this.getNodeParameter('patientFirstName', index) as string;
			const patientLastName = this.getNodeParameter('patientLastName', index) as string;
			const patientDob = this.getNodeParameter('patientDob', index) as string;
			const patientGender = this.getNodeParameter('patientGender', index) as string;
			const patientAddressData = this.getNodeParameter('patientAddress', index, {}) as any;
			const diagnosisCodesData = this.getNodeParameter('diagnosisCodes', index, {}) as any;
			const serviceLinesData = this.getNodeParameter('serviceLines', index, {}) as any;
			const additionalOptions = this.getNodeParameter('additionalOptions', index, {}) as any;

			// Validate inputs
			const npiValidation = validateNpi(billingProviderNpi);
			if (!npiValidation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid Billing Provider NPI: ${npiValidation.errors.join(', ')}`);
			}

			const taxIdValidation = validateTaxId(billingProviderTaxId);
			if (!taxIdValidation.valid) {
				throw new NodeOperationError(this.getNode(), `Invalid Tax ID: ${taxIdValidation.errors.join(', ')}`);
			}

			// Validate diagnosis codes
			const diagnoses = diagnosisCodesData.diagnoses || [];
			for (const dx of diagnoses) {
				const dxValidation = validateIcd10(dx.code);
				if (!dxValidation.valid) {
					throw new NodeOperationError(this.getNode(), `Invalid ICD-10 code ${dx.code}: ${dxValidation.errors.join(', ')}`);
				}
			}

			// Validate service lines
			const serviceLines = serviceLinesData.lines || [];
			if (serviceLines.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one service line is required');
			}

			let totalCharges = 0;
			for (const line of serviceLines) {
				const cptValidation = validateCpt(line.procedureCode);
				if (!cptValidation.valid) {
					throw new NodeOperationError(this.getNode(), `Invalid procedure code ${line.procedureCode}: ${cptValidation.errors.join(', ')}`);
				}

				const amountValidation = validateClaimAmount(line.chargeAmount);
				if (!amountValidation.valid) {
					throw new NodeOperationError(this.getNode(), `Invalid charge amount: ${amountValidation.errors.join(', ')}`);
				}

				totalCharges += line.chargeAmount * (line.units || 1);
			}

			// Build claim object
			const claim: any = {
				claimType: operation === 'submitProfessional' ? '837P' : operation === 'submitInstitutional' ? '837I' : '837D',
				billingProvider: {
					npi: billingProviderNpi,
					name: billingProviderName,
					taxId: billingProviderTaxId.replace(/-/g, ''),
				},
				payer: {
					payerId,
				},
				patient: {
					memberId: patientMemberId,
					firstName: patientFirstName,
					lastName: patientLastName,
					dateOfBirth: patientDob,
					gender: patientGender,
					address: patientAddressData.address,
				},
				diagnoses: diagnoses.map((dx: any) => ({
					code: dx.code.replace('.', ''),
					sequence: dx.sequence,
				})),
				serviceLines: serviceLines.map((line: any, idx: number) => ({
					lineNumber: idx + 1,
					procedureCode: line.procedureCode,
					modifiers: line.modifiers ? line.modifiers.split(',').map((m: string) => m.trim()) : [],
					units: line.units || 1,
					chargeAmount: line.chargeAmount,
					serviceDate: line.serviceDate,
					placeOfService: line.placeOfService,
					diagnosisPointers: line.diagnosisPointers ? line.diagnosisPointers.split(',').map((p: string) => parseInt(p.trim())) : [1],
					revenueCode: line.revenueCode,
				})),
				totalCharges,
				priorAuthNumber: additionalOptions.priorAuthNumber,
				frequencyCode: additionalOptions.frequencyCode || '1',
				assignmentOfBenefits: additionalOptions.assignmentOfBenefits !== false,
				releaseOfInfo: additionalOptions.releaseOfInfo !== false,
				acceptAssignment: additionalOptions.acceptAssignment !== false,
				patientAccountNumber: additionalOptions.patientAccountNumber,
			};

			// Add institutional-specific fields
			if (operation === 'submitInstitutional') {
				claim.admissionDate = this.getNodeParameter('admissionDate', index) as string;
				claim.dischargeDate = this.getNodeParameter('dischargeDate', index) as string;
				claim.typeOfBill = this.getNodeParameter('typeOfBill', index) as string;
				claim.admissionType = this.getNodeParameter('admissionType', index) as string;
				claim.admissionSource = this.getNodeParameter('admissionSource', index) as string;
				claim.patientStatus = this.getNodeParameter('patientStatus', index) as string;
			}

			// Add rendering provider for professional claims
			if (operation === 'submitProfessional') {
				const renderingNpi = this.getNodeParameter('renderingProviderNpi', index) as string;
				if (renderingNpi) {
					claim.renderingProvider = { npi: renderingNpi };
				}
			}

			// Submit the claim
			const response = await client.post('/claims/submit', claim);

			returnData.push({
				json: {
					success: true,
					claimId: response.claimId,
					controlNumber: response.controlNumber,
					status: response.status,
					claimType: claim.claimType,
					totalCharges,
					serviceLineCount: serviceLines.length,
					submittedAt: new Date().toISOString(),
					message: 'Claim submitted successfully',
				},
			});

		} else if (operation === 'validateClaim') {
			const payerId = this.getNodeParameter('payerId', index) as string;
			const claimType = this.getNodeParameter('claimType', index) as string;
			const billingProviderNpi = this.getNodeParameter('billingProviderNpi', index) as string;
			const billingProviderTaxId = this.getNodeParameter('billingProviderTaxId', index) as string;
			const diagnosisCodesData = this.getNodeParameter('diagnosisCodes', index, {}) as any;
			const serviceLinesData = this.getNodeParameter('serviceLines', index, {}) as any;

			const validationErrors: string[] = [];
			const validationWarnings: string[] = [];

			// Validate NPI
			const npiValidation = validateNpi(billingProviderNpi);
			if (!npiValidation.valid) {
				validationErrors.push(...npiValidation.errors);
			}

			// Validate Tax ID
			const taxIdValidation = validateTaxId(billingProviderTaxId);
			if (!taxIdValidation.valid) {
				validationErrors.push(...taxIdValidation.errors);
			}

			// Validate diagnoses
			const diagnoses = diagnosisCodesData.diagnoses || [];
			if (diagnoses.length === 0) {
				validationErrors.push('At least one diagnosis code is required');
			}
			for (const dx of diagnoses) {
				const dxValidation = validateIcd10(dx.code);
				if (!dxValidation.valid) {
					validationErrors.push(`Diagnosis ${dx.code}: ${dxValidation.errors.join(', ')}`);
				}
			}

			// Validate service lines
			const serviceLines = serviceLinesData.lines || [];
			if (serviceLines.length === 0) {
				validationErrors.push('At least one service line is required');
			}
			for (const line of serviceLines) {
				const cptValidation = validateCpt(line.procedureCode);
				if (!cptValidation.valid) {
					validationErrors.push(`Procedure ${line.procedureCode}: ${cptValidation.errors.join(', ')}`);
				}
				if (cptValidation.warnings) {
					validationWarnings.push(...cptValidation.warnings);
				}
			}

			// Check payer-specific rules via API
			const payerValidation = await client.post('/claims/validate', {
				payerId,
				claimType,
				diagnoses,
				serviceLines,
			});

			if (payerValidation.errors) {
				validationErrors.push(...payerValidation.errors);
			}
			if (payerValidation.warnings) {
				validationWarnings.push(...payerValidation.warnings);
			}

			returnData.push({
				json: {
					valid: validationErrors.length === 0,
					errors: validationErrors,
					warnings: validationWarnings,
					payerRules: payerValidation.payerRules,
				},
			});

		} else if (operation === 'getClaimStatus') {
			const claimId = this.getNodeParameter('claimId', index) as string;

			const response = await client.get(`/claims/${claimId}/status`);

			returnData.push({
				json: {
					success: true,
					claimId,
					status: response.status,
					statusDescription: response.statusDescription,
					lastUpdated: response.lastUpdated,
					payerClaimNumber: response.payerClaimNumber,
					adjudicationDate: response.adjudicationDate,
					paidAmount: response.paidAmount,
					patientResponsibility: response.patientResponsibility,
				},
			});

		} else if (operation === 'getAcknowledgment') {
			const claimId = this.getNodeParameter('claimId', index) as string;

			const response = await client.get(`/claims/${claimId}/acknowledgment`);

			returnData.push({
				json: {
					success: true,
					claimId,
					acknowledgmentType: response.ackType, // 997 or 999
					accepted: response.accepted,
					errors: response.errors,
					timestamp: response.timestamp,
					controlNumber: response.controlNumber,
				},
			});

		} else if (operation === 'batchSubmit') {
			const payerId = this.getNodeParameter('payerId', index) as string;
			const claimType = this.getNodeParameter('claimType', index) as string;
			const claimsJson = this.getNodeParameter('claims', index) as string;

			let claims: any[];
			try {
				claims = JSON.parse(claimsJson);
			} catch (e) {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON format for claims');
			}

			if (!Array.isArray(claims) || claims.length === 0) {
				throw new NodeOperationError(this.getNode(), 'Claims must be a non-empty array');
			}

			const response = await client.post('/claims/batch', {
				payerId,
				claimType,
				claims,
			});

			returnData.push({
				json: {
					success: true,
					batchId: response.batchId,
					claimCount: claims.length,
					status: 'submitted',
					submittedAt: new Date().toISOString(),
				},
			});

		} else if (operation === 'getSubmissionHistory') {
			const patientMemberId = this.getNodeParameter('patientMemberId', index) as string;
			const dateRangeStart = this.getNodeParameter('dateRangeStart', index) as string;
			const dateRangeEnd = this.getNodeParameter('dateRangeEnd', index) as string;

			const params: any = { memberId: patientMemberId };
			if (dateRangeStart) params.startDate = dateRangeStart;
			if (dateRangeEnd) params.endDate = dateRangeEnd;

			const response = await client.get('/claims/history', params);

			returnData.push({
				json: {
					success: true,
					memberId: patientMemberId,
					claims: response.claims,
					totalCount: response.totalCount,
				},
			});

		} else if (operation === 'resubmitClaim') {
			const claimId = this.getNodeParameter('claimId', index) as string;

			const response = await client.post(`/claims/${claimId}/resubmit`, {});

			returnData.push({
				json: {
					success: true,
					originalClaimId: claimId,
					newClaimId: response.newClaimId,
					status: 'resubmitted',
				},
			});

		} else if (operation === 'correctClaim') {
			const claimId = this.getNodeParameter('claimId', index) as string;
			const originalClaimReference = this.getNodeParameter('originalClaimReference', index) as string;

			// Get the original claim and allow corrections
			const response = await client.post(`/claims/${claimId}/correct`, {
				originalClaimReference,
				frequencyCode: '7', // Replacement
			});

			returnData.push({
				json: {
					success: true,
					originalClaimId: claimId,
					correctedClaimId: response.correctedClaimId,
					originalClaimReference,
					status: 'corrected',
				},
			});

		} else {
			throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}

	} catch (error: any) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		throw new NodeOperationError(this.getNode(), `Claim submission operation failed: ${error.message}`);
	}

	return returnData;
}
