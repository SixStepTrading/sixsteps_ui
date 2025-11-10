import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useToast } from '../../contexts/ToastContext';
// Using inline SVG icons like other components in the project

const Login: React.FC = () => {
  const { login, isAuth, isLoading } = useUser();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Redirect if already authenticated
  if (isAuth) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login({
        email: formData.email.trim(),
        password: formData.password
      });
      
      showToast('Login successful! Welcome back.', 'success');
    } catch (error: any) {
      showToast(
        error.message || 'Login failed. Please check your credentials.',
        'error'
      );
      setErrors({ general: error.message || 'Login failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <img 
            src="/sixsteps_logo.png" 
            alt="Six Steps - FarmaAggregator" 
            className="block mx-auto h-36 w-72 object-contain"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="hidden block mx-auto h-16 w-16 text-blue-600 dark:text-blue-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 9a3 3 0 110-6 3 3 0 010 6z" />
          </svg>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome to SixSteps - FarmaAggregator. <br /> Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg px-8 py-10 space-y-6">
            
            {/* General Error */}
            {errors.general && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                <div className="text-sm text-red-700 dark:text-red-300">
                  {errors.general}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`
                    appearance-none relative block w-full pl-10 pr-3 py-3 
                    border rounded-lg placeholder-gray-500 
                    text-gray-900 dark:text-white
                    bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${errors.email 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM12 9a3 3 0 110-6 3 3 0 010 6z" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`
                    appearance-none relative block w-full pl-10 pr-12 py-3 
                    border rounded-lg placeholder-gray-500 
                    text-gray-900 dark:text-white
                    bg-white dark:bg-gray-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${errors.password 
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                  `}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656L15.536 15.536m-1.414-1.414L15.536 15.536m-1.414-1.414l2.828 2.828M2.343 2.343l18.364 18.364" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement forgot password functionality
                    alert('Forgot password functionality coming soon!');
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer bg-transparent border-none p-0"
                >
                  Forgot your password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                group relative w-full flex justify-center py-3 px-4 
                border border-transparent text-sm font-medium rounded-lg text-white 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                transition-all duration-200 transform
                ${isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                }
                dark:focus:ring-offset-gray-800
              `}
            >
              {isSubmitting && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
              <span className={isSubmitting ? 'ml-6' : ''}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Protected by Six Steps Security. By signing in, you agree to our{' '}
            <button 
              type="button"
              onClick={() => {
                alert('Terms of Service coming soon!');
              }}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer bg-transparent border-none p-0 hover:underline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button 
              type="button"
              onClick={() => {
                alert('Privacy Policy coming soon!');
              }}
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 cursor-pointer bg-transparent border-none p-0 hover:underline"
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 