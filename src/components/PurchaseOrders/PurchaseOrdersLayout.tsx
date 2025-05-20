import React, { useState } from 'react';
import TabNavigation from '../common/molecules/TabNavigation';
import PurchaseOrders from './PurchaseOrders';
import ManageOrders from './ManageOrders';
import { useUser } from '../../contexts/UserContext';

// Icons
const DocumentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
  </svg>
);

const PurchaseOrdersLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('orders');
  const { userRole } = useUser();
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Only include the Manage Orders tab if the user is an Admin
  const tabs = [
    { id: 'orders', label: 'My Orders', icon: <DocumentsIcon /> },
    ...(userRole === 'Admin' ? [{ id: 'manage', label: 'Manage Orders', icon: <AdminIcon /> }] : [])
  ];

  return (
    <div className="flex-grow p-3 pb-20">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-medium">Purchase Orders</h1>
          <p className="text-gray-500 text-sm">View and manage your purchase orders</p>
        </div>
      </div>

      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs} />

      {activeTab === 'orders' && <PurchaseOrders />}
      {activeTab === 'manage' && userRole === 'Admin' && <ManageOrders />}
    </div>
  );
};

export default PurchaseOrdersLayout; 