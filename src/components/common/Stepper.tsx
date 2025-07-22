import React from 'react';

interface Step {
  id: string;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: string;
  onStepClick?: (stepId: string) => void;
  completedSteps?: string[];
}

const Stepper: React.FC<StepperProps> = ({ 
  steps, 
  currentStep, 
  onStepClick, 
  completedSteps = [] 
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="w-full py-6">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isClickable = onStepClick && (isCompleted || index <= currentIndex + 1);

            return (
              <li 
                key={step.id} 
                className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} flex items-center`}
              >
                {/* Connector Line */}
                {index !== steps.length - 1 && (
                  <div 
                    className="absolute top-4 left-4 -ml-px h-0.5 w-full bg-gray-200 dark:bg-gray-700" 
                    aria-hidden="true"
                  >
                    <div 
                      className={`h-0.5 transition-all duration-500 ${
                        isCompleted || (currentIndex > index) 
                          ? 'bg-blue-600 dark:bg-blue-400 w-full' 
                          : 'bg-gray-200 dark:bg-gray-700 w-0'
                      }`}
                    />
                  </div>
                )}

                <div 
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
                    isClickable ? 'cursor-pointer' : ''
                  } ${
                    isCompleted
                      ? 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700'
                      : isCurrent
                      ? 'border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400'
                      : 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                  onClick={isClickable ? () => onStepClick!(step.id) : undefined}
                >
                  {isCompleted ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                <div className="ml-4">
                  <div 
                    className={`text-sm font-medium transition-colors duration-300 ${
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {step.description}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Stepper; 