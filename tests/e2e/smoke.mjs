// NAR-J uçtan uca duman testi. Kullanım: BASE_URL=http://localhost:3000 node tests/e2e/smoke.mjs [--shots]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SHOTS = process.argv.includes('--shots');
const OUT = 'docs/screenshots';
const WIDTHS = [320, 360, 390, 430, 768, 1024, 1440];
const PUBLIC = ['/', '/harita', '/rota', '/hesaplayici', '/garaj', '/operatorler', '/rfid', '/rezervasyon', '/filo', '/analitik', '/asistan', '/mobil', '/is-ortakligi', '/abonelik', '/yatirimci', '/hakkimizda', '/iletisim', '/yasal/gizlilik', '/yasal/kvkk', '/yasal/kullanim-kosullari', '/giris', '/kayit'];
const PANEL = ['/panel', '/panel/garaj', '/panel/rotalar', '/panel/rezervasyonlar', '/panel/profil', '/panel/filo', '/panel/yonetim'];

const results = [];
const fail = (name, detail) => results.push({ ok: false, name, detail });
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
// Harita karoları bu test ortamında ağa kapalı olabilir; bu hatalar uygulama hatası sayılmaz.
const ignorable = (t) => /basemaps\.cartocdn|tile\.openstreetmap|ERR_TUNNEL|ERR_NAME_NOT_RESOLVED|net::ERR_/.test(t);

async function audit(page, url, width, label) {
  const errors = [];
  const onConsole = (m) => m.type() === 'error' && !ignorable(m.text()) && errors.push(m.text());
  const onErr = (e) => errors.push(e.message);
  page.on('console', onConsole);
  page.on('pageerror', onErr);
  const res = await page.goto(BASE + url, { waitUntil: 'networkidle' });
  // tembel yüklenen içerik ve reveal animasyonları için sayfayı kaydır
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        // overflow-x clip / scroll konteyneri içindeyse sorun değil
        let p = el.parentElement, clipped = false;
        while (p && p !== document.body) {
          const s = getComputedStyle(p);
          if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { const pr = p.getBoundingClientRect(); if (pr.right <= vw + 1 && pr.left >= -1) { clipped = true; break; } }
          p = p.parentElement;
        }
        if (!clipped && getComputedStyle(el).position !== 'fixed') offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} (${Math.round(r.left)}→${Math.round(r.right)})`);
      }
    }
    const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !/basemaps|openstreetmap/.test(i.src)).map((i) => i.src);
    const small = [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, [role=radio]')]
      .filter((el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && s.visibility !== 'hidden' && !el.closest('.leaflet-container') && !el.classList.contains('sr-only') && (r.height < 36 || r.width < 36) && !(el.tagName === 'A' && el.closest('p, label')) && !(el.tagName === 'INPUT' && el.closest('label') && el.closest('label').getBoundingClientRect().height >= 44); })
      .map((el) => `${el.tagName.toLowerCase()}:${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
    const links = [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href').split('#')[0].split('?')[0]);
    // Çalışmayan düğme/bağlantı belirtileri
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const name = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim();
    const unnamed = [...document.querySelectorAll('button, a[href], [role=button]')].filter((el) => visible(el) && !name(el) && !el.closest('.leaflet-container')).map((el) => el.outerHTML.slice(0, 80));
    const deadLinks = [...document.querySelectorAll('a')].filter((a) => visible(a) && !a.closest('.leaflet-container') && (!a.getAttribute('href') || a.getAttribute('href') === '#' || /^javascript:/i.test(a.getAttribute('href')))).map((a) => name(a).slice(0, 40));
    const missingAnchors = [...document.querySelectorAll('a[href^="#"], a[href^="/#"]')].map((a) => a.getAttribute('href').split('#')[1]).filter((id) => id && (location.pathname === '/' || true) && !document.getElementById(decodeURIComponent(id)));
    return { scroll: document.documentElement.scrollWidth - vw, offenders: offenders.slice(0, 5), imgs, small: small.slice(0, 6), links, h1: document.querySelectorAll('h1').length, unnamed: unnamed.slice(0, 4), deadLinks: deadLinks.slice(0, 4), missingAnchors };
  });
  page.off('console', onConsole);
  page.off('pageerror', onErr);
  const tag = `${label} ${url} @${width}`;
  if (!res || res.status() >= 400) fail(tag, `HTTP ${res?.status()}`);
  if (info.scroll > 0) fail(`${tag} yatay taşma`, `${info.scroll}px ${info.offenders.join(' | ')}`);
  if (info.imgs.length) fail(`${tag} bozuk görsel`, info.imgs.join(', '));
  if (errors.length) fail(`${tag} konsol`, errors.slice(0, 3).join(' | '));
  if (info.h1 !== 1) fail(`${tag} h1 sayısı`, String(info.h1));
  if (info.unnamed.length) fail(`${tag} adsız düğme/bağlantı`, info.unnamed.join(' | '));
  if (info.deadLinks.length) fail(`${tag} hedefsiz bağlantı`, info.deadLinks.join(' | '));
  if (info.missingAnchors.length) fail(`${tag} hedefi olmayan çapa`, info.missingAnchors.join(', '));
  if (width <= 430 && info.small.length) fail(`${tag} küçük dokunma alanı`, info.small.join(' | '));
  return info;
}

function report() {
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? '✔' : '✘'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
  console.log(`\n${results.length - failed.length}/${results.length} kontrol geçti`);
  fs.writeFileSync('docs/e2e-results.json', JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2));
  return failed.length;
}
process.on('uncaughtException', (e) => { fail('beklenmeyen hata', e.message.split('\n')[0]); report(); process.exit(1); });

const browser = await chromium.launch();
const allLinks = new Set();

// 1) Herkese açık sayfalar × genişlikler
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } });
  const page = await ctx.newPage();
  for (const url of PUBLIC) {
    const info = await audit(page, url, w, 'public');
    info.links.forEach((l) => allLinks.add(l));
    if (SHOTS && [390, 1440].includes(w)) {
      const name = `${url === '/' ? 'home' : url.slice(1).replace(/\//g, '-')}-${w}.png`;
      await page.screenshot({ path: path.join(OUT, name), fullPage: false });
    }
  }
  await ctx.close();
}
pass('herkese açık sayfa denetimi', `${PUBLIC.length} sayfa × ${WIDTHS.length} genişlik`);

// 2) İç bağlantılar
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const broken = [];
  for (const l of allLinks) {
    if (l.startsWith('/panel')) continue;
    const r = await page.request.get(BASE + l);
    if (r.status() >= 400) broken.push(`${l} (${r.status()})`);
  }
  if (broken.length) fail('iç bağlantılar', broken.join(', '));
  else pass('iç bağlantılar', `${allLinks.size} benzersiz bağlantı`);
  await ctx.close();
}

// 2b) Ana sayfa CTA düğmeleri (mobil + masaüstü)
for (const w of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.getByRole('link', { name: 'Platformu Keşfet' }).click();
  await page.waitForFunction(() => { const el = document.getElementById('platform'); return el && Math.abs(el.getBoundingClientRect().top) < 200; }, null, { timeout: 5000 });
  await page.goto(BASE + '/');
  await page.getByRole('link', { name: 'Rota Planla' }).first().click();
  await page.waitForURL('**/rota');
  await page.goto(BASE + '/hesaplayici');
  await page.getByRole('link', { name: /Erken erişim/ }).first().click();
  await page.waitForURL('**/iletisim');
  pass(`ana sayfa CTA düğmeleri çalışıyor @${w}`);
  await ctx.close();
}

// 2c) Erken erişim formu (doğrulama + başarılı gönderim)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/iletisim');
  await page.getByRole('button', { name: 'Erken erişime katıl' }).click();
  await page.getByText('KVKK aydınlatma metnini onaylamalısınız.').waitFor();
  await page.fill('#ld-name', 'Test Kişi');
  await page.fill('#ld-email', `lead+${Date.now()}@example.com`);
  await page.check('input[name=consent]');
  await page.getByRole('button', { name: 'Erken erişime katıl' }).click();
  await page.getByText('Talebiniz alındı').waitFor();
  pass('erken erişim formu: KVKK onayı zorunlu, gönderim çalışıyor');
  await ctx.close();
}

// 3) Mobil menü (drawer)
{
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Menüyü aç' }).click();
  await page.getByRole('dialog').waitFor();
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (SHOTS) await page.screenshot({ path: path.join(OUT, 'mobile-menu-360.png') });
  await page.getByRole('dialog').getByRole('link', { name: 'AI Rota Planlayıcı' }).click();
  await page.waitForURL('**/rota');
  if (ov === 0) pass('mobil drawer menü açılıyor ve gezinme çalışıyor');
  else fail('mobil drawer taşma', String(ov));
  await ctx.close();
}

// 4) Masaüstü mega menü
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Çözümler' }).click();
  await page.getByRole('link', { name: /Filo & Lojistik/ }).first().click();
  await page.waitForURL('**/filo');
  pass('masaüstü açılır menü gezinmesi');
  await ctx.close();
}

// 5) Kayıt → panel → araç ekle → çıkış → yetkisiz panel erişimi
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const email = `test+${Date.now()}@example.com`;
  await page.goto(BASE + '/kayit');
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  const errCount = await page.locator('[role=alert]').count();
  if (errCount > 0) pass('kayıt formu boş gönderimde doğrulama hatası gösteriyor', `${errCount} hata`);
  else fail('kayıt doğrulama', 'hata gösterilmedi');
  await page.fill('#rg-name', 'Test Kullanıcı');
  await page.fill('#rg-email', email);
  await page.fill('#rg-pw', 'zayif');
  await page.fill('#rg-pw2', 'zayif');
  await page.check('input[name=terms]');
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  await page.getByText('Parola en az 10 karakter').waitFor();
  await page.waitForTimeout(500); // React 19 form sıfırlamasının tamamlanmasını bekle
  pass('zayıf parola reddediliyor');
  await page.fill('#rg-pw', 'GucluParola2026');
  await page.fill('#rg-pw2', 'GucluParola2026');
  await page.check('input[name=terms]');
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  try {
    await page.waitForURL('**/panel?hosgeldin=1', { timeout: 15000 });
  } catch {
    await page.screenshot({ path: 'docs/e2e-failure.png' });
    throw new Error(`kayıt yönlendirmesi olmadı: ${page.url()} | ${(await page.locator('[role=alert]').allInnerTexts()).join(' / ')}`);
  }
  pass('kayıt sonrası kişisel panele yönlendirme');
  const cookies = await ctx.cookies();
  const c = cookies.find((x) => x.name === 'narj_session');
  if (c?.httpOnly && c.sameSite === 'Lax') pass('oturum çerezi HttpOnly + SameSite=Lax');
  else fail('oturum çerezi bayrakları', JSON.stringify(c));
  for (const url of PANEL.slice(0, 5)) await audit(page, url, 390, 'panel');
  await page.goto(BASE + '/panel/garaj');
  await page.fill('#vf-n', 'Test aracı');
  await page.getByRole('button', { name: 'Garaja ekle' }).click();
  await page.getByText('Araç garajınıza eklendi.').waitFor();
  if ((await page.getByText('Test aracı').count()) > 0) pass('panelde araç ekleme');
  else fail('araç ekleme', 'liste güncellenmedi');
  if (SHOTS) await page.screenshot({ path: path.join(OUT, 'panel-garaj-390.png'), fullPage: false });
  await page.goto(BASE + '/panel/yonetim');
  if (page.url().includes('yetki=yok')) pass('sürücü rolü yönetim sayfasına erişemiyor');
  else fail('rol yetkisi', page.url());
  await page.getByRole('button', { name: 'Çıkış yap' }).first().click();
  await page.waitForURL(BASE + '/');
  await page.goto(BASE + '/panel');
  if (page.url().includes('/giris')) pass('çıkış sonrası panel korumalı');
  else fail('panel koruması', page.url());
  // aynı e-posta ile ikinci kayıt reddedilmeli
  await page.goto(BASE + '/kayit');
  await page.fill('#rg-name', 'Test Kullanıcı');
  await page.fill('#rg-email', email);
  await page.fill('#rg-pw', 'GucluParola2026');
  await page.fill('#rg-pw2', 'GucluParola2026');
  await page.check('input[name=terms]');
  await page.getByRole('button', { name: 'Hesap oluştur' }).click();
  await page.getByText('Bu e-posta ile kayıtlı bir hesap var.').waitFor();
  pass('aynı e-posta ile tekrar kayıt reddediliyor');
  // aynı kullanıcı tekrar giriş yapabilmeli
  await page.goto(BASE + '/giris');
  await page.fill('#lg-email', email);
  await page.fill('#lg-pw', 'GucluParola2026');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await page.waitForURL('**/panel');
  if ((await page.getByText('Test aracı').count()) > 0) pass('yeniden giriş: kullanıcının kendi verisi korunuyor');
  else fail('yeniden giriş verisi', 'araç görünmüyor');
  // başka kullanıcının verisi görünmemeli
  const other = await page.evaluate(() => document.body.innerText.includes('34 NRJ 360'));
  if (!other) pass('kullanıcı alanları ayrık (başka kullanıcının aracı görünmüyor)');
  else fail('veri izolasyonu', 'demo sürücünün aracı göründü');
  await ctx.close();
}

// 6) Demo admin & filo hesapları ile tüm panel sayfaları
for (const [email, label] of [['admin@narj.dev', 'admin'], ['filo@narj.dev', 'filo']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/giris');
  await page.fill('#lg-email', email);
  await page.fill('#lg-pw', 'yanlis-parola');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await page.getByText('E-posta veya parola hatalı.').waitFor();
  await page.fill('#lg-pw', 'NarjDemo!2026');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await page.waitForURL('**/panel');
  const pages = label === 'admin' ? PANEL : PANEL.filter((p) => p !== '/panel/yonetim');
  for (const url of pages) {
    await audit(page, url, 1440, label);
    if (SHOTS && ['/panel', '/panel/filo', '/panel/yonetim'].includes(url)) await page.screenshot({ path: path.join(OUT, `${label}${url.replace(/\//g, '-')}-1440.png`) });
  }
  pass(`${label} demo hesabıyla giriş ve panel sayfaları`);
  await ctx.close();
}

// 7) Rezervasyon demo akışı (misafir)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/rezervasyon');
  await page.getByRole('radiogroup', { name: 'İstasyonlar' }).getByRole('radio').first().click();
  await page.getByRole('button', { name: 'Devam' }).click();
  await page.getByRole('radiogroup', { name: 'Saat' }).locator('button:not([disabled])').first().click();
  await page.getByRole('button', { name: 'Devam' }).click();
  await page.fill('#rs-card', '4242424242424241');
  await page.fill('#rs-name', 'Test Kullanıcı');
  await page.fill('#rs-exp', '12/30');
  await page.fill('#rs-cvc', '123');
  await page.getByRole('button', { name: /Demo ödemeyi onayla/ }).click();
  await page.getByText(/Kart numarası geçersiz/).waitFor();
  await page.waitForTimeout(500);
  pass('rezervasyon: geçersiz kart (Luhn) reddediliyor');
  await page.fill('#rs-card', '4242424242424242');
  await page.getByRole('button', { name: /Demo ödemeyi onayla/ }).click();
  await page.getByText('Rezervasyon onaylandı').waitFor();
  if (SHOTS) await page.screenshot({ path: path.join(OUT, 'rezervasyon-onay-390.png') });
  pass('rezervasyon demo akışı tamamlanıyor');
  await ctx.close();
}

// 8) Hesaplayıcı & rota & asistan etkileşimi
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/hesaplayici');
  await page.fill('#cc-b', '60');
  await page.fill('#cc-p', '10');
  await page.waitForTimeout(900);
  const txt = await page.locator('main').innerText();
  // %15→%80, 60 kWh, DC η=0.94 → 39 kWh / 0.94 × 10 ₺ = 414,89 ₺ → "₺415"
  if (txt.includes('₺415')) pass('hesaplayıcı UI doğru sonucu gösteriyor (₺415)');
  else fail('hesaplayıcı UI sonucu', txt.match(/Tahmini maliyet\s*\n?\s*(.*)/)?.[1] ?? '?');
  await page.goto(BASE + '/rota');
  await page.selectOption('#rp-from', 'izmir');
  await page.selectOption('#rp-to', 'trabzon');
  await page.waitForTimeout(1800);
  if ((await page.getByText(/Durak 1 ·/).count()) > 0) pass('rota planlayıcı uzun rotada durak üretiyor');
  else fail('rota planlayıcı', 'durak yok');
  if (SHOTS) await page.screenshot({ path: path.join(OUT, 'rota-sonuc-1440.png'), fullPage: false });
  await page.goto(BASE + '/asistan');
  await page.fill('#as-in', "Bursa'dan Konya'ya %60 ile gidebilir miyim?");
  await page.getByRole('button', { name: 'Gönder' }).click();
  await page.getByText(/Bursa → Konya için/).waitFor();
  pass('asistan rota sorusunu hesaplayarak yanıtlıyor');
  await page.goto(BASE + '/harita');
  await page.getByRole('button', { name: 'CHAdeMO', exact: true }).click();
  const n = await page.locator('aside ul li button').count();
  if (n > 0) pass('harita filtreleri çalışıyor', `${n} CHAdeMO sonucu listelendi`);
  else fail('harita filtresi', '0 sonuç');
  await page.locator('.leaflet-marker-icon').first().waitFor({ timeout: 10000 });
  pass('Leaflet haritası ve işaretçiler yüklendi');
  if (SHOTS) await page.screenshot({ path: path.join(OUT, 'harita-filtre-1440.png') });
  await ctx.close();
}

// 9) Güvenlik başlıkları
{
  const ctx = await browser.newContext();
  const r = await ctx.request.get(BASE + '/');
  const h = r.headers();
  const need = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy'];
  const missing = need.filter((k) => !h[k]);
  if (missing.length) fail('güvenlik başlıkları', missing.join(', '));
  else pass('güvenlik başlıkları mevcut', need.join(', '));
  if (!h['x-powered-by']) pass('X-Powered-By gizli');
  else fail('X-Powered-By', h['x-powered-by']);
  await ctx.close();
}

await browser.close();
process.exit(report() ? 1 : 0);
