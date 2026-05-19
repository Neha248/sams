import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { TrendPoint } from './types';

interface StudentTrendChartProps {
  data: TrendPoint[];
  studentName: string;
}

const StudentTrendChart = ({ data, studentName }: StudentTrendChartProps) => (
  <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-navy-900/60 backdrop-blur-md attendance-chart-enter">
    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1 text-center">
      Attendance Trend
    </h3>
    <p className="text-center text-sm text-neon-blue mb-4">{studentName}</p>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis
            allowDecimals={false}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#64748b' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 25, 47, 0.95)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '12px',
              color: '#e2e8f0'
            }}
          />
          <Legend formatter={(v) => <span className="text-slate-300 text-sm capitalize">{v}</span>} />
          <Line
            type="monotone"
            dataKey="present"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="absent"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={{ fill: '#f43f5e', r: 4 }}
            animationDuration={800}
          />
          <Line
            type="monotone"
            dataKey="late"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: '#f59e0b', r: 4 }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default StudentTrendChart;
