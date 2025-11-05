import React, { useState, useRef } from 'react';
import { exportSelectedProducts, ExportConfig, DEFAULT_EXPORT_CONFIG, ExportProgressCallback } from '../../../utils/exportUtils';
import { Tooltip } from '../../Dashboard/ProductTable';
import ExportConfigModal from './ExportConfigModal';
import { LinearProgress, Box, Typography } from '@mui/material';

interface ExportButtonProps {
  selectedProducts: Array<{
    id: string;
    ean: string;
    minsan: string;
    name: string;
    manufacturer: string;
    publicPrice: number;
    bestPrices: Array<{ price: number; stock: number; supplier?: string }>;
    vat: number;
    quantity?: number;
    targetPrice?: number | null;
  }>;
  isVisible: boolean;
  userRole?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ selectedProducts, isVisible, userRole = 'Buyer' }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ percent: 0, message: '' });
  const hasSelectedProducts = selectedProducts.length > 0;

  const handleOpenConfig = () => {
    if (hasSelectedProducts) {
      setIsConfigModalOpen(true);
    }
  };

  const handleExport = async (config: ExportConfig) => {
    setIsConfigModalOpen(false);
    setIsExporting(true);
    setExportProgress({ percent: 0, message: 'Starting export...' });

    const progressCallback: ExportProgressCallback = (percent, message) => {
      setExportProgress({ percent, message });
    };

    try {
      await exportSelectedProducts(selectedProducts, config, userRole, progressCallback);
      
      // Wait a bit to show 100% before closing
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress({ percent: 0, message: '' });
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      setExportProgress({ percent: 0, message: 'Export failed!' });
      setTimeout(() => {
        setIsExporting(false);
      }, 2000);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="relative">
        <Tooltip text="Configure and export selected products to CSV or Excel" position="top">
          <button
            className={`flex items-center gap-1 text-sm py-1.5 px-3 rounded transition-colors ${
              hasSelectedProducts 
              ? 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800' 
              : 'bg-gray-300 dark:bg-dark-bg-hover text-gray-500 dark:text-dark-text-disabled cursor-not-allowed'
            }`}
            onClick={handleOpenConfig}
            disabled={!hasSelectedProducts || isExporting}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isExporting ? 'Exporting...' : `Export (${selectedProducts.length})`}
          </button>
        </Tooltip>
      </div>

      {/* Export Configuration Modal */}
      <ExportConfigModal
        open={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={handleExport}
        productCount={selectedProducts.length}
        userRole={userRole}
        defaultConfig={{
          ...DEFAULT_EXPORT_CONFIG,
          includeSupplierNames: userRole === 'Admin',
        }}
      />

      {/* Export Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-dark-bg-card rounded-lg p-6 min-w-[400px] shadow-2xl">
            <Box>
              <Typography variant="h6" className="dark:text-dark-text-primary mb-2">
                Exporting {selectedProducts.length} products...
              </Typography>
              <Typography variant="body2" className="dark:text-dark-text-secondary mb-4">
                {exportProgress.message}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={exportProgress.percent} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                  }
                }}
              />
              <Typography variant="caption" className="dark:text-dark-text-muted mt-2 block text-right">
                {exportProgress.percent}% complete
              </Typography>
            </Box>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportButton;
