import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Chip,
  CircularProgress,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, QrCode2 } from '@mui/icons-material';
import { authService, RegisterData } from '../../api/authApi';
import FeedbackState from '../../components/FeedbackState';
import FileUploadField from '../../components/FileUploadField';
import { DAYS_COMEDOR, ETNIAS, SISBEN_CATEGORIES, SEMESTERS, CARRERAS } from '../../constants';

const steps = [
  'Datos de Cuenta',
  'Información Personal',
  'Datos SISBEN',
  'Información Adicional',
  '2FA (Opcional)',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sisbenFile, setSisbenFile] = useState<File | null>(null);
  const [cedulaFrontalFile, setCedulaFrontalFile] = useState<File | null>(null);
  const [horarioPdfFile, setHorarioPdfFile] = useState<File | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [sisbenValidated, setSisbenValidated] = useState<boolean | null>(null);

  // Estado del paso 2FA
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [twoFaToken, setTwoFaToken] = useState('');
  const [twoFaVerified, setTwoFaVerified] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');
  const [registeredTokens, setRegisteredTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null);

  const [formData, setFormData] = useState<Omit<RegisterData, 'archivoSisben' | 'cedulaFrontal' | 'horarioPdf' | 'reciboPago'>>({
    email: '',
    password: '',
    name: '',
    lastName: '',
    cedula: '',
    carrera: '',
    semestre: 1,
    categoriaSisben: '',
    direccion: '',
    barrio: '',
    telefono: '',
    trabaja: false,
    trabajaEstudia: false,
    estudiaSolo: true,
    etnia: 'Ninguna',
    desplazado: false,
    trabajadorUniversitario: false,
    diasComedor: [],
  });

  const handleChange = (e: any) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleDayToggle = (day: string) => {
    const newDays = formData.diasComedor.includes(day)
      ? formData.diasComedor.filter((d) => d !== day)
      : [...formData.diasComedor, day];
    setFormData({ ...formData, diasComedor: newDays });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSisbenFile(file);
  };

  const handleCedulaFrontalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCedulaFrontalFile(file);
  };

  const handleHorarioPdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setHorarioPdfFile(file);
  };

  const handlePaymentReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPaymentReceiptFile(file);
  };

  const handleNextStep = () => {
    if (activeStep === 0) {
      if (formData.password.length !== 8) {
        setError('La contraseña debe tener exactamente 8 caracteres');
        return;
      }
      if (formData.password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
    }
    if (activeStep === 2 && (!sisbenFile || !cedulaFrontalFile || !horarioPdfFile)) {
      setError('SISBEN, cédula frontal y horario PDF son obligatorios');
      return;
    }
    setError('');
    setActiveStep(activeStep + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sisbenFile || !cedulaFrontalFile || !horarioPdfFile) {
      setError('SISBEN, cédula frontal y horario PDF son obligatorios');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await authService.register({
        ...formData,
        archivoSisben: sisbenFile,
        cedulaFrontal: cedulaFrontalFile,
        horarioPdf: horarioPdfFile,
        reciboPago: paymentReceiptFile
      });
      if (result.accessToken && result.refreshToken) {
        setRegisteredTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      } else {
        setRegisteredTokens(null);
      }
      setSisbenValidated(result.sisbenValidation?.validated ?? false);
      // Avanza al paso 2FA
      setActiveStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      // Almacena el token temporalmente para hacer la petición autenticada
      if (registeredTokens) {
        localStorage.setItem('accessToken', registeredTokens.accessToken);
        localStorage.setItem('refreshToken', registeredTokens.refreshToken);
      }
      const data = await authService.setupTwoFactor();
      setQrCodeDataUrl(data.qrCode);
    } catch (err: any) {
      setTwoFaError(err.response?.data?.message ?? 'Error al generar QR');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      await authService.verifyTwoFactor(twoFaToken);
      setTwoFaVerified(true);
    } catch (err: any) {
      setTwoFaError(err.response?.data?.message ?? 'Código inválido');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleFinish = () => {
    if (!registeredTokens) {
      navigate('/login');
      return;
    }
    if (!twoFaVerified) {
      // Limpia los tokens si no configuró 2FA
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    navigate('/login');
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
      <Paper sx={{ p: 4, maxWidth: 700, width: '100%' }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Registro - SmartComedor
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Paso 4: 2FA opcional — fuera del form */}
        {activeStep === 4 ? (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              ¡Registro exitoso! Ahora puedes configurar la autenticación de dos factores (opcional).
            </Alert>
            {sisbenValidated !== null && (
              <Alert severity={sisbenValidated ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {sisbenValidated ? 'SISBEN validado automaticamente.' : 'No se pudo validar automaticamente el SISBEN. Un administrador lo revisara.'}
              </Alert>
            )}

            {!twoFaVerified ? (
              <>
                <Typography variant="body1" gutterBottom>
                  La autenticación en dos factores (2FA) agrega una capa extra de seguridad a tu cuenta.
                  Necesitarás una app autenticadora como Google Authenticator o Authy.
                </Typography>

                {!qrCodeDataUrl ? (
                  <Button
                    variant="contained"
                    startIcon={twoFaLoading ? <CircularProgress size={18} color="inherit" /> : <QrCode2 />}
                    onClick={handleSetup2FA}
                    disabled={twoFaLoading}
                    sx={{ mt: 2 }}
                  >
                    Generar código QR
                  </Button>
                ) : (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Escanea este código QR con tu app autenticadora:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <img src={qrCodeDataUrl} alt="Código QR 2FA" style={{ width: 200, height: 200 }} />
                    </Box>
                    <TextField
                      label="Código de 6 dígitos"
                      value={twoFaToken}
                      onChange={(e) => setTwoFaToken(e.target.value)}
                      inputProps={{ maxLength: 6 }}
                      fullWidth
                      sx={{ mb: 2 }}
                    />
                    {twoFaError ? <Alert severity="error" sx={{ mb: 2 }}>{twoFaError}</Alert> : null}
                    <Button
                      variant="contained"
                      onClick={handleVerify2FA}
                      disabled={twoFaLoading || twoFaToken.length !== 6}
                      fullWidth
                    >
                      {twoFaLoading ? <CircularProgress size={20} color="inherit" /> : 'Verificar y activar 2FA'}
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                ✅ 2FA activado correctamente. Tu cuenta está protegida.
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="outlined" onClick={handleFinish}>
                {twoFaVerified ? 'Ir al inicio de sesión' : 'Omitir y continuar'}
              </Button>
            </Box>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Correo electrónico"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    fullWidth
                    inputProps={{ maxLength: 30 }}
                    helperText="Máximo 30 caracteres"
                  />
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
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="Exactamente 8 caracteres"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Confirmar Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    fullWidth
                    inputProps={{ maxLength: 8 }}
                    error={confirmPassword !== '' && confirmPassword !== formData.password}
                    helperText={
                      confirmPassword !== '' && confirmPassword !== formData.password
                        ? 'Las contraseñas no coinciden'
                        : ''
                    }
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Nombre"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    fullWidth
                    inputProps={{ maxLength: 20 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Apellido"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    fullWidth
                    inputProps={{ maxLength: 20 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Cédula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    required
                    fullWidth
                    inputProps={{ minLength: 6, maxLength: 12 }}
                    helperText="Entre 6 y 12 dígitos"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Carrera</InputLabel>
                    <Select name="carrera" value={formData.carrera} label="Carrera" onChange={handleChange}>
                      {CARRERAS.map((career) => (
                        <MenuItem key={career} value={career}>{career}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Semestre Actual</InputLabel>
                    <Select name="semestre" value={formData.semestre} label="Semestre Actual" onChange={handleChange}>
                      {SEMESTERS.map((semester) => (
                        <MenuItem key={semester} value={semester}>{semester}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Teléfono / Número de contacto"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Barrio"
                    name="barrio"
                    value={formData.barrio}
                    onChange={handleChange}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Dirección (Opcional)"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              </Grid>
            )}

            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Categoría SISBEN</InputLabel>
                    <Select
                      name="categoriaSisben"
                      value={formData.categoriaSisben}
                      label="Categoría SISBEN"
                      onChange={handleChange}
                    >
                      {SISBEN_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FileUploadField
                    label="Archivo SISBEN (PDF o JPG) *"
                    buttonLabel="Seleccionar archivo"
                    file={sisbenFile}
                    accept=".pdf,.jpg,.jpeg"
                    onChange={handleFileChange}
                    onClear={() => setSisbenFile(null)}
                  />
                  {sisbenValidated ? (
                    <Chip
                      icon={<CheckCircle />}
                      label="SISBEN validado"
                      color="success"
                      size="small"
                      sx={{ mt: 1, ml: 1 }}
                    />
                  ) : null}
                </Grid>
                <Grid item xs={12}>
                  <FileUploadField
                    label="Cédula frontal (PDF/JPG/PNG) *"
                    buttonLabel="Seleccionar cédula frontal"
                    file={cedulaFrontalFile}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleCedulaFrontalFileChange}
                    onClear={() => setCedulaFrontalFile(null)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FileUploadField
                    label="Horario académico (PDF) *"
                    buttonLabel="Seleccionar horario PDF"
                    file={horarioPdfFile}
                    accept=".pdf"
                    onChange={handleHorarioPdfFileChange}
                    onClear={() => setHorarioPdfFile(null)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Días de uso del comedor:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {DAYS_COMEDOR.map((day) => (
                      <FormControlLabel
                        key={day}
                        control={
                          <Checkbox
                            checked={formData.diasComedor.includes(day)}
                            onChange={() => handleDayToggle(day)}
                          />
                        }
                        label={day}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}

            {activeStep === 3 && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox name="trabaja" checked={formData.trabaja} onChange={handleChange} />
                    }
                    label="¿Trabaja?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox name="trabajaEstudia" checked={formData.trabajaEstudia} onChange={handleChange} />
                    }
                    label="¿Trabaja y estudia?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox name="estudiaSolo" checked={formData.estudiaSolo} onChange={handleChange} />
                    }
                    label="¿Estudia solamente?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox name="desplazado" checked={formData.desplazado} onChange={handleChange} />
                    }
                    label="¿Desplazado o víctima del conflicto?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="trabajadorUniversitario"
                        checked={formData.trabajadorUniversitario}
                        onChange={handleChange}
                      />
                    }
                    label="¿Trabajador/Funcionario de la universidad?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FileUploadField
                    label="Adjuntar recibo de pago (opcional en primer registro)"
                    buttonLabel="Seleccionar recibo"
                    file={paymentReceiptFile}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handlePaymentReceiptFileChange}
                    onClear={() => setPaymentReceiptFile(null)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Etnia</InputLabel>
                    <Select
                      name="etnia"
                      value={formData.etnia}
                      label="Etnia"
                      onChange={handleChange}
                    >
                      {ETNIAS.map((e) => (
                        <MenuItem key={e} value={e}>{e}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button disabled={activeStep === 0} onClick={() => setActiveStep(activeStep - 1)}>
                Atrás
              </Button>
              {activeStep < steps.length - 2 ? (
                <Button variant="contained" onClick={handleNextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Registrarse'}
                </Button>
              )}
            </Box>
          </form>
        )}

        {activeStep < 4 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              ¿Ya tienes cuenta?{' '}
              <Link component={RouterLink} to="/login" underline="hover" sx={{ fontWeight: 600 }}>
                Iniciar Sesión
              </Link>
            </Typography>
          </Box>
        )}
      </Paper>
      {loading && activeStep < 4 ? (
        <Box sx={{ width: '100%', maxWidth: 700, mt: 1 }}>
          <FeedbackState type="loading" compact description="Enviando registro..." />
        </Box>
      ) : null}
    </Box>
  );
}
