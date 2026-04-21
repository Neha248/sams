import { Router } from 'express';
import {
  getStudentDashboard,
  getStudentAttendance,
  getStudentTimetable,
  getStudentNotifications,
  downloadStudentReportPDF,
} from '../controllers/student.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('student'));

router.get('/dashboard', getStudentDashboard);
router.get('/attendance', getStudentAttendance);
router.get('/timetable', getStudentTimetable);
router.get('/notifications', getStudentNotifications);
router.get('/report/pdf', downloadStudentReportPDF);

export default router;
