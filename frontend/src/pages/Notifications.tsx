import { useEffect, useState } from 'react';
import api from '../lib/axios';

type Notice = {
  _id: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
};

const Notifications = () => {
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotices = async () => {
      setLoading(true);
      setError('');
      try {
        const res = (await api.get('/student/notifications')) as { data: Notice[] };
        setItems(res.data || []);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        <p className="text-slate-400 text-sm">Latest announcements from admin</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="glass-panel border border-white/10 rounded-lg p-4 text-slate-400">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="glass-panel border border-neon-crimson/30 rounded-lg p-4 text-neon-crimson">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="glass-panel border border-white/10 rounded-lg p-4 text-slate-400">
            No notifications available.
          </div>
        ) : (
          items.map((n) => (
            <div key={n._id} className="glass-panel border border-white/10 rounded-lg p-4">
              <div className="flex justify-between gap-4">
                <h3 className="text-white font-semibold">{n.title}</h3>
                <span className="text-xs text-slate-400 uppercase">{n.priority || 'info'}</span>
              </div>
              <p className="text-slate-300 mt-2">{n.message}</p>
              <p className="text-xs text-slate-500 mt-3">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
