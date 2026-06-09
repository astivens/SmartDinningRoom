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
  FormGroup,
  FormControlLabel,
  Checkbox,
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
import FeedbackState from '../../components/FeedbackState';
import DataSectionCard from '../../components/DataSectionCard';

export default function ReportsPage() {
  const exportColumns = [
    { key: 'fullName', label: 'Nombre Completo' },
    { key: 'email', label: 'Email' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'carrera', label: 'Carrera' },
    { key: 'semestre', label: 'Semestre' },
    { key: 'barrio', label: 'Barrio' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'sisbenCategory', label: 'Categoría SISBEN' },
    { key: 'sisbenStatus', label: 'SISBEN' },
    { key: 'status', label: 'Estado' },
    { key: 'diasComedor', label: 'Días Comedor' },
    { key: 'cycle', label: 'Ciclo' },
  ] as const;

  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    exportColumns.map((column) => column.key)
  );
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const mapStudentForExport = (u: any) => ({
    fullName: `${u.name} ${u.lastName}`,
    email: u.email,
    cedula: u.student?.cedula ?? '',
    carrera: u.student?.carrera ?? '',
    semestre: u.student?.semestre ?? '',
    barrio: u.student?.barrio ?? '',
    telefono: u.student?.telefono ?? '',
    sisbenCategory: u.student?.categoriaSisben ?? '',
    sisbenStatus: u.student?.isValidatedSisben ? 'Validado' : 'Sin validar',
    status: u.isActive ? 'Activo' : 'Inactivo',
    diasComedor: (u.student?.diasComedor ?? []).join(', '),
    cycle: u.student?.currentCycle ?? '',
  });

  const buildSelectedExportRows = () => students.map((u: any) => {
    const base = mapStudentForExport(u);
    const row: Record<string, string> = {};
    exportColumns.forEach((column) => {
      if (selectedColumns.includes(column.key)) {
        row[column.label] = String(base[column.key as keyof typeof base] ?? '');
      }
    });
    return row;
  });

  const fetchStudents = async () => {
    setLoading(true);
    setReportError('');
    try {
      const data = await studentService.getStudents(search, page, 50, true);
      setStudents(data.students ?? []);
      setTotal(data.total ?? 0);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      setReportError(error.response?.data?.message ?? 'No se pudieron cargar los datos de reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const exportData = buildSelectedExportRows();

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');
    XLSX.writeFile(workbook, `reporte_estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCSV = () => {
    const exportData = buildSelectedExportRows();

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
      ...selectedColumns.map((key) => {
        const mapped = mapStudentForExport(u);
        return String(mapped[key as keyof ReturnType<typeof mapStudentForExport>] ?? '');
      })
    ]);

    autoTable(doc, {
      startY: 33,
      head: [exportColumns.filter((column) => selectedColumns.includes(column.key)).map((column) => column.label)],
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
          <DataSectionCard sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="primary" fontWeight={700}>{total}</Typography>
            <Typography variant="body2" color="text.secondary">Total Estudiantes</Typography>
          </DataSectionCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <DataSectionCard sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight={700}>
              {students.filter((u) => u.isActive).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">Estudiantes Activos</Typography>
          </DataSectionCard>
        </Grid>
        <Grid item xs={12} sm={4}>
          <DataSectionCard sx={{ textAlign: 'center' }}>
            <Typography variant="h3" color="warning.main" fontWeight={700}>
              {students.filter((u) => u.student?.isValidatedSisben).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">SISBEN Validados</Typography>
          </DataSectionCard>
        </Grid>
      </Grid>

      {reportError ? (
        <Box sx={{ mb: 2 }}>
          <FeedbackState
            type="error"
            title="Error al generar vista de reportes"
            description={reportError}
            actionLabel="Reintentar"
            onAction={fetchStudents}
          />
        </Box>
      ) : null}

      <DataSectionCard sx={{ mb: 2 }} className="no-print">
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Columnas a exportar
        </Typography>
        <FormGroup row sx={{ mb: 2 }}>
          {exportColumns.map((column) => (
            <FormControlLabel
              key={column.key}
              control={
                <Checkbox
                  checked={selectedColumns.includes(column.key)}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedColumns((prev) => [...prev, column.key]);
                      return;
                    }
                    setSelectedColumns((prev) => prev.filter((currentColumn) => currentColumn !== column.key));
                  }}
                />
              }
              label={column.label}
            />
          ))}
        </FormGroup>
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
      </DataSectionCard>

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
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <FeedbackState type="loading" compact description="Cargando reporte de estudiantes..." />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && !reportError && students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <FeedbackState
                    type="empty"
                    title="No hay datos para este reporte"
                    description="Ajusta la búsqueda o elimina filtros para visualizar registros."
                  />
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && !reportError && students.map((u: any) => (
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
