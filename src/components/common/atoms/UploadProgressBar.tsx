import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Alert,
  Chip,
  Button,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { UploadProgressResponse } from '../../../utils/api';

interface UploadProgressBarProps {
  progress: UploadProgressResponse | null;
  isPolling: boolean;
  error: string | null;
  onRetry?: () => void;
  showDetails?: boolean;
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  progress,
  isPolling,
  error,
  onRetry,
  showDetails = true
}) => {
  if (!progress && !isPolling && !error) {
    return null;
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'processing': return 'info';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      default: return null;
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatRowsProgress = () => {
    if (!progress?.processedRows || !progress?.totalRows) return '';
    return `${progress.processedRows}/${progress.totalRows} rows`;
  };

  return (
    <Paper sx={{ p: 3, mb: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
      {/* Header with status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📤 Upload Progress
          {progress?.status && (
            getStatusIcon(progress.status) ? (
              <Chip 
                label={progress.status.toUpperCase()} 
                color={getStatusColor(progress.status) as any}
                size="small"
                icon={getStatusIcon(progress.status)!}
              />
            ) : (
              <Chip 
                label={progress.status.toUpperCase()} 
                color={getStatusColor(progress.status) as any}
                size="small"
              />
            )
          )}
        </Typography>
        
        {error && onRetry && (
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            color="primary"
          >
            Retry
          </Button>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Upload Error</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Progress Bar */}
      {progress && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {progress.message || progress.currentStep || 'Processing...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {progress.progress}%
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={progress.progress} 
            sx={{ 
              height: 8, 
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: progress.status === 'completed' 
                  ? 'linear-gradient(90deg, #4caf50, #66bb6a)'
                  : progress.status === 'failed'
                  ? 'linear-gradient(90deg, #f44336, #ef5350)'
                  : 'linear-gradient(90deg, #2196f3, #42a5f5)'
              }
            }} 
          />
        </Box>
      )}

      {/* Detailed Information */}
      {showDetails && progress && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
          {/* Steps Progress */}
          {progress.totalSteps > 1 && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Steps Progress
              </Typography>
              <Typography variant="body2">
                {progress.currentStepIndex + 1}/{progress.totalSteps}
              </Typography>
            </Box>
          )}

          {/* Rows Processed */}
          {formatRowsProgress() && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Rows Processed
              </Typography>
              <Typography variant="body2">
                {formatRowsProgress()}
              </Typography>
            </Box>
          )}

          {/* Estimated Time Remaining */}
          {progress.estimatedTimeRemaining && progress.status === 'processing' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Time Remaining
                </Typography>
                <Typography variant="body2">
                  {formatTime(progress.estimatedTimeRemaining)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Upload ID (for debugging) */}
          {progress.uploadId && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Upload ID
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {progress.uploadId.slice(0, 8)}...
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Success Message */}
      {progress?.status === 'completed' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Upload Completed Successfully! ✅</Typography>
          {progress.processedRows && (
            <Typography variant="body2">
              Successfully processed {progress.processedRows} rows.
            </Typography>
          )}
        </Alert>
      )}

      {/* Loading Indicator for Polling */}
      {isPolling && progress?.status === 'processing' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Box sx={{ 
            width: 16, 
            height: 16, 
            border: '2px solid #e0e0e0', 
            borderTop: '2px solid #1976d2', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }} />
          <Typography variant="body2" color="text.secondary">
            Monitoring upload progress...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default UploadProgressBar; 