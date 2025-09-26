import { useState, useEffect, useCallback, useRef } from 'react';
import { getUploadProgress, UploadProgressResponse } from '../utils/api';

interface UseUploadProgressOptions {
  pollInterval?: number; // Polling interval in milliseconds (default: 1000)
  maxRetries?: number; // Max retries on error (default: 3)
  onComplete?: (result: UploadProgressResponse) => void;
  onError?: (error: Error) => void;
}

interface UseUploadProgressReturn {
  progress: UploadProgressResponse | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (uploadId: string) => void;
  stopPolling: () => void;
  retry: () => void;
}

export const useUploadProgress = (options: UseUploadProgressOptions = {}): UseUploadProgressReturn => {
  const {
    pollInterval = 1000,
    maxRetries = 3,
    onComplete,
    onError
  } = options;

  const [progress, setProgress] = useState<UploadProgressResponse | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    setRetryCount(0);
  }, []);

  const pollProgress = useCallback(async (uploadId: string) => {
    if (!isComponentMounted.current) return;

    try {
      const progressData = await getUploadProgress(uploadId);
      
      if (!isComponentMounted.current) return;

      setProgress(progressData);
      setError(null);
      setRetryCount(0);

      // Check if upload is complete or failed
      if (progressData.status === 'completed') {
        stopPolling();
        if (onComplete) {
          onComplete(progressData);
        }
      } else if (progressData.status === 'failed') {
        stopPolling();
        const errorMsg = progressData.errors?.join(', ') || 'Upload failed';
        setError(errorMsg);
        if (onError) {
          onError(new Error(errorMsg));
        }
      }
    } catch (err) {
      
      if (!isComponentMounted.current) return;

      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
      } else {
        stopPolling();
        const errorMsg = err instanceof Error ? err.message : 'Failed to get upload progress';
        setError(errorMsg);
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMsg));
        }
      }
    }
  }, [retryCount, maxRetries, stopPolling, onComplete, onError]);

  const startPolling = useCallback((uploadId: string) => {
    
    // Stop any existing polling
    stopPolling();
    
    setCurrentUploadId(uploadId);
    setIsPolling(true);
    setError(null);
    setProgress(null);
    setRetryCount(0);

    // Initial poll
    pollProgress(uploadId);

    // Set up interval for polling
    intervalRef.current = setInterval(() => {
      pollProgress(uploadId);
    }, pollInterval);
  }, [pollProgress, stopPolling, pollInterval]);

  const retry = useCallback(() => {
    if (currentUploadId) {
      setRetryCount(0);
      setError(null);
      startPolling(currentUploadId);
    }
  }, [currentUploadId, startPolling]);

  return {
    progress,
    isPolling,
    error,
    startPolling,
    stopPolling,
    retry
  };
};

export default useUploadProgress; 