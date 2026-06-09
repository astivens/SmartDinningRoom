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
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Switch,
  Autocomplete,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Layout from '../../components/layout/Layout';
import { supervisorService } from '../../api/supervisorApi';
import { studentService } from '../../api/studentApi';
import FeedbackState from '../../components/FeedbackState';

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editSupervisor, setEditSupervisor] = useState<any>(null);
  const [formData, setFormData] = useState({ email: '', name: '', lastName: '', telefono: '' });
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Estado para asignación de estudiantes
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSupervisor, setAssignSupervisor] = useState<any>(null);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [assignError, setAssignError] = useState('');
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [tableError, setTableError] = useState('');

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const fetchSupervisors = async () => {
    setLoadingSupervisors(true);
    setTableError('');
    try {
      const data = await supervisorService.getSupervisors();
      setSupervisors(data);
    } catch (error: any) {
      console.error('Error:', error);
      setTableError(error.response?.data?.message ?? 'No se pudo cargar la lista de supervisores.');
    } finally {
      setLoadingSupervisors(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editSupervisor) {
        await supervisorService.updateSupervisor(editSupervisor.id, formData);
      } else {
        await supervisorService.createSupervisor(formData);
      }
      fetchSupervisors();
      setOpen(false);
      setFormData({ email: '', name: '', lastName: '', telefono: '' });
      setEditSupervisor(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean, isAuthorized: boolean) => {
    try {
      await supervisorService.toggleSupervisorStatus(id, !isActive, isAuthorized);
      fetchSupervisors();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const data = await supervisorService.generateInviteLink();
      setInviteUrl(data.inviteUrl);
      setInviteCopied(false);
      setInviteOpen(true);
    } catch (error) {
      console.error('Error generating invite:', error);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este supervisor?')) {
      try {
        await supervisorService.deleteSupervisor(id);
        fetchSupervisors();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleOpenAssign = async (supervisor: any) => {
    setAssignSupervisor(supervisor);
    setAssignError('');
    setSelectedStudent(null);
    try {
      const [assigned, studentsData] = await Promise.all([
        supervisorService.getSupervisorStudents(supervisor.id),
        studentService.getStudents('', 1, 200)
      ]);
      setAssignedStudents(assigned);
      setAllStudents(studentsData.students ?? []);
    } catch (err) {
      console.error('Error loading assignment data:', err);
    }
    setAssignOpen(true);
  };

  const handleAssignStudent = async () => {
    if (!selectedStudent || !assignSupervisor) return;
    setAssignError('');
    try {
      const studentRecord = (selectedStudent as any).student;
      await supervisorService.assignStudent(assignSupervisor.id, studentRecord.id);
      const updated = await supervisorService.getSupervisorStudents(assignSupervisor.id);
      setAssignedStudents(updated);
      setSelectedStudent(null);
    } catch (err: any) {
      setAssignError(err.response?.data?.message ?? 'Error al asignar');
    }
  };

  const handleRemoveAssignment = async (studentId: string) => {
    try {
      await supervisorService.removeStudentAssignment(assignSupervisor.id, studentId);
      const updated = await supervisorService.getSupervisorStudents(assignSupervisor.id);
      setAssignedStudents(updated);
    } catch (err) {
      console.error('Error removing assignment:', err);
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Supervisores</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<LinkIcon />} onClick={handleGenerateInvite}>
            Enlace de Invitación
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditSupervisor(null);
              setFormData({ email: '', name: '', lastName: '', telefono: '' });
              setOpen(true);
            }}
          >
            Agregar Supervisor
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Activo</TableCell>
              <TableCell>Autorizado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingSupervisors ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <FeedbackState type="loading" compact description="Cargando supervisores..." />
                </TableCell>
              </TableRow>
            ) : null}
            {!loadingSupervisors && tableError ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <FeedbackState
                    type="error"
                    title="No se pudo cargar la tabla"
                    description={tableError}
                    actionLabel="Reintentar"
                    onAction={fetchSupervisors}
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!loadingSupervisors && !tableError && supervisors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <FeedbackState
                    type="empty"
                    title="No hay supervisores registrados"
                    description="Puedes crear un supervisor o generar un enlace de invitación."
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!loadingSupervisors && !tableError && supervisors.map((sup) => (
              <TableRow key={sup.id}>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{sup.uid}</Typography>
                </TableCell>
                <TableCell>{sup.name}</TableCell>
                <TableCell>{sup.lastName}</TableCell>
                <TableCell>{sup.email}</TableCell>
                <TableCell>{sup.telefono ?? '—'}</TableCell>
                <TableCell>
                  <Switch
                    checked={sup.isActive}
                    onChange={() => handleToggleStatus(sup.id, sup.isActive, sup.isAuthorized)}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={sup.isAuthorized ? 'Autorizado' : 'Pendiente'}
                    color={sup.isAuthorized ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton title="Asignar estudiantes" onClick={() => handleOpenAssign(sup)}>
                    <PersonAddIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setEditSupervisor(sup);
                      setFormData({
                        email: sup.email ?? '',
                        name: sup.name ?? '',
                        lastName: sup.lastName ?? '',
                        telefono: sup.telefono ?? ''
                      });
                      setOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(sup.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => { setOpen(false); setEditSupervisor(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editSupervisor ? 'Editar Supervisor' : 'Nuevo Supervisor'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                fullWidth
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Teléfono"
                fullWidth
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false); setEditSupervisor(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editSupervisor ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Dialog asignación de estudiantes */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Asignar estudiantes — {assignSupervisor?.name} {assignSupervisor?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Selecciona un estudiante registrado para asignarlo a este supervisor.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Autocomplete
                options={allStudents}
                getOptionLabel={(opt: any) => `${opt.name} ${opt.lastName} — ${opt.student?.cedula ?? ''}`}
                value={selectedStudent}
                onChange={(_, val) => setSelectedStudent(val)}
                renderInput={(params) => <TextField {...params} label="Buscar estudiante" size="small" />}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" onClick={handleAssignStudent} disabled={!selectedStudent}>
                Asignar
              </Button>
            </Box>
            {assignError && <Alert severity="error" sx={{ mb: 1 }}>{assignError}</Alert>}
            <Divider sx={{ mb: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Estudiantes asignados ({assignedStudents.length})</Typography>
            {assignedStudents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin asignaciones aún.</Typography>
            ) : (
              <List dense>
                {assignedStudents.map((a: any) => (
                  <ListItem key={a.id} divider>
                    <ListItemText
                      primary={`${a.student?.user?.name} ${a.student?.user?.lastName}`}
                      secondary={`Cédula: ${a.student?.cedula ?? '—'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" color="error" onClick={() => handleRemoveAssignment(a.studentId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog enlace de invitación */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enlace de Invitación para Supervisor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Comparte este enlace con el supervisor. Expira en 48 horas. El supervisor deberá completar su registro y luego tú deberás autorizarlo.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontFamily: 'monospace' }}>
              {inviteUrl}
            </Typography>
            <IconButton onClick={handleCopyInvite} color={inviteCopied ? 'success' : 'default'}>
              <ContentCopyIcon />
            </IconButton>
          </Box>
          {inviteCopied && (
            <Typography variant="caption" color="success.main" sx={{ mt: 1, display: 'block' }}>
              ¡Enlace copiado al portapapeles!
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
