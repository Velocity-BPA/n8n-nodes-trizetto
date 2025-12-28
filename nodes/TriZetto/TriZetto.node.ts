/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

// Import all resource modules
import * as eligibility from './actions/eligibility';
import * as claimSubmission from './actions/claimSubmission';
import * as claimStatus from './actions/claimStatus';
import * as remittance from './actions/remittance';
import * as priorAuth from './actions/priorAuth';
import * as attachment from './actions/attachment';
import * as provider from './actions/provider';
import * as payer from './actions/payer';
import * as patient from './actions/patient';
import * as facility from './actions/facility';
import * as codeValidation from './actions/codeValidation';
import * as batch from './actions/batch';
import * as edi from './actions/edi';
import * as realTime from './actions/realTime';
import * as careAdvance from './actions/careAdvance';
import * as report from './actions/report';
import * as analytics from './actions/analytics';
import * as clearinghouse from './actions/clearinghouse';
import * as enrollment from './actions/enrollment';
import * as sftp from './actions/sftp';
import * as webhook from './actions/webhook';
import * as utility from './actions/utility';

/**
 * TriZetto Node
 * 
 * A comprehensive n8n community node for TriZetto healthcare platform integration.
 * Supports eligibility verification (270/271), claim submission (837), claim status (276/277),
 * remittance advice (835), prior authorization, and many other healthcare operations.
 * 
 * [Velocity BPA Licensing Notice]
 * 
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * 
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * 
 * For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.
 */
export class TriZetto implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TriZetto',
		name: 'triZetto',
		icon: 'file:trizetto.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with TriZetto healthcare platform for eligibility, claims, remittance, and more',
		defaults: {
			name: 'TriZetto',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'triZettoApi',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'eligibility',
							'claimSubmission',
							'claimStatus',
							'remittance',
							'priorAuth',
							'attachment',
							'provider',
							'payer',
							'patient',
							'facility',
							'codeValidation',
							'batch',
							'edi',
							'realTime',
							'careAdvance',
							'report',
							'analytics',
							'clearinghouse',
							'enrollment',
							'webhook',
							'utility',
						],
					},
				},
			},
			{
				name: 'triZettoGateway',
				required: false,
				displayOptions: {
					show: {
						resource: ['edi', 'batch', 'clearinghouse'],
					},
				},
			},
			{
				name: 'triZettoSftp',
				required: true,
				displayOptions: {
					show: {
						resource: ['sftp'],
					},
				},
			},
		],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Analytics',
						value: 'analytics',
						description: 'Revenue and denial analytics',
					},
					{
						name: 'Attachment',
						value: 'attachment',
						description: 'Claim attachments and documents',
					},
					{
						name: 'Batch',
						value: 'batch',
						description: 'Batch file processing',
					},
					{
						name: 'CareAdvance (RCM)',
						value: 'careAdvance',
						description: 'Revenue Cycle Management tasks',
					},
					{
						name: 'Claim Status',
						value: 'claimStatus',
						description: '276/277 claim status inquiry',
					},
					{
						name: 'Claim Submission',
						value: 'claimSubmission',
						description: '837P/I/D claim submission',
					},
					{
						name: 'Clearinghouse',
						value: 'clearinghouse',
						description: 'Clearinghouse operations',
					},
					{
						name: 'Code Validation',
						value: 'codeValidation',
						description: 'Medical code validation',
					},
					{
						name: 'EDI',
						value: 'edi',
						description: 'EDI transaction management',
					},
					{
						name: 'Eligibility',
						value: 'eligibility',
						description: '270/271 eligibility verification',
					},
					{
						name: 'Enrollment',
						value: 'enrollment',
						description: 'Payer enrollment management',
					},
					{
						name: 'Facility',
						value: 'facility',
						description: 'Healthcare facility operations',
					},
					{
						name: 'Patient',
						value: 'patient',
						description: 'Patient information',
					},
					{
						name: 'Payer',
						value: 'payer',
						description: 'Payer information and rules',
					},
					{
						name: 'Prior Authorization',
						value: 'priorAuth',
						description: 'Prior authorization requests',
					},
					{
						name: 'Provider',
						value: 'provider',
						description: 'Provider information',
					},
					{
						name: 'Real-Time',
						value: 'realTime',
						description: 'Real-time transactions',
					},
					{
						name: 'Remittance',
						value: 'remittance',
						description: '835 remittance advice',
					},
					{
						name: 'Report',
						value: 'report',
						description: 'Generate and retrieve reports',
					},
					{
						name: 'SFTP',
						value: 'sftp',
						description: 'Secure file transfer operations',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Validation and code lookups',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Webhook management',
					},
				],
				default: 'eligibility',
			},
			// All resource operations
			...eligibility.eligibilityOperations,
			...claimSubmission.claimSubmissionOperations,
			...claimStatus.claimStatusOperations,
			...remittance.remittanceOperations,
			...priorAuth.priorAuthOperations,
			...attachment.attachmentOperations,
			...provider.providerOperations,
			...payer.payerOperations,
			...patient.patientOperations,
			...facility.facilityOperations,
			...codeValidation.codeValidationOperations,
			...batch.batchOperations,
			...edi.ediOperations,
			...realTime.realTimeOperations,
			...careAdvance.careAdvanceOperations,
			...report.reportOperations,
			...analytics.analyticsOperations,
			...clearinghouse.clearinghouseOperations,
			...enrollment.enrollmentOperations,
			...sftp.sftpOperations,
			...webhook.webhookOperations,
			...utility.utilityOperations,
			// All resource fields
			...eligibility.eligibilityFields,
			...claimSubmission.claimSubmissionFields,
			...claimStatus.claimStatusFields,
			...remittance.remittanceFields,
			...priorAuth.priorAuthFields,
			...attachment.attachmentFields,
			...provider.providerFields,
			...payer.payerFields,
			...patient.patientFields,
			...facility.facilityFields,
			...codeValidation.codeValidationFields,
			...batch.batchFields,
			...edi.ediFields,
			...realTime.realTimeFields,
			...careAdvance.careAdvanceFields,
			...report.reportFields,
			...analytics.analyticsFields,
			...clearinghouse.clearinghouseFields,
			...enrollment.enrollmentFields,
			...sftp.sftpFields,
			...webhook.webhookFields,
			...utility.utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Log licensing notice (once per execution)
		console.warn(
			'[Velocity BPA Licensing Notice] This n8n node is licensed under BSL 1.1. ' +
			'Commercial use requires a license from Velocity BPA. ' +
			'Visit https://velobpa.com/licensing for details.',
		);

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				let result: INodeExecutionData[];

				switch (resource) {
					case 'eligibility':
						result = await eligibility.executeEligibility.call(this, i);
						break;
					case 'claimSubmission':
						result = await claimSubmission.executeClaimSubmission.call(this, i);
						break;
					case 'claimStatus':
						result = await claimStatus.executeClaimStatus.call(this, i);
						break;
					case 'remittance':
						result = await remittance.executeRemittance.call(this, i);
						break;
					case 'priorAuth':
						result = await priorAuth.executePriorAuth.call(this, i);
						break;
					case 'attachment':
						result = await attachment.executeAttachment.call(this, i);
						break;
					case 'provider':
						result = await provider.executeProvider.call(this, i);
						break;
					case 'payer':
						result = await payer.executePayer.call(this, i);
						break;
					case 'patient':
						result = await patient.executePatient.call(this, i);
						break;
					case 'facility':
						result = await facility.executeFacility.call(this, i);
						break;
					case 'codeValidation':
						result = await codeValidation.executeCodeValidation.call(this, i);
						break;
					case 'batch':
						result = await batch.executeBatch.call(this, i);
						break;
					case 'edi':
						result = await edi.executeEdi.call(this, i);
						break;
					case 'realTime':
						result = await realTime.executeRealTime.call(this, i);
						break;
					case 'careAdvance':
						result = await careAdvance.execute.call(this, i);
						break;
					case 'report':
						result = await report.execute.call(this, i);
						break;
					case 'analytics':
						result = await analytics.execute.call(this, i);
						break;
					case 'clearinghouse':
						result = await clearinghouse.execute.call(this, i);
						break;
					case 'enrollment':
						result = await enrollment.execute.call(this, i);
						break;
					case 'sftp':
						result = await sftp.executeSftpOperation.call(this, i);
						break;
					case 'webhook':
						result = await webhook.executeWebhookOperation.call(this, i);
						break;
					case 'utility':
						result = await utility.executeUtilityOperation.call(this, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push(...result);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : 'Unknown error',
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
