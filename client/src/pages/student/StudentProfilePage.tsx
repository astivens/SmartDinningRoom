import { useState, useEffect } from 'react';
import {
  Box,
  Divider,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../auth/AuthProvider';
import { authService } from '../../api/authApi';
import { studentService } from '../../api/studentApi';
import DataSectionCard from '../../components/DataSectionCard';
import FeedbackState from '../../components/FeedbackState';

export default function StudentProfilePage() {
  const { } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [meals, setMeals] = useState({ availableMeals: 0, totalMeals: 0, usedMeals: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
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
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.response?.data?.message ?? 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Mi Perfil
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Consulta tu información personal y el estado actual de tus almuerzos.
        </Typography>
      </Box>
      {loading ? <FeedbackState type="loading" compact description="Cargando perfil..." /> : null}
      {!loading && error ? <FeedbackState type="error" title="Error al cargar perfil" description={error} /> : null}

      {!loading && !error ? (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={7}>
            <DataSectionCard
              title="Información Personal"
              subtitle="Datos de identidad y académicos registrados."
            >
              <Stack divider={<Divider flexItem />} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    NOMBRE COMPLETO
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {profile?.name} {profile?.lastName}
                  </Typography>
                </Box>
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    EMAIL
                  </Typography>
                  <Typography variant="body1">{profile?.email}</Typography>
                </Box>
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    CÉDULA
                  </Typography>
                  <Typography variant="body1">{profile?.student?.cedula ?? 'No registrada'}</Typography>
                </Box>
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    CARRERA Y SEMESTRE
                  </Typography>
                  <Typography variant="body1">
                    {profile?.student?.carrera ?? 'No registrada'} · Semestre {profile?.student?.semestre ?? 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    CONTACTO
                  </Typography>
                  <Typography variant="body1">
                    {profile?.student?.telefono ?? 'Sin teléfono'} · {profile?.student?.barrio ?? 'Sin barrio'}
                  </Typography>
                </Box>
              </Stack>
            </DataSectionCard>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Card
              sx={{
                mb: 3,
                bgcolor: 'background.paper',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Almuerzos Disponibles
                </Typography>
                <Box sx={{ textAlign: 'center', py: 2.5 }}>
                  <Typography variant="h1" sx={{ color: 'primary.dark', fontWeight: 700, lineHeight: 1 }}>
                    {meals.availableMeals}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    disponibles actualmente
                  </Typography>
                </Box>
                <Grid container spacing={1.5}>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                      <Typography variant="h6">{meals.totalMeals}</Typography>
                      <Typography variant="caption" color="text.secondary">Total</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                      <Typography variant="h6">{meals.usedMeals}</Typography>
                      <Typography variant="caption" color="text.secondary">Usados</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.default', textAlign: 'center' }}>
                      <Typography variant="h6">{meals.availableMeals}</Typography>
                      <Typography variant="caption" color="text.secondary">Disponibles</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <DataSectionCard title="Días Autorizados" subtitle="Días habilitados para uso del comedor">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mt: 0.5 }}>
                {profile?.student?.diasComedor?.length ? (
                  profile.student.diasComedor.map((day: string) => (
                    <Chip
                      key={day}
                      label={day}
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  ))
                ) : (
                  <FeedbackState
                    type="empty"
                    compact
                    title="Sin días autorizados"
                    description="No tienes días habilitados actualmente."
                  />
                )}
              </Box>
            </DataSectionCard>
          </Grid>
        </Grid>
      ) : null}
    </Layout>
  );
}
