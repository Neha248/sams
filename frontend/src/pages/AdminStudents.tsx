import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import { downloadAdminStudentReport } from '../lib/download';
import { MaterialIcon } from '../components/atoms/MaterialIcon';
import { DepartmentFilterSelect } from '../components/molecules/DepartmentFilterSelect';
import type { DepartmentOption } from '../components/molecules/DepartmentSelect';
import { SearchField } from '../components/molecules/SearchField';
import { StudentAttendanceChart } from '../components/organisms/StudentAttendanceChart';
import {
  StudentOverviewTable,
  type StudentTableRow,
} from '../components/organisms/StudentOverviewTable';

type SubjectRow = {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  present: number;
  absent: number;
  total: number;
};

type StudentOverview = {
  profileId: string;
  uniNo: string;
  name: string;
  semester: number;
  section: string;
  subjects: SubjectRow[];
  totals: { present: number; absent: number; total: number };
};

type OverviewResponse = {
  students: StudentOverview[];
  chart: { present: number; absent: number };
};

function buildTableRows(students: StudentOverview[]): StudentTableRow[] {
  const rows: StudentTableRow[] = [];
  for (const student of students) {
    const subjectList =
      student.subjects.length > 0
        ? student.subjects
        : [
            {
              subjectId: 'none',
              subjectName: '—',
              subjectCode: '—',
              present: 0,
              absent: 0,
              total: 0,
            },
          ];

    subjectList.forEach((sub, subjectIdx) => {
      const isFirstSubject = subjectIdx === 0;
      rows.push({
        rowKey: `${student.profileId}-${sub.subjectId}-present`,
        uniNo: student.uniNo,
        name: student.name,
        semester: student.semester,
        section: student.section,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        total: sub.total,
        statusType: 'present',
        count: sub.present,
        isFirstOfStudent: isFirstSubject,
        isFirstOfSubject: true,
      });
      rows.push({
        rowKey: `${student.profileId}-${sub.subjectId}-absent`,
        uniNo: student.uniNo,
        name: student.name,
        semester: student.semester,
        section: student.section,
        subjectName: sub.subjectName,
        subjectCode: sub.subjectCode,
        total: sub.total,
        statusType: 'absent',
        count: sub.absent,
        isFirstOfStudent: false,
        isFirstOfSubject: false,
      });
    });
  }
  return rows;
}

const AdminStudents = () => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [chart, setChart] = useState({ present: 0, absent: 0 });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

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
        setDepartments(list.map((d) => ({ id: d._id, code: d.code, name: d.name })));
      })
      .catch(() => setDepartments([]));
  }, []);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (departmentId) params.departmentId = departmentId;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = (await api.get('/admin/students/overview', { params })) as {
        data: OverviewResponse;
      };
      setStudents(res.data.students ?? []);
      setChart(res.data.chart ?? { present: 0, absent: 0 });
    } catch (err) {
      setError(String(err));
      setStudents([]);
      setChart({ present: 0, absent: 0 });
    } finally {
      setLoading(false);
    }
  }, [departmentId, debouncedSearch]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const tableRows = useMemo(() => buildTableRows(students), [students]);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadAdminStudentReport({
        departmentId: departmentId || undefined,
        search: debouncedSearch,
      });
    } catch (err) {
      setError(String(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <nav className="flex items-center gap-2 text-outline text-label-md mb-2">
          <span>University</span>
          <MaterialIcon name="chevron_right" size="sm" />
          <span className="text-secondary font-bold">Students</span>
        </nav>
        <h1 className="font-outfit text-display-lg-mobile md:text-display-lg text-on-surface">
          Student Details Overview
        </h1>
        <p className="text-on-surface-variant text-body-md max-w-2xl">
          View all students with subject-wise attendance. Filter by department or search by name,
          roll number, or email.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
        <DepartmentFilterSelect
          departments={departments}
          value={departmentId}
          onChange={setDepartmentId}
        />
        <div className="flex-1">
          <label className="block text-label-md text-outline mb-1.5 ml-2">Search Students</label>
          <SearchField
            placeholder="Search by name, uni no, or email..."
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
          Loading student attendance...
        </p>
      ) : (
        <>
          <StudentOverviewTable
            rows={tableRows}
            onDownload={handleDownload}
            downloading={downloading}
          />
          <StudentAttendanceChart present={chart.present} absent={chart.absent} />
        </>
      )}
    </div>
  );
};

export default AdminStudents;
