'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_VEHICLE_ID, VEHICLE_PROFILES } from './data/vehicles';

/**
 * Kullanıcının varsayılan Togg aracı — tarayıcıda kalıcı saklanır (localStorage, yalnızca araç kimliği; kişisel veri yok).
 * Hesaplayıcı, rota planlayıcı, hızlı hesap ve karbon analitiği bu tercihle açılır; sekmeler arası senkron çalışır.
 */
const KEY = 'narj.pref.vehicle';
const EVT = 'narj:vehicle';

function read(): string {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && VEHICLE_PROFILES.some((p) => p.id === v) ? v : DEFAULT_VEHICLE_ID;
  } catch {
    return DEFAULT_VEHICLE_ID;
  }
}

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener('storage', onStorage);
  window.addEventListener(EVT, cb);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(EVT, cb);
  };
}

export function setPreferredVehicle(id: string) {
  if (!VEHICLE_PROFILES.some((p) => p.id === id)) return;
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    /* depolama kapalıysa yalnızca bu sayfada geçerli olur */
  }
  window.dispatchEvent(new Event(EVT));
}

export function usePreferredVehicle(): [string, (id: string) => void] {
  const id = useSyncExternalStore(subscribe, read, () => DEFAULT_VEHICLE_ID);
  const set = useCallback((v: string) => setPreferredVehicle(v), []);
  return [id, set];
}
