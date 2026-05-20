import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import Attendance from '../models/Attendance.model';
import TeacherProfile from '../models/TeacherProfile.model';
import Timetable from '../models/Timetable.model';
import StudentProfile from '../models/StudentProfile.model';
import User from '../models/User.model';
import Notification from '../models/Notification.model';
import { markAttendanceSchema } from '../validators/attendance.validator';
import { generateTeacherPDF } from '../services/pdf.service';
import { sendSuccess, sendError } from '../utils/response';
import {
  getTeacherDashboardOverviewService,
  getTeacherDashboardClassesService,
  getAttendanceDepartmentsService,
  getAttendanceSectionsService,
  getAttendanceSemestersService,
  getAttendanceSubjectsService
} from '../services/teacher.service';
import { getAttendanceStudentListService, submitAttendanceService } from '../services/attendance.service';

// POST /api/teacher/attendance/submit
export const submitAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    const data = await submitAttendanceService(payload);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/teacher/attendance/students
export const getAttendanceStudentList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filters = req.body;
    const data = await getAttendanceStudentListService(filters);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/dashboard
export const getTeacherDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const profile = await TeacherProfile.findOne({ userId: teacherId })
      .populate('subjects', 'name code')
      .populate('departments', 'name code');

    const totalAssigned = await Timetable.countDocuments({ teacherId });
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const classesTaken = await Attendance.distinct('timetableId', { teacherId });
    const remaining = Math.max(totalAssigned - classesTaken.length, 0);

    // Weekly data: last 6 days
    const weeklyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const count = await Attendance.distinct('timetableId', {
        teacherId,
        date: { $gte: new Date(dayStr), $lt: new Date(d.setDate(d.getDate() + 1)) },
      });
      weeklyData.push({ day: new Date(dayStr).toLocaleDateString('en', { weekday: 'short' }), classes: count.length });
    }

    sendSuccess(res, {
      profile,
      stats: { totalAssigned, classesTaken: classesTaken.length, remaining, weeklyCompletion: Math.round((classesTaken.length / (totalAssigned || 1)) * 100) },
      weeklyData,
    });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/timetable
export const getTeacherTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const timetable = await Timetable.find({ teacherId: req.user!.id })
      .populate('subjectId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ day: 1, startTime: 1 });
    sendSuccess(res, timetable);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// POST /api/teacher/attendance/mark
export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = markAttendanceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Validation failed', 422, parsed.error.errors);
      return;
    }
    const { students, date, subjectId, timetableId } = parsed.data;
    const teacherId = req.user!.id;
    const dateObj = new Date(date);

    const ops = students.map((s) => ({
      updateOne: {
        filter: { studentId: new mongoose.Types.ObjectId(s.studentId), subjectId: new mongoose.Types.ObjectId(subjectId), date: dateObj },
        update: {
          $set: {
            status: s.status,
            teacherId: new mongoose.Types.ObjectId(teacherId),
            timetableId: timetableId ? new mongoose.Types.ObjectId(timetableId) : undefined,
            remarks: s.remarks || '',
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(ops);
    sendSuccess(res, { matched: result.matchedCount, upserted: result.upsertedCount }, 'Attendance saved');
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/analytics
export const getTeacherAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, section, subjectId, from, to } = req.query;
    const filter: Record<string, unknown> = { teacherId: req.user!.id };
    if (subjectId) filter.subjectId = subjectId;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>)['$gte'] = new Date(from as string);
      if (to) (filter.date as Record<string, unknown>)['$lte'] = new Date(to as string);
    }

    // Students in filter section
    const profileFilter: Record<string, unknown> = {};
    if (departmentId) profileFilter.departmentId = departmentId;
    if (semester) profileFilter.semester = Number(semester);
    if (section) profileFilter.section = section;

    const studentProfiles = await StudentProfile.find(profileFilter).select('userId rollNumber');
    const studentIds = studentProfiles.map((p) => p.userId);

    const agg = await Attendance.aggregate([
      { $match: { ...filter, studentId: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id.toString())) } } },
      {
        $group: {
          _id: '$studentId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: '$user' },
      {
        $project: {
          studentName: '$user.fullName',
          total: 1, present: 1, absent: 1, late: 1,
          percentage: { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
        },
      },
    ]);

    const above75 = agg.filter((s) => s.percentage >= 75);
    const below75 = agg.filter((s) => s.percentage < 75);

    sendSuccess(res, { all: agg, above75, below75 });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/students  - get student list for a section
export const getStudentList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentId, semester, section } = req.query;
    const filter: Record<string, unknown> = {};
    if (departmentId) filter.departmentId = departmentId;
    if (semester) filter.semester = Number(semester);
    if (section) filter.section = section;

    const profiles = await StudentProfile.find(filter)
      .populate('userId', 'fullName userId')
      .sort({ rollNumber: 1 });

    sendSuccess(res, profiles);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/report/pdf
export const downloadTeacherReportPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const { from, to, subjectId } = req.query;

    const teacher = await User.findById(teacherId).select('fullName');
    if (!teacher) {
      sendError(res, 'Teacher not found', 404);
      return;
    }

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.$gte = new Date(from as string);
    if (to) dateFilter.$lte = new Date(to as string);

    const filter: Record<string, unknown> = { teacherId };
    if (subjectId) filter.subjectId = subjectId;
    if (from || to) filter.date = dateFilter;

    const records = await Attendance.find(filter)
      .populate('studentId', 'fullName')
      .populate('subjectId', 'name code')
      .sort({ date: -1 })
      .limit(500);

    const period =
      from || to
        ? `${from ? String(from) : '...'} to ${to ? String(to) : '...'}`
        : 'All time';

    generateTeacherPDF(
      {
        teacherName: teacher.fullName,
        period,
        rows: records.map((r) => ({
          date: new Date(r.date).toLocaleDateString('en-IN'),
          student:
            typeof r.studentId === 'object' && r.studentId && 'fullName' in r.studentId
              ? String((r.studentId as any).fullName)
              : '—',
          subject:
            typeof r.subjectId === 'object' && r.subjectId && 'name' in r.subjectId
              ? `${(r.subjectId as any).name} (${(r.subjectId as any).code})`
              : '—',
          status: r.status,
        })),
      },
      res
    );
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/notifications
export const getTeacherNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const notifications = await Notification.find({
      $or: [{ targetType: 'all' }, { targetType: 'teacher', targetId: userId }],
      isDraft: false,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const enriched = notifications.map((n) => ({
      ...n.toObject(),
      isRead: n.readBy.map(String).includes(userId),
    }));

    sendSuccess(res, enriched);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/dashboard/overview
export const getTeacherDashboardOverview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const data = await getTeacherDashboardOverviewService(teacherId);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/dashboard/classes
export const getTeacherDashboardClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teacherId = req.user!.id;
    const data = await getTeacherDashboardClassesService(teacherId);
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/attendance/departments
export const getAttendanceDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getAttendanceDepartmentsService();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/attendance/sections
export const getAttendanceSections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getAttendanceSectionsService();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/attendance/semesters
export const getAttendanceSemesters = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getAttendanceSemestersService();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/teacher/attendance/subjects
export const getAttendanceSubjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = await getAttendanceSubjectsService();
    sendSuccess(res, data);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};
