import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import OrderConfirmationModal, { ProductItem, OrderData } from '../common/molecules/OrderConfirmationModal';
import { ActionBar } from '../common/reusable';
import { useToast } from '../../contexts/ToastContext';
import { saveDraftOrder } from '../../utils/draftOrderService';

// Mock products for demonstration
const mockProducts = [
  {
    id: 'PC500-20',
    name: 'Paracetamol 500mg',
    code: 'PC500-20',
    supplier: 'Angelini',
    price: 3.95,
    stock: 120
  },
  {
    id: 'IB400-30',
    name: 'Ibuprofene 400mg',
    code: 'IB400-30',
    supplier: 'Sandoz',
    price: 5.25,
    stock: 85
  },
  {
    id: 'CL-IDR-10',
    name: 'Collirio Idratante',
    code: 'CL-IDR-10',
    supplier: 'Bausch & Lomb',
    price: 7.20,
    stock: 42
  },
  {
    id: 'MV-CMP-60',
    name: 'Multivitaminico Complex',
    code: 'MV-CMP-60',
    supplier: 'Zentiva',
    price: 12.50,
    stock: 65
  },
  {
    id: 'AM-250-20',
    name: 'Amoxicillina 250mg',
    code: 'AM-250-20',
    supplier: 'Teva',
    price: 8.75,
    stock: 30
  }
];

interface CartItem {
  product: typeof mockProducts[0];
  quantity: number;
  selected: boolean;
}

const OrderCreation: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  
  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter products based on search term
  const filteredProducts = mockProducts.filter(
    product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Add product to cart
  const addToCart = (product: typeof mockProducts[0]) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCartItems([...cartItems, { product, quantity: 1, selected: true }]);
    }
    
    showToast(`Added ${product.name} to cart`, 'success');
  };
  
  // Update quantity
  const updateQuantity = (id: string, amount: number) => {
    setCartItems(cartItems.map(item => {
      if (item.product.id === id) {
        const newQuantity = Math.max(1, item.quantity + amount); // Ensure minimum is 1
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };
  
  // Remove from cart
  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== id));
    showToast('Item removed from cart', 'info');
  };
  
  // Toggle selection
  const toggleItemSelection = (id: string) => {
    setCartItems(cartItems.map(item => 
      item.product.id === id 
        ? { ...item, selected: !item.selected } 
        : item
    ));
  };

  // Select all
  const toggleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected);
    setCartItems(cartItems.map(item => ({ ...item, selected: !allSelected })));
  };
  
  // Cart summary
  const selectedItems = cartItems.filter(item => item.selected);
  const selectedCount = selectedItems.length;
  const totalItems = cartItems.length;
  const totalAmount = selectedItems.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0);
  
  // Format cart items for the confirmation modal
  const getCartItemsForModal = (): ProductItem[] => {
    return selectedItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      code: item.product.code,
      supplier: item.product.supplier,
      quantity: item.quantity,
      unitPrice: item.product.price
    }));
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    try {
      // Save to localStorage
      const draft = saveDraftOrder({
        items: selectedItems,
        totalAmount,
        timestamp: new Date().toISOString()
      });
      
      showToast('Order saved as draft', 'success');
      // Navigate back to purchase orders page
      navigate('/purchase-orders');
    } catch (error) {
      showToast('Failed to save draft', 'error');
    }
  };
  
  // Handle create order
  const handleCreateOrder = () => {
    if (selectedCount === 0) {
      showToast('Please select at least one item', 'error');
      return;
    }
    
    setConfirmationModalOpen(true);
  };

  // Handle order submission from the modal
  const handleSubmitOrder = (orderData: OrderData) => {
    // In a real app, you would submit this to your backend
    const order = {
      ...orderData,
      items: getCartItemsForModal(),
      totalAmount,
      timestamp: new Date().toISOString()
    };
    
    console.log('Submitting order:', order);
    showToast('Order submitted successfully', 'success');
    
    // Clear the cart and navigate back to purchase orders
    setCartItems([]);
    navigate('/purchase-orders');
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Create Purchase Order</Typography>
      
      {/* Product catalog */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Product Catalog</Typography>
          
          <TextField
            fullWidth
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.code}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.supplier}</TableCell>
                    <TableCell align="right">€{product.price.toFixed(2)}</TableCell>
                    <TableCell align="right">{product.stock}</TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addToCart(product)}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      {/* Shopping cart */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Selected Products</Typography>
            <Button 
              size="small" 
              onClick={toggleSelectAll}
            >
              {cartItems.every(item => item.selected) ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
          
          {cartItems.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No products added yet. Browse the catalog above.
              </Typography>
            </Paper>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={cartItems.length > 0 && cartItems.every(item => item.selected)}
                        indeterminate={cartItems.some(item => item.selected) && !cartItems.every(item => item.selected)}
                        onChange={toggleSelectAll}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.product.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={item.selected}
                          onChange={() => toggleItemSelection(item.product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.product.code}</Typography>
                      </TableCell>
                      <TableCell>{item.product.supplier}</TableCell>
                      <TableCell align="right">€{item.product.price.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <IconButton 
                            size="small" 
                            onClick={() => updateQuantity(item.product.id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2">{item.quantity}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => updateQuantity(item.product.id, 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">€{(item.product.price * item.quantity).toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Bar at the bottom */}
      {cartItems.length > 0 && (
        <ActionBar
          selectedCount={selectedCount}
          totalItems={totalItems}
          totalAmount={totalAmount}
          onSaveAsDraft={handleSaveAsDraft}
          onCreateOda={handleCreateOrder}
        />
      )}

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        open={confirmationModalOpen}
        onClose={() => setConfirmationModalOpen(false)}
        onSaveAsDraft={handleSaveAsDraft}
        onSubmitOrder={handleSubmitOrder}
        products={getCartItemsForModal()}
        totalAmount={totalAmount}
      />
    </Box>
  );
};

export default OrderCreation; 