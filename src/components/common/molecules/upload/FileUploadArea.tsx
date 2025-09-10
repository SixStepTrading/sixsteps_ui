import React from 'react';
import {
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  FileCopy as FileCopyIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface FileUploadAreaProps {
  selectedFile: File | null;
  isDragging: boolean;
  onFileClick: () => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemoveFile: () => void;
  onDownloadTemplate: () => void;
  accept?: string;
  maxSize?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  selectedFile,
  isDragging,
  onFileClick,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onRemoveFile,
  onDownloadTemplate,
  accept = ".xlsx,.xls,.csv",
  maxSize = "10MB"
}) => {
  return (
    <>
      {/* File drop area */}
      <Box
        sx={{
          width: '100%',
          height: selectedFile === null ? 120 : 60,
          border: `2px dashed ${isDragging ? 'primary.main' : 'grey.300'}`,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.04)' : 'grey.50',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          mb: 2,
          gap: 1
        }}
        onClick={onFileClick}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <CloudUploadIcon sx={{ fontSize: selectedFile === null ? 32 : 20, color: 'grey.400' }} />
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {selectedFile === null ? `Drag & Drop file or click to select (${accept}, max ${maxSize})` : 'Replace file'}
        </Typography>
      </Box>
      
      {/* Selected file display */}
      {selectedFile && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Selected File
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': { color: 'primary.main' }
                }}
                onClick={onDownloadTemplate}
              >
                Download Template
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
              <FileCopyIcon color="primary" sx={{ fontSize: 16 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Typography>
              </Box>
            </Box>
            <IconButton 
              size="small" 
              onClick={onRemoveFile}
              color="error"
              sx={{ ml: 1 }}
            >
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
};

export default FileUploadArea;
