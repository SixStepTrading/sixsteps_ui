/// <reference path="../../../types/xlsx.d.ts" />
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  IconButton,
  Typography,
  InputAdornment,
  Box,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon, 
  CloudUpload as CloudUploadIcon,
  FileCopy as FileCopyIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { uploadProductsCSV, validateCSVHeaders, ColumnMapping } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks/useUploadProgress';
import UploadProgressBar from '../../common/atoms/UploadProgressBar';

export interface ProductFormData {
  productCode: string; // Keep for backward compatibility 
  sku: string;
  ean: string;
  minsan: string;
  name: string; // API field name
  productName: string; // UI field name (backward compatibility)
  price: number; // API field name  
  publicPrice: number; // UI field name (backward compatibility)
  stock: number; // API field name
  stockQuantity: number; // UI field name (backward compatibility)
  stockPrice: number;
  manufacturer: string;
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
    productCode: '', // Keep for backward compatibility
    sku: '',
    ean: '',
    minsan: '',
    name: '', // API field name
    productName: '', // UI field name (backward compatibility)
    price: 0, // API field name
    publicPrice: 0, // UI field name (backward compatibility)
    stock: 0, // API field name
    stockQuantity: 0, // UI field name (backward compatibility)
    stockPrice: 0,
    manufacturer: '',
    vat: 10
  };

  // State variables
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<Record<string, ProductField | ''>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFileIndex, setProcessingFileIndex] = useState<number>(-1);
  const [processedProducts, setProcessedProducts] = useState<ProductFormData[]>([]);
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload progress tracking for bulk import (optional)
  const uploadProgress = useUploadProgress({
    onComplete: (result) => {
      console.log('📊 Bulk import completed via progress tracking:', result);
      setIsProcessing(false);
      setProcessingFileIndex(-1);
      
      // Reset form and close
      handleCancel();
    },
    onError: (error) => {
      console.error('📊 Bulk import progress error:', error);
      setIsProcessing(false);
      setProcessingFileIndex(-1);
      setFileError(error.message);
    }
  });

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Single product form handlers
  const handleChange = (field: keyof ProductFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'productCode' || field === 'sku' || field === 'ean' || field === 'minsan' ||
                  field === 'name' || field === 'productName' || field === 'manufacturer'
      ? event.target.value 
      : parseFloat(event.target.value) || 0;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    
    // Require at least one product identifier
    if (!formData.productCode.trim() && !formData.sku.trim() && !formData.ean.trim() && !formData.minsan.trim()) {
      newErrors.productCode = 'At least one product identifier (Product Code, SKU, EAN, or MINSAN) is required';
    }
    
    if (!formData.productName.trim() && !formData.name.trim()) {
      newErrors.productName = 'Product name is required';
    }
    
    if (formData.publicPrice <= 0 && formData.price <= 0) {
      newErrors.publicPrice = 'Price must be greater than zero';
    }
    
    if (formData.stockQuantity < 0 && formData.stock < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }
    
    if (formData.stockPrice <= 0) {
      newErrors.stockPrice = 'Stock price must be greater than zero';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    
    if (formData.vat <= 0 || formData.vat > 100) {
      newErrors.vat = 'VAT must be between 1 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitSingle = () => {
    if (validateForm()) {
      onAddProduct(formData);
      setFormData(initialFormData);
      onClose();
    }
  };

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
      // Convert FileList to array and add to selected files
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // If no file is currently previewed, preview the first new file
      if (!filePreview && newFiles.length > 0) {
        handleFileSelect(newFiles[0]);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and add to selected files
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // If no file is currently previewed, preview the first new file
      if (!filePreview && newFiles.length > 0) {
        handleFileSelect(newFiles[0]);
      }
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
        
        if (lowerHeader === 'sku' || lowerHeader.includes('code') || lowerHeader.includes('codice')) {
          newMapping[header] = 'sku';
        } else if (lowerHeader === 'ean') {
          newMapping[header] = 'ean';
        } else if (lowerHeader.includes('minsan')) {
          newMapping[header] = 'minsan';
        } else if (lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader.includes('descrizione')) {
          newMapping[header] = 'name';
        } else if (lowerHeader.includes('public') && lowerHeader.includes('price')) {
          newMapping[header] = 'price';
        } else if (lowerHeader.includes('stock') && lowerHeader.includes('quantity')) {
          newMapping[header] = 'stock';
        } else if (lowerHeader.includes('stock') && lowerHeader.includes('price')) {
          newMapping[header] = 'stockPrice';
        } else if (lowerHeader.includes('manufacturer') || lowerHeader.includes('brand')) {
          newMapping[header] = 'manufacturer';
        } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva')) {
          newMapping[header] = 'vat';
        }
      });
      
      setMappedFields(newMapping);
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

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      
      // If we removed the currently previewed file, clear the preview
      // or preview a different file if there are any left
      if (newFiles.length === 0) {
        setFilePreview(null);
      } else if (index === 0 && filePreview) {
        // If we removed the first file and it was being previewed,
        // preview the new first file
        handleFileSelect(newFiles[0]);
      }
      
      return newFiles;
    });
    
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportProducts = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setProcessedProducts([]);
    setFileError(null);
    
    try {
      // Try new API-based upload with progress tracking (for single CSV or Excel files)
      if (selectedFiles.length === 1 && selectedFiles[0].name.match(/\.(csv|xlsx?|xls)$/i)) {
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
          const transformedFile = await transformFileWithCorrectColumns(selectedFiles[0], columnMapping);
          console.log('🔄 File transformed with API-compliant column names');
          
          // Debug: Log actual file content for first few lines
          console.log('🔍 Debugging transformed file content...');
          const fileText = await transformedFile.text();
          const firstLines = fileText.split('\n').slice(0, 5);
          console.log('📄 First 5 lines of transformed file:', firstLines);
          console.log('📏 File size:', transformedFile.size, 'bytes');
          console.log('📝 File type:', transformedFile.type);
          console.log('📁 File name:', transformedFile.name);
          
          // Create a minimal test file to verify API format expectations
          const testCsvContent = `sku;name;ean;vat;price
123456;Test Product;1234567890123;22;15,99
789012;Another Test;;10;9,50`;
          
          const testFile = new File(['\uFEFF' + testCsvContent], 'test_api_format.csv', { 
            type: 'text/csv;charset=utf-8' 
          });
          
          console.log('🧪 Testing with minimal file first...');
          console.log('📄 Test file content:', testCsvContent);
          
          // Recreate the file to ensure it's properly readable
          const finalFile = new File([fileText], transformedFile.name, { 
            type: 'text/csv;charset=utf-8' 
          });
          
          // Try with test file first for debugging
          const useTestFile = true; // Set to true to test with minimal file
          const fileToUpload = useTestFile ? testFile : finalFile;
          
          console.log(`📤 Uploading ${useTestFile ? 'TEST' : 'FULL'} file:`, {
            name: fileToUpload.name,
            size: fileToUpload.size,
            type: fileToUpload.type
          });
          
          // Create 1:1 column mapping for API compliance 
          // (API might require columnMapping even for pre-formatted files)
          const apiColumnMapping: ColumnMapping = {
            'sku': 'sku',
            'name': 'name', 
            'ean': 'ean',
            'vat': 'vat',
            'price': 'price'
          };
          
          console.log('📋 Using 1:1 API column mapping:', apiColumnMapping);
          
          const result = await uploadProductsCSV(fileToUpload, apiColumnMapping);
          
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
            setProcessingFileIndex(-1);
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
      for (let i = 0; i < selectedFiles.length; i++) {
        setProcessingFileIndex(i);
        const file = selectedFiles[i];
        
        // Skip unsupported file types
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
          continue;
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
      setProcessingFileIndex(-1);
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
                    if (field === 'productCode' || field === 'sku' || field === 'ean' || field === 'minsan' ||
              field === 'name' || field === 'productName' || field === 'manufacturer') {
            newProduct[field] = String(value).trim();
          } else {
            // For numeric fields (price, publicPrice, stock, stockQuantity, stockPrice, vat), parse as float
            const numValue = parseFloat(String(value).replace(',', '.'));
            if (!isNaN(numValue)) {
              newProduct[field] = numValue;
            } else {
              newProduct[field] = 0; // Default to 0 for invalid numeric values
            }
          }
        }
      });
      
      // Validate the product has at least name and some kind of product identifier
      if ((newProduct.name || newProduct.productName) && (newProduct.productCode || newProduct.sku || newProduct.ean || newProduct.minsan)) {
        products.push(newProduct);
      }
    });
    
    return products;
  };

  const handleCancel = () => {
    // Stop any ongoing progress polling
    uploadProgress.stopPolling();
    
    setFormData(initialFormData);
    setErrors({});
    setSelectedFiles([]);
    setFilePreview(null);
    setFileError(null);
    setMappedFields({});
    setProcessedProducts([]);
    setIsProcessing(false);
    setProcessingFileIndex(-1);
    onClose();
  };

  // Helper to get field selection options - Updated to match API expectations
  const getFieldOptions = () => {
    return [
      { value: '', label: 'Ignore this column' },
      { value: 'sku', label: 'SKU/Product Code' },
      { value: 'ean', label: 'EAN Code' },
      { value: 'minsan', label: 'MINSAN Code' },
      { value: 'name', label: 'Product Name' },
      { value: 'price', label: 'Price' },
      { value: 'stock', label: 'Stock Quantity' },
      { value: 'stockPrice', label: 'Stock Price' },
      { value: 'manufacturer', label: 'Manufacturer' },
      { value: 'vat', label: 'VAT %' },
      // Legacy fields for backward compatibility
      { value: 'productCode', label: 'Product Code (Legacy)' },
      { value: 'productName', label: 'Product Name (Legacy)' },
      { value: 'publicPrice', label: 'Public Price (Legacy)' },
      { value: 'stockQuantity', label: 'Stock Quantity (Legacy)' }
    ];
  };

  // Template for Excel/CSV file - Updated column names to match API
  const downloadTemplate = () => {
    const template: Record<string, string>[] = [
      {
        'sku': '935621793',
        'name': '5D Depuradren TÃ¨ alla Pesca Integratore Depurativo Drenante 500 ml',
        'ean': '8032628862878',
        'vat': '10',
        'price': '19,9'
      },
      {
        'sku': '909125460',
        'name': 'Acarostop Fodera Cuscino Antiacaro 50 x 80 cm',
        'ean': '',
        'vat': '22',
        'price': '39,9'
      },
      {
        'sku': '902603303',
        'name': 'Acidif Retard Integratore Per Apparato Urinario Mirtillo Rosso 30 Compresse',
        'ean': '8058341430071',
        'vat': '10',
        'price': '24,5'
      }
    ];
    
    // Create CSV content with semicolon separator (European format)
    const headers = ['sku', 'name', 'ean', 'vat', 'price'];
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
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Add Products
        </Typography>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Bulk Import" />
        <Tab label="Single Product" />
      </Tabs>
      
      <DialogContent dividers>
        {activeTab === 0 ? (
          // Bulk import form - updated for multiple files
          <Box sx={{ p: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
              multiple // Allow multiple file selection
            />
            
            {/* File drop area - show when no files or always available */}
            <Box
              sx={{
                width: '100%',
                height: selectedFiles.length === 0 ? 200 : 100,
                border: `2px dashed ${isDragging ? 'primary.main' : 'grey.300'}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'grey.50',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                mb: 3
              }}
              onClick={handleFileClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <CloudUploadIcon sx={{ fontSize: selectedFiles.length === 0 ? 48 : 32, color: 'grey.400', mb: 1 }} />
              <Typography variant={selectedFiles.length === 0 ? "subtitle1" : "body2"}>
                {selectedFiles.length === 0 ? 'Drag & Drop your files here' : 'Add more files'}
              </Typography>
              {selectedFiles.length === 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    or click to select files
                  </Typography>
                  <Button variant="outlined" size="small">
                    Select Files
                  </Button>
                </>
              )}
            </Box>
            
            {/* List of selected files */}
            {selectedFiles.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files ({selectedFiles.length})
                </Typography>
                
                <List dense sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {selectedFiles.map((file, index) => (
                    <ListItem
                      key={index}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: filePreview && index === 0 ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                      }}
                      onClick={() => handleFileSelect(file)}
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024).toFixed(2)} KB`}
                      />
                      {isProcessing && processingFileIndex === index && (
                        <CircularProgress size={20} sx={{ ml: 1 }} />
                      )}
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete" onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(index);
                        }}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            {/* Download template button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="text"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                size="small"
              >
                Download Template
              </Button>
            </Box>
            
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
            {filePreview && (
              <>
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  Map file columns to product fields
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select which column in your file corresponds to each product field
                </Typography>
                
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>File Column</TableCell>
                        <TableCell>Map To</TableCell>
                        <TableCell>Preview</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filePreview.headers.map((header, index) => (
                        <TableRow key={index}>
                          <TableCell>{header}</TableCell>
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
                              filePreview.rows[0][index]
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                (empty)
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Typography variant="subtitle2" gutterBottom>
                  Data Preview (first 5 rows)
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {filePreview.headers.map((header, index) => (
                          <TableCell key={index}>{header}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filePreview.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{cell || ''}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            
            {/* Show processed products count if any */}
            {processedProducts.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', color: 'success.contrastText', borderRadius: 1 }}>
                <Typography variant="body2">
                  {processedProducts.length} valid products ready to import
                </Typography>
              </Box>
            )}
            
            {/* File format information and expected columns - same as before */}
            {selectedFiles.length === 0 && (
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
          </Box>
        ) : (
          // Single product form
          <Box sx={{ p: 1 }}>
            {/* First row */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Product Code"
                  variant="outlined"
                  value={formData.productCode}
                  onChange={handleChange('productCode')}
                  error={!!errors.productCode}
                  helperText={errors.productCode}
                  required
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Product Name"
                  variant="outlined"
                  value={formData.productName}
                  onChange={handleChange('productName')}
                  error={!!errors.productName}
                  helperText={errors.productName}
                  required
                />
              </Box>
            </Box>
            
            {/* Second row - Manufacturer and VAT */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Manufacturer"
                  variant="outlined"
                  value={formData.manufacturer}
                  onChange={handleChange('manufacturer')}
                  error={!!errors.manufacturer}
                  helperText={errors.manufacturer}
                  required
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="VAT"
                  variant="outlined"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 1, max: 100, step: 1 }
                  }}
                  value={formData.vat}
                  onChange={handleChange('vat')}
                  error={!!errors.vat}
                  helperText={errors.vat}
                  required
                />
              </Box>
            </Box>
            
            {/* Third row */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Public Price"
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  value={formData.publicPrice}
                  onChange={handleChange('publicPrice')}
                  error={!!errors.publicPrice}
                  helperText={errors.publicPrice}
                  required
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Stock Quantity"
                  variant="outlined"
                  type="number"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  value={formData.stockQuantity}
                  onChange={handleChange('stockQuantity')}
                  error={!!errors.stockQuantity}
                  helperText={errors.stockQuantity}
                  required
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  label="Stock Price"
                  variant="outlined"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                  value={formData.stockPrice}
                  onChange={handleChange('stockPrice')}
                  error={!!errors.stockPrice}
                  helperText={errors.stockPrice}
                  required
                />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        {activeTab === 0 ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleImportProducts}
            disabled={isProcessing || selectedFiles.length === 0 || Object.keys(mappedFields).length === 0}
          >
            {isProcessing ? 'Processing...' : `Import Products (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmitSingle}
            startIcon={<AddIcon />}
          >
            Add Product
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddProductModal; 