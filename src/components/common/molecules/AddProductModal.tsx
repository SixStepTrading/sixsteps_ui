import React, { useState } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  IconButton,
  Typography,
  InputAdornment,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export interface ProductFormData {
  productCode: string;
  productName: string;
  publicPrice: number;
  stockQuantity: number;
  stockPrice: number;
  manufacturer: string;
  vat: number;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onAddProduct: (productData: ProductFormData) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  open,
  onClose,
  onAddProduct
}) => {
  const initialFormData: ProductFormData = {
    productCode: '',
    productName: '',
    publicPrice: 0,
    stockQuantity: 0,
    stockPrice: 0,
    manufacturer: '',
    vat: 10
  };

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const handleChange = (field: keyof ProductFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'productCode' || field === 'productName' || field === 'manufacturer'
      ? event.target.value 
      : parseFloat(event.target.value);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when field is changed
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    
    if (!formData.productCode.trim()) {
      newErrors.productCode = 'Product code is required';
    }
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    
    if (formData.publicPrice <= 0) {
      newErrors.publicPrice = 'Public price must be greater than zero';
    }
    
    if (formData.stockQuantity < 0) {
      newErrors.stockQuantity = 'Stock quantity cannot be negative';
    }
    
    if (formData.stockPrice <= 0) {
      newErrors.stockPrice = 'Stock price must be greater than zero';
    }

    if (!formData.manufacturer.trim()) {
      newErrors.manufacturer = 'Manufacturer is required';
    }
    
    if (formData.vat <= 0 || formData.vat > 100) {
      newErrors.vat = 'VAT must be between 1 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onAddProduct(formData);
      setFormData(initialFormData);
      onClose();
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          Add New Product
        </Typography>
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ p: 1 }}>
          {/* First row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Product Code"
                variant="outlined"
                value={formData.productCode}
                onChange={handleChange('productCode')}
                error={!!errors.productCode}
                helperText={errors.productCode}
                required
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Product Name"
                variant="outlined"
                value={formData.productName}
                onChange={handleChange('productName')}
                error={!!errors.productName}
                helperText={errors.productName}
                required
              />
            </Box>
          </Box>
          
          {/* Second row - Manufacturer and VAT */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Manufacturer"
                variant="outlined"
                value={formData.manufacturer}
                onChange={handleChange('manufacturer')}
                error={!!errors.manufacturer}
                helperText={errors.manufacturer}
                required
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="VAT"
                variant="outlined"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { min: 1, max: 100, step: 1 }
                }}
                value={formData.vat}
                onChange={handleChange('vat')}
                error={!!errors.vat}
                helperText={errors.vat}
                required
              />
            </Box>
          </Box>
          
          {/* Third row */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Public Price"
                variant="outlined"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                value={formData.publicPrice}
                onChange={handleChange('publicPrice')}
                error={!!errors.publicPrice}
                helperText={errors.publicPrice}
                required
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Stock Quantity"
                variant="outlined"
                type="number"
                InputProps={{
                  inputProps: { min: 0 }
                }}
                value={formData.stockQuantity}
                onChange={handleChange('stockQuantity')}
                error={!!errors.stockQuantity}
                helperText={errors.stockQuantity}
                required
              />
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                label="Stock Price"
                variant="outlined"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
                value={formData.stockPrice}
                onChange={handleChange('stockPrice')}
                error={!!errors.stockPrice}
                helperText={errors.stockPrice}
                required
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button 
          onClick={handleCancel} 
          color="inherit"
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary"
          variant="contained"
        >
          Add Product
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProductModal; 