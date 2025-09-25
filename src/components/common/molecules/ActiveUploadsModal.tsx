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
  Tabs,
  Tab,
  Skeleton
} from '@mui/material';
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon
} from '@mui/icons-material';
import { loadCompletedUploadsFromLogs, loadActiveUploads, ParsedUpload } from '../../../utils/logParser';

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
  const [activeTab, setActiveTab] = useState(0);
  const [activeUploads, setActiveUploads] = useState<ParsedUpload[]>([]);
  const [completedUploads, setCompletedUploads] = useState<ParsedUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedUploads, setExpandedUploads] = useState<Set<string>>(new Set());

  // Skeleton component for upload history
  const UploadHistorySkeleton = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3].map((index) => (
        <Card key={index} sx={{ border: 1, borderColor: 'divider' }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            }
            subheader={
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Skeleton variant="text" width={200} height={16} />
                <Skeleton variant="text" width={150} height={16} />
                <Skeleton variant="text" width={180} height={16} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="text" width={60} height={16} />
                  <Skeleton variant="text" width={60} height={16} />
                  <Skeleton variant="text" width={60} height={16} />
                </Box>
              </Box>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

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
      const uploadsData = await loadActiveUploads();
      console.log('✅ Active uploads fetched:', uploadsData);
      setActiveUploads(uploadsData);
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

  const fetchCompletedUploads = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingHistory(true);
    }
    setError(null);
    
    try {
      console.log('🔄 Fetching completed uploads from logs...');
      const uploadsData = await loadCompletedUploadsFromLogs();
      console.log('✅ Completed uploads fetched:', uploadsData);
      setCompletedUploads(uploadsData);
    } catch (err) {
      console.error('❌ Error fetching completed uploads:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoadingHistory(false);
      }
    }
  };

  // Fetch data when modal opens and set up auto-refresh
  useEffect(() => {
    if (open) {
      // Load initial data for both tabs
      fetchActiveUploads(false);
      fetchCompletedUploads(false);
      
      // Set up auto-refresh for active uploads only (every 5 seconds)
      const interval = setInterval(() => {
        // Only refresh active uploads if we're on the active tab
        if (activeTab === 0) {
          fetchActiveUploads(true);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [open, activeTab]);


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
          overflow: 'hidden',
          minHeight: '90vh',
          maxHeight: '95vh'
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
          Upload Monitor
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            onClick={() => {
              if (activeTab === 0) {
                fetchActiveUploads(true);
              } else {
                fetchCompletedUploads(true);
              }
            }} 
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
      
      <DialogContent dividers sx={{ 
        height: 'calc(90vh - 120px)', 
        overflow: 'auto',
        p: 0,
        bgcolor: 'background.paper'
      }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="upload tabs"
          >
            <Tab 
              label={`Active Uploads ${activeUploads.length > 0 ? `(${activeUploads.length})` : ''}`} 
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab 
              label={`Upload History ${completedUploads.length > 0 ? `(${completedUploads.length})` : ''}`} 
              id="tab-1"
              aria-controls="tabpanel-1"
            />
          </Tabs>
        </Box>

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

        {!loading && (
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
            
            {/* Active Uploads Tab */}
            {activeTab === 0 && (
              <Box>
                {activeUploads.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {activeUploads.map((upload, index) => {
                      const statusInfo = getStatusInfo('processing');
                      
                      return (
                        <Card key={upload.id} sx={{ border: 1, borderColor: 'divider' }}>
                          <CardHeader
                            title={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6">
                                  Active Upload {index + 1}
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
                                  <strong>Upload ID:</strong> {upload.id}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>User:</strong> {upload.userName} ({upload.userEmail})
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Progress:</strong> Processed {upload.processedRows} of {upload.totalRows} rows
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body2">
                                    <strong>Created:</strong> {upload.created}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Updated:</strong> {upload.updated}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Skipped:</strong> {upload.skipped}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          
                          <CardContent sx={{ pt: 0 }}>
                            {/* Progress Bar for Active Uploads */}
                            <Box sx={{ mb: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={(upload.processedRows / upload.totalRows) * 100} 
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                                {((upload.processedRows / upload.totalRows) * 100).toFixed(1)}% complete
                              </Typography>
                            </Box>

                            {/* Additional Info */}
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Started: {formatTimestamp(upload.timestamp)}
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

            {/* Upload History Tab */}
            {activeTab === 1 && (
              <Box sx={{ position: 'relative' }}>
                {refreshing && activeTab === 1 && (
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
                        Updating history...
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {loadingHistory ? (
                  <UploadHistorySkeleton />
                ) : completedUploads.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {completedUploads.map((upload, index) => {
                      const statusInfo = getStatusInfo(upload.success ? 'completed' : 'failed');
                      const isExpanded = expandedUploads.has(upload.id);
                      
                      return (
                        <Card key={upload.id} sx={{ border: 1, borderColor: 'divider' }}>
                          <CardHeader
                            title={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6">
                                  {upload.action === 'SUPPLY_CREATE' ? 'Supply Upload' : 
                                   upload.action === 'PRODUCT_CSV_UPLOAD' ? 'Product Upload' :
                                   upload.action === 'SUPPLY_CSV_UPLOAD_ADMIN' ? 'Admin Supply Upload' : 'Upload'} {index + 1}
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
                                  <strong>Upload ID:</strong> {upload.id}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>User:</strong> {upload.userName} ({upload.userEmail})
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Results:</strong> Processed {upload.processedRows} of {upload.totalRows} rows
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body2">
                                    <strong>Created:</strong> {upload.created}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Updated:</strong> {upload.updated}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Skipped:</strong> {upload.skipped}
                                  </Typography>
                                  {upload.errors.length > 0 && (
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleExpanded(upload.id)}
                                      sx={{ p: 0.5 }}
                                    >
                                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                  )}
                                </Box>
                                {upload.fileName && (
                                  <Typography variant="body2">
                                    <strong>File:</strong> {upload.fileName}
                                  </Typography>
                                )}
                                {upload.warehouse && (
                                  <Typography variant="body2">
                                    <strong>Warehouse:</strong> {upload.warehouse}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                            
                          <CardContent sx={{ pt: 0 }}>
                            {/* Status Message */}
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color={upload.success ? 'success.main' : 'error.main'}>
                                <strong>Status:</strong> {upload.message}
                              </Typography>
                            </Box>

                            {/* Error List (Expandable) */}
                            {upload.errors.length > 0 && (
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
                                Completed: {formatTimestamp(upload.timestamp)}
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
                      No Upload History
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No completed uploads found in the logs.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
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