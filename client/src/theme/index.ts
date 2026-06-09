import { alpha, createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    m3: {
      surface: string;
      surfaceContainer: string;
      surfaceContainerHigh: string;
      surfaceVariant: string;
      onSurface: string;
      onSurfaceVariant: string;
      outline: string;
      outlineVariant: string;
      primaryContainer: string;
      onPrimaryContainer: string;
    };
  }

  interface PaletteOptions {
    m3?: {
      surface?: string;
      surfaceContainer?: string;
      surfaceContainerHigh?: string;
      surfaceVariant?: string;
      onSurface?: string;
      onSurfaceVariant?: string;
      outline?: string;
      outlineVariant?: string;
      primaryContainer?: string;
      onPrimaryContainer?: string;
    };
  }
}

const m3Primary = '#2f6f43';
const m3PrimaryDark = '#1f5a33';
const m3PrimaryLight = '#4f8c63';
const m3Secondary = '#5f6f5f';
const m3Error = '#b3261e';
const m3Warning = '#9a6700';
const m3OnSurface = '#1a1c19';
const m3OnSurfaceVariant = '#444b43';
const m3Surface = '#f7faf4';
const m3SurfaceContainer = '#edf2ea';
const m3SurfaceContainerHigh = '#e4e9e0';
const m3SurfaceVariant = '#dde5d9';
const m3Outline = '#748077';
const m3OutlineVariant = '#c1c9be';
const m3PrimaryContainer = '#b2f1be';
const m3OnPrimaryContainer = '#00210f';

const theme = createTheme({
  palette: {
    primary: {
      main: m3Primary,
      light: m3PrimaryLight,
      dark: m3PrimaryDark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: m3Secondary,
      light: '#788a78',
      dark: '#4a584a',
      contrastText: '#ffffff',
    },
    success: {
      main: '#3d8b51',
      light: '#63a96d',
      dark: '#2b6b3b',
    },
    warning: {
      main: m3Warning,
      light: '#b6801b',
      dark: '#7f5500',
    },
    error: {
      main: m3Error,
      light: '#de5a52',
      dark: '#8c1d18',
    },
    text: {
      primary: m3OnSurface,
      secondary: m3OnSurfaceVariant,
    },
    divider: m3OutlineVariant,
    background: {
      default: m3Surface,
      paper: '#ffffff',
    },
    m3: {
      surface: m3Surface,
      surfaceContainer: m3SurfaceContainer,
      surfaceContainerHigh: m3SurfaceContainerHigh,
      surfaceVariant: m3SurfaceVariant,
      onSurface: m3OnSurface,
      onSurfaceVariant: m3OnSurfaceVariant,
      outline: m3Outline,
      outlineVariant: m3OutlineVariant,
      primaryContainer: m3PrimaryContainer,
      onPrimaryContainer: m3OnPrimaryContainer,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.25rem',
      fontWeight: 400,
      letterSpacing: '-0.02em',
      lineHeight: 1.14,
    },
    h2: {
      fontSize: '2.25rem',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 500,
      lineHeight: 1.25,
    },
    h4: {
      fontSize: '1.75rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.35,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.01em',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.45,
      letterSpacing: '0.01em',
    },
    button: {
      fontSize: '0.9rem',
      fontWeight: 600,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.02em',
      lineHeight: 1.35,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(16, 24, 40, 0.08), 0px 1px 3px rgba(16, 24, 40, 0.1)',
    '0px 2px 4px rgba(16, 24, 40, 0.08), 0px 1px 2px rgba(16, 24, 40, 0.12)',
    '0px 3px 8px rgba(16, 24, 40, 0.1), 0px 2px 4px rgba(16, 24, 40, 0.12)',
    '0px 4px 10px rgba(16, 24, 40, 0.12), 0px 2px 5px rgba(16, 24, 40, 0.14)',
    '0px 6px 12px rgba(16, 24, 40, 0.12), 0px 3px 6px rgba(16, 24, 40, 0.14)',
    '0px 8px 16px rgba(16, 24, 40, 0.14), 0px 4px 8px rgba(16, 24, 40, 0.16)',
    '0px 10px 18px rgba(16, 24, 40, 0.16), 0px 4px 8px rgba(16, 24, 40, 0.18)',
    '0px 12px 20px rgba(16, 24, 40, 0.16), 0px 6px 10px rgba(16, 24, 40, 0.18)',
    '0px 12px 24px rgba(16, 24, 40, 0.18), 0px 8px 12px rgba(16, 24, 40, 0.2)',
    '0px 14px 28px rgba(16, 24, 40, 0.2), 0px 8px 12px rgba(16, 24, 40, 0.2)',
    '0px 16px 32px rgba(16, 24, 40, 0.22), 0px 8px 14px rgba(16, 24, 40, 0.22)',
    '0px 18px 36px rgba(16, 24, 40, 0.22), 0px 10px 16px rgba(16, 24, 40, 0.24)',
    '0px 20px 40px rgba(16, 24, 40, 0.24), 0px 10px 18px rgba(16, 24, 40, 0.24)',
    '0px 22px 42px rgba(16, 24, 40, 0.25), 0px 12px 20px rgba(16, 24, 40, 0.25)',
    '0px 24px 44px rgba(16, 24, 40, 0.26), 0px 12px 20px rgba(16, 24, 40, 0.26)',
    '0px 26px 46px rgba(16, 24, 40, 0.26), 0px 14px 22px rgba(16, 24, 40, 0.26)',
    '0px 28px 48px rgba(16, 24, 40, 0.27), 0px 14px 24px rgba(16, 24, 40, 0.27)',
    '0px 30px 52px rgba(16, 24, 40, 0.28), 0px 16px 24px rgba(16, 24, 40, 0.28)',
    '0px 32px 56px rgba(16, 24, 40, 0.28), 0px 16px 26px rgba(16, 24, 40, 0.28)',
    '0px 34px 60px rgba(16, 24, 40, 0.3), 0px 18px 28px rgba(16, 24, 40, 0.3)',
    '0px 36px 64px rgba(16, 24, 40, 0.3), 0px 18px 30px rgba(16, 24, 40, 0.3)',
    '0px 38px 68px rgba(16, 24, 40, 0.32), 0px 20px 32px rgba(16, 24, 40, 0.32)',
    '0px 40px 70px rgba(16, 24, 40, 0.32), 0px 20px 34px rgba(16, 24, 40, 0.32)',
    '0px 42px 72px rgba(16, 24, 40, 0.32), 0px 22px 36px rgba(16, 24, 40, 0.32)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: 'light',
        },
        body: {
          backgroundColor: m3Surface,
          color: m3OnSurface,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
        '#root': {
          minHeight: '100vh',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
        '*:focus-visible': {
          outline: `3px solid ${alpha(m3Primary, 0.35)}`,
          outlineOffset: '2px',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(m3OnSurfaceVariant, 0.45),
          borderRadius: '8px',
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          backgroundColor: alpha(m3OnSurfaceVariant, 0.65),
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
          backgroundColor: alpha(m3SurfaceContainer, 0.9),
          color: m3OnSurface,
          borderBottom: `1px solid ${m3OutlineVariant}`,
          backdropFilter: 'blur(8px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: alpha(m3SurfaceContainer, 0.96),
          borderRight: `1px solid ${m3OutlineVariant}`,
          boxShadow: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 999,
          padding: '10px 20px',
          fontSize: '0.9rem',
          letterSpacing: '0.01em',
          transition: 'background-color 150ms ease, box-shadow 180ms ease, transform 140ms ease',
        },
        contained: {
          boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.08), 0px 1px 3px rgba(16, 24, 40, 0.1)',
          '&:hover': {
            boxShadow: '0px 3px 8px rgba(16, 24, 40, 0.1), 0px 2px 4px rgba(16, 24, 40, 0.12)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.08), 0px 1px 3px rgba(16, 24, 40, 0.1)',
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderColor: m3Outline,
          color: m3Primary,
          '&:hover': {
            backgroundColor: alpha(m3Primary, 0.08),
            borderColor: m3Primary,
          },
        },
        text: {
          color: m3Primary,
          '&:hover': {
            backgroundColor: alpha(m3Primary, 0.08),
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
          borderRadius: 14,
          fontSize: '1rem',
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: m3OutlineVariant,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: m3Outline,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: m3Primary,
            borderWidth: 2,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: m3Error,
          },
        },
        input: {
          padding: '14px 14px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          color: m3OnSurfaceVariant,
          '&.Mui-focused': {
            color: m3Primary,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
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
          border: `1px solid ${alpha(m3OutlineVariant, 0.8)}`,
          borderRadius: 20,
          boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.08), 0px 1px 3px rgba(16, 24, 40, 0.1)',
          backgroundColor: alpha('#ffffff', 0.92),
          '&:hover': {
            boxShadow: '0px 3px 8px rgba(16, 24, 40, 0.1), 0px 2px 4px rgba(16, 24, 40, 0.12)',
          },
          transition: 'box-shadow 180ms ease, border-color 160ms ease',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 20px',
          '&:last-child': {
            paddingBottom: '20px',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          margin: '2px 8px',
          width: 'calc(100% - 16px)',
          padding: '10px 16px',
          '&.Mui-selected': {
            backgroundColor: alpha(m3Primary, 0.16),
            color: m3PrimaryDark,
            '& .MuiListItemIcon-root': {
              color: m3PrimaryDark,
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: alpha(m3Primary, 0.2),
            },
          },
          '&:hover': {
            backgroundColor: alpha(m3OnSurface, 0.06),
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 40,
          color: m3OnSurfaceVariant,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: '0.875rem',
          fontWeight: 500,
          color: m3OnSurface,
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
          borderRadius: 14,
          fontSize: '0.875rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: m3OutlineVariant,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 500,
          color: m3OnSurfaceVariant,
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          backgroundColor: m3SurfaceContainer,
          borderBottom: `1px solid ${m3OutlineVariant}`,
        },
        body: {
          fontSize: '0.875rem',
          color: m3OnSurface,
          borderBottom: `1px solid ${alpha(m3OutlineVariant, 0.8)}`,
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(m3Primary, 0.04),
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: m3Primary,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          boxShadow: '0px 12px 20px rgba(16, 24, 40, 0.16), 0px 6px 10px rgba(16, 24, 40, 0.18)',
          border: `1px solid ${m3OutlineVariant}`,
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: m3OnSurface,
          fontSize: '0.75rem',
          borderRadius: 8,
          padding: '4px 10px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 999,
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
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
          padding: '20px 24px 8px',
          color: m3OnSurface,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '8px 24px 16px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px 20px',
          gap: 8,
        },
      },
    },
  },
});
export default theme;
