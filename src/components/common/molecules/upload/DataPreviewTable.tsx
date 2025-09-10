import React from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';

interface DataPreviewTableProps {
  headers: string[];
  data: any[][];
  mappedFields: Record<string, string>;
  maxRows?: number;
  title?: string;
}

const DataPreviewTable: React.FC<DataPreviewTableProps> = ({
  headers,
  data,
  mappedFields,
  maxRows = 10,
  title = "Data Preview"
}) => {
  const displayData = data.slice(0, maxRows);
  const hasMoreRows = data.length > maxRows;

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VisibilityIcon color="primary" />
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the mapped data before importing
      </Typography>
      
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400, mb: 3 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headers.map((header, index) => (
                <TableCell key={index} sx={{ fontWeight: 600 }}>
                  {mappedFields[header] ? `${header} → ${mappedFields[header]}` : header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    {cell ? (
                      <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cell}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">(empty)</Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {hasMoreRows && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          Showing first {maxRows} rows of {data.length} total rows
        </Typography>
      )}
    </>
  );
};

export default DataPreviewTable;
