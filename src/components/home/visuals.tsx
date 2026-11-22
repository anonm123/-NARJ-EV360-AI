/* Bento kartları için küçük, özgün SVG/CSS görselleri — her kart farklı kompozisyon. */
import { cn } from '@/lib/utils';

export function MiniMap({ path, dots, className }: { path: string; dots: { x: number; y: number; hot?: boolean }[]; className?: string }) {
  return (
    <svg viewBox="0 0 1000 334" className={cn('w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="mm-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f2236" />
          <stop offset="1" stopColor="#0a1626" />
        </linearGradient>
      </defs>
      <path d={path} fill="url(#mm-fill)" stroke="rgba(0,184,255,0.45)" strokeWidth="1.5" />
      {dots.map((d, i) => (
        <g key={i}>
          {d.hot && <circle cx={d.x} cy={d.y} r="14" fill="#00E5D4" opacity="0.15" className="origin-center" />}
          <circle cx={d.x} cy={d.y} r={d.hot ? 5 : 3} fill={d.hot ? '#00E5D4' : '#00B8FF'} opacity={d.hot ? 1 : 0.7} />
        </g>
      ))}
    </svg>
  );
}

export function RouteLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 160" className={cn('w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="rl-g" x1="0" x2="1">
          <stop offset="0" stopColor="#00B8FF" />
          <stop offset="1" stopColor="#00E5D4" />
        </linearGradient>
      </defs>
      <path d="M20 130 C 90 120, 110 40, 190 60 S 300 140, 380 30" fill="none" stroke="rgba(154,175,197,0.18)" strokeWidth="10" strokeLinecap="round" />
      <path d="M20 130 C 90 120, 110 40, 190 60 S 300 140, 380 30" fill="none" stroke="url(#rl-g)" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 8" className="animate-dash motion-reduce:animate-none" />
      {[
        [20, 130],
        [190, 60],
        [380, 30],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="10" fill="#050A12" stroke={i === 1 ? '#00E5D4' : '#00B8FF'} strokeWidth="3" />
          {i === 1 && <path d={`M${x - 3} ${y - 5}h4l-2 4h4l-6 7 1.5-5h-3z`} fill="#00E5D4" />}
        </g>
      ))}
    </svg>
  );
}

export function Gauge({ value = 72, className }: { value?: number; className?: string }) {
  const r = 52;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 140 84" className={cn('w-full', className)} aria-hidden>
      <defs>
        <linearGradient id="g-g" x1="0" x2="1">
          <stop offset="0" stopColor="#00B8FF" />
          <stop offset="1" stopColor="#00E5D4" />
        </linearGradient>
      </defs>
      <path d="M18 74 A52 52 0 0 1 122 74" fill="none" stroke="rgba(154,175,197,0.15)" strokeWidth="10" strokeLinecap="round" />
      <path d="M18 74 A52 52 0 0 1 122 74" fill="none" stroke="url(#g-g)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} />
      <text x="70" y="68" textAnchor="middle" className="fill-fg font-display" fontSize="22" fontWeight="600">
        %{value}
      </text>
    </svg>
  );
}

export function Bars({ className }: { className?: string }) {
  const v = [38, 52, 44, 66, 58, 74, 69, 88];
  return (
    <div className={cn('flex h-24 items-end gap-1.5', className)} aria-hidden>
      {v.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-[linear-gradient(180deg,#00E5D4,rgba(0,184,255,0.25))]" style={{ height: `${h}%`, opacity: 0.45 + i * 0.07 }} />
      ))}
    </div>
  );
}

export function ChatBubbles({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2 text-[13px]', className)} aria-hidden>
      <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-electric/15 px-3 py-2 text-fg">Ankara’ya %30 ile çıkabilir miyim?</div>
      <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md border border-line bg-bg-2 px-3 py-2 text-muted">
        Bolu civarında <span className="text-neon">1 kısa durak</span> öneriyorum — yaklaşık 18 dk.
      </div>
    </div>
  );
}

export function CardStack({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-28', className)} aria-hidden>
      <div className="absolute left-6 top-4 h-20 w-36 rotate-[-8deg] rounded-xl border border-line bg-surface-3" />
      <div className="absolute left-12 top-2 h-20 w-36 rotate-[4deg] rounded-xl border border-neon/40 bg-[linear-gradient(135deg,#133049,#071422)] shadow-[0_10px_30px_-10px_rgba(0,229,212,0.5)]">
        <div className="m-3 h-3 w-6 rounded bg-neon/70" />
        <p className="mx-3 font-display text-xs font-bold tracking-widest text-fg">NAR-J PASS</p>
      </div>
    </div>
  );
}
