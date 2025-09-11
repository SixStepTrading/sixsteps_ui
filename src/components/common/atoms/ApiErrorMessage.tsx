import React from 'react';

// Custom SVG icons
const ExclamationIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface ApiErrorMessageProps {
  title: string;
  description: string;
  endpoint?: string;
  className?: string;
}

const ApiErrorMessage: React.FC<ApiErrorMessageProps> = ({ 
  title, 
  description, 
  endpoint,
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 ${className}`}>
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
        <ExclamationIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2 text-center">
        {title}
      </h3>
      
      <p className="text-red-700 dark:text-red-300 text-center mb-4 max-w-md">
        {description}
      </p>
      
      {endpoint && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-4 font-mono bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded">
          Endpoint: {endpoint}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700 max-w-sm">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Contatta l'amministratore della piattaforma:
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <MailIcon className="w-4 h-4 mr-2 text-blue-500" />
            <a 
              href="mailto:admin@sixstep.it" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              admin@sixstep.it
            </a>
          </div>
          
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <PhoneIcon className="w-4 h-4 mr-2 text-green-500" />
            <a 
              href="tel:+393901234567" 
              className="text-green-600 dark:text-green-400 hover:underline"
            >
              +39 390 123 4567
            </a>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Segnala questo problema per una risoluzione rapida
        </div>
      </div>
    </div>
  );
};

export default ApiErrorMessage;
