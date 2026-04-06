import { createTheme, alpha } from '@mui/material/styles';

// Google color palette
const googleBlue = '#1a73e8';
const googleRed = '#ea4335';
const googleGreen = '#34a853';
const googleYellow = '#f9ab00';
const googleDarkText = '#202124';
const googleSecondaryText = '#5f6368';
const googleBorder = '#dadce0';
const googleSurface = '#f8f9fa';
const googleActiveBg = '#e8f0fe';

const theme = createTheme({
  palette: {
    primary: {
      main: googleBlue,
      light: '#4791db',
      dark: '#1557b0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: googleGreen,
      light: '#66bb6a',
      dark: '#1e7e34',
      contrastText: '#ffffff',
    },
    success: {
      main: googleGreen,
      light: '#81c784',
      dark: '#256029',
    },
    warning: {
      main: googleYellow,
      light: '#ffca28',
      dark: '#c77700',
    },
    error: {
      main: googleRed,
      light: '#ef5350',
      dark: '#b71c1c',
    },
    text: {
      primary: googleDarkText,
      secondary: googleSecondaryText,
    },
    divider: googleBorder,
    background: {
      default: googleSurface,
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.25rem',
      fontWeight: 400,
      letterSpacing: '-0.5px',
      color: googleDarkText,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 400,
      letterSpacing: '-0.25px',
      color: googleDarkText,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 400,
      color: googleDarkText,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 400,
      color: googleDarkText,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      color: googleDarkText,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: googleDarkText,
    },
    subtitle1: {
      fontWeight: 500,
      letterSpacing: '0.0094em',
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.0071em',
    },
    body1: {
      fontSize: '0.875rem',
      letterSpacing: '0.0179em',
    },
    body2: {
      fontSize: '0.8125rem',
      letterSpacing: '0.0107em',
      color: googleSecondaryText,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.0178em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.0333em',
      color: googleSecondaryText,
    },
  },
  shape: {
    borderRadius: 4,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
    '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)',
    '0 2px 6px 2px rgba(60,64,67,.15)',
    '0 2px 8px 3px rgba(60,64,67,.15)',
    '0 3px 10px 3px rgba(60,64,67,.15)',
    '0 4px 12px 3px rgba(60,64,67,.15)',
    '0 4px 14px 3px rgba(60,64,67,.15)',
    '0 4px 16px 3px rgba(60,64,67,.15)',
    '0 6px 18px 3px rgba(60,64,67,.15)',
    '0 6px 20px 3px rgba(60,64,67,.15)',
    '0 6px 22px 3px rgba(60,64,67,.15)',
    '0 8px 24px 3px rgba(60,64,67,.15)',
    '0 8px 26px 3px rgba(60,64,67,.15)',
    '0 8px 28px 3px rgba(60,64,67,.15)',
    '0 8px 30px 3px rgba(60,64,67,.15)',
    '0 10px 32px 3px rgba(60,64,67,.15)',
    '0 10px 34px 3px rgba(60,64,67,.15)',
    '0 10px 36px 3px rgba(60,64,67,.15)',
    '0 12px 38px 3px rgba(60,64,67,.15)',
    '0 12px 40px 3px rgba(60,64,67,.15)',
    '0 12px 42px 3px rgba(60,64,67,.15)',
    '0 14px 44px 3px rgba(60,64,67,.15)',
    '0 14px 46px 3px rgba(60,64,67,.15)',
    '0 14px 48px 3px rgba(60,64,67,.15)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: googleSurface,
          color: googleDarkText,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#bdc1c6',
          borderRadius: '8px',
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#9aa0a6',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'inherit',
      },
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: googleDarkText,
          borderBottom: `1px solid ${googleBorder}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${googleBorder}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 4,
          padding: '8px 24px',
          fontSize: '0.875rem',
          letterSpacing: '0.0178em',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px rgba(60,64,67,.3)',
          },
          '&:active': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: googleBorder,
          color: googleBlue,
          '&:hover': {
            backgroundColor: alpha(googleBlue, 0.04),
            borderColor: googleBlue,
          },
        },
        text: {
          color: googleBlue,
          '&:hover': {
            backgroundColor: alpha(googleBlue, 0.04),
          },
        },
        sizeLarge: {
          padding: '10px 24px',
          fontSize: '0.9375rem',
        },
        sizeSmall: {
          padding: '5px 12px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontSize: '1rem',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#c4c7c5',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#202124',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: googleBlue,
            borderWidth: 2,
          },
        },
        input: {
          padding: '13.5px 14px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          color: '#444746',
          '&.Mui-focused': {
            color: googleBlue,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)',
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: `1px solid ${googleBorder}`,
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)',
          },
          transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          padding: '10px 16px',
          '&.Mui-selected': {
            backgroundColor: googleActiveBg,
            color: googleBlue,
            '& .MuiListItemIcon-root': {
              color: googleBlue,
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: alpha(googleActiveBg, 0.9),
            },
          },
          '&:hover': {
            backgroundColor: alpha(googleDarkText, 0.06),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: googleSecondaryText,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: googleDarkText,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontSize: '0.875rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: googleBorder,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 500,
          color: googleSecondaryText,
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          backgroundColor: googleSurface,
          borderBottom: `2px solid ${googleBorder}`,
        },
        body: {
          fontSize: '0.875rem',
          color: googleDarkText,
          borderBottom: `1px solid ${googleBorder}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(googleDarkText, 0.04),
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: googleBlue,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          boxShadow: '0 8px 30px rgba(60,64,67,.4)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#202124',
          fontSize: '0.75rem',
          borderRadius: 4,
          padding: '4px 10px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 4,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minWidth: 'unset',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: '1rem',
        },
      },
    },
  },
});

export { googleBlue, googleRed, googleGreen, googleYellow, googleDarkText, googleSecondaryText, googleBorder, googleSurface, googleActiveBg };
export default theme;
