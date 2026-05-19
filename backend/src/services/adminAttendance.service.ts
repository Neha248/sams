import mongoose from 'mongoose';
import Attendance from '../models/Attendance.model';
import Subject from '../models/Subject.model';
import TeacherProfile from '../models/TeacherProfile.model';
export type FacultySubjectAttendanceRow = {
  teacherProfileId: string;
  teacherUserId: string;
  teacherName: string;
  teacherEmail: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  presentCount: number;
  absentCount: number;
  totalRecords: number;
};

export async function getFacultySubjectAttendanceByDepartment(
  departmentId: string
): Promise<FacultySubjectAttendanceRow[]> {
  const deptObjectId = new mongoose.Types.ObjectId(departmentId);

  const subjects = await Subject.find({ departmentId: deptObjectId }).select('_id name code');
  if (subjects.length === 0) return [];

  const subjectIds = subjects.map((s) => s._id);
  const subjectMap = new Map(subjects.map((s) => [s._id.toString(), s]));

  const teacherProfiles = await TeacherProfile.find({ departments: deptObjectId })
    .populate('userId', 'fullName email isActive')
    .populate('subjects', 'name code departmentId');

  if (teacherProfiles.length === 0) return [];

  const teacherUserIds = teacherProfiles
    .map((p) => p.userId as { _id?: mongoose.Types.ObjectId })
    .filter((u) => u?._id)
    .map((u) => u._id!);

  const aggregates = await Attendance.aggregate([
    {
      $match: {
        subjectId: { $in: subjectIds },
        teacherId: { $in: teacherUserIds },
      },
    },
    {
      $group: {
        _id: { teacherId: '$teacherId', subjectId: '$subjectId' },
        presentCount: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
          },
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] },
        },
        totalRecords: { $sum: 1 },
      },
    },
  ]);

  const aggMap = new Map(
    aggregates.map((a) => [
      `${a._id.teacherId.toString()}:${a._id.subjectId.toString()}`,
      {
        presentCount: a.presentCount as number,
        absentCount: a.absentCount as number,
        totalRecords: a.totalRecords as number,
      },
    ])
  );

  const rows: FacultySubjectAttendanceRow[] = [];

  for (const profile of teacherProfiles) {
    const user = profile.userId as {
      _id: mongoose.Types.ObjectId;
      fullName?: string;
      email?: string;
      isActive?: boolean;
    };
    if (!user?._id || user.isActive === false) continue;

    const profileSubjects =
      (profile.subjects as unknown as Array<{
        _id: mongoose.Types.ObjectId;
        name: string;
        code: string;
        departmentId: mongoose.Types.ObjectId;
      }>) ?? [];

    const deptSubjects = profileSubjects.filter(
      (s) => s.departmentId?.toString() === departmentId
    );

    if (deptSubjects.length > 0) {
      for (const subject of deptSubjects) {
        const sid = subject._id.toString();
        const key = `${user._id.toString()}:${sid}`;
        const stats = aggMap.get(key) ?? { presentCount: 0, absentCount: 0, totalRecords: 0 };
        rows.push({
          teacherProfileId: profile._id.toString(),
          teacherUserId: user._id.toString(),
          teacherName: user.fullName ?? 'Unknown',
          teacherEmail: user.email ?? '',
          subjectId: sid,
          subjectName: subject.name,
          subjectCode: subject.code,
          presentCount: stats.presentCount,
          absentCount: stats.absentCount,
          totalRecords: stats.totalRecords,
        });
      }
      continue;
    }

    const teacherAggs = aggregates.filter((a) => a._id.teacherId.toString() === user._id.toString());
    for (const agg of teacherAggs) {
      const sid = agg._id.subjectId.toString();
      const sub = subjectMap.get(sid);
      if (!sub) continue;
      rows.push({
        teacherProfileId: profile._id.toString(),
        teacherUserId: user._id.toString(),
        teacherName: user.fullName ?? 'Unknown',
        teacherEmail: user.email ?? '',
        subjectId: sid,
        subjectName: sub.name,
        subjectCode: sub.code,
        presentCount: agg.presentCount,
        absentCount: agg.absentCount,
        totalRecords: agg.totalRecords,
      });
    }
  }

  rows.sort((a, b) => a.teacherName.localeCompare(b.teacherName));
  return rows;
}
