// מחסן קבצי עיצוב: בלוק עיצוב גדול מהעמוד נשמר פעם אחת ומוגש כקובץ שהדפדפן שומר לשנה.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const mem = new Map();
const DIR = path.join(os.tmpdir(), 'choci-css');
try { fs.mkdirSync(DIR, { recursive: true }); } catch {}

export function putCss(css) {
  const h = createHash('sha1').update(css).digest('hex').slice(0, 16);
  if (!mem.has(h)) {
    mem.set(h, css);
    try { fs.writeFileSync(path.join(DIR, `${h}.css`), css); } catch {}
  }
  return `/c/${h}.css`;
}

export function getCss(h) {
  if (!/^[a-f0-9]{16}$/.test(h)) return null;
  if (mem.has(h)) return mem.get(h);
  try {
    const css = fs.readFileSync(path.join(DIR, `${h}.css`), 'utf8');
    mem.set(h, css);
    return css;
  } catch { return null; }
}
