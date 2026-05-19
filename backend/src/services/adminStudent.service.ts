import mongoose from 'mongoose';
import Attendance from '../models/Attendance.model';
import StudentProfile from '../models/StudentProfile.model';

export type StudentSubjectAttendance = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  present: number;
  absent: number;
  total: number;
};

export type StudentAttendanceOverview = {
  profileId: string;
  studentUserId: string;
  uniNo: string;
  name: string;
  email: string;
  semester: number;
  section: string;
  department: { id: string; name: string; code: string };
  subjects: StudentSubjectAttendance[];
  totals: { present: number; absent: number; total: number };
};

export type StudentOverviewResult = {
  students: StudentAttendanceOverview[];
  chart: { present: number; absent: number };
  exportRows: StudentExportRow[];
};

export type StudentExportRow = {
  uniNo: string;
  name: string;
  subject: string;
  subjectCode: string;
  semester: number;
  section: string;
  total: number;
  present: number;
  absent: number;
};

function matchesSearch(
  profile: {
    rollNumber: string;
    userId?: { fullName?: string; userId?: string; email?: string };
  },
  search: string
): boolean {
  const q = search.toLowerCase().trim();
  if (!q) return true;
  const name = profile.userId?.fullName?.toLowerCase() ?? '';
  const email = profile.userId?.email?.toLowerCase() ?? '';
  const uid = profile.userId?.userId?.toLowerCase() ?? '';
  const roll = profile.rollNumber?.toLowerCase() ?? '';
  return name.includes(q) || email.includes(q) || uid.includes(q) || roll.includes(q);
}

export async function getStudentAttendanceOverview(params: {
  departmentId?: string;
  semester?: number;
  search?: string;
}): Promise<StudentOverviewResult> {
  const profileFilter: Record<string, unknown> = {};
  if (params.departmentId) {
    profileFilter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
  }
  if (params.semester !== undefined) {
    profileFilter.semester = params.semester;
  }

  const profiles = await StudentProfile.find(profileFilter)
    .populate('userId', 'fullName userId email isActive')
    .populate('departmentId', 'name code')
    .lean();

  const activeProfiles = profiles.filter((p) => {
    const user = p.userId as { isActive?: boolean } | null;
    return user?.isActive !== false && matchesSearch(
      p as { rollNumber: string; userId?: { fullName?: string; userId?: string; email?: string } },
      params.search ?? ''
    );
  });

  if (activeProfiles.length === 0) {
    return { students: [], chart: { present: 0, absent: 0 }, exportRows: [] };
  }

  const studentUserIds = activeProfiles.map((p) => (p.userId as { _id: mongoose.Types.ObjectId })._id);

  const subjectAgg = await Attendance.aggregate([
    { $match: { studentId: { $in: studentUserIds } } },
    {
      $group: {
        _id: { studentId: '$studentId', subjectId: '$subjectId' },
        present: {
          $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
        },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    {
      $lookup: { from: 'subjects', localField: '_id.subjectId', foreignField: '_id', as: 'subject' },
    },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        studentId: '$_id.studentId',
        subjectId: '$_id.subjectId',
        present: 1,
        absent: 1,
        total: 1,
        subjectName: '$subject.name',
        subjectCode: '$subject.code',
      },
    },
  ]);

  const aggByStudent = new Map<string, StudentSubjectAttendance[]>();
  for (const row of subjectAgg) {
    const sid = row.studentId.toString();
    const list = aggByStudent.get(sid) ?? [];
    list.push({
      subjectId: row.subjectId.toString(),
      subjectName: row.subjectName ?? 'Unknown',
      subjectCode: row.subjectCode ?? '—',
      present: row.present,
      absent: row.absent,
      total: row.total,
    });
    aggByStudent.set(sid, list);
  }

  const students: StudentAttendanceOverview[] = [];
  const exportRows: StudentExportRow[] = [];
  let chartPresent = 0;
  let chartAbsent = 0;

  for (const profile of activeProfiles) {
    const user = profile.userId as {
      _id: mongoose.Types.ObjectId;
      fullName?: string;
      email?: string;
    };
    const dept = profile.departmentId as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      code: string;
    };
    const uid = user._id.toString();
    const subjects = (aggByStudent.get(uid) ?? []).sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName)
    );

    const totals = subjects.reduce(
      (acc, s) => ({
        present: acc.present + s.present,
        absent: acc.absent + s.absent,
        total: acc.total + s.total,
      }),
      { present: 0, absent: 0, total: 0 }
    );

    chartPresent += totals.present;
    chartAbsent += totals.absent;

    const overview: StudentAttendanceOverview = {
      profileId: profile._id.toString(),
      studentUserId: uid,
      uniNo: profile.rollNumber,
      name: user.fullName ?? 'Unknown',
      email: user.email ?? '',
      semester: profile.semester,
      section: profile.section,
      department: {
        id: dept._id.toString(),
        name: dept.name,
        code: dept.code,
      },
      subjects,
      totals,
    };
    students.push(overview);

    if (subjects.length === 0) {
      exportRows.push({
        uniNo: profile.rollNumber,
        name: user.fullName ?? 'Unknown',
        subject: '—',
        subjectCode: '—',
        semester: profile.semester,
        section: profile.section,
        total: 0,
        present: 0,
        absent: 0,
      });
    } else {
      for (const s of subjects) {
        exportRows.push({
          uniNo: profile.rollNumber,
          name: user.fullName ?? 'Unknown',
          subject: s.subjectName,
          subjectCode: s.subjectCode,
          semester: profile.semester,
          section: profile.section,
          total: s.total,
          present: s.present,
          absent: s.absent,
        });
      }
    }
  }

  students.sort((a, b) => a.uniNo.localeCompare(b.uniNo));

  return {
    students,
    chart: { present: chartPresent, absent: chartAbsent },
    exportRows,
  };
}

export function buildStudentAttendanceCsv(rows: StudentExportRow[]): string {
  const header = 'Uni No,Name,Subject,Subject Code,Semester,Section,Total,Present,Absent';
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = rows.map((r) =>
    [
      escape(r.uniNo),
      escape(r.name),
      escape(r.subject),
      escape(r.subjectCode),
      r.semester,
      escape(r.section),
      r.total,
      r.present,
      r.absent,
    ].join(',')
  );
  return [header, ...lines].join('\n');
}
