'use client';
import { useEffect, useState } from 'react';
import { Navbar } from './navbar';

/** Statik sayfaları dinamik yapmamak için oturum bilgisi istemcide alınır. */
export function SiteNavbar() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('/api/me', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => alive && setUser(d.user))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return <Navbar user={user} />;
}
