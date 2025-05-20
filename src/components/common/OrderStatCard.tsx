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
      case 'blue': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' };
      case 'yellow': return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'bg-yellow-100' };
      case 'green': return { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' };
      case 'purple': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' };
      default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'bg-gray-100' };
    }
  };
  
  const colorClass = getColorClasses(color);
  
  return (
    <div className={`${colorClass.bg} rounded-lg p-3 flex items-center justify-between min-h-[80px] shadow-sm transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center gap-3">
        <div className={`${colorClass.icon} ${colorClass.text} p-2 rounded-full`}>
          {icon}
        </div>
        <div>
          <div className={`${colorClass.text} text-sm font-medium`}>{title}</div>
          {description && <div className="text-xs text-gray-400" title={description}>{description}</div>}
        </div>
      </div>
      <div className={`text-2xl font-bold ${colorClass.text}`}>{value}</div>
    </div>
  );
};

export default OrderStatCard; 