import { FormEvent, useState } from 'react';
import api from '../lib/axios';

const AdminNotifications = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetType, setTargetType] = useState<'all' | 'student' | 'teacher' | 'department'>('all');
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('');
    setError('');
    try {
      await api.post('/admin/notifications/send', {
        title,
        message,
        priority,
        targetType,
        targetId: targetType === 'all' ? undefined : targetId || undefined,
      });
      setStatus('Notification sent successfully.');
      setTitle('');
      setMessage('');
      setTargetId('');
    } catch (err) {
      setError(err as string);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-white">Admin Notification Center</h1>
      <form onSubmit={submit} className="glass-panel rounded-xl border border-white/10 p-5 space-y-4">
        <input
          className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2 min-h-28"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="bg-navy-800 border border-white/10 rounded px-3 py-2" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="bg-navy-800 border border-white/10 rounded px-3 py-2" value={targetType} onChange={(e) => setTargetType(e.target.value as 'all' | 'student' | 'teacher' | 'department')}>
            <option value="all">All</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="department">Department</option>
          </select>
        </div>
        {targetType !== 'all' && (
          <input
            className="w-full bg-navy-800 border border-white/10 rounded px-3 py-2"
            placeholder="Target ID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          />
        )}
        {error && <p className="text-neon-crimson text-sm">{error}</p>}
        {status && <p className="text-neon-blue text-sm">{status}</p>}
        <button className="px-4 py-2 bg-neon-blue text-navy-900 rounded font-semibold">Send Notification</button>
      </form>
    </div>
  );
};

export default AdminNotifications;
