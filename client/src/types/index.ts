export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  STUDENT = 'student',
  EXTERNAL_AUDITOR = 'external_auditor'
}

export interface User {
  id: string;
  uid?: string;
  email: string;
  name: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isAuthorized: boolean;
  telefono?: string;
}

export interface Student {
  id: string;
  uid?: string;
  userId: string;
  cedula: string;
  carrera: string;
  semestre: number;
  categoriaSisben: string;
  archivoSisben: string;
  cedulaFrontalPath?: string;
  horarioPdfPath?: string;
  direccion?: string;
  barrio: string;
  telefono: string;
  trabaja: boolean;
  trabajaEstudia?: boolean;
  estudiaSolo?: boolean;
  etnia: string;
  desplazado: boolean;
  trabajadorUniversitario: boolean;
  diasComedor: string[];
  qrCode?: string;
  isValidatedSisben: boolean;
  sisbenAutoValidated?: boolean;
  sisbenValidationDetails?: {
    validated: boolean;
    mismatches: Record<string, boolean>;
  };
  currentCycle?: string;
  cycleRevalidationDueAt?: string;
  cycleDisabledAt?: string;
}

export interface Payment {
  id: string;
  uid?: string;
  studentId: string;
  amount: number;
  mealsIncluded: number;
  mealsUsed: number;
  comprobantePath?: string;
  universityReceiptPath?: string;
  bankReceiptPath?: string;
  isVerified: boolean;
  verifiedAt?: string;
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
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
  sisbenValidation?: {
    validated: boolean;
    mismatches: Record<string, boolean>;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface DashboardTotals {
  totalStudents: number;
  totalAttendancesInRange: number;
  totalRevenueInRange: number;
  remainingMeals: number;
  activeStudents: number;
  averageDailyAttendances: number;
  averageRatingInRange: number;
  totalRatingsInRange: number;
}

export interface DashboardAnalyticsCharts {
  attendanceTrend: Array<{ date: string; count: number }>;
  attendanceByCareer: Array<{ career: string; count: number }>;
  sisbenDistribution: Array<{ label: string; count: number }>;
  studentsBySemester: Array<{ semester: number; count: number }>;
  ratingsDistribution: Array<{ stars: number; count: number }>;
}

export interface DashboardAnalyticsResponse {
  rangeDays: number;
  totals: DashboardTotals;
  charts: DashboardAnalyticsCharts;
}
