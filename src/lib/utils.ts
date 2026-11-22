import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const trNumber = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });
const trInt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const trCurrency = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
const trCurrency2 = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 });

export const fmt = {
  num: (n: number) => trNumber.format(n),
  int: (n: number) => trInt.format(n),
  try: (n: number) => trCurrency.format(n),
  try2: (n: number) => trCurrency2.format(n),
  pct: (n: number) => `%${trInt.format(n)}`,
  duration(minutes: number) {
    const m = Math.round(minutes);
    if (m < 60) return `${m} dk`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h} sa ${r} dk` : `${h} sa`;
  },
  compactTry(n: number) {
    if (Math.abs(n) >= 1e9) return `₺${trNumber.format(n / 1e9)} Mr`;
    if (Math.abs(n) >= 1e6) return `₺${trNumber.format(n / 1e6)} Mn`;
    if (Math.abs(n) >= 1e3) return `₺${trNumber.format(n / 1e3)} B`;
    return `₺${trInt.format(n)}`;
  },
};

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
