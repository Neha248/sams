import { Router } from 'express';
import {
  getTeacherDashboard,
  getTeacherDashboardOverview,
  getTeacherDashboardClasses,
  getTeacherTimetable,
  markAttendance,
  getTeacherAnalytics,
  getStudentList,
  downloadTeacherReportPDF,
  getTeacherNotifications,
  getAttendanceDepartments,
  getAttendanceSections,
  getAttendanceSemesters,
  getAttendanceSubjects,
  getAttendanceStudentList,
  submitAttendance
} from '../controllers/teacher.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('teacher'));

router.get('/dashboard/overview', getTeacherDashboardOverview);
router.get('/dashboard/classes', getTeacherDashboardClasses);
router.get('/dashboard', getTeacherDashboard);
router.get('/timetable', getTeacherTimetable);
router.post('/attendance/mark', markAttendance);
router.get('/analytics', getTeacherAnalytics);
router.get('/students', getStudentList);
router.get('/report/pdf', downloadTeacherReportPDF);
router.get('/notifications', getTeacherNotifications);

router.get('/attendance/departments', getAttendanceDepartments);
router.get('/attendance/sections', getAttendanceSections);
router.get('/attendance/semesters', getAttendanceSemesters);
router.get('/attendance/subjects', getAttendanceSubjects);

router.post('/attendance/students', getAttendanceStudentList);
router.post('/attendance/submit', submitAttendance);

export default router;
