import { Routes, Route, Navigate } from 'react-router-dom';
import { UserRole } from './types';
import ProtectedRoute from './auth/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminStudentsPage from './pages/admin/StudentsPage';
import AdminCyclesPage from './pages/admin/CyclesPage';
import AdminSupervisorsPage from './pages/admin/SupervisorsPage';
import AdminImportPage from './pages/admin/ImportPage';
import AdminPaymentsPage from './pages/admin/PaymentsPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminNewsPage from './pages/admin/AdminNewsPage';
import SupervisorActivityPage from './pages/admin/SupervisorActivityPage';

import SupervisorSearchPage from './pages/supervisor/SupervisorSearchPage';
import SupervisorJoinPage from './pages/supervisor/SupervisorJoinPage';

import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentPaymentPage from './pages/student/StudentPaymentPage';
import StudentRatePage from './pages/student/StudentRatePage';
import StudentNewsPage from './pages/student/StudentNewsPage';
import StudentComplaintPage from './pages/student/StudentComplaintPage';
import AuditorOverviewPage from './pages/auditor/AuditorOverviewPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/login/student" replace />} />
      <Route path="/login/student" element={<LoginPage fixedRole="student" />} />
      <Route path="/login/admin" element={<LoginPage fixedRole="admin" />} />
      <Route path="/login/supervisor" element={<LoginPage fixedRole="supervisor" />} />
      <Route path="/login/auditor" element={<LoginPage fixedRole="external_auditor" />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/supervisor/join" element={<SupervisorJoinPage />} />
      <Route path="/unauthorized" element={<div style={{ padding: 50, textAlign: 'center' }}><h1>No autorizado</h1></div>} />

      <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/students" element={<AdminStudentsPage />} />
        <Route path="/admin/cycles" element={<AdminCyclesPage />} />
        <Route path="/admin/supervisors" element={<AdminSupervisorsPage />} />
        <Route path="/admin/import" element={<AdminImportPage />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/supervisor-activity" element={<SupervisorActivityPage />} />
        <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
        <Route path="/admin/news" element={<AdminNewsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]} />}>
        <Route path="/supervisor" element={<SupervisorSearchPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[UserRole.EXTERNAL_AUDITOR]} />}>
        <Route path="/auditor" element={<AuditorOverviewPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[UserRole.STUDENT]} />}>
        <Route path="/student" element={<StudentProfilePage />} />
        <Route path="/student/payment" element={<StudentPaymentPage />} />
        <Route path="/student/rate" element={<StudentRatePage />} />
        <Route path="/student/news" element={<StudentNewsPage />} />
        <Route path="/student/complaint" element={<StudentComplaintPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login/student" replace />} />
      <Route path="*" element={<Navigate to="/login/student" replace />} />
    </Routes>
  );
}

export default App;

