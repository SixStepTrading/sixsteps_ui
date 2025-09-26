import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  FormControl,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { uploadSuppliesCSV, getCurrentUserEntity, updateEntity, Entity } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks';
import { useUser } from '../../../contexts/UserContext';
import { ModernDialog, FileUploadArea, ColumnMappingTable, DataPreviewTable } from './upload';
import UploadResultModal from './UploadResultModal';
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
  const { user } = useUser();
  
  // State variables
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState<FilePreviewData | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mappedFields, setMappedFields] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Warehouse selection states
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [userEntity, setUserEntity] = useState<Entity | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  
  // Warehouse creation states
  const [showCreateWarehouseDialog, setShowCreateWarehouseDialog] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState('');
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);
  
  // Stepper configuration
  const steps = ['Select Warehouse', 'Upload File', 'Map Columns', 'Preview & Upload'];
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user entity from API
  const fetchUserEntity = useCallback(async () => {
    setLoadingEntity(true);
    setFileError(null);
    
    try {
      const currentUserEntity = await getCurrentUserEntity();
      
      setUserEntity(currentUserEntity);
    } catch (error) {
      setFileError('Failed to load entity information. Please try again.');
    } finally {
      setLoadingEntity(false);
    }
  }, []);

  // Fetch user entity on component mount
  useEffect(() => {
    if (open) {
      fetchUserEntity();
    }
  }, [open, fetchUserEntity]);

  // Handle warehouse creation
  const handleCreateWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      setFileError('Warehouse name is required');
      return;
    }
    if (!userEntity) {
      setFileError('Please select an entity first');
      return;
    }
    
    setCreatingWarehouse(true);
    setFileError(null);
    
    try {
      const updatedWarehouses = [...(userEntity.warehouses || []), newWarehouseName.trim()];
      await updateEntity({
        entityId: userEntity.id,
        entityName: userEntity.entityName,
        entityType: userEntity.entityType,
        address: userEntity.address || '',
        phone: userEntity.phone || '',
        warehouses: updatedWarehouses
      });
      
      await fetchUserEntity();
      setSelectedWarehouse(newWarehouseName.trim());
      setShowCreateWarehouseDialog(false);
      setNewWarehouseName('');
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Failed to create warehouse');
    } finally {
      setCreatingWarehouse(false);
    }
  };

  // Upload progress tracking
  const uploadProgress = useUploadProgress({
    onComplete: (result: any) => {
      setIsProcessing(false);
      if (result) {
        // Show result modal
        setUploadResult(result);
        setShowResultModal(true);
      }
    },
    onError: (error: Error) => {
      setIsProcessing(false);
      setFileError(error.message);
    }
  });

  // Step navigation handlers
  const handleNext = () => {
    if (activeStep === 0 && selectedWarehouse) {
      setActiveStep(1);
    } else if (activeStep === 1 && selectedFile) {
      setActiveStep(2);
    } else if (activeStep === 2 && Object.keys(mappedFields).length > 0) {
      setActiveStep(3);
    }
  };
  
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  
  const canProceed = () => {
    if (activeStep === 0) return selectedWarehouse !== '';
    if (activeStep === 1) return selectedFile !== null;
    if (activeStep === 2) return Object.keys(mappedFields).filter(key => mappedFields[key]).length > 0;
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
        
        if (lowerHeader === 'sku' || lowerHeader.includes('minsan') || lowerHeader.includes('ean') || lowerHeader.includes('code')) {
          newMapping[header] = 'sku';
        } else if (lowerHeader.includes('price') || lowerHeader.includes('eti') || lowerHeader.includes('prezzo')) {
          newMapping[header] = 'price';
        } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva')) {
          newMapping[header] = 'vat';
        } else if (lowerHeader.includes('currency') || lowerHeader.includes('valuta')) {
          newMapping[header] = 'currency';
        } else if (lowerHeader.includes('quantity') || lowerHeader.includes('stock') || lowerHeader.includes('qty')) {
          newMapping[header] = 'quantity';
        } else if (lowerHeader.includes('unit') || lowerHeader.includes('unita') || lowerHeader.includes('measure')) {
          newMapping[header] = 'unit';
        } else if (lowerHeader.includes('notes') || lowerHeader.includes('note') || lowerHeader.includes('comment')) {
          newMapping[header] = 'notes';
        }
      });
      
      
      setMappedFields(newMapping);
      
      // Auto-advance to next step if we have a file
      if (selectedFile && activeStep === 0) {
        setActiveStep(1);
      }
      
    } catch (error) {
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
      
      if (lowerHeader === 'sku' || lowerHeader.includes('minsan') || lowerHeader.includes('ean') || lowerHeader.includes('code') || lowerHeader.includes('barcode')) {
        newMapping[header] = 'sku';
      } else if (lowerHeader.includes('price') || lowerHeader.includes('eti') || lowerHeader.includes('prezzo') || lowerHeader.includes('pubblico')) {
        newMapping[header] = 'price';
      } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva') || lowerHeader.includes('aliquota') || lowerHeader.includes('imposta')) {
        newMapping[header] = 'vat';
      } else if (lowerHeader.includes('currency') || lowerHeader.includes('valuta') || lowerHeader.includes('euro') || lowerHeader.includes('eur')) {
        newMapping[header] = 'currency';
      } else if (lowerHeader.includes('quantity') || lowerHeader.includes('stock') || lowerHeader.includes('qty') || lowerHeader.includes('quantita') || lowerHeader.includes('scorte')) {
        newMapping[header] = 'quantity';
      } else if (lowerHeader.includes('unit') || lowerHeader.includes('unita') || lowerHeader.includes('measure') || lowerHeader.includes('misura') || lowerHeader.includes('pezzi')) {
        newMapping[header] = 'unit';
      } else if (lowerHeader.includes('notes') || lowerHeader.includes('note') || lowerHeader.includes('comment') || lowerHeader.includes('note') || lowerHeader.includes('osservazioni')) {
        newMapping[header] = 'notes';
      } else {
      }
    });
    
    setMappedFields(newMapping);
  };

  const getFieldOptions = () => {
    return [
      { value: '', label: 'Ignore this column' },
      { value: 'sku', label: 'Sku/Minsan' },
      { value: 'price', label: 'Offered Price' },
      { value: 'vat', label: 'VAT' },
      { value: 'currency', label: 'Currency' },
      { value: 'quantity', label: 'Stock Quantity' },
      { value: 'unit', label: 'Unit of Measurement' },
      { value: 'notes', label: 'Stock Notes' },
      { value: 'warehouse', label: 'Warehouse (auto-filled)' }
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
    // Template with exact headers that backend expects: sku;price;vat;currency;quantity;unit;notes;warehouse
    const templateData = [
      ['sku', 'price', 'vat', 'currency', 'quantity', 'unit', 'notes', 'warehouse'],
      ['935621793', '19.90', '10', 'EUR', '50', 'pcs', 'Stock disponibile', 'WAREHOUSE_1'],
      ['909125460', '39.90', '22', 'EUR', '25', 'pcs', 'Riordino necessario', 'WAREHOUSE_1'],
      ['902603303', '24.50', '10', 'EUR', '100', 'pcs', 'Scorte elevate', 'WAREHOUSE_1']
    ];
    
    const csvContent = templateData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supplier_stock_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile || !filePreview || !user?.id) return;
    
    setIsProcessing(true);
    setFileError(null);
    
    try {
      // Transform file with correct columns
      const transformedFile = await transformFileWithCorrectColumns(selectedFile, mappedFields);
      
      // Upload the transformed file with user entity ID and selected warehouse
      const response = await uploadSuppliesCSV(transformedFile, mappedFields, user.id, selectedWarehouse);
      
      if (response.success) {
        onSuccess?.();
        handleCancel();
      } else {
        setFileError(response.message || 'Upload failed');
      }
    } catch (error) {
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
      
      // No validation - proceed with whatever fields are mapped
      
      // Transform data
      
      const newRows = fileData.rows.map((originalRow, rowIndex) => {
        const newRow: Record<string, any> = {};
        
        // Map each column
        Object.entries(columnMapping).forEach(([originalHeader, targetField]) => {
          // Find the header index, handling potential spaces
          const headerIndex = fileData.headers.findIndex(h => h.trim() === originalHeader.trim());
          if (headerIndex !== -1 && originalRow[headerIndex] !== undefined) {
            newRow[targetField] = originalRow[headerIndex];
          } else {
          }
        });
        
        // Add warehouse column automatically with selected warehouse value
        if (selectedWarehouse) {
          newRow.warehouse = selectedWarehouse;
        }
        
        // Log first few rows for debugging
        if (rowIndex < 3) {
        }
        
        return newRow;
      });
      
      
      // Convert to CSV format
      const csvContent = convertToCSV(newRows);
      
      const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return new File([csvBlob], file.name.replace(/\.[^/.]+$/, '.csv'), { type: 'text/csv' });
    } catch (error) {
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
    setSelectedWarehouse('');
    setUserEntity(null);
    setShowCreateWarehouseDialog(false);
    setNewWarehouseName('');
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
      
      {activeStep < 3 ? (
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
        title="Upload your Stock Levels"
        steps={steps}
        activeStep={activeStep}
        actions={dialogActions}
      >
        {/* Step 0: Select Warehouse */}
        {activeStep === 0 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
              Select Warehouse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
              Choose the warehouse where you want to upload your stock levels
            </Typography>
            
            {loadingEntity ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <LinearProgress sx={{ width: '100%' }} />
              </Box>
            ) : userEntity ? (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.9rem', fontWeight: 600 }}>
                  Warehouse
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: 1.5 }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a warehouse</em>
                    </MenuItem>
                    {userEntity.warehouses?.map((warehouse) => (
                      <MenuItem key={warehouse} value={warehouse}>
                        {warehouse}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Create New Warehouse Button */}
                <Box sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowCreateWarehouseDialog(true)}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 500,
                      px: 2,
                      py: 0.5,
                      fontSize: '0.875rem'
                    }}
                  >
                    + Create New Warehouse
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity="error" sx={{ mt: 2 }}>
                Unable to load your entity information. Please contact support.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedWarehouse('');
                  setFileError(null);
                }}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem'
                }}
              >
                Reset
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={fetchUserEntity}
                disabled={loadingEntity}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem'
                }}
              >
                Refresh
              </Button>
            </Box>
            
            {fileError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {fileError}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 1: Upload File */}
        {activeStep === 1 && (
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

        {/* Step 2: Map Columns */}
        {activeStep === 2 && filePreview && (
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

        {/* Step 3: Preview & Upload */}
        {activeStep === 3 && filePreview && (
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

      {/* Create New Warehouse Dialog */}
      <Dialog
        open={showCreateWarehouseDialog}
        onClose={() => {
          setShowCreateWarehouseDialog(false);
          setNewWarehouseName('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.1rem' }}>Create New Warehouse</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Warehouse Name *"
              value={newWarehouseName}
              onChange={(e) => setNewWarehouseName(e.target.value)}
              placeholder="e.g., WAREHOUSE_1, Main Warehouse, etc."
              required
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              This warehouse will be added to your entity: <strong>{userEntity?.entityName}</strong>
            </Typography>
          </Box>
          
          {fileError && (
            <Alert severity="error" sx={{ mt: 1.5, py: 1 }}>
              {fileError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ pt: 1, pb: 2 }}>
          <Button
            size="small"
            onClick={() => {
              setShowCreateWarehouseDialog(false);
              setNewWarehouseName('');
            }}
            disabled={creatingWarehouse}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            onClick={handleCreateWarehouse}
            variant="contained"
            disabled={creatingWarehouse || !newWarehouseName.trim()}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {creatingWarehouse ? 'Creating...' : 'Create Warehouse'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Upload Result Modal */}
      <UploadResultModal
        open={showResultModal}
        onClose={() => {
          setShowResultModal(false);
          setUploadResult(null);
          onSuccess?.();
          handleCancel(); // Reset form and close main modal
        }}
        result={uploadResult}
        uploadType="stock"
      />
    </>
  );
};

export default SupplierStockUploadModal; 