// בזמן הבנייה (לא בשרת הקטן): מוריד את קובץ העיצוב המקורי ומקצץ אותו לכללים שבשימוש באתר.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { PurgeCSS } from 'purgecss';
import { SAMPLE_PATHS, SAFELIST } from '../lib/css-config.mjs';

const ORIGIN = (process.env.WC_URL || 'https://choci.kinsta.cloud').replace(/\/+$/, '');
const out = 'public/site.css';

async function get(u) {
  const r = await fetch(u, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 (choci-build)' } });
  if (!r.ok) console.warn('[css] fetch', r.status, u.slice(0, 80));
  return r.ok ? r.text() : '';
}

let css = '';
let full = '';
let note = '';
try {
  full = (await get(`${ORIGIN}/wp-content/uploads/choci-export/site.css?b=${Date.now()}`)).replace(/@import\s+url\([^)]*\);?\s*/g, '');
  if (!full) throw new Error('no source css');
  const pages = [];
  for (const p of SAMPLE_PATHS) pages.push(await get(ORIGIN + p).catch(() => ''));
  const ok = pages.filter((x) => x.length > 5000);
  if (ok.length < SAMPLE_PATHS.length - 3) throw new Error(`only ${ok.length} sample pages`);
  // כללים שבורים במקור (למשל &gt; במקום >) — הדפדפן מתעלם מהם גם באתר המקורי, אז מסירים אותם כדי שהמראה יישאר זהה
  let src = full.replace(/[^{}]*&(gt|lt|amp);[^{}]*\{[^{}]*\}/g, '');
  let res;
  for (let tries = 0; ; tries++) {
    try {
      res = await new PurgeCSS().purge({
        content: ok.map((raw) => ({ raw, extension: 'html' })),
        css: [{ raw: src }],
        safelist: SAFELIST, fontFace: false, keyframes: false, variables: false,
      });
      break;
    } catch (e) {
      const m = /:(\d+):(\d+):/.exec(e.message || '');
      if (!m || tries > 30) throw e;
      const lines = src.split('\n');
      console.warn('[css] dropping unparsable line', m[1], (lines[+m[1] - 1] || '').slice(0, 80));
      lines.splice(+m[1] - 1, 1);
      src = lines.join('\n');
    }
  }
  css = res.map((r) => r.css).join('\n');
  note = `lean ${Math.round(full.length / 1024)}->${Math.round(css.length / 1024)}KB from ${ok.length} pages`;
  console.log('[css]', note);
} catch (e) {
  note = `full (${e.message})`;
  console.warn('[css] lean build failed:', e.message);
  // אם הקיצוץ נכשל — עדיף העיצוב המלא מאשר אתר בלי עיצוב
  css = full || (fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '');
}
// עותק של קובץ המקור — השרת משתמש בו כדי לדעת איזה עיצוב כבר נמצא בקובץ המשותף (חייב להתאים לבנייה)
if (full) { fs.mkdirSync('.choci', { recursive: true }); fs.writeFileSync('.choci/site-source.css', full); }
if (css) {
  fs.writeFileSync(out, css);
  fs.writeFileSync('lib/css-version.json', JSON.stringify({ v: createHash('sha1').update(css).digest('hex').slice(0, 10), note }));
}
