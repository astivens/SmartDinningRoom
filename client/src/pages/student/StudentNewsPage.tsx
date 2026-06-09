import { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import Layout from '../../components/layout/Layout';
import { newsService } from '../../api/servicesApi';
import { News } from '../../types';
import FeedbackState from '../../components/FeedbackState';

export default function StudentNewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await newsService.getNews();
        setNews(data);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.response?.data?.message ?? 'No se pudieron cargar las noticias.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Noticias del Comedor
      </Typography>

      {loading ? (
        <FeedbackState type="loading" description="Cargando noticias..." />
      ) : error ? (
        <FeedbackState type="error" title="Error al cargar noticias" description={error} />
      ) : news.length === 0 ? (
        <FeedbackState
          type="empty"
          title="No hay noticias disponibles"
          description="No hay noticias disponibles en este momento."
        />
      ) : (
        <Grid container spacing={3}>
          {news.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card sx={{ height: '100%' }}>
                {item.imageUrl && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={item.imageUrl}
                    alt={item.title}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  );
}
