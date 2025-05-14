import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Stack,
  Tabs,
  Tab,
  Paper,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudDownload as CloudDownloadIcon,
  Print as PrintIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useToast } from '../../contexts/ToastContext';
import { getDraftOrders, deleteDraftOrder, DraftOrder } from '../../utils/draftOrderService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`orders-tabpanel-${index}`}
      aria-labelledby={`orders-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `orders-tab-${index}`,
    'aria-controls': `orders-tabpanel-${index}`,
  };
}

const PurchaseOrders: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);

  // Load draft orders on component mount
  useEffect(() => {
    setDraftOrders(getDraftOrders());
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddOrder = () => {
    navigate('/purchase-orders/create');
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event: any) => {
    setFilterStatus(event.target.value);
  };

  const handleViewOrder = (id: string) => {
    showToast(`Viewing order ${id}`, 'info');
  };

  const handleEditOrder = (id: string) => {
    showToast(`Editing order ${id}`, 'info');
  };

  const handleDeleteOrder = (id: string) => {
    showToast(`Order ${id} deleted`, 'success');
  };

  const handleExportOrders = () => {
    showToast('Orders exported successfully', 'success');
  };

  const handlePrintOrder = (id: string) => {
    showToast(`Printing order ${id}`, 'info');
  };

  const handleSendOrder = (id: string) => {
    showToast(`Order ${id} sent to supplier`, 'success');
  };

  const handleDeleteDraft = (id: string) => {
    if (deleteDraftOrder(id)) {
      setDraftOrders(getDraftOrders());
      showToast('Draft order deleted', 'success');
    } else {
      showToast('Failed to delete draft order', 'error');
    }
  };

  const handleEditDraft = (id: string) => {
    // In a real app, you would implement a way to load the draft for editing
    showToast('Edit draft functionality not implemented yet', 'info');
  };

  // Orders data
  const orders = [
    { 
      id: 1, 
      orderNo: 'PUR-234',
      supplier: 'MedPharma Supplies',
      date: '2023-05-05',
      total: 54320.00,
      status: 'Pending'
    },
    { 
      id: 2, 
      orderNo: 'PUR-235',
      supplier: 'HealthCare Suppliers',
      date: '2023-05-07',
      total: 42650.50,
      status: 'Processing'
    },
    { 
      id: 3, 
      orderNo: 'PUR-236',
      supplier: 'Farmacia Retail',
      date: '2023-05-08',
      total: 67350.25,
      status: 'Shipped'
    },
    { 
      id: 4, 
      orderNo: 'PUR-237',
      supplier: 'MedPharma Supplies',
      date: '2023-05-09',
      total: 34175.75,
      status: 'Delivered'
    },
    { 
      id: 5, 
      orderNo: 'PUR-238',
      supplier: 'Farmacia Retail',
      date: '2023-05-10',
      total: 12450.30,
      status: 'Pending'
    },
    { 
      id: 6, 
      orderNo: 'PUR-239',
      supplier: 'HealthCare Suppliers',
      date: '2023-05-11',
      total: 43750.00,
      status: 'Processing'
    },
  ];

  // Order Line Items
  const orderItems = [
    { id: 1, product: 'Paracetamol 500mg', code: 'MED-001', qty: 50, price: 5.99, total: 299.50 },
    { id: 2, product: 'Amoxicillin 250mg', code: 'MED-002', qty: 25, price: 12.50, total: 312.50 },
    { id: 3, product: 'Vitamin D3 1000IU', code: 'MED-003', qty: 100, price: 8.25, total: 825.00 },
    { id: 4, product: 'Ibuprofen 400mg', code: 'MED-004', qty: 60, price: 6.75, total: 405.00 },
  ];

  // DataGrid columns
  const columns: GridColDef[] = [
    { 
      field: 'orderNo', 
      headerName: 'Order No', 
      flex: 1, 
      minWidth: 150,
    },
    { 
      field: 'supplier', 
      headerName: 'Supplier', 
      flex: 1.5, 
      minWidth: 200,
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      flex: 1, 
      minWidth: 120,
    },
    { 
      field: 'total', 
      headerName: 'Total', 
      flex: 1, 
      minWidth: 120,
      renderCell: (params) => (
        <Typography>€{params.value.toFixed(2)}</Typography>
      ),
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1, 
      minWidth: 140,
      renderCell: (params) => {
        let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined;
        switch(params.value) {
          case 'Pending':
            color = 'warning';
            break;
          case 'Processing':
            color = 'info';
            break;
          case 'Shipped':
            color = 'primary';
            break;
          case 'Delivered':
            color = 'success';
            break;
          default:
            color = 'default';
        }
        return (
          <Chip 
            label={params.value} 
            color={color} 
            size="small" 
            variant="outlined"
          />
        );
      },
    },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      flex: 1.5, 
      minWidth: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton 
            size="small"
            color="primary"
            onClick={() => handleViewOrder(params.row.orderNo)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            color="secondary"
            onClick={() => handleEditOrder(params.row.orderNo)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            color="error"
            onClick={() => handleDeleteOrder(params.row.orderNo)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small"
            color="info"
            onClick={() => handleSendOrder(params.row.orderNo)}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>Purchase Orders Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddOrder}
        >
          Create New Order
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="orders tabs"
            sx={{ px: 2 }}
          >
            <Tab label="All Orders" {...a11yProps(0)} />
            <Tab label="Pending" {...a11yProps(1)} />
            <Tab label="Processing" {...a11yProps(2)} />
            <Tab label="Shipped" {...a11yProps(3)} />
            <Tab label="Delivered" {...a11yProps(4)} />
            <Tab label="Drafts" {...a11yProps(5)} />
          </Tabs>
        </Box>
      </Paper>

      <Card>
        <CardHeader
          title="Manage Purchase Orders"
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Stack direction="row" spacing={1}>
              <Button 
                variant="outlined" 
                startIcon={<CloudDownloadIcon />} 
                size="small"
                onClick={handleExportOrders}
              >
                Export
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<PrintIcon />} 
                size="small"
                onClick={() => handlePrintOrder('all')}
              >
                Print
              </Button>
            </Stack>
          }
        />
        <Divider />
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search orders by number or supplier..."
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  id="status-filter"
                  value={filterStatus}
                  label="Status"
                  onChange={handleStatusFilterChange}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Processing">Processing</MenuItem>
                  <MenuItem value="Shipped">Shipped</MenuItem>
                  <MenuItem value="Delivered">Delivered</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredOrders}
              columns={columns}
              disableColumnMenu
              disableRowSelectionOnClick
              pagination
              pageSizeOptions={[5, 10, 25]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 5 },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader
            title="Order Volume Trends"
            titleTypographyProps={{ variant: 'h6' }}
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    border: '1px solid #eee', 
                    borderRadius: 1, 
                    bgcolor: '#f9f9f9' 
                  }}
                >
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>€142,350</Typography>
                  <Typography variant="body2" color="text.secondary">Total Purchase Value</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    border: '1px solid #eee', 
                    borderRadius: 1, 
                    bgcolor: '#f9f9f9' 
                  }}
                >
                  <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>42</Typography>
                  <Typography variant="body2" color="text.secondary">Orders This Month</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box 
                  sx={{ 
                    p: 2, 
                    textAlign: 'center', 
                    border: '1px solid #eee', 
                    borderRadius: 1, 
                    bgcolor: '#f9f9f9' 
                  }}
                >
                  <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>8</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Approvals</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader
            title="Recently Added Items"
            titleTypographyProps={{ variant: 'h6' }}
          />
          <Divider />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table aria-label="recent items table">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell align="right">{item.qty}</TableCell>
                      <TableCell align="right">€{item.price.toFixed(2)}</TableCell>
                      <TableCell align="right">€{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      <TabPanel value={tabValue} index={5}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Draft Orders</Typography>
          {draftOrders.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No draft orders found.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Draft ID</TableCell>
                    <TableCell>Date Created</TableCell>
                    <TableCell>Products</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftOrders.map((draft) => (
                    <TableRow key={draft.id}>
                      <TableCell>{draft.name || draft.id.replace('draft-', 'Draft #')}</TableCell>
                      <TableCell>
                        {new Date(draft.timestamp).toLocaleDateString()} {new Date(draft.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{draft.items.length} products</TableCell>
                      <TableCell align="right">€{draft.totalAmount.toFixed(2)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleEditDraft(draft.id)}
                          title="Edit draft"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => handleDeleteDraft(draft.id)}
                          title="Delete draft"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </TabPanel>
    </Box>
  );
};

export default PurchaseOrders; 