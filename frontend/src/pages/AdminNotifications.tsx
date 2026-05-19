import { FormEvent, useEffect, useMemo, useState } from 'react';
import api from '../lib/axios';
import { MaterialIcon } from '../components/atoms/MaterialIcon';
import { DepartmentSelect } from '../components/molecules/DepartmentSelect';
import type { DepartmentOption } from '../components/molecules/DepartmentSelect';

type RecipientScope = 'all' | 'student' | 'teacher';

type PopulatedUser = {
  _id: string;
  fullName: string;
  userId: string;
  isActive?: boolean;
};

type StudentProfileRow = {
  _id: string;
  userId: PopulatedUser | string;
  departmentId?: { _id: string; name: string; code: string };
};

type TeacherProfileRow = {
  _id: string;
  userId: PopulatedUser | string;
  employeeId: string;
  departments?: Array<{ _id: string; name: string; code: string } | string>;
};

type RecipientOption = {
  userId: string;
  label: string;
};

const AdminNotifications = () => {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scope, setScope] = useState<RecipientScope>('all');
  const [departmentId, setDepartmentId] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/admin/departments')
      .then((res) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list = ((res as any).data ?? []) as Array<{ _id: string; name: string; code: string }>;
        const mapped = list.map((d) => ({ id: d._id, code: d.code, name: d.name }));
        setDepartments(mapped);
        if (mapped.length > 0) {
          setDepartmentId((prev) => prev || mapped[0].id);
        }
      })
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    setRecipientUserId('');
    if (scope === 'all' || !departmentId) {
      setRecipients([]);
      return;
    }

    const loadRecipients = async () => {
      setLoadingRecipients(true);
      setError('');
      try {
        if (scope === 'student') {
          const res = (await api.get('/admin/students', {
            params: { department: departmentId, limit: 500, page: 1 },
          })) as { data: { students: StudentProfileRow[] } };
          const options = (res.data.students ?? [])
            .map((row) => {
              const user = row.userId;
              if (!user || typeof user === 'string') return null;
              if (user.isActive === false) return null;
              return {
                userId: user._id,
                label: `${user.fullName} (${user.userId})`,
              };
            })
            .filter((o): o is RecipientOption => o !== null);
          setRecipients(options);
        } else {
          const res = (await api.get('/admin/teachers')) as { data: TeacherProfileRow[] };
          const options = (res.data ?? [])
            .filter((row) => {
              const depts = row.departments ?? [];
              return depts.some((d) =>
                typeof d === 'string' ? d === departmentId : d._id === departmentId
              );
            })
            .map((row) => {
              const user = row.userId;
              if (!user || typeof user === 'string') return null;
              if (user.isActive === false) return null;
              return {
                userId: user._id,
                label: `${user.fullName} (${user.userId})`,
              };
            })
            .filter((o): o is RecipientOption => o !== null);
          setRecipients(options);
        }
      } catch (err) {
        setRecipients([]);
        setError(String(err));
      } finally {
        setLoadingRecipients(false);
      }
    };

    void loadRecipients();
  }, [scope, departmentId]);

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === departmentId),
    [departments, departmentId]
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (scope !== 'all' && !recipientUserId) {
      setError('Select a recipient from the list.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/admin/notifications/send', {
        title: title.trim(),
        message: message.trim(),
        priority: 'normal',
        targetType: scope,
        targetId: scope === 'all' ? undefined : recipientUserId,
      });
      setStatus(
        scope === 'all'
          ? 'Global notification sent to all users.'
          : `Notification sent to the selected ${scope}.`
      );
      setTitle('');
      setMessage('');
      setRecipientUserId('');
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <nav className="flex items-center gap-2 text-outline text-label-md mb-2">
          <span>University</span>
          <MaterialIcon name="chevron_right" size="sm" />
          <span className="text-secondary font-bold">Notifications</span>
        </nav>
        <h1 className="font-outfit text-display-lg-mobile md:text-display-lg text-on-surface">
          Notifications
        </h1>
        <p className="text-on-surface-variant text-body-md max-w-2xl">
          Send announcements to all users, or target a specific student or teacher by department.
        </p>
      </div>

      <form onSubmit={submit} className="glass-card rounded-xl p-6 space-y-6 max-w-2xl">
        <div className="space-y-2">
          <label className="block text-label-md text-outline ml-2">Title</label>
          <input
            className="w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2.5 text-body-sm text-on-surface focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-label-md text-outline ml-2">Message</label>
          <textarea
            className="w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2.5 text-body-sm text-on-surface min-h-32 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-y"
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-label-md text-outline ml-2 mb-1">Send to</legend>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: 'all' as const, label: 'Global', icon: 'public' },
                { value: 'student' as const, label: 'Student', icon: 'school' },
                { value: 'teacher' as const, label: 'Teacher', icon: 'person' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all ${
                  scope === opt.value
                    ? 'bg-secondary text-on-secondary border-secondary'
                    : 'bg-white/60 border-primary/20 text-on-surface hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={opt.value}
                  checked={scope === opt.value}
                  onChange={() => setScope(opt.value)}
                  className="sr-only"
                />
                <MaterialIcon name={opt.icon} size="sm" />
                <span className="text-label-md font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {scope !== 'all' && departments.length > 0 && (
          <div className="space-y-4 pt-2 border-t border-outline-variant/20">
            <DepartmentSelect
              departments={departments}
              value={departmentId}
              onChange={setDepartmentId}
            />
            {selectedDept && (
              <p className="text-body-sm text-on-surface-variant ml-2">
                Showing {scope === 'student' ? 'students' : 'teachers'} in{' '}
                <span className="font-semibold text-on-surface">
                  {selectedDept.name} ({selectedDept.code})
                </span>
              </p>
            )}
            <div className="space-y-2">
              <label className="block text-label-md text-outline ml-2">
                Select {scope === 'student' ? 'student' : 'teacher'}
              </label>
              <div className="relative">
                <select
                  value={recipientUserId}
                  onChange={(e) => setRecipientUserId(e.target.value)}
                  disabled={loadingRecipients || recipients.length === 0}
                  required
                  className="appearance-none w-full bg-white/60 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2.5 pr-10 text-body-sm text-primary focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="">
                    {loadingRecipients
                      ? 'Loading...'
                      : recipients.length === 0
                        ? `No ${scope}s in this department`
                        : `Choose a ${scope}`}
                  </option>
                  {recipients.map((r) => (
                    <option key={r.userId} value={r.userId}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                  <MaterialIcon name="unfold_more" size="sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {scope === 'all' && (
          <p className="text-body-sm text-on-surface-variant bg-surface-container-low rounded-lg px-4 py-3 border border-outline-variant/20">
            This notification will be visible to every student and teacher in the system.
          </p>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-error-container/50 text-error text-body-sm border border-error/20">
            {error}
          </div>
        )}
        {status && (
          <div className="p-3 rounded-lg bg-secondary-container/50 text-on-secondary-container text-body-sm border border-secondary/20">
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 bg-secondary text-on-secondary px-5 py-2.5 rounded-lg text-label-md hover:bg-primary transition-all disabled:opacity-50"
        >
          <MaterialIcon name="send" size="sm" />
          {submitting ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
};

export default AdminNotifications;