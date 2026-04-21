import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Attendance from '../models/Attendance.model';
import StudentProfile from '../models/StudentProfile.model';
import Timetable from '../models/Timetable.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import { generateStudentPDF } from '../services/pdf.service';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/student/dashboard
export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const profile = await StudentProfile.findOne({ userId: studentId })
      .populate('departmentId', 'name code');

    const records = await Attendance.find({ studentId });
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    // Classes needed to reach 75%
    let classesNeeded = 0;
    if (percentage < 75) {
      // (present + x) / (total + x) >= 0.75
      // present + x >= 0.75 * total + 0.75x
      // 0.25x >= 0.75 * total - present
      classesNeeded = Math.ceil((0.75 * total - present) / 0.25);
    }

    // Subject-wise stats
    const subjectAgg = await Attendance.aggregate([
      { $match: { studentId: profile?.userId } },
      {
        $group: {
          _id: '$subjectId',
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        },
      },
      {
        $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' },
      },
      { $unwind: '$subject' },
      {
        $project: {
          subjectName: '$subject.name',
          subjectCode: '$subject.code',
          total: 1,
          present: 1,
          absent: 1,
          late: 1,
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
        },
      },
    ]);

    sendSuccess(res, {
      profile,
      summary: { total, present, absent, late, percentage, classesNeeded },
      subjectWise: subjectAgg,
      isSafe: percentage >= 75,
    });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/student/attendance
export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { subject, status, from, to, page = 1, limit = 20 } = req.query;

    const filter: Record<string, unknown> = { studentId };
    if (subject) filter.subjectId = subject;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>)['$gte'] = new Date(from as string);
      if (to) (filter.date as Record<string, unknown>)['$lte'] = new Date(to as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [records, totalCount] = await Promise.all([
      Attendance.find(filter)
        .populate('subjectId', 'name code')
        .sort({ date: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(filter),
    ]);

    sendSuccess(res, {
      records,
      pagination: { page: Number(page), limit: Number(limit), total: totalCount },
    });
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/student/timetable
export const getStudentTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user!.id });
    if (!profile) { sendError(res, 'Student profile not found', 404); return; }

    const timetable = await Timetable.find({
      departmentId: profile.departmentId,
      semester: profile.semester,
      section: profile.section,
      isPublished: true,
    })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'fullName')
      .sort({ day: 1, startTime: 1 });

    sendSuccess(res, timetable);
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};

// GET /api/student/notifications
export const getStudentNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await StudentProfile.findOne({ userId });

    const notifications = await Notification.find({
      $or: [
        { targetType: 'all' },
        { targetType: 'student', targetId: userId },
        { targetType: 'department', targetId: profile?.departmentId },
      ],
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

// GET /api/student/report/pdf
export const downloadStudentReportPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const { from, to } = req.query;

    const student = await User.findById(studentId).select('fullName');
    const profile = await StudentProfile.findOne({ userId: studentId }).populate('departmentId', 'name code');
    if (!student || !profile) {
      sendError(res, 'Student profile not found', 404);
      return;
    }

    const dateFilter: Record<string, unknown> = {};
    if (from) dateFilter.$gte = new Date(from as string);
    if (to) dateFilter.$lte = new Date(to as string);

    const filter: Record<string, unknown> = { studentId };
    if (from || to) filter.date = dateFilter;

    const records = await Attendance.find(filter)
      .populate('subjectId', 'name code')
      .sort({ date: -1 });

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    const period =
      from || to
        ? `${from ? String(from) : '...'} to ${to ? String(to) : '...'}`
        : 'All time';

    generateStudentPDF(
      {
        studentName: student.fullName,
        rollNumber: profile.rollNumber,
        department:
          typeof profile.departmentId === 'object' && profile.departmentId && 'name' in profile.departmentId
            ? String((profile.departmentId as any).name)
            : '—',
        semester: profile.semester,
        section: profile.section,
        period,
        totalClasses: total,
        present,
        absent,
        late,
        percentage,
        records: records.map((r) => ({
          date: new Date(r.date).toLocaleDateString('en-IN'),
          subject:
            typeof r.subjectId === 'object' && r.subjectId && 'name' in r.subjectId
              ? `${(r.subjectId as any).name} (${(r.subjectId as any).code})`
              : '—',
          status: r.status,
          remarks: r.remarks || '',
        })),
      },
      res
    );
  } catch (err) {
    sendError(res, (err as Error).message);
  }
};
