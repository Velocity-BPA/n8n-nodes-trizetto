/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * TriZetto API Endpoints
 * 
 * Centralized endpoint definitions for TriZetto services
 */

export const TRIZETTO_ENVIRONMENTS = {
  production: {
    baseUrl: 'https://api.trizetto.com/v1',
    gatewayUrl: 'https://gateway.trizetto.com',
    soapUrl: 'https://services.trizetto.com/soap',
    sftpHost: 'sftp.trizetto.com',
  },
  staging: {
    baseUrl: 'https://api-staging.trizetto.com/v1',
    gatewayUrl: 'https://gateway-staging.trizetto.com',
    soapUrl: 'https://services-staging.trizetto.com/soap',
    sftpHost: 'sftp-staging.trizetto.com',
  },
} as const;

/**
 * REST API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    token: '/oauth/token',
    refresh: '/oauth/refresh',
    revoke: '/oauth/revoke',
  },
  
  // Eligibility (270/271)
  eligibility: {
    check: '/eligibility/check',
    batch: '/eligibility/batch',
    response: '/eligibility/response',
    benefits: '/eligibility/benefits',
    coverage: '/eligibility/coverage',
    deductible: '/eligibility/deductible',
    copay: '/eligibility/copay',
    coinsurance: '/eligibility/coinsurance',
    priorAuth: '/eligibility/prior-auth-requirements',
    history: '/eligibility/history',
  },
  
  // Claims (837)
  claims: {
    professional: '/claims/professional',
    institutional: '/claims/institutional',
    dental: '/claims/dental',
    validate: '/claims/validate',
    status: '/claims/status',
    acknowledgment: '/claims/acknowledgment',
    batch: '/claims/batch',
    history: '/claims/history',
    resubmit: '/claims/resubmit',
    correct: '/claims/correct',
  },
  
  // Claim Status (276/277)
  claimStatus: {
    check: '/claim-status/check',
    response: '/claim-status/response',
    detailed: '/claim-status/detailed',
    byClaimId: '/claim-status/by-claim-id',
    byPatient: '/claim-status/by-patient',
    history: '/claim-status/history',
  },
  
  // Remittance (835)
  remittance: {
    advice: '/remittance/advice',
    list: '/remittance/list',
    byCheckNumber: '/remittance/by-check-number',
    byDate: '/remittance/by-date',
    payment: '/remittance/payment-details',
    adjustments: '/remittance/adjustments',
    remarks: '/remittance/remarks',
    reconcile: '/remittance/reconcile',
    download: '/remittance/download',
  },
  
  // Prior Authorization
  priorAuth: {
    submit: '/prior-auth/submit',
    status: '/prior-auth/status',
    response: '/prior-auth/response',
    update: '/prior-auth/update',
    cancel: '/prior-auth/cancel',
    history: '/prior-auth/history',
    requirements: '/prior-auth/requirements',
  },
  
  // Attachments
  attachments: {
    submit: '/attachments/submit',
    status: '/attachments/status',
    list: '/attachments/list',
    link: '/attachments/link-to-claim',
    types: '/attachments/types',
    pwkCodes: '/attachments/pwk-codes',
    upload: '/attachments/upload',
  },
  
  // Provider
  provider: {
    info: '/provider/info',
    search: '/provider/search',
    validateNpi: '/provider/validate-npi',
    byNpi: '/provider/by-npi',
    networkStatus: '/provider/network-status',
    enrolled: '/provider/enrolled',
    credentials: '/provider/credentials',
  },
  
  // Payer
  payer: {
    list: '/payer/list',
    info: '/payer/info',
    byId: '/payer/by-id',
    rules: '/payer/rules',
    ediRequirements: '/payer/edi-requirements',
    tradingPartner: '/payer/trading-partner',
    connectivity: '/payer/connectivity',
  },
  
  // Patient
  patient: {
    search: '/patient/search',
    info: '/patient/info',
    byMemberId: '/patient/by-member-id',
    demographics: '/patient/demographics',
    coverage: '/patient/coverage',
    claims: '/patient/claims',
    history: '/patient/history',
  },
  
  // Facility
  facility: {
    list: '/facility/list',
    info: '/facility/info',
    validateNpi: '/facility/validate-npi',
    providers: '/facility/providers',
    payers: '/facility/payers',
  },
  
  // Code Validation
  codeValidation: {
    icd10: '/codes/icd10/validate',
    cpt: '/codes/cpt/validate',
    hcpcs: '/codes/hcpcs/validate',
    revenue: '/codes/revenue/validate',
    description: '/codes/description',
    edits: '/codes/edits',
    cci: '/codes/cci-edits',
    lcdNcd: '/codes/lcd-ncd',
    modifier: '/codes/modifier-rules',
  },
  
  // Batch
  batch: {
    submit: '/batch/submit',
    status: '/batch/status',
    results: '/batch/results',
    errors: '/batch/errors',
    download: '/batch/download',
    list: '/batch/list',
    cancel: '/batch/cancel',
  },
  
  // EDI
  edi: {
    submit: '/edi/submit',
    response: '/edi/response',
    ack997: '/edi/997',
    ackTa1: '/edi/ta1',
    parse: '/edi/parse',
    generate: '/edi/generate',
    validate: '/edi/validate',
    history: '/edi/history',
  },
  
  // Real-Time
  realTime: {
    eligibility: '/realtime/eligibility',
    claimStatus: '/realtime/claim-status',
    estimate: '/realtime/estimate',
    priorAuth: '/realtime/prior-auth',
  },
  
  // CareAdvance (RCM)
  careAdvance: {
    workQueue: '/careadvance/work-queue',
    tasks: '/careadvance/tasks',
    completeTask: '/careadvance/tasks/complete',
    reassign: '/careadvance/tasks/reassign',
    taskHistory: '/careadvance/tasks/history',
    productivity: '/careadvance/productivity',
  },
  
  // Reports
  report: {
    generate: '/reports/generate',
    get: '/reports/get',
    list: '/reports/list',
    schedule: '/reports/schedule',
    ar: '/reports/accounts-receivable',
    denial: '/reports/denial',
    payment: '/reports/payment',
    export: '/reports/export',
  },
  
  // Analytics
  analytics: {
    revenue: '/analytics/revenue',
    denial: '/analytics/denial',
    cleanClaim: '/analytics/clean-claim-rate',
    daysInAR: '/analytics/days-in-ar',
    firstPass: '/analytics/first-pass-rate',
    payerPerformance: '/analytics/payer-performance',
  },
  
  // Clearinghouse
  clearinghouse: {
    status: '/clearinghouse/status',
    tradingPartners: '/clearinghouse/trading-partners',
    connectionStatus: '/clearinghouse/connection-status',
    testConnection: '/clearinghouse/test-connection',
    enrollmentStatus: '/clearinghouse/enrollment-status',
  },
  
  // Enrollment
  enrollment: {
    status: '/enrollment/status',
    submit: '/enrollment/submit',
    payers: '/enrollment/payers',
    update: '/enrollment/update',
    requirements: '/enrollment/requirements',
  },
  
  // Webhooks
  webhook: {
    create: '/webhooks',
    get: '/webhooks',
    update: '/webhooks',
    delete: '/webhooks',
    list: '/webhooks/list',
    verify: '/webhooks/verify',
  },
  
  // Utility
  utility: {
    validateNpi: '/utility/validate-npi',
    validateTaxId: '/utility/validate-tax-id',
    posCodes: '/utility/pos-codes',
    taxonomyCodes: '/utility/taxonomy-codes',
    adjustmentCodes: '/utility/adjustment-codes',
    remarkCodes: '/utility/remark-codes',
    testConnection: '/utility/test-connection',
    status: '/utility/status',
  },
} as const;

/**
 * SOAP Service Endpoints
 */
export const SOAP_ENDPOINTS = {
  eligibility: '/EligibilityService.svc',
  claims: '/ClaimService.svc',
  claimStatus: '/ClaimStatusService.svc',
  remittance: '/RemittanceService.svc',
  priorAuth: '/PriorAuthService.svc',
  attachment: '/AttachmentService.svc',
} as const;

/**
 * EDI Transaction Set Identifiers
 */
export const EDI_TRANSACTION_SETS = {
  '270': 'Health Care Eligibility/Benefit Inquiry',
  '271': 'Health Care Eligibility/Benefit Response',
  '276': 'Health Care Claim Status Request',
  '277': 'Health Care Claim Status Response',
  '278': 'Health Care Services Review Request/Response',
  '835': 'Health Care Claim Payment/Advice (ERA)',
  '837I': 'Health Care Claim: Institutional',
  '837P': 'Health Care Claim: Professional',
  '837D': 'Health Care Claim: Dental',
  '997': 'Functional Acknowledgment',
  '999': 'Implementation Acknowledgment',
  'TA1': 'Interchange Acknowledgment',
} as const;

export type Environment = keyof typeof TRIZETTO_ENVIRONMENTS;
export type EdiTransactionSet = keyof typeof EDI_TRANSACTION_SETS;
