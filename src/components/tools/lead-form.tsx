'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { submitLeadAction } from '@/app/actions/panel';
import type { FormState } from '@/app/actions/auth';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LeadForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(submitLeadAction, {});
  if (state.ok) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center" role="status">
        <CheckCircle2 className="size-12 text-ok" aria-hidden />
        <p className="font-display text-xl font-semibold">Talebiniz alındı</p>
        <p className="max-w-md text-muted">{state.message}</p>
      </div>
    );
  }
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Ad soyad" htmlFor="ld-name" error={e.name}>
        <Input id="ld-name" name="name" autoComplete="name" required defaultValue={v.name} aria-invalid={!!e.name} aria-describedby={e.name ? 'ld-name-error' : undefined} />
      </Field>
      <Field label="E-posta" htmlFor="ld-email" error={e.email}>
        <Input id="ld-email" name="email" type="email" autoComplete="email" required defaultValue={v.email} aria-invalid={!!e.email} aria-describedby={e.email ? 'ld-email-error' : undefined} />
      </Field>
      <Field label="Şirket (opsiyonel)" htmlFor="ld-company" error={e.company}>
        <Input id="ld-company" name="company" autoComplete="organization" defaultValue={v.company} />
      </Field>
      <Field label="İlgi alanı" htmlFor="ld-interest" error={e.interest}>
        <Select id="ld-interest" name="interest" defaultValue={v.interest ?? 'surucu'}>
          <option value="surucu">Bireysel sürücü</option>
          <option value="filo">Filo / lojistik</option>
          <option value="operator">Şarj operatörü</option>
          <option value="yatirimci">Yatırımcı</option>
          <option value="basin">Basın</option>
          <option value="diger">Diğer</option>
        </Select>
      </Field>
      <Field label="Mesajınız (opsiyonel)" htmlFor="ld-msg" error={e.message} className="sm:col-span-2">
        <Textarea id="ld-msg" name="message" maxLength={2000} defaultValue={v.message} />
      </Field>
      <div className="hidden" aria-hidden>
        <label htmlFor="ld-website">Web sitesi</label>
        <input id="ld-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="sm:col-span-2">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-muted">
          <input type="checkbox" name="consent" className="mt-1 size-5 shrink-0 accent-[#00E5D4]" aria-invalid={!!e.consent} />
          <span>
            <Link href="/yasal/kvkk" className="text-neon underline-offset-2 hover:underline">KVKK Aydınlatma Metni</Link>’ni okudum; erken erişim bilgilendirmeleri için iletişim bilgilerimin işlenmesini kabul ediyorum.
          </span>
        </label>
        {e.consent && <p role="alert" className="mt-1 text-sm text-danger">{e.consent}</p>}
      </div>
      {state.message && <p role="alert" className="text-sm text-danger sm:col-span-2">{state.message}</p>}
      <Button type="submit" size="lg" disabled={pending} className="sm:col-span-2 sm:justify-self-start">
        <Send aria-hidden /> {pending ? 'Gönderiliyor…' : 'Erken erişime katıl'}
      </Button>
    </form>
  );
}
