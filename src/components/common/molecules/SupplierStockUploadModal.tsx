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
  TextField,
  Collapse,
  Checkbox,
  FormControlLabel
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
import * as XLSX from 'xlsx';

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
  const [showSupplierField, setShowSupplierField] = useState(false);
  const [customSupplier, setCustomSupplier] = useState<string>('');
  
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

  // Available field mappings for supplies - UPDATED FOR BACKEND API
  const availableFields = [
    { value: '', label: 'Select field...' },
    { value: 'sku', label: 'SKU/Product Code' },
    { value: 'ean', label: 'EAN Code' },
    { value: 'minsan', label: 'MINSAN Code' },
    { value: 'name', label: 'Product Name' },
    { value: 'quantity', label: 'Stock Quantity' }, // Changed from 'stock' to 'quantity'
    { value: 'price', label: 'Price' },
    { value: 'vat', label: 'VAT %' },
    { value: 'currency', label: 'Currency' },
    { value: 'unit', label: 'Unit of Measure' },
    { value: 'supplier', label: 'Supplier' }
  ];

  // Helper to read complete file data (COPIED FROM AddProductModal)
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

  // Transform file with API-compliant column names for supplier stock uploads - COPIED FROM AddProductModal
  const transformFileWithCorrectColumns = async (file: File, columnMapping: ColumnMapping): Promise<File> => {
    try {
      console.log('🔄 Starting supplier stock file transformation...', { fileName: file.name, mapping: columnMapping });
      
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
      
      console.log('📊 Supplier stock transformation complete:', {
        originalHeaders: fileData.headers,
        newHeaders: newHeaders,
        rowCount: newRows.length,
        sampleRow: newRows[0]
      });
      
      // Validate that we have the required API fields for stock uploads
      const requiredFields = ['sku', 'quantity']; // Backend expects 'quantity' not 'stock'
      const missingFields = requiredFields.filter(field => !newHeaders.includes(field));
      
      if (missingFields.length > 0) {
        console.warn('⚠️ Missing required stock API fields:', missingFields);
        console.log('💡 Available headers:', newHeaders);
        console.log('🔍 Original mapping:', columnMapping);
      }
      
      // Backend expects exactly: sku;price;vat;currency;quantity;unit
      const backendHeaders = ['sku', 'price', 'vat', 'currency', 'quantity', 'unit'];
      
      // Create new CSV content with EXACT backend format
      const csvContent = [
        backendHeaders.join(';'),
        ...newRows.map(row => 
          backendHeaders.map(header => {
            let value = row[header] || '';
            
            // Add default values for missing fields
            if (value === '' || value === null || value === undefined) {
              switch (header) {
                case 'currency':
                  value = 'EUR'; // Default currency
                  break;
                case 'unit':
                  value = 'PZ'; // Default unit (Pezzi)
                  break;
                case 'vat':
                  value = '22'; // Default VAT for Italy
                  break;
                default:
                  value = '';
              }
            }
            
            // Convert decimal numbers from US format (19.9) to European format (19,9)
            if ((header === 'price' || header === 'vat') && value !== '') {
              if (typeof value === 'number' || (typeof value === 'string' && /^\d+\.?\d*$/.test(value))) {
                value = String(value).replace('.', ',');
              }
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
      console.log('📝 Generated supplier stock CSV preview (first 3 lines):');
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
      
      console.log('✅ Supplier stock file transformation successful:', {
        originalSize: file.size,
        newSize: transformedFile.size,
        newFileName: transformedFile.name,
        columnMapping: columnMapping
      });
      
      return transformedFile;
    } catch (error) {
      console.error('❌ Supplier stock file transformation failed:', error);
      throw error;
    }
  };

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
      
      // Transform file with correct column names that API expects
      const transformedFile = await transformFileWithCorrectColumns(selectedFile, columnMapping);
      console.log('🔄 Supplier stock file transformed with API-compliant column names');
      
      // Debug: Log transformed file details
      console.log('🔍 Transformed supplier stock file ready for upload:');
      console.log('📏 File size:', transformedFile.size, 'bytes');
      console.log('📝 File type:', transformedFile.type);
      console.log('📁 File name:', transformedFile.name);
      
      // Use the properly transformed file directly
      const fileToUpload = transformedFile;
      
      console.log('📤 Uploading transformed supplier stock file:', {
        name: fileToUpload.name,
        size: fileToUpload.size,
        type: fileToUpload.type
      });
      
      // File is already transformed with correct API headers
      // No column mapping needed since headers match API expectations
      console.log('📋 File already has API-compliant headers - no mapping needed');
      
      const result = await uploadSuppliesCSV(fileToUpload, {});
      
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
    setShowSupplierField(false);
    setCustomSupplier('');
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
              {uploadResult.processedRows} rows processed successfully
              {showSupplierField && customSupplier && ` for ${customSupplier}`}.
            </Typography>
          </Alert>
        )}

        {/* Optional Supplier Field */}
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showSupplierField}
                onChange={(e) => setShowSupplierField(e.target.checked)}
              />
            }
            label="Specify custom supplier name (optional)"
          />
          
          <Collapse in={showSupplierField}>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Supplier Name"
                placeholder="Enter supplier name..."
                value={customSupplier}
                onChange={(e) => setCustomSupplier(e.target.value)}
                helperText="This will be used as the supplier identifier for your stock data"
                variant="outlined"
              />
            </Box>
          </Collapse>
        </Box>

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
              • Optionally specify a custom supplier name<br/>
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