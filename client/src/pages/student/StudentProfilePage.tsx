import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../auth/AuthProvider';
import { authService } from '../../api/authApi';
import { studentService } from '../../api/studentApi';

export default function StudentProfilePage() {
  const { } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [meals, setMeals] = useState({ availableMeals: 0, totalMeals: 0, usedMeals: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { user: userData } = await authService.getProfile();
        setProfile(userData);
        if (userData.student) {
          const mealsData = await studentService.getAvailableMeals(userData.id);
          setMeals({
            availableMeals: mealsData.availableMeals,
            totalMeals: mealsData.totalMeals,
            usedMeals: mealsData.usedMeals,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información Personal
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">Nombre</Typography>
              <Typography variant="body1" gutterBottom>{profile?.name} {profile?.lastName}</Typography>
              
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body1" gutterBottom>{profile?.email}</Typography>
              
              {profile?.student && (
                <>
                  <Typography variant="body2" color="text.secondary">Cédula</Typography>
                  <Typography variant="body1" gutterBottom>{profile.student.cedula}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Carrera</Typography>
                  <Typography variant="body1" gutterBottom>{profile.student.carrera}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Semestre</Typography>
                  <Typography variant="body1" gutterBottom>{profile.student.semestre}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Teléfono</Typography>
                  <Typography variant="body1" gutterBottom>{profile.student.telefono}</Typography>
                  
                  <Typography variant="body2" color="text.secondary">Barrio</Typography>
                  <Typography variant="body1" gutterBottom>{profile.student.barrio}</Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Almuerzos Disponibles
              </Typography>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" color="primary" fontWeight={700}>
                  {meals.availableMeals}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  almuerzos disponibles
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{meals.totalMeals}</Typography>
                  <Typography variant="caption">Total</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{meals.usedMeals}</Typography>
                  <Typography variant="caption">Usados</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{meals.availableMeals}</Typography>
                  <Typography variant="caption">Disponibles</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Días Autorizados
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {profile?.student?.diasComedor?.map((day: string) => (
                <Chip key={day} label={day} color="primary" />
              )) || <Typography variant="body2">No hay días autorizados</Typography>}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Layout>
  );
}
