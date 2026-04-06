export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  STUDENT = 'student'
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isAuthorized: boolean;
}

export interface Student {
  id: string;
  userId: string;
  cedula: string;
  carrera: string;
  semestre: number;
  categoriaSisben: string;
  archivoSisben: string;
  direccion?: string;
  barrio: string;
  telefono: string;
  trabaja: boolean;
  etnia: string;
  desplazado: boolean;
  trabajadorUniversitario: boolean;
  diasComedor: string[];
  qrCode?: string;
  isValidatedSisben: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  mealsIncluded: number;
  mealsUsed: number;
  isVerified: boolean;
  createdAt: string;
}

export interface MealAttendance {
  id: string;
  studentId: string;
  supervisorId: string;
  date: string;
  hora: string;
  student?: Student;
  supervisor?: User;
}

export interface Rating {
  id: string;
  studentId: string;
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  studentId?: string;
  type: 'queja' | 'sugerencia' | 'comentario';
  content: string;
  isAnonymous: boolean;
  response?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
