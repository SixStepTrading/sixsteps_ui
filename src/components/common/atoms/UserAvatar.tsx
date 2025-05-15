import React from 'react';

interface UserAvatarProps {
  name: string;
  role?: string;
  avatarSrc?: string;
  size?: 'small' | 'medium' | 'large';
  showInfo?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  role,
  avatarSrc,
  size = 'medium',
  showInfo = true,
  className,
  onClick
}) => {
  // Determine avatar sizes based on size prop
  const avatarSizes = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const initials = getInitials(name || 'User');
  
  return (
    <div 
      className={`
        flex items-center 
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className || ''}
      `}
      onClick={onClick}
    >
      <div 
        className={`
          ${avatarSizes[size]}
          bg-blue-600 text-white
          rounded-full
          flex items-center justify-center
          font-medium
          transition-all duration-200
          ${onClick ? 'hover:scale-105 hover:shadow-[0_0_0_2px_rgba(37,99,235,0.3)]' : ''}
        `}
      >
        {avatarSrc ? (
          <img 
            src={avatarSrc} 
            alt={name} 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          initials
        )}
      </div>
      
      {showInfo && (
        <div className="ml-3">
          <div className={`
            font-medium 
            ${size === 'small' ? 'text-xs' : 'text-sm'}
            leading-tight
          `}>
            {name}
          </div>
          
          {role && (
            <div className={`
              text-gray-500
              ${size === 'small' ? 'text-[0.65rem]' : 'text-xs'}
              leading-tight
            `}>
              {role}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar; 