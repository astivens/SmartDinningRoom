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
  TextField,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import Layout from '../../components/layout/Layout';
import { mealService } from '../../api/servicesApi';
import { useAuth } from '../../auth/AuthProvider';
import DataSectionCard from '../../components/DataSectionCard';
import FeedbackState from '../../components/FeedbackState';

export default function SupervisorHistoryPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await mealService.getMealHistory(undefined, startDate || undefined, endDate || undefined);
      setLogs(data ?? []);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError(err.response?.data?.message ?? 'No se pudo cargar el historial.');
    } finally {
      setLoading(false);
    }
  };

  const fetchToday = async () => {
    try {
      const data = await mealService.getTodayAttendance();
      setTodayCount(data?.total ?? 0);
    } catch (error) {
      console.error('Error fetching today:', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchToday();
  }, []);

  const handleFilter = () => {
    fetchHistory();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => fetchHistory(), 50);
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Historial de Almuerzos Registrados
      </Typography>

      <DataSectionCard sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <RestaurantIcon color="primary" />
        <Box>
          <Typography variant="body2" color="text.secondary">Almuerzos registrados hoy</Typography>
          <Typography variant="h4" color="primary" fontWeight={700}>{todayCount}</Typography>
        </Box>
      </DataSectionCard>

      <DataSectionCard title="Filtrar por fecha" sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="Fecha inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Fecha fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleFilter}>Filtrar</Button>
            <Button variant="outlined" onClick={handleClearFilter}>Limpiar</Button>
          </Grid>
        </Grid>
      </DataSectionCard>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>Estudiante (ID)</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <FeedbackState type="loading" compact description="Cargando historial..." />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && error ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <FeedbackState type="error" title="Error al cargar historial" description={error} />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && !error && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <FeedbackState type="empty" title="No hay registros para mostrar" />
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.date ?? log.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  <TableCell>{log.hora ?? new Date(log.createdAt).toLocaleTimeString('es-CO')}</TableCell>
                  <TableCell>{log.studentId}</TableCell>
                  <TableCell>
                    <Chip label="Registrado" color="success" size="small" icon={<RestaurantIcon />} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}
