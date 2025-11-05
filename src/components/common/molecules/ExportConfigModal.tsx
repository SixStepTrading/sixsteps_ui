import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  Divider,
  Alert,
  Chip,
  Switch,
} from '@mui/material';

// Common MenuProps for all Select components with proper z-index for dark theme
// Using disablePortal to render menu inside Dialog instead of in a separate portal
const DARK_MENU_PROPS = {
  disablePortal: true,
  PaperProps: {
    sx: {
      bgcolor: '#1e1e1e',
      color: '#ffffff',
      '& .MuiMenuItem-root': {
        color: '#ffffff',
        '&:hover': {
          bgcolor: '#2a2a2a'
        },
        '&.Mui-selected': {
          bgcolor: '#2a2a2a',
          '&:hover': {
            bgcolor: '#333333'
          }
        }
      }
    }
  }
};

export interface ExportConfig {
  // Format
  format: 'csv' | 'xlsx';
  
  // CSV specific
  fieldSeparator: ',' | ';' | '\t' | '|';
  decimalSeparator: '.' | ',';
  thousandsSeparator: ',' | '.' | ' ' | 'none';
  
  // Encoding
  encoding: 'utf-8' | 'utf-8-bom' | 'windows-1252' | 'iso-8859-1';
  
  // Date format
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY';
  
  // Currency
  currencySymbol: '€' | '$' | '£' | 'none';
  currencyPosition: 'before' | 'after';
  currencySpace: boolean;
  
  // Options
  includeHeader: boolean;
  includeSupplierNames: boolean; // Admin only
  
  // Performance
  chunkSize: number; // 0 = auto
}

interface ExportConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (config: ExportConfig) => void;
  productCount: number;
  userRole?: string;
  defaultConfig?: Partial<ExportConfig>;
}

// Regional presets
const REGIONAL_PRESETS: Record<string, Partial<ExportConfig>> = {
  'it': {
    fieldSeparator: ';',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    dateFormat: 'DD/MM/YYYY',
    currencySymbol: '€',
    currencyPosition: 'after',
    currencySpace: true,
    encoding: 'utf-8-bom',
  },
  'us': {
    fieldSeparator: ',',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    dateFormat: 'MM/DD/YYYY',
    currencySymbol: '$',
    currencyPosition: 'before',
    currencySpace: false,
    encoding: 'utf-8',
  },
  'uk': {
    fieldSeparator: ',',
    decimalSeparator: '.',
    thousandsSeparator: ',',
    dateFormat: 'DD/MM/YYYY',
    currencySymbol: '£',
    currencyPosition: 'before',
    currencySpace: false,
    encoding: 'utf-8',
  },
  'fr': {
    fieldSeparator: ';',
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    dateFormat: 'DD/MM/YYYY',
    currencySymbol: '€',
    currencyPosition: 'after',
    currencySpace: true,
    encoding: 'utf-8-bom',
  },
};

const ExportConfigModal: React.FC<ExportConfigModalProps> = ({
  open,
  onClose,
  onConfirm,
  productCount,
  userRole = 'Buyer',
  defaultConfig,
}) => {
  const isAdmin = userRole === 'Admin';
  
  // Default config (Italian)
  const [config, setConfig] = useState<ExportConfig>({
    format: 'xlsx',
    fieldSeparator: ';',
    decimalSeparator: ',',
    thousandsSeparator: '.',
    encoding: 'utf-8-bom',
    dateFormat: 'DD/MM/YYYY',
    currencySymbol: '€',
    currencyPosition: 'after',
    currencySpace: true,
    includeHeader: true,
    includeSupplierNames: isAdmin,
    chunkSize: 0, // Auto
    ...defaultConfig,
  });

  const [selectedPreset, setSelectedPreset] = useState<string>('it');

  // Apply regional preset
  const applyPreset = (region: string) => {
    setSelectedPreset(region);
    setConfig(prev => ({
      ...prev,
      ...REGIONAL_PRESETS[region],
    }));
  };

  // Estimate export time
  const estimatedTime = (() => {
    if (productCount < 1000) return '< 1 second';
    if (productCount < 5000) return '1-3 seconds';
    if (productCount < 10000) return '3-10 seconds';
    if (productCount < 50000) return '10-30 seconds';
    return '30-60 seconds';
  })();

  // Warning for large exports
  const showPerformanceWarning = productCount > 5000;
  
  // Warning for incompatible settings
  const hasIncompatibleSettings = 
    config.format === 'csv' && 
    config.fieldSeparator === ',' && 
    config.decimalSeparator === ',';

  const handleConfirm = () => {
    // Validate settings
    if (hasIncompatibleSettings) {
      alert('⚠️ Incompatible settings: CSV field separator and decimal separator cannot both be comma. Please change one of them.');
      return;
    }
    
    onConfirm(config);
  };

  // Format preview example
  const getPreviewNumber = () => {
    const num = 1234.56;
    let formatted = num.toString();
    
    // Apply decimal separator
    formatted = formatted.replace('.', config.decimalSeparator);
    
    // Apply thousands separator
    if (config.thousandsSeparator !== 'none') {
      const parts = formatted.split(config.decimalSeparator);
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
      formatted = parts.join(config.decimalSeparator);
    }
    
    // Apply currency
    if (config.currencySymbol !== 'none') {
      const space = config.currencySpace ? ' ' : '';
      formatted = config.currencyPosition === 'before' 
        ? `${config.currencySymbol}${space}${formatted}`
        : `${formatted}${space}${config.currencySymbol}`;
    }
    
    return formatted;
  };

  const getPreviewDate = () => {
    const date = new Date('2025-03-15');
    const day = '15';
    const month = '03';
    const year = '2025';
    
    return config.dateFormat
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        zIndex: 10500
      }}
      PaperProps={{
        className: 'dark:bg-dark-bg-card'
      }}
    >
      <DialogTitle className="dark:bg-dark-bg-card dark:text-dark-text-primary">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" className="dark:text-dark-text-primary">Export Configuration</Typography>
          <Chip 
            label={`${productCount.toLocaleString()} products`} 
            size="small" 
            color="primary"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers className="dark:bg-dark-bg-card dark:border-dark-border-primary">
        {/* Performance warning */}
        {showPerformanceWarning && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            className="dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800"
          >
            <strong>Large export detected</strong>
            <br />
            Exporting {productCount.toLocaleString()} products. Estimated time: <strong>{estimatedTime}</strong>
            <br />
            A progress bar will be shown during export.
          </Alert>
        )}

        {/* Incompatible settings warning */}
        {hasIncompatibleSettings && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            className="dark:bg-red-900/20 dark:text-red-200 dark:border-red-800"
          >
            <strong>⚠️ Incompatible settings</strong>
            <br />
            CSV field separator and decimal separator cannot both be comma (,).
            <br />
            Please use semicolon (;) as field separator or period (.) as decimal separator.
          </Alert>
        )}

        {/* Regional presets */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
            Quick Presets
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Button 
              variant={selectedPreset === 'it' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('it')}
              className="dark:border-dark-border-primary dark:text-dark-text-primary"
            >
              🇮🇹 Italy
            </Button>
            <Button 
              variant={selectedPreset === 'us' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('us')}
              className="dark:border-dark-border-primary dark:text-dark-text-primary"
            >
              🇺🇸 USA
            </Button>
            <Button 
              variant={selectedPreset === 'uk' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('uk')}
              className="dark:border-dark-border-primary dark:text-dark-text-primary"
            >
              🇬🇧 UK
            </Button>
            <Button 
              variant={selectedPreset === 'fr' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('fr')}
              className="dark:border-dark-border-primary dark:text-dark-text-primary"
            >
              🇫🇷 France
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} className="dark:border-dark-border-primary" />

        {/* File format */}
        <Box sx={{ mb: 2 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" className="dark:text-dark-text-primary">File Format</FormLabel>
            <RadioGroup
              row
              value={config.format}
              onChange={(e) => setConfig({ ...config, format: e.target.value as 'csv' | 'xlsx' })}
            >
              <FormControlLabel value="xlsx" control={<Radio />} label="Excel (.xlsx)" className="dark:text-dark-text-primary" />
              <FormControlLabel value="csv" control={<Radio />} label="CSV (.csv)" className="dark:text-dark-text-primary" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* CSV Separators (only for CSV) */}
        {config.format === 'csv' && (
          <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl size="small">
                <FormLabel className="dark:text-dark-text-primary">Field Separator (CSV)</FormLabel>
                <Select
                  value={config.fieldSeparator}
                  onChange={(e) => setConfig({ ...config, fieldSeparator: e.target.value as any })}
                className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
                MenuProps={DARK_MENU_PROPS}
              >
                <MenuItem value=",">Comma (,)</MenuItem>
                <MenuItem value=";">Semicolon (;)</MenuItem>
                <MenuItem value="\t">Tab</MenuItem>
                  <MenuItem value="|">Pipe (|)</MenuItem>
                </Select>
              </FormControl>

            <FormControl size="small">
                <FormLabel className="dark:text-dark-text-primary">File Encoding</FormLabel>
                <Select
                  value={config.encoding}
                  onChange={(e) => setConfig({ ...config, encoding: e.target.value as any })}
                className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
                MenuProps={DARK_MENU_PROPS}
              >
                <MenuItem value="utf-8">UTF-8</MenuItem>
                <MenuItem value="utf-8-bom">UTF-8 with BOM</MenuItem>
                <MenuItem value="windows-1252">Windows-1252</MenuItem>
                <MenuItem value="iso-8859-1">ISO-8859-1</MenuItem>
                </Select>
              </FormControl>
            </Box>
        )}

        <Divider sx={{ my: 1.5 }} className="dark:border-dark-border-primary" />

        {/* Number formatting */}
        <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
          Number Formatting
        </Typography>
        
        <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl size="small">
            <FormLabel className="dark:text-dark-text-primary">Decimal Separator</FormLabel>
            <Select
              value={config.decimalSeparator}
              onChange={(e) => setConfig({ ...config, decimalSeparator: e.target.value as '.' | ',' })}
              className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
              MenuProps={DARK_MENU_PROPS}
            >
              <MenuItem value=",">Comma (,) - Europe: 1234,56</MenuItem>
              <MenuItem value=".">Period (.) - USA/UK: 1234.56</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small">
            <FormLabel className="dark:text-dark-text-primary">Thousands Separator</FormLabel>
            <Select
              value={config.thousandsSeparator}
              onChange={(e) => setConfig({ ...config, thousandsSeparator: e.target.value as any })}
              className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
              MenuProps={DARK_MENU_PROPS}
            >
              <MenuItem value=".">Period (.) - Italy: 1.234,56</MenuItem>
              <MenuItem value=",">Comma (,) - USA: 1,234.56</MenuItem>
              <MenuItem value=" ">Space ( ) - France: 1 234,56</MenuItem>
              <MenuItem value="none">None: 1234.56</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 1.5 }} className="dark:border-dark-border-primary" />

        {/* Currency */}
        <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
          Currency Format
        </Typography>
        
        <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <FormControl size="small">
            <FormLabel className="dark:text-dark-text-primary">Currency Symbol</FormLabel>
            <Select
              value={config.currencySymbol}
              onChange={(e) => setConfig({ ...config, currencySymbol: e.target.value as any })}
              className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
              MenuProps={DARK_MENU_PROPS}
            >
              <MenuItem value="€">Euro (€)</MenuItem>
              <MenuItem value="$">Dollar ($)</MenuItem>
              <MenuItem value="£">Pound (£)</MenuItem>
              <MenuItem value="none">None</MenuItem>
            </Select>
          </FormControl>

        {config.currencySymbol !== 'none' && (
            <FormControl size="small">
              <FormLabel className="dark:text-dark-text-primary">Position</FormLabel>
              <Select
                value={config.currencyPosition}
                onChange={(e) => setConfig({ ...config, currencyPosition: e.target.value as any })}
                className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
                sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
                MenuProps={DARK_MENU_PROPS}
              >
                <MenuItem value="after">After (e.g., 100€)</MenuItem>
                <MenuItem value="before">Before (e.g., $100)</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
            
        {config.currencySymbol !== 'none' && (
          <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.currencySpace}
                      onChange={(e) => setConfig({ ...config, currencySpace: e.target.checked })}
                  size="small"
                    />
                  }
              label="With space"
              className="dark:text-dark-text-primary"
                />
          </Box>
        )}

        <Divider sx={{ my: 1.5 }} className="dark:border-dark-border-primary" />

        {/* Date format */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <FormLabel className="dark:text-dark-text-primary">Date Format</FormLabel>
            <Select
              value={config.dateFormat}
              onChange={(e) => setConfig({ ...config, dateFormat: e.target.value as any })}
              className="dark:bg-dark-bg-tertiary dark:text-dark-text-primary"
              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.23)' } }}
              MenuProps={DARK_MENU_PROPS}
            >
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY - Europe (15/03/2025)</MenuItem>
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY - USA (03/15/2025)</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD - ISO (2025-03-15)</MenuItem>
              <MenuItem value="DD-MM-YYYY">DD-MM-YYYY - Alternative (15-03-2025)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Options */}
        <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
          Export Options
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.includeHeader}
                onChange={(e) => setConfig({ ...config, includeHeader: e.target.checked })}
                size="small"
              />
            }
            label="Include column headers"
            className="dark:text-dark-text-primary"
          />

        {isAdmin && (
            <FormControlLabel
              control={
                <Switch
                  checked={config.includeSupplierNames}
                  onChange={(e) => setConfig({ ...config, includeSupplierNames: e.target.checked })}
                  size="small"
                />
              }
              label="Include supplier names (Admin only)"
              className="dark:text-dark-text-primary"
            />
          )}
          </Box>

        <Divider sx={{ my: 1.5 }} className="dark:border-dark-border-primary" />

        {/* Preview */}
        <Box 
          sx={{ p: 2, borderRadius: 1 }} 
          className="bg-gray-100 dark:bg-dark-bg-tertiary"
        >
          <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary text-gray-900">
            Format Preview
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            <Box className="text-gray-900 dark:text-dark-text-primary">
              Number: <strong>{getPreviewNumber()}</strong>
            </Box>
            <Box className="text-gray-900 dark:text-dark-text-primary">
              Date: <strong>{getPreviewDate()}</strong>
            </Box>
            {config.format === 'csv' && (
              <Box className="text-gray-900 dark:text-dark-text-primary">
                CSV Row: <strong>Product Name{config.fieldSeparator}123{config.fieldSeparator}{getPreviewNumber()}</strong>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className="dark:bg-dark-bg-card dark:border-dark-border-primary">
        <Button onClick={onClose} className="dark:text-dark-text-primary">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={hasIncompatibleSettings}
        >
          Export {productCount.toLocaleString()} Products
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportConfigModal;

