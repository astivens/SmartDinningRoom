import { useMemo, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { complaintService } from '../api/servicesApi';

type AssistantType = 'queja' | 'sugerencia' | 'comentario';

export default function VirtualAssistant() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AssistantType>('queja');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const assistantCopy = useMemo(() => {
    if (type === 'queja') return 'Cuentame que problema encontraste para ayudarte a reportarlo.';
    if (type === 'sugerencia') return 'Comparte tu idea para mejorar el servicio del comedor.';
    return 'Puedes dejar un comentario rapido sobre tu experiencia.';
  }, [type]);

  const handleSend = async () => {
    if (!message.trim()) {
      setStatus({ kind: 'error', text: 'Escribe tu mensaje antes de enviarlo.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await complaintService.createComplaint({ type, content: message.trim(), isAnonymous });
      setStatus({ kind: 'success', text: 'Tu mensaje fue enviado correctamente.' });
      setMessage('');
    } catch (error: any) {
      setStatus({ kind: 'error', text: error.response?.data?.message ?? 'No se pudo enviar el mensaje.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="Asistente virtual"
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        <ChatIcon />
      </Fab>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Asistente virtual</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Te ayudo a registrar una queja, sugerencia o comentario.
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de mensaje</InputLabel>
            <Select label="Tipo de mensaje" value={type} onChange={(e) => setType(e.target.value as AssistantType)}>
              <MenuItem value="queja">Queja</MenuItem>
              <MenuItem value="sugerencia">Sugerencia</MenuItem>
              <MenuItem value="comentario">Comentario</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ mb: 1 }}>{assistantCopy}</Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe aqui tu mensaje..."
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button variant={isAnonymous ? 'contained' : 'outlined'} onClick={() => setIsAnonymous(true)}>Enviar anonimo</Button>
            <Button variant={!isAnonymous ? 'contained' : 'outlined'} onClick={() => setIsAnonymous(false)}>Enviar con mis datos</Button>
          </Box>
          {status && (
            <Alert severity={status.kind} sx={{ mt: 2 }}>
              {status.text}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
          <Button variant="contained" onClick={handleSend} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
