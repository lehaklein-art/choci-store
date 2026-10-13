// בניית עמוד מהיר וקל שנראה בדיוק כמו המקור.
// התוכן והעיצוב (הדר, באנרים, טקסטים, פוטר, מועדון, נגישות) מגיעים מוורדפרס כמו שהם —
// אבל רק פעם ב-10 דקות, ונשמרים כאן. הלקוחה מקבלת עמוד קל, בלי כל המשקל העודף של וורדפרס.
import { parse } from 'node-html-parser';
import { ORIGIN, rewriteBody } from './mirror';

export const REVALIDATE = Number(process.env.REVALIDATE || 600);
const ALLOW_INDEX = process.env.ALLOW_INDEX === '1';
export const CSS_VERSION = process.env.CSS_VERSION || '1';

export class NotHtml extends Error {}

export async function fetchWp(path) {
  const res = await fetch(ORIGIN + path, {
    headers: { accept: 'text/html', 'x-choci-front': '1' },
    redirect: 'manual',
    next: { revalidate: REVALIDATE, tags: ['page'] },
  });
  const ct = res.headers.get('content-type') || '';
  // הפניות (כולל 1,428 ההפניות מהאתר הישן), קבצים ושגיאות שרת — עוברים כמו שהם
  if ((res.status !== 200 && res.status !== 404) || !/text\/html/i.test(ct)) throw new NotHtml(String(res.status));
  return { status: res.status, text: rewriteBody(await res.text()) };
}

// סקריפטים של וורדפרס שלא צריך בחלון הראווה (החנות עובדת עם הסקריפטים של צ'וקי עצמה)
// (jQuery וסקריפטי ווקומרס נשארים — המיון, סרגל המחיר וגלריית המוצר צריכים אותם. הם נשמרים בדפדפן פעם אחת.)
const DROP_SCRIPT_SRC = /(sourcebuster|order-attribution|kadence\/assets\/js\/navigation\.min|wp-emoji|comment-reply|wp-embed)/i;
const DROP_SCRIPT_ID = /^(wc-order-attribution-js-extra|kadence-navigation-js-extra|wp-emoji-settings)$/;

let siteCss = null;
/** קובץ העיצוב המשותף כפי שנבנה (אותו עותק ששימש לקיצוץ) — כדי לא לשלוח שוב בכל עמוד עיצוב שכבר נמצא בו */
export async function getSiteCss() {
  if (siteCss !== null) return siteCss;
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    siteCss = fs.readFileSync(path.join(process.cwd(), '.choci', 'site-source.css'), 'utf8');
  } catch {
    siteCss = '';
  }
  return siteCss;
}
const inSiteCss = (css, all) => {
  const t = css.trim();
  if (!t) return true;
  return all.includes(t.slice(0, 300)) && all.includes(t.slice(-300));
};

// ספריות jQuery של וורדפרס — מוחלפות ב-choci-lite.js, חוץ מעמודים שבאמת צריכים אותן (מוצר עם וריאציות)
const JQ_STACK = /(\/jquery\/|jquery-blockui|add-to-cart\.min|js-cookie|frontend\/woocommerce\.min|zoom\/|flexslider|photoswipe|single-product\.min|price-slider|jquery-ui-touch-punch|accounting\/|comment-reply)/i;
let dropJq = false;

function keepScript(s) {
  const src = s.getAttribute('src') || '';
  if (dropJq && src && JQ_STACK.test(src)) return false;
  if (dropJq && !src && /^jquery/i.test(s.getAttribute('id') || '')) return false;
  const id = s.getAttribute('id') || '';
  const type = s.getAttribute('type') || '';
  const code = s.text || '';
  if (src && DROP_SCRIPT_SRC.test(src)) return false;
  if (DROP_SCRIPT_ID.test(id)) return false;
  if (type === 'speculationrules') return false;
  if (type === 'module' && /wp-emoji/.test(code)) return false;
  return true;
}

/** מנקה את גוף העמוד ממה שמוסתר או לא נחוץ, ומשאיר את כל מה שהלקוחה רואה */
export function cleanBody(body, css) {
  for (const sel of ['#masthead', '#mobile-drawer', '#colophon', 'noscript']) {
    body.querySelectorAll(sel).forEach((n) => n.remove());
  }
  // עיצוב שכבר נמצא בקובץ המשותף יורד; עיצוב ייחודי לעמוד נשאר
  body.querySelectorAll('style').forEach((n) => { if (inSiteCss(n.text, css)) n.remove(); });
  body.querySelectorAll('link[rel="stylesheet"]').forEach((n) => {
    const href = (n.getAttribute('href') || '').replace(/\?.*/, '');
    if (/fonts\.googleapis/.test(href) || css.includes(href.split('/').pop())) n.remove();
  });
  body.querySelectorAll('script').forEach((s) => { if (!keepScript(s)) s.remove(); });
  return body;
}

/** תגיות החיפוש בגוגל (כותרת, תיאור, שיתוף ונתונים מובנים) — מועתקות מהמקור */
export function headMeta(root, css = '') {
  const head = root.querySelector('head');
  if (!head) return '';
  const keep = [];
  const tail = []; // סקריפטים ועיצוב ייחודי מהראש של העמוד
  head.childNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    const tag = n.rawTagName?.toLowerCase();
    if (tag === 'title') keep.push(n.toString());
    else if (tag === 'meta') {
      const name = (n.getAttribute('name') || n.getAttribute('property') || '').toLowerCase();
      if (name === 'robots') return; // נקבע למטה
      if (name === 'description' || name.startsWith('og:') || name.startsWith('twitter:') || name.startsWith('article:') || name.startsWith('product:')) keep.push(n.toString());
    } else if (tag === 'link' && /canonical|prev|next/.test(n.getAttribute('rel') || '')) keep.push(n.toString());
    else if (tag === 'script' && n.getAttribute('type') === 'application/ld+json') keep.push(n.toString());
    else if (tag === 'script' && keepScript(n)) tail.push(n.toString());
    else if (tag === 'style' && !inSiteCss(n.text, css)) tail.push(n.toString());
    else if (tag === 'link' && n.getAttribute('rel') === 'stylesheet') {
      const href = (n.getAttribute('href') || '').replace(/\?.*/, '');
      if (!/fonts\.googleapis/.test(href) && !css.includes(href.split('/').pop())) tail.push(n.toString());
    }
  });
  keep.push(...tail);
  keep.push(ALLOW_INDEX ? '<meta name="robots" content="index, follow, max-image-preview:large">' : '<meta name="robots" content="noindex,nofollow">');
  return keep.join('\n');
}

const SPECULATION = `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/cart*","/checkout*","/my-account*","/wp-*","/*\\\\?*add-to-cart=*","/*\\\\?*wc-ajax=*","/*\\\\?*remove_item=*"]}},{"not":{"selector_matches":"[rel~=nofollow],[data-no-prefetch],[target=_blank]"}}]},"eagerness":"moderate"}]}</script>`;

import cssVersion from './css-version.json';
/** קובץ העיצוב המקוצץ — נבנה בזמן הבנייה ונשמר בדפדפן לשנה */
export async function cssHref() { return `/site.css?v=${cssVersion.v}`; }

export function documentHtml({ lang = 'he-IL', dir = 'rtl', meta, bodyClass, body, css = '/site.css' }) {
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${meta}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="${ORIGIN}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap">
<link rel="stylesheet" href="${css}">
<link rel="icon" href="${ORIGIN}/wp-content/uploads/2026/08/לוגו-שקוף-150x150.png">
${SPECULATION}
</head>
<body class="${bodyClass}">
${body}
</body>
</html>`;
}

export function htmlResponse(html, { status = 200 } = {}) {
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': `public, max-age=60, s-maxage=${REVALIDATE}, stale-while-revalidate=86400`,
    'x-choci-mode': 'built',
    'x-choci-css': cssVersion.note || '',
  });
  if (!ALLOW_INDEX) headers.set('x-robots-tag', 'noindex, nofollow');
  return new Response(html, { status, headers });
}

/** עמוד שלם מוורדפרס, מנוקה ומוגש קל */
export async function buildFromWp(path) {
  const [{ status, text: raw }, css] = await Promise.all([fetchWp(path), getSiteCss()]);
  const root = parse(raw, { comment: false, blockTextElements: { script: true, style: true, pre: true, textarea: true } });
  // האם העמוד צריך את הספריות הישנות? רק אם יש בו קוד שמשתמש בהן או טופס וריאציות
  const inline = root.querySelectorAll('script:not([src])').filter((x) => !/^jquery/i.test(x.getAttribute('id') || '')).map((x) => x.text).filter((t) => !/^\s*var\s+[a-z_]+_params\s*=/.test(t)).join('\n');
  dropJq = !root.querySelector('form.variations_form') && !/\bjQuery\b|\$\(\s*(document|window|function|['"])/.test(inline);
  const htmlEl = root.querySelector('html');
  const body = cleanBody(root.querySelector('body'), css);
  if (dropJq) body.insertAdjacentHTML('beforeend', `<script>window.CHOCI_WP=${JSON.stringify(ORIGIN)}</script><script src="/choci-lite.js?v=2" defer></script>`);
  return {
    root,
    body,
    lang: htmlEl?.getAttribute('lang') || 'he-IL',
    dir: htmlEl?.getAttribute('dir') || 'rtl',
    meta: headMeta(root, css),
    lite: dropJq,
    bodyClass: (body.getAttribute('class') || '').replace('woocommerce-no-js', 'woocommerce-js'),
    status,
  };
}
