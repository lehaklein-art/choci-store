// בניית עמוד מהיר וקל שנראה בדיוק כמו המקור.
// התוכן והעיצוב (הדר, באנרים, טקסטים, פוטר, מועדון, נגישות) מגיעים מוורדפרס כמו שהם —
// אבל רק פעם ב-10 דקות, ונשמרים כאן. הלקוחה מקבלת עמוד קל, בלי כל המשקל העודף של וורדפרס.
import { parse } from 'node-html-parser';
import { ORIGIN, rewriteBody } from './mirror';

export const REVALIDATE = Number(process.env.REVALIDATE || 600);
const ALLOW_INDEX = process.env.ALLOW_INDEX === '1';
export const CSS_VERSION = process.env.CSS_VERSION || '1';

export async function fetchWp(path) {
  const res = await fetch(ORIGIN + path, {
    headers: { accept: 'text/html', 'x-choci-front': '1' },
    next: { revalidate: REVALIDATE, tags: ['page'] },
  });
  if (!res.ok) throw new Error(`WP ${res.status} ${path}`);
  return rewriteBody(await res.text());
}

// סקריפטים של וורדפרס שלא צריך בחלון הראווה (החנות עובדת עם הסקריפטים של צ'וקי עצמה)
const DROP_SCRIPT_SRC = /(jquery|blockUI|add-to-cart|js\.cookie|woocommerce\.min|sourcebuster|order-attribution|navigation\.min|wp-emoji|comment-reply|wp-embed)/i;
const DROP_SCRIPT_ID = /^(wc-order-attribution-js-extra|kadence-navigation-js-extra|wp-emoji-settings|woocommerce-js-extra|wc-add-to-cart-js-extra)$/;

/** מנקה את גוף העמוד ממה שמוסתר או לא נחוץ, ומשאיר את כל מה שהלקוחה רואה */
export function cleanBody(body) {
  for (const sel of ['#masthead', '#mobile-drawer', '#colophon', 'style', 'link[rel="stylesheet"]', 'noscript']) {
    body.querySelectorAll(sel).forEach((n) => n.remove());
  }
  body.querySelectorAll('script').forEach((s) => {
    const src = s.getAttribute('src') || '';
    const id = s.getAttribute('id') || '';
    const type = s.getAttribute('type') || '';
    const code = s.text || '';
    if (src && DROP_SCRIPT_SRC.test(src)) return s.remove();
    if (DROP_SCRIPT_ID.test(id)) return s.remove();
    if (type === 'speculationrules') return s.remove();
    if (type === 'module' && /wp-emoji/.test(code)) return s.remove();
    if (/woocommerce-no-js/.test(code) && code.length < 400) return s.remove();
  });
  return body;
}

/** תגיות החיפוש בגוגל (כותרת, תיאור, שיתוף ונתונים מובנים) — מועתקות מהמקור */
export function headMeta(root) {
  const head = root.querySelector('head');
  if (!head) return '';
  const keep = [];
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
  });
  keep.push(ALLOW_INDEX ? '<meta name="robots" content="index, follow, max-image-preview:large">' : '<meta name="robots" content="noindex,nofollow">');
  return keep.join('\n');
}

const SPECULATION = `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/cart*","/checkout*","/my-account*","/wp-*","/*\\\\?*add-to-cart=*","/*\\\\?*wc-ajax=*","/*\\\\?*remove_item=*"]}},{"not":{"selector_matches":"[rel~=nofollow],[data-no-prefetch],[target=_blank]"}}]},"eagerness":"moderate"}]}</script>`;

export function documentHtml({ lang = 'he-IL', dir = 'rtl', meta, bodyClass, body }) {
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${meta}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="${ORIGIN}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap">
<link rel="stylesheet" href="/wp-site.css?v=${CSS_VERSION}">
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
  });
  if (!ALLOW_INDEX) headers.set('x-robots-tag', 'noindex, nofollow');
  return new Response(html, { status, headers });
}

/** עמוד שלם מוורדפרס, מנוקה ומוגש קל */
export async function buildFromWp(path) {
  const raw = await fetchWp(path);
  const root = parse(raw, { comment: false, blockTextElements: { script: true, style: true, pre: true, textarea: true } });
  const htmlEl = root.querySelector('html');
  const body = cleanBody(root.querySelector('body'));
  return {
    root,
    body,
    lang: htmlEl?.getAttribute('lang') || 'he-IL',
    dir: htmlEl?.getAttribute('dir') || 'rtl',
    meta: headMeta(root),
    bodyClass: (body.getAttribute('class') || '').replace('woocommerce-no-js', 'woocommerce-js'),
  };
}
