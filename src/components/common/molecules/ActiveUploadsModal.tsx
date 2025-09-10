import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Skeleton
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { getActiveUploads, ActiveUploadsResponse, ActiveUpload } from '../../../utils/api';

interface ActiveUploadsModalProps {
  open: boolean;
  onClose: () => void;
}

const ActiveUploadsModal: React.FC<ActiveUploadsModalProps> = ({
  open,
  onClose
}) => {
  // Add CSS animation for spinning refresh icon
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [result, setResult] = useState<ActiveUploadsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUploads, setExpandedUploads] = useState<Set<string>>(new Set());

  // Helper function to format time remaining
  const formatTimeRemaining = (estimatedTimeRemaining?: number): string => {
    if (!estimatedTimeRemaining || estimatedTimeRemaining <= 0) {
      return 'Calculating...';
    }

    // Convert milliseconds to seconds first
    const seconds = Math.floor(estimatedTimeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp || timestamp <= 0) {
      return 'Unknown';
    }
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' };
      case 'failed':
        return { color: 'error', icon: <ErrorIcon />, label: 'Failed' };
      case 'processing':
        return { color: 'primary', icon: <HourglassEmptyIcon />, label: 'Processing' };
      case 'pending':
        return { color: 'warning', icon: <HourglassEmptyIcon />, label: 'Pending' };
      default:
        return { color: 'default', icon: <HourglassEmptyIcon />, label: status };
    }
  };

  // Toggle expanded state for upload errors
  const toggleExpanded = (uploadId: string) => {
    const newExpanded = new Set(expandedUploads);
    if (newExpanded.has(uploadId)) {
      newExpanded.delete(uploadId);
    } else {
      newExpanded.add(uploadId);
    }
    setExpandedUploads(newExpanded);
  };

  const fetchActiveUploads = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
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
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Fetch data when modal opens and set up auto-refresh
  useEffect(() => {
    if (open) {
      fetchActiveUploads(false); // Initial load
      
      // Set up auto-refresh every 5 seconds
      const interval = setInterval(() => {
        fetchActiveUploads(true); // Refresh
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'success.main',
        color: 'success.contrastText',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Active Uploads {result?.uploads ? `(${result.uploads.length})` : ''}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            onClick={() => fetchActiveUploads(true)} 
            disabled={loading || refreshing}
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
      
      <DialogContent dividers sx={{ p: 0, bgcolor: 'background.paper' }}>
        {loading && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">Loading...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {result && !loading && (
          <Box sx={{ p: 3, position: 'relative' }}>
            {refreshing && (
              <Box sx={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                bgcolor: 'rgba(255, 255, 255, 0.8)', 
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <RefreshIcon sx={{ animation: 'spin 1s linear infinite', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Updating...
                  </Typography>
                </Box>
              </Box>
            )}
            
            {result.uploads && result.uploads.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {result.uploads.map((upload, index) => {
                  const statusInfo = getStatusInfo(upload.status);
                  const isExpanded = expandedUploads.has(upload.uploadId);
                  
                  return (
                    <Card key={upload.uploadId} sx={{ border: 1, borderColor: 'divider' }}>
                      <CardHeader
                        title={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6">
                              Upload {index + 1}
                            </Typography>
                            <Chip
                              icon={statusInfo.icon}
                              label={statusInfo.label}
                              color={statusInfo.color as any}
                              size="small"
                            />
                          </Box>
                        }
                        subheader={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                              <strong>Upload ID:</strong> {upload.uploadId}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Progress:</strong> Processed {upload.processedRows} of {upload.totalRows} rows...
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="body2">
                                <strong>Skipped:</strong> {upload.skipped}
                              </Typography>
                              {upload.skipped > 0 && (
                                <IconButton
                                  size="small"
                                  onClick={() => toggleExpanded(upload.uploadId)}
                                  sx={{ p: 0.5 }}
                                >
                                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ScheduleIcon fontSize="small" />
                              <Typography variant="body2">
                                <strong>Estimated Time Remaining:</strong> {formatTimeRemaining(upload.estimatedTimeRemaining)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      
                      <CardContent sx={{ pt: 0 }}>
                        {/* Progress Bar */}
                        <Box sx={{ mb: 2 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={upload.progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                            {upload.progress.toFixed(1)}% complete
                          </Typography>
                        </Box>

                        {/* Error List (Expandable) */}
                        {upload.skipped > 0 && (
                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ErrorIcon fontSize="small" color="error" />
                                Error Details ({upload.errors.length} errors)
                              </Typography>
                              <Divider sx={{ mb: 1 }} />
                              <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
                                {upload.errors.map((error, errorIndex) => (
                                  <ListItem key={errorIndex} sx={{ py: 0.5 }}>
                                    <ListItemText
                                      primary={
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                          {error}
                                        </Typography>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          </Collapse>
                        )}

                        {/* Additional Info */}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatTimestamp(upload.startTime)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Active Uploads
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  There are currently no uploads in progress.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {!result && !loading && !error && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No data available
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3, 
        bgcolor: 'grey.50', 
        borderTop: '1px solid',
        borderColor: 'divider',
        gap: 2
      }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            px: 3
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActiveUploadsModal; 