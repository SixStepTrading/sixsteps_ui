import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import PurchaseOrdersLayout from './components/PurchaseOrders/PurchaseOrdersLayout';
import OrderDetailPage from './components/PurchaseOrders/OrderDetailPage';
import UserManagement from './components/UserManagement/UserManagement';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary font-sans transition-colors duration-200">
        <ToastProvider>
          <SidebarProvider>
            <UserProvider>
            <Router>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/purchase-orders" element={<PurchaseOrdersLayout />} />
                  <Route 
                    path="/purchase-orders/order/:orderId" 
                    element={<OrderDetailPage />} 
                  />
                    <Route 
                      path="/user-management" 
                      element={<PrivateRoute element={<UserManagement />} requiredRole="Admin" />} 
                    />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </Router>
            </UserProvider>
          </SidebarProvider>
        </ToastProvider>
      </div>
    </ThemeProvider>
  );
}

export default App;
