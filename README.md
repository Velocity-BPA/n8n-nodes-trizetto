# n8n-nodes-trizetto

> **[Velocity BPA Licensing Notice]**
>
> This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).
>
> Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.
>
> For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.

A comprehensive n8n community node package for TriZetto healthcare clearinghouse integration. Provides complete EDI transaction support (270/271, 276/277, 837, 835), real-time eligibility verification, claims management, remittance processing, prior authorization workflows, and revenue cycle management capabilities.

![n8n](https://img.shields.io/badge/n8n-community--node-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)
![License](https://img.shields.io/badge/license-BSL--1.1-blue)
![Healthcare](https://img.shields.io/badge/industry-healthcare-green)
![HIPAA](https://img.shields.io/badge/HIPAA-compliant-brightgreen)

## Features

- **Eligibility Verification (270/271)** - Real-time and batch eligibility checks with comprehensive benefits parsing
- **Claim Submission (837)** - Professional, Institutional, and Dental claim submission with validation
- **Claim Status (276/277)** - Track claim status with detailed event history
- **Remittance Processing (835)** - Parse ERA files, reconcile payments, extract adjustment codes
- **Prior Authorization** - Submit, track, and manage prior auth requests
- **Provider Management** - NPI validation, network status, credentialing
- **Payer Directory** - Payer rules, EDI requirements, connectivity testing
- **Code Validation** - ICD-10, CPT, HCPCS, revenue code validation with CCI edits
- **Batch Processing** - Submit and monitor batch file processing
- **EDI Operations** - Parse/generate X12 transactions, 997/999 acknowledgments
- **Real-Time Transactions** - Synchronous eligibility, claim status, cost estimates
- **CareAdvance RCM** - Work queues, task management, productivity tracking
- **Reports & Analytics** - A/R reports, denial analytics, clean claim rates
- **SFTP Integration** - File upload/download for batch processing
- **Webhook Support** - Event-driven notifications for claims, payments, authorizations

## Installation

### Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter `n8n-nodes-trizetto`
5. Click **Install**

### Manual Installation

```bash
# Navigate to your n8n installation
cd ~/.n8n

# Install the package
npm install n8n-nodes-trizetto

# Restart n8n
```

### Development Installation

```bash
# Clone or extract the repository
git clone https://github.com/Velocity-BPA/n8n-nodes-trizetto.git
cd n8n-nodes-trizetto

# Install dependencies
npm install

# Build the project
npm run build

# Link to n8n custom nodes
mkdir -p ~/.n8n/custom
ln -s $(pwd) ~/.n8n/custom/n8n-nodes-trizetto

# Restart n8n
n8n start
```

## Credentials Setup

### TriZetto API Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Environment | Production, Test/Staging, or Custom | Yes |
| Username | TriZetto API username | Yes |
| Password | TriZetto API password | Yes |
| Client ID | OAuth client ID | Yes |
| Client Secret | OAuth client secret | Yes |
| Submitter ID | EDI submitter identifier | Yes |
| Site ID | Site identifier (multi-site setups) | No |
| Vendor ID | Vendor identifier | No |

### TriZetto Gateway Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Gateway URL | TriZetto Gateway endpoint | Yes |
| Certificate | mTLS client certificate (PEM) | Yes |
| Private Key | mTLS private key (PEM) | Yes |
| Partner ID | Trading partner identifier | Yes |

### TriZetto SFTP Credentials

| Field | Description | Required |
|-------|-------------|----------|
| Host | SFTP server hostname | Yes |
| Port | SFTP port (default: 22) | Yes |
| Username | SFTP username | Yes |
| Authentication | Password or SSH Key | Yes |
| Directory Path | Base directory path | No |

## Resources & Operations

### 1. Eligibility (270/271)
- **Check Eligibility** - Real-time eligibility verification
- **Batch Eligibility Check** - Submit multiple eligibility requests
- **Get Eligibility Response** - Retrieve eligibility response by ID
- **Get Benefits Summary** - Get summarized benefits information
- **Get Coverage Details** - Retrieve detailed coverage information
- **Get Deductible Info** - Get deductible amounts and status
- **Get Copay Info** - Retrieve copay information by service type
- **Get Coinsurance** - Get coinsurance percentages
- **Get Prior Auth Requirements** - Check if prior auth is required
- **Parse 271 Response** - Parse raw 271 EDI response
- **Get Eligibility History** - Retrieve eligibility check history

### 2. Claim Submission (837)
- **Submit Professional Claim (837P)** - Submit CMS-1500 claims
- **Submit Institutional Claim (837I)** - Submit UB-04 claims
- **Submit Dental Claim (837D)** - Submit ADA dental claims
- **Validate Claim** - Pre-submission claim validation
- **Get Claim Status** - Check submission status
- **Get Claim Acknowledgment** - Retrieve 997/999 acknowledgment
- **Batch Submit Claims** - Submit multiple claims
- **Get Submission History** - View submission history
- **Resubmit Claim** - Resubmit with corrections
- **Correct Claim** - Submit claim correction

### 3. Claim Status (276/277)
- **Check Claim Status** - Real-time status inquiry
- **Get Claim Status Response** - Retrieve status response
- **Get Detailed Status** - Get detailed claim status with events
- **Get Status by Claim ID** - Query by claim identifier
- **Get Status by Patient** - Query by patient information
- **Parse 277 Response** - Parse raw 277 EDI response
- **Get Status History** - View status inquiry history

### 4. Remittance (835)
- **Get Remittance Advice** - Retrieve ERA by ID
- **List Remittances** - List all remittance advices
- **Get ERA by Check Number** - Find ERA by check/EFT number
- **Get ERA by Date** - Find ERAs by date range
- **Parse 835 Response** - Parse raw 835 EDI file
- **Get Payment Details** - Extract payment details from ERA
- **Get Adjustment Codes** - Get CARC/RARC codes from ERA
- **Get Remark Codes** - Extract remark codes
- **Reconcile Payments** - Match payments to claims
- **Download ERA File** - Download raw 835 file

### 5. Prior Authorization
- **Submit Prior Auth Request** - Submit new authorization request
- **Check Prior Auth Status** - Check authorization status
- **Get Prior Auth Response** - Retrieve authorization response
- **Update Prior Auth** - Modify existing authorization
- **Cancel Prior Auth** - Cancel authorization request
- **Get Auth History** - View authorization history
- **Get Required Auth Info** - Get payer auth requirements

### 6. Attachment
- **Submit Attachment** - Submit claim attachment
- **Get Attachment Status** - Check attachment status
- **List Attachments** - List claim attachments
- **Link to Claim** - Associate attachment with claim
- **Get Attachment Types** - Get supported attachment types
- **Get PWK Codes** - Get PWK segment codes
- **Upload Document** - Upload attachment document

### 7. Provider
- **Get Provider Info** - Retrieve provider information
- **Search Providers** - Search provider directory
- **Validate NPI** - Validate NPI format and checksum
- **Get Provider by NPI** - Lookup provider by NPI
- **Get Provider Network Status** - Check network participation
- **Get Enrolled Providers** - List enrolled providers
- **Get Provider Credentials** - Get credentialing information

### 8. Payer
- **Get Payer List** - List all payers
- **Get Payer Info** - Get payer details
- **Get Payer by ID** - Lookup payer by ID
- **Get Payer Rules** - Get billing rules and requirements
- **Get Payer EDI Requirements** - Get EDI specifications
- **Get Trading Partner Info** - Get trading partner details
- **Check Payer Connectivity** - Test payer connection

### 9. Patient
- **Search Patients** - Search patient records
- **Get Patient Info** - Retrieve patient information
- **Get Patient by Member ID** - Lookup by member ID
- **Get Patient Demographics** - Get demographic data
- **Get Patient Coverage** - Get coverage information
- **Get Patient Claims** - List patient claims
- **Get Patient History** - View patient history

### 10. Facility
- **Get Facilities** - List facilities
- **Get Facility Info** - Get facility details
- **Validate Facility NPI** - Validate facility NPI
- **Get Facility Providers** - List providers at facility
- **Get Facility Payers** - List contracted payers

### 11. Code Validation
- **Validate ICD-10 Code** - Validate diagnosis code
- **Validate CPT Code** - Validate procedure code
- **Validate HCPCS Code** - Validate HCPCS code
- **Validate Revenue Code** - Validate revenue code
- **Get Code Description** - Get code description
- **Get Code Edits** - Get coding edits/rules
- **Check CCI Edits** - Check CCI bundling rules
- **Get LCD/NCD Info** - Get coverage determinations
- **Get Modifier Rules** - Get modifier requirements

### 12. Batch
- **Submit Batch File** - Submit batch for processing
- **Get Batch Status** - Check batch status
- **Get Batch Results** - Retrieve batch results
- **Get Batch Errors** - Get batch errors
- **Download Batch Response** - Download response file
- **List Batches** - List all batches
- **Cancel Batch** - Cancel pending batch

### 13. EDI
- **Submit EDI Transaction** - Submit X12 transaction
- **Get EDI Response** - Get transaction response
- **Get 997/999 Acknowledgment** - Retrieve functional ack
- **Get TA1 Acknowledgment** - Retrieve interchange ack
- **Parse EDI File** - Parse X12 file
- **Generate EDI File** - Generate X12 from data
- **Validate EDI Format** - Validate EDI structure
- **Get EDI History** - View EDI transaction history

### 14. Real-Time
- **Real-Time Eligibility** - Synchronous eligibility check
- **Real-Time Claim Status** - Synchronous status check
- **Real-Time Estimate** - Get patient cost estimate
- **Real-Time Prior Auth** - Synchronous auth check

### 15. CareAdvance (RCM)
- **Get Work Queue** - Retrieve work queue items
- **Get Tasks** - List assigned tasks
- **Complete Task** - Mark task complete
- **Reassign Task** - Reassign to another user
- **Get Task History** - View task history
- **Get Productivity Stats** - Get productivity metrics

### 16. Report
- **Generate Report** - Create new report
- **Get Report** - Retrieve report by ID
- **List Reports** - List available reports
- **Schedule Report** - Schedule recurring report
- **Get A/R Report** - Get accounts receivable report
- **Get Denial Report** - Get denial analysis report
- **Get Payment Report** - Get payment summary report
- **Export Report** - Export report to file

### 17. Analytics
- **Get Revenue Analytics** - Revenue performance metrics
- **Get Denial Analytics** - Denial trends and analysis
- **Get Clean Claim Rate** - Calculate clean claim rate
- **Get Days in A/R** - Calculate days in A/R
- **Get First Pass Rate** - First pass payment rate
- **Get Payer Performance** - Payer performance metrics

### 18. Clearinghouse
- **Get Clearinghouse Status** - Check clearinghouse status
- **Get Trading Partners** - List trading partners
- **Get Connection Status** - Check connection health
- **Test Connection** - Test payer connectivity
- **Get Enrollment Status** - Check enrollment status

### 19. Enrollment
- **Get Enrollment Status** - Check payer enrollment
- **Submit Enrollment** - Submit new enrollment
- **Get Enrolled Payers** - List enrolled payers
- **Update Enrollment** - Update enrollment info
- **Get Enrollment Requirements** - Get enrollment requirements

### 20. SFTP
- **Upload File** - Upload file to SFTP
- **Download File** - Download file from SFTP
- **List Files** - List directory contents
- **Get File Status** - Check file status
- **Delete File** - Delete file
- **Get Directory** - Get directory listing

### 21. Webhook
- **Create Webhook** - Register new webhook
- **Get Webhook** - Get webhook details
- **Update Webhook** - Update webhook configuration
- **Delete Webhook** - Remove webhook
- **List Webhooks** - List all webhooks
- **Verify Webhook** - Verify webhook signature

### 22. Utility
- **Validate NPI** - Validate NPI number
- **Validate Tax ID** - Validate Tax ID/EIN
- **Get Place of Service Codes** - List POS codes
- **Get Taxonomy Codes** - List taxonomy codes
- **Get Adjustment Reason Codes** - List CARC codes
- **Get Remark Codes** - List RARC codes
- **Test Connection** - Test API connectivity
- **Get API Status** - Get API health status

## Trigger Node

The TriZetto Trigger node monitors for real-time events:

### Eligibility Events
- Eligibility Response Received
- Eligibility Error
- Coverage Changed

### Claim Events
- Claim Acknowledged
- Claim Accepted
- Claim Rejected
- Claim Paid
- Claim Denied
- Claim Status Changed

### Remittance Events
- ERA Received
- Payment Posted
- Adjustment Applied
- Zero Pay Alert

### Prior Auth Events
- Authorization Approved
- Authorization Denied
- Authorization Pending
- Authorization Expiring

### Batch Events
- Batch Submitted
- Batch Completed
- Batch Error
- Acknowledgment Received

### EDI Events
- 997/999 Received
- TA1 Received
- EDI Error

### Task Events
- Task Assigned
- Task Due
- Task Completed

### Report Events
- Report Ready

## Usage Examples

### Eligibility Verification

```javascript
// Real-time eligibility check
{
  "resource": "eligibility",
  "operation": "checkEligibility",
  "payerId": "BCBS001",
  "memberId": "ABC123456789",
  "firstName": "John",
  "lastName": "Smith",
  "dateOfBirth": "1980-01-15",
  "serviceType": "30" // Health benefit plan coverage
}
```

### Claim Submission

```javascript
// Submit professional claim (837P)
{
  "resource": "claimSubmission",
  "operation": "submitProfessional",
  "payerId": "AETNA01",
  "patientInfo": {
    "memberId": "XYZ789012",
    "firstName": "Jane",
    "lastName": "Doe",
    "dateOfBirth": "1975-06-20"
  },
  "providerNpi": "1234567893",
  "diagnosisCodes": ["J06.9", "R05.9"],
  "serviceLines": [
    {
      "cptCode": "99213",
      "modifiers": ["25"],
      "chargeAmount": 150.00,
      "units": 1,
      "serviceDate": "2024-01-15",
      "placeOfService": "11"
    }
  ]
}
```

### Remittance Processing

```javascript
// Parse 835 ERA file
{
  "resource": "remittance",
  "operation": "parse835",
  "ediContent": "ISA*00*...(835 content)...IEA*1*000000001~"
}

// Get payment details
{
  "resource": "remittance",
  "operation": "getPaymentDetails",
  "remittanceId": "ERA20240115001"
}
```

### Prior Authorization

```javascript
// Submit prior auth request
{
  "resource": "priorAuth",
  "operation": "submit",
  "payerId": "UHC001",
  "memberId": "MEM123456",
  "providerNpi": "1234567893",
  "serviceType": "3", // Consultation
  "procedureCode": "27447",
  "diagnosis": ["M17.11"],
  "requestedUnits": 1,
  "clinicalInfo": "Patient requires knee replacement due to severe osteoarthritis"
}
```

### Code Validation

```javascript
// Validate ICD-10 code
{
  "resource": "codeValidation",
  "operation": "validateIcd10",
  "code": "M17.11"
}

// Check CCI edits
{
  "resource": "codeValidation",
  "operation": "checkCci",
  "primaryCode": "99213",
  "secondaryCode": "99214"
}
```

### Batch Processing

```javascript
// Submit batch file
{
  "resource": "batch",
  "operation": "submit",
  "fileType": "837P",
  "content": "(batch file content)"
}

// Check batch status
{
  "resource": "batch",
  "operation": "getStatus",
  "batchId": "BATCH20240115001"
}
```

## TriZetto Concepts

### Gateway
The TriZetto Gateway is the central hub for EDI transactions, routing claims and eligibility requests to appropriate payers.

### CareAdvance
Revenue Cycle Management (RCM) platform for work queue management, task assignment, and productivity tracking.

### Clearinghouse
EDI intermediary that validates, translates, and routes healthcare transactions between providers and payers.

### Trading Partner
A payer connection established through enrollment, defining EDI requirements and routing rules.

### X12 Transactions
- **270/271** - Eligibility Inquiry/Response
- **276/277** - Claim Status Inquiry/Response
- **837P/I/D** - Professional/Institutional/Dental Claims
- **835** - Electronic Remittance Advice (ERA)
- **997/999** - Functional Acknowledgment
- **TA1** - Interchange Acknowledgment

### CARC/RARC Codes
- **CARC** (Claim Adjustment Reason Code) - Explains payment adjustments
- **RARC** (Remittance Advice Remark Code) - Additional explanation

## Error Handling

The node provides detailed error information:

```javascript
{
  "error": {
    "code": "INVALID_NPI",
    "message": "NPI checksum validation failed",
    "details": {
      "npi": "1234567890",
      "expected_check_digit": "3",
      "actual_check_digit": "0"
    }
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_FAILED` | Authentication failed |
| `INVALID_NPI` | Invalid NPI format or checksum |
| `PAYER_NOT_FOUND` | Payer ID not found |
| `CLAIM_VALIDATION_ERROR` | Claim failed validation |
| `EDI_PARSE_ERROR` | EDI parsing error |
| `TIMEOUT` | Request timeout |
| `RATE_LIMIT` | Rate limit exceeded |

## Security Best Practices

1. **PHI Protection** - Never log or expose PHI in clear text
2. **Credential Security** - Use n8n's credential store
3. **TLS/mTLS** - All connections use TLS; Gateway uses mTLS
4. **Audit Logging** - All transactions are logged for HIPAA compliance
5. **Access Control** - Implement proper user access controls
6. **Data Minimization** - Only request necessary patient data

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Watch mode for development
npm run dev
```

## Author

**Velocity BPA**
- Website: [velobpa.com](https://velobpa.com)
- GitHub: [Velocity-BPA](https://github.com/Velocity-BPA)
- Email: licensing@velobpa.com

## Licensing

This n8n community node is licensed under the **Business Source License 1.1**.

### Free Use
Permitted for personal, educational, research, and internal business use.

### Commercial Use
Use of this node within any SaaS, PaaS, hosted platform, managed service, or paid automation offering requires a commercial license.

For licensing inquiries: **licensing@velobpa.com**

See [LICENSE](LICENSE), [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md), and [LICENSING_FAQ.md](LICENSING_FAQ.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **Documentation**: [TriZetto Developer Portal](https://developer.trizetto.com)
- **Issues**: [GitHub Issues](https://github.com/Velocity-BPA/n8n-nodes-trizetto/issues)
- **Community**: [n8n Community Forum](https://community.n8n.io)
- **Enterprise Support**: Contact licensing@velobpa.com

## Acknowledgments

- [n8n](https://n8n.io) - Workflow automation platform
- [TriZetto](https://www.trizetto.com) - Healthcare technology solutions
- [X12](https://x12.org) - EDI standards organization
