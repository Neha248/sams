import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type StudentAttendanceChartProps = {
  present: number;
  absent: number;
};

export function StudentAttendanceChart({ present, absent }: StudentAttendanceChartProps) {
  const data = [
    { name: 'Attendance', Present: present, Absent: absent },
  ];

  return (
    <div className="glass-card rounded-xl p-6">
      <h3 className="font-outfit text-headline-md text-on-surface mb-1">Attendance Overview</h3>
      <p className="text-body-sm text-on-surface-variant mb-6">
        Combined present vs absent counts for students currently shown in the table.
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,35,111,0.08)" />
            <XAxis dataKey="name" tick={{ fill: '#444651', fontSize: 12 }} />
            <YAxis tick={{ fill: '#444651', fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(0,35,111,0.1)',
                borderRadius: 8,
              }}
            />
            <Legend />
            <Bar dataKey="Present" fill="#0058be" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Absent" fill="#ba1a1a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
