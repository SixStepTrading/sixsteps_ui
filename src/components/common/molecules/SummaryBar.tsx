import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Slide,
  useTheme,
  useMediaQuery,
  Stack
} from '@mui/material';
import {
  Bookmark as BookmarkIcon,
  Save as SaveIcon,
  ShoppingCart as CartIcon
} from '@mui/icons-material';

interface SummaryBarProps {
  selectedCount: number;
  totalItems: number;
  totalAmount: number;
  onSaveForLater: () => void;
  onSaveAsDraft: () => void;
  onCreateOrder: () => void;
  sidebarWidth: number;
}

const SummaryBar: React.FC<SummaryBarProps> = ({
  selectedCount,
  totalItems,
  totalAmount,
  onSaveForLater,
  onSaveAsDraft,
  onCreateOrder,
  sidebarWidth = 0
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Slide direction="up" in={selectedCount > 0} mountOnEnter unmountOnExit>
      <Paper
        elevation={4}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: { xs: 0, sm: `${sidebarWidth}px` },
          right: 0,
          zIndex: 9999,
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`,
          boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
          transition: theme.transitions.create(['left'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Riepilogo selezione */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: { xs: 1, sm: 0 } 
          }}
        >
          <Box>
            <Typography 
              variant="body2" 
              fontWeight="medium"
              sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              Prodotti selezionati: {selectedCount}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {totalItems} articoli in totale
            </Typography>
          </Box>
        </Box>

        {/* Prezzo totale */}
        <Box 
          sx={{ 
            display: { xs: 'flex', sm: 'block' }, 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 1.5, sm: 0 }
          }}
        >
          <Typography 
            variant="h6" 
            color="primary" 
            sx={{ 
              fontWeight: 'bold', 
              fontSize: { xs: '1rem', sm: '1.1rem' }
            }}
          >
            €{totalAmount.toFixed(2)}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              display: { xs: 'block', sm: 'none' }
            }}
          >
            Totale
          </Typography>
        </Box>

        {/* Divisore in mobile */}
        {isMobile && <Divider sx={{ mb: 1.5 }} />}

        {/* Pulsanti azione */}
        <Stack 
          direction={{ xs: 'row', sm: 'row' }} 
          spacing={{ xs: 1, sm: 1.5 }}
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' }
          }}
        >
          {!isTablet && (
            <Button
              variant="outlined"
              startIcon={<BookmarkIcon />}
              size="small"
              onClick={onSaveForLater}
            >
              Salva per dopo
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            size="small"
            onClick={onSaveAsDraft}
          >
            {isTablet ? 'Salva' : 'Salva bozza'}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<CartIcon />}
            size="small"
            onClick={onCreateOrder}
            sx={{ px: { xs: 2, sm: 3 } }}
          >
            {isTablet ? 'Crea ODA' : 'Crea Ordine'}
          </Button>
        </Stack>
      </Paper>
    </Slide>
  );
};

export default SummaryBar; 