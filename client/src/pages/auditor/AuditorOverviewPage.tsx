import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';
import { supervisorService } from '../../api/supervisorApi';
import { mealService, paymentService, complaintService, newsService } from '../../api/servicesApi';
import { ratingService } from '../../api/servicesApi';
import { auditService } from '../../api/auditApi';
import FeedbackState from '../../components/FeedbackState';

interface AuditorSnapshot {
  students: any[];
  supervisors: any[];
  payments: any[];
  complaints: any[];
  news: any[];
  ratings: any[];
  auditLogs: any[];
  analytics: any | null;
}

const FILTER_METHOD_OPTIONS = ['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
const FILTER_STATUS_OPTIONS = ['', '200', '201', '204', '400', '401', '403', '404', '409', '422', '500'] as const;
const FILTER_ROLE_OPTIONS = ['', 'anonymous', 'student', 'supervisor', 'admin', 'external_auditor'] as const;
const FILTER_PATH_OPTIONS = [
  '',
  '/api/auth',
  '/api/students',
  '/api/supervisors',
  '/api/meals',
  '/api/payments',
  '/api/complaints',
  '/api/news',
  '/api/ratings',
  '/api/audit',
  '/api/health',
] as const;

export default function AuditorOverviewPage() {
  const [snapshot, setSnapshot] = useState<AuditorSnapshot>({
    students: [],
    supervisors: [],
    payments: [],
    complaints: [],
    news: [],
    ratings: [],
    auditLogs: [],
    analytics: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState({
    method: '',
    statusCode: '',
    path: '',
    role: '',
    startDate: '',
    endDate: '',
  });

  const fetchReadOnlyData = async (targetPage = page) => {
    try {
      setLoading(true);
      setError('');
      const [studentsRes, supervisorsRes, paymentsRes, complaintsRes, newsRes, ratingsRes, auditRes, analyticsRes] = await Promise.all([
        studentService.getStudents('', 1, 20, false),
        supervisorService.getSupervisors(),
        paymentService.getPayments(undefined, undefined, 1, 20),
        complaintService.getComplaints(undefined, undefined, 1, 20),
        newsService.getNews(),
        ratingService.getRatings(),
        auditService.getLogs(targetPage, 25, filters),
        mealService.getDashboardAnalytics(30),
      ]);

      setSnapshot({
        students: studentsRes.students ?? [],
        supervisors: supervisorsRes ?? [],
        payments: paymentsRes.payments ?? [],
        complaints: complaintsRes.complaints ?? [],
        news: newsRes ?? [],
        ratings: ratingsRes.ratings ?? [],
        auditLogs: auditRes.logs ?? [],
        analytics: analyticsRes ?? null,
      });
      setTotalLogs(auditRes.total ?? 0);
    } catch (fetchError) {
      console.error('Error cargando datos de auditoría externa:', fetchError);
      setError('No fue posible cargar la supervisión integral en modo lectura.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadOnlyData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Auditoría Externa - Supervisión Integral (Solo lectura)
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Esta vista permite observar toda la actividad del sistema sin ejecutar acciones operativas.
      </Typography>

      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Typography variant="body2">Estudiantes</Typography><Typography variant="h5">{snapshot.students.length}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Typography variant="body2">Supervisores</Typography><Typography variant="h5">{snapshot.supervisors.length}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Typography variant="body2">Pagos (últimos)</Typography><Typography variant="h5">{snapshot.payments.length}</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card><CardContent><Typography variant="body2">Eventos de auditoría</Typography><Typography variant="h5">{snapshot.auditLogs.length}</Typography></CardContent></Card>
        </Grid>
      </Grid>

      {snapshot.analytics ? (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Métricas globales (30 días)</Typography>
          <Typography variant="body2">
            Asistencias: {snapshot.analytics.totals?.totalAttendancesInRange ?? 0} | Ingresos: {snapshot.analytics.totals?.totalRevenueInRange ?? 0} | Calificación promedio: {snapshot.analytics.totals?.averageRatingInRange ?? 0}
          </Typography>
        </Paper>
      ) : null}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Filtros de eventos de auditoría</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Método"
              value={filters.method}
              onChange={(e) => setFilters((prev) => ({ ...prev, method: e.target.value }))}
              fullWidth
              size="small"
            >
              {FILTER_METHOD_OPTIONS.map((method) => (
                <MenuItem key={method || 'all-methods'} value={method}>
                  {method || 'Todos'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Status HTTP"
              value={filters.statusCode}
              onChange={(e) => setFilters((prev) => ({ ...prev, statusCode: e.target.value }))}
              fullWidth
              size="small"
            >
              {FILTER_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status || 'all-status'} value={status}>
                  {status || 'Todos'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              label="Ruta"
              value={filters.path}
              onChange={(e) => setFilters((prev) => ({ ...prev, path: e.target.value }))}
              fullWidth
              size="small"
            >
              {FILTER_PATH_OPTIONS.map((apiPath) => (
                <MenuItem key={apiPath || 'all-paths'} value={apiPath}>
                  {apiPath || 'Todas'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Rol"
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              fullWidth
              size="small"
            >
              {FILTER_ROLE_OPTIONS.map((role) => (
                <MenuItem key={role || 'all-roles'} value={role}>
                  {role || 'Todos'}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              label="Desde"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <TextField
              label="Hasta"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => {
              setPage(1);
              fetchReadOnlyData(1);
            }}
          >
            Aplicar filtros
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const reset = { method: '', statusCode: '', path: '', role: '', startDate: '', endDate: '' };
              setFilters(reset);
              setPage(1);
              setTimeout(() => fetchReadOnlyData(1), 0);
            }}
          >
            Limpiar
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell colSpan={3}>Últimos registros de auditoría</TableCell></TableRow></TableHead>
              <TableBody>
                {snapshot.auditLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.userEmail ?? 'sistema@smartcomedor.local'}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString('es-CO')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" color="text.secondary">Total eventos: {totalLogs}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page <= 1}
                onClick={() => {
                  const nextPage = page - 1;
                  setPage(nextPage);
                  fetchReadOnlyData(nextPage);
                }}
              >
                Anterior
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={snapshot.auditLogs.length < 25}
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchReadOnlyData(nextPage);
                }}
              >
                Siguiente
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell colSpan={3}>Pagos recientes</TableCell></TableRow></TableHead>
              <TableBody>
                {snapshot.payments.slice(0, 10).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.student?.user?.name} {payment.student?.user?.lastName}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>{payment.isVerified ? 'Verificado' : 'Pendiente'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell colSpan={3}>Quejas y sugerencias</TableCell></TableRow></TableHead>
              <TableBody>
                {snapshot.complaints.slice(0, 10).map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.type}</TableCell>
                    <TableCell>{complaint.content}</TableCell>
                    <TableCell>{complaint.isResolved ? 'Resuelta' : 'Pendiente'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        <Grid item xs={12} md={6}>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell colSpan={3}>Noticias publicadas</TableCell></TableRow></TableHead>
              <TableBody>
                {snapshot.news.slice(0, 10).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.isActive ? 'Activa' : 'Inactiva'}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ mt: 2 }}>
          <FeedbackState type="loading" compact description="Cargando información de supervisión..." />
        </Box>
      ) : null}
    </Layout>
  );
}
