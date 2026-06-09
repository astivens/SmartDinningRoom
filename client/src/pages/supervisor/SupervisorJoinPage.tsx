import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { supervisorService } from '../../api/supervisorApi';

export default function SupervisorJoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [formData, setFormData] = useState({ email: '', name: '', lastName: '', telefono: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación inválido.');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.password.length !== 8) {
      setError('La contraseña debe tener exactamente 8 caracteres');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const data = await supervisorService.joinWithInvite({
        token,
        email: formData.email,
        name: formData.name,
        lastName: formData.lastName,
        telefono: formData.telefono,
        password: formData.password,
      });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Registro de Supervisor
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Completa tus datos para acceder al sistema
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message} Redirigiendo...</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre" name="name" value={formData.name} onChange={handleChange} required fullWidth inputProps={{ maxLength: 20 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Apellido" name="lastName" value={formData.lastName} onChange={handleChange} required fullWidth inputProps={{ maxLength: 20 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Correo electrónico" name="email" type="email" value={formData.email} onChange={handleChange} required fullWidth inputProps={{ maxLength: 30 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} fullWidth inputProps={{ maxLength: 15 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ minLength: 8, maxLength: 8 }}
                helperText="Exactamente 8 caracteres"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirmar contraseña"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                fullWidth
                inputProps={{ maxLength: 8 }}
                error={formData.confirmPassword !== '' && formData.confirmPassword !== formData.password}
                helperText={formData.confirmPassword !== '' && formData.confirmPassword !== formData.password ? 'No coinciden' : ''}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !token}
            sx={{ mt: 3 }}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </Button>
        </form>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2">
            <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
              Volver a Iniciar Sesión
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
