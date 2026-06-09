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
import FileUploadField from '../../components/FileUploadField';
import DataSectionCard from '../../components/DataSectionCard';
import FeedbackState from '../../components/FeedbackState';

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
      setError(err.response?.data?.message ?? 'Error al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Typography variant="h4" gutterBottom>
        Cargar Base de Datos - Excel
      </Typography>

      <DataSectionCard sx={{ mb: 3 }}>
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

        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 300, flex: 1 }}>
            <FileUploadField
              label="Archivo Excel (.xlsx/.xls)"
              buttonLabel="Seleccionar archivo"
              file={file}
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              onClear={() => setFile(null)}
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || loading}
            startIcon={<CloudUploadIcon />}
          >
            {loading ? 'Importando...' : 'Importar'}
          </Button>
        </Box>

        {error ? (
          <Box sx={{ mt: 2 }}>
            <FeedbackState type="error" title="No se pudo importar el archivo" description={error} />
          </Box>
        ) : null}

        {result && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Importación completada: {result.created} creados, {result.updated} actualizados
          </Alert>
        )}
      </DataSectionCard>

      {result?.errors && result.errors.length > 0 && (
        <DataSectionCard title="Errores de importación">
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
        </DataSectionCard>
      )}
    </Layout>
  );
}
