import { useCallback, useEffect, useState } from 'react';
import api from '../lib/axios';
import { MaterialIcon } from '../components/atoms/MaterialIcon';
import { DepartmentFilterSelect } from '../components/molecules/DepartmentFilterSelect';
import type { DepartmentOption } from '../components/molecules/DepartmentSelect';
import { SearchField } from '../components/molecules/SearchField';
import { SectionFilterSelect } from '../components/molecules/SectionFilterSelect';
import { SemesterFilterSelect } from '../components/molecules/SemesterFilterSelect';
import { TimetableSlotModal } from '../components/organisms/TimetableSlotModal';
import {
  TimetableOverviewTable,
  type TimetableTableRow,
} from '../components/organisms/TimetableOverviewTable';

type OverviewResponse = { slots: TimetableTableRow[] };

const AdminTimetable = () => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [slots, setSlots] = useState<TimetableTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<TimetableTableRow | null>(null);
  const [publishing, setPublishing] = useState(false);

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

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (departmentId) params.departmentId = departmentId;
      if (semester) params.semester = semester;
      if (section) params.section = section;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = (await api.get('/admin/timetable/overview', { params })) as {
        data: OverviewResponse;
      };
      setSlots(res.data.slots ?? []);
    } catch (err) {
      setError(String(err));
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [departmentId, semester, section, debouncedSearch]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const selectedDept = departments.find((d) => d.id === departmentId);
  const canManage = Boolean(departmentId);

  const handlePublish = async () => {
    if (!departmentId || !semester || !section) {
      setError('Select department, semester, and section to publish a cohort timetable.');
      return;
    }
    setPublishing(true);
    setError('');
    try {
      await api.put('/admin/timetable/publish', {
        departmentId,
        semester: Number(semester),
        section,
      });
      await loadSlots();
    } catch (err) {
      setError(String(err));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <nav className="flex items-center gap-2 text-outline text-label-md mb-2">
          <span>University</span>
          <MaterialIcon name="chevron_right" size="sm" />
          <span className="text-secondary font-bold">Timetable</span>
        </nav>
        <h1 className="font-outfit text-display-lg-mobile md:text-display-lg text-on-surface">
          Timetable Management
        </h1>
        <p className="text-on-surface-variant text-body-md max-w-2xl">
          View and customize class schedules by department, semester, and section. Each row shows
          slot UID, teacher login, subject, department, section, semester, and timing.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:items-end flex-wrap">
        <DepartmentFilterSelect
          departments={departments}
          value={departmentId}
          onChange={setDepartmentId}
        />
        <SemesterFilterSelect value={semester} onChange={setSemester} />
        <SectionFilterSelect value={section} onChange={setSection} />
        <div className="flex-1 min-w-[240px]">
          <label className="block text-label-md text-outline mb-1.5 ml-2">Search</label>
          <SearchField
            placeholder="UID, teacher, subject, timing..."
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setEditRow(null);
            setModalOpen(true);
          }}
          disabled={!canManage}
          className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-lg text-label-md hover:bg-primary transition-all disabled:opacity-50"
        >
          <MaterialIcon name="add" size="sm" />
          Add Slot
        </button>
        <button
          type="button"
          onClick={() => void handlePublish()}
          disabled={!canManage || !semester || !section || publishing}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-4 py-2 rounded-lg text-label-md hover:bg-primary/20 transition-all disabled:opacity-50"
        >
          <MaterialIcon name="publish" size="sm" />
          {publishing ? 'Publishing...' : 'Publish Cohort'}
        </button>
      </div>

      {!canManage && (
        <p className="text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg px-4 py-3 border border-outline-variant/20">
          Select a specific department (not All Departments) to add, edit, or publish timetable slots.
        </p>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error-container/50 text-error text-body-sm border border-error/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-on-surface-variant text-body-md animate-pulse py-12 text-center">
          Loading timetable...
        </p>
      ) : (
        <TimetableOverviewTable
          rows={slots}
          onAddSlot={
            canManage
              ? () => {
                  setEditRow(null);
                  setModalOpen(true);
                }
              : undefined
          }
          addDisabled={!canManage}
        />
      )}

      <TimetableSlotModal
        open={modalOpen}
        departmentId={departmentId}
        departmentName={
          selectedDept ? `${selectedDept.name} (${selectedDept.code})` : 'Department'
        }
        semesterFilter={semester}
        sectionFilter={section}
        editRow={editRow}
        onClose={() => {
          setModalOpen(false);
          setEditRow(null);
        }}
        onSuccess={() => void loadSlots()}
      />
    </div>
  );
};

export default AdminTimetable;
