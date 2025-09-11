import React, { useState, useRef, useEffect } from 'react';

interface SearchableDropdownProps {
  options: Array<{
    id: string;
    name: string;
    type?: string;
    country?: string;
    status?: string;
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  selectedId,
  onSelect,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(search.toLowerCase())
  );

  // Get selected option
  const selectedOption = options.find(option => option.id === selectedId);

  const handleSelect = (optionId: string) => {
    onSelect(optionId);
    setIsOpen(false);
    setSearch('');
  };

  const toggleDropdown = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearch('');
      }
    }
  };

  const getTypeColorClasses = (type?: string) => {
    switch (type) {
      case 'SUPPLIER':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'MANAGER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'PHARMACY':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'PHARMA':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'LANDLORD':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'TENANT':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled || loading}
        className={`
          w-full px-2.5 py-1.5 text-left border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent
          bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
          ${disabled || loading 
            ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {loading ? (
              <span className="text-gray-500 dark:text-gray-400">Loading...</span>
            ) : selectedOption ? (
              <div>
                <div className="font-medium truncate">{selectedOption.name}</div>
                {selectedOption.type && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedOption.type} {selectedOption.country && `• ${selectedOption.country}`}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </div>
          <div className="ml-2 flex-shrink-0">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          {/* Search Box */}
          <div className="p-1.5 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-8 pr-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`
                    p-2 cursor-pointer transition-colors border-b border-gray-200 dark:border-gray-600 last:border-b-0
                    ${selectedId === option.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate text-sm ${selectedId === option.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                        {option.name}
                      </div>
                      {option.country && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {option.country}
                        </div>
                      )}
                    </div>
                    {option.type && (
                      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${getTypeColorClasses(option.type)}`}>
                        {option.type}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
