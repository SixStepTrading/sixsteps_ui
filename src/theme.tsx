import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#757575',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 500,
      fontSize: '1.8rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.6rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.4rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.2rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '0.9rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: '0.85rem',
        },
        contained: {
          boxShadow: 'none',
        },
        sizeSmall: {
          padding: '4px 8px',
          fontSize: '0.8rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '8px 10px',
          fontSize: '0.85rem',
        },
        head: {
          fontWeight: 'bold',
          fontSize: '0.85rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          height: 42,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '48px !important',
          '@media (min-width: 600px)': {
            minHeight: '48px !important',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        title: {
          fontSize: '1rem',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
          '&:last-child': {
            paddingBottom: '12px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: '0.85rem',
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.85rem',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          minHeight: '48px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
        },
      },
    },
  },
});

export default theme; 