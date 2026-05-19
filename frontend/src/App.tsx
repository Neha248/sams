import { ReactNode, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AppLayout from './components/AppLayout';
import { AdminStitchLayout } from './components/templates/AdminStitchLayout';
import DepartmentDashboard from './pages/admin/DepartmentDashboard';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable.tsx';
import Notifications from './pages/Notifications.tsx';
import TeacherAttendance from './pages/TeacherAttendance.tsx';
import TeacherAnalytics from './pages/TeacherAnalytics.tsx';
import AdminStudents from './pages/AdminStudents.tsx';
import AdminTeachers from './pages/AdminTeachers.tsx';
import AdminNotifications from './pages/AdminNotifications.tsx';
import AdminTimetable from './pages/AdminTimetable.tsx';

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
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    document.body.classList.toggle('theme-neo-shinjuku', !!user && !isAdmin);
  }, [user, isAdmin]);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/" element={<AdminStitchLayout />}>
          <Route index element={<DepartmentDashboard />} />
          <Route path="admin/students" element={<AdminStudents />} />
          <Route path="admin/teachers" element={<AdminTeachers />} />
          <Route path="admin/timetable" element={<AdminTimetable />} />
          <Route path="admin/notifications" element={<AdminNotifications />} />
        </Route>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
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
          path="/teacher/attendance"
          element={
            <RoleRoute allowed={['teacher']}>
              <TeacherAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/teacher/analytics"
          element={
            <RoleRoute allowed={['teacher']}>
              <TeacherAnalytics />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
