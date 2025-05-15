import React from 'react';

interface IconWithBadgeProps {
  icon: React.ReactElement;
  badgeContent?: number;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  showZero?: boolean;
  className?: string;
}

const IconWithBadge: React.FC<IconWithBadgeProps> = ({
  icon,
  badgeContent,
  color = 'error',
  showZero = false,
  className
}) => {
  // If no badge content or it's 0 and we don't want to show zero, show only the icon
  if (badgeContent === undefined || (badgeContent === 0 && !showZero)) {
    return icon;
  }
  
  // Map Material UI colors to Tailwind classes
  const colorClasses = {
    default: 'bg-gray-500 text-white',
    primary: 'bg-blue-600 text-white',
    secondary: 'bg-purple-600 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-400 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-amber-500 text-white'
  };
  
  return (
    <div className={`relative inline-flex ${className || ''}`}>
      {icon}
      <span className={`
        absolute -top-1.5 -right-1.5 
        flex items-center justify-center 
        min-w-[18px] h-[18px] 
        text-xs font-bold 
        rounded-full 
        px-1
        ${colorClasses[color]}
      `}>
        {badgeContent > 99 ? '99+' : badgeContent}
      </span>
    </div>
  );
};

export default IconWithBadge; 