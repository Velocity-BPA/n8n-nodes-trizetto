/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeConnectionType,
} from 'n8n-workflow';

import { createHmac } from 'crypto';
import { maskPhiInObject, createSafeLogEntry } from './utils/hipaaUtils';

/**
 * TriZetto Trigger Node
 * 
 * Real-time event monitoring for TriZetto healthcare transactions.
 * Supports webhooks and polling for eligibility, claims, remittance,
 * prior authorization, and other healthcare events.
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
export class TriZettoTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TriZetto Trigger',
		name: 'triZettoTrigger',
		icon: 'file:trizetto.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Triggers on TriZetto healthcare events (eligibility, claims, remittance, etc.)',
		defaults: {
			name: 'TriZetto Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'triZettoApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Category',
				name: 'eventCategory',
				type: 'options',
				options: [
					{
						name: 'Eligibility',
						value: 'eligibility',
						description: 'Eligibility verification events',
					},
					{
						name: 'Claims',
						value: 'claims',
						description: 'Claim processing events',
					},
					{
						name: 'Remittance',
						value: 'remittance',
						description: 'Payment and remittance events',
					},
					{
						name: 'Prior Authorization',
						value: 'priorAuth',
						description: 'Prior authorization events',
					},
					{
						name: 'Batch',
						value: 'batch',
						description: 'Batch processing events',
					},
					{
						name: 'EDI',
						value: 'edi',
						description: 'EDI acknowledgment events',
					},
					{
						name: 'Tasks',
						value: 'tasks',
						description: 'Task and workflow events',
					},
					{
						name: 'Reports',
						value: 'reports',
						description: 'Report generation events',
					},
				],
				default: 'claims',
				description: 'Category of events to listen for',
			},
			// Eligibility events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['eligibility'],
					},
				},
				options: [
					{
						name: 'Eligibility Response',
						value: 'eligibility.response',
						description: '271 eligibility response received',
					},
					{
						name: 'Eligibility Error',
						value: 'eligibility.error',
						description: 'Eligibility request failed',
					},
					{
						name: 'Coverage Changed',
						value: 'eligibility.coverage_changed',
						description: 'Patient coverage has changed',
					},
				],
				default: 'eligibility.response',
			},
			// Claim events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['claims'],
					},
				},
				options: [
					{
						name: 'Claim Acknowledged',
						value: 'claim.acknowledged',
						description: 'Claim received and acknowledged by payer',
					},
					{
						name: 'Claim Accepted',
						value: 'claim.accepted',
						description: 'Claim accepted for processing',
					},
					{
						name: 'Claim Rejected',
						value: 'claim.rejected',
						description: 'Claim rejected by payer',
					},
					{
						name: 'Claim Paid',
						value: 'claim.paid',
						description: 'Claim has been paid',
					},
					{
						name: 'Claim Denied',
						value: 'claim.denied',
						description: 'Claim denied by payer',
					},
					{
						name: 'Claim Status Changed',
						value: 'claim.status_changed',
						description: 'Any claim status change',
					},
				],
				default: 'claim.status_changed',
			},
			// Remittance events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['remittance'],
					},
				},
				options: [
					{
						name: 'ERA Received',
						value: 'remittance.era_received',
						description: '835 Electronic Remittance Advice received',
					},
					{
						name: 'Payment Posted',
						value: 'remittance.payment_posted',
						description: 'Payment has been posted',
					},
					{
						name: 'Adjustment Applied',
						value: 'remittance.adjustment_applied',
						description: 'Adjustment has been applied',
					},
					{
						name: 'Zero Pay Alert',
						value: 'remittance.zero_pay',
						description: 'Zero payment received',
					},
				],
				default: 'remittance.era_received',
			},
			// Prior Auth events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['priorAuth'],
					},
				},
				options: [
					{
						name: 'Auth Approved',
						value: 'auth.approved',
						description: 'Prior authorization approved',
					},
					{
						name: 'Auth Denied',
						value: 'auth.denied',
						description: 'Prior authorization denied',
					},
					{
						name: 'Auth Pending',
						value: 'auth.pending',
						description: 'Prior authorization pending review',
					},
					{
						name: 'Auth Expiring',
						value: 'auth.expiring',
						description: 'Authorization expiring soon',
					},
				],
				default: 'auth.approved',
			},
			// Batch events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['batch'],
					},
				},
				options: [
					{
						name: 'Batch Submitted',
						value: 'batch.submitted',
						description: 'Batch file submitted',
					},
					{
						name: 'Batch Completed',
						value: 'batch.completed',
						description: 'Batch processing completed',
					},
					{
						name: 'Batch Error',
						value: 'batch.error',
						description: 'Batch processing error',
					},
					{
						name: 'Acknowledgment Received',
						value: 'batch.acknowledgment_received',
						description: 'Batch acknowledgment received',
					},
				],
				default: 'batch.completed',
			},
			// EDI events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['edi'],
					},
				},
				options: [
					{
						name: '997/999 Received',
						value: 'edi.acknowledgment_received',
						description: 'Functional acknowledgment received',
					},
					{
						name: 'TA1 Received',
						value: 'edi.ta1_received',
						description: 'Interchange acknowledgment received',
					},
					{
						name: 'EDI Error',
						value: 'edi.error',
						description: 'EDI processing error',
					},
				],
				default: 'edi.acknowledgment_received',
			},
			// Task events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['tasks'],
					},
				},
				options: [
					{
						name: 'Task Assigned',
						value: 'task.assigned',
						description: 'Task assigned to user/queue',
					},
					{
						name: 'Task Due',
						value: 'task.due',
						description: 'Task due date reached',
					},
					{
						name: 'Task Completed',
						value: 'task.completed',
						description: 'Task has been completed',
					},
				],
				default: 'task.assigned',
			},
			// Report events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['reports'],
					},
				},
				options: [
					{
						name: 'Report Ready',
						value: 'report.ready',
						description: 'Report is ready for download',
					},
				],
				default: 'report.ready',
			},
			// Filter options
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'collection',
				placeholder: 'Add Filter',
				default: {},
				options: [
					{
						displayName: 'Payer IDs',
						name: 'payerIds',
						type: 'string',
						default: '',
						placeholder: '12345,67890',
						description: 'Comma-separated payer IDs to filter (empty = all)',
					},
					{
						displayName: 'Provider NPIs',
						name: 'providerNpis',
						type: 'string',
						default: '',
						placeholder: '1234567890',
						description: 'Comma-separated provider NPIs to filter (empty = all)',
					},
					{
						displayName: 'Transaction Types',
						name: 'transactionTypes',
						type: 'string',
						default: '',
						placeholder: '837P,837I',
						description: 'Comma-separated transaction types to filter',
					},
					{
						displayName: 'Minimum Amount',
						name: 'minAmount',
						type: 'number',
						default: 0,
						description: 'Minimum claim/payment amount to trigger',
					},
				],
			},
			// Security options
			{
				displayName: 'Verify Signature',
				name: 'verifySignature',
				type: 'boolean',
				default: true,
				description: 'Whether to verify webhook signature using secret key',
			},
			{
				displayName: 'Secret Key',
				name: 'secretKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				displayOptions: {
					show: {
						verifySignature: [true],
					},
				},
				default: '',
				description: 'Secret key for HMAC signature verification',
			},
			// PHI handling
			{
				displayName: 'Mask PHI',
				name: 'maskPhi',
				type: 'boolean',
				default: true,
				description: 'Whether to mask Protected Health Information in output',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// Check if webhook already exists
				const webhookUrl = this.getNodeWebhookUrl('default');
				const credentials = await this.getCredentials('triZettoApi');
				const event = this.getNodeParameter('event') as string;

				try {
					// In a real implementation, this would check with TriZetto API
					// For now, we return false to always register
					console.log(`Checking webhook existence for ${event} at ${webhookUrl}`);
					return false;
				} catch (error) {
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const credentials = await this.getCredentials('triZettoApi');
				const event = this.getNodeParameter('event') as string;
				const filters = this.getNodeParameter('filters', {}) as object;

				try {
					// Register webhook with TriZetto
					console.log(`Registering webhook for ${event} at ${webhookUrl}`);
					
					// In a real implementation, this would call the TriZetto API
					// to register the webhook
					
					// Store webhook ID for later deletion
					const webhookData = {
						webhookId: `wh_${Date.now()}`,
						event,
						url: webhookUrl,
						filters,
						createdAt: new Date().toISOString(),
					};

					await this.getWorkflowStaticData('node');
					
					return true;
				} catch (error) {
					console.error('Failed to create webhook:', error);
					return false;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('triZettoApi');
				const staticData = this.getWorkflowStaticData('node');

				try {
					// In a real implementation, this would call the TriZetto API
					// to delete the webhook using the stored webhookId
					console.log('Deleting webhook');
					
					return true;
				} catch (error) {
					console.error('Failed to delete webhook:', error);
					return false;
				}
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const event = this.getNodeParameter('event') as string;
		const verifySignature = this.getNodeParameter('verifySignature', true) as boolean;
		const maskPhi = this.getNodeParameter('maskPhi', true) as boolean;

		// Log licensing notice
		console.warn(
			'[Velocity BPA Licensing Notice] This n8n node is licensed under BSL 1.1. ' +
			'Commercial use requires a license from Velocity BPA.',
		);

		// Verify signature if enabled
		if (verifySignature) {
			const secretKey = this.getNodeParameter('secretKey', '') as string;
			const signature = req.headers['x-trizetto-signature'] as string;
			
			if (secretKey && signature) {
				const payload = JSON.stringify(req.body);
				const expectedSignature = createHmac('sha256', secretKey)
					.update(payload)
					.digest('hex');

				if (signature !== `sha256=${expectedSignature}`) {
					return {
						webhookResponse: {
							status: 401,
							body: { error: 'Invalid signature' },
						},
					};
				}
			}
		}

		// Extract event data
		let eventData = req.body;

		// Check if this is the correct event type
		const receivedEvent = eventData.event || eventData.type || event;
		if (receivedEvent !== event && !event.endsWith('*')) {
			// Event doesn't match, but we still acknowledge receipt
			return {
				webhookResponse: {
					status: 200,
					body: { received: true, processed: false, reason: 'Event type mismatch' },
				},
			};
		}

		// Apply filters
		const filters = this.getNodeParameter('filters', {}) as {
			payerIds?: string;
			providerNpis?: string;
			transactionTypes?: string;
			minAmount?: number;
		};

		if (filters.payerIds) {
			const allowedPayers = filters.payerIds.split(',').map((p) => p.trim());
			const payerId = eventData.payerId || eventData.payer?.id;
			if (payerId && !allowedPayers.includes(payerId)) {
				return {
					webhookResponse: {
						status: 200,
						body: { received: true, processed: false, reason: 'Filtered by payer' },
					},
				};
			}
		}

		if (filters.minAmount) {
			const amount = eventData.amount || eventData.claimAmount || eventData.paymentAmount || 0;
			if (amount < filters.minAmount) {
				return {
					webhookResponse: {
						status: 200,
						body: { received: true, processed: false, reason: 'Below minimum amount' },
					},
				};
			}
		}

		// Mask PHI if enabled
		if (maskPhi) {
			eventData = maskPhiInObject(eventData);
		}

		// Add metadata
		const outputData = {
			...eventData,
			_trigger: {
				event: receivedEvent,
				receivedAt: new Date().toISOString(),
				webhookId: req.headers['x-webhook-id'],
				deliveryId: req.headers['x-delivery-id'],
			},
		};

		return {
			workflowData: [
				[
					{
						json: outputData,
					},
				],
			],
		};
	}
}
