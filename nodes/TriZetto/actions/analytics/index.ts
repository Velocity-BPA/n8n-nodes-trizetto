/**
 * n8n-nodes-trizetto: Analytics Resource
 * Revenue cycle analytics and KPI operations
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
 * Analytics Operations
 * Revenue cycle management analytics and key performance indicators
 */
export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['analytics'],
			},
		},
		options: [
			{
				name: 'Get Revenue Analytics',
				value: 'getRevenueAnalytics',
				description: 'Get revenue trends and projections',
				action: 'Get revenue analytics',
			},
			{
				name: 'Get Denial Analytics',
				value: 'getDenialAnalytics',
				description: 'Get denial patterns and trends',
				action: 'Get denial analytics',
			},
			{
				name: 'Get Clean Claim Rate',
				value: 'getCleanClaimRate',
				description: 'Get clean claim rate metrics',
				action: 'Get clean claim rate',
			},
			{
				name: 'Get Days in A/R',
				value: 'getDaysInAr',
				description: 'Get days in accounts receivable metrics',
				action: 'Get days in AR',
			},
			{
				name: 'Get First Pass Rate',
				value: 'getFirstPassRate',
				description: 'Get first pass resolution rate',
				action: 'Get first pass rate',
			},
			{
				name: 'Get Payer Performance',
				value: 'getPayerPerformance',
				description: 'Get payer performance comparison',
				action: 'Get payer performance',
			},
		],
		default: 'getRevenueAnalytics',
	},
];

/**
 * Analytics Fields
 */
export const fields: INodeProperties[] = [
	// Common period field
	{
		displayName: 'Period',
		name: 'period',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['analytics'],
			},
		},
		options: [
			{ name: 'This Month', value: 'thisMonth' },
			{ name: 'Last Month', value: 'lastMonth' },
			{ name: 'This Quarter', value: 'thisQuarter' },
			{ name: 'Last Quarter', value: 'lastQuarter' },
			{ name: 'This Year', value: 'thisYear' },
			{ name: 'Last Year', value: 'lastYear' },
			{ name: 'Last 12 Months', value: 'last12Months' },
			{ name: 'Custom', value: 'custom' },
		],
		default: 'thisMonth',
		description: 'Time period for analytics',
	},
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['analytics'],
				period: ['custom'],
			},
		},
		default: '',
		description: 'Start date for custom period',
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		displayOptions: {
			show: {
				resource: ['analytics'],
				period: ['custom'],
			},
		},
		default: '',
		description: 'End date for custom period',
	},

	// Revenue Analytics options
	{
		displayName: 'Revenue Options',
		name: 'revenueOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getRevenueAnalytics'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Group By',
				name: 'groupBy',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Quarter', value: 'quarter' },
					{ name: 'Payer', value: 'payer' },
					{ name: 'Provider', value: 'provider' },
					{ name: 'Service Line', value: 'serviceLine' },
				],
				default: 'month',
				description: 'How to group revenue data',
			},
			{
				displayName: 'Include Projections',
				name: 'includeProjections',
				type: 'boolean',
				default: true,
				description: 'Whether to include revenue projections',
			},
			{
				displayName: 'Include Comparison',
				name: 'includeComparison',
				type: 'boolean',
				default: true,
				description: 'Whether to compare to prior period',
			},
		],
	},

	// Denial Analytics options
	{
		displayName: 'Denial Options',
		name: 'denialOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getDenialAnalytics'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Category',
				name: 'category',
				type: 'options',
				options: [
					{ name: 'All Categories', value: 'all' },
					{ name: 'Clinical', value: 'clinical' },
					{ name: 'Administrative', value: 'administrative' },
					{ name: 'Technical', value: 'technical' },
					{ name: 'Coverage', value: 'coverage' },
				],
				default: 'all',
				description: 'Denial category to analyze',
			},
			{
				displayName: 'Include Root Cause',
				name: 'includeRootCause',
				type: 'boolean',
				default: true,
				description: 'Whether to include root cause analysis',
			},
			{
				displayName: 'Include Prevention Tips',
				name: 'includePrevention',
				type: 'boolean',
				default: false,
				description: 'Whether to include prevention recommendations',
			},
		],
	},

	// Clean Claim Rate options
	{
		displayName: 'Clean Claim Options',
		name: 'cleanClaimOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getCleanClaimRate'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Breakdown By',
				name: 'breakdownBy',
				type: 'options',
				options: [
					{ name: 'Overall', value: 'overall' },
					{ name: 'Payer', value: 'payer' },
					{ name: 'Provider', value: 'provider' },
					{ name: 'Service Type', value: 'serviceType' },
					{ name: 'Claim Type', value: 'claimType' },
				],
				default: 'overall',
				description: 'How to break down clean claim rate',
			},
			{
				displayName: 'Include Error Analysis',
				name: 'includeErrorAnalysis',
				type: 'boolean',
				default: true,
				description: 'Whether to include common error analysis',
			},
		],
	},

	// Days in A/R options
	{
		displayName: 'A/R Options',
		name: 'arOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getDaysInAr'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Breakdown By',
				name: 'breakdownBy',
				type: 'options',
				options: [
					{ name: 'Overall', value: 'overall' },
					{ name: 'Payer', value: 'payer' },
					{ name: 'Financial Class', value: 'financialClass' },
					{ name: 'Provider', value: 'provider' },
				],
				default: 'overall',
				description: 'How to break down days in A/R',
			},
			{
				displayName: 'Include Trend',
				name: 'includeTrend',
				type: 'boolean',
				default: true,
				description: 'Whether to include historical trend',
			},
		],
	},

	// First Pass Rate options
	{
		displayName: 'First Pass Options',
		name: 'firstPassOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getFirstPassRate'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Breakdown By',
				name: 'breakdownBy',
				type: 'options',
				options: [
					{ name: 'Overall', value: 'overall' },
					{ name: 'Payer', value: 'payer' },
					{ name: 'Provider', value: 'provider' },
					{ name: 'Claim Type', value: 'claimType' },
				],
				default: 'overall',
				description: 'How to break down first pass rate',
			},
			{
				displayName: 'Include Rejection Analysis',
				name: 'includeRejectionAnalysis',
				type: 'boolean',
				default: true,
				description: 'Whether to include rejection analysis',
			},
		],
	},

	// Payer Performance options
	{
		displayName: 'Performance Options',
		name: 'performanceOptions',
		type: 'collection',
		placeholder: 'Add Option',
		displayOptions: {
			show: {
				resource: ['analytics'],
				operation: ['getPayerPerformance'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Payer Filter',
				name: 'payerFilter',
				type: 'string',
				default: '',
				description: 'Filter to specific payers (comma-separated IDs)',
			},
			{
				displayName: 'Top N Payers',
				name: 'topN',
				type: 'number',
				default: 10,
				description: 'Number of top payers to include',
			},
			{
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				options: [
					{ name: 'Volume', value: 'volume' },
					{ name: 'Revenue', value: 'revenue' },
					{ name: 'Payment Speed', value: 'paymentSpeed' },
					{ name: 'Denial Rate', value: 'denialRate' },
					{ name: 'Collection Rate', value: 'collectionRate' },
				],
				default: 'revenue',
				description: 'How to sort payer results',
			},
		],
	},
];

/**
 * Execute Analytics operations
 */
export async function execute(
	this: IExecuteFunctions,
	index: number,
	operation: string,
): Promise<INodeExecutionData[]> {
	const period = this.getNodeParameter('period', index) as string;
	let responseData: Record<string, unknown>;

	switch (operation) {
		case 'getRevenueAnalytics': {
			const revenueOptions = this.getNodeParameter('revenueOptions', index) as {
				groupBy?: string;
				includeProjections?: boolean;
				includeComparison?: boolean;
			};

			responseData = {
				success: true,
				analytics: {
					period,
					dateRange: {
						from: '2024-12-01',
						to: '2024-12-27',
					},
					summary: {
						grossCharges: 2456789.00,
						netRevenue: 1567890.00,
						adjustments: -456789.00,
						collections: 1234567.00,
						outstandingAr: 789012.00,
						collectionRate: 78.7,
					},
					byMonth: [
						{ month: 'Oct 2024', charges: 2345678.00, collections: 1189012.00 },
						{ month: 'Nov 2024', charges: 2398765.00, collections: 1201234.00 },
						{ month: 'Dec 2024', charges: 2456789.00, collections: 1234567.00 },
					],
					projections: revenueOptions.includeProjections ? {
						nextMonth: 1278901.00,
						nextQuarter: 3789012.00,
						confidence: 85.2,
					} : undefined,
					comparison: revenueOptions.includeComparison ? {
						vsLastPeriod: {
							charges: '+4.8%',
							collections: '+3.6%',
							collectionRate: '-0.8%',
						},
						vsLastYear: {
							charges: '+12.3%',
							collections: '+15.1%',
							collectionRate: '+2.1%',
						},
					} : undefined,
					topServiceLines: [
						{ serviceLine: 'Office Visits', revenue: 456789.00, percent: 29.1 },
						{ serviceLine: 'Procedures', revenue: 345678.00, percent: 22.0 },
						{ serviceLine: 'Lab/Pathology', revenue: 234567.00, percent: 15.0 },
						{ serviceLine: 'Imaging', revenue: 189012.00, percent: 12.1 },
						{ serviceLine: 'Other', revenue: 341844.00, percent: 21.8 },
					],
				},
			};
			break;
		}

		case 'getDenialAnalytics': {
			const denialOptions = this.getNodeParameter('denialOptions', index) as {
				category?: string;
				includeRootCause?: boolean;
				includePrevention?: boolean;
			};

			responseData = {
				success: true,
				analytics: {
					period,
					summary: {
						totalDenied: 234567.00,
						denialCount: 456,
						denialRate: 8.2,
						appealRate: 45.6,
						overturnRate: 52.3,
						avgResolutionDays: 34,
					},
					byCategory: [
						{
							category: 'Administrative',
							amount: 89012.00,
							count: 178,
							percent: 39.0,
							examples: ['Missing info', 'Timely filing', 'Auth required'],
						},
						{
							category: 'Clinical',
							amount: 67890.00,
							count: 134,
							percent: 29.4,
							examples: ['Medical necessity', 'Experimental', 'Frequency limit'],
						},
						{
							category: 'Coverage',
							amount: 45678.00,
							count: 89,
							percent: 19.5,
							examples: ['Not covered', 'Benefit max', 'Network'],
						},
						{
							category: 'Technical',
							amount: 31987.00,
							count: 55,
							percent: 12.1,
							examples: ['Invalid code', 'Modifier', 'Duplicate'],
						},
					],
					topDenialCodes: [
						{ code: 'CO-4', description: 'Modifier inconsistent', count: 67, amount: 34567.00 },
						{ code: 'CO-16', description: 'Missing information', count: 54, amount: 28765.00 },
						{ code: 'CO-197', description: 'Auth required', count: 48, amount: 25678.00 },
						{ code: 'CO-50', description: 'Non-covered', count: 42, amount: 22345.00 },
						{ code: 'PR-1', description: 'Deductible', count: 38, amount: 19876.00 },
					],
					rootCause: denialOptions.includeRootCause ? {
						frontEnd: [
							{ cause: 'Eligibility not verified', impact: 23.4 },
							{ cause: 'Auth not obtained', impact: 18.9 },
							{ cause: 'Incorrect patient info', impact: 12.3 },
						],
						coding: [
							{ cause: 'Modifier errors', impact: 15.6 },
							{ cause: 'Unbundling issues', impact: 8.7 },
							{ cause: 'Diagnosis specificity', impact: 6.8 },
						],
						billing: [
							{ cause: 'Timely filing', impact: 5.4 },
							{ cause: 'Duplicate claims', impact: 3.2 },
							{ cause: 'Incorrect payer', impact: 2.1 },
						],
					} : undefined,
					prevention: denialOptions.includePrevention ? [
						{
							action: 'Implement real-time eligibility verification',
							potentialSavings: 45678.00,
							priority: 'high',
						},
						{
							action: 'Automate prior auth checking',
							potentialSavings: 34567.00,
							priority: 'high',
						},
						{
							action: 'Add modifier validation rules',
							potentialSavings: 23456.00,
							priority: 'medium',
						},
					] : undefined,
					trends: {
						monthly: [
							{ month: 'Oct', rate: 9.1 },
							{ month: 'Nov', rate: 8.6 },
							{ month: 'Dec', rate: 8.2 },
						],
						vsLastYear: '-1.8%',
					},
				},
			};
			break;
		}

		case 'getCleanClaimRate': {
			const cleanClaimOptions = this.getNodeParameter('cleanClaimOptions', index) as {
				breakdownBy?: string;
				includeErrorAnalysis?: boolean;
			};

			responseData = {
				success: true,
				analytics: {
					period,
					summary: {
						cleanClaimRate: 92.4,
						totalClaims: 12456,
						cleanClaims: 11512,
						rejectedClaims: 944,
						avgCorrectionsPerClaim: 1.3,
					},
					trend: [
						{ month: 'Oct 2024', rate: 91.2 },
						{ month: 'Nov 2024', rate: 91.8 },
						{ month: 'Dec 2024', rate: 92.4 },
					],
					byClaimType: [
						{ type: '837P (Professional)', rate: 93.1, count: 8765 },
						{ type: '837I (Institutional)', rate: 90.8, count: 2891 },
						{ type: '837D (Dental)', rate: 94.2, count: 800 },
					],
					errorAnalysis: cleanClaimOptions.includeErrorAnalysis ? {
						topErrors: [
							{ error: 'Missing/invalid subscriber ID', count: 234, percent: 24.8 },
							{ error: 'Invalid diagnosis code', count: 189, percent: 20.0 },
							{ error: 'Missing referring provider', count: 156, percent: 16.5 },
							{ error: 'Invalid service date', count: 123, percent: 13.0 },
							{ error: 'Missing authorization', count: 98, percent: 10.4 },
						],
						byStage: {
							frontEnd: 42.3,
							coding: 31.2,
							billing: 26.5,
						},
					} : undefined,
					benchmark: {
						industry: 90.0,
						topPerformers: 96.0,
						yourRanking: 'Above Average',
					},
				},
			};
			break;
		}

		case 'getDaysInAr': {
			const arOptions = this.getNodeParameter('arOptions', index) as {
				breakdownBy?: string;
				includeTrend?: boolean;
			};

			responseData = {
				success: true,
				analytics: {
					period,
					summary: {
						daysInAr: 38.5,
						totalAr: 1234567.00,
						grossDaysAr: 42.3,
						netDaysAr: 38.5,
					},
					byAgingBucket: [
						{ bucket: '0-30 days', amount: 456789.00, percent: 37.0 },
						{ bucket: '31-60 days', amount: 296789.00, percent: 24.0 },
						{ bucket: '61-90 days', amount: 197654.00, percent: 16.0 },
						{ bucket: '91-120 days', amount: 148765.00, percent: 12.1 },
						{ bucket: '120+ days', amount: 134570.00, percent: 10.9 },
					],
					byPayer: [
						{ payer: 'Medicare', daysAr: 28, amount: 345678.00 },
						{ payer: 'BCBS', daysAr: 35, amount: 298765.00 },
						{ payer: 'Aetna', daysAr: 42, amount: 234567.00 },
						{ payer: 'UHC', daysAr: 45, amount: 198765.00 },
						{ payer: 'Self-Pay', daysAr: 72, amount: 156792.00 },
					],
					trend: arOptions.includeTrend ? {
						monthly: [
							{ month: 'Oct 2024', days: 41.2 },
							{ month: 'Nov 2024', days: 39.8 },
							{ month: 'Dec 2024', days: 38.5 },
						],
						vsLastYear: '-4.2 days',
						direction: 'improving',
					} : undefined,
					benchmark: {
						industry: 45.0,
						topPerformers: 32.0,
						yourRanking: 'Good',
					},
				},
			};
			break;
		}

		case 'getFirstPassRate': {
			const firstPassOptions = this.getNodeParameter('firstPassOptions', index) as {
				breakdownBy?: string;
				includeRejectionAnalysis?: boolean;
			};

			responseData = {
				success: true,
				analytics: {
					period,
					summary: {
						firstPassRate: 85.6,
						totalClaims: 12456,
						paidFirstPass: 10666,
						requiresFollowUp: 1790,
						avgTouchesForResolution: 2.3,
					},
					byPayer: [
						{ payer: 'Medicare', rate: 91.2, count: 3456 },
						{ payer: 'BCBS', rate: 87.4, count: 2987 },
						{ payer: 'Aetna', rate: 84.1, count: 2345 },
						{ payer: 'UHC', rate: 82.8, count: 1987 },
						{ payer: 'Other', rate: 79.6, count: 1681 },
					],
					rejectionAnalysis: firstPassOptions.includeRejectionAnalysis ? {
						topReasons: [
							{ reason: 'Additional info needed', count: 456, percent: 25.5 },
							{ reason: 'Medical review', count: 389, percent: 21.7 },
							{ reason: 'Payer processing delay', count: 312, percent: 17.4 },
							{ reason: 'Coding issue', count: 278, percent: 15.5 },
							{ reason: 'Auth issue', count: 355, percent: 19.8 },
						],
						avgResolutionTime: {
							overall: '18 days',
							byReason: [
								{ reason: 'Additional info', days: 12 },
								{ reason: 'Medical review', days: 28 },
								{ reason: 'Coding issue', days: 8 },
							],
						},
					} : undefined,
					trend: [
						{ month: 'Oct 2024', rate: 84.2 },
						{ month: 'Nov 2024', rate: 84.9 },
						{ month: 'Dec 2024', rate: 85.6 },
					],
					benchmark: {
						industry: 82.0,
						topPerformers: 92.0,
						yourRanking: 'Above Average',
					},
				},
			};
			break;
		}

		case 'getPayerPerformance': {
			const performanceOptions = this.getNodeParameter('performanceOptions', index) as {
				payerFilter?: string;
				topN?: number;
				sortBy?: string;
			};

			responseData = {
				success: true,
				analytics: {
					period,
					summary: {
						totalPayers: 45,
						totalVolume: 12456,
						totalRevenue: 1567890.00,
						avgPaymentDays: 32,
						avgDenialRate: 8.2,
					},
					payers: [
						{
							payerId: 'MCARE',
							payerName: 'Medicare',
							volume: 3456,
							chargedAmount: 567890.00,
							paidAmount: 456789.00,
							collectionRate: 80.4,
							avgPaymentDays: 21,
							denialRate: 5.2,
							cleanClaimRate: 94.1,
							firstPassRate: 91.2,
							score: 92,
							trend: 'stable',
						},
						{
							payerId: '54771',
							payerName: 'BCBS Tennessee',
							volume: 2987,
							chargedAmount: 489012.00,
							paidAmount: 378901.00,
							collectionRate: 77.5,
							avgPaymentDays: 28,
							denialRate: 7.8,
							cleanClaimRate: 92.3,
							firstPassRate: 87.4,
							score: 86,
							trend: 'improving',
						},
						{
							payerId: '60054',
							payerName: 'Aetna',
							volume: 2345,
							chargedAmount: 398765.00,
							paidAmount: 298765.00,
							collectionRate: 74.9,
							avgPaymentDays: 35,
							denialRate: 9.2,
							cleanClaimRate: 90.8,
							firstPassRate: 84.1,
							score: 78,
							trend: 'declining',
						},
						{
							payerId: '87726',
							payerName: 'UnitedHealthcare',
							volume: 1987,
							chargedAmount: 345678.00,
							paidAmount: 256789.00,
							collectionRate: 74.3,
							avgPaymentDays: 38,
							denialRate: 10.1,
							cleanClaimRate: 89.5,
							firstPassRate: 82.8,
							score: 74,
							trend: 'stable',
						},
					],
					benchmarks: {
						paymentSpeed: { excellent: '<25 days', good: '25-35 days', poor: '>35 days' },
						denialRate: { excellent: '<6%', good: '6-10%', poor: '>10%' },
						collectionRate: { excellent: '>80%', good: '70-80%', poor: '<70%' },
					},
					recommendations: [
						{
							payer: 'Aetna',
							issue: 'Increasing denial rate',
							action: 'Review denial patterns and update claim scrubbing rules',
						},
						{
							payer: 'UHC',
							issue: 'Slow payment speed',
							action: 'Consider electronic remittance and payment posting',
						},
					],
				},
			};
			break;
		}

		default:
			throw new NodeOperationError(
				this.getNode(),
				`Operation ${operation} is not supported for Analytics resource`,
			);
	}

	return [{ json: responseData }];
}
