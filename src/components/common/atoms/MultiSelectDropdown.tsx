import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allOptionsLabel?: string;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  allOptionsLabel = 'All Warehouses',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Special value for "All Warehouses"
  const ALL_VALUE = '__ALL__';
  
  // Check if "All Warehouses" is selected
  const isAllSelected = selectedValues.length === 0 || selectedValues.includes(ALL_VALUE);
  
  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      // Reset search when dropdown closes
      setSearchTerm('');
    }
  }, [isOpen]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const handleToggleOption = (value: string) => {
    if (value === ALL_VALUE) {
      // If "All Warehouses" is clicked, deselect everything else
      onChange([]);
    } else {
      // If a specific warehouse is clicked
      if (isAllSelected) {
        // If "All Warehouses" is currently selected, deselect it and select this warehouse
        onChange([value]);
      } else {
        // Toggle the specific warehouse
        const newValues = selectedValues.includes(value)
          ? selectedValues.filter(v => v !== value) // Remove if already selected
          : [...selectedValues, value]; // Add to selection
        
        // If no specific warehouses are selected, default back to "All"
        onChange(newValues.length === 0 ? [] : newValues);
      }
    }
  };
  
  const getDisplayText = () => {
    if (isAllSelected) {
      return allOptionsLabel;
    }
    
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option?.label || placeholder;
    }
    
    return `${selectedValues.length} warehouses selected`;
  };
  
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Dropdown button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 pl-3 pr-10 border border-gray-300 dark:border-dark-border-primary rounded-md leading-5 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm text-left flex items-center justify-between"
      >
        <span className={selectedValues.length === 0 ? 'text-gray-500 dark:text-dark-text-muted' : ''}>
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border-primary rounded-md shadow-lg max-h-80 flex flex-col">
          {/* Search box */}
          <div className="p-2 border-b border-gray-200 dark:border-dark-border-primary sticky top-0 bg-white dark:bg-dark-bg-secondary z-10">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-300 dark:border-dark-border-primary rounded-md bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <svg
                className="absolute left-2.5 top-2 w-4 h-4 text-gray-400 dark:text-dark-text-muted pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Scrollable options container */}
          <div className="overflow-y-auto max-h-60">
            {/* "All Warehouses" option */}
            <label
              className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors ${
                isAllSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={() => handleToggleOption(ALL_VALUE)}
                className="w-4 h-4 text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-dark-bg-tertiary border-gray-300 dark:border-dark-border-primary rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
              />
              <span className={`ml-2 text-sm ${isAllSelected ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-dark-text-primary'}`}>
                {allOptionsLabel}
              </span>
            </label>
            
            {/* Divider */}
            {filteredOptions.length > 0 && (
              <div className="border-t border-gray-200 dark:border-dark-border-primary my-1"></div>
            )}
            
            {/* Individual warehouse options */}
            {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value) && !isAllSelected;
            
            return (
              <label
                key={option.value}
                className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-bg-hover transition-colors ${
                  isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggleOption(option.value)}
                  className="w-4 h-4 text-green-600 dark:text-green-400 bg-gray-100 dark:bg-dark-bg-tertiary border-gray-300 dark:border-dark-border-primary rounded focus:ring-green-500 dark:focus:ring-green-400 focus:ring-2"
                />
                <span className={`ml-2 text-sm ${
                  isSelected 
                    ? 'font-medium text-green-700 dark:text-green-300' 
                    : 'text-gray-700 dark:text-dark-text-primary'
                }`}>
                  {option.label}
                </span>
              </label>
            );
          })}
          
          {/* No results message */}
          {filteredOptions.length === 0 && searchTerm && (
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-dark-text-muted text-center">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div>
                  <div className="font-medium">No results found</div>
                  <div className="text-xs">Try a different search term</div>
                </div>
              </div>
            </div>
          )}
          
          {options.length === 0 && !searchTerm && (
            <div className="px-3 py-4 text-sm text-gray-500 dark:text-dark-text-muted text-center">
              No options available
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;

