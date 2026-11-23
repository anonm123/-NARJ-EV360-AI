import { PanelHeader } from '@/components/panel/panel-shell';
import { fmtDate } from '@/components/panel/admin-ui';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { read, STORAGE_BACKEND } from '@/lib/server/db';
import { ocmConfigured } from '@/lib/stations';
import { osrmIsDemoServer } from '@/lib/routing/osrm';
import { ACTION_LABEL } from '@/lib/admin';

export default async function Page() {
  const audit = await read((db) => db.audit.slice(-100).reverse());
  const prod = process.env.NODE_ENV === 'production';
  const rows: { name: string; ok: boolean; value: string; note: string }[] = [
    { name: 'Veri deposu', ok: STORAGE_BACKEND === 'redis' || !prod, value: STORAGE_BACKEND === 'redis' ? 'Upstash Redis (kalıcı)' : 'Dosya (geçici)', note: STORAGE_BACKEND === 'redis' ? 'Kayıtlar yeniden yayında korunur.' : 'Render yeniden yayınlayınca kayıtlar silinir. KV_REST_API_URL + KV_REST_API_TOKEN ekleyin.' },
    { name: 'EPDK istasyon servisi', ok: process.env.NARJ_DISABLE_EPDK !== '1', value: process.env.NARJ_DISABLE_EPDK === '1' ? 'Kapalı' : 'Açık', note: 'Resmî liste; saatte en fazla 1 tam sorgu.' },
    { name: 'Open Charge Map', ok: ocmConfigured(), value: ocmConfigured() ? 'Anahtar tanımlı' : 'Anahtar yok', note: 'OPENCHARGEMAP_API_KEY (isteğe bağlı).' },
    { name: 'OpenStreetMap / Overpass', ok: process.env.NARJ_DISABLE_OSM !== '1', value: process.env.NARJ_DISABLE_OSM === '1' ? 'Kapalı' : 'Açık', note: 'Kamu sunucusu; yoğunlukta hata verebilir.' },
    { name: 'Rota (OSRM)', ok: true, value: osrmIsDemoServer() ? 'Demo sunucu' : 'Özel sunucu', note: osrmIsDemoServer() ? 'Ticari yoğun kullanım için OSRM_URL ile kendi sunucunuz önerilir.' : '' },
    { name: 'Yönetici kurulum kodu', ok: true, value: (process.env.NARJ_ADMIN_SETUP_CODE ?? '').length >= 16 ? 'Tanımlı' : 'Tanımlı değil', note: 'Yeni yönetici eklemek için kullanıcının rolünü buradan değiştirmeniz yeterli; kod yalnız ilk kurulum içindir.' },
    { name: 'Demo hesaplar', ok: true, value: process.env.NARJ_SEED_DEMO === '1' ? 'Açık (sürücü + filo)' : 'Kapalı', note: 'NARJ_SEED_DEMO=1 ile ziyaretçiler demo hesaplarla deneyebilir.' },
  ];
  return (
    <>
      <PanelHeader title="Sistem & kayıt defteri" description="Ayarların durumu ve yönetici işlemlerinin kaydı. Gizli değerler gösterilmez." />
      <Card className="p-0">
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.name} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold">{r.name}</p>
                {r.note && <p className="text-xs text-subtle">{r.note}</p>}
              </div>
              <span className="flex items-center gap-2 text-sm"><span className={r.ok ? 'size-2 rounded-full bg-ok' : 'size-2 rounded-full bg-warn'} aria-hidden />{r.value}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="mt-6 p-0">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Yönetici işlemleri (son 100)</h2>
          <StatusBadge status="live" label="Kayıt tutuluyor" />
        </div>
        {audit.length === 0 ? <p className="p-5 text-sm text-muted">Henüz işlem yok.</p> : (
          <ul className="divide-y divide-line">
            {audit.map((a) => (
              <li key={a.id} className="px-5 py-3 text-sm">
                <p><span className="font-semibold">{a.actorEmail}</span> <span className="text-muted">{ACTION_LABEL[a.action] ?? a.action}</span> · {a.target}{a.detail ? <span className="text-subtle"> ({a.detail})</span> : null}</p>
                <p className="text-xs text-subtle">{fmtDate(a.at, true)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
