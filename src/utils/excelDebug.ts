import { read, utils } from 'xlsx';

// Function to examine Excel structure
export const examineExcelStructure = async () => {
  try {
    // Fetch the Excel file
    const response = await fetch('/Dotazione mock.xlsx');
    const data = await response.arrayBuffer();
    
    // Read the Excel file
    const workbook = read(data);
    console.log('Sheet Names:', workbook.SheetNames);
    
    // Get data from first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json(sheet);
    
    // Log the first few rows to see column structure
    if (jsonData.length > 0) {
      console.log('First row raw data:', JSON.stringify(jsonData[0], null, 2));
      // Add type assertion to fix TypeScript error
      const firstRowKeys = Object.keys(jsonData[0] as Record<string, unknown>);
      console.log('Column names:', firstRowKeys);
      
      // Log first 3 rows with their values for each column
      console.log('Sample data (first 3 rows):');
      for (let i = 0; i < Math.min(3, jsonData.length); i++) {
        const row = jsonData[i] as Record<string, unknown>;
        console.log(`Row ${i+1}:`);
        firstRowKeys.forEach(key => {
          console.log(`  ${key}: ${row[key]}`);
        });
      }
    }
    
    // Log overall stats
    console.log('Total rows:', jsonData.length);
    
    return jsonData;
  } catch (error) {
    console.error('Error examining Excel structure:', error);
  }
};

// Call when debugging is needed
// examineExcelStructure(); 