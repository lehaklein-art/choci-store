// בניית עמוד מהיר וקל שנראה בדיוק כמו המקור.
// התוכן והעיצוב (הדר, באנרים, טקסטים, פוטר, מועדון, נגישות) מגיעים מוורדפרס כמו שהם —
// אבל רק פעם ב-10 דקות, ונשמרים כאן. הלקוחה מקבלת עמוד קל, בלי המשקל העודף של וורדפרס.
//
// עיצוב: כל קובץ וכל בלוק עיצוב נשארים בדיוק במקום ובסדר שלהם במקור (הסדר קובע מה גובר על מה).
// בלוקים גדולים שחוזרים בכל עמוד נשלחים כקובץ נפרד שנשמר בדפדפן, במקום להישלח שוב בכל עמוד.
import { parse } from 'node-html-parser';
import { ORIGIN, rewriteBody } from './mirror';
import { putCss } from './cssstore';

export const REVALIDATE = Number(process.env.REVALIDATE || 600);
const ALLOW_INDEX = process.env.ALLOW_INDEX === '1';

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

// סקריפטים של וורדפרס שלא צריך בחלון הראווה
// (סקריפט האימוג'י של וורדפרס נשאר — הוא מחליף אימוג'ים בתמונות אחידות כמו באתר המקורי, ונטען רק כשצריך)
const DROP_SCRIPT_SRC = /(sourcebuster|order-attribution|kadence\/assets\/js\/navigation\.min|comment-reply|wp-embed)/i;
const DROP_SCRIPT_ID = /^(wc-order-attribution-js-extra|kadence-navigation-js-extra)$/;
// ספריות jQuery של וורדפרס — מוחלפות ב-choci-lite.js, חוץ מעמודים שבאמת צריכים אותן (מוצר עם וריאציות)
const JQ_STACK = /(\/jquery\/|jquery-blockui|add-to-cart\.min|js-cookie|frontend\/woocommerce\.min|zoom\/|flexslider|photoswipe|single-product\.min|price-slider|jquery-ui-touch-punch|accounting\/|comment-reply)/i;

function makeKeepScript(dropJq) {
  return (s) => {
    const src = s.getAttribute('src') || '';
    const id = s.getAttribute('id') || '';
    const type = s.getAttribute('type') || '';
    const code = s.text || '';
    if (dropJq && src && JQ_STACK.test(src)) return false;
    if (dropJq && !src && /^jquery/i.test(id)) return false;
    if (src && DROP_SCRIPT_SRC.test(src)) return false;
    if (DROP_SCRIPT_ID.test(id)) return false;
    if (type === 'speculationrules') return false;
    return true;
  };
}

const EXTERNALIZE_MIN = 1500; // בלוק עיצוב מעל הגודל הזה נשלח כקובץ נשמר

/** בלוק עיצוב בתוך העמוד → קישור לקובץ שנשמר בדפדפן, באותו מקום בדיוק */
function externalizeStyle(n) {
  const css = n.text || '';
  if (css.length < EXTERNALIZE_MIN) return;
  const media = n.getAttribute('media');
  const href = putCss(css);
  n.replaceWith(`<link rel="stylesheet" href="${href}"${media ? ` media="${media}"` : ''}>`);
}

/** מנקה את גוף העמוד ממה שמוסתר או לא נחוץ, ומשאיר את כל מה שהלקוחה רואה */
function cleanBody(body, keepScript) {
  for (const sel of ['#masthead', '#mobile-drawer', '#colophon', 'noscript']) {
    body.querySelectorAll(sel).forEach((n) => n.remove());
  }
  body.querySelectorAll('style').forEach(externalizeStyle);
  body.querySelectorAll('script').forEach((s) => { if (!keepScript(s)) s.remove(); });
  return body;
}

/** הראש של העמוד — בדיוק כמו במקור ובאותו סדר, בלי סקריפטים מיותרים */
function cleanHead(root, keepScript) {
  const head = root.querySelector('head');
  if (!head) return '';
  const out = [];
  head.childNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    const tag = n.rawTagName?.toLowerCase();
    if (tag === 'meta') {
      const name = (n.getAttribute('name') || '').toLowerCase();
      if (name === 'robots' || name === 'viewport' || n.getAttribute('charset')) return; // נקבעים למטה
      out.push(n.toString());
    } else if (tag === 'script') {
      if (keepScript(n)) out.push(n.toString());
    } else if (tag === 'style') {
      out.push(n.toString()); // בלוקים קטנים נשארים בעמוד; הגדולים כבר הוחלפו בקישור
    } else if (tag === 'link') {
      const rel = (n.getAttribute('rel') || '').toLowerCase();
      const type = (n.getAttribute('type') || '').toLowerCase();
      if (/^(pingback|edituri|wlwmanifest|shortlink|https:\/\/api\.w\.org\/)$/.test(rel)) return;
      if (rel === 'alternate' && /rss|json|oembed|xml/.test(type)) return;
      out.push(n.toString());
    } else if (tag === 'title' || tag === 'base') out.push(n.toString());
  });
  return out.join('\n');
}

const SPECULATION = `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/cart*","/checkout*","/my-account*","/wp-*","/*\\\\?*add-to-cart=*","/*\\\\?*wc-ajax=*","/*\\\\?*remove_item=*"]}},{"not":{"selector_matches":"[rel~=nofollow],[data-no-prefetch],[target=_blank]"}}]},"eagerness":"moderate"}]}</script>`;

export function documentHtml({ lang = 'he-IL', dir = 'rtl', head, bodyClass, body }) {
  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ALLOW_INDEX ? '<meta name="robots" content="index, follow, max-image-preview:large">' : '<meta name="robots" content="noindex,nofollow">'}
<link rel="preconnect" href="${ORIGIN}">
${head}
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
  const { status, text: raw } = await fetchWp(path);
  const root = parse(raw, { comment: false, blockTextElements: { script: true, style: true, pre: true, textarea: true } });
  // האם העמוד צריך את הספריות הישנות? רק אם יש בו קוד שמשתמש בהן או טופס וריאציות
  const inline = root.querySelectorAll('script:not([src])')
    .filter((x) => !/^jquery/i.test(x.getAttribute('id') || ''))
    .map((x) => x.text).filter((t) => !/^\s*var\s+[a-z_]+_params\s*=/.test(t)).join('\n');
  const dropJq = !root.querySelector('form.variations_form') && !/\bjQuery\b|\$\(\s*(document|window|function|['"])/.test(inline);
  const keepScript = makeKeepScript(dropJq);
  const htmlEl = root.querySelector('html');
  // קודם מחליפים בלוקי עיצוב בראש בקישורים (באותו מקום), ואז אוספים את הראש
  root.querySelectorAll('head style').forEach(externalizeStyle);
  const head = cleanHead(root, keepScript);
  const body = cleanBody(root.querySelector('body'), keepScript);
  if (dropJq) body.insertAdjacentHTML('beforeend', `<script>window.CHOCI_WP=${JSON.stringify(ORIGIN)}</script><script src="/choci-lite.js?v=3" defer></script>`);
  return {
    root,
    body,
    head,
    lang: htmlEl?.getAttribute('lang') || 'he-IL',
    dir: htmlEl?.getAttribute('dir') || 'rtl',
    lite: dropJq,
    bodyClass: (body.getAttribute('class') || '').replace('woocommerce-no-js', 'woocommerce-js'),
    status,
  };
}
