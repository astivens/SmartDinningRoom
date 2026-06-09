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
import Layout from '../../components/layout/Layout';
import { cycleApi, Cycle } from '../../api/cycleApi';
import FeedbackState from '../../components/FeedbackState';

export default function CyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    setLoading(true);
    setListError('');
    try {
      const data = await cycleApi.getAll();
      setCycles(data);
    } catch (error: any) {
      console.error('Error fetching cycles:', error);
      setListError(error.response?.data?.message ?? 'No se pudo cargar la lista de ciclos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setFormData({ name: '', startDate: '', endDate: '' });
    setFormError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setFormError('');
    setSaving(true);
    try {
      await cycleApi.create({
        name: formData.name,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
      });
      await fetchCycles();
      handleClose();
    } catch (error: any) {
      setFormError(error.response?.data?.message ?? 'Error al guardar el ciclo');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCycle = async (cycle: Cycle) => {
    if (window.confirm(`¿Estás seguro de cerrar el ciclo "${cycle.name}"? Esto deshabilitará a los estudiantes activos en este periodo.`)) {
      try {
        await cycleApi.close(cycle.id);
        await fetchCycles();
      } catch (error: any) {
        console.error('Error closing cycle:', error);
        alert(error.response?.data?.message ?? 'Error al cerrar el ciclo');
      }
    }
  };

  const filteredCycles = cycles.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Ciclos / Periodos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nuevo Ciclo
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          placeholder="Buscar ciclo..."
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
              <TableCell>UID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <FeedbackState type="loading" compact description="Cargando ciclos..." />
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && listError ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <FeedbackState
                    type="error"
                    title="Error al cargar ciclos"
                    description={listError}
                    actionLabel="Reintentar"
                    onAction={fetchCycles}
                  />
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !listError && filteredCycles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <FeedbackState
                    type="empty"
                    title="No hay ciclos para mostrar"
                    description="Prueba ajustando la búsqueda o crea un nuevo ciclo."
                  />
                </TableCell>
              </TableRow>
            ) : null}

            {!loading && !listError && filteredCycles.map((cycle) => (
              <TableRow key={cycle.id}>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{(cycle as any).uid}</Typography>
                </TableCell>
                <TableCell>{cycle.name}</TableCell>
                <TableCell>{new Date(cycle.startDate).toLocaleDateString('es-CO')}</TableCell>
                <TableCell>{new Date(cycle.endDate).toLocaleDateString('es-CO')}</TableCell>
                <TableCell>
                  <Chip
                    label={cycle.status}
                    color={cycle.status === 'Activo' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {cycle.status === 'Activo' && (
                    <Tooltip title="Cerrar Ciclo">
                      <IconButton onClick={() => handleCloseCycle(cycle)} color="error">
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Crear Nuevo Ciclo</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre del Ciclo (ej: 2026-1)"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Fecha de Inicio"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Fecha de Fin"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
