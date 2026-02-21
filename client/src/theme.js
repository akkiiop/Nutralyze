import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#84CC16', // Lime Green
      light: '#A3E635',
      dark: '#4D7C0F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F97316', // Orange
      light: '#FB923C',
      dark: '#C2410C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FEFCE8', // Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#365314', // Forest Green
      secondary: '#65A30D', // Lighter Green for secondary text
    },
    warning: {
      main: '#EAB308', // Yellow Accent
    }
  },
  typography: {
    fontFamily: '"Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#365314',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      color: '#365314',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#365314',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#365314',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#365314',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#365314',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"Outfit", sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(132, 204, 22, 0.1)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        }
      }
    }
  },
});

export default theme; 