'use client';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from './chart-tooltip';
import { AXIS, GRID, SINGLE } from '@/lib/chart-theme';
import { fmt } from '@/lib/utils';

export default function SocChart({ data, arrival }: { data: { km: number; soc: number }[]; arrival: number }) {
  return (
              <ResponsiveContainer>
                <AreaChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rp-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={SINGLE} stopOpacity={0.35} />
                      <stop offset="1" stopColor={SINGLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="km" type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${Math.round(v)} km`} stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `%${v}`} stroke={AXIS.stroke} tick={AXIS.tick} tickLine={false} axisLine={false} width={52} />
                  <ReferenceLine y={arrival} stroke="#FFB547" strokeDasharray="4 4" />
                  <Tooltip content={<ChartTooltip labelFormat={(l) => `${fmt.int(Number(l))}. km`} valueFormat={(v) => `%${fmt.num(v)}`} />} />
                  <Area type="linear" dataKey="soc" name="Şarj" stroke={SINGLE} strokeWidth={2} fill="url(#rp-area)" />
                </AreaChart>
              </ResponsiveContainer>
  );
}
