import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { uploadSuppliesAdminCSV, getAllEntities, createEntity, Entity } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks';
import { ModernDialog, FileUploadArea, ColumnMappingTable, DataPreviewTable } from './upload';
import SearchableDropdown from './SearchableDropdown';
import * as XLSX from 'xlsx';

interface AdminStockManagementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FilePreviewData {
  headers: string[];
  rows: any[][];
}

const AdminStockManagementModal: React.FC<AdminStockManagementModalProps> = ({
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
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  
  // New entity creation states
  const [showCreateEntityDialog, setShowCreateEntityDialog] = useState(false);
  const [newEntityData, setNewEntityData] = useState({
    entityName: '',
    entityType: 'SUPPLIER' as 'SUPPLIER' | 'MANAGER' | 'PHARMACY' | 'ADMIN',
    country: '',
    address: '',
    vatNumber: '',
    email: '',
    phone: '',
    status: 'ACTIVE' as const
  });
  const [creatingEntity, setCreatingEntity] = useState(false);
  
  // Stepper configuration
  const steps = ['Select Supplier', 'Upload File', 'Map Columns', 'Preview & Upload'];
  
  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch entities from API
  const fetchEntities = async () => {
    try {
      setLoadingEntities(true);
      const fetchedEntities = await getAllEntities();
      console.log('🔍 Fetched entities for AdminStockManagementModal:', fetchedEntities);
      console.log('🔍 Entity types found:', fetchedEntities.map(e => e.entityType));
      setEntities(fetchedEntities);
    } catch (error) {
      console.error('Error fetching entities:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Load entities when modal opens
  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open]);

  // Handle new entity creation
  const handleCreateEntity = async () => {
    if (!newEntityData.entityName.trim()) {
      setFileError('Entity name is required');
      return;
    }

    setCreatingEntity(true);
    setFileError(null);

    try {
      const createdEntity = await createEntity(newEntityData);
      console.log('✅ New entity created:', createdEntity);
      
      // Refresh entities list
      await fetchEntities();
      
      // Select the newly created entity
      setSelectedSupplier(createdEntity.id);
      
      // Close dialog and reset form
      setShowCreateEntityDialog(false);
      setNewEntityData({
        entityName: '',
        entityType: 'SUPPLIER' as 'SUPPLIER' | 'MANAGER' | 'PHARMACY' | 'ADMIN',
        country: '',
        address: '',
        vatNumber: '',
        email: '',
        phone: '',
        status: 'ACTIVE' as const
      });
      
    } catch (error) {
      console.error('❌ Error creating entity:', error);
      setFileError(error instanceof Error ? error.message : 'Failed to create entity');
    } finally {
      setCreatingEntity(false);
    }
  };

  const handleNewEntityDataChange = (field: string, value: string) => {
    setNewEntityData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetNewEntityForm = () => {
    setNewEntityData({
      entityName: '',
      entityType: 'SUPPLIER' as 'SUPPLIER' | 'MANAGER' | 'PHARMACY' | 'ADMIN',
      country: '',
      address: '',
      vatNumber: '',
      email: '',
      phone: '',
      status: 'ACTIVE' as const
    });
    setFileError(null);
  };

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
    if (activeStep === 0 && selectedSupplier) {
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
    if (activeStep === 0) return selectedSupplier !== '';
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
        } else if (lowerHeader.includes('supplier') && (lowerHeader.includes('id') || lowerHeader.includes('code'))) {
          newMapping[header] = 'supplierId';
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
    console.log('🔍 Available headers for auto-mapping:', filePreview.headers);
    
    filePreview.headers.forEach(header => {
      const lowerHeader = header.toLowerCase().trim();
      console.log(`🔍 Checking header: "${header}" (lowercase: "${lowerHeader}")`);
      
      if (lowerHeader === 'sku' || lowerHeader.includes('minsan') || lowerHeader.includes('ean') || lowerHeader.includes('code') || lowerHeader.includes('barcode')) {
        newMapping[header] = 'sku';
        console.log(`✅ Mapped "${header}" → sku`);
      } else if (lowerHeader.includes('price') || lowerHeader.includes('eti') || lowerHeader.includes('prezzo') || lowerHeader.includes('pubblico')) {
        newMapping[header] = 'price';
        console.log(`✅ Mapped "${header}" → price`);
      } else if (lowerHeader.includes('vat') || lowerHeader.includes('iva') || lowerHeader.includes('aliquota') || lowerHeader.includes('imposta')) {
        newMapping[header] = 'vat';
        console.log(`✅ Mapped "${header}" → vat`);
      } else if (lowerHeader.includes('currency') || lowerHeader.includes('valuta') || lowerHeader.includes('euro') || lowerHeader.includes('eur')) {
        newMapping[header] = 'currency';
        console.log(`✅ Mapped "${header}" → currency`);
      } else if (lowerHeader.includes('quantity') || lowerHeader.includes('stock') || lowerHeader.includes('qty') || lowerHeader.includes('quantita') || lowerHeader.includes('scorte')) {
        newMapping[header] = 'quantity';
        console.log(`✅ Mapped "${header}" → quantity`);
      } else if (lowerHeader.includes('unit') || lowerHeader.includes('unita') || lowerHeader.includes('measure') || lowerHeader.includes('misura') || lowerHeader.includes('pezzi')) {
        newMapping[header] = 'unit';
        console.log(`✅ Mapped "${header}" → unit`);
      } else if (lowerHeader.includes('notes') || lowerHeader.includes('note') || lowerHeader.includes('comment') || lowerHeader.includes('note') || lowerHeader.includes('osservazioni')) {
        newMapping[header] = 'notes';
        console.log(`✅ Mapped "${header}" → notes`);
      } else if (lowerHeader.includes('supplier') && (lowerHeader.includes('id') || lowerHeader.includes('code'))) {
        newMapping[header] = 'supplierId';
        console.log(`✅ Mapped "${header}" → supplierId`);
      } else {
        console.log(`❌ No mapping found for "${header}"`);
      }
    });
    
    console.log('🔍 Final auto-mapping result:', newMapping);
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
      { value: 'supplierId', label: 'Supplier ID' }
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
    // Template with exact headers that backend expects: sku;price;vat;currency;quantity;unit;notes
    // Admin version includes supplierId for multi-supplier management
    const templateData = [
      ['sku', 'price', 'vat', 'currency', 'quantity', 'unit', 'notes', 'supplierId'],
      ['935621793', '19.90', '10', 'EUR', '50', 'pcs', 'Stock disponibile', 'SUPPLIER_001'],
      ['909125460', '39.90', '22', 'EUR', '25', 'pcs', 'Riordino necessario', 'SUPPLIER_002'],
      ['902603303', '24.50', '10', 'EUR', '100', 'pcs', 'Scorte elevate', 'SUPPLIER_001']
    ];
    
    const csvContent = templateData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin_stock_template.csv';
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
      
      // Upload the transformed file with entityId
      const response = await uploadSuppliesAdminCSV(transformedFile, mappedFields, selectedSupplier);
      
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
      
      // No validation - proceed with whatever fields are mapped
      console.log('📋 Proceeding with mapped fields:', Object.values(columnMapping).filter(field => field && field.trim() !== ''));
      
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
    setSelectedSupplier('');
    setEntities([]);
    setShowCreateEntityDialog(false);
    resetNewEntityForm();
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
          {activeStep === 0 ? 'Next: Upload File' : 
           activeStep === 1 ? 'Next: Map Columns' : 'Next: Preview & Upload'}
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
        title="Manage Supplier Stock for a 3rd party Entity"
        steps={steps}
        activeStep={activeStep}
        actions={dialogActions}
      >
        {/* Step 0: Select Supplier */}
        {activeStep === 0 && (
          <Box sx={{ py: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
              Select Supplier
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
              Choose the supplier whose stock you want to manage
            </Typography>
            
            <SearchableDropdown
              options={entities
                .filter(entity => 
                  (entity.entityType === 'SUPPLIER' || 
                   entity.entityType === 'MANAGER' || 
                   entity.entityType === 'PHARMACY' ||
                   entity.entityType === 'company') &&
                  (entity.status === 'ACTIVE' || !entity.status)
                )
                .map(entity => ({
                  id: entity.id,
                  name: entity.entityName,
                  type: entity.entityType,
                  country: entity.country,
                  status: entity.status
                }))
              }
              selectedId={selectedSupplier}
              onSelect={setSelectedSupplier}
              placeholder="Select a supplier"
              searchPlaceholder="Search suppliers..."
              loading={loadingEntities}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedSupplier('');
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
                onClick={fetchEntities}
                disabled={loadingEntities}
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
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowCreateEntityDialog(true)}
                sx={{
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.875rem'
                }}
              >
                + New Entity
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 1: Upload File */}
        {activeStep === 1 && (
          <Box sx={{ py: 1 }}>
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
              <Alert severity="error" sx={{ mt: 1.5, py: 1 }}>
                {fileError}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: Map Columns */}
        {activeStep === 2 && filePreview && (
          <Box sx={{ py: 1 }}>
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
              <Alert severity="error" sx={{ mt: 1.5, py: 1 }}>
                {fileError}
              </Alert>
            )}
          </Box>
        )}

        {/* Step 3: Preview & Upload */}
        {activeStep === 3 && filePreview && (
          <Box sx={{ py: 1 }}>
            <DataPreviewTable
              headers={filePreview.headers}
              data={filePreview.rows}
              mappedFields={mappedFields}
              maxRows={10}
              title="Stock Data Preview"
            />
            
            {fileError && (
              <Alert severity="error" sx={{ mt: 1.5, py: 1 }}>
                {fileError}
              </Alert>
            )}
            
            {isProcessing && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 0.5, textAlign: 'center', fontSize: '0.875rem' }}>
                  Uploading stock data for {entities.find(e => e.id === selectedSupplier)?.entityName}...
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </ModernDialog>

      {/* Create New Entity Dialog */}
      <Dialog
        open={showCreateEntityDialog}
        onClose={() => {
          setShowCreateEntityDialog(false);
          resetNewEntityForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1, fontSize: '1.1rem' }}>New Entity</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Entity Name *"
                value={newEntityData.entityName}
                onChange={(e) => handleNewEntityDataChange('entityName', e.target.value)}
                required
              />
              <FormControl fullWidth size="small">
                <InputLabel>Entity Type *</InputLabel>
                <Select
                  value={newEntityData.entityType}
                  label="Entity Type *"
                  onChange={(e) => handleNewEntityDataChange('entityType', e.target.value)}
                >
                  <MenuItem value="SUPPLIER">Supplier</MenuItem>
                  <MenuItem value="MANAGER">Manager</MenuItem>
                  <MenuItem value="PHARMACY">Pharmacy</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Country"
                value={newEntityData.country}
                onChange={(e) => handleNewEntityDataChange('country', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="VAT Number"
                value={newEntityData.vatNumber}
                onChange={(e) => handleNewEntityDataChange('vatNumber', e.target.value)}
              />
            </Box>
            
            <TextField
              fullWidth
              size="small"
              label="Address"
              value={newEntityData.address}
              onChange={(e) => handleNewEntityDataChange('address', e.target.value)}
              multiline
              rows={2}
            />
            
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                label="Email"
                type="email"
                value={newEntityData.email}
                onChange={(e) => handleNewEntityDataChange('email', e.target.value)}
              />
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={newEntityData.phone}
                onChange={(e) => handleNewEntityDataChange('phone', e.target.value)}
              />
            </Box>
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
              setShowCreateEntityDialog(false);
              resetNewEntityForm();
            }}
            disabled={creatingEntity}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            onClick={handleCreateEntity}
            variant="contained"
            disabled={creatingEntity || !newEntityData.entityName.trim()}
            sx={{
              borderRadius: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {creatingEntity ? 'Creating...' : 'Create Entity'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminStockManagementModal; 