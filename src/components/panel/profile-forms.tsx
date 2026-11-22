'use client';

import { useActionState } from 'react';
import { changePasswordAction, updateProfileAction } from '@/app/actions/panel';
import type { FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ProfileForm({ name, company }: { name: string; company?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfileAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Ad soyad" htmlFor="pf-n" error={e.name}><Input id="pf-n" name="name" defaultValue={name} autoComplete="name" /></Field>
      <Field label="Şirket" htmlFor="pf-c" error={e.company}><Input id="pf-c" name="company" defaultValue={company} autoComplete="organization" /></Field>
      {state.message && <p role="status" className="text-sm text-ok">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Kaydediliyor…' : 'Kaydet'}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePasswordAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Mevcut parola" htmlFor="pw-c" error={e.current}><Input id="pw-c" name="current" type="password" autoComplete="current-password" /></Field>
      <Field label="Yeni parola" htmlFor="pw-n" error={e.password} hint="En az 10 karakter; büyük/küçük harf ve rakam."><Input id="pw-n" name="password" type="password" autoComplete="new-password" /></Field>
      <Field label="Yeni parola tekrar" htmlFor="pw-r" error={e.confirm}><Input id="pw-r" name="confirm" type="password" autoComplete="new-password" /></Field>
      {state.message && <p role="status" className={state.ok ? 'text-sm text-ok' : 'text-sm text-danger'}>{state.message}</p>}
      <Button type="submit" variant="secondary" disabled={pending}>{pending ? 'Güncelleniyor…' : 'Parolayı değiştir'}</Button>
    </form>
  );
}
