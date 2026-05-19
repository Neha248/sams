import TeacherProfile from '../models/TeacherProfile.model';

export type TeacherAssignmentRow = {
  rowId: string;
  profileId: string;
  uniqueId: string;
  loginId: string;
  teacherName: string;
  email: string;
  assignedAt: string;
  subjectName: string;
  subjectCode: string;
  departmentName: string;
  departmentCode: string;
  semester: number;
};

function matchesSearch(
  profile: {
    employeeId: string;
    userId?: { fullName?: string; userId?: string; email?: string };
  },
  search: string
): boolean {
  const q = search.toLowerCase().trim();
  if (!q) return true;
  const name = profile.userId?.fullName?.toLowerCase() ?? '';
  const email = profile.userId?.email?.toLowerCase() ?? '';
  const loginId = profile.userId?.userId?.toLowerCase() ?? '';
  const emp = profile.employeeId?.toLowerCase() ?? '';
  return name.includes(q) || email.includes(q) || loginId.includes(q) || emp.includes(q);
}

export async function getTeacherAssignmentsOverview(params: {
  departmentId?: string;
  semester?: number;
  search?: string;
}): Promise<{ assignments: TeacherAssignmentRow[] }> {
  const profiles = await TeacherProfile.find()
    .populate('userId', 'fullName userId email isActive')
    .populate({
      path: 'subjects',
      populate: { path: 'departmentId', select: 'name code' },
    })
    .lean();

  const assignments: TeacherAssignmentRow[] = [];

  for (const profile of profiles) {
    const user = profile.userId as {
      fullName?: string;
      userId?: string;
      email?: string;
      isActive?: boolean;
    } | null;

    if (user?.isActive === false) continue;
    if (!matchesSearch(profile as { employeeId: string; userId?: typeof user }, params.search ?? '')) {
      continue;
    }

    const subjects = (profile.subjects ?? []) as Array<{
      _id: { toString(): string };
      name?: string;
      code?: string;
      semester?: number;
      departmentId?: { name?: string; code?: string; _id?: { toString(): string } };
    }>;

    const assignedAt =
      (profile as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString();

    if (subjects.length === 0) {
      if (params.semester !== undefined) continue;
      if (params.departmentId) continue;
      assignments.push({
        rowId: `${profile._id.toString()}-none`,
        profileId: profile._id.toString(),
        uniqueId: profile.employeeId,
        loginId: user?.userId ?? '—',
        teacherName: user?.fullName ?? 'Unknown',
        email: user?.email ?? '—',
        assignedAt,
        subjectName: '—',
        subjectCode: '—',
        departmentName: '—',
        departmentCode: '—',
        semester: 0,
      });
      continue;
    }

    for (const subject of subjects) {
      const dept = subject.departmentId;
      const deptId = dept?._id?.toString();

      if (params.departmentId && deptId !== params.departmentId) continue;
      if (params.semester !== undefined && subject.semester !== params.semester) continue;

      assignments.push({
        rowId: `${profile._id.toString()}-${subject._id.toString()}`,
        profileId: profile._id.toString(),
        uniqueId: profile.employeeId,
        loginId: user?.userId ?? '—',
        teacherName: user?.fullName ?? 'Unknown',
        email: user?.email ?? '—',
        assignedAt,
        subjectName: subject.name ?? 'Unknown',
        subjectCode: subject.code ?? '—',
        departmentName: dept?.name && dept?.code ? `${dept.name} (${dept.code})` : dept?.name ?? '—',
        departmentCode: dept?.code ?? '—',
        semester: subject.semester ?? 0,
      });
    }
  }

  assignments.sort((a, b) => {
    const byName = a.teacherName.localeCompare(b.teacherName);
    if (byName !== 0) return byName;
    return a.subjectName.localeCompare(b.subjectName);
  });

  return { assignments };
}
