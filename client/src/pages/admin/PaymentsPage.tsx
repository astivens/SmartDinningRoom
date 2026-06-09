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
  Button,
  Chip,
  TextField,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import Layout from '../../components/layout/Layout';
import { paymentService } from '../../api/servicesApi';
import DataSectionCard from '../../components/DataSectionCard';
import FeedbackState from '../../components/FeedbackState';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [loading, setLoading] = useState(false);
  const [tableError, setTableError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    setLoading(true);
    setTableError('');
    try {
      const isVerified = filter === 'verified' ? true : filter === 'pending' ? false : undefined;
      const data = await paymentService.getPayments(undefined, isVerified, 1, 50);
      setPayments(data.payments ?? []);
    } catch (error: any) {
      console.error('Error:', error);
      setTableError(error.response?.data?.message ?? 'No se pudo cargar la lista de pagos.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await paymentService.verifyPayment(id);
      fetchPayments();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Gestión de Pagos
      </Typography>

      <DataSectionCard sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'pending' ? 'contained' : 'outlined'}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </Button>
          <Button
            variant={filter === 'verified' ? 'contained' : 'outlined'}
            onClick={() => setFilter('verified')}
          >
            Verificados
          </Button>
        </Box>
      </DataSectionCard>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Estudiante</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Almuerzos</TableCell>
              <TableCell>Usados</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Adjuntos</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <FeedbackState type="loading" compact description="Cargando pagos..." />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && tableError ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <FeedbackState
                    type="error"
                    title="No se pudo cargar la tabla"
                    description={tableError}
                    actionLabel="Reintentar"
                    onAction={fetchPayments}
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && !tableError && payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <FeedbackState
                    type="empty"
                    title="No hay pagos para este filtro"
                    description="Ajusta el filtro para visualizar otros registros."
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && !tableError && payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{payment.uid}</Typography>
                </TableCell>
                <TableCell>{payment.student?.user?.name} {payment.student?.user?.lastName}</TableCell>
                <TableCell>{payment.student?.cedula}</TableCell>
                <TableCell>${payment.amount?.toLocaleString()}</TableCell>
                <TableCell>{payment.mealsIncluded}</TableCell>
                <TableCell>{payment.mealsUsed}</TableCell>
                <TableCell>
                  <Chip
                    label={payment.isVerified ? 'Verificado' : 'Pendiente'}
                    color={payment.isVerified ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" display="block">
                    Univ: {payment.universityReceiptPath ? payment.universityReceiptPath.split('/').pop() : 'No adjunto'}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Banco: {(payment.bankReceiptPath || payment.comprobantePath) ? (payment.bankReceiptPath || payment.comprobantePath).split('/').pop() : 'No adjunto'}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {!payment.isVerified && (
                    <Button
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleVerify(payment.id)}
                    >
                      Verificar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}
