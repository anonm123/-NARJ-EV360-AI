'use client';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './chart-tooltip';
import { AXIS, GRID, SERIES } from '@/lib/chart-theme';
import { fmt } from '@/lib/utils';
import type { RevenueRow } from '@/lib/calc/revenue';

const STREAMS = [
  { key: 'subscription', name: 'Sürücü abonelikleri' },
  { key: 'fleetSaas', name: 'Filo SaaS' },
  { key: 'transactions', name: 'Şarj işlem komisyonu' },
  { key: 'operatorApi', name: 'Operatör API' },
] as const;

export default function RevenueChart({ rows }: { rows: RevenueRow[] }) {
  return (
              <ResponsiveContainer>
                <BarChart data={rows.map((r) => ({ ...r, label: `${r.year}. yıl` }))} margin={{ left: 0, right: 8, top: 8 }} barCategoryGap="28%">
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} />
                  <YAxis stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} tickFormatter={(v) => fmt.compactTry(v)} width={80} />
                  <Tooltip cursor={{ fill: 'rgba(154,175,197,0.06)' }} content={<ChartTooltip valueFormat={(v) => fmt.compactTry(v)} />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9AAFC5', paddingTop: 12 }} iconType="circle" iconSize={8} />
                  {STREAMS.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} name={s.name} stackId="r" fill={SERIES[i]} stroke="#0D1624" strokeWidth={2} radius={i === STREAMS.length - 1 ? [4, 4, 0, 0] : 0} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
  );
}
