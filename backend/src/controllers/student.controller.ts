import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth.middleware';
import Attendance from '../models/Attendance.model';
import StudentProfile from '../models/StudentProfile.model';
import Timetable from '../models/Timetable.model';
import Notification from '../models/Notification.model';
import User from '../models/User.model';
import { generateStudentPDF } from '../services/pdf.service';
import {
  applyLateToAbsentRule,
  buildSafeZoneSuggestion,
  classesNeededForSafeZone,
  countUpcomingClassesBySubject,
  endOfToday,
  startOfToday,
} from '../utils/attendanceSafeZone';
import { sendSuccess, sendError } from '../utils/response';

// GET /api/student/dashboard
export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const profile = await StudentProfile.findOne({ userId: studentId })
      .populate('departmentId', 'name code');

    const records = await Attendance.find({ studentId });
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const summaryStats = applyLateToAbsentRule({
      present,
      absent,
      late,
      total: records.length,
    });
    const classesNeeded = classesNeededForSafeZone(summaryStats.present, summaryStats.total);

    // Subject-wise stats (aggregate $match requires ObjectId, not string)
    const studentObjectId = new mongoose.Types.ObjectId(studentId);
    const subjectAgg = await Attendance.aggregate([
      { $match: { studentId: studentObjectId } },
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
          _id: 1,
          subjectName: '$subject.name',
          subjectCode: '$subject.code',
          total: '$total',
          present: '$present',
          absent: '$absent',
          late: '$late',
          lateAsAbsent: { $floor: { $divide: ['$late', 2] } },
          effectiveAbsent: { $add: ['$absent', { $floor: { $divide: ['$late', 2] } }] },
          remainingLate: { $mod: ['$late', 2] },
          presentPct: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
          absentPct: {
            $round: [{ $multiply: [{ $divide: ['$absent', '$total'] }, 100] }, 1],
          },
          latePct: {
            $round: [{ $multiply: [{ $divide: ['$late', '$total'] }, 100] }, 1],
          },
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1],
          },
          isSafe: { $gte: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 75] },
        },
      },
      { $sort: { subjectName: 1 } },
    ]);

    let upcomingBySubject = new Map<string, number>();
    if (profile) {
      const timetableSlots = await Timetable.find({
        departmentId: profile.departmentId,
        semester: profile.semester,
        section: profile.section,
        isPublished: true,
      }).select('day subjectId');

      upcomingBySubject = countUpcomingClassesBySubject(timetableSlots);
    }

    const enrichSubject = (s: (typeof subjectAgg)[number]) => {
      const subjectId = s._id?.toString() ?? '';
      const classesNeeded = classesNeededForSafeZone(s.present, s.total);
      const upcomingClassesNextWeek = upcomingBySubject.get(subjectId) ?? 0;
      const canReachSafeZone = classesNeeded > 0 && upcomingClassesNextWeek >= classesNeeded;

      return {
        ...s,
        subjectId,
        classesNeeded,
        upcomingClassesNextWeek,
        canReachSafeZone,
        suggestion: buildSafeZoneSuggestion(s.subjectName, classesNeeded, upcomingClassesNextWeek),
      };
    };

    const subjectWiseEnriched = subjectAgg.map(enrichSubject);

    // Safe zone: every subject must be >= 75% (not overall average only)
    const safeSubjectCount = subjectWiseEnriched.filter((s) => s.isSafe).length;
    const allSubjectsSafe = subjectWiseEnriched.length > 0 && safeSubjectCount === subjectWiseEnriched.length;
    const subjectsBelowSafe = subjectWiseEnriched.filter((s) => !s.isSafe);

    sendSuccess(res, {
      profile,
      summary: {
        total: summaryStats.total,
        present: summaryStats.present,
        absent: summaryStats.absent,
        late: summaryStats.late,
        lateAsAbsent: summaryStats.lateAsAbsent,
        effectiveAbsent: summaryStats.effectiveAbsent,
        remainingLate: summaryStats.remainingLate,
        percentage: summaryStats.percentage,
        classesNeeded,
      },
      attendanceRules: {
        safeZonePerSubject: 75,
        lateToAbsentRatio: 2,
        description: 'Safe zone requires every subject at or above 75% (present ÷ total). Every 2 late marks count as 1 absent.',
      },
      subjectWise: subjectWiseEnriched,
      isSafe: allSubjectsSafe,
      subjectSafeSummary: {
        totalSubjects: subjectWiseEnriched.length,
        safeSubjects: safeSubjectCount,
        unsafeSubjects: subjectsBelowSafe,
      },
      hasUnsafeSubjects: subjectsBelowSafe.length > 0,
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

    const useTodayOnly = req.query.today === 'true' || (!from && !to);
    if (useTodayOnly) {
      filter.date = { $gte: startOfToday(), $lte: endOfToday() };
    } else if (from || to) {
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
      day: { $in: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
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
