/**
 * Utility for generating Excel/CSV template files for product uploads
 */

/**
 * Downloads the pre-made CSV template file
 */
export const downloadPreMadeTemplate = (): void => {
  try {
    // Extremely simple CSV with just the essential data
    const csvContent = `Nome Prodotto,Quantità
ALVITA GINOCCHIERA UNIVERSALE,2
BIODERMA ATODERM INTENSIVE BAUME 500ML,1
ZERODOL 20CPR 20MG,3
ENTEROGERMINA 2 MILIARDI/5ML 10FL,5`;

    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'prodotti_esempio.csv');
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
    // Simple, minimal structure that's likely to work in any CSV parser
    const sampleData = [
      {
        "Prodotto": "ALVITA GINOCCHIERA UNIVERSALE",
        "Quantità": "2"
      },
      {
        "Prodotto": "BIODERMA ATODERM INTENSIVE BAUME 500ML",
        "Quantità": "1"
      },
      {
        "Prodotto": "ZERODOL 20CPR 20MG",
        "Quantità": "3"
      },
      {
        "Prodotto": "ENTEROGERMINA 2 MILIARDI/5ML 10FL",
        "Quantità": "5"
      }
    ];

    // Convert to CSV
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(field => {
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
    link.setAttribute('download', 'prodotti_semplificato.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating template:', error);
  }
};

export default downloadPreMadeTemplate; 