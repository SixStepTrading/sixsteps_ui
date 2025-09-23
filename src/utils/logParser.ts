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
export const parseUploadsFromLogs = (logData: LogEntry[]): ParsedUpload[] => {
  const uploads: ParsedUpload[] = [];

  logData.forEach((entry) => {
    // Handle SUPPLY_CREATE uploads
    if (entry.action === 'SUPPLY_CREATE' && entry.details?.changes?.created?.uploadResult) {
      const result = entry.details.changes.created.uploadResult;
      const upload: ParsedUpload = {
        id: entry._id.$oid,
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
          id: entry._id.$oid,
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
          id: entry._id.$oid,
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

  // Sort by timestamp (most recent first) and limit to 20
  return uploads
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);
};

// Function to load and parse completed uploads from logs (for history)
export const loadCompletedUploadsFromLogs = async (): Promise<ParsedUpload[]> => {
  try {
    // Load the logs from the public directory
    const response = await fetch('/sixstep.logs.json');
    if (!response.ok) {
      throw new Error('Failed to load logs');
    }
    
    const logData: LogEntry[] = await response.json();
    console.log('📊 Loaded log data:', logData.length, 'entries');
    
    const uploads = parseUploadsFromLogs(logData);
    console.log('📤 Parsed completed uploads:', uploads.length, 'uploads');
    
    return uploads;
  } catch (error) {
    console.error('Error loading completed uploads from logs:', error);
    throw error;
  }
};

// Function to load active uploads (placeholder for now - would come from API)
export const loadActiveUploads = async (): Promise<ParsedUpload[]> => {
  try {
    // This would normally fetch from an API endpoint for active uploads
    // For now, return empty array as we don't have active uploads in logs
    console.log('🔄 Loading active uploads...');
    return [];
  } catch (error) {
    console.error('Error loading active uploads:', error);
    throw error;
  }
};
