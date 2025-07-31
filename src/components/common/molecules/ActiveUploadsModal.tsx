import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getActiveUploads, ActiveUploadsResponse } from '../../../utils/api';

interface ActiveUploadsModalProps {
  open: boolean;
  onClose: () => void;
}

const ActiveUploadsModal: React.FC<ActiveUploadsModalProps> = ({
  open,
  onClose
}) => {
  const [result, setResult] = useState<ActiveUploadsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveUploads = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching active uploads...');
      const response = await getActiveUploads();
      console.log('✅ Active uploads fetched:', response);
      setResult(response);
    } catch (err) {
      console.error('❌ Error fetching active uploads:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchActiveUploads();
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'success.main',
        color: 'success.contrastText'
      }}>
        <Typography variant="h6" component="div">
          Active Uploads {result?.uploads ? `(${result.uploads.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            onClick={fetchActiveUploads} 
            disabled={loading}
            size="small"
            sx={{ color: 'success.contrastText', minWidth: 'auto' }}
            title="Refresh"
          >
            <RefreshIcon />
          </Button>
          <Button 
            onClick={onClose} 
            size="small"
            sx={{ color: 'success.contrastText', minWidth: 'auto' }}
          >
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1">Loading...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result && !loading && (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" gutterBottom>
              Message: {result.message}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Error: {result.error ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Uploads Count: {result.uploads?.length || 0}
            </Typography>
            
            {result.uploads && result.uploads.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Uploads:
                </Typography>
                <Box component="pre" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {JSON.stringify(result.uploads, null, 2)}
                </Box>
              </Box>
            )}
          </Box>
        )}

        {!result && !loading && !error && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No data available
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActiveUploadsModal; 