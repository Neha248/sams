import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../lib/axios';
import { MaterialIcon } from '../../components/atoms/MaterialIcon';
import { DepartmentSelect, type DepartmentOption } from '../../components/molecules/DepartmentSelect';
import { MetricBentoGrid, type DashboardMetrics } from '../../components/organisms/MetricBentoGrid';
import { FacultyTable, type FacultyRow } from '../../components/organisms/FacultyTable';
import { AssignTeacherModal } from '../../components/organisms/AssignTeacherModal';

type OutletContext = { searchQuery: string };

type AdminDashboardData = {
  totalStudents: number;
  totalTeachers: number;
  totalDepartments: number;
  totalClassesConducted: number;
};

type AnalyticsOverall = {
  total?: number;
  present?: number;
  absent?: number;
};

type FacultyAttendanceApiRow = {
  teacherProfileId: string;
  teacherUserId: string;
  teacherName: string;
  teacherEmail: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  presentCount: number;
  absentCount: number;
};

export default function DepartmentDashboard() {
  const { searchQuery } = useOutletContext<OutletContext>();
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [facultyRows, setFacultyRows] = useState<FacultyRow[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsOverall>({});
  const [cardAnimate, setCardAnimate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const selectedDept = departments.find((d) => d.id === selectedDeptId);

  const refreshDeptData = useCallback(async () => {
    if (!selectedDeptId) return;
    try {
      const [studentsRes, analyticsRes, facultyRes] = await Promise.all([
        api.get('/admin/students', { params: { department: selectedDeptId, limit: 1 } }),
        api.get('/admin/analytics', { params: { departmentId: selectedDeptId } }),
        api.get('/admin/faculty-attendance', { params: { departmentId: selectedDeptId } }),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentsPayload = (studentsRes as any).data;
      setStudentCount(studentsPayload?.pagination?.total ?? 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const overall = (analyticsRes as any).data?.overall ?? {};
      setAnalytics(overall);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const facultyData = ((facultyRes as any).data ?? []) as FacultyAttendanceApiRow[];
      setFacultyRows(
        facultyData.map((row) => ({
          id: `${row.teacherUserId}-${row.subjectId}`,
          name: row.teacherName,
          email: row.teacherEmail,
          subjectName: row.subjectName,
          subjectCode: row.subjectCode,
          presentCount: row.presentCount,
          absentCount: row.absentCount,
        }))
      );
    } catch (err) {
      console.error('Dept scoped fetch error:', err);
      setFacultyRows([]);
    }
  }, [selectedDeptId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, dashRes] = await Promise.all([
        api.get('/admin/departments'),
        api.get('/admin/dashboard'),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deptList = ((deptRes as any).data ?? []) as Array<{ _id: string; name: string; code: string }>;
      const deptOptions: DepartmentOption[] = deptList.map((d) => ({
        id: d._id,
        code: d.code,
        name: d.name,
      }));
      setDepartments(deptOptions);
      setSelectedDeptId((prev) => prev || deptOptions[0]?.id || '');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setDashboard((dashRes as any).data);
    } catch (err) {
      console.error('Department dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    void refreshDeptData();
  }, [refreshDeptData]);

  const handleDeptChange = (id: string) => {
    setCardAnimate(true);
    setSelectedDeptId(id);
    setTimeout(() => setCardAnimate(false), 600);
  };

  const total = analytics.total ?? 1;
  const presentPct = Math.round(((analytics.present ?? 0) / total) * 100) || 85;
  const absentPct = 100 - presentPct;

  const deptTeacherCount = new Set(facultyRows.map((r) => r.email)).size;

  const metrics: DashboardMetrics = {
    totalStudents: studentCount || dashboard?.totalStudents || 0,
    totalTeachers: deptTeacherCount || dashboard?.totalTeachers || 0,
    totalSections: dashboard?.totalDepartments ? dashboard.totalDepartments * 2 : 12,
    averagePresence: presentPct,
    averageAbsence: absentPct,
    teachersAssigned: deptTeacherCount,
  };

  const deptLabel = selectedDept ? `${selectedDept.name} (${selectedDept.code})` : 'CSE';

  if (loading && !dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-on-surface-variant text-body-md animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-outline text-label-md mb-2">
            <span>University</span>
            <MaterialIcon name="chevron_right" size="sm" />
            <span className="text-secondary font-bold">Departments</span>
          </nav>
          <h1 className="font-outfit text-display-lg text-on-surface">Department Overview</h1>
          <p className="text-on-surface-variant text-body-md max-w-2xl">
            Visualizing performance metrics and resource allocation for specialized academic units.
          </p>
        </div>
        {departments.length > 0 && (
          <DepartmentSelect
            departments={departments}
            value={selectedDeptId}
            onChange={handleDeptChange}
          />
        )}
      </div>

      <MetricBentoGrid metrics={metrics} animate={cardAnimate} />

      <FacultyTable
        departmentLabel={deptLabel}
        faculty={facultyRows}
        searchQuery={searchQuery}
        onAssignNew={() => setAssignModalOpen(true)}
      />

      <AssignTeacherModal
        open={assignModalOpen}
        departmentId={selectedDeptId}
        departmentName={deptLabel}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => void refreshDeptData()}
      />
    </>
  );
}
