import { useEffect, useState } from 'react';
import api from '../lib/axios';

type Student = {
  _id: string;
  userId?: { _id?: string; fullName?: string; userId?: string; email?: string; isActive?: boolean };
  rollNumber?: string;
  semester?: number;
  section?: string;
};

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await api.get('/admin/students?limit=100')) as { data: { students: Student[] } };
      setStudents(res.data.students || []);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const deactivate = async (id: string) => {
    try {
      await api.delete(`/admin/student/${id}`);
      await load();
    } catch (err) {
      setError(err as string);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Student Management</h1>
      {loading ? (
        <div className="text-slate-400">Loading students...</div>
      ) : error ? (
        <div className="text-neon-crimson">{error}</div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-300 text-sm">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">User ID</th>
                <th className="px-4 py-3">Roll</th>
                <th className="px-4 py-3">Sem/Section</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-t border-white/5">
                  <td className="px-4 py-3">{s.userId?.fullName || '-'}</td>
                  <td className="px-4 py-3">{s.userId?.userId || '-'}</td>
                  <td className="px-4 py-3">{s.rollNumber || '-'}</td>
                  <td className="px-4 py-3">{s.semester || '-'} / {s.section || '-'}</td>
                  <td className="px-4 py-3">{s.userId?.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-3">
                    {s.userId?._id && s.userId?.isActive ? (
                      <button onClick={() => deactivate(s.userId!._id!)} className="text-neon-crimson">
                        Deactivate
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;
