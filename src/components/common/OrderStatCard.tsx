import React from 'react';

interface OrderStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'gray';
  description?: string;
}

const OrderStatCard: React.FC<OrderStatCardProps> = ({ title, value, icon, color, description }) => {
  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return { 
        bg: 'bg-blue-50 dark:bg-blue-900/30', 
        text: 'text-blue-600 dark:text-blue-400', 
        icon: 'bg-blue-100 dark:bg-blue-800/50' 
      };
      case 'yellow': return { 
        bg: 'bg-yellow-50 dark:bg-yellow-900/30', 
        text: 'text-yellow-600 dark:text-yellow-400', 
        icon: 'bg-yellow-100 dark:bg-yellow-800/50' 
      };
      case 'green': return { 
        bg: 'bg-green-50 dark:bg-green-900/30', 
        text: 'text-green-600 dark:text-green-400', 
        icon: 'bg-green-100 dark:bg-green-800/50' 
      };
      case 'purple': return { 
        bg: 'bg-purple-50 dark:bg-purple-900/30', 
        text: 'text-purple-600 dark:text-purple-400', 
        icon: 'bg-purple-100 dark:bg-purple-800/50' 
      };
      default: return { 
        bg: 'bg-gray-50 dark:bg-gray-800/50', 
        text: 'text-gray-600 dark:text-gray-400', 
        icon: 'bg-gray-100 dark:bg-gray-700' 
      };
    }
  };
  
  const colorClass = getColorClasses(color);
  
  return (
    <div className={`${colorClass.bg} rounded-lg p-3 flex items-center justify-between min-h-[80px] shadow-sm dark:shadow-dark-sm transition-all duration-200 hover:shadow-md dark:hover:shadow-dark-md border dark:border-dark-border-primary`}>
      <div className="flex items-center gap-3">
        <div className={`${colorClass.icon} ${colorClass.text} p-2 rounded-full`}>
          {icon}
        </div>
        <div>
          <div className={`${colorClass.text} text-sm font-medium`}>{title}</div>
          {description && <div className="text-xs text-gray-400 dark:text-gray-500" title={description}>{description}</div>}
        </div>
      </div>
      <div className={`text-2xl font-bold ${colorClass.text}`}>{value}</div>
    </div>
  );
};

export default OrderStatCard; 