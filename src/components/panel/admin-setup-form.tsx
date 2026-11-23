'use client';

import { useActionState } from 'react';
import { adminSetupAction, type SetupState } from '@/app/actions/admin';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminSetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(adminSetupAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Kurulum kodu" htmlFor="as-code" error={state.message}>
        <Input id="as-code" name="code" type="password" autoComplete="off" required minLength={16} aria-invalid={!!state.message || undefined} />
      </Field>
      <Button type="submit" disabled={pending}>{pending ? 'Kontrol ediliyor…' : 'Beni yönetici yap'}</Button>
    </form>
  );
}
