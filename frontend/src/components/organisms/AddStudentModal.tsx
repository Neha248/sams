import { FormEvent, useState } from 'react';
import api from '../../lib/axios';
import { MaterialIcon } from '../atoms/MaterialIcon';

const SECTIONS = ['A', 'B', 'C', 'D'] as const;
const SEMESTERS = [1, 3, 5, 7] as const;

const inputClass =
  'w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-lg px-4 py-2.5 text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

type AddStudentModalProps = {
  open: boolean;
  departmentId: string;
  departmentName: string;
  semesterFilter?: string;
  sectionFilter?: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddStudentModal({
  open,
  departmentId,
  departmentName,
  semesterFilter = '',
  sectionFilter = '',
  onClose,
  onSuccess,
}: AddStudentModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Student@123');
  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState(semesterFilter || '1');
  const [section, setSection] = useState(sectionFilter || 'A');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setFullName('');
    setUserId('');
    setEmail('');
    setPassword('Student@123');
    setRollNumber('');
    setSemester(semesterFilter || '1');
    setSection(sectionFilter || 'A');
    setPhone('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/admin/student/create', {
        fullName: fullName.trim(),
        userId: userId.trim(),
        email: email.trim(),
        password,
        rollNumber: rollNumber.trim(),
        departmentId,
        semester: Number(semester),
        section,
        phone: phone.trim() || undefined,
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg glass-card rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="font-outfit text-headline-md text-on-surface">Add Student</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
              {departmentName} — new student account and profile
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-label-md text-outline ml-1">Full name</label>
              <input
                className={inputClass}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-outline ml-1">Login ID</label>
              <input
                className={inputClass}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="STU051"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-outline ml-1">Roll number</label>
              <input
                className={inputClass}
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="CS25A051"
                required
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-label-md text-outline ml-1">Email</label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@sams.edu"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-outline ml-1">Password</label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-outline ml-1">Phone (optional)</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-outline ml-1">Semester</label>
              <select
                className={inputClass}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                required
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-outline ml-1">Section</label>
              <select
                className={inputClass}
                value={section}
                onChange={(e) => setSection(e.target.value)}
                required
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-body-sm text-error bg-error-container/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-lg text-label-md hover:bg-primary transition-all disabled:opacity-50"
            >
              <MaterialIcon name="person_add" size="sm" />
              {submitting ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
