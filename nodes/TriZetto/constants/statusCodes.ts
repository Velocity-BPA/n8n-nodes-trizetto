/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Healthcare Status Codes
 * 
 * Standardized codes for claim status, eligibility, and transaction processing
 */

/**
 * Claim Status Category Codes (277 Response)
 * Based on ASC X12 Status Category Code Set
 */
export const CLAIM_STATUS_CATEGORIES = {
  // Accepted/Acknowledged
  A0: { code: 'A0', description: 'Acknowledgment/Receipt - The claim/encounter has been received.' },
  A1: { code: 'A1', description: 'Acknowledgment/Acceptance - The claim/encounter has been accepted for adjudication.' },
  A2: { code: 'A2', description: 'Acknowledgment/Acceptance into adjudication system - The claim/encounter has been accepted into the adjudication system.' },
  A3: { code: 'A3', description: 'Acknowledgment/Returned as unprocessable claim - The claim/encounter has been rejected and has not been entered into the adjudication system.' },
  A4: { code: 'A4', description: 'Acknowledgment/Not Found - The claim/encounter can not be found in the adjudication system.' },
  A5: { code: 'A5', description: 'Acknowledgment/Split Claim - The claim has been split upon acceptance into the adjudication system.' },
  A6: { code: 'A6', description: 'Acknowledgment/Receipt of additional information - The additional information has been received.' },
  A7: { code: 'A7', description: 'Acknowledgment/Pending - The claim/encounter is awaiting adjudication.' },
  
  // Pending
  P0: { code: 'P0', description: 'Pending: General - The claim is in a pending status.' },
  P1: { code: 'P1', description: 'Pending/In Process - The claim/encounter is in the adjudication system.' },
  P2: { code: 'P2', description: 'Pending/Payer Review - The claim/encounter is suspended and is pending review.' },
  P3: { code: 'P3', description: 'Pending/Provider Requested - Information has been requested from provider.' },
  P4: { code: 'P4', description: 'Pending/Patient Requested - Information has been requested from patient.' },
  P5: { code: 'P5', description: 'Pending/Payer administrative - The claim is pending the resolution of a payer administrative issue.' },
  
  // Finalized - Approved/Paid
  F0: { code: 'F0', description: 'Finalized - The claim/encounter has completed the adjudication cycle.' },
  F1: { code: 'F1', description: 'Finalized/Payment - The claim/encounter has been adjudicated and payment has been made.' },
  F2: { code: 'F2', description: 'Finalized/Denial - The claim/encounter has been adjudicated and has been denied.' },
  F3: { code: 'F3', description: 'Finalized/Revised - The claim/encounter has been revised.' },
  F4: { code: 'F4', description: 'Finalized/Forwarded - The claim/encounter has been forwarded.' },
  
  // Request for Additional Information
  R0: { code: 'R0', description: 'Request for Information - Additional information is requested.' },
  R1: { code: 'R1', description: 'Request for Information/Entity Requests - Entity requests additional information.' },
  R3: { code: 'R3', description: 'Request for Information/Claim in Suspense - The claim is in a suspense status.' },
  R4: { code: 'R4', description: 'Request for Information/Documentation Required - Supporting documentation is required.' },
  R5: { code: 'R5', description: 'Request for Information/Audit Required - The claim requires an audit.' },
  
  // Errors
  E0: { code: 'E0', description: 'Error - An error has been detected.' },
  E1: { code: 'E1', description: 'Error/Response not possible - Unable to provide response at this time.' },
  E2: { code: 'E2', description: 'Error/Information holder is not able to complete - Unable to complete the status request.' },
  E3: { code: 'E3', description: 'Error/Syntax error - A syntax error was found in the request.' },
  E4: { code: 'E4', description: 'Error/Payer not found - The payer could not be identified.' },
} as const;

/**
 * Eligibility Status Codes
 */
export const ELIGIBILITY_STATUS = {
  // Active/Eligible
  '1': { code: '1', description: 'Active Coverage' },
  '2': { code: '2', description: 'Active - Full Risk Capitation' },
  '3': { code: '3', description: 'Active - Services Capitated' },
  '4': { code: '4', description: 'Active - Services Capitated to Primary Care Physician' },
  '5': { code: '5', description: 'Active - Pending Investigation' },
  '6': { code: '6', description: 'Inactive' },
  '7': { code: '7', description: 'Inactive - Pending Eligibility Update' },
  '8': { code: '8', description: 'Inactive - Pending Investigation' },
  
  // Ineligible
  'I': { code: 'I', description: 'Non-Covered' },
  'U': { code: 'U', description: 'Unknown' },
  'W': { code: 'W', description: 'Other Source of Data' },
  'X': { code: 'X', description: 'Requested Data Not Available' },
} as const;

/**
 * Service Type Codes (Eligibility)
 */
export const SERVICE_TYPE_CODES = {
  '1': 'Medical Care',
  '2': 'Surgical',
  '3': 'Consultation',
  '4': 'Diagnostic X-Ray',
  '5': 'Diagnostic Lab',
  '6': 'Radiation Therapy',
  '7': 'Anesthesia',
  '8': 'Surgical Assistance',
  '12': 'Durable Medical Equipment Purchase',
  '14': 'Renal Supplies in the Home',
  '18': 'Durable Medical Equipment Rental',
  '23': 'Diagnostic Medical',
  '24': 'Ophthalmology/Optometry',
  '25': 'Dental Care',
  '26': 'Mental Health',
  '27': 'Preventive',
  '30': 'Health Benefit Plan Coverage',
  '33': 'Chiropractic',
  '34': 'Dental Care',
  '35': 'Dental Accident',
  '36': 'Vision (Optometry)',
  '37': 'Hospitalization',
  '38': 'Emergency Services',
  '39': 'Podiatry',
  '40': 'Orthodontics',
  '41': 'Dental - Basic',
  '42': 'Dental - Major',
  '47': 'Hospital - Emergency Medical',
  '48': 'Hospital - Inpatient',
  '50': 'Hospital - Outpatient',
  '51': 'Hospital - Emergency Room',
  '52': 'Hospital - Emergency Room - Medical',
  '53': 'Hospital - Ambulatory Surgical',
  '54': 'Long-Term Care',
  '55': 'Major Medical',
  '56': 'Medically Related Transportation',
  '57': 'Air Transportation',
  '58': 'Cabulance',
  '59': 'Licensed Ambulance',
  '60': 'General Benefits',
  '61': 'In-vitro Fertilization',
  '62': 'MRI/CAT Scan',
  '63': 'Donor Procedures',
  '64': 'Acupuncture',
  '65': 'Newborn Care',
  '66': 'Pathology',
  '67': 'Smoking Cessation',
  '68': 'Well Baby Care',
  '69': 'Maternity',
  '70': 'Transplants',
  '71': 'Audiology Exam',
  '72': 'Inhalation Therapy',
  '73': 'Diagnostic Medical',
  '74': 'Private Duty Nursing',
  '75': 'Prosthetic Device',
  '76': 'Dialysis',
  '77': 'Otological Exam',
  '78': 'Chemotherapy',
  '79': 'Allergy Testing',
  '80': 'Immunizations',
  '81': 'Routine Physical',
  '82': 'Family Planning',
  '83': 'Infertility',
  '84': 'Abortion',
  '85': 'AIDS',
  '86': 'Emergency Services',
  '87': 'Cancer',
  '88': 'Pharmacy',
  '89': 'Free Standing Prescription Drug',
  '90': 'Mail Order Prescription Drug',
  '91': 'Brand Name Prescription Drug',
  '92': 'Generic Prescription Drug',
  '93': 'Podiatry - Nursing Home',
  '94': 'Podiatry - Office Visits',
  '95': 'Podiatry',
  '96': 'Professional (Physician) Office Visit',
  '97': 'Professional (Physician) Surgical',
  '98': 'Psychotherapy',
  '99': 'Social Work',
  'A0': 'Speech Therapy',
  'A1': 'Skilled Nursing Care',
  'A2': 'Skilled Nursing Care Room and Board',
  'A3': 'Substance Abuse',
  'A4': 'Substance Abuse - Facility',
  'A5': 'Substance Abuse - Outpatient',
  'A6': 'Substance Abuse - Inpatient',
  'A7': 'Substance Abuse Facility Inpatient',
  'A8': 'Substance Abuse Facility Outpatient',
  'A9': 'Urgent Care',
  'AA': 'Used Durable Medical Equipment Rental',
  'AB': 'Worker\'s Compensation',
  'AC': 'MRI Scan',
  'AD': 'Occupational Therapy',
  'AE': 'Physical Therapy',
  'AF': 'Speech Therapy',
  'AG': 'Skilled Nursing Care',
  'AH': 'Respite Care',
  'AI': 'Hospice',
  'AJ': 'Home Health Care',
  'AK': 'Other Medical',
  'AL': 'Vision Coverage',
  'AM': 'Preventive Services',
} as const;

/**
 * Transaction Acknowledgment Status
 */
export const ACKNOWLEDGMENT_STATUS = {
  // 999 Implementation Acknowledgment
  A: { code: 'A', description: 'Accepted' },
  E: { code: 'E', description: 'Accepted But Errors Were Noted' },
  M: { code: 'M', description: 'Rejected, Message Authentication Code (MAC) Failed' },
  P: { code: 'P', description: 'Partially Accepted, At Least One Transaction Set Was Rejected' },
  R: { code: 'R', description: 'Rejected' },
  W: { code: 'W', description: 'Rejected, Assurance Failed Validity Tests' },
  X: { code: 'X', description: 'Rejected, Content After Decryption Could Not Be Analyzed' },
  
  // TA1 Interchange Acknowledgment
  TA1_A: { code: 'A', description: 'Interchange Accepted' },
  TA1_E: { code: 'E', description: 'Interchange Accepted With Errors' },
  TA1_R: { code: 'R', description: 'Interchange Rejected' },
} as const;

/**
 * Prior Authorization Status
 */
export const PRIOR_AUTH_STATUS = {
  A1: { code: 'A1', description: 'Certified in Total' },
  A2: { code: 'A2', description: 'Certified - Partial' },
  A3: { code: 'A3', description: 'Not Certified' },
  A4: { code: 'A4', description: 'Pended' },
  A5: { code: 'A5', description: 'Modified' },
  A6: { code: 'A6', description: 'Contact Payer' },
  CT: { code: 'CT', description: 'Contact' },
  NA: { code: 'NA', description: 'No Action Required' },
  PA: { code: 'PA', description: 'Prior Authorization Required' },
  ND: { code: 'ND', description: 'Not Determined' },
} as const;

export type ClaimStatusCategory = keyof typeof CLAIM_STATUS_CATEGORIES;
export type EligibilityStatusCode = keyof typeof ELIGIBILITY_STATUS;
export type ServiceTypeCode = keyof typeof SERVICE_TYPE_CODES;
export type PriorAuthStatusCode = keyof typeof PRIOR_AUTH_STATUS;
