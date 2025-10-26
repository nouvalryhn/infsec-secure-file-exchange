const XLSX = require('xlsx');
const path = require('path');

/**
 * Creates a financial report Excel template with standard financial fields
 * and data validation rules
 */
function createFinancialReportTemplate() {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Define financial report data structure
  const financialData = [
    // Headers
    ['Field Name', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Annual Total', 'Notes'],
    
    // Revenue Section
    ['REVENUE', '', '', '', '', '', ''],
    ['Gross Sales Revenue', 0, 0, 0, 0, 0, 'Total sales before deductions'],
    ['Service Revenue', 0, 0, 0, 0, 0, 'Revenue from services provided'],
    ['Other Revenue', 0, 0, 0, 0, 0, 'Miscellaneous income'],
    ['Total Revenue', '=SUM(B3:B5)', '=SUM(C3:C5)', '=SUM(D3:D5)', '=SUM(E3:E5)', '=SUM(F3:F5)', 'Sum of all revenue streams'],
    
    ['', '', '', '', '', '', ''], // Empty row for spacing
    
    // Expenses Section
    ['EXPENSES', '', '', '', '', '', ''],
    ['Cost of Goods Sold', 0, 0, 0, 0, 0, 'Direct costs of production'],
    ['Salaries and Wages', 0, 0, 0, 0, 0, 'Employee compensation'],
    ['Rent and Utilities', 0, 0, 0, 0, 0, 'Facility and utility costs'],
    ['Marketing and Advertising', 0, 0, 0, 0, 0, 'Promotional expenses'],
    ['Office Supplies', 0, 0, 0, 0, 0, 'General office expenses'],
    ['Professional Services', 0, 0, 0, 0, 0, 'Legal, accounting, consulting'],
    ['Insurance', 0, 0, 0, 0, 0, 'Business insurance premiums'],
    ['Depreciation', 0, 0, 0, 0, 0, 'Asset depreciation'],
    ['Other Expenses', 0, 0, 0, 0, 0, 'Miscellaneous expenses'],
    ['Total Expenses', '=SUM(B9:B16)', '=SUM(C9:C16)', '=SUM(D9:D16)', '=SUM(E9:E16)', '=SUM(F9:F16)', 'Sum of all expenses'],
    
    ['', '', '', '', '', '', ''], // Empty row for spacing
    
    // Profit/Loss Section
    ['PROFIT/LOSS', '', '', '', '', '', ''],
    ['Gross Profit', '=B6-B17', '=C6-C17', '=D6-D17', '=E6-E17', '=F6-F17', 'Revenue minus expenses'],
    ['Tax Rate (%)', 25, 25, 25, 25, 25, 'Corporate tax rate percentage'],
    ['Taxes', '=B20*B21/100', '=C20*C21/100', '=D20*D21/100', '=E20*E21/100', '=F20*F21/100', 'Calculated tax amount'],
    ['Net Profit', '=B20-B22', '=C20-C22', '=D20-D22', '=E20-E22', '=F20-F22', 'Profit after taxes'],
    
    ['', '', '', '', '', '', ''], // Empty row for spacing
    
    // Key Metrics Section
    ['KEY METRICS', '', '', '', '', '', ''],
    ['Profit Margin (%)', '=IF(B6>0,B23/B6*100,0)', '=IF(C6>0,C23/C6*100,0)', '=IF(D6>0,D23/D6*100,0)', '=IF(E6>0,E23/E6*100,0)', '=IF(F6>0,F23/F6*100,0)', 'Net profit as % of revenue'],
    ['Revenue Growth (%)', 0, '=IF(B6>0,(C6-B6)/B6*100,0)', '=IF(C6>0,(D6-C6)/C6*100,0)', '=IF(D6>0,(E6-D6)/D6*100,0)', '=IF(E6>0,(F6-E6)/E6*100,0)', 'Quarter-over-quarter growth'],
    ['Expense Ratio (%)', '=IF(B6>0,B17/B6*100,0)', '=IF(C6>0,C17/C6*100,0)', '=IF(D6>0,D17/D6*100,0)', '=IF(E6>0,E17/E6*100,0)', '=IF(F6>0,F17/F6*100,0)', 'Expenses as % of revenue']
  ];

  // Create the main financial data worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(financialData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Field Name
    { wch: 12 }, // Q1 2024
    { wch: 12 }, // Q2 2024
    { wch: 12 }, // Q3 2024
    { wch: 12 }, // Q4 2024
    { wch: 15 }, // Annual Total
    { wch: 30 }  // Notes
  ];

  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');

  // Create instructions worksheet
  const instructionsData = [
    ['FINANCIAL REPORT TEMPLATE - INSTRUCTIONS'],
    [''],
    ['PURPOSE:'],
    ['This template is designed for the Secure File Exchange System to demonstrate'],
    ['encryption and performance comparison of financial data using AES, DES, and RC4 algorithms.'],
    [''],
    ['HOW TO USE:'],
    ['1. Fill in the quarterly financial data in columns B through E'],
    ['2. The Annual Total column (F) will automatically calculate sums'],
    ['3. Profit/Loss calculations are automated based on revenue and expenses'],
    ['4. Key metrics are calculated automatically'],
    ['5. Save the file and upload it to the Secure File Exchange System'],
    [''],
    ['DATA VALIDATION RULES:'],
    ['- Numerical fields accept positive and negative numbers'],
    ['- Percentage fields are calculated automatically'],
    ['- Formulas are protected to maintain data integrity'],
    [''],
    ['SECURITY FEATURES:'],
    ['- All data will be encrypted using AES-256-CBC, DES-CBC, and RC4'],
    ['- Each field is encrypted separately for granular access control'],
    ['- Performance metrics are collected for algorithm comparison'],
    [''],
    ['SAMPLE DATA:'],
    ['The template includes sample formulas and structure.'],
    ['Replace the zero values with your actual financial data.'],
    [''],
    ['SUPPORTED FILE FORMATS:'],
    ['- Excel (.xlsx) - Recommended'],
    ['- Excel 97-2003 (.xls) - Supported'],
    [''],
    ['CONFIDENTIALITY:'],
    ['This template is designed for confidential financial data.'],
    ['All uploaded data is encrypted and access-controlled.'],
    ['Only authorized users can decrypt and view the data.'],
    [''],
    ['For technical support, refer to the system documentation.']
  ];

  const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructionsData);
  
  // Set column width for instructions
  instructionsWorksheet['!cols'] = [{ wch: 80 }];

  // Add instructions worksheet
  XLSX.utils.book_append_sheet(workbook, instructionsWorksheet, 'Instructions');

  // Create data validation worksheet for reference
  const validationData = [
    ['DATA VALIDATION REFERENCE'],
    [''],
    ['Field Types and Validation Rules:'],
    [''],
    ['REVENUE FIELDS:'],
    ['- Must be non-negative numbers'],
    ['- Represents monetary values in company currency'],
    ['- Quarterly breakdown required'],
    [''],
    ['EXPENSE FIELDS:'],
    ['- Must be non-negative numbers'],
    ['- Represents monetary values in company currency'],
    ['- Categorized by expense type'],
    [''],
    ['CALCULATED FIELDS:'],
    ['- Automatically computed using formulas'],
    ['- Do not manually edit calculated fields'],
    ['- Formulas ensure data consistency'],
    [''],
    ['PERCENTAGE FIELDS:'],
    ['- Tax Rate: 0-100% range'],
    ['- Profit Margin: Calculated automatically'],
    ['- Growth Rate: Can be negative (decline)'],
    [''],
    ['NOTES FIELD:'],
    ['- Text descriptions and explanations'],
    ['- Optional but recommended for clarity'],
    ['- Maximum 255 characters per note']
  ];

  const validationWorksheet = XLSX.utils.aoa_to_sheet(validationData);
  validationWorksheet['!cols'] = [{ wch: 60 }];
  
  XLSX.utils.book_append_sheet(workbook, validationWorksheet, 'Validation Rules');

  return workbook;
}

// Create the template
const template = createFinancialReportTemplate();

// Save the template
const templatePath = path.join(__dirname, '..', 'public', 'templates', 'financial-report-template.xlsx');
XLSX.writeFile(template, templatePath);

console.log('Financial report template created successfully at:', templatePath);