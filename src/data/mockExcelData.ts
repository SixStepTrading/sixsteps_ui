import { read, utils } from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { Product, ProductPrice } from './mockProducts';

// Define the exact column names from the Excel file
const COLUMN_MINSAN = 'MINSAN';
const COLUMN_EAN = 'EAN';
const COLUMN_NOME_PRODOTTO = 'Nome Prodotto';
const COLUMN_DITTA = 'DITTA';
const COLUMN_PREZZO_PUBBLICO = 'Prezzo p IVA';
const COLUMN_IVA = 'IVA';

// Create a hardcoded set of mock products so we always have data as fallback
const createHardcodedProducts = (): Product[] => {
  const products: Product[] = [];
  const categories = ['Farmaci', 'Integratori', 'Cosmetici', 'Dispositivi medici'];
  const manufacturers = ['Pfizer', 'Bayer', 'Novartis', 'GlaxoSmithKline', 'Roche'];
  
  // Define fixed suppliers with different discount factors
  const suppliers = [
    { name: 'MedSupply', discountFactor: 0.85 },
    { name: 'PharmaWholesale', discountFactor: 0.80 },
    { name: 'HealthStock', discountFactor: 0.75 },
    { name: 'MediDelivery', discountFactor: 0.70 },
    { name: 'PharmaDirect', discountFactor: 0.65 }
  ];
  
  // Create some hardcoded products
  for (let i = 0; i < 20; i++) {
    const category = categories[i % categories.length];
    const manufacturer = manufacturers[i % manufacturers.length];
    const name = `Prodotto ${i+1} ${category} ${manufacturer}`;
    const code = `10${i.toString().padStart(6, '0')}`;
    const publicPrice = 10 + (i % 20);
    
    // Generate prices for each supplier
    const bestPrices: ProductPrice[] = suppliers.map(supplier => {
      const price = +(publicPrice * supplier.discountFactor).toFixed(2);
      const stock = Math.floor(Math.random() * 190) + 10;
      
      return {
        supplier: supplier.name,
        price,
        stock
      };
    });
    
    // Sort by price (lowest first)
    bestPrices.sort((a, b) => a.price - b.price);
    
    products.push({
      id: uuidv4(),
      ean: code,
      minsan: code,
      name,
      description: name,
      manufacturer,
      category: category,
      publicPrice,
      vat: 22,
      bestPrices,
      inStock: true
    });
  }
  
  return products;
};

// Initialize with fallback data
export let mockExcelProducts: Product[] = createHardcodedProducts();

// Load the Excel file
const loadExcelData = async (): Promise<void> => {
  try {
    const response = await fetch('/Dotazione mock.xlsx');
    const data = await response.arrayBuffer();
    
    const workbook = read(data);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = utils.sheet_to_json(sheet);
    
    if (jsonData.length === 0) {
      return;
    }
    
    // Log first row for debugging
    if (jsonData.length > 0) {
      const firstRow = jsonData[0] as Record<string, any>;
    }
    
    // Define suppliers for pricing
    const suppliers = [
      { name: 'MedSupply', discountFactor: 0.85 },
      { name: 'PharmaWholesale', discountFactor: 0.80 },
      { name: 'HealthStock', discountFactor: 0.75 },
      { name: 'MediDelivery', discountFactor: 0.70 },
      { name: 'PharmaDirect', discountFactor: 0.65 }
    ];
    
    // Process each row from Excel into a Product
    const excelProducts: Product[] = [];
    
    for (const row of jsonData) {
      const rowObj = row as Record<string, any>;
      
      // Skip rows without required data
      if (!rowObj) continue;
      
      // Extract data using the exact column names
      const minsan = String(rowObj[COLUMN_MINSAN] || '').trim();
      const ean = String(rowObj[COLUMN_EAN] || '').trim();
      const name = String(rowObj[COLUMN_NOME_PRODOTTO] || '').trim();
      const manufacturer = String(rowObj[COLUMN_DITTA] || 'Unknown').trim();
      
      // Skip if no product name
      if (!name) continue;
      
      // For code, use MINSAN or EAN, whichever is available
      const code = minsan || ean || '';
      if (!code) continue;
      
      // Parse price - handle possible formatting issues
      let publicPrice = 10; // Default if parsing fails
      if (rowObj[COLUMN_PREZZO_PUBBLICO] !== undefined) {
        const priceStr = String(rowObj[COLUMN_PREZZO_PUBBLICO]).replace(',', '.');
        const parsedPrice = parseFloat(priceStr);
        if (!isNaN(parsedPrice)) {
          publicPrice = parsedPrice;
        }
      }
      
      // Parse VAT rate
      let vat = 22; // Default VAT rate
      if (rowObj[COLUMN_IVA] !== undefined) {
        const vatStr = String(rowObj[COLUMN_IVA]).replace('%', '').trim();
        const parsedVat = parseInt(vatStr, 10);
        if (!isNaN(parsedVat)) {
          vat = parsedVat;
        }
      }
      
      // Generate supplier prices
      const bestPrices: ProductPrice[] = suppliers.map(supplier => {
        // Supplier price is a discount from public price
        const price = +(publicPrice * supplier.discountFactor).toFixed(2);
        // Random stock
        const stock = Math.floor(Math.random() * 190) + 10;
        
        return {
          supplier: supplier.name,
          price,
          stock
        };
      });
      
      // Sort by price
      bestPrices.sort((a, b) => a.price - b.price);
      
      // Create the product
      excelProducts.push({
        id: uuidv4(),
        ean,
        minsan,
        name,
        description: name,
        manufacturer,
        category: 'Farmaci', // Default category if not available
        publicPrice,
        vat,
        bestPrices,
        inStock: true
      });
    }
    
    
    // Update our exported products
    if (excelProducts.length > 0) {
      mockExcelProducts = excelProducts;
    }
  } catch (error) {
  }
};

// Load Excel data immediately
loadExcelData(); 