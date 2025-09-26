import { read, utils } from 'xlsx';

// Function to examine Excel structure
export const examineExcelStructure = async () => {
  try {
    // Fetch the Excel file
    const response = await fetch('/Dotazione mock.xlsx');
    const data = await response.arrayBuffer();
    
    // Read the Excel file
    const workbook = read(data);
    
    // Get data from first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json(sheet);
    
    // Log the first few rows to see column structure
    if (jsonData.length > 0) {
      // Add type assertion to fix TypeScript error
      const firstRowKeys = Object.keys(jsonData[0] as Record<string, unknown>);
      
      // Log first 3 rows with their values for each column
      for (let i = 0; i < Math.min(3, jsonData.length); i++) {
        const row = jsonData[i] as Record<string, unknown>;
        firstRowKeys.forEach(key => {
        });
      }
    }
    
    // Log overall stats
    
    return jsonData;
  } catch (error) {
  }
};

// Call when debugging is needed
// examineExcelStructure(); 