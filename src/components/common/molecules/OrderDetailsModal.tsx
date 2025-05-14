import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Button,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';

// Interfaccia per i dettagli del prodotto nell'ordine
export interface OrderProductDetail {
  id: string;
  name: string;
  code: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// Interfaccia per i dettagli dell'ordine
export interface OrderDetailData {
  id: string;
  createdOn: string;
  status: 'Approved' | 'Pending Approval' | 'Processing' | 'Draft';
  totalProducts: number;
  totalAmount: number;
  deliveryAddress?: string;
  deliveryDate?: string;
  paymentMethod?: string;
  notes?: string;
  products: OrderProductDetail[];
}

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  orderDetails: OrderDetailData | null;
  onPrint?: () => void;
  onDownload?: () => void;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  onClose,
  orderDetails,
  onPrint,
  onDownload
}) => {
  if (!orderDetails) return null;

  // Ottieni il colore del chip in base allo stato dell'ordine
  const getStatusColor = () => {
    switch (orderDetails.status) {
      case 'Approved':
        return 'success';
      case 'Pending Approval':
        return 'warning';
      case 'Processing':
        return 'info';
      case 'Draft':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box>
          <Typography variant="h6">
            Order Details - {orderDetails.id}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Created on {orderDetails.createdOn}
            </Typography>
            <Chip 
              size="small" 
              label={orderDetails.status} 
              color={getStatusColor()} 
              variant={orderDetails.status === 'Draft' ? 'outlined' : 'filled'}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex' }}>
          {onDownload && (
            <IconButton onClick={onDownload} size="small" sx={{ mr: 1 }}>
              <DownloadIcon />
            </IconButton>
          )}
          {onPrint && (
            <IconButton onClick={onPrint} size="small" sx={{ mr: 1 }}>
              <PrintIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 2 }}>
        {/* Informazioni generali dell'ordine */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>Order Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Products:</Typography>
                  <Typography variant="body2">{orderDetails.totalProducts}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    €{orderDetails.totalAmount.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </Typography>
                </Box>
                {orderDetails.paymentMethod && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Payment Method:</Typography>
                    <Typography variant="body2">{orderDetails.paymentMethod}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: '50%' } }}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>Delivery Information</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {orderDetails.deliveryAddress && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">Delivery Address:</Typography>
                    <Typography variant="body2">{orderDetails.deliveryAddress}</Typography>
                  </Box>
                )}
                {orderDetails.deliveryDate && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Delivery Date:</Typography>
                    <Typography variant="body2">{orderDetails.deliveryDate}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Box>
        </Stack>
        
        {/* Note se presenti */}
        {orderDetails.notes && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>Notes</Typography>
            <Typography variant="body2">{orderDetails.notes}</Typography>
          </Paper>
        )}
        
        {/* Tabella prodotti */}
        <Typography variant="subtitle1" gutterBottom>Ordered Products</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product Code</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderDetails.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{product.quantity}</TableCell>
                  <TableCell align="right">
                    €{product.unitPrice.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </TableCell>
                  <TableCell align="right">
                    €{product.totalPrice.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total:</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  €{orderDetails.totalAmount.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsModal; 