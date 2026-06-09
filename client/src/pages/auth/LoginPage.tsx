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

type LoginRole = LoginData['role'];

interface LoginPageProps {
  fixedRole?: LoginRole;
}

const roleLabels: Record<LoginRole, string> = {
  student: 'Estudiantes',
  supervisor: 'Supervisores',
  admin: 'Administradores',
  external_auditor: 'Auditoría Externa',
};

export default function LoginPage({ fixedRole }: LoginPageProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
    role: fixedRole ?? 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');

  const effectiveRole = fixedRole ?? formData.role;

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({
        ...formData,
        role: effectiveRole,
        twoFactorCode: twoFactorRequired ? twoFactorCode : undefined,
        twoFactorToken: twoFactorRequired ? twoFactorToken : undefined
      });

      if (response.requiresTwoFactor && response.twoFactorToken) {
        setTwoFactorRequired(true);
        setTwoFactorToken(response.twoFactorToken);
        setError('Ingresa el codigo de tu app autenticadora para completar el acceso.');
        return;
      }

      if (effectiveRole === 'external_auditor') {
        navigate('/auditor');
      } else {
        navigate(`/${effectiveRole}`);
      }
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
        bgcolor: 'background.default',
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
          borderRadius: 6,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        {/* Logo + Título */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.secondary.main} 100%)`,
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
              color: 'text.primary',
              letterSpacing: 0,
              mb: 0.5,
            }}
          >
            Iniciar sesión
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', fontSize: '1rem', fontWeight: 400 }}
          >
            {fixedRole ? `Portal de ${roleLabels[fixedRole]}` : 'para continuar en '}
            {!fixedRole ? (
              <>
                {' '}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: 'text.primary', fontWeight: 500, fontSize: '1rem' }}
                >
                  SmartComedor
                </Typography>
              </>
            ) : null}
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
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {!fixedRole ? (
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
                <MenuItem value="external_auditor">Auditor Externo</MenuItem>
              </Select>
            </FormControl>
          ) : null}

          {twoFactorRequired && (
            <TextField
              label="Codigo 2FA (6 digitos)"
              name="twoFactorCode"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
              fullWidth
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
            />
          )}

          {/* Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Button
              component={RouterLink}
              to="/forgot-password"
              variant="text"
              size="small"
              sx={{
                fontSize: '0.875rem',
                color: 'primary.main',
                fontWeight: 500,
                p: '6px 8px',
                borderRadius: 2,
                '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
              }}
            >
              ¿Olvidaste tu contraseña?
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                color: 'white',
                fontWeight: 500,
                fontSize: '0.875rem',
                px: 3,
                py: 1,
                borderRadius: 999,
                '&:disabled': {
                  color: '#ffffff',
                },
              }}
            >
              {loading ? 'Iniciando...' : 'Siguiente'}
            </Button>
          </Box>

          {effectiveRole === 'student' ? (
            <>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  fullWidth
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    py: 1,
                    borderRadius: 999,
                  }}
                >
                  Crear cuenta
                </Button>
              </Box>
            </>
          ) : null}
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
              color: 'text.secondary',
              fontSize: '0.75rem',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main', textDecoration: 'underline' },
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
