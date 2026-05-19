import { FormEvent, useEffect, useState } from 'react';
import api from '../../lib/axios';
import { MaterialIcon } from '../atoms/MaterialIcon';

export type SubjectOption = { _id: string; name: string; code: string };

type AssignTeacherModalProps = {
  open: boolean;
  departmentId: string;
  departmentName: string;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export function AssignTeacherModal({
  open,
  departmentId,
  departmentName,
  onClose,
  onSuccess,
}: AssignTeacherModalProps) {
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Teacher@123');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !departmentId) return;
    setError('');
    setLoadingSubjects(true);
    api
      .get('/admin/subjects', { params: { departmentId } })
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = ((res as any).data ?? []) as SubjectOption[];
        setSubjects(list);
        if (list.length === 1) setSelectedSubjects([list[0]._id]);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoadingSubjects(false));
  }, [open, departmentId]);

  const resetForm = () => {
    setFullName('');
    setUserId('');
    setEmail('');
    setPassword('Teacher@123');
    setEmployeeId('');
    setSelectedSubjects([]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/admin/teacher/create', {
        fullName,
        userId,
        email,
        password,
        employeeId,
        departments: [departmentId],
        subjects: selectedSubjects,
      });
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-teacher-title"
        className="relative w-full max-w-lg glass-card rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 id="assign-teacher-title" className="font-outfit text-headline-md text-on-surface">
              Assign New Teacher
            </h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Department: <span className="font-medium text-primary">{departmentName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-outline"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-container/50 text-error text-body-sm border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-md text-outline mb-1.5">Full Name</label>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Dr. Jane Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md text-outline mb-1.5">User ID</label>
              <input
                className={inputClass}
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                required
                placeholder="TCH006"
              />
            </div>
            <div>
              <label className="block text-label-md text-outline mb-1.5">Employee ID</label>
              <input
                className={inputClass}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                required
                placeholder="EMP006"
              />
            </div>
          </div>
          <div>
            <label className="block text-label-md text-outline mb-1.5">Email</label>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@sams.edu"
            />
          </div>
          <div>
            <label className="block text-label-md text-outline mb-1.5">Password</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-label-md text-outline mb-2">Subjects</label>
            {loadingSubjects ? (
              <p className="text-body-sm text-on-surface-variant">Loading subjects...</p>
            ) : subjects.length === 0 ? (
              <p className="text-body-sm text-error">
                No subjects in this department. Create a subject first via admin tools.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const selected = selectedSubjects.includes(s._id);
                  return (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => toggleSubject(s._id)}
                      className={`px-3 py-1.5 rounded-lg text-body-sm border transition-all ${
                        selected
                          ? 'bg-secondary text-on-secondary border-secondary'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/30'
                      }`}
                    >
                      {s.name} ({s.code})
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low transition-all text-body-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedSubjects.length === 0 || subjects.length === 0}
              className="flex-1 py-2.5 rounded-lg bg-secondary text-on-secondary font-medium hover:bg-primary transition-all disabled:opacity-50 text-body-sm"
            >
              {submitting ? 'Creating...' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
