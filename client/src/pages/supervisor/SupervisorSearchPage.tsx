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
  ButtonBase,
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
import FeedbackState from '../../components/FeedbackState';

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

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [todayError, setTodayError] = useState('');
  const [searchError, setSearchError] = useState('');

  const loadTodayStudents = useCallback(async () => {
    setTodayLoading(true);
    setTodayError('');
    try {
      const data = await studentService.searchStudents({ dia: hoy });
      setTodayStudents(data);
    } catch (error: any) {
      console.error('Error cargando estudiantes de hoy:', error);
      setTodayError(error.response?.data?.message ?? 'No se pudo cargar la lista de habilitados de hoy.');
    } finally {
      setTodayLoading(false);
    }
  }, [hoy]);

  useEffect(() => {
    loadTodayStudents();
  }, [loadTodayStudents]);

  const handleSearch = async () => {
    setSearchLoading(true);
    setSearchError('');
    try {
      const data = await studentService.searchStudents({ q: searchText });
      setResults(data);
    } catch (error: any) {
      console.error('Error:', error);
      setSearchError(error.response?.data?.message ?? 'Error al buscar estudiantes.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleRegisterDirect = async (student: any) => {
    const targetStudentId = student.studentId ?? student.id;
    setRowStatus((prev) => ({ ...prev, [targetStudentId]: { loading: true } }));
    try {
      const mealsData = await studentService.getAvailableMeals(targetStudentId);
      if (mealsData.availableMeals <= 0) {
        setRowStatus((prev) => ({
          ...prev,
          [targetStudentId]: { loading: false, result: 'no-meals', message: 'Sin almuerzos disponibles' },
        }));
        return;
      }
      await mealService.registerMeal(targetStudentId);
      setRowStatus((prev) => ({
        ...prev,
        [targetStudentId]: { loading: false, result: 'success', message: 'Registrado' },
      }));
    } catch (error: any) {
      setRowStatus((prev) => ({
        ...prev,
        [targetStudentId]: {
          loading: false,
          result: 'error',
          message: error.response?.data?.message ?? 'Error al registrar',
        },
      }));
    }
  };

  const registrados = Object.values(rowStatus).filter((s) => s.result === 'success').length;

  const renderActionCell = (student: any) => {
    const targetStudentId = student.studentId ?? student.id;
    const status = rowStatus[targetStudentId];
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
        Firmar
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
        <Box sx={{ py: 4 }}>
          <FeedbackState type="loading" compact description="Cargando habilitados de hoy..." />
        </Box>
      ) : todayError ? (
        <Box sx={{ mb: 3 }}>
          <FeedbackState
            type="error"
            title="No se pudo cargar la lista diaria"
            description={todayError}
            actionLabel="Reintentar"
            onAction={loadTodayStudents}
          />
        </Box>
      ) : todayStudents.length === 0 ? (
        <Box sx={{ mb: 3 }}>
          <FeedbackState
            type="empty"
            title="Sin estudiantes habilitados hoy"
            description={`No hay estudiantes habilitados para el día ${hoy}.`}
          />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            {studentsTableHead}
            <TableBody>
              {todayStudents.map((student) => (
                <TableRow
                  key={student.studentId ?? student.id}
                  sx={{
                    bgcolor:
                      rowStatus[student.studentId ?? student.id]?.result === 'success'
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
      <ButtonBase
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, width: 'fit-content', borderRadius: 2, px: 0.5, py: 0.5 }}
        onClick={() => setSearchOpen((v) => !v)}
      >
        <SearchIcon color="action" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
          Buscar estudiante manualmente
        </Typography>
        {searchOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </ButtonBase>

      <Collapse in={searchOpen}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Buscar por nombre, apellido o UID"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
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
        {searchError ? (
          <Box sx={{ mb: 2 }}>
            <FeedbackState type="error" title="Error en la búsqueda" description={searchError} />
          </Box>
        ) : null}
        {!searchLoading && searchText.trim() !== '' && results.length === 0 && !searchError ? (
          <Box sx={{ mb: 2 }}>
            <FeedbackState
              type="empty"
              compact
              title="Sin resultados"
              description="No encontramos estudiantes con ese criterio."
            />
          </Box>
        ) : null}

        {results.length > 0 && (
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              {studentsTableHead}
              <TableBody>
                {results.map((student) => (
                  <TableRow key={student.studentId ?? student.id}>
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
