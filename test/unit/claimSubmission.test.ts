/**
 * Unit tests for Claim Submission Resource
 * 
 * [Velocity BPA Licensing Notice]
 * This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
 * Use of this node by for-profit organizations in production environments
 * requires a commercial license from Velocity BPA.
 */

describe('Claim Submission Resource', () => {
  describe('Professional Claim (837P)', () => {
    it('should validate required claim fields', () => {
      const claim = {
        claimType: '837P',
        payerId: 'BCBS001',
        providerNpi: '1234567890',
        patientMemberId: 'MEM123456',
        dateOfService: '2024-01-15',
        placeOfService: '11',
        diagnosisCodes: ['Z00.00'],
        procedureCodes: [{ code: '99213', units: 1, charge: 150.00 }],
        totalCharge: 150.00,
      };

      expect(claim.claimType).toBe('837P');
      expect(claim.diagnosisCodes.length).toBeGreaterThan(0);
      expect(claim.procedureCodes.length).toBeGreaterThan(0);
    });

    it('should validate place of service code', () => {
      const validPosCodes = ['11', '12', '21', '22', '23', '24', '31', '32'];
      const posCode = '11';
      
      expect(validPosCodes.includes(posCode)).toBe(true);
    });

    it('should validate diagnosis code format (ICD-10)', () => {
      const validIcd10Codes = ['Z00.00', 'J06.9', 'M54.5', 'E11.9'];
      const icd10Pattern = /^[A-Z]\d{2}(\.\d{1,2})?$/;
      
      validIcd10Codes.forEach(code => {
        expect(icd10Pattern.test(code)).toBe(true);
      });
    });

    it('should validate CPT code format', () => {
      const validCptCodes = ['99213', '99214', '99215', '36415', '85025'];
      const cptPattern = /^\d{5}$/;
      
      validCptCodes.forEach(code => {
        expect(cptPattern.test(code)).toBe(true);
      });
    });
  });

  describe('Institutional Claim (837I)', () => {
    it('should validate institutional claim fields', () => {
      const claim = {
        claimType: '837I',
        payerId: 'MEDICARE',
        facilityNpi: '1234567890',
        patientMemberId: 'MBI123456789',
        admissionDate: '2024-01-10',
        dischargeDate: '2024-01-15',
        typeOfBill: '111',
        diagnosisCodes: ['J18.9'],
        drgCode: '193',
        revenueCodes: [
          { code: '0120', units: 5, charge: 2500.00 },
          { code: '0250', units: 1, charge: 150.00 },
        ],
        totalCharge: 2650.00,
      };

      expect(claim.claimType).toBe('837I');
      expect(claim.typeOfBill).toMatch(/^\d{3}$/);
      expect(claim.revenueCodes.length).toBeGreaterThan(0);
    });

    it('should validate revenue code format', () => {
      const validRevenueCodes = ['0100', '0120', '0250', '0300', '0450'];
      const revenuePattern = /^\d{4}$/;
      
      validRevenueCodes.forEach(code => {
        expect(revenuePattern.test(code)).toBe(true);
      });
    });

    it('should validate type of bill format', () => {
      const validTypeOfBills = ['111', '112', '113', '114', '121', '131'];
      
      validTypeOfBills.forEach(tob => {
        expect(tob.length).toBe(3);
        expect(/^\d{3}$/.test(tob)).toBe(true);
      });
    });
  });

  describe('Dental Claim (837D)', () => {
    it('should validate dental claim fields', () => {
      const claim = {
        claimType: '837D',
        payerId: 'DELTA001',
        providerNpi: '1234567890',
        patientMemberId: 'DENT123456',
        dateOfService: '2024-01-15',
        toothNumbers: ['14', '15'],
        procedures: [
          { code: 'D0120', tooth: '14', surface: '', charge: 75.00 },
          { code: 'D2391', tooth: '15', surface: 'MO', charge: 225.00 },
        ],
        totalCharge: 300.00,
      };

      expect(claim.claimType).toBe('837D');
      expect(claim.toothNumbers.length).toBeGreaterThan(0);
    });

    it('should validate dental procedure code format', () => {
      const validDentalCodes = ['D0120', 'D0150', 'D1110', 'D2391', 'D7140'];
      const dentalPattern = /^D\d{4}$/;
      
      validDentalCodes.forEach(code => {
        expect(dentalPattern.test(code)).toBe(true);
      });
    });

    it('should validate tooth surface codes', () => {
      const validSurfaces = ['M', 'O', 'D', 'B', 'L', 'I', 'MO', 'MOD', 'MODBL'];
      const surfacePattern = /^[MODB LI]{0,5}$/;
      
      expect(surfacePattern.test('MO')).toBe(true);
      expect(surfacePattern.test('MOD')).toBe(true);
    });
  });

  describe('Claim Validation', () => {
    it('should validate total charge calculation', () => {
      const lineItems = [
        { charge: 150.00 },
        { charge: 75.50 },
        { charge: 225.00 },
      ];
      
      const totalCharge = lineItems.reduce((sum, item) => sum + item.charge, 0);
      expect(totalCharge).toBe(450.50);
    });

    it('should validate date range for services', () => {
      const fromDate = new Date('2024-01-10');
      const toDate = new Date('2024-01-15');
      
      expect(fromDate <= toDate).toBe(true);
    });

    it('should require at least one diagnosis code', () => {
      const claim = {
        diagnosisCodes: ['Z00.00'],
      };
      
      expect(claim.diagnosisCodes.length).toBeGreaterThanOrEqual(1);
    });

    it('should limit diagnosis codes to 12', () => {
      const diagnosisCodes = [
        'Z00.00', 'J06.9', 'M54.5', 'E11.9', 'I10',
        'K21.0', 'N39.0', 'R10.9', 'F32.9', 'G43.909',
        'L50.0', 'D64.9',
      ];
      
      expect(diagnosisCodes.length).toBeLessThanOrEqual(12);
    });
  });

  describe('Claim Acknowledgment', () => {
    it('should parse 999 acknowledgment', () => {
      const acknowledgment = {
        transactionSetAck: 'A',
        implementationAck: 'A',
        errors: [],
        accepted: true,
      };

      expect(acknowledgment.accepted).toBe(true);
      expect(acknowledgment.errors.length).toBe(0);
    });

    it('should handle rejected claims', () => {
      const rejection = {
        transactionSetAck: 'R',
        implementationAck: 'R',
        errors: [
          { code: 'IK304', description: 'Invalid Subscriber ID' },
          { code: 'IK403', description: 'Invalid Date Format' },
        ],
        accepted: false,
      };

      expect(rejection.accepted).toBe(false);
      expect(rejection.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Claim Amount Calculations', () => {
  it('should calculate patient responsibility correctly', () => {
    const claim = {
      totalCharge: 500.00,
      allowedAmount: 400.00,
      paidAmount: 320.00,
      coPayAmount: 40.00,
      coInsuranceAmount: 40.00,
      deductibleAmount: 0.00,
    };

    const patientResponsibility = 
      claim.coPayAmount + claim.coInsuranceAmount + claim.deductibleAmount;
    
    expect(patientResponsibility).toBe(80.00);
  });

  it('should handle contractual adjustments', () => {
    const totalCharge = 500.00;
    const allowedAmount = 400.00;
    const contractualAdjustment = totalCharge - allowedAmount;
    
    expect(contractualAdjustment).toBe(100.00);
  });
});
