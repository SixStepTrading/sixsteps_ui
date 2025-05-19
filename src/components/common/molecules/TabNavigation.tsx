import React from 'react';

// Componente singolo Tab
export interface TabProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export const Tab: React.FC<TabProps> = ({ id, label, icon, active, onClick }) => {
  return (
    <button
      id={id}
      className={`flex items-center px-4 py-2 space-x-2 rounded-md transition-colors ${
        active 
          ? 'bg-blue-100 text-blue-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      {icon && (
        <span className={active ? 'text-blue-600' : 'text-gray-500'}>
          {icon}
        </span>
      )}
      <span>{label}</span>
    </button>
  );
};

// Componente principale di navigazione a tab
export interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="mb-6 border-b border-gray-200">
      <div className="flex space-x-4 overflow-x-auto">
        {tabs.map(tab => (
          <Tab
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default TabNavigation; 