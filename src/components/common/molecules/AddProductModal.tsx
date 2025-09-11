/// <reference path="../../../types/xlsx.d.ts" />
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  Typography,
  Box,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon,
  FileCopy as FileCopyIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { uploadProductsCSV, ColumnMapping } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks/useUploadProgress';
import UploadProgressBar from '../../common/atoms/UploadProgressBar';

export interface ProductFormData {
  // Core API fields (what the backend expects)
  sku: string;
  name: string;
  ean: string;
  producer: string;
  description: string;
  category: string;
  price: number;
  vat: number;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onAddProduct: (productData: ProductFormData) => void;
  onAddMultipleProducts?: (productsData: ProductFormData[]) => void;
}

// Interface for file preview data
interface FilePreviewData {
  headers: string[];
  rows: string[][];
  rawData: any[];
}

// Type for mapping headers to product fields
type ProductField = keyof ProductFormData;

const AddProductModal: React.FC<AddProductModalProps> = ({
  open,
  onClose,
  onAddProduct,
  onAddMultipleProducts
}) => {
  const initialFormData: ProductFormData = {
    sku: '',
    name: '',
    ean: '',
    producer: '',
    description: '',
    category: '',
    price: 0,
    vat: 10
  };

  // State variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<Record<string, ProductField | ''>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedProducts, setProcessedProducts] = useState<ProductFormData[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  
  // Stepper configuration
  const steps = ['Upload Files', 'Map Columns', 'Preview & Import'];
  
  // Step navigation handlers
  const handleNext = () => {
    if (activeStep === 0 && selectedFile) {
      setActiveStep(1);
    } else if (activeStep === 1 && Object.keys(mappedFields).length > 0) {
      setActiveStep(2);
    }
  };
  
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  const canProceed = () => {
    if (activeStep === 0) return selectedFile !== null;
    if (activeStep === 1) return Object.keys(mappedFields).filter(key => mappedFields[key]).length > 0;
    return true;
  };
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload progress tracking for bulk import (optional)
  const uploadProgress = useUploadProgress({
    onComplete: (result) => {
      console.log('📊 Bulk import completed via progress tracking:', result);
      setIsProcessing(false);
      
      // Reset form and close
      handleCancel();
    },
    onError: (error) => {
      console.error('📊 Bulk import progress error:', error);
      setIsProcessing(false);
      setFileError(error.message);
    }
  });

  // File upload handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Take only the first file
      const file = files[0];
      setSelectedFile(file);
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Take only the first file
      const file = files[0];
      setSelectedFile(file);
      handleFileSelect(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (file: File) => {
    // Check if file type is accepted
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setFileError('Invalid file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.');
      return;
    }
    
    setFileError(null);
    
    try {
      const preview = await readFilePreview(file);
      setFilePreview(preview);
      
      // Auto-map columns based on column names - Updated for separate SKU/EAN
      const newMapping: Record<string, ProductField | ''> = {};
      preview.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader === 'sku' || lowerHeader.includes('minsan') || lowerHeader.includes('code') || lowerHeader.includes('codice')) {
          newMapping[header] = 'sku';
        } else if (lowerHeader === 'ean') {
          newMapping[header] = 'ean';
        } else if (lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader.includes('descrizione')) {
          newMapping[header] = 'name';
        } else if (lowerHeader.includes('producer') || lowerHeader.includes('manufacturer') || lowerHeader.includes('brand') || lowerHeader.includes('ditta')) {
          newMapping[header] = 'producer';
        } else if (lowerHeader.includes('description') || lowerHeader.includes('desc')) {
          newMapping[header] = 'description';
        } else if (lowerHeader.includes('category') || lowerHeader.includes('categoria')) {
          newMapping[header] = 'category';
        } else if (lowerHeader.includes('price') || lowerHeader.includes('prezzo')) {
          newMapping[header] = 'price';
        } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva')) {
          newMapping[header] = 'vat';
        }
      });
      
      setMappedFields(newMapping);
      
      // Auto-advance to next step if we have a file
      if (selectedFile && activeStep === 0) {
        setActiveStep(1);
      }
      
    } catch (error) {
      console.error('Error reading file:', error);
      setFileError('Error reading file. Please check the file format.');
    }
  };

  const readFilePreview = (file: File): Promise<FilePreviewData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No data found in file'));
            return;
          }
          
          let parsedData: any[] = [];
          let headers: string[] = [];
          let rows: string[][] = [];
          
          // Handle Excel file
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
            
            // Extract headers
            if (parsedData.length > 0) {
              headers = Object.keys(parsedData[0]);
              
              // Extract preview rows (up to 5)
              rows = parsedData.slice(0, 5).map(row => 
                headers.map(header => String(row[header] || ''))
              );
            }
          } 
          // Handle CSV file
          else if (file.name.endsWith('.csv')) {
            const csvData = data.toString();
            
            try {
              const workbook = XLSX.read(csvData, { type: 'string' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              parsedData = XLSX.utils.sheet_to_json(worksheet);
              
              // Extract headers
              if (parsedData.length > 0) {
                headers = Object.keys(parsedData[0]);
                
                // Extract preview rows (up to 5)
                rows = parsedData.slice(0, 5).map(row => 
                  headers.map(header => String(row[header] || ''))
                );
              }
            } catch(xlsxError) {
              console.error("XLSX parsing failed:", xlsxError);
              
              // Fallback to manual CSV parsing
              try {
                const lines = csvData.split('\n');
                headers = lines[0].split(',').map(h => h.trim());
                
                // Extract preview rows (up to 5)
                rows = lines.slice(1, 6).map(line => 
                  line.split(',').map(cell => cell.trim())
                );
                
                // Parse all data
                parsedData = [];
                for(let i = 1; i < lines.length; i++) {
                  if(lines[i].trim() === '') continue;
                  
                  const values = lines[i].split(',');
                  const row: Record<string, string> = {};
                  
                  for(let j = 0; j < headers.length; j++) {
                    row[headers[j]] = values[j]?.trim() || '';
                  }
                  
                  parsedData.push(row);
                }
              } catch(fallbackError) {
                console.error("Fallback CSV parsing failed:", fallbackError);
                reject(new Error('Failed to parse CSV file'));
                return;
              }
            }
          }
          else {
            reject(new Error('Unsupported file format'));
            return;
          }
          
          if (parsedData.length === 0) {
            reject(new Error('No data found in file after parsing'));
            return;
          }
          
          resolve({
            headers,
            rows,
            rawData: parsedData
          });
        } catch (error) {
          console.error("File parsing error:", error);
          reject(new Error('Error parsing file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Helper to read complete file data (not just preview)
  const readFileData = (file: File): Promise<{headers: string[], rows: any[], rawData: any[]}> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('No data found in file'));
            return;
          }
          
          let parsedData: any[] = [];
          let headers: string[] = [];
          let rows: any[][] = [];
          
          // Handle Excel file
          if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
            
            if (parsedData.length > 0) {
              headers = Object.keys(parsedData[0]);
              rows = parsedData.map(row => 
                headers.map(header => row[header] || '')
              );
            }
          } 
          // Handle CSV file
          else if (file.name.endsWith('.csv')) {
            const csvData = data.toString();
            
            try {
              const workbook = XLSX.read(csvData, { type: 'string' });
              const firstSheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[firstSheetName];
              parsedData = XLSX.utils.sheet_to_json(worksheet);
              
              if (parsedData.length > 0) {
                headers = Object.keys(parsedData[0]);
                rows = parsedData.map(row => 
                  headers.map(header => row[header] || '')
                );
              }
            } catch(xlsxError) {
              // Fallback to manual CSV parsing
              const lines = csvData.split('\n');
              headers = lines[0].split(',').map(h => h.trim());
              
              parsedData = [];
              rows = [];
              for(let i = 1; i < lines.length; i++) {
                if(lines[i].trim() === '') continue;
                
                const values = lines[i].split(',').map(v => v.trim());
                const row: Record<string, string> = {};
                
                for(let j = 0; j < headers.length; j++) {
                  row[headers[j]] = values[j] || '';
                }
                
                parsedData.push(row);
                rows.push(values);
              }
            }
          } else {
            reject(new Error('Unsupported file format'));
            return;
          }
          
          if (parsedData.length === 0) {
            reject(new Error('No data found in file after parsing'));
            return;
          }
          
          resolve({ headers, rows, rawData: parsedData });
        } catch (error) {
          console.error("File parsing error:", error);
          reject(new Error('Error parsing file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  // Transform file with API-compliant column names
  const transformFileWithCorrectColumns = async (file: File, columnMapping: ColumnMapping): Promise<File> => {
    try {
      console.log('🔄 Starting file transformation...', { fileName: file.name, mapping: columnMapping });
      
      // Read the original file data
      const fileData = await readFileData(file);
      
      // Create new headers with API-compliant names and track column mapping
      const newHeaders: string[] = [];
      const columnIndexMap: Record<number, string> = {}; // originalIndex -> newColumnName
      
      fileData.headers.forEach((originalHeader, index) => {
        const mappedField = columnMapping[originalHeader];
        if (mappedField && mappedField.trim() !== '') {
          newHeaders.push(mappedField);
          columnIndexMap[index] = mappedField;
        }
      });
      
      // Transform data rows using the raw data
      const newRows = fileData.rawData.map(originalRow => {
        const newRow: Record<string, any> = {};
        
        // Map each original column to new column name
        Object.entries(columnMapping).forEach(([originalHeader, newFieldName]) => {
          if (newFieldName && newFieldName.trim() !== '') {
            const value = originalRow[originalHeader];
            if (value !== undefined && value !== null && value !== '') {
              newRow[newFieldName] = value;
            }
          }
        });
        
        return newRow;
      });
      
      console.log('📊 Transformation complete:', {
        originalHeaders: fileData.headers,
        newHeaders: newHeaders,
        rowCount: newRows.length,
        sampleRow: newRows[0]
      });
      
      // Validate that we have the required API fields
      const requiredFields = ['sku', 'name', 'ean', 'vat', 'price'];
      const missingFields = requiredFields.filter(field => !newHeaders.includes(field));
      
      if (missingFields.length > 0) {
        console.warn('⚠️ Missing required API fields:', missingFields);
        console.log('💡 Available headers:', newHeaders);
        console.log('🔍 Original mapping:', columnMapping);
      }
      
      // Create new CSV content with semicolon separator (European format)
      const csvContent = [
        newHeaders.join(';'),
        ...newRows.map(row => 
          newHeaders.map(header => {
            let value = row[header] || '';
            
            // Convert decimal numbers from US format (19.9) to European format (19,9)
            if (typeof value === 'number' || (typeof value === 'string' && /^\d+\.?\d*$/.test(value))) {
              value = String(value).replace('.', ',');
            }
            
            // Handle empty values - leave empty instead of quotes
            if (value === '' || value === null || value === undefined) {
              return '';
            }
            
            // Escape values that contain semicolons, quotes, or newlines  
            if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
          }).join(';')
        )
      ].join('\n');
      
      // Log CSV preview for debugging
      console.log('📝 Generated CSV preview (first 3 lines):');
      const csvLines = csvContent.split('\n');
      csvLines.slice(0, 3).forEach((line, idx) => {
        console.log(`Line ${idx}: ${line}`);
      });
      
      // Create new file with API-compliant structure with proper UTF-8 BOM
      // Add UTF-8 BOM to ensure proper encoding
      const BOM = '\uFEFF';
      const csvContentWithBOM = BOM + csvContent;
      
      const transformedFile = new File([csvContentWithBOM], `api_compliant_${file.name.replace(/\.(xlsx?|xls)$/, '.csv')}`, {
        type: 'text/csv;charset=utf-8'
      });
      
      console.log('✅ File transformation successful:', {
        originalSize: file.size,
        newSize: transformedFile.size,
        newFileName: transformedFile.name,
        columnMapping: columnMapping
      });
      
      return transformedFile;
    } catch (error) {
      console.error('❌ File transformation failed:', error);
      throw error;
    }
  };

  const handleFieldMapping = (header: string, field: ProductField | '') => {
    if (field === '') {
      // Remove mapping
      const newMapping = {...mappedFields};
      delete newMapping[header];
      setMappedFields(newMapping);
    } else {
      // Add or update mapping
      setMappedFields({
        ...mappedFields,
        [header]: field
      });
    }
  };

  const suggestMapping = () => {
    if (!filePreview) return;
    
    const newMapping: Record<string, ProductField | ''> = {};
    filePreview.headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      
      if (lowerHeader === 'sku' || lowerHeader.includes('minsan') || lowerHeader.includes('code') || lowerHeader.includes('codice')) {
        newMapping[header] = 'sku';
      } else if (lowerHeader === 'ean') {
        newMapping[header] = 'ean';
      } else if (lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader.includes('descrizione')) {
        newMapping[header] = 'name';
      } else if (lowerHeader.includes('producer') || lowerHeader.includes('manufacturer') || lowerHeader.includes('brand') || lowerHeader.includes('ditta')) {
        newMapping[header] = 'producer';
      } else if (lowerHeader.includes('description') || lowerHeader.includes('desc')) {
        newMapping[header] = 'description';
      } else if (lowerHeader.includes('category') || lowerHeader.includes('categoria')) {
        newMapping[header] = 'category';
      } else if (lowerHeader.includes('price') || lowerHeader.includes('prezzo')) {
        newMapping[header] = 'price';
      } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva')) {
        newMapping[header] = 'vat';
      }
    });
    
    setMappedFields(newMapping);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
        setFilePreview(null);
    setMappedFields({});
    setFileError(null);
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportProducts = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    setProcessedProducts([]);
    setFileError(null);
    
    try {
      // Try new API-based upload with progress tracking (for single CSV or Excel files)
      if (selectedFile && selectedFile.name.match(/\.(csv|xlsx?|xls)$/i)) {
        console.log('🚀 Attempting API-based upload with progress tracking...');
        
        try {
          // Create column mapping from our mapped fields
          const columnMapping: ColumnMapping = {};
          Object.entries(mappedFields).forEach(([header, field]) => {
            if (field) {
              columnMapping[header] = field;
            }
          });
          
          console.log('📋 Column mapping:', columnMapping);
          
          // Transform file with correct column names that API expects
          const transformedFile = await transformFileWithCorrectColumns(selectedFile, columnMapping);
          console.log('🔄 File transformed with API-compliant column names');
          
          // Debug: Log transformed file details
          console.log('🔍 Transformed file ready for upload:');
          console.log('📏 File size:', transformedFile.size, 'bytes');
          console.log('📝 File type:', transformedFile.type);
          console.log('📁 File name:', transformedFile.name);
          
          // Use the properly transformed file directly
          const fileToUpload = transformedFile;
          
          console.log('📤 Uploading transformed file:', {
            name: fileToUpload.name,
            size: fileToUpload.size,
            type: fileToUpload.type
          });
          
          // File is already transformed with correct API headers: sku;name;ean;vat;price
          // No column mapping needed since headers match API expectations
          console.log('📋 File already has API-compliant headers - no mapping needed');
          
          const result = await uploadProductsCSV(fileToUpload, {});
          
          console.log('🔍 API Response received:', {
            result: result,
            hasUploadId: !!result.uploadId,
            uploadId: result.uploadId,
            success: result.success,
            error: result.error,
            message: result.message
          });
          
          // Check if API returned an error (even with 200 status)
          if (result.error || result.success === false) {
            console.error('❌ API returned error:', {
              error: result.error,
              success: result.success,
              message: result.message,
              reason: result.reason
            });
            throw new Error(result.message || result.reason || 'API upload failed');
          }
          
          // Check for uploadId in different possible formats
          const uploadId = result.uploadId || result.upload_id || result.id;
          
          if (uploadId) {
            console.log('📊 Upload ID received, starting progress tracking:', uploadId);
            uploadProgress.startPolling(uploadId);
            return; // Exit early, progress tracking will handle completion
          } else if (result.success && result.processedRows) {
            // API processed file immediately (synchronous processing)
            console.log('✅ File processed immediately by API:', {
              success: result.success,
              processedRows: result.processedRows,
              message: result.message
            });
            
            // Handle immediate processing completion
            setIsProcessing(false);
            handleCancel(); // Reset form and close
            return; // Exit early, processing complete
          } else {
            console.log('⏭️ No upload ID found, falling back to client-side processing. Reason:', {
              hasUploadId: !!result.uploadId,
              uploadId: result.uploadId,
              upload_id: result.upload_id,
              id: result.id,
              success: result.success,
              processedRows: result.processedRows,
              resultKeys: Object.keys(result),
              fullResult: result
            });
            // Continue to fallback logic below
          }
        } catch (apiError) {
          console.warn('⚠️ API upload failed, falling back to client-side processing:', apiError);
          // Continue to fallback logic below
        }
      }
      
      // Fallback: Original client-side processing
      console.log('🔄 Using client-side file processing...');
      let allProducts: ProductFormData[] = [];
      
      // Process each file sequentially
      // Process single file
      if (selectedFile) {
        const file = selectedFile;
        
        // Skip unsupported file types
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
          setFileError('Unsupported file type. Please upload Excel or CSV files.');
          setIsProcessing(false);
          return;
        }
        
        try {
          // Process current file
          const preview = await readFilePreview(file);
          const products = processFileData(preview);
          
          if (products.length > 0) {
            allProducts = [...allProducts, ...products];
            setProcessedProducts(prev => [...prev, ...products]);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
      
      if (allProducts.length === 0) {
        setFileError('No valid products found in the files. Please check field mappings.');
        return;
      }
      
      // Add products individually if no bulk method provided
      if (!onAddMultipleProducts) {
        allProducts.forEach(product => {
          onAddProduct(product);
        });
      } else {
        // Use bulk import function if available
        onAddMultipleProducts(allProducts);
      }
      
      // Reset and close
      handleCancel();
    } catch (error) {
      console.error('Error processing files:', error);
      setFileError('Error processing products. Please check file formats and field mappings.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to process a file's data
  const processFileData = (preview: FilePreviewData): ProductFormData[] => {
    const products: ProductFormData[] = [];
    
    // Process each row in the file
    preview.rawData.forEach(row => {
      // Create a new product with default values
      const newProduct: ProductFormData = { ...initialFormData };
      
      // Apply mapped fields
      Object.entries(mappedFields).forEach(([header, field]) => {
        if (!field) return; // Skip if field is empty string
        
        const value = row[header];
        
        if (value !== undefined && value !== null) {
          // Convert the value to the appropriate type
          // String fields
          if (field === 'sku' || field === 'name' || field === 'ean' || 
              field === 'producer' || field === 'description' || field === 'category') {
            (newProduct as any)[field] = String(value).trim();
          } else if (field === 'price' || field === 'vat') {
            // For numeric fields (price, vat), parse as float
            const numValue = parseFloat(String(value).replace(',', '.'));
            if (!isNaN(numValue)) {
              (newProduct as any)[field] = numValue;
            } else {
              (newProduct as any)[field] = 0; // Default to 0 for invalid numeric values
            }
          }
        }
      });
      
      // Validate the product has at least name and some kind of product identifier
      if (newProduct.name && (newProduct.sku || newProduct.ean)) {
        products.push(newProduct);
      }
    });
    
    return products;
  };

  const handleCancel = () => {
    // Stop any ongoing progress polling
    uploadProgress.stopPolling();
    
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
    setMappedFields({});
    setProcessedProducts([]);
    setIsProcessing(false);
    setActiveStep(0);
    onClose();
  };

  // Helper to get field selection options - Updated to match API expectations
  const getFieldOptions = () => {
    return [
      { value: '', label: 'Ignore this column' },
      { value: 'sku', label: 'Sku/Minsan' },
      { value: 'name', label: 'Product Name' },
      { value: 'ean', label: 'EAN' },
      { value: 'producer', label: 'Producer Company' },
      { value: 'description', label: 'Product Description' },
      { value: 'category', label: 'Product Category' },
      { value: 'price', label: 'Public Price' },
      { value: 'vat', label: 'VAT' }
    ];
  };

  // Template for Excel/CSV file - Headers match backend expectations exactly:
  // sku;name;ean;producer;description;category;price;vat
  const downloadTemplate = () => {
    const template: Record<string, string>[] = [
      {
        'sku': '935621793',
        'name': '5D Depuradren Tè alla Pesca Integratore Depurativo Drenante 500 ml',
        'ean': '8032628862878',
        'producer': 'Bioearth S.r.l.',
        'description': 'Integratore alimentare depurativo e drenante al gusto pesca',
        'category': 'Integratori',
        'price': '19,9',
        'vat': '10'
      },
      {
        'sku': '909125460',
        'name': 'Acarostop Fodera Cuscino Antiacaro 50 x 80 cm',
        'ean': '8058664012345',
        'producer': 'Sanitex S.p.A.',
        'description': 'Fodera per cuscino con trattamento antiacaro certificato',
        'category': 'Dispositivi Medici',
        'price': '39,9',
        'vat': '22'
      },
      {
        'sku': '902603303',
        'name': 'Acidif Retard Integratore Per Apparato Urinario Mirtillo Rosso 30 Compresse',
        'ean': '8058341430071',
        'producer': 'PharmaNutra S.p.A.',
        'description': 'Integratore per il benessere delle vie urinarie con mirtillo rosso',
        'category': 'Integratori',
        'price': '24,5',
        'vat': '10'
      }
    ];
    
    // Create CSV content with semicolon separator (European format)
    // Headers match exactly what the backend expects: sku;name;ean;producer;description;category;price;vat
    const headers = ['sku', 'name', 'ean', 'producer', 'description', 'category', 'price', 'vat'];
    const csvContent = [
      headers.join(';'),
      ...template.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape values that contain semicolons, quotes, or newlines
          if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(';')
      )
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'product_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Add Products in the Database
        </Typography>
        </Box>
        <IconButton 
          onClick={handleCancel} 
          size="small"
          sx={{ 
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* Stepper */}
      <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <DialogContent dividers sx={{ p: 0, bgcolor: 'background.paper' }}>
        <Box sx={{ p: 3 }}>
          {/* Step 0: Upload Files */}
          {activeStep === 0 && (
            <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            
            {/* File drop area */}
            <Box
              sx={{
                width: '100%',
                height: selectedFile === null ? 120 : 60,
                border: `2px dashed ${isDragging ? 'primary.main' : 'grey.300'}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'grey.50',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                mb: 2,
                gap: 1
              }}
              onClick={handleFileClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CloudUploadIcon sx={{ fontSize: selectedFile === null ? 32 : 20, color: 'grey.400' }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedFile === null ? 'Drag & Drop file or click to select' : 'Replace file'}
              </Typography>
            </Box>
            
            {/* Selected file display */}
            {selectedFile && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Selected File
                </Typography>
              <Button
                variant="text"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                size="small"
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              >
                    Template
              </Button>
            </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'background.paper'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <FileCopyIcon color="primary" sx={{ fontSize: 16 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    size="small" 
                    onClick={handleRemoveFile}
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              </Box>
            )}
            
            {/* File error message */}
            {fileError && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                <Typography variant="body2">{fileError}</Typography>
              </Box>
            )}

            {/* Upload Progress Bar for API-based uploads */}
            <UploadProgressBar
              progress={uploadProgress.progress}
              isPolling={uploadProgress.isPolling}
              error={uploadProgress.error}
              onRetry={uploadProgress.retry}
              showDetails={true}
            />
            
            {/* Show file preview and column mapping for the selected file */}
            
            {/* Show processed products count if any */}
            {processedProducts.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                <Typography variant="body2">
                  {processedProducts.length} valid products ready to import
                </Typography>
              </Box>
            )}
            
            {/* File format information and expected columns - same as before */}
            {!selectedFile && (
              <>
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Supported file formats:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label="Excel (.xlsx)" size="small" />
                  <Chip label="Excel 97-2003 (.xls)" size="small" />
                  <Chip label="CSV (.csv)" size="small" />
                </Box>
                
                <Typography variant="subtitle2" gutterBottom>
                  Expected columns:
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Column Name</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Product Code</TableCell>
                        <TableCell>EAN or other product code (required)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Product name or description (required)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Public Price</TableCell>
                        <TableCell>Retail price (numeric)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Stock Quantity</TableCell>
                        <TableCell>Available inventory (numeric)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Stock Price</TableCell>
                        <TableCell>Acquisition price (numeric)</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Manufacturer</TableCell>
                        <TableCell>Product brand or manufacturer</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>VAT</TableCell>
                        <TableCell>VAT percentage (numeric)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            </>
          )}

          {/* Step 1: Map Columns */}
          {activeStep === 1 && filePreview && (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SettingsIcon color="primary" />
                Map File Columns to Product Fields
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select which column in your file corresponds to each product field
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={suggestMapping}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2
                  }}
                >
                  Auto Suggest Mapping
                </Button>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>File Column</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Map To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Preview</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filePreview.headers.map((header, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ fontWeight: 500 }}>{header}</TableCell>
                        <TableCell>
                          <select 
                            className="w-full p-1 border border-gray-300 rounded"
                            value={mappedFields[header] || ''}
                            onChange={(e) => handleFieldMapping(header, e.target.value as ProductField | '')}
                          >
                            {getFieldOptions().map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          {filePreview.rows[0] && filePreview.rows[0][index] ? (
                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {filePreview.rows[0][index]}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">(empty)</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Step 2: Preview & Import */}
          {activeStep === 2 && filePreview && (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon color="primary" />
                Preview & Import Products
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review the mapped data and import your products
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, mb: 3 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {filePreview.headers.map((header, index) => (
                        <TableCell key={index} sx={{ fontWeight: 600 }}>
                          {mappedFields[header] ? `${header} → ${mappedFields[header]}` : header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filePreview.rows.slice(0, 10).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {cell ? (
                              <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cell}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">(empty)</Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {filePreview.rows.length > 10 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                  Showing first 10 rows of {filePreview.rows.length} total rows
                </Typography>
              )}
            </>
          )}
              </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2, 
        bgcolor: 'grey.50', 
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 2
      }}>
        <Button 
          onClick={handleCancel}
                  variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            px: 3
          }}
        >
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button 
            onClick={handleBack}
                  variant="outlined"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3
            }}
          >
            Back
          </Button>
        )}
        
        {activeStep < 2 ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleNext}
            disabled={!canProceed()}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            {activeStep === 0 ? 'Next: Map Columns' : 'Next: Preview & Import'}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleImportProducts}
            disabled={isProcessing || !selectedFile || Object.keys(mappedFields).length === 0}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }
            }}
          >
            {isProcessing ? 'Processing...' : 'Import Products'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddProductModal; 