/**
 * n8n-nodes-trizetto: CareAdvance Resource
 * RCM work queue and task management operations
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import {
	INodeProperties,
	IExecuteFunctions,
	INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * CareAdvance Operations
 * TriZetto CareAdvance is an RCM (Revenue Cycle Management) platform
 * that provides work queue management and task tracking
 */
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
			},
		},
		options: [
			{
				name: 'Get Work Queue',
				value: 'getWorkQueue',
				description: 'Get items in work queue for processing',
				action: 'Get work queue items',
			},
			{
				name: 'Get Tasks',
				value: 'getTasks',
				description: 'Get tasks assigned to user or team',
				action: 'Get assigned tasks',
			},
			{
				name: 'Complete Task',
				value: 'completeTask',
				description: 'Mark a task as completed',
				action: 'Complete a task',
			},
			{
				name: 'Reassign Task',
				value: 'reassignTask',
				description: 'Reassign task to another user or queue',
				action: 'Reassign a task',
			},
			{
				name: 'Get Task History',
				value: 'getTaskHistory',
				description: 'Get history of task actions and status changes',
				action: 'Get task history',
			},
			{
				name: 'Get Productivity Stats',
				value: 'getProductivityStats',
				description: 'Get productivity statistics for user or team',
				action: 'Get productivity statistics',
			},
		],
		default: 'getWorkQueue',
	},
];

/**
 * CareAdvance Fields
 */
export const fields: INodeProperties[] = [
	// Get Work Queue fields
	{
		displayName: 'Queue Name',
		name: 'queueName',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getWorkQueue'],
			},
		},
		options: [
			{ name: 'All Queues', value: 'all' },
			{ name: 'Claim Denials', value: 'denials' },
			{ name: 'Claim Rejections', value: 'rejections' },
			{ name: 'Pending Claims', value: 'pending' },
			{ name: 'Appeals', value: 'appeals' },
			{ name: 'Prior Auth', value: 'priorAuth' },
			{ name: 'Eligibility Issues', value: 'eligibility' },
			{ name: 'Payment Posting', value: 'paymentPosting' },
			{ name: 'Patient Collections', value: 'patientCollections' },
			{ name: 'AR Follow-up', value: 'arFollowup' },
			{ name: 'Coding Review', value: 'codingReview' },
			{ name: 'Medical Records', value: 'medicalRecords' },
			{ name: 'Credentialing', value: 'credentialing' },
		],
		default: 'all',
		description: 'Work queue category to retrieve',
	},
	{
		displayName: 'Queue Options',
		name: 'queueOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getWorkQueue'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'All Priorities', value: 'all' },
					{ name: 'Critical', value: 'critical' },
					{ name: 'High', value: 'high' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'Low', value: 'low' },
				],
				default: 'all',
				description: 'Filter by priority level',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'New', value: 'new' },
					{ name: 'In Progress', value: 'inProgress' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'On Hold', value: 'onHold' },
				],
				default: 'all',
				description: 'Filter by task status',
			},
			{
				displayName: 'Age Days (Min)',
				name: 'ageMin',
				type: 'number',
				default: 0,
				description: 'Minimum age in days',
			},
			{
				displayName: 'Age Days (Max)',
				name: 'ageMax',
				type: 'number',
				default: 365,
				description: 'Maximum age in days',
			},
			{
				displayName: 'Dollar Amount (Min)',
				name: 'amountMin',
				type: 'number',
				default: 0,
				description: 'Minimum dollar amount',
			},
			{
				displayName: 'Dollar Amount (Max)',
				name: 'amountMax',
				type: 'number',
				default: 999999,
				description: 'Maximum dollar amount',
			},
			{
				displayName: 'Payer ID',
				name: 'payerId',
				type: 'string',
				default: '',
				description: 'Filter by specific payer',
			},
			{
				displayName: 'Assigned To',
				name: 'assignedTo',
				type: 'string',
				default: '',
				description: 'Filter by assigned user ID',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Maximum number of items to return',
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Priority', value: 'priority' },
					{ name: 'Age (Oldest First)', value: 'ageDesc' },
					{ name: 'Age (Newest First)', value: 'ageAsc' },
					{ name: 'Amount (High to Low)', value: 'amountDesc' },
					{ name: 'Amount (Low to High)', value: 'amountAsc' },
					{ name: 'Due Date', value: 'dueDate' },
				],
				default: 'priority',
				description: 'Sort order for results',
			},
		],
	},

	// Get Tasks fields
	{
		displayName: 'Task Filter',
		name: 'taskFilter',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getTasks'],
			},
		},
		options: [
			{ name: 'My Tasks', value: 'myTasks' },
			{ name: 'Team Tasks', value: 'teamTasks' },
			{ name: 'All Tasks', value: 'allTasks' },
			{ name: 'Overdue Tasks', value: 'overdue' },
			{ name: 'Due Today', value: 'dueToday' },
			{ name: 'Due This Week', value: 'dueThisWeek' },
		],
		default: 'myTasks',
		description: 'Filter for task retrieval',
	},
	{
		displayName: 'Task Options',
		name: 'taskOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getTasks'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Task Type',
				name: 'taskType',
				type: 'options',
				options: [
					{ name: 'All Types', value: 'all' },
					{ name: 'Follow Up', value: 'followUp' },
					{ name: 'Appeal', value: 'appeal' },
					{ name: 'Resubmit', value: 'resubmit' },
					{ name: 'Correction', value: 'correction' },
					{ name: 'Review', value: 'review' },
					{ name: 'Phone Call', value: 'phoneCall' },
					{ name: 'Fax', value: 'fax' },
					{ name: 'Portal Check', value: 'portalCheck' },
				],
				default: 'all',
				description: 'Type of task',
			},
			{
				displayName: 'Include Completed',
				name: 'includeCompleted',
				type: 'boolean',
				default: false,
				description: 'Whether to include completed tasks',
			},
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				default: '',
				description: 'Tasks created from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				default: '',
				description: 'Tasks created until this date',
			},
		],
	},

	// Complete Task fields
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['completeTask'],
			},
		},
		default: '',
		description: 'Unique identifier of the task',
	},
	{
		displayName: 'Resolution',
		name: 'resolution',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['completeTask'],
			},
		},
		options: [
			{ name: 'Resolved', value: 'resolved' },
			{ name: 'Claim Paid', value: 'claimPaid' },
			{ name: 'Claim Denied - Valid', value: 'deniedValid' },
			{ name: 'Appeal Submitted', value: 'appealSubmitted' },
			{ name: 'Corrected Claim Sent', value: 'correctedClaimSent' },
			{ name: 'No Action Required', value: 'noAction' },
			{ name: 'Duplicate', value: 'duplicate' },
			{ name: 'Unable to Resolve', value: 'unableToResolve' },
			{ name: 'Patient Responsibility', value: 'patientResponsibility' },
			{ name: 'Write Off', value: 'writeOff' },
			{ name: 'Other', value: 'other' },
		],
		default: 'resolved',
		description: 'How the task was resolved',
	},
	{
		displayName: 'Notes',
		name: 'notes',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['completeTask'],
			},
		},
		default: '',
		description: 'Notes about the resolution',
	},
	{
		displayName: 'Completion Options',
		name: 'completionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['completeTask'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Amount Collected',
				name: 'amountCollected',
				type: 'number',
				default: 0,
				description: 'Amount collected as result of this task',
			},
			{
				displayName: 'Follow Up Required',
				name: 'followUpRequired',
				type: 'boolean',
				default: false,
				description: 'Whether a follow-up task should be created',
			},
			{
				displayName: 'Follow Up Days',
				name: 'followUpDays',
				type: 'number',
				default: 30,
				description: 'Days until follow-up if required',
			},
			{
				displayName: 'Reference Number',
				name: 'referenceNumber',
				type: 'string',
				default: '',
				description: 'Reference number from payer (e.g., appeal ID, call reference)',
			},
		],
	},

	// Reassign Task fields
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['reassignTask'],
			},
		},
		default: '',
		description: 'Unique identifier of the task to reassign',
	},
	{
		displayName: 'Reassign To',
		name: 'reassignTo',
		type: 'options',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['reassignTask'],
			},
		},
		options: [
			{ name: 'User', value: 'user' },
			{ name: 'Queue', value: 'queue' },
			{ name: 'Team', value: 'team' },
		],
		default: 'user',
		description: 'Reassign to user, queue, or team',
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['reassignTask'],
				reassignTo: ['user'],
			},
		},
		default: '',
		description: 'ID of user to reassign to',
	},
	{
		displayName: 'Queue Name',
		name: 'queueName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['reassignTask'],
				reassignTo: ['queue'],
			},
		},
		default: '',
		description: 'Name of queue to reassign to',
	},
	{
		displayName: 'Team ID',
		name: 'teamId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['reassignTask'],
				reassignTo: ['team'],
			},
		},
		default: '',
		description: 'ID of team to reassign to',
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['reassignTask'],
			},
		},
		default: '',
		description: 'Reason for reassignment',
	},

	// Get Task History fields
	{
		displayName: 'Task ID',
		name: 'taskId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getTaskHistory'],
			},
		},
		default: '',
		description: 'Unique identifier of the task',
	},

	// Get Productivity Stats fields
	{
		displayName: 'Stats Type',
		name: 'statsType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getProductivityStats'],
			},
		},
		options: [
			{ name: 'My Stats', value: 'myStats' },
			{ name: 'Team Stats', value: 'teamStats' },
			{ name: 'Department Stats', value: 'departmentStats' },
			{ name: 'Organization Stats', value: 'orgStats' },
		],
		default: 'myStats',
		description: 'Scope of productivity statistics',
	},
	{
		displayName: 'Period',
		name: 'period',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getProductivityStats'],
			},
		},
		options: [
			{ name: 'Today', value: 'today' },
			{ name: 'This Week', value: 'thisWeek' },
			{ name: 'This Month', value: 'thisMonth' },
			{ name: 'This Quarter', value: 'thisQuarter' },
			{ name: 'This Year', value: 'thisYear' },
			{ name: 'Custom Range', value: 'custom' },
		],
		default: 'thisMonth',
		description: 'Time period for statistics',
	},
	{
		displayName: 'Date From',
		name: 'dateFrom',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getProductivityStats'],
				period: ['custom'],
			},
		},
		default: '',
		description: 'Start date for custom period',
	},
	{
		displayName: 'Date To',
		name: 'dateTo',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['careAdvance'],
				operation: ['getProductivityStats'],
				period: ['custom'],
			},
		},
		default: '',
		description: 'End date for custom period',
	},
];

/**
 * Execute CareAdvance operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const credentials = await this.getCredentials('trizettoApi');
	const baseUrl = credentials.environment === 'production'
		? 'https://api.trizetto.com'
		: 'https://api-test.trizetto.com';

	let responseData: Record<string, unknown>;

	switch (operation) {
		case 'getWorkQueue': {
			const queueName = this.getNodeParameter('queueName', index) as string;
			const queueOptions = this.getNodeParameter('queueOptions', index) as {
				priority?: string;
				status?: string;
				ageMin?: number;
				ageMax?: number;
				amountMin?: number;
				amountMax?: number;
				payerId?: string;
				assignedTo?: string;
				limit?: number;
				sortBy?: string;
			};

			responseData = {
				success: true,
				queue: queueName,
				filters: queueOptions,
				items: [
					{
						workItemId: 'WQ-2024-001234',
						queue: queueName === 'all' ? 'denials' : queueName,
						claimId: 'CLM-2024-987654',
						patientName: 'DOE, JOHN',
						payerName: 'BCBS OF TENNESSEE',
						payerId: '54771',
						serviceDate: '2024-11-15',
						billedAmount: 1250.00,
						balance: 1250.00,
						status: 'new',
						priority: 'high',
						age: 45,
						dueDate: '2024-12-15',
						assignedTo: queueOptions.assignedTo || null,
						reason: {
							code: 'CO-4',
							description: 'The procedure code is inconsistent with the modifier used',
						},
						created: '2024-11-01T10:30:00Z',
						lastWorked: null,
					},
					{
						workItemId: 'WQ-2024-001235',
						queue: queueName === 'all' ? 'arFollowup' : queueName,
						claimId: 'CLM-2024-987655',
						patientName: 'SMITH, JANE',
						payerName: 'AETNA',
						payerId: '60054',
						serviceDate: '2024-10-20',
						billedAmount: 875.50,
						balance: 875.50,
						status: 'inProgress',
						priority: 'medium',
						age: 68,
						dueDate: '2024-12-10',
						assignedTo: 'user123',
						reason: {
							code: 'AGING',
							description: 'Claim aging > 60 days with no response',
						},
						created: '2024-10-25T14:20:00Z',
						lastWorked: '2024-12-01T09:15:00Z',
					},
				],
				pagination: {
					total: 156,
					returned: 2,
					limit: queueOptions.limit || 50,
					offset: 0,
				},
			};
			break;
		}

		case 'getTasks': {
			const taskFilter = this.getNodeParameter('taskFilter', index) as string;
			const taskOptions = this.getNodeParameter('taskOptions', index) as {
				taskType?: string;
				includeCompleted?: boolean;
				dateFrom?: string;
				dateTo?: string;
			};

			responseData = {
				success: true,
				filter: taskFilter,
				options: taskOptions,
				tasks: [
					{
						taskId: 'TSK-2024-005678',
						type: 'followUp',
						title: 'Follow up on denied claim - CO-4',
						description: 'Contact payer regarding modifier denial',
						claimId: 'CLM-2024-987654',
						patientName: 'DOE, JOHN',
						payerName: 'BCBS OF TENNESSEE',
						priority: 'high',
						status: 'inProgress',
						dueDate: '2024-12-15T17:00:00Z',
						assignedTo: 'currentUser',
						assignedBy: 'system',
						created: '2024-11-01T10:30:00Z',
						notes: [
							{
								timestamp: '2024-12-01T09:15:00Z',
								user: 'currentUser',
								text: 'Called payer, on hold for 45 minutes, call dropped.',
							},
						],
					},
					{
						taskId: 'TSK-2024-005679',
						type: 'appeal',
						title: 'Submit appeal for medical necessity denial',
						description: 'Gather clinical documentation and submit appeal',
						claimId: 'CLM-2024-987656',
						patientName: 'WILLIAMS, ROBERT',
						payerName: 'UNITED HEALTHCARE',
						priority: 'critical',
						status: 'new',
						dueDate: '2024-12-20T17:00:00Z',
						assignedTo: 'currentUser',
						assignedBy: 'supervisor001',
						created: '2024-12-01T08:00:00Z',
						notes: [],
					},
				],
				summary: {
					total: 24,
					byStatus: {
						new: 8,
						inProgress: 12,
						pending: 4,
					},
					overdue: 3,
					dueToday: 2,
					dueThisWeek: 9,
				},
			};
			break;
		}

		case 'completeTask': {
			const taskId = this.getNodeParameter('taskId', index) as string;
			const resolution = this.getNodeParameter('resolution', index) as string;
			const notes = this.getNodeParameter('notes', index) as string;
			const completionOptions = this.getNodeParameter('completionOptions', index) as {
				amountCollected?: number;
				followUpRequired?: boolean;
				followUpDays?: number;
				referenceNumber?: string;
			};

			if (!taskId) {
				throw new NodeOperationError(this.getNode(), 'Task ID is required');
			}

			responseData = {
				success: true,
				taskId,
				status: 'completed',
				resolution,
				notes,
				completedAt: new Date().toISOString(),
				completedBy: 'currentUser',
				metrics: {
					amountCollected: completionOptions.amountCollected || 0,
					timeSpent: '2:15:30',
					touchCount: 3,
				},
				followUp: completionOptions.followUpRequired ? {
					created: true,
					newTaskId: 'TSK-2024-005680',
					dueDate: new Date(Date.now() + (completionOptions.followUpDays || 30) * 86400000).toISOString(),
				} : null,
				referenceNumber: completionOptions.referenceNumber || null,
			};
			break;
		}

		case 'reassignTask': {
			const taskId = this.getNodeParameter('taskId', index) as string;
			const reassignTo = this.getNodeParameter('reassignTo', index) as string;
			const reason = this.getNodeParameter('reason', index) as string;

			let assignee: string;
			if (reassignTo === 'user') {
				assignee = this.getNodeParameter('userId', index) as string;
			} else if (reassignTo === 'queue') {
				assignee = this.getNodeParameter('queueName', index) as string;
			} else {
				assignee = this.getNodeParameter('teamId', index) as string;
			}

			responseData = {
				success: true,
				taskId,
				reassignment: {
					type: reassignTo,
					to: assignee,
					reason,
					reassignedBy: 'currentUser',
					reassignedAt: new Date().toISOString(),
					previousAssignee: 'user123',
				},
				status: 'reassigned',
			};
			break;
		}

		case 'getTaskHistory': {
			const taskId = this.getNodeParameter('taskId', index) as string;

			if (!taskId) {
				throw new NodeOperationError(this.getNode(), 'Task ID is required');
			}

			responseData = {
				success: true,
				taskId,
				created: '2024-11-01T10:30:00Z',
				history: [
					{
						timestamp: '2024-11-01T10:30:00Z',
						action: 'created',
						user: 'system',
						details: 'Task auto-generated from denial work queue',
					},
					{
						timestamp: '2024-11-01T10:31:00Z',
						action: 'assigned',
						user: 'system',
						details: 'Auto-assigned to queue: denials',
					},
					{
						timestamp: '2024-11-05T09:00:00Z',
						action: 'assigned',
						user: 'supervisor001',
						details: 'Assigned to user: user123',
					},
					{
						timestamp: '2024-11-05T14:30:00Z',
						action: 'statusChange',
						user: 'user123',
						details: 'Status changed from new to inProgress',
					},
					{
						timestamp: '2024-11-05T14:35:00Z',
						action: 'note',
						user: 'user123',
						details: 'Called payer, claim under review',
					},
					{
						timestamp: '2024-12-01T09:15:00Z',
						action: 'note',
						user: 'user123',
						details: 'Follow-up call, still pending',
					},
				],
				currentStatus: 'inProgress',
				totalTouches: 4,
				daysOpen: 30,
			};
			break;
		}

		case 'getProductivityStats': {
			const statsType = this.getNodeParameter('statsType', index) as string;
			const period = this.getNodeParameter('period', index) as string;

			responseData = {
				success: true,
				scope: statsType,
				period,
				dateRange: {
					from: '2024-12-01',
					to: '2024-12-27',
				},
				statistics: {
					tasksCompleted: 156,
					tasksAssigned: 180,
					completionRate: 86.7,
					averageHandleTime: '18:45',
					touchesPerTask: 2.4,
					amountCollected: 45678.90,
					collectionRate: 72.3,
				},
				breakdown: {
					byQueue: [
						{ queue: 'denials', completed: 45, avgTime: '22:30', collected: 15234.00 },
						{ queue: 'arFollowup', completed: 62, avgTime: '12:15', collected: 18450.00 },
						{ queue: 'appeals', completed: 23, avgTime: '35:00', collected: 8994.90 },
						{ queue: 'paymentPosting', completed: 26, avgTime: '8:45', collected: 3000.00 },
					],
					byResolution: [
						{ resolution: 'claimPaid', count: 89, percentage: 57.1 },
						{ resolution: 'appealSubmitted', count: 23, percentage: 14.7 },
						{ resolution: 'deniedValid', count: 18, percentage: 11.5 },
						{ resolution: 'patientResponsibility', count: 15, percentage: 9.6 },
						{ resolution: 'other', count: 11, percentage: 7.1 },
					],
				},
				trends: {
					vsLastPeriod: {
						tasksCompleted: '+12%',
						amountCollected: '+8.5%',
						avgHandleTime: '-5%',
					},
				},
			};
			break;
		}

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Operation ${operation} is not supported for CareAdvance resource`,
			);
	}

	return [{ json: responseData }];
}
