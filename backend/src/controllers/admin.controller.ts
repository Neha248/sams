import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import User from '../models/User.model';
import StudentProfile from '../models/StudentProfile.model';
import TeacherProfile from '../models/TeacherProfile.model';
import Department from '../models/Department.model';
import Subject from '../models/Subject.model';
import Timetable from '../models/Timetable.model';
import Attendance from '../models/Attendance.model';
import Notification from '../models/Notification.model';
import { createTimetableSchema } from '../validators/timetable.validator';
import { sendSuccess, sendError } from '../utils/response';
import { getFacultySubjectAttendanceByDepartment } from '../services/adminAttendance.service';
import {
  buildStudentAttendanceCsv,
  getStudentAttendanceOverview,
} from '../services/adminStudent.service';
import { getTeacherAssignmentsOverview } from '../services/adminTeacher.service';
import { createTeacherSchema } from '../validators/admin.validator';

// GET /api/admin/dashboard
export const getAdminDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [totalStudents, totalTeachers, totalDepartments, todayRecords] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      Department.countDocuments(),
      Attendance.find({ date: { $gte: today, $lt: tomorrow } }),
    ]);

    const totalClassesConducted = await Attendance.distinct('timetableId');
    const todayPresent = todayRecords.filter((r) => r.status === 'present').length;
    const todayAbsent = todayRecords.filter((r) => r.status === 'absent').length;
    const todayLate = todayRecords.filter((r) => r.status === 'late').length;

    sendSuccess(res, {
      totalStudents, totalTeachers, totalDepartments,
      totalClassesConducted: totalClassesConducted.length,
      todayPresent, todayAbsent, todayLate,
    });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/admin/student/create
export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, userId, email, password, rollNumber, departmentId, semester, section, phone } = req.body;
    const user = await User.create({ fullName, userId, email, password, role: 'student' });
    const profile = await StudentProfile.create({ userId: user._id, rollNumber, departmentId, semester, section, phone });
    sendSuccess(res, { user: { id: user._id, userId: user.userId, fullName: user.fullName, role: user.role }, profile }, 'Student created', 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/admin/teacher/create
export const createTeacher = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTeacherSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.errors);
      return;
    }
    const { fullName, userId, email, password, employeeId, departments, subjects, phone } = parsed.data;

    const existing = await User.findOne({ $or: [{ userId }, { email }] });
    if (existing) {
      sendError(res, 'User ID or email already exists', 409);
      return;
    }

    const user = await User.create({ fullName, userId, email, password, role: 'teacher' });
    const profile = await TeacherProfile.create({
      userId: user._id,
      employeeId,
      departments,
      subjects,
      phone,
    });
    sendSuccess(
      res,
      { user: { id: user._id, userId: user.userId, fullName: user.fullName }, profile },
      'Teacher created',
      201
    );
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/subjects?departmentId=
export const getSubjectsByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, semester } = req.query;
    if (!departmentId || typeof departmentId !== 'string') {
      sendError(res, 'departmentId query parameter is required', 400);
      return;
    }
    const filter: Record<string, unknown> = { departmentId };
    if (typeof semester === 'string' && semester !== '') {
      const semesterNum = Number(semester);
      if (!Number.isNaN(semesterNum)) filter.semester = semesterNum;
    }
    const subjects = await Subject.find(filter).select('name code semester credits').sort({ semester: 1, code: 1 });
    sendSuccess(res, subjects);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/admin/department/create
export const createDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = await Department.create(req.body);
    sendSuccess(res, dept, 'Department created', 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/admin/subject/create
export const createSubject = async (req: Request, res: Response): Promise<void> => {
  try {
    const subject = await Subject.create(req.body);
    sendSuccess(res, subject, 'Subject created', 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/admin/timetable/create
export const createTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTimetableSchema.safeParse(req.body);
    if (!parsed.success) { sendError(res, 'Validation failed', 422, parsed.error.errors); return; }
    const entry = await Timetable.create(parsed.data);
    sendSuccess(res, entry, 'Timetable entry created', 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// PUT /api/admin/timetable/:id/publish
export const publishTimetable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, section } = req.query;
    await Timetable.updateMany({ departmentId, semester, section }, { isPublished: true });
    sendSuccess(res, null, 'Timetable published');
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/admin/notifications/send
export const sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, priority, targetType, targetId, scheduledAt } = req.body;
    const notification = await Notification.create({
      title, message, priority, targetType,
      targetId: targetId ? new mongoose.Types.ObjectId(targetId) : undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      sentAt: scheduledAt ? undefined : new Date(),
      createdBy: req.user!.id,
      isDraft: false,
    });
    sendSuccess(res, notification, 'Notification sent', 201);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/faculty-attendance?departmentId=
export const getFacultySubjectAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.query;
    if (!departmentId || typeof departmentId !== 'string') {
      sendError(res, 'departmentId query parameter is required', 400);
      return;
    }
    const rows = await getFacultySubjectAttendanceByDepartment(departmentId);
    sendSuccess(res, rows);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/analytics
export const getAdminAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, subjectId, from, to } = req.query;
    const filter: Record<string, unknown> = {};
    if (subjectId) filter.subjectId = subjectId;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>)['$gte'] = new Date(from as string);
      if (to) (filter.date as Record<string, unknown>)['$lte'] = new Date(to as string);
    }

    const overall = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        },
      },
    ]);

    const departments = await Attendance.aggregate([
      { $match: filter },
      {
        $lookup: { from: 'studentprofiles', localField: 'studentId', foreignField: 'userId', as: 'profile' },
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$profile.departmentId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        },
      },
      {
        $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' },
      },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          deptName: '$dept.name',
          total: 1, present: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
        },
      },
    ]);

    sendSuccess(res, { overall: overall[0] || {}, departments });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/students/overview?departmentId=&semester=&search=
export const getStudentsAttendanceOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, search } = req.query;
    const semesterNum =
      typeof semester === 'string' && semester !== '' ? Number(semester) : undefined;
    const result = await getStudentAttendanceOverview({
      departmentId: typeof departmentId === 'string' && departmentId ? departmentId : undefined,
      semester: semesterNum !== undefined && !Number.isNaN(semesterNum) ? semesterNum : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/teachers/overview?departmentId=&semester=&search=
export const getTeachersAssignmentsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, search } = req.query;
    const semesterNum =
      typeof semester === 'string' && semester !== '' ? Number(semester) : undefined;
    const result = await getTeacherAssignmentsOverview({
      departmentId: typeof departmentId === 'string' && departmentId ? departmentId : undefined,
      semester: semesterNum !== undefined && !Number.isNaN(semesterNum) ? semesterNum : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/students/export?departmentId=&search=
export const exportStudentsAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, search } = req.query;
    const semesterNum =
      typeof semester === 'string' && semester !== '' ? Number(semester) : undefined;
    const result = await getStudentAttendanceOverview({
      departmentId: typeof departmentId === 'string' && departmentId ? departmentId : undefined,
      semester: semesterNum !== undefined && !Number.isNaN(semesterNum) ? semesterNum : undefined,
      search: typeof search === 'string' ? search : undefined,
    });
    const csv = buildStudentAttendanceCsv(result.exportRows);
    const filename = `sams_students_attendance_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/students
export const getAllStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, semester, section, page = 1, limit = 20 } = req.query;
    const profileFilter: Record<string, unknown> = {};
    if (department) profileFilter.departmentId = department;
    if (semester) profileFilter.semester = Number(semester);
    if (section) profileFilter.section = section;

    const skip = (Number(page) - 1) * Number(limit);
    const profiles = await StudentProfile.find(profileFilter)
      .populate('userId', 'fullName userId email isActive')
      .populate('departmentId', 'name code')
      .skip(skip).limit(Number(limit));
    const total = await StudentProfile.countDocuments(profileFilter);

    sendSuccess(res, { students: profiles, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// DELETE /api/admin/student/:id
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) { sendError(res, 'Student not found', 404); return; }
    sendSuccess(res, null, 'Student deactivated');
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// DELETE /api/admin/teacher/:profileId — soft-deactivate teacher user account
export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await TeacherProfile.findById(req.params.profileId);
    if (!profile) {
      sendError(res, 'Teacher not found', 404);
      return;
    }
    const user = await User.findByIdAndUpdate(
      profile.userId,
      { isActive: false },
      { new: true }
    );
    if (!user || user.role !== 'teacher') {
      sendError(res, 'Teacher user not found', 404);
      return;
    }
    sendSuccess(res, null, 'Teacher removed successfully');
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/teachers
export const getAllTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await TeacherProfile.find()
      .populate('userId', 'fullName userId email isActive')
      .populate('departments', 'name code')
      .populate('subjects', 'name code');
    sendSuccess(res, teachers);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/admin/departments
export const getAllDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const depts = await Department.find().populate('hodId', 'fullName');
    sendSuccess(res, depts);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};
