import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Chip,
  Stack,
  Tab,
  Tabs,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  FormGroup,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAddAlt as PersonAddAltIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  LockReset as LockResetIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  ManageAccounts as ManageAccountsIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  LocalPharmacy as LocalPharmacyIcon,
  Medication as MedicationIcon,
  DeliveryDining as DeliveryDiningIcon,
  People as PeopleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useToast } from '../../contexts/ToastContext';

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
      id={`users-tabpanel-${index}`}
      aria-labelledby={`users-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastActivity: string;
  avatar: string;
}

const UserManagement: React.FC = () => {
  const { showToast } = useToast();
  const [tabValue, setTabValue] = useState(0);
  const [openNewUserDialog, setOpenNewUserDialog] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Simulated user data
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Marco Rossi',
      email: 'm.rossi@sixsteps.com',
      role: 'Admin',
      status: 'Active',
      lastActivity: 'May 9, 2023 - 10:45',
      avatar: '',
    },
    {
      id: 2,
      name: 'Laura Bianchi',
      email: 'l.bianchi@sixsteps.com',
      role: 'Pharmacist',
      status: 'Active',
      lastActivity: 'May 8, 2023 - 15:30',
      avatar: '',
    },
    {
      id: 3,
      name: 'Giuseppe Verdi',
      email: 'g.verdi@sixsteps.com',
      role: 'Manager',
      status: 'Active',
      lastActivity: 'May 9, 2023 - 09:15',
      avatar: '',
    },
    {
      id: 4,
      name: 'Anna Ferrari',
      email: 'a.ferrari@sixsteps.com',
      role: 'Supplier',
      status: 'Inactive',
      lastActivity: 'May 5, 2023 - 14:20',
      avatar: '',
    },
    {
      id: 5,
      name: 'Roberto Ricci',
      email: 'r.ricci@sixsteps.com',
      role: 'Operator',
      status: 'Active',
      lastActivity: 'May 9, 2023 - 11:45',
      avatar: '',
    },
  ]);

  // Recent User Activity
  const recentActivities = [
    { id: 1, user: 'Marco Rossi', action: 'User Created', details: 'Created new Pharmacist account', time: 'May 9, 2023 - 10:45', ip: '192.168.1.1' },
    { id: 2, user: 'Laura Bianchi', action: 'Order Created', details: 'Created order #ORD-2345', time: 'May 9, 2023 - 10:13', ip: '192.168.1.2' },
    { id: 3, user: 'Giuseppe Verdi', action: 'Product Update', details: 'Updated inventory level for 12 products', time: 'May 9, 2023 - 09:30', ip: '192.168.1.3' },
    { id: 4, user: 'Marco Rossi', action: 'User Deactivated', details: 'Deactivated user Chiara Colombo', time: 'May 8, 2023 - 16:35', ip: '192.168.1.1' },
    { id: 5, user: 'Roberto Ricci', action: 'Login', details: 'User logged in successfully', time: 'May 9, 2023 - 08:00', ip: '192.168.1.5' },
  ];

  // Roles overview data
  const rolesData = [
    { role: 'Administrator', count: 2, color: '#1976d2', icon: <AdminPanelSettingsIcon /> },
    { role: 'Manager', count: 3, color: '#9c27b0', icon: <ManageAccountsIcon /> },
    { role: 'Pharmacist', count: 8, color: '#2e7d32', icon: <LocalPharmacyIcon /> },
    { role: 'Supplier', count: 5, color: '#ed6c02', icon: <BusinessIcon /> },
    { role: 'Operator', count: 4, color: '#0288d1', icon: <PersonIcon /> },
  ];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenNewUserDialog = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      password: '',
      confirmPassword: '',
      status: 'Active',
    });
    setOpenNewUserDialog(true);
  };

  const handleCloseNewUserDialog = () => {
    setOpenNewUserDialog(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: name === 'status' ? value : value,
    });
  };

  const handleCreateUser = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    // Create new user
    const newUser: User = {
      id: users.length + 1,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      lastActivity: 'Just now',
      avatar: '',
    };

    setUsers([...users, newUser]);
    showToast('User created successfully', 'success');
    handleCloseNewUserDialog();
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: '',
      status: user.status,
    });
    setOpenNewUserDialog(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    // Validation
    if (!formData.name || !formData.email || !formData.role) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const updatedUsers = users.map(user => {
      if (user.id === selectedUser.id) {
        return {
          ...user,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };
      }
      return user;
    });

    setUsers(updatedUsers);
    showToast('User updated successfully', 'success');
    handleCloseNewUserDialog();
  };

  const handleConfirmDelete = (userId: number) => {
    setUserToDelete(userId);
    setOpenConfirmDialog(true);
  };

  const handleDeleteUser = () => {
    if (userToDelete === null) return;

    const updatedUsers = users.filter(user => user.id !== userToDelete);
    setUsers(updatedUsers);
    setOpenConfirmDialog(false);
    setUserToDelete(null);
    showToast('User deleted successfully', 'success');
  };

  const handleResetPassword = (user: User) => {
    showToast(`Reset password email sent to ${user.email}`, 'info');
  };

  const handleSendEmail = (user: User) => {
    showToast(`Email sent to ${user.email}`, 'success');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'primary';
      case 'Manager':
        return 'secondary';
      case 'Pharmacist':
        return 'success';
      case 'Supplier':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <AdminPanelSettingsIcon fontSize="small" />;
      case 'Manager':
        return <ManageAccountsIcon fontSize="small" />;
      case 'Pharmacist':
        return <LocalPharmacyIcon fontSize="small" />;
      case 'Supplier':
        return <BusinessIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'medium' }}>User Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenNewUserDialog}
        >
          Create New User
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="user management tabs"
          sx={{ px: 2 }}
        >
          <Tab label="All Users" />
          <Tab label="Active" />
          <Tab label="Inactive" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader 
                title="Existing Users" 
                titleTypographyProps={{ variant: 'h6' }}
                action={
                  <TextField
                    placeholder="Search users..."
                    size="small"
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                    sx={{ width: 250 }}
                  />
                }
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users
                        .filter(user => {
                          if (tabValue === 1) return user.status === 'Active';
                          if (tabValue === 2) return user.status === 'Inactive';
                          return true;
                        })
                        .map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    mr: 2, 
                                    bgcolor: user.status === 'Active' ? 'primary.main' : 'text.disabled' 
                                  }}
                                >
                                  {user.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body1">{user.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getRoleIcon(user.role)}
                                label={user.role}
                                color={getRoleColor(user.role)}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.status}
                                color={user.status === 'Active' ? 'success' : 'default'}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{user.lastActivity}</TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="info"
                                  onClick={() => handleResetPassword(user)}
                                >
                                  <LockResetIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="secondary"
                                  onClick={() => handleSendEmail(user)}
                                >
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleConfirmDelete(user.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardHeader 
                title="Recent User Activity" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <Divider />
              <CardContent sx={{ p: 0 }}>
                <TableContainer sx={{ maxHeight: 350 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Details</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>IP Address</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{activity.user}</TableCell>
                          <TableCell>
                            <Chip 
                              label={activity.action} 
                              size="small" 
                              variant="outlined"
                              color={
                                activity.action.includes('Created') ? 'success' :
                                activity.action.includes('Update') ? 'info' :
                                activity.action.includes('Deactivated') ? 'error' :
                                'default'
                              }
                            />
                          </TableCell>
                          <TableCell>{activity.details}</TableCell>
                          <TableCell>{activity.time}</TableCell>
                          <TableCell>{activity.ip}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="User Roles Overview" 
                titleTypographyProps={{ variant: 'h6' }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  {rolesData.map((role) => (
                    <Box 
                      key={role.role} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: `${role.color}15`, 
                            color: role.color, 
                            mr: 2,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getRoleIcon(role.role)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{role.role}</Typography>
                          <Typography variant="body2" color="text.secondary">Users with this role</Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{role.count}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Form Dialog */}
      <Dialog
        open={openNewUserDialog}
        onClose={handleCloseNewUserDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Create New User'}
          <IconButton
            aria-label="close"
            onClick={handleCloseNewUserDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>User Information</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                margin="dense"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                margin="dense"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth margin="dense">
                <InputLabel id="role-label">Role *</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formData.role}
                  label="Role *"
                  onChange={(e) => handleFormChange(e as any)}
                >
                  <MenuItem value="Admin">Administrator</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Pharmacist">Pharmacist</MenuItem>
                  <MenuItem value="Supplier">Supplier</MenuItem>
                  <MenuItem value="Operator">Operator</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>Security</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={selectedUser ? "New Password" : "Password *"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleFormChange}
                margin="dense"
                required={!selectedUser}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleFormChange}
                margin="dense"
                required={!selectedUser}
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>Account Status</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.status === 'Active'} 
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        status: e.target.checked ? 'Active' : 'Inactive'
                      });
                    }}
                    color="primary"
                  />
                }
                label="Active Account"
              />
            </Grid>

            {selectedUser && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>Account Permissions</Typography>
                <FormGroup>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={<Checkbox defaultChecked />}
                        label="User Management"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={<Checkbox defaultChecked />}
                        label="Order Management"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={<Checkbox defaultChecked />}
                        label="Product Management"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControlLabel
                        control={<Checkbox />}
                        label="Financial Reports"
                      />
                    </Grid>
                  </Grid>
                </FormGroup>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseNewUserDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={selectedUser ? handleUpdateUser : handleCreateUser} 
            variant="contained"
            startIcon={selectedUser ? <EditIcon /> : <PersonAddAltIcon />}
          >
            {selectedUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 