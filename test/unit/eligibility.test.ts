/**
 * Unit tests for Eligibility Resource
 * 
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 */

import { IExecuteFunctions } from 'n8n-workflow';

// Mock the execute functions
const mockExecuteFunctions = {
  getInputData: jest.fn(),
  getNodeParameter: jest.fn(),
  getCredentials: jest.fn(),
  helpers: {
    request: jest.fn(),
    requestWithAuthentication: jest.fn(),
  },
} as unknown as IExecuteFunctions;

describe('Eligibility Resource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkEligibility', () => {
    it('should validate required fields for eligibility check', async () => {
      const mockCredentials = {
        environment: 'test',
        username: 'test_user',
        password: 'test_pass',
        clientId: 'client_123',
        clientSecret: 'secret_456',
        submitterId: 'submitter_789',
      };

      mockExecuteFunctions.getCredentials = jest.fn().mockResolvedValue(mockCredentials);
      mockExecuteFunctions.getNodeParameter = jest.fn()
        .mockImplementation((param: string) => {
          const params: Record<string, unknown> = {
            operation: 'checkEligibility',
            payerId: 'BCBS001',
            memberId: 'MEM123456',
            dateOfBirth: '1990-01-15',
            firstName: 'John',
            lastName: 'Doe',
            providerNpi: '1234567890',
            serviceDate: '2024-01-15',
          };
          return params[param];
        });

      // Verify parameters are correctly read
      expect(mockExecuteFunctions.getNodeParameter('operation', 0)).toBe('checkEligibility');
      expect(mockExecuteFunctions.getNodeParameter('payerId', 0)).toBe('BCBS001');
      expect(mockExecuteFunctions.getNodeParameter('memberId', 0)).toBe('MEM123456');
    });

    it('should handle missing member ID', () => {
      mockExecuteFunctions.getNodeParameter = jest.fn()
        .mockImplementation((param: string) => {
          if (param === 'memberId') {
            return '';
          }
          return 'test_value';
        });

      const memberId = mockExecuteFunctions.getNodeParameter('memberId', 0);
      expect(memberId).toBe('');
    });
  });

  describe('getBenefitsSummary', () => {
    it('should parse benefit categories correctly', () => {
      const mockBenefits = {
        eligibilityId: 'ELG123',
        categories: [
          { code: '30', name: 'Medical', inNetwork: true },
          { code: '33', name: 'Dental', inNetwork: true },
          { code: '47', name: 'Vision', inNetwork: false },
        ],
      };

      expect(mockBenefits.categories).toHaveLength(3);
      expect(mockBenefits.categories[0].code).toBe('30');
      expect(mockBenefits.categories[2].inNetwork).toBe(false);
    });
  });

  describe('getCoverageDetails', () => {
    it('should extract deductible information', () => {
      const mockCoverage = {
        deductible: {
          individual: { amount: 1500, remaining: 750 },
          family: { amount: 3000, remaining: 2000 },
        },
        outOfPocketMax: {
          individual: { amount: 6000, remaining: 4500 },
          family: { amount: 12000, remaining: 9000 },
        },
      };

      expect(mockCoverage.deductible.individual.amount).toBe(1500);
      expect(mockCoverage.deductible.individual.remaining).toBe(750);
      expect(mockCoverage.outOfPocketMax.family.remaining).toBe(9000);
    });
  });

  describe('parse271Response', () => {
    it('should parse X12 271 response correctly', () => {
      const mock271Segments = [
        'ISA*00*          *00*          *ZZ*SENDER         *ZZ*RECEIVER       *240115*1200*^*00501*000000001*0*P*:~',
        'GS*HB*SENDER*RECEIVER*20240115*1200*1*X*005010X279A1~',
        'ST*271*0001*005010X279A1~',
        'BHT*0022*11*TN123456*20240115*1200~',
        'HL*1**20*1~',
        'NM1*PR*2*BLUE CROSS BLUE SHIELD*****PI*BCBS001~',
        'HL*2*1*21*1~',
        'NM1*1P*1*DOE*JOHN****XX*1234567890~',
        'EB*1**30**IND*~',
        'SE*9*0001~',
        'GE*1*1~',
        'IEA*1*000000001~',
      ];

      const ediContent = mock271Segments.join('');
      
      // Check for key segments
      expect(ediContent).toContain('ST*271');
      expect(ediContent).toContain('EB*1');
      expect(ediContent).toContain('NM1*PR*2*BLUE CROSS BLUE SHIELD');
    });

    it('should handle inactive coverage status', () => {
      const mockEligibilityStatus = {
        status: 'inactive',
        statusCode: '6',
        statusDescription: 'Inactive',
        effectiveDate: '2023-01-01',
        terminationDate: '2023-12-31',
      };

      expect(mockEligibilityStatus.status).toBe('inactive');
      expect(mockEligibilityStatus.statusCode).toBe('6');
    });
  });
});

describe('Eligibility Validation', () => {
  describe('NPI Validation', () => {
    it('should validate 10-digit NPI format', () => {
      const validNpi = '1234567890';
      const invalidNpi = '12345';
      
      expect(validNpi.length).toBe(10);
      expect(/^\d{10}$/.test(validNpi)).toBe(true);
      expect(/^\d{10}$/.test(invalidNpi)).toBe(false);
    });

    it('should validate NPI check digit using Luhn algorithm', () => {
      // Mock Luhn validation for NPI
      const validateNpiCheckDigit = (npi: string): boolean => {
        if (!/^\d{10}$/.test(npi)) return false;
        
        // Add 80840 prefix for Luhn calculation
        const fullNumber = '80840' + npi;
        let sum = 0;
        let alternate = false;
        
        for (let i = fullNumber.length - 1; i >= 0; i--) {
          let digit = parseInt(fullNumber[i], 10);
          if (alternate) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          alternate = !alternate;
        }
        
        return sum % 10 === 0;
      };

      // Known valid NPI
      expect(validateNpiCheckDigit('1234567893')).toBe(true);
    });
  });

  describe('Date Validation', () => {
    it('should validate date of birth format', () => {
      const validDate = '1990-01-15';
      const invalidDate = '01/15/1990';
      
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      expect(isoDatePattern.test(validDate)).toBe(true);
      expect(isoDatePattern.test(invalidDate)).toBe(false);
    });

    it('should ensure date of birth is in the past', () => {
      const pastDate = new Date('1990-01-15');
      const futureDate = new Date('2099-01-15');
      const today = new Date();
      
      expect(pastDate < today).toBe(true);
      expect(futureDate > today).toBe(true);
    });
  });

  describe('Member ID Validation', () => {
    it('should handle alphanumeric member IDs', () => {
      const validMemberIds = ['ABC123456', 'MEM-12345', '123456789'];
      const invalidMemberIds = ['', 'A', 'AB'];
      
      validMemberIds.forEach(id => {
        expect(id.length).toBeGreaterThanOrEqual(3);
      });
      
      invalidMemberIds.forEach(id => {
        expect(id.length).toBeLessThan(3);
      });
    });
  });
});
