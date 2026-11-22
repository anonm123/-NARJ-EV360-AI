// NAR-J temel güvenlik kontrolleri (CI ve yerel). Ücretli servis kullanmaz; yalnızca depodaki dosyaları tarar.
// Kullanım: node scripts/security-check.mjs   → bulgu varsa çıkış kodu 1
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const findings = [];
const notes = [];
const add = (rule, file, detail) => findings.push({ rule, file, detail });

const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
const textFiles = tracked.filter((f) => /\.(m?[jt]sx?|json|ya?ml|md|css|html|env.*|txt|sh)$/i.test(f) || /(^|\/)\.env/.test(f));
const isLock = (f) => f.endsWith('package-lock.json');

// 1) Takip edilen ortam/gizli dosyaları
for (const f of tracked) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !/\.env\.example$/.test(f)) add('takip-edilen-env', f, '.env dosyaları depoya eklenmemeli');
  if (/\.(pem|key|p12|pfx)$/i.test(f)) add('takip-edilen-anahtar', f, 'özel anahtar dosyası');
  if (/^\.data\//.test(f)) add('takip-edilen-veri', f, 'yerel veri deposu (kullanıcı verisi) depoya eklenmemeli');
}

// 2) Sızmış gizli anahtar kalıpları
const SECRET_PATTERNS = [
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['anthropic-key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['openai-key', /\bsk-(proj-)?[A-Za-z0-9]{32,}\b/],
  ['stripe-live-key', /\b(sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['slack-token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['private-key-block', /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
];
for (const f of textFiles) {
  if (isLock(f) || f === 'scripts/security-check.mjs') continue;
  const src = fs.readFileSync(f, 'utf8');
  for (const [rule, re] of SECRET_PATTERNS) {
    const m = src.match(re);
    if (m) add(`sizinti:${rule}`, f, `${m[0].slice(0, 8)}…`);
  }
}

// 3) Tehlikeli API kullanımı (uygulama kodu)
const appFiles = tracked.filter((f) => f.startsWith('src/') && /\.[jt]sx?$/.test(f));
const DANGEROUS = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['eval', /\beval\s*\(/],
  ['new-Function', /new\s+Function\s*\(/],
  ['child_process', /from ['"](node:)?child_process['"]/],
];
for (const f of appFiles) {
  const src = fs.readFileSync(f, 'utf8');
  for (const [rule, re] of DANGEROUS) if (re.test(src)) add(`tehlikeli-api:${rule}`, f, 'kullanım gözden geçirilmeli');
  // Sunucu kodunun istemciye sızmaması: 'use client' dosyası lib/server içe aktarmamalı
  if (/^['"]use client['"]/.test(src.trimStart()) && /from ['"]@\/lib\/server\//.test(src)) add('istemcide-sunucu-kodu', f, "'use client' dosyası lib/server içe aktarıyor");
}

// 4) Sunucu modülleri 'server-only' ile korunmalı
for (const f of tracked.filter((x) => x.startsWith('src/lib/server/'))) {
  if (!/import 'server-only'/.test(fs.readFileSync(f, 'utf8'))) add('server-only-eksik', f, "import 'server-only' yok");
}

// 5) Güvenlik başlıkları yapılandırması
const nextConfig = fs.readFileSync('next.config.ts', 'utf8');
for (const h of ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) {
  if (!nextConfig.includes(h)) add('baslik-eksik', 'next.config.ts', h);
}
if (!/poweredByHeader:\s*false/.test(nextConfig)) add('baslik', 'next.config.ts', 'poweredByHeader: false olmalı');
if (/frame-ancestors\s+\*/.test(nextConfig)) add('csp', 'next.config.ts', "frame-ancestors '*' olmamalı");

// 6) Oturum çerezi bayrakları ve parola saklama
const auth = fs.readFileSync('src/lib/server/auth.ts', 'utf8');
if (!/httpOnly:\s*true/.test(auth)) add('cerez', 'src/lib/server/auth.ts', 'httpOnly: true olmalı');
if (!/sameSite:\s*'(lax|strict)'/.test(auth)) add('cerez', 'src/lib/server/auth.ts', "sameSite 'lax' veya 'strict' olmalı");
if (!/secure:\s*process\.env\.NODE_ENV === 'production'/.test(auth)) add('cerez', 'src/lib/server/auth.ts', 'üretimde secure çerez');
if (!/scrypt/.test(auth) || !/timingSafeEqual/.test(auth)) add('parola', 'src/lib/server/auth.ts', 'scrypt + timingSafeEqual bekleniyor');

// 7) Demo hesaplar üretimde varsayılan olarak kapalı olmalı
const seed = fs.readFileSync('src/lib/server/seed.ts', 'utf8');
if (!/NARJ_SEED_DEMO === '1' \|\| process\.env\.NODE_ENV !== 'production'/.test(seed)) add('demo-hesap', 'src/lib/server/seed.ts', 'üretimde demo hesap kapısı bulunamadı');

// 8) Gerçek ödeme sağlayıcısı entegrasyonu olmamalı (bu sürüm yalnızca demo)
for (const f of appFiles) {
  if (/from ['"](stripe|iyzipay|@stripe\/|paytr|braintree)/.test(fs.readFileSync(f, 'utf8'))) add('odeme', f, 'gerçek ödeme SDK’sı içe aktarılmış — onay gerekir');
}
// Kart verisinin saklanmadığını doğrula: Reservation tipinde kart alanı olmamalı
const db = fs.readFileSync('src/lib/server/db.ts', 'utf8');
if (/cardNumber|cvc/i.test(db)) add('kart-verisi', 'src/lib/server/db.ts', 'kart verisi veri modelinde');

notes.push(`${tracked.length} takip edilen dosya, ${textFiles.length} metin dosyası tarandı`);

const summary = process.env.GITHUB_STEP_SUMMARY;
const lines = ['### Güvenlik kontrolleri', '', notes.join(' · '), ''];
if (findings.length) {
  lines.push('| Kural | Dosya | Ayrıntı |', '|---|---|---|', ...findings.map((f) => `| ${f.rule} | \`${f.file}\` | ${f.detail} |`));
} else {
  lines.push('✅ Bulgu yok: sızmış anahtar, takip edilen .env/veri dosyası, tehlikeli API, eksik güvenlik başlığı veya çerez bayrağı tespit edilmedi.');
}
if (summary) fs.appendFileSync(summary, lines.join('\n') + '\n');
console.log(lines.join('\n'));
process.exit(findings.length ? 1 : 0);
