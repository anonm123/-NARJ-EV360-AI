'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './chart-tooltip';
import { AXIS, GRID, SINGLE } from '@/lib/chart-theme';
import { fmt } from '@/lib/utils';
import type { ChargeCurvePoint } from '@/lib/calc/charging';

export default function CurveChart({ data, start, target }: { data: ChargeCurvePoint[]; start: number; target: number }) {
  return (
                <ResponsiveContainer>
                  <AreaChart data={data} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cc-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={SINGLE} stopOpacity={0.35} />
                        <stop offset="1" stopColor={SINGLE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="soc" type="number" domain={[start, target]} tickFormatter={(v) => `%${Math.round(v)}`} stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} />
                    <YAxis stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} unit=" kW" width={64} />
                    <Tooltip content={<ChartTooltip labelFormat={(l) => `Şarj %${Math.round(Number(l))}`} valueFormat={(v) => `${fmt.num(v)} kW`} />} cursor={{ stroke: 'rgba(154,175,197,0.4)' }} />
                    <Area type="monotone" dataKey="kw" name="Güç" stroke={SINGLE} strokeWidth={2} fill="url(#cc-area)" isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
  );
}
