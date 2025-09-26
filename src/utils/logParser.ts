// Types for parsed upload data
export interface ParsedUpload {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: number;
  action: string;
  fileName?: string;
  warehouse?: string;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  success: boolean;
  message: string;
  errors: string[];
  entityId?: string;
}

export interface LogEntry {
  _id: { $oid: string };
  user: {
    id: string;
    email: string;
    name: string;
    surname: string;
    role: string;
  };
  ip: string;
  action: string;
  timestamp: number;
  details?: {
    targetId?: string;
    targetType?: string;
    changes?: {
      created?: {
        id?: string;
        productId?: string;
        entityId?: string;
        price?: number;
        vat?: number;
        uploadResult?: {
          success: boolean;
          message: string;
          totalRows: number;
          processedRows: number;
          created: number;
          updated: number;
          skipped: number;
          errors: string[];
        };
      };
    };
    metadata?: {
      customAction?: string;
      fileName?: string;
      warehouse?: string;
      totalRows?: number;
      created?: number;
      updated?: number;
      errors?: number;
      uploadResult?: {
        success: boolean;
        message: string;
        totalRows: number;
        processedRows: number;
        created: number;
        updated: number;
        skipped: number;
        errors: string[];
      };
    };
  };
  userAgent: string;
  __v: number;
}

// Function to parse logs and extract upload information
export const parseUploadsFromLogs = (logData: any[]): ParsedUpload[] => {
  const uploads: ParsedUpload[] = [];

  logData.forEach((entry) => {
    // Handle SUPPLY_CREATE uploads
    if (entry.action === 'SUPPLY_CREATE' && entry.details?.changes?.created?.uploadResult) {
      const result = entry.details.changes.created.uploadResult;
      const upload: ParsedUpload = {
        id: entry.id || entry._id?.$oid || `upload-${Date.now()}`,
        userId: entry.user.id,
        userName: `${entry.user.name} ${entry.user.surname}`,
        userEmail: entry.user.email,
        timestamp: entry.timestamp,
        action: 'SUPPLY_CREATE',
        totalRows: result.totalRows,
        processedRows: result.processedRows,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        success: result.success,
        message: result.message,
        errors: result.errors,
        entityId: entry.details.changes.created.entityId
      };
      uploads.push(upload);
    }

    // Handle ADMIN_ACTION uploads
    if (entry.action === 'ADMIN_ACTION' && entry.details?.metadata) {
      const meta = entry.details.metadata;
      
      // Handle PRODUCT_CSV_UPLOAD
      if (meta.customAction === 'PRODUCT_CSV_UPLOAD') {
        const upload: ParsedUpload = {
          id: entry.id || entry._id?.$oid || `upload-${Date.now()}`,
          userId: entry.user.id,
          userName: `${entry.user.name} ${entry.user.surname}`,
          userEmail: entry.user.email,
          timestamp: entry.timestamp,
          action: 'PRODUCT_CSV_UPLOAD',
          fileName: meta.fileName,
          totalRows: meta.totalRows || 0,
          processedRows: meta.totalRows || 0,
          created: meta.created || 0,
          updated: meta.updated || 0,
          skipped: meta.errors || 0,
          success: (meta.errors || 0) === 0,
          message: `Processed ${meta.totalRows} rows. Created: ${meta.created}, Updated: ${meta.updated}, Errors: ${meta.errors}`,
          errors: []
        };
        uploads.push(upload);
      }

      // Handle SUPPLY_CSV_UPLOAD_ADMIN
      if (meta.customAction === 'SUPPLY_CSV_UPLOAD_ADMIN' && meta.uploadResult) {
        const result = meta.uploadResult;
        const upload: ParsedUpload = {
          id: entry.id || entry._id?.$oid || `upload-${Date.now()}`,
          userId: entry.user.id,
          userName: `${entry.user.name} ${entry.user.surname}`,
          userEmail: entry.user.email,
          timestamp: entry.timestamp,
          action: 'SUPPLY_CSV_UPLOAD_ADMIN',
          fileName: meta.fileName,
          warehouse: meta.warehouse,
          totalRows: result.totalRows,
          processedRows: result.processedRows,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          success: result.success,
          message: result.message,
          errors: result.errors
        };
        uploads.push(upload);
      }
    }
  });

  // Sort by timestamp (most recent first) and limit to 100
  return uploads
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 100);
};

// Function to load and parse completed uploads from API logs (for history)
export const loadCompletedUploadsFromLogs = async (): Promise<ParsedUpload[]> => {
  try {
    
    // Import the API function dynamically to avoid circular dependencies
    const { getLogs } = await import('./api');
    
    // Get logs from API (getLogs takes page and limit parameters)
    const response = await getLogs(1, 1000); // Get first page with 1000 logs
    
    
    if (!response.logs || !Array.isArray(response.logs)) {
      return [];
    }
    
    // Filter logs for upload-related actions before parsing
    const uploadLogs = response.logs.filter(log => 
      log.action === 'ADMIN_ACTION' || 
      log.action === 'SUPPLY_CREATE' ||
      (log.details?.metadata?.customAction === 'PRODUCT_CSV_UPLOAD') ||
      (log.details?.metadata?.customAction === 'SUPPLY_CSV_UPLOAD_ADMIN')
    );
    
    
    const uploads = parseUploadsFromLogs(uploadLogs);
    
    return uploads;
  } catch (error) {
    
    // Fallback to local logs if API fails
    try {
      const response = await fetch('/sixstep.logs.json');
      if (!response.ok) {
        throw new Error('Failed to load local logs');
      }
      
      const logData: LogEntry[] = await response.json();
      
      const uploads = parseUploadsFromLogs(logData);
      
      return uploads;
    } catch (fallbackError) {
      return [];
    }
  }
};

// Function to load active uploads from API
export const loadActiveUploads = async (): Promise<ParsedUpload[]> => {
  try {
    
    // Import the API function dynamically to avoid circular dependencies
    const { getActiveUploads } = await import('./api');
    const response = await getActiveUploads();
    
    
    // Transform API response to ParsedUpload format
    if (response.uploads && Array.isArray(response.uploads)) {
      return response.uploads.map((upload: any) => ({
        id: upload.id || upload.uploadId || `active-${Date.now()}`,
        userId: upload.userId || upload.user?.id || '',
        userName: upload.userName || upload.user?.name || 'Unknown User',
        userEmail: upload.userEmail || upload.user?.email || '',
        timestamp: upload.timestamp || upload.createdAt || Date.now(),
        action: upload.action || 'UPLOAD',
        fileName: upload.fileName || upload.filename,
        warehouse: upload.warehouse,
        totalRows: upload.totalRows || upload.total || 0,
        processedRows: upload.processedRows || upload.processed || 0,
        created: upload.created || 0,
        updated: upload.updated || 0,
        skipped: upload.skipped || 0,
        success: upload.success || upload.status === 'completed',
        message: upload.message || upload.status || 'Processing...',
        errors: upload.errors || [],
        entityId: upload.entityId
      }));
    }
    
    return [];
  } catch (error) {
    // Fallback to empty array if API fails
    return [];
  }
};
