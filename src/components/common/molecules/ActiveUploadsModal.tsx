import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { useUser } from '../../../contexts/UserContext';

interface ActiveUploadsModalProps {
  open: boolean;
  onClose: () => void;
}

const ActiveUploadsModal: React.FC<ActiveUploadsModalProps> = ({
  open,
  onClose
}) => {
  const { user } = useUser();
  const isAdmin = user?.role === 'admin';
  
  // Add CSS animation for spinning refresh icon
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
              </Box>
            }
          />
          <CardContent>
            <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 1, mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'processing':
        return {
          label: 'Processing',
          color: 'primary' as const,
          icon: <HourglassEmptyIcon />
        };
      case 'completed':
        return {
          label: 'Completed',
          color: 'success' as const,
          icon: <CheckCircleIcon />
        };
      case 'failed':
        return {
          label: 'Failed',
          color: 'error' as const,
          icon: <ErrorIcon />
        };
      default:
        return {
          label: 'Unknown',
          color: 'default' as const,
          icon: <HourglassEmptyIcon />
        };
    }
  };


  const toggleExpanded = useCallback((uploadId: string) => {
    const newExpanded = new Set(expandedUploads);
    if (newExpanded.has(uploadId)) {
      newExpanded.delete(uploadId);
    } else {
      newExpanded.add(uploadId);
    }
    setExpandedUploads(newExpanded);
  }, [expandedUploads]);

  const fetchActiveUploads = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const uploadsData = await loadActiveUploads();
      setActiveUploads(uploadsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchCompletedUploads = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingHistory(true);
    }
    setError(null);
    
    try {
      const uploadsData = await loadCompletedUploadsFromLogs();
      setCompletedUploads(uploadsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoadingHistory(false);
      }
    }
  }, []);

  // Fetch data when modal opens and set up auto-refresh
  useEffect(() => {
    if (open) {
      // Reset all data when modal opens to prevent showing stale data
      setActiveUploads([]);
      setCompletedUploads([]);
      setError(null);
      setExpandedUploads(new Set());
      
      // Load initial data for both tabs
      fetchActiveUploads(false);
      
      // Only fetch completed uploads if user is admin
      if (isAdmin) {
        fetchCompletedUploads(false);
      }
      
      // Set up auto-refresh for active uploads only (every 5 seconds)
      const interval = setInterval(() => {
        // Only refresh active uploads if we're on the active tab
        if (activeTab === 0) {
          fetchActiveUploads(true);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    } else {
      // Reset data when modal closes
      setActiveUploads([]);
      setCompletedUploads([]);
      setError(null);
      setExpandedUploads(new Set());
    }
  }, [open, isAdmin, fetchActiveUploads, fetchCompletedUploads, activeTab]);

  // Handle tab change - show skeleton for history tab if no data
  useEffect(() => {
    // If switching to Upload History tab and no data is loaded, show skeleton
    if (activeTab === 1 && isAdmin && completedUploads.length === 0 && !loadingHistory) {
      setLoadingHistory(true);
      // Fetch data for history tab
      fetchCompletedUploads(false);
    }
  }, [activeTab, isAdmin, completedUploads.length, loadingHistory, fetchCompletedUploads]);

  // Memoize tab content to prevent unnecessary re-renders
  const activeUploadsContent = useMemo(() => {
    if (activeUploads.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activeUploads.map((upload, index) => {
            const statusInfo = getStatusInfo('processing');
            
            return (
              <Card key={upload.id} sx={{ border: 1, borderColor: 'divider' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" component="div">
                        {upload.userName}
                      </Typography>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small" 
                        icon={statusInfo.icon}
                      />
                    </Box>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {upload.userEmail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {upload.fileName && `File: ${upload.fileName}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {upload.warehouse && `Warehouse: ${upload.warehouse}`}
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Progress: {upload.processedRows} / {upload.totalRows} rows
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={(upload.processedRows / upload.totalRows) * 100} 
                      color="primary"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip label={`Created: ${upload.created}`} size="small" color="success" />
                    <Chip label={`Updated: ${upload.updated}`} size="small" color="info" />
                    <Chip label={`Skipped: ${upload.skipped}`} size="small" color="warning" />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      );
    } else {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Active Uploads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There are currently no active uploads in the system.
          </Typography>
        </Box>
      );
    }
  }, [activeUploads]);

  const completedUploadsContent = useMemo(() => {
    if (loadingHistory) {
      return <UploadHistorySkeleton />;
    }
    
    if (completedUploads.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {completedUploads.map((upload, index) => {
            const isExpanded = expandedUploads.has(upload.id);
            const statusInfo = getStatusInfo(upload.success ? 'completed' : 'failed');
            
            return (
              <Card key={upload.id} sx={{ border: 1, borderColor: 'divider' }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" component="div">
                        {upload.userName}
                      </Typography>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small" 
                        icon={statusInfo.icon}
                      />
                    </Box>
                  }
                  subheader={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {upload.userEmail}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {upload.fileName && `File: ${upload.fileName}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {upload.warehouse && `Warehouse: ${upload.warehouse}`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(upload.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  action={
                    <IconButton onClick={() => toggleExpanded(upload.id)}>
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  }
                />
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {upload.message}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={`Total: ${upload.totalRows}`} size="small" />
                      <Chip label={`Processed: ${upload.processedRows}`} size="small" />
                      <Chip label={`Created: ${upload.created}`} size="small" color="success" />
                      <Chip label={`Updated: ${upload.updated}`} size="small" color="info" />
                      <Chip label={`Skipped: ${upload.skipped}`} size="small" color="warning" />
                    </Box>
                    {upload.errors && upload.errors.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          Errors ({upload.errors.length}):
                        </Typography>
                        <List dense>
                          {upload.errors.map((error, errorIndex) => (
                            <ListItem key={errorIndex}>
                              <ListItemText 
                                primary={error} 
                                primaryTypographyProps={{ variant: 'body2', color: 'error' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Collapse>
              </Card>
            );
          })}
        </Box>
      );
    } else {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Upload History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No completed uploads found in the system logs.
          </Typography>
        </Box>
      );
    }
  }, [completedUploads, loadingHistory, expandedUploads, toggleExpanded]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
          minHeight: '90vh',
          maxHeight: '95vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 3, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Upload Monitor
        </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button 
            onClick={() => {
              if (activeTab === 0) {
                fetchActiveUploads(true);
              } else if (isAdmin) {
                fetchCompletedUploads(true);
              }
            }}
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Refresh
          </Button>
          <Button 
            onClick={onClose} 
            variant="outlined"
            size="small"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              minWidth: 'auto',
              px: 1
            }}
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
            {isAdmin && (
              <Tab 
                label={`Upload History ${completedUploads.length > 0 ? `(${completedUploads.length})` : ''}`} 
                id="tab-1"
                aria-controls="tabpanel-1"
              />
            )}
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
            {(activeTab === 0 || !isAdmin) && (
              <Box>
                {activeUploadsContent}
                          </Box>
            )}

            {/* Upload History Tab - Only for admins */}
            {activeTab === 1 && isAdmin && (
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
                
                {completedUploadsContent}
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