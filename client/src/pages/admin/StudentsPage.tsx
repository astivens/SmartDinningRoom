import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import VerifiedIcon from '@mui/icons-material/Verified';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';

const emptyForm = {
  email: '',
  password: '',
  name: '',
  lastName: '',
  cedula: '',
  carrera: '',
  semestre: '',
  telefono: '',
  barrio: '',
  categoriaSisben: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [validateOpen, setValidateOpen] = useState(false);
  const [validateStudent, setValidateStudent] = useState<any>(null);
  const [validateForm, setValidateForm] = useState({ cedula: '', name: '', lastName: '' });
  const [validateMsg, setValidateMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const fetchStudents = async () => {
    try {
      const data = await studentService.getStudents(search, page, 10);
      setStudents(data.students ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleOpenCreate = () => {
    setEditStudent(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditStudent(user);
    setFormData({
      email: user.email ?? '',
      password: '',
      name: user.name ?? '',
      lastName: user.lastName ?? '',
      cedula: user.student?.cedula ?? '',
      carrera: user.student?.carrera ?? '',
      semestre: user.student?.semestre?.toString() ?? '',
      telefono: user.student?.telefono ?? '',
      barrio: user.student?.barrio ?? '',
      categoriaSisben: user.student?.categoriaSisben ?? '',
    });
    setFormError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditStudent(null);
    setFormData({ ...emptyForm });
    setFormError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        email: formData.email,
        name: formData.name,
        lastName: formData.lastName,
        cedula: formData.cedula,
        carrera: formData.carrera,
        semestre: Number(formData.semestre),
        telefono: formData.telefono,
        barrio: formData.barrio,
        categoriaSisben: formData.categoriaSisben,
        ...(editStudent ? {} : { password: formData.password, etnia: 'Ninguna', trabaja: false, desplazado: false, trabajadorUniversitario: false, diasComedor: [] }),
      };

      if (editStudent) {
        await studentService.updateStudent(editStudent.id, payload);
      } else {
        await studentService.createStudent(payload);
      }
      await fetchStudents();
      handleClose();
    } catch (error: any) {
      setFormError(error.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.isActive ? 'deshabilitar' : 'habilitar';
    if (window.confirm(`¿Estás seguro de ${action} este estudiante?`)) {
      try {
        await studentService.updateStudent(user.id, { isActive: !user.isActive });
        fetchStudents();
      } catch (error) {
        console.error('Error toggling status:', error);
      }
    }
  };

  const handleOpenValidate = (user: any) => {
    setValidateStudent(user);
    setValidateForm({ cedula: '', name: '', lastName: '' });
    setValidateMsg({ type: '', text: '' });
    setValidateOpen(true);
  };

  const handleValidateSisben = async () => {
    try {
      const data = await studentService.validateSisben(validateStudent.id, validateForm);
      if (data.validated) {
        setValidateMsg({ type: 'success', text: data.message });
        fetchStudents();
      } else {
        setValidateMsg({ type: 'error', text: data.message });
      }
    } catch (error: any) {
      setValidateMsg({ type: 'error', text: error.response?.data?.message ?? 'Error al validar' });
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Estudiantes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Agregar Estudiante
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Buscar por nombre, apellido, cédula o carrera..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Carrera</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>SISBEN</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.lastName}</TableCell>
                <TableCell>{user.student?.cedula}</TableCell>
                <TableCell>{user.student?.carrera}</TableCell>
                <TableCell>{user.student?.semestre}</TableCell>
                <TableCell>
                  {user.student?.isValidatedSisben ? (
                    <Chip icon={<VerifiedIcon />} label="Validado" color="success" size="small" />
                  ) : (
                    <Chip label="Sin validar" color="warning" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Activo' : 'Inactivo'}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Editar">
                    <IconButton onClick={() => handleOpenEdit(user)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Validar SISBEN">
                    <IconButton onClick={() => handleOpenValidate(user)} color="primary">
                      <VerifiedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user.isActive ? 'Deshabilitar' : 'Habilitar'}>
                    <IconButton onClick={() => handleToggleStatus(user)} color={user.isActive ? 'error' : 'success'}>
                      {user.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
        <Typography sx={{ mx: 2 }}>Página {page}</Typography>
        <Button disabled={page * 10 >= total} onClick={() => setPage(page + 1)}>Siguiente</Button>
      </Box>

      {/* Dialog crear/editar */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre" name="name" value={formData.name} onChange={handleChange} fullWidth inputProps={{ maxLength: 20 }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Apellido" name="lastName" value={formData.lastName} onChange={handleChange} fullWidth inputProps={{ maxLength: 20 }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} fullWidth inputProps={{ maxLength: 30 }} required />
            </Grid>
            {!editStudent && (
              <Grid item xs={12} sm={6}>
                <TextField label="Contraseña" name="password" type="password" value={formData.password} onChange={handleChange} fullWidth inputProps={{ minLength: 8, maxLength: 8 }} required helperText="Exactamente 8 caracteres" />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField label="Cédula" name="cedula" value={formData.cedula} onChange={handleChange} fullWidth inputProps={{ minLength: 6, maxLength: 12 }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Carrera" name="carrera" value={formData.carrera} onChange={handleChange} fullWidth inputProps={{ maxLength: 25 }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Semestre" name="semestre" type="number" value={formData.semestre} onChange={handleChange} fullWidth inputProps={{ min: 1, max: 20 }} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Barrio" name="barrio" value={formData.barrio} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Categoría SISBEN" name="categoriaSisben" value={formData.categoriaSisben} onChange={handleChange} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : editStudent ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog validar SISBEN */}
      <Dialog open={validateOpen} onClose={() => setValidateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Validar SISBEN — {validateStudent?.name} {validateStudent?.lastName}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresa los datos tal como aparecen en el documento SISBEN del estudiante.
          </Typography>
          {validateMsg.text && (
            <Alert severity={validateMsg.type as any} sx={{ mb: 2 }}>{validateMsg.text}</Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Cédula del documento SISBEN" value={validateForm.cedula} onChange={(e) => setValidateForm({ ...validateForm, cedula: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre en SISBEN" value={validateForm.name} onChange={(e) => setValidateForm({ ...validateForm, name: e.target.value })} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Apellido en SISBEN" value={validateForm.lastName} onChange={(e) => setValidateForm({ ...validateForm, lastName: e.target.value })} fullWidth />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setValidateOpen(false)}>Cerrar</Button>
          <Button variant="contained" onClick={handleValidateSisben} startIcon={<VerifiedIcon />}>
            Validar
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
