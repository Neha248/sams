import { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/AppLayout';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable';
import Notifications from './pages/Notifications';
import TeacherAttendance from './pages/TeacherAttendance';
import TeacherAnalytics from './pages/TeacherAnalytics';
import AdminStudents from './pages/AdminStudents';
import AdminNotifications from './pages/AdminNotifications';

const RoleRoute = ({
  allowed,
  children,
}: {
  allowed: Array<'student' | 'teacher' | 'admin'>;
  children: ReactNode;
}) => {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allowed.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      
      <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route
          path="/"
          element={
            user?.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : (
              <Dashboard />
            )
          }
        />
        <Route
          path="/attendance"
          element={
            <RoleRoute allowed={['student']}>
              <Attendance />
            </RoleRoute>
          }
        />
        <Route
          path="/timetable"
          element={
            <RoleRoute allowed={['student', 'teacher']}>
              <Timetable />
            </RoleRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <RoleRoute allowed={['student']}>
              <Notifications />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <RoleRoute allowed={['teacher']}>
              <Dashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <RoleRoute allowed={['teacher']}>
              <TeacherAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/analysis"
          element={
            <RoleRoute allowed={['teacher']}>
              <TeacherAnalytics />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <RoleRoute allowed={['admin']}>
              <AdminStudents />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <RoleRoute allowed={['admin']}>
              <AdminNotifications />
            </RoleRoute>
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
