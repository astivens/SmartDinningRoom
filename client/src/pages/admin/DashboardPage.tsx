import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, alpha } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import StarIcon from '@mui/icons-material/Star';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';
import { supervisorService } from '../../api/supervisorApi';
import { ratingService, mealService } from '../../api/servicesApi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    supervisors: 0,
    todayMeals: 0,
    averageRating: 0,
  });

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

  const statCards = [
    {
      title: 'Estudiantes',
      value: stats.students,
      icon: <PeopleIcon sx={{ fontSize: 24 }} />,
      color: '#1a73e8',
    },
    {
      title: 'Supervisores',
      value: stats.supervisors,
      icon: <SupervisorAccountIcon sx={{ fontSize: 24 }} />,
      color: '#34a853',
    },
    {
      title: 'Almuerzos Hoy',
      value: stats.todayMeals,
      icon: <RestaurantIcon sx={{ fontSize: 24 }} />,
      color: '#f9ab00',
    },
    {
      title: 'Calificación Promedio',
      value: stats.averageRating,
      icon: <StarIcon sx={{ fontSize: 24 }} />,
      color: '#ea4335',
    },
  ];

  return (
    <Layout>
      <Typography
        variant="h5"
        sx={{ fontWeight: 400, color: '#202124', mb: 3 }}
      >
        Panel de Administrador
      </Typography>

      <Grid container spacing={2}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
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
                    sx={{ fontWeight: 400, color: '#202124', fontSize: '2rem', mb: 0.5 }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5f6368', fontSize: '0.875rem' }}>
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
    </Layout>
  );
}
