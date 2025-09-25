import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

interface UploadResult {
  success: boolean;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  message: string;
  fileName?: string;
  timestamp: number;
}

interface UploadResultModalProps {
  open: boolean;
  onClose: () => void;
  result: UploadResult | null;
  uploadType: 'products' | 'stock';
}

const UploadResultModal: React.FC<UploadResultModalProps> = ({
  open,
  onClose,
  result,
  uploadType
}) => {
  if (!result) return null;

  const getStatusColor = () => {
    if (result.success) return 'success';
    if (result.errors.length > 0) return 'warning';
    return 'error';
  };

  const getStatusIcon = () => {
    if (result.success) return <CheckCircleIcon />;
    if (result.errors.length > 0) return <WarningIcon />;
    return <ErrorIcon />;
  };

  const getStatusMessage = () => {
    if (result.success) {
      return `Upload completato con successo! ${result.processedRows} elementi processati.`;
    }
    if (result.errors.length > 0) {
      return `Upload completato con ${result.errors.length} errori. ${result.processedRows} elementi processati.`;
    }
    return 'Upload fallito. Nessun elemento processato.';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
          minHeight: '60vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        bgcolor: getStatusColor() + '.main',
        color: getStatusColor() + '.contrastText',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getStatusIcon()}
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Risultato Upload {uploadType === 'products' ? 'Prodotti' : 'Stock'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3 }}>
        {/* Status Alert */}
        <Alert 
          severity={getStatusColor() as any} 
          sx={{ mb: 3 }}
          icon={getStatusIcon()}
        >
          <Typography variant="h6" gutterBottom>
            {getStatusMessage()}
          </Typography>
          <Typography variant="body2">
            {result.message}
          </Typography>
        </Alert>

        {/* Upload Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadIcon />
              Riepilogo Upload
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 2 }}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                  {result.totalRows}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Righe Totali
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {result.processedRows}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Processate
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {result.created}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Creati
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                  {result.updated}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aggiornati
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.200', borderRadius: 1 }}>
                <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  {result.skipped}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Saltati
                </Typography>
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progresso: {result.processedRows} / {result.totalRows} righe
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(result.processedRows / result.totalRows) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* File Info */}
            {result.fileName && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>File:</strong> {result.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Completato:</strong> {formatTimestamp(result.timestamp)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Errors Section */}
        {result.errors.length > 0 && (
          <Accordion sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ErrorIcon color="error" />
                <Typography variant="h6">
                  Errori ({result.errors.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List dense sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'error.light', borderRadius: 1 }}>
                {result.errors.map((error, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon>
                      <ErrorIcon fontSize="small" color="error" />
                    </ListItemIcon>
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
            </AccordionDetails>
          </Accordion>
        )}

        {/* Success Details */}
        {result.success && result.processedRows > 0 && (
          <Card sx={{ bgcolor: 'success.light' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="h6" color="success.main">
                  Upload Completato con Successo!
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {uploadType === 'products' 
                  ? `${result.created} nuovi prodotti creati e ${result.updated} prodotti aggiornati.`
                  : `${result.created} nuovi stock creati e ${result.updated} stock aggiornati.`
                }
              </Typography>
              
              {result.skipped > 0 && (
                <Typography variant="body2" color="warning.main">
                  {result.skipped} elementi sono stati saltati (duplicati o errori di validazione).
                </Typography>
              )}
            </CardContent>
          </Card>
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
          variant="contained"
          color={getStatusColor() as any}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            px: 3
          }}
        >
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadResultModal;
