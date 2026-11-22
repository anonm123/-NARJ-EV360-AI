'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, Car, Truck, RadioTower } from 'lucide-react';
import { loginAction, registerAction, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function PasswordInput({ id, name, autoComplete, invalid, describedBy, value, onChange }: { id: string; name: string; autoComplete: string; invalid?: boolean; describedBy?: string; value?: string; onChange?: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} required className="pr-12" aria-invalid={invalid} aria-describedby={describedBy} {...(onChange ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg" aria-label={show ? 'Parolayı gizle' : 'Parolayı göster'}>
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}

export function LoginForm({ next, demo, demoPrefill }: { next?: string; demo?: { email: string; label: string }[]; demoPrefill?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [email, setEmail] = useState(demoPrefill ?? '');
  const [password, setPassword] = useState('');
  const e = state.errors ?? {};
  return (
    <>
      <form action={action} className="space-y-5" noValidate>
        <input type="hidden" name="next" value={next ?? '/panel'} />
        <Field label="E-posta" htmlFor="lg-email" error={e.email}>
          <Input id="lg-email" name="email" type="email" autoComplete="email" required value={email} onChange={(ev) => setEmail(ev.target.value)} aria-invalid={!!e.email} aria-describedby={e.email ? 'lg-email-error' : undefined} />
        </Field>
        <Field label="Parola" htmlFor="lg-pw" error={e.password}>
          <PasswordInput id="lg-pw" name="password" autoComplete="current-password" invalid={!!e.password} describedBy={e.password ? 'lg-pw-error' : undefined} value={password} onChange={setPassword} />
        </Field>
        {state.message && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{state.message}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          <LogIn aria-hidden /> {pending ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
      </form>
      {demo && demo.length > 0 && (
        <div className="mt-8 rounded-2xl border border-line p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle">Demo hesaplar</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demo.map((d) => (
              <button key={d.email} type="button" onClick={() => setEmail(d.email)} className="min-h-10 rounded-full border border-line px-3 text-xs font-semibold text-muted hover:border-neon/40 hover:text-fg">
                {d.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-subtle">Parola: <code className="text-fg">NarjDemo!2026</code></p>
        </div>
      )}
      <p className="mt-8 text-center text-sm text-muted">
        Hesabınız yok mu? <Link href="/kayit" className="font-semibold text-neon hover:underline">Kayıt olun</Link>
      </p>
    </>
  );
}

const ROLES = [
  { id: 'driver', label: 'Sürücü', icon: Car },
  { id: 'fleet', label: 'Filo', icon: Truck },
  { id: 'operator', label: 'Operatör', icon: RadioTower },
] as const;

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  // Tüm alanlar kontrollü: React 19'un action sonrası form sıfırlaması kullanıcı girdisini silmez.
  const [role, setRole] = useState<string>('driver');
  const [f, setF] = useState({ name: '', company: '', email: '', password: '', confirm: '', terms: false });
  const set = (k: keyof typeof f) => (v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted">Hesap türü</legend>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <label key={r.id} className={cn('flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border text-sm font-semibold transition-colors', role === r.id ? 'border-neon/60 bg-neon/10 text-fg' : 'border-line text-muted')}>
              <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="sr-only" />
              <r.icon className="size-4" aria-hidden />
              {r.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Ad soyad" htmlFor="rg-name" error={e.name}>
        <Input id="rg-name" name="name" autoComplete="name" value={f.name} onChange={(ev) => set('name')(ev.target.value)} required aria-invalid={!!e.name} />
      </Field>
      {role !== 'driver' && (
        <Field label="Şirket adı" htmlFor="rg-company" error={e.company}>
          <Input id="rg-company" name="company" autoComplete="organization" value={f.company} onChange={(ev) => set('company')(ev.target.value)} aria-invalid={!!e.company} />
        </Field>
      )}
      <Field label="E-posta" htmlFor="rg-email" error={e.email}>
        <Input id="rg-email" name="email" type="email" autoComplete="email" value={f.email} onChange={(ev) => set('email')(ev.target.value)} required aria-invalid={!!e.email} />
      </Field>
      <Field label="Parola" htmlFor="rg-pw" error={e.password} hint="En az 10 karakter; büyük harf, küçük harf ve rakam içermeli.">
        <PasswordInput id="rg-pw" name="password" autoComplete="new-password" invalid={!!e.password} value={f.password} onChange={set('password')} />
      </Field>
      <Field label="Parola tekrar" htmlFor="rg-pw2" error={e.confirm}>
        <PasswordInput id="rg-pw2" name="confirm" autoComplete="new-password" invalid={!!e.confirm} value={f.confirm} onChange={set('confirm')} />
      </Field>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-muted">
        <input type="checkbox" name="terms" checked={f.terms} onChange={(ev) => set('terms')(ev.target.checked)} className="mt-1 size-5 shrink-0 accent-[#00E5D4]" aria-invalid={!!e.terms} />
        <span>
          <Link href="/yasal/kullanim-kosullari" className="text-neon hover:underline">Kullanım Koşulları</Link>’nı ve <Link href="/yasal/kvkk" className="text-neon hover:underline">KVKK Aydınlatma Metni</Link>’ni okudum, kabul ediyorum.
        </span>
      </label>
      {e.terms && <p role="alert" className="-mt-3 text-sm text-danger">{e.terms}</p>}
      {state.message && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{state.message}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <UserPlus aria-hidden /> {pending ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
      </Button>
      <p className="text-center text-sm text-muted">
        Zaten hesabınız var mı? <Link href="/giris" className="font-semibold text-neon hover:underline">Giriş yapın</Link>
      </p>
    </form>
  );
}
