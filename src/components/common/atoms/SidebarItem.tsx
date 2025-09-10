import React from 'react';
import { Link } from 'react-router-dom';
import IconWithBadge from './IconWithBadge';

interface SidebarItemProps {
  icon: React.ReactElement;
  text: string;
  to?: string;
  isSelected?: boolean;
  isCollapsed?: boolean;
  badgeContent?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  text,
  to,
  isSelected = false,
  isCollapsed = false,
  badgeContent,
  onClick,
  disabled = false
}) => {
  // Base classes for the button
  const buttonClasses = `
    relative
    flex 
    items-center 
    w-full 
    py-2.5
    px-3
    my-1
    rounded
    transition-colors
    duration-150
    ${disabled 
      ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-gray-600' 
      : isSelected 
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
        : 'hover:bg-gray-100 dark:hover:bg-dark-bg-hover text-gray-700 dark:text-dark-text-secondary'
    }
    ${isCollapsed ? 'justify-center mx-1' : 'justify-start mx-2'}
  `;

  // Classes for the icon
  const iconClasses = `
    ${isCollapsed ? '' : 'mr-3'}
    ${disabled 
      ? 'text-gray-400 dark:text-gray-600' 
      : isSelected 
        ? 'text-blue-600 dark:text-blue-400' 
        : 'text-gray-500 dark:text-dark-text-muted'
    }
    flex-shrink-0
  `;

  // Content to be rendered
  const content = (
    <div
      className={buttonClasses}
      onClick={disabled ? undefined : onClick}
    >
      {/* Indicator for selected item */}
      {isSelected && (
        <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-blue-600 dark:bg-blue-400 rounded-r"></div>
      )}
      
      {/* Icon with badge */}
      <div className={iconClasses}>
        {badgeContent !== undefined && badgeContent > 0 ? (
          <div className="relative">
            {icon}
            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 bg-red-500 dark:bg-red-600 text-white text-xs font-bold rounded-full">
              {badgeContent > 99 ? '99+' : badgeContent}
            </span>
          </div>
        ) : icon}
      </div>
      
      {/* Text (only when not collapsed) */}
      {!isCollapsed && (
        <span className={`text-sm ${isSelected ? 'font-medium' : 'font-normal'}`}>
          {text}
        </span>
      )}
    </div>
  );

  // Wrap with tooltip if collapsed
  const wrappedContent = isCollapsed ? (
    <div className="group relative">
      {content}
      <div className="absolute left-full ml-2 py-1 px-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded 
                      invisible opacity-0 group-hover:visible group-hover:opacity-100 
                      transition-opacity duration-300 whitespace-nowrap z-50">
        {text}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45"></div>
      </div>
    </div>
  ) : content;

  // Render as Link if 'to' prop is provided and not disabled, otherwise as a div
  return to && !disabled ? (
    <Link to={to} className="block no-underline">
      {wrappedContent}
    </Link>
  ) : (
    wrappedContent
  );
};

export default SidebarItem; 