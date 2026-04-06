import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await studentService.importStudents(formData);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Cargar Base de Datos - Excel
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" paragraph>
          Sube un archivo Excel (.xlsx o .xls) con la información de los estudiantes.
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Columnas requeridas:</strong> email, nombre, apellido, carrera, cedula, dias
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          <strong>Notas:</strong> 
          <br />- La columna "dias" debe contener los días separados por coma (ej: Lunes,Martes,Miércoles)
          <br />- Los almuerzos se calculan: $2000 = 1 almuerzo
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Seleccionar Archivo
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </Button>
          {file && <Typography>{file.name}</Typography>}
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? 'Importando...' : 'Importar'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Importación completada: {result.created} creados, {result.updated} actualizados
          </Alert>
        )}
      </Paper>

      {result?.errors && result.errors.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Errores:
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.map((err: string, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{err}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Layout>
  );
}
