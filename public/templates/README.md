# Secure File Exchange System - Templates and Sample Data

This directory contains Excel templates and sample data files designed for testing and demonstrating the Secure File Exchange System's encryption capabilities.

## 📋 Excel Templates

### financial-report-template.xlsx
**Purpose**: Empty template for creating new financial reports
**Features**:
- Standard financial fields (revenue, expenses, profit/loss)
- Quarterly breakdown structure
- Automated calculations and formulas
- Data validation rules
- Instructions and validation reference sheets
- Designed for confidential financial data encryption

**Usage**:
1. Download the template
2. Fill in your financial data
3. Upload to the Secure File Exchange System
4. System will encrypt each field separately with AES, DES, and RC4

## 📊 Sample Financial Reports

### sample-report-minimal.xlsx
- **Company**: StartupCo
- **Dataset Size**: Minimal (Scale: 0.1x)
- **Purpose**: Basic encryption testing with minimal data
- **Use Case**: Quick algorithm comparison tests

### sample-report-small.xlsx
- **Company**: TechStart Inc
- **Dataset Size**: Small (Scale: 0.5x)
- **Purpose**: Small dataset performance testing
- **Use Case**: Standard encryption performance baseline

### sample-report-medium.xlsx
- **Company**: MidCorp Solutions
- **Dataset Size**: Medium (Scale: 1.0x)
- **Purpose**: Standard performance testing
- **Use Case**: Typical business financial report size

### sample-report-large.xlsx
- **Company**: GlobalTech Enterprise
- **Dataset Size**: Large (Scale: 2.5x)
- **Purpose**: Large dataset performance testing
- **Use Case**: Enterprise-level financial data encryption

### sample-report-xlarge.xlsx
- **Company**: MegaCorp International
- **Dataset Size**: Extra Large (Scale: 5.0x)
- **Purpose**: Maximum performance stress testing
- **Use Case**: Performance limits and algorithm comparison

## 🖼️ Sample Images

### company-logo-small.png
- **Size**: ~30KB
- **Purpose**: Small image encryption testing
- **Use Case**: Profile pictures, small logos

### company-logo-medium.jpg
- **Size**: ~250KB
- **Purpose**: Medium image encryption testing
- **Use Case**: Company logos, standard images

### company-logo-large.png
- **Size**: ~1.2MB
- **Purpose**: Large image encryption testing
- **Use Case**: High-resolution images, performance testing

## 🔒 Encryption Testing Scenarios

### Performance Comparison
Each file will be encrypted with three algorithms:
1. **AES-256-CBC**: Industry standard, high security
2. **DES-CBC**: Legacy algorithm for comparison
3. **RC4**: Stream cipher for performance analysis

### Metrics Collected
- **Encryption Time**: Time to encrypt data (milliseconds)
- **Decryption Time**: Time to decrypt data (milliseconds)
- **Ciphertext Size**: Size of encrypted data (bytes)
- **Algorithm Efficiency**: Performance comparison across algorithms

### Data Types Tested
- **Numerical Data**: Financial figures and calculations
- **Spreadsheet Files**: Complete Excel workbooks
- **Image Files**: Various image formats and sizes

## 🧪 Testing Procedures

### 1. Upload Testing
1. Upload each sample file through the web interface
2. Monitor upload and encryption performance
3. Verify all three algorithms encrypt successfully
4. Check encryption metrics are recorded

### 2. Performance Analysis
1. Compare encryption times across algorithms
2. Analyze ciphertext size differences
3. Test decryption performance
4. Generate performance comparison reports

### 3. Access Control Testing
1. Share files with other users
2. Verify access permissions work correctly
3. Test file sharing and revocation
4. Validate unauthorized access prevention

### 4. Data Integrity Testing
1. Upload and encrypt files
2. Download and decrypt files
3. Verify decrypted data matches original
4. Test with different algorithms

## 📁 File Organization

```
templates/
├── README.md                          # This file
├── financial-report-template.xlsx     # Empty template
├── sample-report-minimal.xlsx         # Minimal test data
├── sample-report-small.xlsx          # Small test data
├── sample-report-medium.xlsx         # Medium test data
├── sample-report-large.xlsx          # Large test data
├── sample-report-xlarge.xlsx         # Extra large test data
├── company-logo-small.png            # Small image sample
├── company-logo-medium.jpg           # Medium image sample
├── company-logo-large.png            # Large image sample
├── image-samples-info.xlsx           # Image testing guide
└── SAMPLE_IMAGES_README.md           # Image-specific documentation
```

## 🚀 Getting Started

### For New Users
1. Start with `financial-report-template.xlsx`
2. Fill in your financial data
3. Upload and test encryption

### For Performance Testing
1. Use sample reports in order of size (minimal → xlarge)
2. Monitor encryption performance metrics
3. Compare algorithm efficiency
4. Test with different data types

### For Development Testing
1. Use all sample files for comprehensive testing
2. Test file sharing functionality
3. Verify access control mechanisms
4. Validate encryption/decryption accuracy

## 🔧 Technical Requirements

### Supported File Types
- **Excel Files**: .xlsx, .xls
- **Image Files**: .png, .jpg, .jpeg, .gif, .webp

### File Size Limits
- Maximum upload size: 10MB
- Recommended for testing: Various sizes from 30KB to 1.2MB

### System Requirements
- Next.js application with file upload capability
- MySQL database for metadata storage
- File system storage for encrypted files
- Support for AES, DES, and RC4 encryption algorithms

## 📈 Expected Performance Characteristics

### AES-256-CBC
- **Security**: Highest (industry standard)
- **Speed**: Fast
- **Ciphertext Size**: Moderate (due to padding)

### DES-CBC
- **Security**: Low (legacy, 56-bit key)
- **Speed**: Moderate
- **Ciphertext Size**: Moderate (due to padding)

### RC4
- **Security**: Moderate (stream cipher)
- **Speed**: Fastest
- **Ciphertext Size**: Smallest (no padding)

## 🛡️ Security Considerations

- All sample data is synthetic and safe for testing
- No real financial information is included
- Files are designed specifically for encryption testing
- Production systems should use real data with appropriate security measures

## 📞 Support

For questions about using these templates and samples:
1. Refer to the system documentation
2. Check the Instructions sheet in Excel templates
3. Review the validation rules and metadata sheets
4. Test with minimal samples before using larger datasets

---

**Note**: These templates and samples are designed specifically for the Secure File Exchange System's encryption testing and demonstration purposes.