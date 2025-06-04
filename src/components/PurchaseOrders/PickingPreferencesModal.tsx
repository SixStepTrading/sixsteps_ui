import React, { useState } from 'react';
import { BuyerPickingPreferences, updateBuyerPreferences } from '../../data/mockOrders';
import { useToast } from '../../contexts/ToastContext';

interface PickingPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  currentPreferences: BuyerPickingPreferences;
  buyerId: string;
  onPreferencesUpdated: (preferences: BuyerPickingPreferences) => void;
}

const PickingPreferencesModal: React.FC<PickingPreferencesModalProps> = ({
  open,
  onClose,
  currentPreferences,
  buyerId,
  onPreferencesUpdated
}) => {
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<BuyerPickingPreferences>(currentPreferences);

  const handleSave = () => {
    const success = updateBuyerPreferences(buyerId, preferences);
    if (success) {
      onPreferencesUpdated(preferences);
      showToast('Picking preferences updated successfully', 'success');
      onClose();
    } else {
      showToast('Failed to update preferences', 'error');
    }
  };

  const handleReset = () => {
    setPreferences(currentPreferences);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Picking Preferences</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Auto Accept Partial Delivery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Auto-accept partial deliveries</h3>
                <p className="text-sm text-gray-500">
                  Automatically approve orders when requested quantities are partially available
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoAcceptPartialDelivery}
                  onChange={(e) => setPreferences({ ...preferences, autoAcceptPartialDelivery: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.autoAcceptPartialDelivery && (
              <div className="ml-4 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum acceptable reduction (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={preferences.maxAcceptableReduction}
                    onChange={(e) => setPreferences({ ...preferences, maxAcceptableReduction: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-medium text-blue-600 min-w-[3rem]">
                    {preferences.maxAcceptableReduction}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-accept if reduction is within this limit
                </p>
              </div>
            )}
          </div>

          {/* Alternative Products */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Require confirmation for alternatives</h3>
                <p className="text-sm text-gray-500">
                  Request manual approval when alternative products are suggested
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.requireConfirmationForAlternatives}
                  onChange={(e) => setPreferences({ ...preferences, requireConfirmationForAlternatives: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Notification preferences</h3>
            <p className="text-sm text-gray-500">Choose how you want to be notified about picking changes</p>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.notificationPreferences.email}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notificationPreferences: {
                      ...preferences.notificationPreferences,
                      email: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Email notifications</span>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.notificationPreferences.inApp}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notificationPreferences: {
                      ...preferences.notificationPreferences,
                      inApp: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 2v18l4-4h6a2 2 0 002-2V4a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">In-app notifications</span>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.notificationPreferences.sms}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notificationPreferences: {
                      ...preferences.notificationPreferences,
                      sms: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">SMS notifications</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset to Default
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PickingPreferencesModal; 