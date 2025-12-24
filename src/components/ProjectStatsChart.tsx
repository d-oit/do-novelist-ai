import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Datum {
  name: string;
  value: number;
}

interface ProjectStatsChartProps {
  data: Datum[];
  colors: string[];
  yWidth?: number;
}

const ProjectStatsChart: React.FC<ProjectStatsChartProps> = ({ data, colors, yWidth = 60 }) => {
  return (
    <ResponsiveContainer width='100%' height={96} minHeight={96}>
      <BarChart layout='vertical' data={data} barSize={12}>
        <XAxis type='number' hide domain={[0, 100]} />
        <YAxis
          type='category'
          dataKey='name'
          tick={{ fill: '#64748b', fontSize: 10 }}
          width={yWidth}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            color: '#f1f5f9',
            fontSize: '12px',
          }}
        />
        <Bar dataKey='value' radius={[0, 4, 4, 0]}>
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProjectStatsChart;
