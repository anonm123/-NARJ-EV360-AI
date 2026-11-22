'use client';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './chart-tooltip';
import { AXIS, GRID, SERIES } from '@/lib/chart-theme';
import { fmt } from '@/lib/utils';

export default function CarbonChart({ data }: { data: { name: string; kg: number }[] }) {
  return (
            <ResponsiveContainer>
              <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="35%">
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} />
                <YAxis stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.int(v)} width={64} />
                <Tooltip cursor={{ fill: 'rgba(154,175,197,0.06)' }} content={<ChartTooltip valueFormat={(v) => `${fmt.int(v)} kg`} />} />
                <Bar dataKey="kg" name="CO₂" radius={[4, 4, 0, 0]}>
                  {data.map((d, i) => <Cell key={d.name} fill={i === 0 ? SERIES[1] : SERIES[0]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
  );
}
