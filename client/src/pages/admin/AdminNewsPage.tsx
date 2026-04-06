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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Tooltip,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Layout from '../../components/layout/Layout';
import { newsService } from '../../api/servicesApi';

const emptyForm = { title: '', content: '', imageUrl: '' };

export default function AdminNewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editNews, setEditNews] = useState<any>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchNews = async () => {
    try {
      const data = await newsService.getNews();
      setNews(data ?? []);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreate = () => {
    setEditNews(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditNews(item);
    setFormData({ title: item.title ?? '', content: item.content ?? '', imageUrl: item.imageUrl ?? '' });
    setFormError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditNews(null);
    setFormData({ ...emptyForm });
    setFormError('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setFormError('El título y el contenido son obligatorios');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      if (editNews) {
        await newsService.updateNews(editNews.id, formData);
      } else {
        await newsService.createNews(formData);
      }
      await fetchNews();
      handleClose();
    } catch (error: any) {
      setFormError(error.response?.data?.message ?? 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta noticia?')) {
      try {
        await newsService.deleteNews(id);
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
      }
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Noticias</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nueva Noticia
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Contenido (preview)</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay noticias publicadas
                </TableCell>
              </TableRow>
            ) : (
              news.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{item.title}</TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography variant="body2" noWrap title={item.content}>{item.content}</Typography>
                  </TableCell>
                  <TableCell>
                    {item.imageUrl ? (
                      <Chip label="Con imagen" color="info" size="small" />
                    ) : (
                      <Chip label="Sin imagen" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={item.isActive ? 'Activa' : 'Inactiva'} color={item.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString('es-CO')}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenEdit(item)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton onClick={() => handleDelete(item.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editNews ? 'Editar Noticia' : 'Nueva Noticia'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mt: 1, mb: 1 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Título"
                name="title"
                value={formData.title}
                onChange={handleChange}
                fullWidth
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Contenido"
                name="content"
                value={formData.content}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={5}
                placeholder="Escribe el contenido de la noticia..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="URL de imagen (opcional)"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                fullWidth
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : editNews ? 'Actualizar' : 'Publicar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
