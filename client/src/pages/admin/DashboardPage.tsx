import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, alpha, Alert, useMediaQuery, useTheme } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';
import PaymentsIcon from '@mui/icons-material/Payments';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';
import { supervisorService } from '../../api/supervisorApi';
import { ratingService, mealService } from '../../api/servicesApi';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardAnalyticsResponse } from '../../types';
import FeedbackState from '../../components/FeedbackState';

export default function AdminDashboard() {
  const theme = useTheme();
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    todayMeals: 0,
    averageRating: 0,
  });
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [analyticsError, setAnalyticsError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, supervisorsRes, ratingRes, mealsRes] = await Promise.all([
          studentService.getStudents('', 1, 1),
          supervisorService.getSupervisors(),
          ratingService.getAverageRating(),
          mealService.getTodayAttendance(),
        ]);

        setStats({
          students: studentsRes.total || 0,
          supervisors: supervisorsRes.length || 0,
          todayMeals: mealsRes.length || 0,
          averageRating: ratingRes.averageRating || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      setAnalyticsError('');
      try {
        const response = await mealService.getDashboardAnalytics(60);
        setAnalytics(response);
      } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        setAnalyticsError('No se pudo cargar la analítica del dashboard.');
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = [
    {
      title: 'Estudiantes',
      value: stats.students,
      icon: <PeopleIcon sx={{ fontSize: 24 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Supervisores',
      value: stats.supervisors,
      icon: <SupervisorAccountIcon sx={{ fontSize: 24 }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Almuerzos Hoy',
      value: stats.todayMeals,
      icon: <RestaurantIcon sx={{ fontSize: 24 }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Calificación Promedio',
      value: stats.averageRating,
      icon: <StarIcon sx={{ fontSize: 24 }} />,
      color: theme.palette.error.main,
    },
    {
      title: 'Ingresos (rango)',
      value: analytics?.totals.totalRevenueInRange ?? 0,
      icon: <PaymentsIcon sx={{ fontSize: 24 }} />,
      color: theme.palette.secondary.dark,
    },
  ];

  const pieColors = [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.primary.main];

  return (
    <Layout>
      <Typography
        variant="h5"
        sx={{ fontWeight: 500, color: 'text.primary', mb: 3 }}
      >
        Panel de Administrador
      </Typography>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={card.title}>
            <Card>
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  p: '20px 24px !important',
                }}
              >
                <Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 500, color: 'text.primary', fontSize: '2rem', mb: 0.5 }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    {card.title}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '50%',
                    bgcolor: alpha(card.color, 0.1),
                    color: card.color,
                    flexShrink: 0,
                  }}
                >
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {analyticsError ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {analyticsError}
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Tendencia de asistencias ({analytics?.rangeDays ?? 60} días)
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={analytics?.charts.attendanceTrend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Estado SISBEN
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={analytics?.charts.sisbenDistribution ?? []}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={95}
                      label
                      isAnimationActive={!prefersReducedMotion}
                    >
                      {(analytics?.charts.sisbenDistribution ?? []).map((item, index) => (
                        <Cell key={`${item.label}-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Asistencias por carrera
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics?.charts.attendanceByCareer ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="career" angle={-20} textAnchor="end" height={70} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill={theme.palette.success.main}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Distribución de calificaciones
              </Typography>
              <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics?.charts.ratingsDistribution ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stars" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill={theme.palette.error.main}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {isLoadingAnalytics ? (
        <Box sx={{ mt: 2 }}>
          <FeedbackState type="loading" compact description="Cargando analítica avanzada..." />
        </Box>
      ) : null}
    </Layout>
  );
}
