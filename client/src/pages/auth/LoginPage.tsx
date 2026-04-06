import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Restaurant } from '@mui/icons-material';
import { useAuth } from '../../auth/AuthProvider';
import { LoginData } from '../../api/authApi';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate(`/${formData.role}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al iniciar sesión. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8f9fa',
        p: 2,
      }}
    >
      {/* Card container — estilo Google accounts */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, sm: '48px 40px 36px' },
          width: '100%',
          maxWidth: 448,
          borderRadius: 3,
          border: '1px solid #dadce0',
          bgcolor: '#ffffff',
        }}
      >
        {/* Logo + Título */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #ea4335 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Restaurant sx={{ color: 'white', fontSize: 26 }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 400,
              color: '#202124',
              letterSpacing: 0,
              mb: 0.5,
            }}
          >
            Iniciar sesión
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: '#5f6368', fontSize: '1rem', fontWeight: 400 }}
          >
            para continuar en{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ color: '#202124', fontWeight: 500, fontSize: '1rem' }}
            >
              SmartComedor
            </Typography>
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2.5,
              borderRadius: 2,
              '& .MuiAlert-message': { fontSize: '0.875rem' },
            }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            autoFocus
            size="medium"
            sx={{ mb: 2 }}
            InputProps={{ sx: { borderRadius: '4px', fontSize: '1rem' } }}
          />

          <TextField
            label="Contraseña"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            size="medium"
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: '4px', fontSize: '1rem' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    sx={{ color: '#5f6368' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <FormControl fullWidth size="medium" sx={{ mb: 3 }}>
            <InputLabel sx={{ fontSize: '1rem' }}>Tipo de cuenta</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Tipo de cuenta"
              onChange={handleChange}
              sx={{ borderRadius: '4px', fontSize: '1rem' }}
            >
              <MenuItem value="student">Estudiante</MenuItem>
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>

          {/* Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="text"
              size="small"
              sx={{
                fontSize: '0.875rem',
                color: '#1a73e8',
                fontWeight: 500,
                p: '6px 8px',
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(26,115,232,0.04)' },
              }}
            >
              ¿Olvidaste tu contraseña?
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#1a73e8',
                color: 'white',
                fontWeight: 500,
                fontSize: '0.875rem',
                px: 3,
                py: 1,
                borderRadius: 1,
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#1765cc',
                  boxShadow: '0 1px 3px rgba(60,64,67,.3)',
                },
                '&:disabled': {
                  bgcolor: '#c2d7f8',
                  color: 'white',
                },
              }}
            >
              {loading ? 'Iniciando...' : 'Siguiente'}
            </Button>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Button
              component={RouterLink}
              to="/register"
              variant="outlined"
              fullWidth
              sx={{
                borderColor: '#dadce0',
                color: '#1a73e8',
                fontWeight: 500,
                fontSize: '0.875rem',
                py: 1,
                borderRadius: 1,
                '&:hover': {
                  borderColor: '#1a73e8',
                  bgcolor: 'rgba(26,115,232,0.04)',
                },
              }}
            >
              Crear cuenta
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Footer */}
      <Box
        sx={{
          mt: 3,
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {['Ayuda', 'Privacidad', 'Condiciones'].map((label) => (
          <Typography
            key={label}
            variant="caption"
            sx={{
              color: '#5f6368',
              fontSize: '0.75rem',
              cursor: 'pointer',
              '&:hover': { color: '#1a73e8', textDecoration: 'underline' },
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
