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
  TableRow
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { validateCSVHeaders, uploadSuppliesCSV, ColumnMapping, UploadValidationResponse, UploadResponse } from '../../../utils/api';
import { useUploadProgress } from '../../../hooks/useUploadProgress';
import UploadProgressBar from '../../common/atoms/UploadProgressBar';

interface SupplierStockUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SupplierStockUploadModal: React.FC<SupplierStockUploadModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
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
      console.log('📊 Upload completed:', result);
      setIsUploading(false);
      setUploadResult({
        success: true,
        message: result.message || 'Upload completed successfully',
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
      console.error('📊 Upload progress error:', error);
      setIsUploading(false);
      setError(error.message);
    }
  });

  // Available field mappings for supplies
  const availableFields = [
    { value: '', label: 'Select field...' },
    { value: 'sku', label: 'SKU/Product Code' },
    { value: 'ean', label: 'EAN Code' },
    { value: 'minsan', label: 'MINSAN Code' },
    { value: 'name', label: 'Product Name' },
    { value: 'stock', label: 'Stock Quantity' },
    { value: 'price', label: 'Price' },
    { value: 'vat', label: 'VAT %' },
    { value: 'supplier', label: 'Supplier' }
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
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error validating file');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleColumnMappingChange = (column: string, field: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [column]: field
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !validation) return;
    
    try {
      setIsUploading(true);
      setError(null);
      setUploadResult(null);
      
      console.log('🚀 Starting supplier stock upload...');
      const result = await uploadSuppliesCSV(selectedFile, columnMapping);
      
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
      console.error('❌ Upload error:', error);
      setIsUploading(false);
      setError(error instanceof Error ? error.message : 'Error uploading file');
    }
  };

  const handleClose = () => {
    // Stop any ongoing progress polling
    uploadProgress.stopPolling();
    
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

  const canUpload = selectedFile && validation && Object.keys(columnMapping).length > 0;

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
        bgcolor: 'success.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUploadIcon />
          <Typography variant="h6">Upload Stock Levels</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
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
              {uploadResult.processedRows} rows processed successfully.
            </Typography>
          </Alert>
        )}

        {/* File Upload Area */}
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
                border: `2px dashed ${isDragging ? 'success.main' : 'grey.300'}`,
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: isDragging ? 'rgba(46, 125, 50, 0.04)' : 'grey.50',
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
                Drag & Drop your stock file here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to select file
              </Typography>
              <Button variant="outlined" size="small" color="success">
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

        {/* Column Mapping */}
        {validation && validation.detectedColumns.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentIcon />
              Map CSV Columns to Fields
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Map your CSV columns to the corresponding fields in our system:
            </Typography>
            
            <TableContainer>
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
          </Paper>
        )}

        {/* Guidelines */}
        {!selectedFile && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Stock Upload Guidelines:
            </Typography>
            <Typography variant="body2" component="div">
              • CSV/Excel files only (.csv, .xls, .xlsx)<br/>
              • First row should contain column headers<br/>
              • Include product identifiers (EAN, MINSAN, or Name)<br/>
              • Include stock quantities<br/>
              • File will be validated before upload
            </Typography>
          </Alert>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="success"
          onClick={handleUpload}
          disabled={!canUpload || isUploading}
          startIcon={isUploading ? null : <CloudUploadIcon />}
        >
          {isUploading ? 'Uploading...' : 'Upload Stock Data'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupplierStockUploadModal; 