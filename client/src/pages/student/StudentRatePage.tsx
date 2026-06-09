import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Rating,
  TextField,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import Layout from '../../components/layout/Layout';
import { ratingService } from '../../api/servicesApi';
import DataSectionCard from '../../components/DataSectionCard';

export default function StudentRatePage() {
  const [rating, setRating] = useState<number | null>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [averageRating, setAverageRating] = useState<any>(null);

  const loadAverageRating = async () => {
    try {
      const data = await ratingService.getAverageRating();
      setAverageRating(data);
    } catch (error) {
      console.error('Error loading average rating:', error);
    }
  };

  useEffect(() => {
    loadAverageRating();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setMessage({ type: 'error', text: 'Por favor selecciona una calificación' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await ratingService.createRating({ stars: rating, comment });
      setMessage({ type: 'success', text: '¡Gracias! Tu calificación ha sido registrada' });
      setRating(0);
      setComment('');
      await loadAverageRating();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error al enviar calificación' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Calificar Servicio
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DataSectionCard title="Tu Calificación">

            {message.text && (
              <Alert severity={message.type as any} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>Calificación:</Typography>
                <Rating
                  value={rating}
                  onChange={(event, newValue) => setRating(newValue)}
                  size="large"
                  icon={<StarIcon fontSize="inherit" />}
                  emptyIcon={<StarIcon fontSize="inherit" />}
                />
              </Box>

              <TextField
                label="Comentario (opcional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                multiline
                rows={4}
                fullWidth
                margin="normal"
                placeholder="¿Qué te pareció el servicio?"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !rating}
                sx={{ mt: 2 }}
              >
                {loading ? 'Enviando...' : 'Enviar Calificación'}
              </Button>
            </form>
          </DataSectionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <DataSectionCard title="Calificación Promedio">
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h2" color="primary" fontWeight={700}>
                  {averageRating?.averageRating || '0.0'}
                </Typography>
                <Typography variant="h4" color="text.secondary" sx={{ ml: 1 }}>/5</Typography>
              </Box>
              <Rating
                value={averageRating?.averageRating || 0}
                readOnly
                precision={0.1}
                icon={<StarIcon fontSize="inherit" />}
                emptyIcon={<StarIcon fontSize="inherit" />}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Basado en {averageRating?.totalRatings || 0} calificaciones
              </Typography>
            </Box>

            {averageRating?.starsDistribution && (
              <Box sx={{ mt: 3 }}>
                {[5, 4, 3, 2, 1].map((star) => (
                  <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ width: 20 }}>{star}</Typography>
                    <StarIcon sx={{ fontSize: 16, mr: 1, color: 'warning.main' }} />
                    <Box
                      sx={{
                        flexGrow: 1,
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${(averageRating.starsDistribution[star] / averageRating.totalRatings) * 100}%`,
                          bgcolor: 'warning.main',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ ml: 1, width: 30 }}>
                      {averageRating.starsDistribution[star]}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </DataSectionCard>
        </Grid>
      </Grid>
    </Layout>
  );
}
