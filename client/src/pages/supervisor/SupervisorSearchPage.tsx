import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tooltip,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TodayIcon from '@mui/icons-material/Today';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';
import { mealService } from '../../api/servicesApi';

const DIAS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type RowStatus = {
  loading: boolean;
  result?: 'success' | 'error' | 'no-meals';
  message?: string;
};

export default function SupervisorSearchPage() {
  const hoy = DIAS_ES[new Date().getDay()];

  const [todayStudents, setTodayStudents] = useState<any[]>([]);
  const [todayLoading, setTodayLoading] = useState(false);

  const [search, setSearch] = useState({ cedula: '', nombre: '', apellido: '', carrera: '' });
  const [results, setResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [searchOpen, setSearchOpen] = useState(false);

  const loadTodayStudents = useCallback(async () => {
    setTodayLoading(true);
    try {
      const data = await studentService.searchStudents({ dia: hoy });
      setTodayStudents(data);
    } catch (error) {
      console.error('Error cargando estudiantes de hoy:', error);
    } finally {
      setTodayLoading(false);
    }
  }, [hoy]);

  useEffect(() => {
    loadTodayStudents();
  }, [loadTodayStudents]);

  const handleSearch = async () => {
    setSearchLoading(true);
    try {
      const data = await studentService.searchStudents(search);
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleRegisterDirect = async (student: any) => {
    setRowStatus((prev) => ({ ...prev, [student.id]: { loading: true } }));
    try {
      const mealsData = await studentService.getAvailableMeals(student.id);
      if (mealsData.availableMeals <= 0) {
        setRowStatus((prev) => ({
          ...prev,
          [student.id]: { loading: false, result: 'no-meals', message: 'Sin almuerzos disponibles' },
        }));
        return;
      }
      await mealService.registerMeal(student.id);
      setRowStatus((prev) => ({
        ...prev,
        [student.id]: { loading: false, result: 'success', message: 'Registrado' },
      }));
    } catch (error: any) {
      setRowStatus((prev) => ({
        ...prev,
        [student.id]: {
          loading: false,
          result: 'error',
          message: error.response?.data?.message ?? 'Error al registrar',
        },
      }));
    }
  };

  const registrados = Object.values(rowStatus).filter((s) => s.result === 'success').length;

  const renderActionCell = (student: any) => {
    const status = rowStatus[student.id];
    if (status?.result === 'success') {
      return <Chip icon={<CheckCircleIcon />} label="Registrado" color="success" size="small" />;
    }
    if (status?.result === 'error' || status?.result === 'no-meals') {
      return (
        <Tooltip title={status.message ?? ''}>
          <Chip
            label={status.message}
            color={status.result === 'no-meals' ? 'warning' : 'error'}
            size="small"
          />
        </Tooltip>
      );
    }
    return (
      <Button
        variant="contained"
        size="small"
        color="primary"
        startIcon={
          status?.loading ? (
            <CircularProgress size={14} color="inherit" />
          ) : (
            <RestaurantIcon fontSize="small" />
          )
        }
        onClick={() => handleRegisterDirect(student)}
        disabled={status?.loading}
      >
        Registrar
      </Button>
    );
  };

  const studentsTableHead = (
    <TableHead>
      <TableRow>
        <TableCell>Nombre</TableCell>
        <TableCell>Apellido</TableCell>
        <TableCell>Cédula</TableCell>
        <TableCell>Carrera</TableCell>
        <TableCell>Almuerzos disponibles</TableCell>
        <TableCell align="center">Registrar almuerzo</TableCell>
      </TableRow>
    </TableHead>
  );

  return (
    <Layout>
      {/* ── Habilitados hoy ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <TodayIcon color="primary" />
        <Typography variant="h5" fontWeight={600}>
          Habilitados hoy —{' '}
          <Typography component="span" variant="h5" color="primary" fontWeight={700}>
            {hoy}
          </Typography>
        </Typography>
        {registrados > 0 && (
          <Chip label={`${registrados} registrado${registrados > 1 ? 's' : ''}`} color="success" size="small" />
        )}
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Recargar lista">
            <IconButton onClick={loadTodayStudents} disabled={todayLoading} size="small">
              {todayLoading ? <CircularProgress size={18} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {todayLoading && todayStudents.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : todayStudents.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay estudiantes habilitados para el día de hoy ({hoy}).
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            {studentsTableHead}
            <TableBody>
              {todayStudents.map((student) => (
                <TableRow
                  key={student.id}
                  sx={{
                    bgcolor:
                      rowStatus[student.id]?.result === 'success'
                        ? 'success.50'
                        : undefined,
                  }}
                >
                  <TableCell>{student.nombre}</TableCell>
                  <TableCell>{student.apellido}</TableCell>
                  <TableCell>{student.cedula}</TableCell>
                  <TableCell>{student.carrera}</TableCell>
                  <TableCell>
                    <Typography
                      fontWeight={700}
                      color={student.almuerzosDisponibles > 0 ? 'primary' : 'text.disabled'}
                    >
                      {student.almuerzosDisponibles}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">{renderActionCell(student)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* ── Búsqueda manual ── */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, cursor: 'pointer', width: 'fit-content' }}
        onClick={() => setSearchOpen((v) => !v)}
      >
        <SearchIcon color="action" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
          Buscar estudiante manualmente
        </Typography>
        {searchOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </Box>

      <Collapse in={searchOpen}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Cédula"
                value={search.cedula}
                onChange={(e) => setSearch({ ...search, cedula: e.target.value })}
                onKeyDown={handleKeyDown}
                autoFocus={searchOpen}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Nombre"
                value={search.nombre}
                onChange={(e) => setSearch({ ...search, nombre: e.target.value })}
                onKeyDown={handleKeyDown}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Apellido"
                value={search.apellido}
                onChange={(e) => setSearch({ ...search, apellido: e.target.value })}
                onKeyDown={handleKeyDown}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Carrera"
                value={search.carrera}
                onChange={(e) => setSearch({ ...search, carrera: e.target.value })}
                onKeyDown={handleKeyDown}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={searchLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                onClick={handleSearch}
                disabled={searchLoading}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {results.length > 0 && (
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              {studentsTableHead}
              <TableBody>
                {results.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.nombre}</TableCell>
                    <TableCell>{student.apellido}</TableCell>
                    <TableCell>{student.cedula}</TableCell>
                    <TableCell>{student.carrera}</TableCell>
                    <TableCell>
                      <Typography
                        fontWeight={700}
                        color={student.almuerzosDisponibles > 0 ? 'primary' : 'text.disabled'}
                      >
                        {student.almuerzosDisponibles}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{renderActionCell(student)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </Collapse>
    </Layout>
  );
}
