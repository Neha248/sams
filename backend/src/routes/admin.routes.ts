import { Router } from 'express';
import {
  getAdminDashboard, createStudent, createTeacher,
  createDepartment, createSubject, createTimetable,
  publishTimetable, sendNotification, getAdminAnalytics,
  getAllStudents, deleteStudent, getAllTeachers, getAllDepartments,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);

router.get('/students', getAllStudents);
router.post('/student/create', createStudent);
router.delete('/student/:id', deleteStudent);

router.get('/teachers', getAllTeachers);
router.post('/teacher/create', createTeacher);

router.get('/departments', getAllDepartments);
router.post('/department/create', createDepartment);
router.post('/subject/create', createSubject);

router.post('/timetable/create', createTimetable);
router.put('/timetable/publish', publishTimetable);

router.post('/notifications/send', sendNotification);

export default router;
