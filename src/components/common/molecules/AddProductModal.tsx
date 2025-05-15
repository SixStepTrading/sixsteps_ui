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
    let allProducts: ProductFormData[] = [];
    
    try {
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
    setFormData(initialFormData);
    setErrors({});
    setSelectedFiles([]);
    setFilePreview(null);
    setFileError(null);
    setMappedFields({});
    setProcessedProducts([]);
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