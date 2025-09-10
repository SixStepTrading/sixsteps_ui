import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress
} from '@mui/material';
import { uploadSuppliesCSV } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks/useUploadProgress';
import { ModernDialog, FileUploadArea, ColumnMappingTable, DataPreviewTable } from './upload';
import * as XLSX from 'xlsx';

interface SupplierStockUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FilePreviewData {
  headers: string[];
  rows: any[][];
}

const SupplierStockUploadModal: React.FC<SupplierStockUploadModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  // State variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Stepper configuration
  const steps = ['Upload File', 'Map Columns', 'Preview & Upload'];
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload progress tracking
  const uploadProgress = useUploadProgress({
    onComplete: (result: any) => {
      console.log('📊 Stock upload completed via progress tracking:', result);
      setIsProcessing(false);
      if (result) {
        onSuccess?.();
        handleCancel();
      }
    },
    onError: (error: Error) => {
      console.error('❌ Stock upload error via progress tracking:', error);
      setIsProcessing(false);
      setFileError(error.message);
    }
  });

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

  // File handling functions
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
      const file = files[0];
      setSelectedFile(file);
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      handleFileSelect(file);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setFileError('Invalid file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.');
      return;
    }
    
    setFileError(null);
    
    try {
      const preview = await readFilePreview(file);
      setFilePreview(preview);
      
      // Auto-map common fields
      const newMapping: Record<string, string> = {};
      preview.headers.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        
        if (lowerHeader === 'sku' || lowerHeader.includes('ean') || lowerHeader.includes('code')) {
          newMapping[header] = 'sku';
        } else if (lowerHeader.includes('price') || lowerHeader.includes('eti') || lowerHeader.includes('prezzo')) {
          newMapping[header] = 'price';
        } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva')) {
          newMapping[header] = 'vat';
        } else if (lowerHeader.includes('quantity') || lowerHeader.includes('stock') || lowerHeader.includes('qty')) {
          newMapping[header] = 'quantity';
        } else if (lowerHeader.includes('currency') || lowerHeader.includes('valuta')) {
          newMapping[header] = 'currency';
        } else if (lowerHeader.includes('unit') || lowerHeader.includes('unita')) {
          newMapping[header] = 'unit';
        }
      });
      
      console.log('🔍 Auto-mapping result:', newMapping);
      
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
          let workbook: XLSX.WorkBook;
          
          if (file.name.endsWith('.csv')) {
            const csvData = XLSX.utils.sheet_to_json(data as string, { header: 1 });
            workbook = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(csvData);
            XLSX.utils.book_append_sheet(workbook, ws, 'Sheet1');
          } else {
            workbook = XLSX.read(data as string, { type: 'binary' });
          }
          
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          resolve({ headers, rows });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFieldMapping = (header: string, field: string) => {
    if (field === '') {
      const newMapping = {...mappedFields};
      delete newMapping[header];
      setMappedFields(newMapping);
    } else {
      setMappedFields({
        ...mappedFields,
        [header]: field
      });
    }
  };

  const suggestMapping = () => {
    if (!filePreview) return;
    
    const newMapping: Record<string, string> = {};
    filePreview.headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      
      if (lowerHeader === 'sku' || lowerHeader.includes('ean') || lowerHeader.includes('code')) {
        newMapping[header] = 'sku';
      } else if (lowerHeader.includes('price') || lowerHeader.includes('eti') || lowerHeader.includes('prezzo')) {
        newMapping[header] = 'price';
      } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva')) {
        newMapping[header] = 'vat';
      } else if (lowerHeader.includes('quantity') || lowerHeader.includes('stock') || lowerHeader.includes('qty')) {
        newMapping[header] = 'quantity';
      } else if (lowerHeader.includes('currency') || lowerHeader.includes('valuta')) {
        newMapping[header] = 'currency';
      } else if (lowerHeader.includes('unit') || lowerHeader.includes('unita')) {
        newMapping[header] = 'unit';
      }
    });
    
    setMappedFields(newMapping);
  };

  const getFieldOptions = () => {
    return [
      { value: 'sku', label: 'SKU/Product Code' },
      { value: 'price', label: 'Price' },
      { value: 'vat', label: 'VAT %' },
      { value: 'quantity', label: 'Quantity' },
      { value: 'currency', label: 'Currency' },
      { value: 'unit', label: 'Unit' }
    ];
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMappedFields({});
    setFileError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['SKU', 'Price', 'VAT', 'Quantity', 'Currency', 'Unit'],
      ['EXAMPLE-SKU-001', '10.50', '22', '100', 'EUR', 'pcs']
    ];
    
    const csvContent = templateData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stock_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile || !filePreview) return;
    
    setIsProcessing(true);
    setFileError(null);
    
    try {
      // Transform file with correct columns
      const transformedFile = await transformFileWithCorrectColumns(selectedFile, mappedFields);
      
      // Upload the transformed file
      const formData = new FormData();
      formData.append('file', transformedFile, selectedFile.name);
      
      const response = await uploadSuppliesCSV(transformedFile, mappedFields);
      
      if (response.success) {
        onSuccess?.();
        handleCancel();
      } else {
        setFileError(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFileError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const convertToCSV = (data: Record<string, any>[]): string => {
    if (data.length === 0) return '';
    
    // Get headers from the first row
    const headers = Object.keys(data[0]);
    
    // Create CSV content with semicolon separator
    const csvRows = [
      headers.join(';'), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain semicolons, quotes, or newlines
          if (typeof value === 'string' && (value.includes(';') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(';')
      )
    ];
    
    return csvRows.join('\n');
  };

  const transformFileWithCorrectColumns = async (file: File, columnMapping: Record<string, string>): Promise<File> => {
    try {
      const fileData = await readFilePreview(file);
      
      // Validate required fields
      const requiredFields = ['sku', 'price', 'vat'];
      const mappedRequiredFields = requiredFields.filter(field => 
        Object.values(columnMapping).includes(field)
      );
      
      if (mappedRequiredFields.length < requiredFields.length) {
        const missingFields = requiredFields.filter(field => !mappedRequiredFields.includes(field));
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please map your CSV columns to these required fields: - SKU/Product Code (usually EAN, SKU, or similar) - Price (usually ETI, PREZZO, or similar) - VAT % (usually IVA, VAT, or similar)`);
      }
      
      // Transform data
      console.log('🔍 File data headers:', fileData.headers);
      console.log('🔍 Column mapping:', columnMapping);
      console.log('🔍 First few rows of original data:', fileData.rows.slice(0, 3));
      
      const newRows = fileData.rows.map((originalRow, rowIndex) => {
        const newRow: Record<string, any> = {};
        
        // Map each column
        Object.entries(columnMapping).forEach(([originalHeader, targetField]) => {
          // Find the header index, handling potential spaces
          const headerIndex = fileData.headers.findIndex(h => h.trim() === originalHeader.trim());
          if (headerIndex !== -1 && originalRow[headerIndex] !== undefined) {
            newRow[targetField] = originalRow[headerIndex];
            console.log(`🔍 Mapped "${originalHeader}" -> "${targetField}": ${originalRow[headerIndex]}`);
      } else {
            console.log(`⚠️ Could not find header "${originalHeader}" in headers:`, fileData.headers);
          }
        });
        
        // Log first few rows for debugging
        if (rowIndex < 3) {
          console.log(`🔍 Row ${rowIndex + 1} original:`, originalRow);
          console.log(`🔍 Row ${rowIndex + 1} transformed:`, newRow);
        }
        
        return newRow;
      });
      
      console.log('🔍 First few transformed rows:', newRows.slice(0, 3));
      
      // Convert to CSV format
      const csvContent = convertToCSV(newRows);
      console.log('🔍 Generated CSV content (first 500 chars):', csvContent.substring(0, 500));
      console.log('🔍 CSV headers:', csvContent.split('\n')[0]);
      
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return new File([csvBlob], file.name.replace(/\.[^/.]+$/, '.csv'), { type: 'text/csv' });
    } catch (error) {
      console.error('❌ File transformation failed:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    uploadProgress.stopPolling();
    setSelectedFile(null);
    setFilePreview(null);
    setFileError(null);
    setMappedFields({});
    setIsProcessing(false);
    setActiveStep(0);
    onClose();
  };

  const dialogActions = (
    <>
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
          {activeStep === 0 ? 'Next: Map Columns' : 'Next: Preview & Upload'}
        </Button>
      ) : (
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleUpload}
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
          {isProcessing ? 'Uploading...' : 'Upload Stock'}
        </Button>
      )}
    </>
  );

  return (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            
      <ModernDialog
        open={open}
        onClose={handleCancel}
        title="Upload Stock Levels"
        steps={steps}
        activeStep={activeStep}
        actions={dialogActions}
      >
        {/* Step 0: Upload File */}
        {activeStep === 0 && (
          <>
            <FileUploadArea
              selectedFile={selectedFile}
              isDragging={isDragging}
              onFileClick={handleFileClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onRemoveFile={handleRemoveFile}
              onDownloadTemplate={downloadTemplate}
              accept=".xlsx,.xls,.csv"
              maxSize="10MB"
            />
            
            {fileError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {fileError}
              </Alert>
            )}
          </>
        )}

        {/* Step 1: Map Columns */}
        {activeStep === 1 && filePreview && (
          <>
            <ColumnMappingTable
              headers={filePreview.headers}
              mappedFields={mappedFields}
              onFieldMapping={handleFieldMapping}
              onSuggestMapping={suggestMapping}
              getFieldOptions={getFieldOptions}
              previewData={filePreview.rows}
              showPreview={true}
            />
            
            {fileError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {fileError}
              </Alert>
            )}
          </>
        )}

        {/* Step 2: Preview & Upload */}
        {activeStep === 2 && filePreview && (
          <>
            <DataPreviewTable
              headers={filePreview.headers}
              data={filePreview.rows}
              mappedFields={mappedFields}
              maxRows={10}
              title="Stock Data Preview"
            />
            
            {fileError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {fileError}
              </Alert>
            )}
            
            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  Uploading stock data...
            </Typography>
              </Box>
            )}
          </>
        )}
      </ModernDialog>
    </>
  );
};

export default SupplierStockUploadModal; 