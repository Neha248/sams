import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import type { ChartSegment } from './types';

interface AttendanceOverviewChartProps {
  title: string;
  data: ChartSegment[];
}

const AttendanceOverviewChart = ({ title, data }: AttendanceOverviewChartProps) => (
  <div className="glass-panel rounded-2xl border border-white/10 p-5 bg-navy-900/60 backdrop-blur-md attendance-chart-enter">
    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">
      {title}
    </h3>
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={4}
            animationBegin={0}
            animationDuration={900}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(10, 25, 47, 0.95)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              borderRadius: '12px',
              color: '#e2e8f0',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.15)'
            }}
          />
          <Legend
            verticalAlign="bottom"
            formatter={(value) => (
              <span className="text-slate-300 text-sm">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default AttendanceOverviewChart;
