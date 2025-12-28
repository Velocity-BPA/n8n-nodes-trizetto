/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Common Payer IDs
 * 
 * EDI Payer Identifiers for major healthcare payers
 * Used in claims submission and eligibility verification
 */

export const MAJOR_PAYERS = {
  // Medicare
  medicare: {
    id: 'CMS',
    name: 'Centers for Medicare & Medicaid Services',
    type: 'government',
  },
  medicarePartA: {
    id: '00901',
    name: 'Medicare Part A',
    type: 'government',
  },
  medicarePartB: {
    id: '00902',
    name: 'Medicare Part B',
    type: 'government',
  },
  
  // Major Commercial Payers
  aetna: {
    id: '60054',
    name: 'Aetna',
    type: 'commercial',
  },
  anthem: {
    id: '47198',
    name: 'Anthem Blue Cross Blue Shield',
    type: 'commercial',
  },
  bcbsAssociation: {
    id: 'BCBSA',
    name: 'Blue Cross Blue Shield Association',
    type: 'commercial',
  },
  cigna: {
    id: '62308',
    name: 'Cigna',
    type: 'commercial',
  },
  humana: {
    id: '61101',
    name: 'Humana',
    type: 'commercial',
  },
  kaiser: {
    id: '94135',
    name: 'Kaiser Permanente',
    type: 'commercial',
  },
  unitedHealthcare: {
    id: '87726',
    name: 'UnitedHealthcare',
    type: 'commercial',
  },
  
  // Managed Care
  molina: {
    id: '20934',
    name: 'Molina Healthcare',
    type: 'managed_care',
  },
  centene: {
    id: '68069',
    name: 'Centene Corporation',
    type: 'managed_care',
  },
  wellcare: {
    id: '84135',
    name: 'WellCare',
    type: 'managed_care',
  },
  
  // Regional Plans
  blueCrossCA: {
    id: '47198',
    name: 'Blue Cross of California',
    type: 'regional',
  },
  blueShieldCA: {
    id: '47198',
    name: 'Blue Shield of California',
    type: 'regional',
  },
  healthNet: {
    id: '95567',
    name: 'Health Net',
    type: 'regional',
  },
  
  // Tricare
  tricare: {
    id: '99726',
    name: 'TRICARE',
    type: 'government',
  },
  tricareEast: {
    id: '84403',
    name: 'TRICARE East',
    type: 'government',
  },
  tricareWest: {
    id: '99726',
    name: 'TRICARE West',
    type: 'government',
  },
  
  // Veterans Affairs
  champva: {
    id: '84146',
    name: 'CHAMPVA',
    type: 'government',
  },
  
  // Workers Compensation
  travelers: {
    id: '25682',
    name: 'Travelers Insurance',
    type: 'workers_comp',
  },
  hartford: {
    id: '36684',
    name: 'The Hartford',
    type: 'workers_comp',
  },
  
  // Auto/Liability
  geico: {
    id: '76406',
    name: 'GEICO',
    type: 'auto',
  },
  stateFarm: {
    id: '94107',
    name: 'State Farm',
    type: 'auto',
  },
  progressive: {
    id: '68247',
    name: 'Progressive',
    type: 'auto',
  },
  allstate: {
    id: '36234',
    name: 'Allstate',
    type: 'auto',
  },
} as const;

/**
 * Payer Types
 */
export const PAYER_TYPES = {
  commercial: 'Commercial Insurance',
  government: 'Government Program',
  managed_care: 'Managed Care Organization',
  regional: 'Regional Health Plan',
  workers_comp: 'Workers Compensation',
  auto: 'Auto/Liability Insurance',
  medicaid: 'Medicaid',
  medicare: 'Medicare',
  self_pay: 'Self-Pay',
} as const;

/**
 * BCBS Plan Prefixes
 * Blue Cross Blue Shield plans are identified by 3-character prefixes
 */
export const BCBS_PREFIXES = {
  // Sample prefixes - actual prefixes vary by plan
  AAA: 'Blue Cross Blue Shield of Alabama',
  AZB: 'Blue Cross Blue Shield of Arizona',
  ARK: 'Arkansas Blue Cross Blue Shield',
  CAL: 'Blue Cross of California',
  COL: 'Anthem Blue Cross Blue Shield of Colorado',
  CTB: 'Anthem Blue Cross Blue Shield of Connecticut',
  DEL: 'Highmark Blue Cross Blue Shield Delaware',
  FLB: 'Blue Cross Blue Shield of Florida',
  GAB: 'Blue Cross Blue Shield of Georgia',
  HAW: 'Blue Cross Blue Shield of Hawaii',
  IDB: 'Blue Cross of Idaho',
  ILB: 'Blue Cross Blue Shield of Illinois',
  INB: 'Anthem Blue Cross Blue Shield of Indiana',
  IOW: 'Wellmark Blue Cross Blue Shield of Iowa',
  KSB: 'Blue Cross Blue Shield of Kansas',
  KYB: 'Anthem Blue Cross Blue Shield of Kentucky',
  LAB: 'Blue Cross Blue Shield of Louisiana',
  MAB: 'Blue Cross Blue Shield of Massachusetts',
  MDB: 'CareFirst Blue Cross Blue Shield',
  MIB: 'Blue Cross Blue Shield of Michigan',
  MNB: 'Blue Cross Blue Shield of Minnesota',
  MSB: 'Blue Cross Blue Shield of Mississippi',
  MOB: 'Anthem Blue Cross Blue Shield of Missouri',
  MTB: 'Blue Cross Blue Shield of Montana',
  NEB: 'Blue Cross Blue Shield of Nebraska',
  NVB: 'Anthem Blue Cross Blue Shield of Nevada',
  NHB: 'Anthem Blue Cross Blue Shield of New Hampshire',
  NJB: 'Horizon Blue Cross Blue Shield of New Jersey',
  NMB: 'Blue Cross Blue Shield of New Mexico',
  NYB: 'Empire Blue Cross Blue Shield',
  NCB: 'Blue Cross Blue Shield of North Carolina',
  NDB: 'Blue Cross Blue Shield of North Dakota',
  OHB: 'Anthem Blue Cross Blue Shield of Ohio',
  OKB: 'Blue Cross Blue Shield of Oklahoma',
  ORB: 'Regence Blue Cross Blue Shield of Oregon',
  PAB: 'Independence Blue Cross',
  RIB: 'Blue Cross Blue Shield of Rhode Island',
  SCB: 'Blue Cross Blue Shield of South Carolina',
  SDB: 'Wellmark Blue Cross Blue Shield of South Dakota',
  TNB: 'Blue Cross Blue Shield of Tennessee',
  TXB: 'Blue Cross Blue Shield of Texas',
  UTB: 'Regence Blue Cross Blue Shield of Utah',
  VTB: 'Blue Cross Blue Shield of Vermont',
  VAB: 'Anthem Blue Cross Blue Shield of Virginia',
  WAB: 'Regence Blue Cross Blue Shield of Washington',
  WVB: 'Highmark Blue Cross Blue Shield West Virginia',
  WIB: 'Anthem Blue Cross Blue Shield of Wisconsin',
  WYB: 'Blue Cross Blue Shield of Wyoming',
} as const;

/**
 * State Medicaid Payer IDs
 * Medicaid payer identifiers by state
 */
export const MEDICAID_PAYERS = {
  AL: { id: 'SKALD', name: 'Alabama Medicaid' },
  AK: { id: 'SKALA', name: 'Alaska Medicaid' },
  AZ: { id: 'SKAZ0', name: 'Arizona Medicaid (AHCCCS)' },
  AR: { id: 'SKAR0', name: 'Arkansas Medicaid' },
  CA: { id: 'SKCA0', name: 'California Medicaid (Medi-Cal)' },
  CO: { id: 'SKCO0', name: 'Colorado Medicaid' },
  CT: { id: 'SKCT0', name: 'Connecticut Medicaid' },
  DE: { id: 'SKDE0', name: 'Delaware Medicaid' },
  DC: { id: 'SKDC0', name: 'DC Medicaid' },
  FL: { id: 'SKFL0', name: 'Florida Medicaid' },
  GA: { id: 'SKGA0', name: 'Georgia Medicaid' },
  HI: { id: 'SKHI0', name: 'Hawaii Medicaid' },
  ID: { id: 'SKID0', name: 'Idaho Medicaid' },
  IL: { id: 'SKIL0', name: 'Illinois Medicaid' },
  IN: { id: 'SKIN0', name: 'Indiana Medicaid' },
  IA: { id: 'SKIA0', name: 'Iowa Medicaid' },
  KS: { id: 'SKKS0', name: 'Kansas Medicaid' },
  KY: { id: 'SKKY0', name: 'Kentucky Medicaid' },
  LA: { id: 'SKLA0', name: 'Louisiana Medicaid' },
  ME: { id: 'SKME0', name: 'Maine Medicaid' },
  MD: { id: 'SKMD0', name: 'Maryland Medicaid' },
  MA: { id: 'SKMA0', name: 'Massachusetts Medicaid (MassHealth)' },
  MI: { id: 'SKMI0', name: 'Michigan Medicaid' },
  MN: { id: 'SKMN0', name: 'Minnesota Medicaid' },
  MS: { id: 'SKMS0', name: 'Mississippi Medicaid' },
  MO: { id: 'SKMO0', name: 'Missouri Medicaid' },
  MT: { id: 'SKMT0', name: 'Montana Medicaid' },
  NE: { id: 'SKNE0', name: 'Nebraska Medicaid' },
  NV: { id: 'SKNV0', name: 'Nevada Medicaid' },
  NH: { id: 'SKNH0', name: 'New Hampshire Medicaid' },
  NJ: { id: 'SKNJ0', name: 'New Jersey Medicaid' },
  NM: { id: 'SKNM0', name: 'New Mexico Medicaid' },
  NY: { id: 'SKNY0', name: 'New York Medicaid' },
  NC: { id: 'SKNC0', name: 'North Carolina Medicaid' },
  ND: { id: 'SKND0', name: 'North Dakota Medicaid' },
  OH: { id: 'SKOH0', name: 'Ohio Medicaid' },
  OK: { id: 'SKOK0', name: 'Oklahoma Medicaid' },
  OR: { id: 'SKOR0', name: 'Oregon Medicaid' },
  PA: { id: 'SKPA0', name: 'Pennsylvania Medicaid' },
  RI: { id: 'SKRI0', name: 'Rhode Island Medicaid' },
  SC: { id: 'SKSC0', name: 'South Carolina Medicaid' },
  SD: { id: 'SKSD0', name: 'South Dakota Medicaid' },
  TN: { id: 'SKTN0', name: 'Tennessee Medicaid (TennCare)' },
  TX: { id: 'SKTX0', name: 'Texas Medicaid' },
  UT: { id: 'SKUT0', name: 'Utah Medicaid' },
  VT: { id: 'SKVT0', name: 'Vermont Medicaid' },
  VA: { id: 'SKVA0', name: 'Virginia Medicaid' },
  WA: { id: 'SKWA0', name: 'Washington Medicaid' },
  WV: { id: 'SKWV0', name: 'West Virginia Medicaid' },
  WI: { id: 'SKWI0', name: 'Wisconsin Medicaid' },
  WY: { id: 'SKWY0', name: 'Wyoming Medicaid' },
} as const;

export type MajorPayer = keyof typeof MAJOR_PAYERS;
export type PayerType = keyof typeof PAYER_TYPES;
export type BcbsPrefix = keyof typeof BCBS_PREFIXES;
export type MedicaidState = keyof typeof MEDICAID_PAYERS;
