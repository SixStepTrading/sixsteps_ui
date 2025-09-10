import React from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

interface ColumnMappingTableProps {
  headers: string[];
  mappedFields: Record<string, string>;
  onFieldMapping: (header: string, field: string) => void;
  onSuggestMapping: () => void;
  getFieldOptions: () => Array<{ value: string; label: string }>;
  previewData?: any[][];
  showPreview?: boolean;
}

const ColumnMappingTable: React.FC<ColumnMappingTableProps> = ({
  headers,
  mappedFields,
  onFieldMapping,
  onSuggestMapping,
  getFieldOptions,
  previewData,
  showPreview = true
}) => {
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon color="primary" />
        Map File Columns to Fields
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select which column in your file corresponds to each field
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onSuggestMapping}
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
              {showPreview && previewData && previewData[0] && (
                <TableCell sx={{ fontWeight: 600 }}>Preview</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {headers.map((header, index) => (
              <TableRow key={index}>
                <TableCell sx={{ fontWeight: 500 }}>{header}</TableCell>
                <TableCell>
                  <select 
                    className="w-full p-1 border border-gray-300 rounded"
                    value={mappedFields[header] || ''}
                    onChange={(e) => onFieldMapping(header, e.target.value)}
                  >
                    <option value="">-- Select Field --</option>
                    {getFieldOptions().map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </TableCell>
                {showPreview && previewData && previewData[0] && (
                  <TableCell>
                    {previewData[0][index] ? (
                      <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {previewData[0][index]}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">(empty)</Typography>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default ColumnMappingTable;
