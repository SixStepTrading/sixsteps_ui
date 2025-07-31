import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Step,
  Stepper,
  StepLabel
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { validateCSVHeaders, uploadSuppliesAdminCSV, ColumnMapping, UploadValidationResponse, UploadResponse } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks/useUploadProgress';
import UploadProgressBar from '../../common/atoms/UploadProgressBar';

interface AdminStockManagementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  suppliers: { value: string; label: string }[];
}

const AdminStockManagementModal: React.FC<AdminStockManagementModalProps> = ({
  open,
  onClose,
  onSuccess,
  suppliers
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validation, setValidation] = useState<UploadValidationResponse | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload progress tracking
  const uploadProgress = useUploadProgress({
    onComplete: (result) => {
      console.log('📊 Admin upload completed:', result);
      setIsUploading(false);
      setUploadResult({
        success: true,
        message: result.message || 'Stock update completed successfully',
        processedRows: result.processedRows
      });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('📊 Admin upload progress error:', error);
      setIsUploading(false);
      setError(error.message);
    }
  });

  const steps = ['Select Supplier', 'Upload File', 'Map Columns'];

  // Available field mappings for admin stock management
  const availableFields = [
    { value: '', label: 'Select field...' },
    { value: 'sku', label: 'SKU/Product Code' },
    { value: 'ean', label: 'EAN Code' },
    { value: 'minsan', label: 'MINSAN Code' },
    { value: 'name', label: 'Product Name' },
    { value: 'stock', label: 'Stock Quantity' },
    { value: 'price', label: 'Price' },
    { value: 'vat', label: 'VAT %' }
  ];

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, []);

  const handleFileSelection = async (file: File) => {
    // Validate file type
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError('Invalid file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setValidation(null);
    setColumnMapping({});
    setUploadResult(null);
    
    // Validate headers (reads only first row)
    try {
      setIsValidating(true);
      const validationResult = await validateCSVHeaders(file);
      setValidation(validationResult);
      
      // Auto-apply suggested mappings
      if (validationResult.suggestedMappings) {
        setColumnMapping(validationResult.suggestedMappings);
      }
      
      // Move to next step
      setActiveStep(2);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error validating file');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleSupplierSelection = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setActiveStep(1);
  };

  const handleColumnMappingChange = (column: string, field: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [column]: field
    }));
  };

  const handleUpload = async () => {
    console.log('🎯 Upload button clicked!', {
      hasFile: !!selectedFile,
      hasValidation: !!validation,
      hasSupplier: !!selectedSupplier,
      columnMapping
    });

    if (!selectedFile || !validation || !selectedSupplier) {
      console.error('❌ Missing required data for upload:', {
        selectedFile: !!selectedFile,
        validation: !!validation, 
        selectedSupplier: !!selectedSupplier
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      setUploadResult(null);
      
      console.log('🚀 Starting admin stock management upload...');
      console.log('📋 Final upload parameters:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        supplier: selectedSupplier,
        mappingKeys: Object.keys(columnMapping),
        mappingValues: Object.values(columnMapping)
      });

      const result = await uploadSuppliesAdminCSV(selectedFile, columnMapping, selectedSupplier);
      
      if (result.uploadId) {
        console.log('📊 Upload ID received:', result.uploadId);
        console.log('🔄 Starting progress tracking...');
        uploadProgress.startPolling(result.uploadId);
      } else {
        // Fallback for immediate response (no progress tracking)
        console.log('⏭️ No upload ID received, using immediate response');
        setIsUploading(false);
        setUploadResult(result);
        
        if (result.success && onSuccess) {
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('❌ Admin upload error:', error);
      setIsUploading(false);
      setError(error instanceof Error ? error.message : 'Error uploading file');
    }
  };

  const handleClose = () => {
    // Stop any ongoing progress polling
    uploadProgress.stopPolling();
    
    setActiveStep(0);
    setSelectedSupplier('');
    setSelectedFile(null);
    setValidation(null);
    setColumnMapping({});
    setUploadResult(null);
    setError(null);
    setIsDragging(false);
    setIsUploading(false);
    setIsValidating(false);
    onClose();
  };

  const canUpload = selectedFile && validation && selectedSupplier && Object.keys(columnMapping).length > 0;
  const selectedSupplierName = suppliers.find(s => s.value === selectedSupplier)?.label || '';

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, overflow: 'hidden' }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'warning.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon />
          <Typography variant="h6">Manage Supplier Stock</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
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
      
      <DialogContent sx={{ p: 3 }}>
        {/* Upload Progress */}
        {(isValidating || isUploading) && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {isValidating ? 'Validating file headers...' : 'Uploading stock data...'}
            </Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Upload Progress Bar */}
        <UploadProgressBar
          progress={uploadProgress.progress}
          isPolling={uploadProgress.isPolling}
          error={uploadProgress.error}
          onRetry={uploadProgress.retry}
          showDetails={true}
        />

        {/* Success Display - Only show if no progress tracking or completed without progress */}
        {uploadResult?.success && !uploadProgress.progress && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            <Typography variant="subtitle2">Upload Successful!</Typography>
            <Typography variant="body2">
              {uploadResult.processedRows} rows processed for {selectedSupplierName}.
            </Typography>
          </Alert>
        )}

        {/* Step 1: Supplier Selection */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon />
              Select Supplier
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Choose the supplier whose stock levels you want to update:
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Select Supplier</InputLabel>
              <Select
                value={selectedSupplier}
                label="Select Supplier"
                onChange={(e) => handleSupplierSelection(e.target.value)}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier.value} value={supplier.value}>
                    {supplier.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedSupplier && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  You will be updating stock levels for: <strong>{selectedSupplierName}</strong>
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Step 2: File Upload */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CloudUploadIcon />
              Upload Stock File for {selectedSupplierName}
            </Typography>
            
            {!selectedFile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileInputChange}
                />
                
                <Box
                  sx={{
                    width: '100%',
                    height: 200,
                    border: `2px dashed ${isDragging ? 'warning.main' : 'grey.300'}`,
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isDragging ? 'rgba(255, 152, 0, 0.04)' : 'grey.50',
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
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                  <Typography variant="subtitle1">
                    Drag & Drop stock file here
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    or click to select file
                  </Typography>
                  <Button variant="outlined" size="small" color="warning">
                    Select Stock File
                  </Button>
                </Box>
              </>
            )}

            {/* Selected File Info */}
            {selectedFile && (
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AssignmentIcon color="primary" />
                  <Typography variant="subtitle2">Selected File:</Typography>
                  <Chip label={selectedFile.name} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Step 3: Column Mapping */}
        {activeStep === 2 && validation && validation.detectedColumns.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon />
              Map CSV Columns to Fields
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Map your CSV columns to the corresponding fields for {selectedSupplierName}:
            </Typography>
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>CSV Column</strong></TableCell>
                    <TableCell><strong>Maps to Field</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validation.detectedColumns.map((column) => (
                    <TableRow key={column}>
                      <TableCell>
                        <Chip label={column} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={columnMapping[column] || ''}
                            onChange={(e) => handleColumnMappingChange(column, e.target.value)}
                          >
                            {availableFields.map((field) => (
                              <MenuItem key={field.value} value={field.value}>
                                {field.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Guidelines */}
        {activeStep === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Admin Stock Management:
            </Typography>
            <Typography variant="body2" component="div">
              • Select a supplier to update their stock levels<br/>
              • Upload CSV/Excel files with product and stock data<br/>
              • Map columns to ensure accurate data import<br/>
              • Changes will affect the selected supplier's inventory
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        
        {activeStep === 0 && (
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => selectedSupplier && setActiveStep(1)}
            disabled={!selectedSupplier}
            startIcon={<BusinessIcon />}
          >
            Continue with {selectedSupplierName || 'Selected Supplier'}
          </Button>
        )}
        
        {activeStep === 1 && selectedFile && (
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => setActiveStep(2)}
            disabled={!validation}
            startIcon={<AssignmentIcon />}
          >
            Configure Mapping
          </Button>
        )}
        
        {activeStep === 2 && (
          <Button 
            variant="contained" 
            color="warning"
            onClick={handleUpload}
            disabled={!canUpload || isUploading}
            startIcon={isUploading ? null : <CloudUploadIcon />}
          >
            {isUploading ? 'Uploading...' : 'Update Stock Data'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AdminStockManagementModal; 