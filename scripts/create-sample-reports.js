const XLSX = require('xlsx');
const path = require('path');

/**
 * Generates sample financial data for testing
 */
function generateSampleData(companyName, scale = 1) {
  const baseRevenue = 1000000 * scale; // Base revenue scaled by factor
  const quarters = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
  
  // Generate realistic quarterly variations
  const revenueVariations = [0.8, 1.1, 1.2, 0.9]; // Seasonal variations
  const expenseRatio = 0.7; // Expenses as 70% of revenue
  
  const data = [
    // Headers
    ['Field Name', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Annual Total', 'Notes'],
    
    // Company Info
    ['COMPANY INFORMATION', '', '', '', '', '', ''],
    ['Company Name', companyName, '', '', '', '', 'Sample company for testing'],
    ['Report Period', '2024', '', '', '', '', 'Annual financial report'],
    ['Currency', 'USD', '', '', '', '', 'All amounts in US Dollars'],
    ['', '', '', '', '', '', ''],
    
    // Revenue Section
    ['REVENUE', '', '', '', '', '', ''],
  ];

  // Generate revenue data
  const revenueData = [
    ['Gross Sales Revenue', 'Service Revenue', 'Other Revenue'],
    [0.6, 0.3, 0.1] // Revenue distribution
  ];

  revenueData[0].forEach((revenueType, index) => {
    const row = [revenueType];
    let annualTotal = 0;
    
    quarters.forEach((quarter, qIndex) => {
      const amount = Math.round(baseRevenue * revenueData[1][index] * revenueVariations[qIndex]);
      row.push(amount);
      annualTotal += amount;
    });
    
    row.push(annualTotal);
    row.push(`${revenueType.toLowerCase()} for ${companyName}`);
    data.push(row);
  });

  // Total Revenue row
  const totalRevenueRow = ['Total Revenue'];
  let totalAnnual = 0;
  quarters.forEach((quarter, qIndex) => {
    const quarterTotal = Math.round(baseRevenue * revenueVariations[qIndex]);
    totalRevenueRow.push(quarterTotal);
    totalAnnual += quarterTotal;
  });
  totalRevenueRow.push(totalAnnual);
  totalRevenueRow.push('Sum of all revenue streams');
  data.push(totalRevenueRow);

  data.push(['', '', '', '', '', '', '']); // Empty row

  // Expenses Section
  data.push(['EXPENSES', '', '', '', '', '', '']);

  const expenseTypes = [
    ['Cost of Goods Sold', 0.35],
    ['Salaries and Wages', 0.25],
    ['Rent and Utilities', 0.08],
    ['Marketing and Advertising', 0.05],
    ['Office Supplies', 0.02],
    ['Professional Services', 0.03],
    ['Insurance', 0.02],
    ['Depreciation', 0.04],
    ['Other Expenses', 0.03]
  ];

  let totalExpensesByQuarter = [0, 0, 0, 0];

  expenseTypes.forEach(([expenseType, ratio]) => {
    const row = [expenseType];
    let annualTotal = 0;
    
    quarters.forEach((quarter, qIndex) => {
      const amount = Math.round(baseRevenue * ratio * revenueVariations[qIndex] * expenseRatio);
      row.push(amount);
      annualTotal += amount;
      totalExpensesByQuarter[qIndex] += amount;
    });
    
    row.push(annualTotal);
    row.push(`${expenseType} expenses`);
    data.push(row);
  });

  // Total Expenses row
  const totalExpensesRow = ['Total Expenses'];
  let totalExpensesAnnual = 0;
  totalExpensesByQuarter.forEach(quarterExpense => {
    totalExpensesRow.push(quarterExpense);
    totalExpensesAnnual += quarterExpense;
  });
  totalExpensesRow.push(totalExpensesAnnual);
  totalExpensesRow.push('Sum of all expenses');
  data.push(totalExpensesRow);

  data.push(['', '', '', '', '', '', '']); // Empty row

  // Profit/Loss Section
  data.push(['PROFIT/LOSS', '', '', '', '', '', '']);

  // Gross Profit
  const grossProfitRow = ['Gross Profit'];
  let grossProfitAnnual = 0;
  quarters.forEach((quarter, qIndex) => {
    const revenue = Math.round(baseRevenue * revenueVariations[qIndex]);
    const expenses = totalExpensesByQuarter[qIndex];
    const profit = revenue - expenses;
    grossProfitRow.push(profit);
    grossProfitAnnual += profit;
  });
  grossProfitRow.push(grossProfitAnnual);
  grossProfitRow.push('Revenue minus expenses');
  data.push(grossProfitRow);

  // Tax calculations
  const taxRate = 25;
  data.push(['Tax Rate (%)', taxRate, taxRate, taxRate, taxRate, taxRate, 'Corporate tax rate percentage']);

  const taxesRow = ['Taxes'];
  let taxesAnnual = 0;
  quarters.forEach((quarter, qIndex) => {
    const revenue = Math.round(baseRevenue * revenueVariations[qIndex]);
    const expenses = totalExpensesByQuarter[qIndex];
    const grossProfit = revenue - expenses;
    const taxes = Math.round(grossProfit * taxRate / 100);
    taxesRow.push(taxes);
    taxesAnnual += taxes;
  });
  taxesRow.push(taxesAnnual);
  taxesRow.push('Calculated tax amount');
  data.push(taxesRow);

  // Net Profit
  const netProfitRow = ['Net Profit'];
  let netProfitAnnual = 0;
  quarters.forEach((quarter, qIndex) => {
    const revenue = Math.round(baseRevenue * revenueVariations[qIndex]);
    const expenses = totalExpensesByQuarter[qIndex];
    const grossProfit = revenue - expenses;
    const taxes = Math.round(grossProfit * taxRate / 100);
    const netProfit = grossProfit - taxes;
    netProfitRow.push(netProfit);
    netProfitAnnual += netProfit;
  });
  netProfitRow.push(netProfitAnnual);
  netProfitRow.push('Profit after taxes');
  data.push(netProfitRow);

  data.push(['', '', '', '', '', '', '']); // Empty row

  // Key Metrics Section
  data.push(['KEY METRICS', '', '', '', '', '', '']);

  // Profit Margin
  const profitMarginRow = ['Profit Margin (%)'];
  quarters.forEach((quarter, qIndex) => {
    const revenue = Math.round(baseRevenue * revenueVariations[qIndex]);
    const expenses = totalExpensesByQuarter[qIndex];
    const grossProfit = revenue - expenses;
    const taxes = Math.round(grossProfit * taxRate / 100);
    const netProfit = grossProfit - taxes;
    const margin = revenue > 0 ? Math.round((netProfit / revenue) * 100 * 100) / 100 : 0;
    profitMarginRow.push(margin);
  });
  const annualRevenue = totalAnnual;
  const annualMargin = annualRevenue > 0 ? Math.round((netProfitAnnual / annualRevenue) * 100 * 100) / 100 : 0;
  profitMarginRow.push(annualMargin);
  profitMarginRow.push('Net profit as % of revenue');
  data.push(profitMarginRow);

  // Revenue Growth
  const revenueGrowthRow = ['Revenue Growth (%)'];
  revenueGrowthRow.push(0); // Q1 baseline
  quarters.slice(1).forEach((quarter, qIndex) => {
    const currentRevenue = Math.round(baseRevenue * revenueVariations[qIndex + 1]);
    const previousRevenue = Math.round(baseRevenue * revenueVariations[qIndex]);
    const growth = previousRevenue > 0 ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100 * 100) / 100 : 0;
    revenueGrowthRow.push(growth);
  });
  revenueGrowthRow.push('N/A'); // Annual growth calculation would need previous year
  revenueGrowthRow.push('Quarter-over-quarter growth');
  data.push(revenueGrowthRow);

  // Expense Ratio
  const expenseRatioRow = ['Expense Ratio (%)'];
  quarters.forEach((quarter, qIndex) => {
    const revenue = Math.round(baseRevenue * revenueVariations[qIndex]);
    const expenses = totalExpensesByQuarter[qIndex];
    const ratio = revenue > 0 ? Math.round((expenses / revenue) * 100 * 100) / 100 : 0;
    expenseRatioRow.push(ratio);
  });
  const annualExpenseRatio = annualRevenue > 0 ? Math.round((totalExpensesAnnual / annualRevenue) * 100 * 100) / 100 : 0;
  expenseRatioRow.push(annualExpenseRatio);
  expenseRatioRow.push('Expenses as % of revenue');
  data.push(expenseRatioRow);

  return data;
}

/**
 * Creates sample financial reports with different data sizes
 */
function createSampleReports() {
  const samples = [
    {
      name: 'TechStart Inc - Small Dataset',
      filename: 'sample-report-small.xlsx',
      company: 'TechStart Inc',
      scale: 0.5, // Smaller company
      description: 'Small dataset for basic performance testing'
    },
    {
      name: 'MidCorp Solutions - Medium Dataset',
      filename: 'sample-report-medium.xlsx',
      company: 'MidCorp Solutions',
      scale: 1.0, // Medium company
      description: 'Medium dataset for standard performance testing'
    },
    {
      name: 'GlobalTech Enterprise - Large Dataset',
      filename: 'sample-report-large.xlsx',
      company: 'GlobalTech Enterprise',
      scale: 2.5, // Large company
      description: 'Large dataset for performance stress testing'
    },
    {
      name: 'MegaCorp International - Extra Large Dataset',
      filename: 'sample-report-xlarge.xlsx',
      company: 'MegaCorp International',
      scale: 5.0, // Very large company
      description: 'Extra large dataset for maximum performance testing'
    },
    {
      name: 'StartupCo - Minimal Dataset',
      filename: 'sample-report-minimal.xlsx',
      company: 'StartupCo',
      scale: 0.1, // Very small startup
      description: 'Minimal dataset for encryption algorithm comparison'
    }
  ];

  samples.forEach(sample => {
    console.log(`Creating ${sample.name}...`);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Generate sample data
    const financialData = generateSampleData(sample.company, sample.scale);
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(financialData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Field Name
      { wch: 12 }, // Q1 2024
      { wch: 12 }, // Q2 2024
      { wch: 12 }, // Q3 2024
      { wch: 12 }, // Q4 2024
      { wch: 15 }, // Annual Total
      { wch: 35 }  // Notes
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Financial Report');

    // Add metadata sheet
    const metadataData = [
      ['SAMPLE REPORT METADATA'],
      [''],
      ['Report Name:', sample.name],
      ['Company:', sample.company],
      ['Dataset Size:', sample.scale === 0.1 ? 'Minimal' : sample.scale === 0.5 ? 'Small' : sample.scale === 1.0 ? 'Medium' : sample.scale === 2.5 ? 'Large' : 'Extra Large'],
      ['Scale Factor:', sample.scale],
      ['Description:', sample.description],
      [''],
      ['PURPOSE:'],
      ['This sample report is designed for testing the Secure File Exchange System.'],
      ['It demonstrates encryption performance with different data sizes.'],
      [''],
      ['TESTING SCENARIOS:'],
      ['- Upload and encryption performance'],
      ['- Multi-algorithm comparison (AES, DES, RC4)'],
      ['- File sharing and access control'],
      ['- Financial data extraction and encryption'],
      [''],
      ['DATA CHARACTERISTICS:'],
      ['- Realistic financial data structure'],
      ['- Quarterly breakdown with calculations'],
      ['- Various data types (numbers, text, formulas)'],
      ['- Scalable dataset size for performance testing'],
      [''],
      ['ENCRYPTION TESTING:'],
      ['Each field will be encrypted separately with:'],
      ['- AES-256-CBC encryption'],
      ['- DES-CBC encryption'],
      ['- RC4 stream cipher'],
      ['Performance metrics will be collected for comparison.']
    ];

    const metadataWorksheet = XLSX.utils.aoa_to_sheet(metadataData);
    metadataWorksheet['!cols'] = [{ wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'Metadata');

    // Save the sample report
    const samplePath = path.join(__dirname, '..', 'public', 'templates', sample.filename);
    XLSX.writeFile(workbook, samplePath);
    
    console.log(`✓ Created ${sample.filename}`);
  });
}

// Create sample images for profile/logo testing
function createSampleImageInfo() {
  const imageInfo = [
    {
      name: 'company-logo-small.png',
      description: 'Small company logo (simulated)',
      size: 'Small (< 50KB)',
      purpose: 'Testing image encryption with minimal data'
    },
    {
      name: 'company-logo-medium.jpg',
      description: 'Medium company logo (simulated)',
      size: 'Medium (100-500KB)',
      purpose: 'Testing image encryption with moderate data'
    },
    {
      name: 'company-logo-large.png',
      description: 'Large company logo (simulated)',
      size: 'Large (> 1MB)',
      purpose: 'Testing image encryption with substantial data'
    }
  ];

  // Create a README file for image samples
  const readmeContent = [
    ['IMAGE SAMPLES FOR TESTING'],
    [''],
    ['The following image files should be created for comprehensive testing:'],
    [''],
    ...imageInfo.map(img => [
      `${img.name}:`,
      `  Description: ${img.description}`,
      `  Size: ${img.size}`,
      `  Purpose: ${img.purpose}`,
      ''
    ]).flat().map(line => [line])
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(readmeContent);
  worksheet['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Image Samples Info');

  const readmePath = path.join(__dirname, '..', 'public', 'templates', 'image-samples-info.xlsx');
  XLSX.writeFile(workbook, readmePath);

  console.log('✓ Created image samples information file');
  console.log('Note: Actual image files should be added manually for complete testing');
}

// Execute the sample creation
console.log('Creating sample financial reports...');
createSampleReports();
createSampleImageInfo();
console.log('\nAll sample reports created successfully!');
console.log('Files created in: public/templates/');
console.log('\nSample reports available:');
console.log('- sample-report-minimal.xlsx (Minimal dataset)');
console.log('- sample-report-small.xlsx (Small dataset)');
console.log('- sample-report-medium.xlsx (Medium dataset)');
console.log('- sample-report-large.xlsx (Large dataset)');
console.log('- sample-report-xlarge.xlsx (Extra large dataset)');
console.log('- financial-report-template.xlsx (Empty template)');
console.log('- image-samples-info.xlsx (Image testing guide)');