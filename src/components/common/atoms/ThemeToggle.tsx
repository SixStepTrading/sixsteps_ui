import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface ThemeToggleProps {
  isCollapsed?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isCollapsed = false }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg
        text-gray-700 dark:text-dark-text-secondary
        hover:bg-gray-100 dark:hover:bg-dark-bg-hover
        transition-all duration-200 ease-in-out
        ${isCollapsed ? 'justify-center' : 'justify-start'}
      `}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="relative w-5 h-5 mr-3 flex items-center justify-center">
        {/* Sun Icon (Light Mode) */}
        <svg
          className={`
            absolute w-5 h-5 transition-all duration-300 ease-in-out
            ${isDarkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>

        {/* Moon Icon (Dark Mode) */}
        <svg
          className={`
            absolute w-5 h-5 transition-all duration-300 ease-in-out
            ${isDarkMode ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </div>

      {!isCollapsed && (
        <span className="transition-opacity duration-200">
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}

      {/* Toggle Switch Visual */}
      {!isCollapsed && (
        <div className="ml-auto">
          <div
            className={`
              relative w-10 h-5 rounded-full transition-colors duration-200
              ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}
            `}
          >
            <div
              className={`
                absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm
                transition-transform duration-200 ease-in-out
                ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </div>
        </div>
      )}
    </button>
  );
};

export default ThemeToggle; 