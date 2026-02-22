import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1F7A4C', // PRD Primary Green
      light: '#2E8B57',
      dark: '#14532D',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#2E8B57', // PRD Secondary Green
      light: '#4ADE80',
      dark: '#166534',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F5FAF7', // PRD Background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
    warning: {
      main: '#F4A300', // PRD Accent
    }
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "system-ui", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: '#0F172A',
      letterSpacing: '-1px',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 800,
      color: '#0F172A',
      letterSpacing: '-0.5px',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      color: '#0F172A',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: '#0F172A',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#0F172A',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      color: '#0F172A',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: '"Outfit", sans-serif',
          boxShadow: '0 4px 0 rgba(31, 122, 76, 0.2)', // Subtle 3D shadow with Green
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 0 rgba(31, 122, 76, 0.15)',
          },
          '&:active': {
            transform: 'translateY(1px)',
            boxShadow: '0 1px 0 rgba(31, 122, 76, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 10,
        }
      }
    }
  },
});

export default theme; 