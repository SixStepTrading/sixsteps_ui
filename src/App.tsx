import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { UserProvider } from './contexts/UserContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './components/Dashboard/Dashboard';
import PurchaseOrders from './components/PurchaseOrders/PurchaseOrders';
import UserManagement from './components/UserManagement/UserManagement';
import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <ToastProvider>
        <SidebarProvider>
          <UserProvider>
          <Router>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/purchase-orders" element={<PurchaseOrders />} />
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
  );
}

export default App;
