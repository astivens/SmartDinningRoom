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

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const isVerified = filter === 'verified' ? true : filter === 'pending' ? false : undefined;
      const data = await paymentService.getPayments(undefined, isVerified, 1, 50);
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error:', error);
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

      <Paper sx={{ p: 2, mb: 3 }}>
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
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Estudiante</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Almuerzos</TableCell>
              <TableCell>Usados</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
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
