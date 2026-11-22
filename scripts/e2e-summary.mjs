// docs/e2e-results.json → GitHub Actions iş özeti (Markdown). Başarısız kontroller üstte listelenir.
import fs from 'node:fs';

const file = 'docs/e2e-results.json';
const out = process.env.GITHUB_STEP_SUMMARY;
let md;
if (!fs.existsSync(file)) {
  md = '### Uçtan uca testler\n\n❌ Sonuç dosyası oluşmadı — sunucu başlamamış veya test erken çökmüş olabilir. `server.log` yapıtına bakın.\n';
} else {
  const { results, base, at } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const failed = results.filter((r) => !r.ok);
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 300);
  md = [
    `### Uçtan uca testler (mobil + masaüstü) — ${results.length - failed.length}/${results.length} geçti`,
    '',
    `Sunucu: \`${base}\` · ${at}`,
    '',
    ...(failed.length ? ['#### ❌ Başarısız kontroller', '', '| Kontrol | Ayrıntı |', '|---|---|', ...failed.map((r) => `| ${esc(r.name)} | ${esc(r.detail)} |`), ''] : []),
    '<details><summary>Tüm kontroller</summary>',
    '',
    '| | Kontrol | Ayrıntı |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.ok ? '✅' : '❌'} | ${esc(r.name)} | ${esc(r.detail ?? '')} |`),
    '',
    '</details>',
    '',
    'Ekran görüntüleri (390 px ve 1440 px) `e2e-report` yapıtında.',
  ].join('\n');
}
if (out) fs.appendFileSync(out, md + '\n');
console.log(md);
