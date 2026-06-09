import { useEffect, useState } from 'react';
import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import Layout from '../../components/layout/Layout';
import { supervisorService } from '../../api/supervisorApi';

export default function SupervisorActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await supervisorService.getSupervisorLogs(1, 100);
        setLogs(data.logs ?? []);
      } catch (error) {
        console.error('Error loading supervisor activity logs:', error);
      }
    };
    fetchLogs();
  }, []);

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>Actividad de supervisores</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Supervisor</TableCell>
              <TableCell>Estudiante atendido</TableCell>
              <TableCell>Cedula</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Accion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.supervisor?.name} {log.supervisor?.lastName}</TableCell>
                <TableCell>{log.student?.user?.name} {log.student?.user?.lastName}</TableCell>
                <TableCell>{log.student?.cedula ?? '-'}</TableCell>
                <TableCell>{log.hora}</TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleDateString('es-CO')}</TableCell>
                <TableCell><Chip size="small" color="primary" label={log.action} /></TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Box sx={{ py: 2, textAlign: 'center' }}>No hay actividad registrada.</Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Layout>
  );
}
