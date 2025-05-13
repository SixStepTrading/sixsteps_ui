import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import PurchaseOrders from './components/PurchaseOrders/PurchaseOrders';
import UserManagement from './components/UserManagement/UserManagement';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MainLayout>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
