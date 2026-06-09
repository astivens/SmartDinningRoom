export const VALID_SEMESTERS = new Set(Array.from({ length: 12 }, (_, i) => i + 1));

export const VALID_SISBEN_CATEGORIES = new Set([
  'A1', 'A2', 'A3', 'A4', 'A5',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7',
  'C1', 'C2', 'C3',
]);

export const VALID_CARRERAS = new Set([
  'Ingeniería de Sistemas',
  'Ingeniería Industrial',
  'Ingeniería Civil',
  'Ingeniería Ambiental',
  'Derecho',
  'Contaduría Pública',
  'Administración de Empresas',
  'Psicología',
  'Enfermería',
  'Medicina',
  'Licenciatura en Matemáticas',
  'Licenciatura en Lenguas',
]);
