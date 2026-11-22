// Renders NAR-J's original artwork (design/renders/scene.html) to optimised AVIF/WebP/JPG.
// Usage: node scripts/render-images.mjs [sceneName...]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'images');
const scenePage = 'file://' + path.join(root, 'design', 'renders', 'scene.html');

const jobs = [
  { scene: 'hero', name: 'hero-ev-night', w: 2560, h: 1440, sizes: [2560, 1600, 960] },
  { scene: 'heroPortrait', name: 'hero-ev-night-portrait', w: 1080, h: 1920, sizes: [1080, 720] },
  { scene: 'station', name: 'charging-station', w: 1600, h: 1200, sizes: [1600, 900] },
  { scene: 'fleet', name: 'fleet-highway', w: 2400, h: 1350, sizes: [2400, 1200] },
  { scene: 'city', name: 'smart-city-grid', w: 2000, h: 1300, sizes: [2000, 1000] },
  { scene: 'battery', name: 'battery-pack', w: 1800, h: 1200, sizes: [1800, 900] },
  { scene: 'rfid', name: 'rfid-pass', w: 1600, h: 1200, sizes: [1600, 900] },
];

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const only = process.argv.slice(2);
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const job of jobs.filter((j) => !only.length || only.includes(j.scene))) {
  await page.setViewportSize({ width: job.w, height: job.h });
  await page.goto(`${scenePage}?scene=${job.scene}&w=${job.w}&h=${job.h}`);
  await page.waitForSelector('body[data-ready="1"]');
  await page.waitForTimeout(300);
  const png = await page.screenshot({ type: 'png' });
  for (const size of job.sizes) {
    const base = sharp(png).resize({ width: size });
    const suffix = size === job.sizes[0] ? '' : `-${size}`;
    await base.clone().avif({ quality: 55, effort: 6 }).toFile(path.join(out, `${job.name}${suffix}.avif`));
    await base.clone().webp({ quality: 78 }).toFile(path.join(out, `${job.name}${suffix}.webp`));
  }
  // JPG fallback for the largest size (old browsers / OG image)
  await sharp(png).resize({ width: job.sizes[job.sizes.length - 1] }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(out, `${job.name}.jpg`));
  console.log('rendered', job.name);
}
await browser.close();
