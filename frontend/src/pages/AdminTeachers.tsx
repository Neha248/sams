import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import { MaterialIcon } from '../components/atoms/MaterialIcon';
import { DepartmentFilterSelect } from '../components/molecules/DepartmentFilterSelect';
import type { DepartmentOption } from '../components/molecules/DepartmentSelect';
import { SearchField } from '../components/molecules/SearchField';
import { SemesterFilterSelect } from '../components/molecules/SemesterFilterSelect';
import { AssignTeacherModal } from '../components/organisms/AssignTeacherModal';
import {
  TeacherAssignmentsTable,
  type TeacherAssignmentTableRow,
} from '../components/organisms/TeacherAssignmentsTable';

type AssignmentApiRow = {
  rowId: string;
  profileId: string;
  uniqueId: string;
  teacherName: string;
  email: string;
  assignedAt: string;
  subjectName: string;
  subjectCode: string;
  departmentName: string;
  semester: number;
};

function buildTableRows(assignments: AssignmentApiRow[]): TeacherAssignmentTableRow[] {
  const seen = new Set<string>();
  return assignments.map((a) => {
    const teacherKey = a.uniqueId;
    const isFirstOfTeacher = !seen.has(teacherKey);
    seen.add(teacherKey);
    return {
      rowKey: a.rowId,
      profileId: a.profileId,
      uniqueId: a.uniqueId,
      teacherName: a.teacherName,
      email: a.email,
      assignedAt: a.assignedAt,
      subjectName: a.subjectName,
      subjectCode: a.subjectCode,
      departmentName: a.departmentName,
      semester: a.semester,
      isFirstOfTeacher,
    };
  });
}

const AdminTeachers = () => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [assignments, setAssignments] = useState<AssignmentApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [removingProfileId, setRemovingProfileId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api
      .get('/admin/departments')
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = ((res as any).data ?? []) as Array<{ _id: string; name: string; code: string }>;
        const mapped = list.map((d) => ({ id: d._id, code: d.code, name: d.name }));
        setDepartments(mapped);
      })
      .catch(() => setDepartments([]));
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (departmentId) params.departmentId = departmentId;
      if (semester) params.semester = semester;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = (await api.get('/admin/teachers/overview', { params })) as {
        data: { assignments: AssignmentApiRow[] };
      };
      setAssignments(res.data.assignments ?? []);
    } catch (err) {
      setError(String(err));
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId, semester, debouncedSearch]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const tableRows = useMemo(() => buildTableRows(assignments), [assignments]);

  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const assignDepartmentId = departmentId || departments[0]?.id || '';
  const assignDepartmentName =
    selectedDepartment?.name ?? departments[0]?.name ?? 'Select a department';

  const handleAssignNew = () => {
    if (!assignDepartmentId) {
      setError('Select a department before assigning a new teacher.');
      return;
    }
    if (!departmentId) {
      setError('Select a specific department to assign a teacher (not All Departments).');
      return;
    }
    setError('');
    setAssignOpen(true);
  };

  const handleRemoveTeacher = async (profileId: string, teacherName: string) => {
    const confirmed = window.confirm(
      `Remove ${teacherName} from the system? They will no longer be able to sign in.`
    );
    if (!confirmed) return;
    setRemovingProfileId(profileId);
    setError('');
    try {
      await api.delete(`/admin/teacher/${profileId}`);
      await loadOverview();
    } catch (err) {
      setError(String(err));
    } finally {
      setRemovingProfileId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <nav className="flex items-center gap-2 text-outline text-label-md mb-2">
          <span>University</span>
          <MaterialIcon name="chevron_right" size="sm" />
          <span className="text-secondary font-bold">Teachers</span>
        </nav>
        <h1 className="font-outfit text-display-lg-mobile md:text-display-lg text-on-surface">
          Teacher Assignments Overview
        </h1>
        <p className="text-on-surface-variant text-body-md max-w-2xl">
          View all teachers with subject assignments, departments, and semester. Filter by department,
          semester, or search by name, employee ID, or email.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-end flex-wrap">
        <DepartmentFilterSelect
          departments={departments}
          value={departmentId}
          onChange={setDepartmentId}
        />
        <SemesterFilterSelect value={semester} onChange={setSemester} />
        <div className="flex-1 min-w-[240px]">
          <label className="block text-label-md text-outline mb-1.5 ml-2">Search Teachers</label>
          <SearchField
            placeholder="Search by name, employee ID, or email..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-container/50 text-error text-body-sm border border-error/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-body-md animate-pulse py-12 text-center">
          Loading teacher assignments...
        </p>
      ) : (
        <TeacherAssignmentsTable
          rows={tableRows}
          onAssignNew={handleAssignNew}
          assignDisabled={departments.length === 0}
          onRemoveTeacher={handleRemoveTeacher}
          removingProfileId={removingProfileId}
        />
      )}

      <AssignTeacherModal
        open={assignOpen}
        departmentId={assignDepartmentId}
        departmentName={assignDepartmentName}
        semesterFilter={semester}
        onClose={() => setAssignOpen(false)}
        onSuccess={() => void loadOverview()}
      />
    </div>
  );
};

export default AdminTeachers;
