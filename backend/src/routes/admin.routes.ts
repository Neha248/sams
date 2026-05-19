import { Router } from 'express';
import {
  getAdminDashboard, createStudent, createTeacher,
  createDepartment, createSubject, createTimetable,
  publishTimetable, sendNotification, getAdminAnalytics,
  getAllStudents, deleteStudent, getAllTeachers, getAllDepartments,
  getFacultySubjectAttendance,
  getSubjectsByDepartment,
  getStudentsAttendanceOverview,
  exportStudentsAttendance,
  getTeachersAssignmentsOverview,
  deleteTeacher,
  getTimetableOverviewHandler,
  updateTimetable,
  deleteTimetable,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorizeRoles } from '../middlewares/role.middleware';

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/dashboard', getAdminDashboard);
router.get('/analytics', getAdminAnalytics);
router.get('/faculty-attendance', getFacultySubjectAttendance);
router.get('/subjects', getSubjectsByDepartment);

router.get('/students/overview', getStudentsAttendanceOverview);
router.get('/students/export', exportStudentsAttendance);
router.get('/students', getAllStudents);
router.post('/student/create', createStudent);
router.delete('/student/:id', deleteStudent);

router.get('/teachers/overview', getTeachersAssignmentsOverview);
router.get('/teachers', getAllTeachers);
router.post('/teacher/create', createTeacher);
router.delete('/teacher/:profileId', deleteTeacher);

router.get('/departments', getAllDepartments);
router.post('/department/create', createDepartment);
router.post('/subject/create', createSubject);

router.get('/timetable/overview', getTimetableOverviewHandler);
router.post('/timetable/create', createTimetable);
router.put('/timetable/publish', publishTimetable);
router.put('/timetable/:id', updateTimetable);
router.delete('/timetable/:id', deleteTimetable);

router.post('/notifications/send', sendNotification);

export default router;
