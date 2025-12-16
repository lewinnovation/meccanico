import { createTheme, alpha } from '@mui/material/styles';

// Entity colors
export const entityColors = {
  inventory: {
    bg: '#E3F2FD',
    text: '#1976D2',
  },
  labour: {
    bg: '#FFF3E0',
    text: '#F57C00',
  },
  service: {
    bg: '#E8F5E9',
    text: '#388E3C',
  },
  template: {
    bg: '#F3E5F5',
    text: '#7B1FA2',
  },
  job: {
    bg: '#FFFDE7',
    text: '#FBC02D',
  },
  customer: {
    bg: '#FCE4EC',
    text: '#C2185B',
  },
  vehicle: {
    bg: '#E0F2F1',
    text: '#00796B',
  },
  text: {
    bg: '#FAFAFA',
    text: '#424242',
  },
};

// Status colors
export const statusColors = {
  ESTIMATE: '#FFC107',
  APPROVED: '#2196F3',
  IN_PROGRESS: '#FF9800',
  ON_HOLD: '#9E9E9E',
  INVOICED: '#9C27B0',
  PAID: '#4CAF50',
  CANCELLED: '#F44336',
  DECLINED: '#795548',
  DISPUTED: '#E91E63',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#399DEB',
      light: '#75BCF2',
      dark: '#2C7DC2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#424242',
      light: '#6D6D6D',
      dark: '#1B1B1B',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    divider: alpha('#000000', 0.08),
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.35,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
        },
        sizeSmall: {
          padding: '4px 12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
        sizeSmall: {
          height: 24,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#FAFAFA',
        },
      },
    },
  },
});

