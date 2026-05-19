import { FormEvent, useEffect, useState } from 'react';
import api from '../../lib/axios';
import { MaterialIcon } from '../atoms/MaterialIcon';
import type { TimetableTableRow } from './TimetableOverviewTable';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export type SubjectOption = { _id: string; name: string; code: string; semester?: number };
export type TeacherOption = {
  _id: string;
  fullName: string;
  userId: string;
};

type TimetableSlotModalProps = {
  open: boolean;
  departmentId: string;
  departmentName: string;
  semesterFilter: string;
  sectionFilter: string;
  editRow?: TimetableTableRow | null;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export function TimetableSlotModal({
  open,
  departmentId,
  departmentName,
  semesterFilter,
  sectionFilter,
  editRow,
  onClose,
  onSuccess,
}: TimetableSlotModalProps) {
  const isEdit = Boolean(editRow);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');
  const [day, setDay] = useState<(typeof DAYS)[number]>('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [roomNo, setRoomNo] = useState('301');

  useEffect(() => {
    if (!open) return;
    if (editRow) {
      setSemester(String(editRow.semester));
      setSection(editRow.section);
      setDay((editRow.day as (typeof DAYS)[number]) || 'Monday');
      setStartTime(editRow.startTime);
      setEndTime(editRow.endTime);
      setRoomNo(editRow.roomNo);
      setSubjectId(editRow.subjectId);
      setTeacherId(editRow.teacherId);
    } else {
      setSemester(semesterFilter || '1');
      setSection(sectionFilter || 'A');
      setDay('Monday');
      setStartTime('09:00');
      setEndTime('10:00');
      setRoomNo('301');
      setSubjectId('');
      setTeacherId('');
    }
    setError('');
  }, [open, editRow, semesterFilter, sectionFilter]);

  useEffect(() => {
    if (!open || !departmentId) return;
    setLoading(true);
    const params: Record<string, string> = { departmentId };
    if (semester) params.semester = semester;

    Promise.all([
      api.get('/admin/subjects', { params }),
      api.get('/admin/teachers'),
    ])
      .then(([subRes, teachRes]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subList = ((subRes as any).data ?? []) as SubjectOption[];
        setSubjects(subList);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teachRaw = ((teachRes as any).data ?? []) as Array<{
          userId?: { _id?: string; fullName?: string; userId?: string; isActive?: boolean };
        }>;
        const teachList: TeacherOption[] = teachRaw
          .filter((t) => t.userId?.isActive !== false)
          .map((t) => ({
            _id: t.userId!._id!,
            fullName: t.userId!.fullName ?? 'Unknown',
            userId: t.userId!.userId ?? '—',
          }));
        setTeachers(teachList);
        if (!isEdit && subList.length && !subjectId) setSubjectId(subList[0]._id);
        if (!isEdit && teachList.length && !teacherId) setTeacherId(teachList[0]._id);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [open, departmentId, semester, isEdit, subjectId, teacherId]);

  const handleClose = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!departmentId) {
      setError('Select a specific department before adding a slot.');
      return;
    }
    setSubmitting(true);
    setError('');
    const body = {
      departmentId,
      semester: Number(semester),
      section,
      day,
      startTime,
      endTime,
      subjectId,
      teacherId,
      roomNo,
    };
    try {
      if (isEdit && editRow) {
        await api.put(`/admin/timetable/${editRow.id}`, body);
      } else {
        await api.post('/admin/timetable/create', body);
      }
      onSuccess();
      handleClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/40">
        <div className="p-6 border-b border-outline-variant/20 relative">
          <h2 className="font-outfit text-headline-md text-on-surface">
            {isEdit ? 'Edit Timetable Slot' : 'Add Timetable Slot'}
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {departmentName} — configure teacher, subject, cohort, and timing.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error ? (
            <p className="text-error text-body-sm bg-error-container/30 rounded-lg px-3 py-2">{error}</p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline mb-1 ml-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className={inputClass}
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-md text-outline mb-1 ml-1">Section</label>
              <select value={section} onChange={(e) => setSection(e.target.value)} className={inputClass} required>
                {['A', 'B', 'C', 'D'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-label-md text-outline mb-1 ml-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-label-md text-outline mb-1 ml-1">Teacher</label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} ({t.userId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-label-md text-outline mb-1 ml-1">Day</label>
              <select value={day} onChange={(e) => setDay(e.target.value as (typeof DAYS)[number])} className={inputClass}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-label-md text-outline mb-1 ml-1">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-label-md text-outline mb-1 ml-1">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-label-md text-outline mb-1 ml-1">Room</label>
            <input
              type="text"
              value={roomNo}
              onChange={(e) => setRoomNo(e.target.value)}
              className={inputClass}
              placeholder="e.g. 301"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface text-label-md hover:bg-surface-container-low"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-on-secondary text-label-md font-medium hover:bg-primary disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



