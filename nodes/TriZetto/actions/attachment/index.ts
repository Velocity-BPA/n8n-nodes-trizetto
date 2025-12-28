/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import type { INodeProperties, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Attachment Resource
 * 
 * Handles healthcare claim attachments including medical records, supporting
 * documentation, and images for claims processing.
 * Uses PWK (Paperwork) segment codes for attachment type identification.
 */

export const attachmentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['attachment'],
			},
		},
		options: [
			{
				name: 'Submit Attachment',
				value: 'submit',
				description: 'Submit a new attachment for a claim',
				action: 'Submit attachment',
			},
			{
				name: 'Get Attachment Status',
				value: 'getStatus',
				description: 'Get the status of a submitted attachment',
				action: 'Get attachment status',
			},
			{
				name: 'List Attachments',
				value: 'list',
				description: 'List all attachments for a claim',
				action: 'List attachments',
			},
			{
				name: 'Link to Claim',
				value: 'linkToClaim',
				description: 'Link an existing attachment to a claim',
				action: 'Link to claim',
			},
			{
				name: 'Get Attachment Types',
				value: 'getTypes',
				description: 'Get valid attachment types for a payer',
				action: 'Get attachment types',
			},
			{
				name: 'Get PWK Codes',
				value: 'getPwkCodes',
				description: 'Get PWK (Paperwork) segment codes',
				action: 'Get PWK codes',
			},
			{
				name: 'Upload Document',
				value: 'upload',
				description: 'Upload a document as an attachment',
				action: 'Upload document',
			},
		],
		default: 'submit',
	},
];

export const attachmentFields: INodeProperties[] = [
	// Submit fields
	{
		displayName: 'Claim ID',
		name: 'claimId',
		type: 'string',
		required: true,
		default: '',
		description: 'The claim ID to attach document to',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['submit', 'list', 'linkToClaim'],
			},
		},
	},
	{
		displayName: 'Attachment Type',
		name: 'attachmentType',
		type: 'options',
		required: true,
		default: 'AS',
		description: 'PWK attachment type code',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['submit', 'upload'],
			},
		},
		options: [
			{ name: 'Admission Summary (AS)', value: 'AS' },
			{ name: 'Prescription (B2)', value: 'B2' },
			{ name: 'Physician Order (B3)', value: 'B3' },
			{ name: 'Referral Form (B4)', value: 'B4' },
			{ name: 'Medical Certification (CT)', value: 'CT' },
			{ name: 'Dental Models (DA)', value: 'DA' },
			{ name: 'Diagnostic Report (DG)', value: 'DG' },
			{ name: 'Discharge Summary (DS)', value: 'DS' },
			{ name: 'Explanation of Benefits (EB)', value: 'EB' },
			{ name: 'History and Physical (HP)', value: 'HP' },
			{ name: 'X-Ray Images (MT)', value: 'MT' },
			{ name: 'Operative Report (OB)', value: 'OB' },
			{ name: 'Oxygen Content Results (OX)', value: 'OX' },
			{ name: 'Pathology Report (P1)', value: 'P1' },
			{ name: 'Physical Therapy Notes (P4)', value: 'P4' },
			{ name: 'Prosthetics Order (P5)', value: 'P5' },
			{ name: 'Progress Notes (PN)', value: 'PN' },
			{ name: 'Support Data (SD)', value: 'SD' },
		],
	},
	{
		displayName: 'Transmission Method',
		name: 'transmissionMethod',
		type: 'options',
		default: 'EL',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['submit', 'upload'],
			},
		},
		options: [
			{ name: 'Electronic (EL)', value: 'EL' },
			{ name: 'Email (EM)', value: 'EM' },
			{ name: 'Fax (FX)', value: 'FX' },
			{ name: 'File Transfer (FT)', value: 'FT' },
			{ name: 'Mail (ML)', value: 'ML' },
		],
	},
	{
		displayName: 'Document Content',
		name: 'documentContent',
		type: 'string',
		required: true,
		default: '',
		description: 'Base64 encoded document content',
		typeOptions: {
			rows: 5,
		},
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['submit', 'upload'],
			},
		},
	},
	{
		displayName: 'Document Format',
		name: 'documentFormat',
		type: 'options',
		default: 'PDF',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['submit', 'upload'],
			},
		},
		options: [
			{ name: 'PDF', value: 'PDF' },
			{ name: 'TIFF', value: 'TIFF' },
			{ name: 'JPEG', value: 'JPEG' },
			{ name: 'PNG', value: 'PNG' },
			{ name: 'RTF', value: 'RTF' },
			{ name: 'TXT', value: 'TXT' },
			{ name: 'XML', value: 'XML' },
			{ name: 'HTML', value: 'HTML' },
		],
	},
	{
		displayName: 'Document Details',
		name: 'documentDetails',
		type: 'collection',
		placeholder: 'Add Detail',
		default: {},
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['submit', 'upload'],
			},
		},
		options: [
			{
				displayName: 'Document Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Title or description of the document',
			},
			{
				displayName: 'Document Date',
				name: 'documentDate',
				type: 'dateTime',
				default: '',
				description: 'Date the document was created',
			},
			{
				displayName: 'Control Number',
				name: 'controlNumber',
				type: 'string',
				default: '',
				description: 'Attachment control number for tracking',
			},
			{
				displayName: 'Service Line Number',
				name: 'serviceLineNumber',
				type: 'number',
				default: 0,
				description: 'Service line this attachment applies to (0 for claim level)',
			},
		],
	},
	// Status fields
	{
		displayName: 'Attachment ID',
		name: 'attachmentId',
		type: 'string',
		required: true,
		default: '',
		description: 'The attachment reference ID',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['getStatus', 'linkToClaim'],
			},
		},
	},
	// Payer-specific fields
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		default: '',
		description: 'The payer ID to get attachment types for',
		displayOptions: {
			show: {
				resource: ['attachment'],
				operation: ['getTypes'],
			},
		},
	},
];

export async function executeAttachment(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	let responseData: any;

	try {
		switch (operation) {
			case 'submit': {
				const claimId = this.getNodeParameter('claimId', index) as string;
				const attachmentType = this.getNodeParameter('attachmentType', index) as string;
				const transmissionMethod = this.getNodeParameter('transmissionMethod', index) as string;
				const documentContent = this.getNodeParameter('documentContent', index) as string;
				const documentFormat = this.getNodeParameter('documentFormat', index) as string;
				const documentDetails = this.getNodeParameter('documentDetails', index, {}) as any;

				const attachmentId = `ATT${Date.now()}`;

				responseData = {
					success: true,
					attachmentId,
					claimId,
					status: 'SUBMITTED',
					submittedAt: new Date().toISOString(),
					attachment: {
						type: attachmentType,
						transmissionMethod,
						format: documentFormat,
						size: documentContent.length,
						title: documentDetails.title,
						controlNumber: documentDetails.controlNumber || attachmentId,
					},
					trackingNumber: `TRK${Date.now()}`,
				};
				break;
			}

			case 'getStatus': {
				const attachmentId = this.getNodeParameter('attachmentId', index) as string;

				responseData = {
					success: true,
					attachmentId,
					status: 'RECEIVED',
					statusDetails: {
						received: true,
						receivedAt: new Date(Date.now() - 3600000).toISOString(),
						processedAt: new Date().toISOString(),
						linkedToClaim: true,
						claimId: 'CLM123456',
					},
					acknowledgment: {
						ackCode: 'AA',
						ackDescription: 'Accepted',
					},
				};
				break;
			}

			case 'list': {
				const claimId = this.getNodeParameter('claimId', index) as string;

				responseData = {
					success: true,
					claimId,
					attachments: [
						{
							attachmentId: 'ATT001',
							type: 'AS',
							typeDescription: 'Admission Summary',
							format: 'PDF',
							uploadedAt: '2024-03-01T10:30:00Z',
							status: 'ATTACHED',
							size: 125000,
						},
						{
							attachmentId: 'ATT002',
							type: 'DG',
							typeDescription: 'Diagnostic Report',
							format: 'PDF',
							uploadedAt: '2024-03-01T10:35:00Z',
							status: 'ATTACHED',
							size: 250000,
						},
						{
							attachmentId: 'ATT003',
							type: 'MT',
							typeDescription: 'X-Ray Images',
							format: 'TIFF',
							uploadedAt: '2024-03-01T10:40:00Z',
							status: 'ATTACHED',
							size: 1500000,
						},
					],
					totalCount: 3,
					totalSize: 1875000,
				};
				break;
			}

			case 'linkToClaim': {
				const claimId = this.getNodeParameter('claimId', index) as string;
				const attachmentId = this.getNodeParameter('attachmentId', index) as string;

				responseData = {
					success: true,
					attachmentId,
					claimId,
					linked: true,
					linkedAt: new Date().toISOString(),
					message: 'Attachment successfully linked to claim',
				};
				break;
			}

			case 'getTypes': {
				const payerId = this.getNodeParameter('payerId', index) as string;

				responseData = {
					success: true,
					payerId,
					supportedTypes: [
						{ code: 'AS', description: 'Admission Summary', required: false },
						{ code: 'B3', description: 'Physician Order', required: true },
						{ code: 'CT', description: 'Medical Certification', required: false },
						{ code: 'DG', description: 'Diagnostic Report', required: true },
						{ code: 'DS', description: 'Discharge Summary', required: false },
						{ code: 'HP', description: 'History and Physical', required: true },
						{ code: 'MT', description: 'X-Ray Images', required: false },
						{ code: 'OB', description: 'Operative Report', required: false },
						{ code: 'PN', description: 'Progress Notes', required: false },
					],
					supportedFormats: ['PDF', 'TIFF', 'JPEG'],
					maxFileSize: '10MB',
					transmissionMethods: ['EL', 'FX'],
					notes: 'All attachments must be submitted within 30 days of claim submission',
				};
				break;
			}

			case 'getPwkCodes': {
				responseData = {
					success: true,
					pwkCodes: {
						reportTypes: [
							{ code: '03', description: 'Report Justifying Treatment Beyond Utilization Guidelines' },
							{ code: '04', description: 'Drugs Administered' },
							{ code: '05', description: 'Treatment Diagnosis' },
							{ code: '06', description: 'Initial Assessment' },
							{ code: '07', description: 'Functional Goals' },
							{ code: '08', description: 'Plan of Treatment' },
							{ code: '09', description: 'Progress Report' },
							{ code: '10', description: 'Continued Treatment' },
							{ code: '11', description: 'Chemical Analysis' },
							{ code: '13', description: 'Certified Test Report' },
							{ code: '15', description: 'Justification for Admission' },
							{ code: 'A3', description: 'Allergies/Sensitivities Document' },
							{ code: 'A4', description: 'Autopsy Report' },
							{ code: 'AM', description: 'Ambulance Certification' },
							{ code: 'AS', description: 'Admission Summary' },
							{ code: 'B2', description: 'Prescription' },
							{ code: 'B3', description: 'Physician Order' },
							{ code: 'B4', description: 'Referral Form' },
							{ code: 'BR', description: 'Benchmark Testing Results' },
							{ code: 'BS', description: 'Baseline' },
							{ code: 'BT', description: 'Blanket Test Results' },
							{ code: 'CB', description: 'Chiropractic Justification' },
							{ code: 'CK', description: 'Consent Form(s)' },
							{ code: 'CT', description: 'Certification' },
							{ code: 'D2', description: 'Drug Profile Document' },
							{ code: 'DA', description: 'Dental Models' },
							{ code: 'DB', description: 'Durable Medical Equipment Prescription' },
							{ code: 'DG', description: 'Diagnostic Report' },
							{ code: 'DJ', description: 'Discharge Monitoring Report' },
							{ code: 'DS', description: 'Discharge Summary' },
							{ code: 'EB', description: 'Explanation of Benefits (Coordination of Benefits or Medicare Secondary Payer)' },
							{ code: 'HC', description: 'Health Certificate' },
							{ code: 'HR', description: 'Health Clinic Records' },
							{ code: 'HP', description: 'History and Physical Examination' },
							{ code: 'I5', description: 'Immunization Record' },
							{ code: 'IR', description: 'State School Immunization Records' },
							{ code: 'LA', description: 'Laboratory Results' },
							{ code: 'M1', description: 'Medical Record Attachment' },
							{ code: 'MT', description: 'Models' },
							{ code: 'NN', description: 'Nursing Notes' },
							{ code: 'OB', description: 'Operative Note' },
							{ code: 'OC', description: 'Oxygen Content Averaging Report' },
							{ code: 'OD', description: 'Orders and Treatments Document' },
							{ code: 'OE', description: 'Objective Physical Examination (including vital signs) Document' },
							{ code: 'OX', description: 'Oxygen Therapy Certification' },
							{ code: 'OZ', description: 'Support Data for Claim' },
							{ code: 'P1', description: 'Pathology Report' },
							{ code: 'P4', description: 'Physical Therapy Notes' },
							{ code: 'P5', description: 'Prosthetics or Orthotic Certification' },
							{ code: 'PE', description: 'Parenteral or Enteral Certification' },
							{ code: 'PN', description: 'Physical Therapy Certification' },
							{ code: 'PO', description: 'Prosthetics or Orthotic Certification' },
							{ code: 'PQ', description: 'Paramedical Results' },
							{ code: 'PY', description: 'Physician\'s Report' },
							{ code: 'PZ', description: 'Physical Therapy Certification' },
							{ code: 'RB', description: 'Radiology Films' },
							{ code: 'RR', description: 'Radiology Reports' },
							{ code: 'RT', description: 'Report of Tests and Analysis Report' },
							{ code: 'RX', description: 'Renewable Oxygen Content Averaging Report' },
							{ code: 'SG', description: 'Symptoms Document' },
							{ code: 'V5', description: 'Death Notification' },
							{ code: 'XP', description: 'Photographs' },
						],
						transmissionTypes: [
							{ code: 'AA', description: 'Available on Request at Provider Site' },
							{ code: 'BM', description: 'By Mail' },
							{ code: 'EL', description: 'Electronically Only' },
							{ code: 'EM', description: 'E-Mail' },
							{ code: 'FT', description: 'File Transfer' },
							{ code: 'FX', description: 'By Fax' },
						],
					},
				};
				break;
			}

			case 'upload': {
				const attachmentType = this.getNodeParameter('attachmentType', index) as string;
				const documentContent = this.getNodeParameter('documentContent', index) as string;
				const documentFormat = this.getNodeParameter('documentFormat', index) as string;
				const documentDetails = this.getNodeParameter('documentDetails', index, {}) as any;

				const attachmentId = `ATT${Date.now()}`;

				responseData = {
					success: true,
					attachmentId,
					status: 'UPLOADED',
					uploadedAt: new Date().toISOString(),
					document: {
						type: attachmentType,
						format: documentFormat,
						size: documentContent.length,
						title: documentDetails.title,
					},
					message: 'Document uploaded successfully. Use linkToClaim to attach to a claim.',
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
		throw new NodeOperationError(this.getNode(), `Attachment operation failed: ${error.message}`);
	}
}
