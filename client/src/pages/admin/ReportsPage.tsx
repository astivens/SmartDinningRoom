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
  Grid,
  TextField,
  InputAdornment,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SearchIcon from '@mui/icons-material/Search';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Layout from '../../components/layout/Layout';
import { studentService } from '../../api/studentApi';

export default function ReportsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchStudents = async () => {
    try {
      const data = await studentService.getStudents(search, page, 50);
      setStudents(data.students ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const exportData = students.map((u: any) => ({
      Nombre: u.name,
      Apellido: u.lastName,
      Email: u.email,
      Cédula: u.student?.cedula ?? '',
      Carrera: u.student?.carrera ?? '',
      Semestre: u.student?.semestre ?? '',
      Barrio: u.student?.barrio ?? '',
      Teléfono: u.student?.telefono ?? '',
      'Categoría SISBEN': u.student?.categoriaSisben ?? '',
      'SISBEN Validado': u.student?.isValidatedSisben ? 'Sí' : 'No',
      Estado: u.isActive ? 'Activo' : 'Inactivo',
      'Días Comedor': (u.student?.diasComedor ?? []).join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');
    XLSX.writeFile(workbook, `reporte_estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCSV = () => {
    const exportData = students.map((u: any) => ({
      Nombre: u.name,
      Apellido: u.lastName,
      Email: u.email,
      Cédula: u.student?.cedula ?? '',
      Carrera: u.student?.carrera ?? '',
      Semestre: u.student?.semestre ?? '',
      Estado: u.isActive ? 'Activo' : 'Inactivo',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_estudiantes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.text('Reporte de Estudiantes - SmartComedor', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 22);
    doc.text(`Total: ${total} estudiantes`, 14, 28);

    const rows = students.map((u: any) => [
      `${u.name} ${u.lastName}`,
      u.student?.cedula ?? '',
      u.student?.carrera ?? '',
      u.student?.semestre ?? '',
      u.student?.categoriaSisben ?? '',
      u.student?.isValidatedSisben ? 'Validado' : 'Sin validar',
      u.isActive ? 'Activo' : 'Inactivo',
      (u.student?.diasComedor ?? []).join(', '),
    ]);

    autoTable(doc, {
      startY: 33,
      head: [['Nombre Completo', 'Cédula', 'Carrera', 'Semestre', 'SISBEN Cat.', 'SISBEN', 'Estado', 'Días Comedor']],
      body: rows,
      headStyles: { fillColor: [25, 118, 210] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 8 },
    });

    doc.save(`reporte_estudiantes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reportes</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} className="no-print">
            Imprimir
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel} className="no-print">
            Excel
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV} className="no-print">
            CSV
          </Button>
          <Button variant="contained" color="error" startIcon={<PictureAsPdfIcon />} onClick={handleExportPDF} className="no-print">
            PDF
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="primary" fontWeight={700}>{total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Estudiantes</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight={700}>
              {students.filter((u) => u.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Estudiantes Activos</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" fontWeight={700}>
              {students.filter((u) => u.student?.isValidatedSisben).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">SISBEN Validados</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }} className="no-print">
        <TextField
          placeholder="Buscar por nombre, apellido, cédula o carrera..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nombre Completo</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Carrera</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>SISBEN</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Días Comedor</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>{u.name} {u.lastName}</TableCell>
                <TableCell>{u.student?.cedula}</TableCell>
                <TableCell>{u.student?.carrera}</TableCell>
                <TableCell>{u.student?.semestre}</TableCell>
                <TableCell>
                  <Chip
                    label={u.student?.isValidatedSisben ? 'Validado' : 'Sin validar'}
                    color={u.student?.isValidatedSisben ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip label={u.isActive ? 'Activo' : 'Inactivo'} color={u.isActive ? 'success' : 'error'} size="small" />
                </TableCell>
                <TableCell>{(u.student?.diasComedor ?? []).join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }} className="no-print">
        <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button>
        <Typography sx={{ mx: 2 }}>Página {page}</Typography>
        <Button disabled={page * 50 >= total} onClick={() => setPage(page + 1)}>Siguiente</Button>
      </Box>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </Layout>
  );
}
