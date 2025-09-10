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
<<<<<<< Updated upstream
=======
import { uploadProductsCSV, ColumnMapping } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks/useUploadProgress';
import UploadProgressBar from '../../common/atoms/UploadProgressBar';
>>>>>>> Stashed changes

export interface ProductFormData {
  productCode: string;
  productName: string;
  publicPrice: number;
  stockQuantity: number;
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
    productCode: '',
    productName: '',
    publicPrice: 0,
    stockQuantity: 0,
    stockPrice: 0,
    manufacturer: '',
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

<<<<<<< Updated upstream
  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Single product form handlers
  const handleChange = (field: keyof ProductFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'productCode' || field === 'productName' || field === 'manufacturer'
      ? event.target.value 
      : parseFloat(event.target.value);
    
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
    
    if (!formData.productCode.trim()) {
      newErrors.productCode = 'Product code is required';
    }
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    
    if (formData.publicPrice <= 0) {
      newErrors.publicPrice = 'Public price must be greater than zero';
    }
    
    if (formData.stockQuantity < 0) {
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
=======
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
>>>>>>> Stashed changes

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
      
      // Auto-map columns based on column names
      const newMapping: Record<string, ProductField | ''> = {};
      preview.headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        
        if (lowerHeader.includes('code') || lowerHeader.includes('ean')) {
          newMapping[header] = 'productCode';
        } else if (lowerHeader.includes('name') || lowerHeader.includes('product') || lowerHeader.includes('descrizione')) {
          newMapping[header] = 'productName';
        } else if (lowerHeader.includes('public') && lowerHeader.includes('price')) {
          newMapping[header] = 'publicPrice';
        } else if (lowerHeader.includes('stock') && lowerHeader.includes('quantity')) {
          newMapping[header] = 'stockQuantity';
        } else if (lowerHeader.includes('stock') && lowerHeader.includes('price')) {
          newMapping[header] = 'stockPrice';
        } else if (lowerHeader.includes('manufacturer') || lowerHeader.includes('brand')) {
          newMapping[header] = 'manufacturer';
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
    let allProducts: ProductFormData[] = [];
    
    try {
<<<<<<< Updated upstream
=======
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
      
>>>>>>> Stashed changes
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
          if (field === 'productCode' || field === 'productName' || field === 'manufacturer') {
            newProduct[field] = String(value).trim();
          } else {
            // For numeric fields, parse as float
            const numValue = parseFloat(String(value).replace(',', '.'));
            if (!isNaN(numValue)) {
              newProduct[field] = numValue;
            }
          }
        }
      });
      
      // Validate the product has at least name and code
      if (newProduct.productName && newProduct.productCode) {
        products.push(newProduct);
      }
    });
    
    return products;
  };

  const handleCancel = () => {
<<<<<<< Updated upstream
    setFormData(initialFormData);
    setErrors({});
    setSelectedFiles([]);
=======
    // Stop any ongoing progress polling
    uploadProgress.stopPolling();
    
    setSelectedFile(null);
>>>>>>> Stashed changes
    setFilePreview(null);
    setFileError(null);
    setMappedFields({});
    setProcessedProducts([]);
<<<<<<< Updated upstream
=======
    setIsProcessing(false);
    setActiveStep(0);
>>>>>>> Stashed changes
    onClose();
  };

  // Helper to get field selection options
  const getFieldOptions = () => {
    return [
      { value: '', label: 'Ignore this column' },
      { value: 'productCode', label: 'Product Code (EAN/Code)' },
      { value: 'productName', label: 'Product Name' },
      { value: 'publicPrice', label: 'Public Price' },
      { value: 'stockQuantity', label: 'Stock Quantity' },
      { value: 'stockPrice', label: 'Stock Price' },
      { value: 'manufacturer', label: 'Manufacturer' },
      { value: 'vat', label: 'VAT %' }
    ];
  };

  // Template for Excel/CSV file
  const downloadTemplate = () => {
    const template = [
      {
        'Product Code': 'EAN123456789',
        'Product Name': 'Example Product',
        'Public Price': '19.99',
        'Stock Quantity': '50',
        'Stock Price': '9.99',
        'Manufacturer': 'Example Brand',
        'VAT': '10'
      }
    ];
    
    // Use XLSX write functionality with proper typings
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product_import_template.xlsx');
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
          Add Products
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