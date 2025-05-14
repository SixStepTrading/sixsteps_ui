/**
 * Utility for generating Excel/CSV template files for product uploads
 */

/**
 * Downloads the pre-made CSV template file
 */
export const downloadPreMadeTemplate = (): void => {
  try {
    // Create a link to the static template file
    const link = document.createElement('a');
    link.href = `${process.env.PUBLIC_URL}/product_upload_template.csv`;
    link.setAttribute('download', 'product_upload_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading template:', error);
  }
};

/**
 * Generates a dynamic CSV template file
 */
export const generateExcelTemplate = (): void => {
  try {
    // Create a sample data structure
    const sampleData = [
      {
        "EAN": "8017858001247",
        "MINSAN": "034034017",
        "Product Name": "Aspirina 500mg",
        "Quantity": "10",
        "Target Price": "5.25"
      },
      {
        "EAN": "8015463204259",
        "MINSAN": "058364010",
        "Product Name": "Tachipirina 1000mg",
        "Quantity": "5",
        "Target Price": "4.75"
      }
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(field => {
        // Escape double quotes and wrap field in quotes if it contains commas or quotes
        const value = row[field as keyof typeof row];
        const strValue = String(value).replace(/"/g, '""');
        return `"${strValue}"`;
      }).join(','))
    ].join('\n');

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_upload_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating template:', error);
  }
};

export default downloadPreMadeTemplate; 