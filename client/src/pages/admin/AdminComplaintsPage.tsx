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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
} from '@mui/material';
import ReplyIcon from '@mui/icons-material/Reply';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Layout from '../../components/layout/Layout';
import { complaintService } from '../../api/servicesApi';

const typeLabels: Record<string, string> = {
  queja: 'Queja',
  sugerencia: 'Sugerencia',
  comentario: 'Comentario',
};

const typeColors: Record<string, 'error' | 'info' | 'success'> = {
  queja: 'error',
  sugerencia: 'info',
  comentario: 'success',
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [resolvedFilter, setResolvedFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const fetchComplaints = async () => {
    try {
      const isResolved = resolvedFilter === '' ? undefined : resolvedFilter === 'true';
      const data = await complaintService.getComplaints(typeFilter || undefined, isResolved, page, 20);
      setComplaints(data.complaints ?? data ?? []);
      setTotal(data.total ?? (data.complaints ?? data ?? []).length);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, typeFilter, resolvedFilter]);

  const handleOpen = (complaint: any) => {
    setSelected(complaint);
    setResponseText(complaint.response ?? '');
    setSaveMsg('');
  };

  const handleRespond = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await complaintService.respondComplaint(selected.id, responseText);
      setSaveMsg('Respuesta guardada exitosamente');
      fetchComplaints();
    } catch (error: any) {
      setSaveMsg(error.response?.data?.message ?? 'Error al guardar la respuesta');
    } finally {
      setSaving(false);
    }
  };

  const resolvedCount = complaints.filter((c) => c.isResolved).length;
  const pendingCount = complaints.filter((c) => !c.isResolved).length;

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Quejas y Sugerencias
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="primary" fontWeight={700}>{total}</Typography>
            <Typography variant="body2" color="text.secondary">Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" fontWeight={700}>{pendingCount}</Typography>
            <Typography variant="body2" color="text.secondary">Pendientes</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight={700}>{resolvedCount}</Typography>
            <Typography variant="body2" color="text.secondary">Resueltas</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={typeFilter} label="Tipo" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="queja">Quejas</MenuItem>
                <MenuItem value="sugerencia">Sugerencias</MenuItem>
                <MenuItem value="comentario">Comentarios</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={resolvedFilter} label="Estado" onChange={(e) => setResolvedFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="false">Pendiente</MenuItem>
                <MenuItem value="true">Resuelto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Contenido</TableCell>
              <TableCell>Anónimo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay registros
                </TableCell>
              </TableRow>
            ) : (
              complaints.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Chip label={typeLabels[c.type] ?? c.type} color={typeColors[c.type] ?? 'default'} size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Typography variant="body2" noWrap title={c.content}>{c.content}</Typography>
                  </TableCell>
                  <TableCell>{c.isAnonymous ? 'Sí' : 'No'}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.isResolved ? 'Resuelto' : 'Pendiente'}
                      color={c.isResolved ? 'success' : 'warning'}
                      size="small"
                      icon={c.isResolved ? <CheckCircleIcon /> : undefined}
                    />
                  </TableCell>
                  <TableCell>{new Date(c.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  <TableCell>
                    <Button size="small" startIcon={<ReplyIcon />} onClick={() => handleOpen(c)}>
                      {c.isResolved ? 'Ver' : 'Responder'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
        <Typography sx={{ mx: 2 }}>Página {page}</Typography>
        <Button disabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Siguiente</Button>
      </Box>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              {typeLabels[selected.type] ?? selected.type}
              {' '}
              <Chip label={selected.isAnonymous ? 'Anónimo' : 'Identificado'} size="small" sx={{ ml: 1 }} />
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Contenido:</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1">{selected.content}</Typography>
              </Paper>

              {saveMsg && (
                <Alert severity={saveMsg.includes('exitosamente') ? 'success' : 'error'} sx={{ mb: 2 }}>
                  {saveMsg}
                </Alert>
              )}

              <TextField
                label="Respuesta"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Escribe la respuesta al estudiante..."
                disabled={selected.isResolved}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelected(null)}>Cerrar</Button>
              {!selected.isResolved && (
                <Button
                  variant="contained"
                  startIcon={<ReplyIcon />}
                  onClick={handleRespond}
                  disabled={saving || !responseText.trim()}
                >
                  {saving ? 'Guardando...' : 'Enviar Respuesta'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  );
}
