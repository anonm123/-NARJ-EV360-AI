'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUp, Bot, User } from 'lucide-react';
import { answer, type AssistantReply } from '@/lib/assistant/engine';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/lib/utils';

type Msg = { id: number; role: 'user' | 'bot'; text: string; links?: AssistantReply['links'] };
const SUGGESTIONS = ['İstanbul’dan Antalya’ya %80 ile', '%15’ten %80’e şarj ne kadar tutar?', 'Ankara’da istasyon', 'Yıllık karbon tasarrufum ne olur?', 'Abonelik planları'];

export function AssistantChat() {
  const reduce = useReducedMotion();
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: 'bot', text: 'Merhaba, ben NAR-J Asistan. Rota, şarj maliyeti, istasyonlar ve karbon tasarrufu hakkında sorularınızı platformun hesaplama motoruyla yanıtlarım.' }]);
  const [value, setValue] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
  }, [msgs, typing, reduce]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setMsgs((m) => [...m, { id: Date.now(), role: 'user', text: q }]);
    setValue('');
    setTyping(true);
    setTimeout(() => {
      const r = answer(q);
      setMsgs((m) => [...m, { id: Date.now() + 1, role: 'bot', text: r.text, links: r.links }]);
      setTyping(false);
    }, reduce ? 0 : 550);
  };

  return (
    <div className="glass flex h-[min(720px,78svh)] min-h-[480px] flex-col overflow-hidden rounded-[28px]">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,#00B8FF,#00E5D4)] text-bg">
            <Bot className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-semibold">NAR-J Asistan</p>
            <p className="text-xs text-subtle">Kural tabanlı · tarayıcıda çalışır</p>
          </div>
        </div>
        <StatusBadge status="beta" />
      </div>
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" role="log" aria-live="polite" aria-label="Sohbet geçmişi">
        <AnimatePresence initial={false}>
          {msgs.map((m) => (
            <motion.div key={m.id} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-full border border-line', m.role === 'bot' ? 'text-neon' : 'text-muted')}>
                {m.role === 'bot' ? <Bot className="size-4" aria-hidden /> : <User className="size-4" aria-hidden />}
                <span className="sr-only">{m.role === 'bot' ? 'Asistan' : 'Siz'}:</span>
              </span>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed', m.role === 'user' ? 'rounded-tr-md bg-electric/15 text-fg' : 'rounded-tl-md border border-line bg-bg-2/80 text-fg/90')}>
                {m.text}
                {m.links && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.links.map((l) => (
                      <Link key={l.href} href={l.href} className="inline-flex min-h-9 items-center rounded-full border border-neon/40 px-3 text-xs font-semibold text-neon hover:bg-neon/10">
                        {l.label} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex items-center gap-1.5 pl-11" aria-label="Asistan yazıyor">
            {[0, 1, 2].map((i) => <span key={i} className="size-2 animate-bounce rounded-full bg-neon/70" style={{ animationDelay: `${i * 120}ms` }} />)}
          </div>
        )}
      </div>
      <div className="border-t border-line p-3 sm:p-4">
        <div className="no-scrollbar -mx-1 mb-3 flex gap-2 overflow-x-auto px-1">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => send(s)} className="min-h-10 shrink-0 rounded-full border border-line px-3.5 text-xs font-medium text-muted transition-colors hover:border-neon/40 hover:text-fg">
              {s}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(value); }} className="flex items-center gap-2">
          <label htmlFor="as-in" className="sr-only">Mesajınız</label>
          <input id="as-in" value={value} onChange={(e) => setValue(e.target.value)} maxLength={500} placeholder="Sorunuzu yazın…" autoComplete="off" className="min-h-12 min-w-0 flex-1 rounded-full border border-line bg-bg-2 px-5 text-fg outline-none placeholder:text-subtle focus:border-neon/60" />
          <button type="submit" disabled={!value.trim() || typing} className="grid size-12 shrink-0 place-items-center rounded-full bg-[linear-gradient(110deg,#00B8FF,#00E5D4)] text-bg transition-opacity disabled:opacity-40" aria-label="Gönder">
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}
