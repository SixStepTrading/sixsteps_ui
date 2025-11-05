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
      PaperProps={{
        className: 'dark:bg-dark-bg-card'
      }}
    >
      <DialogTitle className="dark:text-dark-text-primary">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Export Configuration</Typography>
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
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Large export detected</strong>
            <br />
            Exporting {productCount.toLocaleString()} products. Estimated time: <strong>{estimatedTime}</strong>
            <br />
            A progress bar will be shown during export.
          </Alert>
        )}

        {/* Incompatible settings warning */}
        {hasIncompatibleSettings && (
          <Alert severity="error" sx={{ mb: 2 }}>
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
            >
              🇮🇹 Italy
            </Button>
            <Button 
              variant={selectedPreset === 'us' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('us')}
            >
              🇺🇸 USA
            </Button>
            <Button 
              variant={selectedPreset === 'uk' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('uk')}
            >
              🇬🇧 UK
            </Button>
            <Button 
              variant={selectedPreset === 'fr' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => applyPreset('fr')}
            >
              🇫🇷 France
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* File format */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" className="dark:text-dark-text-primary">File Format</FormLabel>
            <RadioGroup
              row
              value={config.format}
              onChange={(e) => setConfig({ ...config, format: e.target.value as 'csv' | 'xlsx' })}
            >
              <FormControlLabel value="xlsx" control={<Radio />} label="Excel (.xlsx)" />
              <FormControlLabel value="csv" control={<Radio />} label="CSV (.csv)" />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* CSV Separators (only for CSV) */}
        {config.format === 'csv' && (
          <>
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <FormLabel className="dark:text-dark-text-primary">Field Separator (CSV)</FormLabel>
                <Select
                  value={config.fieldSeparator}
                  onChange={(e) => setConfig({ ...config, fieldSeparator: e.target.value as any })}
                >
                  <MenuItem value=",">Comma (,) - USA/UK standard</MenuItem>
                  <MenuItem value=";">Semicolon (;) - Europe standard</MenuItem>
                  <MenuItem value="\t">Tab (\t)</MenuItem>
                  <MenuItem value="|">Pipe (|)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth size="small">
                <FormLabel className="dark:text-dark-text-primary">File Encoding</FormLabel>
                <Select
                  value={config.encoding}
                  onChange={(e) => setConfig({ ...config, encoding: e.target.value as any })}
                >
                  <MenuItem value="utf-8">UTF-8 (Modern, recommended)</MenuItem>
                  <MenuItem value="utf-8-bom">UTF-8 with BOM (Excel Italy)</MenuItem>
                  <MenuItem value="windows-1252">Windows-1252 (Old Excel)</MenuItem>
                  <MenuItem value="iso-8859-1">ISO-8859-1 (Latin-1)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Number formatting */}
        <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
          Number Formatting
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <FormLabel className="dark:text-dark-text-primary">Decimal Separator</FormLabel>
            <Select
              value={config.decimalSeparator}
              onChange={(e) => setConfig({ ...config, decimalSeparator: e.target.value as '.' | ',' })}
            >
              <MenuItem value=".">Period (.) - USA/UK: 1234.56</MenuItem>
              <MenuItem value=",">Comma (,) - Europe: 1234,56</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <FormLabel className="dark:text-dark-text-primary">Thousands Separator</FormLabel>
            <Select
              value={config.thousandsSeparator}
              onChange={(e) => setConfig({ ...config, thousandsSeparator: e.target.value as any })}
            >
              <MenuItem value="none">None: 1234.56</MenuItem>
              <MenuItem value=",">Comma (,) - USA: 1,234.56</MenuItem>
              <MenuItem value=".">Period (.) - Italy: 1.234,56</MenuItem>
              <MenuItem value=" ">Space ( ) - France: 1 234,56</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Currency */}
        <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
          Currency Format
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth size="small">
            <FormLabel className="dark:text-dark-text-primary">Currency Symbol</FormLabel>
            <Select
              value={config.currencySymbol}
              onChange={(e) => setConfig({ ...config, currencySymbol: e.target.value as any })}
            >
              <MenuItem value="€">Euro (€)</MenuItem>
              <MenuItem value="$">Dollar ($)</MenuItem>
              <MenuItem value="£">Pound (£)</MenuItem>
              <MenuItem value="none">None (numeric only)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {config.currencySymbol !== 'none' && (
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ flex: 1 }}>
              <FormLabel className="dark:text-dark-text-primary">Position</FormLabel>
              <Select
                value={config.currencyPosition}
                onChange={(e) => setConfig({ ...config, currencyPosition: e.target.value as any })}
              >
                <MenuItem value="before">Before (e.g., $100)</MenuItem>
                <MenuItem value="after">After (e.g., 100€)</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ flex: 1 }}>
              <FormLabel className="dark:text-dark-text-primary">Space</FormLabel>
              <Box sx={{ pt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.currencySpace}
                      onChange={(e) => setConfig({ ...config, currencySpace: e.target.checked })}
                    />
                  }
                  label={config.currencySpace ? 'With space' : 'No space'}
                />
              </Box>
            </FormControl>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Date format */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth size="small">
            <FormLabel className="dark:text-dark-text-primary">Date Format</FormLabel>
            <Select
              value={config.dateFormat}
              onChange={(e) => setConfig({ ...config, dateFormat: e.target.value as any })}
            >
              <MenuItem value="DD/MM/YYYY">DD/MM/YYYY - Europe (15/03/2025)</MenuItem>
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY - USA (03/15/2025)</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD - ISO (2025-03-15)</MenuItem>
              <MenuItem value="DD-MM-YYYY">DD-MM-YYYY - Alternative (15-03-2025)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Options */}
        <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
          Export Options
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={config.includeHeader}
                onChange={(e) => setConfig({ ...config, includeHeader: e.target.checked })}
              />
            }
            label="Include column headers"
          />
        </Box>

        {isAdmin && (
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.includeSupplierNames}
                  onChange={(e) => setConfig({ ...config, includeSupplierNames: e.target.checked })}
                />
              }
              label="Include supplier names (Admin only)"
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Preview */}
        <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }} className="dark:bg-dark-bg-tertiary">
          <Typography variant="subtitle2" gutterBottom className="dark:text-dark-text-primary">
            Format Preview
          </Typography>
          <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            <Box className="dark:text-dark-text-primary">Number: <strong>{getPreviewNumber()}</strong></Box>
            <Box className="dark:text-dark-text-primary">Date: <strong>{getPreviewDate()}</strong></Box>
            {config.format === 'csv' && (
              <Box className="dark:text-dark-text-primary">
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

