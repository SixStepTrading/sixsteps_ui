import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface ModernDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps?: string[];
  activeStep?: number;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

const ModernDialog: React.FC<ModernDialogProps> = ({
  open,
  onClose,
  title,
  steps,
  activeStep = 0,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
          minHeight: '60vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{ 
            color: 'primary.contrastText',
            position: 'absolute',
            right: 16,
            top: 16,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      {/* Stepper */}
      {steps && steps.length > 0 && (
        <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}
      
      <DialogContent dividers sx={{ p: 0, bgcolor: 'background.paper' }}>
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </DialogContent>
      
      {actions && (
        <DialogActions sx={{ 
          p: 2, 
          bgcolor: 'grey.50', 
          borderTop: '1px solid',
          borderColor: 'divider',
          gap: 2
        }}>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ModernDialog;
