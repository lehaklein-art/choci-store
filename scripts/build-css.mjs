// בזמן הבנייה (לא בשרת הקטן): מוריד את קובץ העיצוב המקורי ומקצץ אותו לכללים שבשימוש באתר.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { PurgeCSS } from 'purgecss';
import { SAMPLE_PATHS, SAFELIST } from '../lib/css-config.mjs';

const ORIGIN = (process.env.WC_URL || 'https://choci.kinsta.cloud').replace(/\/+$/, '');
const out = 'public/site.css';

async function get(u) { const r = await fetch(u, { headers: { accept: 'text/html' } }); return r.ok ? r.text() : ''; }

let css = '';
let full = '';
try {
  full = (await get(`${ORIGIN}/wp-content/uploads/choci-export/site.css?b=${Date.now()}`)).replace(/@import\s+url\([^)]*\);?\s*/g, '');
  if (!full) throw new Error('no source css');
  const pages = [];
  for (const p of SAMPLE_PATHS) pages.push(await get(ORIGIN + p).catch(() => ''));
  const ok = pages.filter((x) => x.length > 5000);
  if (ok.length < SAMPLE_PATHS.length - 3) throw new Error(`only ${ok.length} sample pages`);
  const res = await new PurgeCSS().purge({
    content: ok.map((raw) => ({ raw, extension: 'html' })),
    css: [{ raw: full }],
    safelist: SAFELIST, fontFace: false, keyframes: false, variables: false,
  });
  css = res.map((r) => r.css).join('\n');
  console.log(`[css] ${Math.round(full.length / 1024)}KB -> ${Math.round(css.length / 1024)}KB from ${ok.length} pages`);
} catch (e) {
  console.warn('[css] lean build failed, keeping previous/full:', e.message);
  // אם הקיצוץ נכשל — עדיף העיצוב המלא מאשר אתר בלי עיצוב
  css = full || (fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '');
}
if (css) {
  fs.writeFileSync(out, css);
  fs.writeFileSync('lib/css-version.json', JSON.stringify({ v: createHash('sha1').update(css).digest('hex').slice(0, 10) }));
}
