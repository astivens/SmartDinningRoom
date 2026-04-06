import React, { ReactNode } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PaymentIcon from '@mui/icons-material/Payment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import CampaignIcon from '@mui/icons-material/Campaign';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const drawerWidth = 256;

interface LayoutProps {
  children: ReactNode;
}

const menuItems = {
  admin: [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Gestión de Estudiantes', icon: <PeopleIcon />, path: '/admin/students' },
    { text: 'Gestión de Supervisores', icon: <PersonAddIcon />, path: '/admin/supervisors' },
    { text: 'Cargar Excel', icon: <AssessmentIcon />, path: '/admin/import' },
    { text: 'Pagos', icon: <PaymentIcon />, path: '/admin/payments' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/admin/reports' },
    { text: 'Quejas y Sugerencias', icon: <RateReviewIcon />, path: '/admin/complaints' },
    { text: 'Noticias', icon: <CampaignIcon />, path: '/admin/news' },
  ],
  supervisor: [
    { text: 'Registrar Almuerzo', icon: <RestaurantIcon />, path: '/supervisor' },
    { text: 'Historial', icon: <AssessmentIcon />, path: '/supervisor/history' },
  ],
  student: [
    { text: 'Mi Perfil', icon: <PersonIcon />, path: '/student' },
    { text: 'Subir Comprobante', icon: <PaymentIcon />, path: '/student/payment' },
    { text: 'Calificar Servicio', icon: <StarIcon />, path: '/student/rate' },
    { text: 'Noticias', icon: <CampaignIcon />, path: '/student/news' },
    { text: 'Quejas y Sugerencias', icon: <RateReviewIcon />, path: '/student/complaint' },
  ],
};

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = user ? menuItems[user.role] ?? [] : [];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* App brand */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          height: 64,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #ea4335 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <RestaurantIcon sx={{ color: 'white', fontSize: 18 }} />
        </Box>
        <Typography
          variant="h6"
          noWrap
          sx={{
            fontWeight: 400,
            fontSize: '1.1rem',
            color: '#202124',
            letterSpacing: 0,
          }}
        >
          SmartComedor
        </Typography>
      </Box>

      <Divider />

      {/* Nav items */}
      <List sx={{ py: 1, flexGrow: 1 }}>
        {items.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', gap: 1 }}>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { sm: 'none' }, color: '#5f6368', mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Search icon (decorativo, Google siempre lo tiene) */}
          <IconButton sx={{ color: '#5f6368' }}>
            <SearchIcon />
          </IconButton>

          {/* User avatar */}
          <IconButton onClick={handleMenu} sx={{ p: 0.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.875rem',
                fontWeight: 500,
                bgcolor: 'primary.main',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 2,
              sx: {
                minWidth: 280,
                borderRadius: 3,
                mt: 0.5,
                border: '1px solid #dadce0',
              },
            }}
          >
            {/* User info header */}
            <Box sx={{ px: 3, py: 2, textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  mx: 'auto',
                  mb: 1,
                  fontSize: '1.5rem',
                  bgcolor: 'primary.main',
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#202124', lineHeight: 1.3 }}>
                {user?.name} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#5f6368' }}>
                {user?.email}
              </Typography>
            </Box>

            <Divider />

            <MenuItem
              onClick={handleClose}
              sx={{ gap: 1.5, py: 1.5, px: 2.5 }}
            >
              <AccountCircleIcon sx={{ color: '#5f6368', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#202124' }}>
                Gestionar cuenta
              </Typography>
            </MenuItem>

            <MenuItem
              onClick={handleLogout}
              sx={{ gap: 1.5, py: 1.5, px: 2.5 }}
            >
              <LogoutIcon sx={{ color: '#5f6368', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#202124' }}>
                Cerrar sesión
              </Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          bgcolor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
