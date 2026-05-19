import Timetable from '../models/Timetable.model';
import TeacherProfile from '../models/TeacherProfile.model';

export type TimetableOverviewRow = {
  id: string;
  uid: string;
  teacherName: string;
  teacherUid: string;
  teacherId: string;
  subjectName: string;
  subjectCode: string;
  subjectId: string;
  departmentName: string;
  departmentCode: string;
  departmentId: string;
  section: string;
  semester: number;
  day: string;
  startTime: string;
  endTime: string;
  timing: string;
  roomNo: string;
  isPublished: boolean;
};

export function buildSlotUid(id: string): string {
  return `TT-${id.slice(-6).toUpperCase()}`;
}

function formatTiming(day: string, startTime: string, endTime: string, roomNo: string): string {
  return `${day} · ${startTime}–${endTime} · Room ${roomNo}`;
}

function matchesSearch(row: TimetableOverviewRow, search: string): boolean {
  const q = search.toLowerCase().trim();
  if (!q) return true;
  return (
    row.uid.toLowerCase().includes(q) ||
    row.teacherUid.toLowerCase().includes(q) ||
    row.teacherName.toLowerCase().includes(q) ||
    row.subjectName.toLowerCase().includes(q) ||
    row.subjectCode.toLowerCase().includes(q) ||
    row.departmentName.toLowerCase().includes(q) ||
    row.section.toLowerCase().includes(q) ||
    row.timing.toLowerCase().includes(q)
  );
}

export async function getTimetableOverview(params: {
  departmentId?: string;
  semester?: number;
  section?: string;
  search?: string;
}): Promise<{ slots: TimetableOverviewRow[] }> {
  const filter: Record<string, unknown> = {};
  if (params.departmentId) filter.departmentId = params.departmentId;
  if (params.semester !== undefined) filter.semester = params.semester;
  if (params.section) filter.section = params.section.toUpperCase();

  const entries = await Timetable.find(filter)
    .populate('departmentId', 'name code')
    .populate('subjectId', 'name code semester')
    .populate('teacherId', 'fullName userId')
    .sort({ semester: 1, section: 1, day: 1, startTime: 1 })
    .lean();

  const teacherProfiles = await TeacherProfile.find()
    .populate('userId', 'userId')
    .select('userId employeeId')
    .lean();

  const employeeByUserId = new Map<string, string>();
  for (const p of teacherProfiles) {
    const uid = p.userId as { _id?: { toString(): string }; userId?: string } | null;
    const userMongoId = uid?._id?.toString();
    if (userMongoId) employeeByUserId.set(userMongoId, p.employeeId);
  }

  let slots: TimetableOverviewRow[] = entries.map((entry) => {
    const id = entry._id.toString();
    const dept = entry.departmentId as { name?: string; code?: string; _id?: { toString(): string } } | null;
    const subject = entry.subjectId as { name?: string; code?: string; _id?: { toString(): string } } | null;
    const teacher = entry.teacherId as { fullName?: string; userId?: string; _id?: { toString(): string } } | null;
    const teacherMongoId = teacher?._id?.toString() ?? '';

    const teacherUid = teacher?.userId ?? employeeByUserId.get(teacherMongoId) ?? '—';
    const day = entry.day;
    const startTime = entry.startTime;
    const endTime = entry.endTime;
    const roomNo = entry.roomNo;

    return {
      id,
      uid: buildSlotUid(id),
      teacherName: teacher?.fullName ?? 'Unknown',
      teacherUid,
      teacherId: teacherMongoId,
      subjectName: subject?.name ?? 'Unknown',
      subjectCode: subject?.code ?? '—',
      subjectId: subject?._id?.toString() ?? '',
      departmentName: dept?.name ?? '—',
      departmentCode: dept?.code ?? '—',
      departmentId: dept?._id?.toString() ?? '',
      section: entry.section,
      semester: entry.semester,
      day,
      startTime,
      endTime,
      timing: formatTiming(day, startTime, endTime, roomNo),
      roomNo,
      isPublished: entry.isPublished ?? false,
    };
  });

  if (params.search) {
    slots = slots.filter((row) => matchesSearch(row, params.search!));
  }

  return { slots };
}
