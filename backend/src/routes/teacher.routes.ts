import { Router } from 'express';
import {
  getTeacherDashboard,
  getTeacherTimetable,
  markAttendance,
  getTeacherAnalytics,
  getStudentList,
  downloadTeacherReportPDF,
  getTeacherNotifications,
} from '../controllers/teacher.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('teacher'));

router.get('/dashboard', getTeacherDashboard);
router.get('/timetable', getTeacherTimetable);
router.post('/attendance/mark', markAttendance);
router.get('/analytics', getTeacherAnalytics);
router.get('/students', getStudentList);
router.get('/report/pdf', downloadTeacherReportPDF);
router.get('/notifications', getTeacherNotifications);

export default router;
