import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import Layout from '../../components/layout/Layout';
import { complaintService } from '../../api/servicesApi';
import DataSectionCard from '../../components/DataSectionCard';

export default function StudentComplaintPage() {
  const [formData, setFormData] = useState({
    type: 'queja',
    content: '',
    isAnonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content) {
      setMessage({ type: 'error', text: 'Por favor escribe tu mensaje' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await complaintService.createComplaint(formData);
      setMessage({ type: 'success', text: 'Tu mensaje ha sido enviado. Gracias por tus comentarios.' });
      setFormData({ type: 'queja', content: '', isAnonymous: false });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message ?? 'Error al enviar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Quejas y Sugerencias
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DataSectionCard>
            <Typography variant="body1" paragraph>
              Tu opinión es importante para nosotros. Cuéntanos tus sugerencias o reporta cualquier problema.
            </Typography>

            {message.text && (
              <Alert severity={message.type as any} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <MenuItem value="queja">Queja</MenuItem>
                  <MenuItem value="sugerencia">Sugerencia</MenuItem>
                  <MenuItem value="comentario">Comentario</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Mensaje"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                multiline
                rows={6}
                fullWidth
                margin="normal"
                placeholder="Escribe tu mensaje aquí..."
                required
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  />
                }
                label="Enviar de forma anónima"
                sx={{ mt: 1 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !formData.content}
                sx={{ mt: 2 }}
              >
                {loading ? 'Enviando...' : 'Enviar Mensaje'}
              </Button>
            </form>
          </DataSectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <DataSectionCard sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Contacto
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Si tienes alguna urgencia, también puedes comunicarte directamente con nosotros:
            </Typography>
            <Typography variant="body2">
              <strong>Teléfono:</strong> (057) 123-4567
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> comedor@university.edu
            </Typography>
            <Typography variant="body2">
              <strong>Horario:</strong> Lun-Vie 7am - 5pm
            </Typography>
          </DataSectionCard>
        </Grid>
      </Grid>
    </Layout>
  );
}
