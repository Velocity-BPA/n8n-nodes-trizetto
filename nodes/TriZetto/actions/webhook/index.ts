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
import { createSafeLogEntry } from '../../utils/hipaaUtils';

/**
 * Webhook Resource
 * 
 * Manages webhook configurations for receiving real-time notifications
 * from TriZetto about claim status changes, payment events, and other updates.
 */

export const webhookOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		options: [
			{
				name: 'Create Webhook',
				value: 'createWebhook',
				description: 'Create a new webhook subscription',
				action: 'Create webhook',
			},
			{
				name: 'Get Webhook',
				value: 'getWebhook',
				description: 'Get details of a webhook subscription',
				action: 'Get webhook',
			},
			{
				name: 'Update Webhook',
				value: 'updateWebhook',
				description: 'Update an existing webhook subscription',
				action: 'Update webhook',
			},
			{
				name: 'Delete Webhook',
				value: 'deleteWebhook',
				description: 'Delete a webhook subscription',
				action: 'Delete webhook',
			},
			{
				name: 'List Webhooks',
				value: 'listWebhooks',
				description: 'List all webhook subscriptions',
				action: 'List webhooks',
			},
			{
				name: 'Verify Webhook',
				value: 'verifyWebhook',
				description: 'Verify a webhook subscription is active',
				action: 'Verify webhook',
			},
			{
				name: 'Test Webhook',
				value: 'testWebhook',
				description: 'Send a test event to a webhook',
				action: 'Test webhook',
			},
			{
				name: 'Get Webhook Events',
				value: 'getWebhookEvents',
				description: 'Get list of available webhook event types',
				action: 'Get webhook events',
			},
		],
		default: 'createWebhook',
	},
];

export const webhookFields: INodeProperties[] = [
	// Webhook ID for get/update/delete operations
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['getWebhook', 'updateWebhook', 'deleteWebhook', 'verifyWebhook', 'testWebhook'],
			},
		},
		default: '',
		description: 'The unique identifier of the webhook',
	},

	// Create/Update fields
	{
		displayName: 'Webhook URL',
		name: 'webhookUrl',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: '',
		placeholder: 'https://your-domain.com/webhook',
		description: 'The URL where webhook events will be sent',
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		required: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		options: [
			// Eligibility events
			{ name: 'Eligibility Response', value: 'eligibility.response' },
			{ name: 'Eligibility Error', value: 'eligibility.error' },
			{ name: 'Coverage Changed', value: 'eligibility.coverage_changed' },

			// Claim events
			{ name: 'Claim Acknowledged', value: 'claim.acknowledged' },
			{ name: 'Claim Accepted', value: 'claim.accepted' },
			{ name: 'Claim Rejected', value: 'claim.rejected' },
			{ name: 'Claim Paid', value: 'claim.paid' },
			{ name: 'Claim Denied', value: 'claim.denied' },
			{ name: 'Claim Status Changed', value: 'claim.status_changed' },

			// Remittance events
			{ name: 'ERA Received', value: 'remittance.era_received' },
			{ name: 'Payment Posted', value: 'remittance.payment_posted' },
			{ name: 'Adjustment Applied', value: 'remittance.adjustment_applied' },
			{ name: 'Zero Pay Alert', value: 'remittance.zero_pay' },

			// Prior auth events
			{ name: 'Auth Approved', value: 'auth.approved' },
			{ name: 'Auth Denied', value: 'auth.denied' },
			{ name: 'Auth Pending', value: 'auth.pending' },
			{ name: 'Auth Expiring', value: 'auth.expiring' },

			// Batch events
			{ name: 'Batch Submitted', value: 'batch.submitted' },
			{ name: 'Batch Completed', value: 'batch.completed' },
			{ name: 'Batch Error', value: 'batch.error' },

			// EDI events
			{ name: '997/999 Received', value: 'edi.acknowledgment_received' },
			{ name: 'TA1 Received', value: 'edi.ta1_received' },
			{ name: 'EDI Error', value: 'edi.error' },

			// Task events
			{ name: 'Task Assigned', value: 'task.assigned' },
			{ name: 'Task Due', value: 'task.due' },
			{ name: 'Task Completed', value: 'task.completed' },

			// Report events
			{ name: 'Report Ready', value: 'report.ready' },
		],
		default: [],
		description: 'Events that will trigger this webhook',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: '',
		placeholder: 'Claim Status Updates',
		description: 'A friendly name for this webhook',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: '',
		description: 'A description of what this webhook is used for',
	},
	{
		displayName: 'Active',
		name: 'active',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: true,
		description: 'Whether the webhook is active and receiving events',
	},

	// Filter options
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Payer IDs',
				name: 'payerIds',
				type: 'string',
				default: '',
				placeholder: '12345,67890',
				description: 'Comma-separated payer IDs to filter events (empty = all payers)',
			},
			{
				displayName: 'Provider NPIs',
				name: 'providerNpis',
				type: 'string',
				default: '',
				placeholder: '1234567890,0987654321',
				description: 'Comma-separated provider NPIs to filter events (empty = all providers)',
			},
			{
				displayName: 'Claim Amount Threshold',
				name: 'claimAmountThreshold',
				type: 'number',
				default: 0,
				description: 'Only send events for claims above this amount',
			},
		],
	},

	// Security options
	{
		displayName: 'Security',
		name: 'security',
		type: 'collection',
		placeholder: 'Add Security Option',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Secret Key',
				name: 'secretKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Secret key for signing webhook payloads (HMAC-SHA256)',
			},
			{
				displayName: 'Require SSL',
				name: 'requireSsl',
				type: 'boolean',
				default: true,
				description: 'Whether to require HTTPS for webhook URL',
			},
			{
				displayName: 'IP Whitelist',
				name: 'ipWhitelist',
				type: 'string',
				default: '',
				placeholder: '192.168.1.0/24,10.0.0.0/8',
				description: 'Comma-separated IP addresses or CIDR ranges allowed to receive webhooks',
			},
		],
	},

	// Retry configuration
	{
		displayName: 'Retry Configuration',
		name: 'retryConfig',
		type: 'collection',
		placeholder: 'Configure Retries',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook', 'updateWebhook'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Max Retries',
				name: 'maxRetries',
				type: 'number',
				default: 3,
				description: 'Maximum number of retry attempts for failed deliveries',
			},
			{
				displayName: 'Retry Delay (Seconds)',
				name: 'retryDelay',
				type: 'number',
				default: 60,
				description: 'Initial delay between retries (exponential backoff)',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				default: 30,
				description: 'Webhook delivery timeout',
			},
		],
	},

	// List options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['listWebhooks'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Active', value: 'active' },
					{ name: 'Inactive', value: 'inactive' },
					{ name: 'Failed', value: 'failed' },
				],
				default: 'all',
				description: 'Filter webhooks by status',
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'string',
				default: '',
				placeholder: 'claim.paid',
				description: 'Filter webhooks by event type',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Maximum number of webhooks to return',
			},
		],
	},

	// Test webhook options
	{
		displayName: 'Test Event Type',
		name: 'testEventType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['testWebhook'],
			},
		},
		options: [
			{ name: 'Claim Paid', value: 'claim.paid' },
			{ name: 'Claim Rejected', value: 'claim.rejected' },
			{ name: 'ERA Received', value: 'remittance.era_received' },
			{ name: 'Auth Approved', value: 'auth.approved' },
			{ name: 'Batch Completed', value: 'batch.completed' },
		],
		default: 'claim.paid',
		description: 'Type of test event to send',
	},
];

/**
 * Execute Webhook operations
 */
export async function executeWebhookOperation(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;
	const credentials = await this.getCredentials('triZettoApi');

	const client = new TriZettoClient({
		baseUrl: credentials.baseUrl as string,
		clientId: credentials.clientId as string,
		clientSecret: credentials.clientSecret as string,
		username: credentials.username as string,
		password: credentials.password as string,
		submitterId: credentials.submitterId as string,
	});

	try {
		switch (operation) {
			case 'createWebhook': {
				const webhookUrl = this.getNodeParameter('webhookUrl', index) as string;
				const events = this.getNodeParameter('events', index) as string[];
				const name = this.getNodeParameter('name', index, '') as string;
				const description = this.getNodeParameter('description', index, '') as string;
				const active = this.getNodeParameter('active', index, true) as boolean;
				const filters = this.getNodeParameter('filters', index, {}) as object;
				const security = this.getNodeParameter('security', index, {}) as object;
				const retryConfig = this.getNodeParameter('retryConfig', index, {}) as object;

				const response = await client.post('/webhooks', {
					url: webhookUrl,
					events,
					name,
					description,
					active,
					filters,
					security,
					retryConfig,
				});

				return [
					{
						json: {
							success: true,
							operation: 'createWebhook',
							...response,
							createdAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'getWebhook': {
				const webhookId = this.getNodeParameter('webhookId', index) as string;
				const response = await client.get(`/webhooks/${webhookId}`);

				return [
					{
						json: {
							success: true,
							operation: 'getWebhook',
							...response,
						},
					},
				];
			}

			case 'updateWebhook': {
				const webhookId = this.getNodeParameter('webhookId', index) as string;
				const webhookUrl = this.getNodeParameter('webhookUrl', index) as string;
				const events = this.getNodeParameter('events', index) as string[];
				const name = this.getNodeParameter('name', index, '') as string;
				const description = this.getNodeParameter('description', index, '') as string;
				const active = this.getNodeParameter('active', index, true) as boolean;
				const filters = this.getNodeParameter('filters', index, {}) as object;
				const security = this.getNodeParameter('security', index, {}) as object;
				const retryConfig = this.getNodeParameter('retryConfig', index, {}) as object;

				const response = await client.put(`/webhooks/${webhookId}`, {
					url: webhookUrl,
					events,
					name,
					description,
					active,
					filters,
					security,
					retryConfig,
				});

				return [
					{
						json: {
							success: true,
							operation: 'updateWebhook',
							...response,
							updatedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'deleteWebhook': {
				const webhookId = this.getNodeParameter('webhookId', index) as string;
				await client.delete(`/webhooks/${webhookId}`);

				return [
					{
						json: {
							success: true,
							operation: 'deleteWebhook',
							webhookId,
							deletedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'listWebhooks': {
				const options = this.getNodeParameter('options', index, {}) as {
					status?: string;
					eventType?: string;
					limit?: number;
				};

				const params: Record<string, unknown> = {};
				if (options.status && options.status !== 'all') {
					params.status = options.status;
				}
				if (options.eventType) {
					params.eventType = options.eventType;
				}
				if (options.limit) {
					params.limit = options.limit;
				}

				const response = await client.get('/webhooks', params);

				const webhooks = Array.isArray(response) ? response : response.webhooks || [];
				return webhooks.map((webhook: unknown) => ({
					json: webhook as object,
				}));
			}

			case 'verifyWebhook': {
				const webhookId = this.getNodeParameter('webhookId', index) as string;
				const response = await client.post(`/webhooks/${webhookId}/verify`);

				return [
					{
						json: {
							success: true,
							operation: 'verifyWebhook',
							webhookId,
							...response,
							verifiedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'testWebhook': {
				const webhookId = this.getNodeParameter('webhookId', index) as string;
				const testEventType = this.getNodeParameter('testEventType', index) as string;

				const response = await client.post(`/webhooks/${webhookId}/test`, {
					eventType: testEventType,
				});

				return [
					{
						json: {
							success: true,
							operation: 'testWebhook',
							webhookId,
							testEventType,
							...response,
							testedAt: new Date().toISOString(),
						},
					},
				];
			}

			case 'getWebhookEvents': {
				// Return available webhook event types
				const eventTypes = [
					// Eligibility events
					{
						category: 'Eligibility',
						events: [
							{ name: 'eligibility.response', description: 'Eligibility response received' },
							{ name: 'eligibility.error', description: 'Eligibility request failed' },
							{ name: 'eligibility.coverage_changed', description: 'Patient coverage changed' },
						],
					},
					// Claim events
					{
						category: 'Claims',
						events: [
							{ name: 'claim.acknowledged', description: 'Claim acknowledged by payer' },
							{ name: 'claim.accepted', description: 'Claim accepted for processing' },
							{ name: 'claim.rejected', description: 'Claim rejected by payer' },
							{ name: 'claim.paid', description: 'Claim paid' },
							{ name: 'claim.denied', description: 'Claim denied by payer' },
							{ name: 'claim.status_changed', description: 'Claim status updated' },
						],
					},
					// Remittance events
					{
						category: 'Remittance',
						events: [
							{ name: 'remittance.era_received', description: 'ERA (835) received' },
							{ name: 'remittance.payment_posted', description: 'Payment posted' },
							{ name: 'remittance.adjustment_applied', description: 'Adjustment applied' },
							{ name: 'remittance.zero_pay', description: 'Zero payment alert' },
						],
					},
					// Prior auth events
					{
						category: 'Prior Authorization',
						events: [
							{ name: 'auth.approved', description: 'Authorization approved' },
							{ name: 'auth.denied', description: 'Authorization denied' },
							{ name: 'auth.pending', description: 'Authorization pending review' },
							{ name: 'auth.expiring', description: 'Authorization expiring soon' },
						],
					},
					// Batch events
					{
						category: 'Batch',
						events: [
							{ name: 'batch.submitted', description: 'Batch file submitted' },
							{ name: 'batch.completed', description: 'Batch processing completed' },
							{ name: 'batch.error', description: 'Batch processing error' },
						],
					},
					// EDI events
					{
						category: 'EDI',
						events: [
							{ name: 'edi.acknowledgment_received', description: '997/999 acknowledgment received' },
							{ name: 'edi.ta1_received', description: 'TA1 interchange acknowledgment received' },
							{ name: 'edi.error', description: 'EDI processing error' },
						],
					},
					// Task events
					{
						category: 'Tasks',
						events: [
							{ name: 'task.assigned', description: 'Task assigned' },
							{ name: 'task.due', description: 'Task due reminder' },
							{ name: 'task.completed', description: 'Task completed' },
						],
					},
					// Report events
					{
						category: 'Reports',
						events: [
							{ name: 'report.ready', description: 'Report ready for download' },
						],
					},
				];

				return [
					{
						json: {
							success: true,
							operation: 'getWebhookEvents',
							eventTypes,
							totalEvents: eventTypes.reduce((sum, cat) => sum + cat.events.length, 0),
						},
					},
				];
			}

			default:
				throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
		}
	} catch (error) {
		const safeError = createSafeLogEntry('Webhook operation failed', {
			operation,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw new NodeOperationError(this.getNode(), safeError.message);
	}
}
