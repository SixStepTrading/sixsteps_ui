import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { deleteEntity, Entity } from '../../utils/api';

interface DeleteEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity | null;
  onEntityDeleted: () => void;
}

const DeleteEntityModal: React.FC<DeleteEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
  onEntityDeleted
}) => {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const expectedConfirmationText = 'DELETE';

  const handleDelete = async () => {
    if (!entity) return;
    
    if (!confirmationChecked) {
      showToast('Please check the confirmation checkbox', 'warning');
      return;
    }

    if (confirmationText.trim() !== expectedConfirmationText) {
      showToast(`Please type "${expectedConfirmationText}" to confirm`, 'warning');
      return;
    }

    try {
      setDeleting(true);
      
      await deleteEntity(entity.id);
      showToast(`Entity ${entity.entityName} deleted successfully!`, 'success');
      onEntityDeleted();
      handleClose();
    } catch (error: any) {
      console.error('Error deleting entity:', error);
      showToast(error.message || 'Failed to delete entity', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationChecked(false);
    setConfirmationText('');
    onClose();
  };

  const canDelete = confirmationChecked && confirmationText.trim() === expectedConfirmationText;

  if (!isOpen || !entity) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Delete Entity
              </h3>
            </div>
            <button
              onClick={handleClose}
              disabled={deleting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {/* Warning Message */}
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    This action cannot be undone
                  </h4>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    You are about to permanently delete the entity <strong>{entity.entityName}</strong>. 
                    This will remove all associated data and cannot be reversed.
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Information */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Entity Details:</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Name:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{entity.entityName}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{entity.entityType}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Country:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{entity.country || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                  <p className="font-medium text-gray-900 dark:text-white">{entity.status || 'ACTIVE'}</p>
                </div>
              </div>
            </div>

            {/* Confirmation Steps */}
            <div className="space-y-4">
              {/* Confirmation Checkbox */}
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                  disabled={deleting}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 dark:border-gray-600 rounded mt-1"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    I understand this action is permanent and cannot be undone
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    This entity will be completely removed from the system
                  </p>
                </div>
              </label>

              {/* Confirmation Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-red-600 dark:text-red-400 font-mono text-xs">{expectedConfirmationText}</code> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  disabled={deleting}
                  placeholder={`Type ${expectedConfirmationText} here...`}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                    confirmationText === expectedConfirmationText
                      ? 'border-green-300 dark:border-green-600'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {confirmationText && confirmationText !== expectedConfirmationText && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Please type exactly "{expectedConfirmationText}"
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting Entity...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Entity
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteEntityModal;
