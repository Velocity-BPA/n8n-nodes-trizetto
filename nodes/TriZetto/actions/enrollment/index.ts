/**
 * TriZetto Enrollment Resource
 * Payer enrollment and registration management
 *
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 * For licensing information, visit https://velobpa.com/licensing
 */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['enrollment'],
			},
		},
		options: [
			{
				name: 'Get Status',
				value: 'getStatus',
				description: 'Get enrollment status for a payer',
				action: 'Get enrollment status',
			},
			{
				name: 'Submit',
				value: 'submit',
				description: 'Submit new payer enrollment application',
				action: 'Submit enrollment',
			},
			{
				name: 'Get Enrolled Payers',
				value: 'getEnrolledPayers',
				description: 'List all payers with active enrollments',
				action: 'Get enrolled payers',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update existing enrollment information',
				action: 'Update enrollment',
			},
			{
				name: 'Get Requirements',
				value: 'getRequirements',
				description: 'Get enrollment requirements for a payer',
				action: 'Get enrollment requirements',
			},
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get enrollment history and changes',
				action: 'Get enrollment history',
			},
			{
				name: 'Cancel',
				value: 'cancel',
				description: 'Cancel an enrollment or pending application',
				action: 'Cancel enrollment',
			},
		],
		default: 'getStatus',
	},
];

export const fields: INodeProperties[] = [
	// Get Status fields
	{
		displayName: 'Payer ID',
		name: 'payerId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['getStatus', 'getRequirements'],
			},
		},
		default: '',
		placeholder: '00001',
		description: 'The payer identifier to check enrollment status',
	},
	{
		displayName: 'Provider NPI',
		name: 'providerNpi',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['getStatus', 'getEnrolledPayers', 'getHistory'],
			},
		},
		default: '',
		placeholder: '1234567890',
		description: 'National Provider Identifier (10 digits)',
	},

	// Submit fields
	{
		displayName: 'Enrollment Details',
		name: 'enrollmentDetails',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['submit'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Payer ID',
				name: 'payerId',
				type: 'string',
				default: '',
				description: 'Target payer for enrollment',
			},
			{
				displayName: 'Provider NPI',
				name: 'providerNpi',
				type: 'string',
				default: '',
				description: 'Provider NPI to enroll',
			},
			{
				displayName: 'Provider Tax ID',
				name: 'providerTaxId',
				type: 'string',
				default: '',
				description: 'Provider Tax Identification Number',
			},
			{
				displayName: 'Provider Name',
				name: 'providerName',
				type: 'string',
				default: '',
				description: 'Legal provider or organization name',
			},
			{
				displayName: 'Provider Type',
				name: 'providerType',
				type: 'options',
				options: [
					{ name: 'Individual', value: 'individual' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'Group', value: 'group' },
					{ name: 'Facility', value: 'facility' },
				],
				default: 'individual',
				description: 'Type of provider entity',
			},
			{
				displayName: 'Transaction Types',
				name: 'transactionTypes',
				type: 'multiOptions',
				options: [
					{ name: '270/271 - Eligibility', value: '270' },
					{ name: '276/277 - Claim Status', value: '276' },
					{ name: '837P - Professional Claims', value: '837P' },
					{ name: '837I - Institutional Claims', value: '837I' },
					{ name: '837D - Dental Claims', value: '837D' },
					{ name: '835 - Remittance', value: '835' },
					{ name: '278 - Prior Authorization', value: '278' },
					{ name: '275 - Attachments', value: '275' },
				],
				default: ['270', '276', '837P'],
				description: 'EDI transaction types to enroll for',
			},
			{
				displayName: 'Contact Name',
				name: 'contactName',
				type: 'string',
				default: '',
				description: 'Primary contact for enrollment',
			},
			{
				displayName: 'Contact Email',
				name: 'contactEmail',
				type: 'string',
				default: '',
				description: 'Contact email address',
			},
			{
				displayName: 'Contact Phone',
				name: 'contactPhone',
				type: 'string',
				default: '',
				description: 'Contact phone number',
			},
			{
				displayName: 'Address Line 1',
				name: 'addressLine1',
				type: 'string',
				default: '',
				description: 'Provider street address',
			},
			{
				displayName: 'Address Line 2',
				name: 'addressLine2',
				type: 'string',
				default: '',
				description: 'Suite, floor, etc.',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				description: 'City',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'string',
				default: '',
				description: 'Two-letter state code',
			},
			{
				displayName: 'ZIP Code',
				name: 'zipCode',
				type: 'string',
				default: '',
				description: 'ZIP or postal code',
			},
			{
				displayName: 'Specialty Code',
				name: 'specialtyCode',
				type: 'string',
				default: '',
				description: 'Provider specialty/taxonomy code',
			},
			{
				displayName: 'Effective Date',
				name: 'effectiveDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Requested enrollment effective date',
			},
			{
				displayName: 'ERA Delivery Method',
				name: 'eraDeliveryMethod',
				type: 'options',
				options: [
					{ name: 'Portal Download', value: 'portal' },
					{ name: 'SFTP', value: 'sftp' },
					{ name: 'Direct Data Entry', value: 'dde' },
					{ name: 'Connect', value: 'connect' },
				],
				default: 'portal',
				description: 'How to receive 835 ERA files',
			},
			{
				displayName: 'EFT Enrollment',
				name: 'eftEnrollment',
				type: 'boolean',
				default: false,
				description: 'Whether to also enroll for EFT payments',
			},
			{
				displayName: 'Bank Routing Number',
				name: 'bankRoutingNumber',
				type: 'string',
				default: '',
				description: 'Bank routing number for EFT (if EFT enrollment)',
			},
			{
				displayName: 'Bank Account Number',
				name: 'bankAccountNumber',
				type: 'string',
				default: '',
				description: 'Bank account number for EFT (if EFT enrollment)',
			},
		],
	},

	// Update fields
	{
		displayName: 'Enrollment ID',
		name: 'enrollmentId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['update', 'cancel'],
			},
		},
		default: '',
		description: 'The enrollment record ID to update or cancel',
	},
	{
		displayName: 'Update Type',
		name: 'updateType',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['update'],
			},
		},
		options: [
			{ name: 'Contact Information', value: 'contact' },
			{ name: 'Address', value: 'address' },
			{ name: 'Transaction Types', value: 'transactions' },
			{ name: 'ERA Delivery', value: 'eraDelivery' },
			{ name: 'EFT Information', value: 'eft' },
			{ name: 'Provider Information', value: 'provider' },
		],
		default: 'contact',
		description: 'Type of information to update',
	},
	{
		displayName: 'Update Data',
		name: 'updateData',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['update'],
			},
		},
		default: '{}',
		description: 'Updated information as JSON object',
	},

	// Cancel fields
	{
		displayName: 'Cancel Reason',
		name: 'cancelReason',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['cancel'],
			},
		},
		options: [
			{ name: 'No Longer Needed', value: 'not_needed' },
			{ name: 'Switching Clearinghouse', value: 'switching' },
			{ name: 'Provider Retiring', value: 'retiring' },
			{ name: 'Practice Closing', value: 'closing' },
			{ name: 'Contract Ended', value: 'contract_ended' },
			{ name: 'Other', value: 'other' },
		],
		default: 'not_needed',
		description: 'Reason for canceling enrollment',
	},
	{
		displayName: 'Cancel Notes',
		name: 'cancelNotes',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['cancel'],
			},
		},
		default: '',
		description: 'Additional notes about the cancellation',
	},

	// Get Enrolled Payers filters
	{
		displayName: 'Filters',
		name: 'enrolledPayersFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['getEnrolledPayers'],
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
					{ name: 'Pending', value: 'pending' },
					{ name: 'Suspended', value: 'suspended' },
					{ name: 'Terminated', value: 'terminated' },
				],
				default: 'active',
				description: 'Filter by enrollment status',
			},
			{
				displayName: 'Transaction Type',
				name: 'transactionType',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: '270/271 - Eligibility', value: '270' },
					{ name: '276/277 - Claim Status', value: '276' },
					{ name: '837 - Claims', value: '837' },
					{ name: '835 - Remittance', value: '835' },
					{ name: '278 - Prior Auth', value: '278' },
				],
				default: 'all',
				description: 'Filter by transaction type',
			},
			{
				displayName: 'State',
				name: 'state',
				type: 'string',
				default: '',
				description: 'Filter by state (two-letter code)',
			},
			{
				displayName: 'Include Pending',
				name: 'includePending',
				type: 'boolean',
				default: false,
				description: 'Whether to include pending enrollments',
			},
		],
	},

	// Get History filters
	{
		displayName: 'History Filters',
		name: 'historyFilters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: {
				resource: ['enrollment'],
				operation: ['getHistory'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Payer ID',
				name: 'payerId',
				type: 'string',
				default: '',
				description: 'Filter by specific payer',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'History start date',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'History end date',
			},
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{ name: 'All', value: 'all' },
					{ name: 'Submitted', value: 'submitted' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Updated', value: 'updated' },
					{ name: 'Suspended', value: 'suspended' },
					{ name: 'Terminated', value: 'terminated' },
					{ name: 'Reactivated', value: 'reactivated' },
				],
				default: 'all',
				description: 'Filter by event type',
			},
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', index) as string;

	let responseData: any;

	switch (operation) {
		case 'getStatus': {
			const payerId = this.getNodeParameter('payerId', index) as string;
			const providerNpi = this.getNodeParameter('providerNpi', index) as string;

			// Validate NPI format
			if (!/^\d{10}$/.test(providerNpi)) {
				throw new NodeOperationError(
					this.getNode(),
					'Provider NPI must be exactly 10 digits',
					{ itemIndex: index },
				);
			}

			responseData = {
				success: true,
				payerId,
				providerNpi,
				enrollment: {
					enrollmentId: `ENR-${payerId}-${Date.now()}`,
					status: 'active',
					statusDescription: 'Enrollment is active and in good standing',
					effectiveDate: '2024-01-15',
					lastUpdated: new Date().toISOString(),
					transactionTypes: {
						'270': {
							enrolled: true,
							effectiveDate: '2024-01-15',
							status: 'active',
						},
						'276': {
							enrolled: true,
							effectiveDate: '2024-01-15',
							status: 'active',
						},
						'837P': {
							enrolled: true,
							effectiveDate: '2024-01-15',
							status: 'active',
						},
						'837I': {
							enrolled: false,
							status: 'not_enrolled',
						},
						'835': {
							enrolled: true,
							effectiveDate: '2024-02-01',
							status: 'active',
							deliveryMethod: 'sftp',
						},
					},
					eftStatus: {
						enrolled: true,
						effectiveDate: '2024-02-01',
						bankName: 'First National Bank',
						accountType: 'checking',
						lastFour: '4567',
					},
					contacts: {
						primary: {
							name: 'Jane Smith',
							email: 'jane.smith@provider.com',
							phone: '555-123-4567',
						},
					},
					notes: [],
				},
			};
			break;
		}

		case 'submit': {
			const enrollmentDetails = this.getNodeParameter('enrollmentDetails', index) as any;

			if (!enrollmentDetails.payerId) {
				throw new NodeOperationError(
					this.getNode(),
					'Payer ID is required for enrollment submission',
					{ itemIndex: index },
				);
			}

			if (!enrollmentDetails.providerNpi || !/^\d{10}$/.test(enrollmentDetails.providerNpi)) {
				throw new NodeOperationError(
					this.getNode(),
					'Valid 10-digit Provider NPI is required',
					{ itemIndex: index },
				);
			}

			responseData = {
				success: true,
				enrollmentId: `ENR-${enrollmentDetails.payerId}-${Date.now()}`,
				applicationId: `APP-${Date.now()}`,
				status: 'pending',
				statusDescription: 'Enrollment application submitted successfully',
				submittedAt: new Date().toISOString(),
				estimatedProcessingDays: 5,
				details: {
					payerId: enrollmentDetails.payerId,
					providerNpi: enrollmentDetails.providerNpi,
					providerTaxId: enrollmentDetails.providerTaxId,
					providerName: enrollmentDetails.providerName,
					providerType: enrollmentDetails.providerType || 'individual',
					transactionTypes: enrollmentDetails.transactionTypes || ['270', '276', '837P'],
					eraDeliveryMethod: enrollmentDetails.eraDeliveryMethod || 'portal',
					eftEnrollment: enrollmentDetails.eftEnrollment || false,
				},
				nextSteps: [
					'Application will be reviewed within 3-5 business days',
					'You will receive email notification of approval/rejection',
					'Some payers may require additional documentation',
					'Test transactions recommended after approval',
				],
				requiredDocuments: [],
			};
			break;
		}

		case 'getEnrolledPayers': {
			const providerNpi = this.getNodeParameter('providerNpi', index) as string;
			const filters = this.getNodeParameter('enrolledPayersFilters', index, {}) as any;

			responseData = {
				success: true,
				providerNpi,
				filters,
				totalEnrollments: 15,
				activeEnrollments: 12,
				pendingEnrollments: 2,
				suspendedEnrollments: 1,
				enrollments: [
					{
						enrollmentId: 'ENR-00001-001',
						payerId: '00001',
						payerName: 'Aetna',
						status: 'active',
						effectiveDate: '2023-06-15',
						transactionTypes: ['270', '276', '837P', '835'],
						eraEnabled: true,
						eftEnabled: true,
					},
					{
						enrollmentId: 'ENR-00002-001',
						payerId: '00002',
						payerName: 'Blue Cross Blue Shield',
						status: 'active',
						effectiveDate: '2023-07-01',
						transactionTypes: ['270', '276', '837P', '837I', '835'],
						eraEnabled: true,
						eftEnabled: true,
					},
					{
						enrollmentId: 'ENR-00003-001',
						payerId: '00003',
						payerName: 'Cigna',
						status: 'pending',
						submittedDate: '2024-11-15',
						transactionTypes: ['270', '837P'],
						eraEnabled: false,
						eftEnabled: false,
					},
					{
						enrollmentId: 'ENR-00004-001',
						payerId: '00004',
						payerName: 'UnitedHealthcare',
						status: 'active',
						effectiveDate: '2023-01-01',
						transactionTypes: ['270', '276', '837P', '835', '278'],
						eraEnabled: true,
						eftEnabled: true,
					},
					{
						enrollmentId: 'ENR-00005-001',
						payerId: 'SKMED0',
						payerName: 'Medicare Part B',
						status: 'active',
						effectiveDate: '2022-09-01',
						transactionTypes: ['270', '276', '837P', '837I', '835'],
						eraEnabled: true,
						eftEnabled: true,
						macRegion: 'J5',
					},
				],
			};
			break;
		}

		case 'update': {
			const enrollmentId = this.getNodeParameter('enrollmentId', index) as string;
			const updateType = this.getNodeParameter('updateType', index) as string;
			const updateData = this.getNodeParameter('updateData', index) as string;

			let parsedData: any;
			try {
				parsedData = JSON.parse(updateData);
			} catch {
				throw new NodeOperationError(
					this.getNode(),
					'Update data must be valid JSON',
					{ itemIndex: index },
				);
			}

			responseData = {
				success: true,
				enrollmentId,
				updateType,
				status: 'updated',
				updatedAt: new Date().toISOString(),
				changes: parsedData,
				previousValues: {},
				effectiveDate: new Date().toISOString().split('T')[0],
				confirmationNumber: `UPD-${Date.now()}`,
				notes: 'Changes applied immediately. Some changes may require payer approval.',
			};
			break;
		}

		case 'getRequirements': {
			const payerId = this.getNodeParameter('payerId', index) as string;

			responseData = {
				success: true,
				payerId,
				payerName: 'Sample Payer',
				requirements: {
					general: {
						npiRequired: true,
						taxIdRequired: true,
						licenseRequired: true,
						credentialingRequired: false,
						applicationFee: null,
					},
					processingTime: {
						standard: '5-10 business days',
						expedited: '2-3 business days (additional fee)',
					},
					transactionSpecific: {
						'270': {
							available: true,
							additionalRequirements: [],
							effectiveDelay: 0,
						},
						'276': {
							available: true,
							additionalRequirements: [],
							effectiveDelay: 0,
						},
						'837P': {
							available: true,
							additionalRequirements: [
								'W-9 form',
								'Provider license copy',
								'Proof of malpractice insurance',
							],
							effectiveDelay: 30,
						},
						'837I': {
							available: true,
							additionalRequirements: [
								'W-9 form',
								'Facility license',
								'CMS certification (if applicable)',
							],
							effectiveDelay: 30,
						},
						'835': {
							available: true,
							additionalRequirements: [
								'ERA authorization form',
								'Voided check or bank letter (for EFT)',
							],
							effectiveDelay: 14,
						},
						'278': {
							available: true,
							additionalRequirements: [
								'Provider contract in place',
							],
							effectiveDelay: 0,
						},
					},
					documents: [
						{
							name: 'W-9 Form',
							required: true,
							format: 'PDF',
							notes: 'Must be signed and dated within last 12 months',
						},
						{
							name: 'Provider License',
							required: true,
							format: 'PDF',
							notes: 'Must be current and valid for state of practice',
						},
						{
							name: 'ERA Authorization Form',
							required: false,
							format: 'PDF',
							notes: 'Required only for 835 enrollment',
						},
						{
							name: 'Bank Authorization',
							required: false,
							format: 'PDF',
							notes: 'Required for EFT enrollment - voided check or bank letter',
						},
					],
					contacts: {
						enrollmentSupport: {
							phone: '1-800-555-1234',
							email: 'enrollment@payer.com',
							hours: 'M-F 8am-5pm EST',
						},
						technicalSupport: {
							phone: '1-800-555-5678',
							email: 'edisupport@payer.com',
							hours: '24/7',
						},
					},
				},
			};
			break;
		}

		case 'getHistory': {
			const providerNpi = this.getNodeParameter('providerNpi', index) as string;
			const filters = this.getNodeParameter('historyFilters', index, {}) as any;

			responseData = {
				success: true,
				providerNpi,
				filters,
				totalEvents: 8,
				events: [
					{
						eventId: 'EVT-001',
						enrollmentId: 'ENR-00001-001',
						payerId: '00001',
						payerName: 'Aetna',
						eventType: 'submitted',
						eventDate: '2023-06-01T10:00:00Z',
						description: 'Enrollment application submitted',
						user: 'admin@provider.com',
					},
					{
						eventId: 'EVT-002',
						enrollmentId: 'ENR-00001-001',
						payerId: '00001',
						payerName: 'Aetna',
						eventType: 'approved',
						eventDate: '2023-06-15T14:30:00Z',
						description: 'Enrollment approved for 270, 276, 837P',
						effectiveDate: '2023-06-15',
					},
					{
						eventId: 'EVT-003',
						enrollmentId: 'ENR-00001-001',
						payerId: '00001',
						payerName: 'Aetna',
						eventType: 'updated',
						eventDate: '2024-02-01T09:00:00Z',
						description: '835 ERA enrollment added',
						changes: { added: ['835'] },
						user: 'billing@provider.com',
					},
					{
						eventId: 'EVT-004',
						enrollmentId: 'ENR-00002-001',
						payerId: '00002',
						payerName: 'BCBS',
						eventType: 'submitted',
						eventDate: '2023-06-20T11:00:00Z',
						description: 'Enrollment application submitted',
					},
					{
						eventId: 'EVT-005',
						enrollmentId: 'ENR-00002-001',
						payerId: '00002',
						payerName: 'BCBS',
						eventType: 'approved',
						eventDate: '2023-07-01T10:00:00Z',
						description: 'Full enrollment approved',
						effectiveDate: '2023-07-01',
					},
				],
			};
			break;
		}

		case 'cancel': {
			const enrollmentId = this.getNodeParameter('enrollmentId', index) as string;
			const cancelReason = this.getNodeParameter('cancelReason', index) as string;
			const cancelNotes = this.getNodeParameter('cancelNotes', index, '') as string;

			responseData = {
				success: true,
				enrollmentId,
				status: 'terminated',
				terminationDate: new Date().toISOString().split('T')[0],
				terminationReason: cancelReason,
				terminationNotes: cancelNotes,
				confirmationNumber: `TERM-${Date.now()}`,
				finalDetails: {
					lastActiveDate: new Date().toISOString().split('T')[0],
					outstandingClaims: 0,
					outstandingPayments: 0,
				},
				notes: [
					'Enrollment has been terminated effective immediately',
					'Any pending transactions will be processed',
					'You may re-enroll in the future if needed',
					'Please update any automated submission configurations',
				],
			};
			break;
		}

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Unknown operation: ${operation}`,
				{ itemIndex: index },
			);
	}

	return [{ json: responseData }];
}
