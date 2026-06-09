import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../auth/AuthProvider';
import { paymentService } from '../../api/servicesApi';
import FeedbackState from '../../components/FeedbackState';
import DataSectionCard from '../../components/DataSectionCard';

const MEAL_PRICE = 2000;

export default function StudentPaymentPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const mealsIncluded = amount ? Math.floor(parseInt(amount) / MEAL_PRICE) : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !amount) {
      setError('Debe seleccionar un archivo y especificar el monto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('comprobante', file);
      formData.append('amount', amount);

      const data = await paymentService.uploadComprobante(formData);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Error al subir comprobante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Subir Comprobante de Pago
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <DataSectionCard>
            <Typography variant="body1" paragraph>
              Sube tu comprobante de pago para recargar almuerzos.
              <br />
              <strong>Precio por almuerzo: $2,000</strong>
            </Typography>

            {error && (
              <Box sx={{ mb: 2 }}>
                <FeedbackState type="error" title="No se pudo subir el comprobante" description={error} />
              </Box>
            )}

            {result && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Comprobante subido exitosamente. Has obtenido {result.payment.mealsIncluded} almuerzos.
                Espera a que un administrador verifique tu pago.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Monto Pagado"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Ej: 10000 = 5 almuerzos"
              />

              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ mt: 2, mb: 1, borderStyle: 'dashed' }}
              >
                Seleccionar Comprobante
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </Button>
              {file && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Archivo seleccionado: {file.name}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading || !file || !amount}
              >
                {loading ? 'Subiendo...' : 'Subir Comprobante'}
              </Button>
            </form>
          </DataSectionCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calculadora
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h3">
                  {mealsIncluded}
                </Typography>
                <Typography variant="body1">
                  almuerzos
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                Monto: ${parseInt(amount || '0', 10).toLocaleString()}
                <br />
                Restante: ${(parseInt(amount || '0', 10) % MEAL_PRICE).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Layout>
  );
}
