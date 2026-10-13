// חלון הראווה של צ'וקי.
// כל עמוד באתר מוצג בדיוק כמו באתר המקורי (אותו עיצוב, אותם סינונים, עגלה, מועדפים, מועדון ונגישות),
// אבל נשמר מוכן מראש בשרת הזה, כך שהלקוחה מקבלת אותו מיד במקום לחכות לוורדפרס.
// עמודים אישיים (עגלה, קופה, החשבון שלי) ופעולות (הוספה לסל, טפסים) עוברים ישירות לווקומרס בלי שמירה.

export const ORIGIN = (process.env.WC_URL || 'https://choci.kinsta.cloud').replace(/\/+$/, '');
const ORIGIN_HOST = new URL(ORIGIN).host;
const REVALIDATE = Number(process.env.REVALIDATE || 600); // כל כמה שניות עמוד שמור מתרענן ברקע
const ALLOW_INDEX = process.env.ALLOW_INDEX === '1';

// נתיבים שתמיד עוברים ישר לווקומרס (אישיים או פעולות)
const LIVE_PATH = /^\/(wp-admin|wp-login\.php|wp-json|wp-cron\.php|xmlrpc\.php|cart|checkout|my-account|%d7%a2%d7%92%d7%9c%d7%94|%d7%aa%d7%a9%d7%9c%d7%95%d7%9d|%d7%94%d7%97%d7%a9%d7%91%d7%95%d7%9f-%d7%a9%d7%9c%d7%99)(\/|$|\?)/i;
const LIVE_QUERY = /(^|&)(wc-ajax|add-to-cart|remove_item|removed_item|undo_item|order-received|key|preview|p|page_id|s?nonce|_wpnonce|customize_changeset_uuid)=/;
const LIVE_COOKIE = /(wordpress_logged_in_|wp-postpass_|comment_author_)/;

// כתובת האתר המקורי בכל הצורות שלה (רגילה וכתובה בתוך קוד)
const esc = ORIGIN_HOST.replace(/\./g, '\\.');
const ORIGIN_RE = new RegExp(`https?:(\\\\?/){2}${esc}(?!(\\\\?/)(wp-content|wp-includes)(\\\\?/))`, 'g');

export function isLive(req, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return true;
  if (LIVE_PATH.test(url.pathname)) return true;
  if (LIVE_QUERY.test(url.search.slice(1))) return true;
  if (LIVE_COOKIE.test(req.headers.get('cookie') || '')) return true;
  if (/\.(php|xml|txt)$/i.test(url.pathname) && !/sitemap|robots/i.test(url.pathname)) return true;
  return false;
}

/** קישורים לאתר המקורי הופכים לקישורים באתר הזה. תמונות וקבצים נשארים בשרת המקורי. */
export function rewriteBody(text) {
  // כתובת שמסתיימת בדומיין עצמו (קישור לדף הבית) הופכת ל-"/"
  return text.replace(ORIGIN_RE, (m, ...rest) => {
    const s = rest[rest.length - 1];
    const off = rest[rest.length - 2];
    const next = s.charAt(off + m.length);
    return next === '/' || next === '\\' ? '' : '/';
  });
}

const SPECULATION = `<script type="speculationrules">{"prerender":[{"where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":["/cart*","/checkout*","/my-account*","/wp-*","/*\\\\?*add-to-cart=*","/*\\\\?*wc-ajax=*","/*\\\\?*remove_item=*"]}},{"not":{"selector_matches":"[rel~=nofollow],.add_to_cart_button,[data-no-prefetch]"}}]},"eagerness":"moderate"}]}</script>`;

/** תוספת קטנה לכל עמוד: טעינה מוקדמת של העמוד הבא כשהעכבר עובר מעל קישור, כדי שהמעבר יהיה מיידי */
function enhance(html) {
  let out = html.replace('</head>', `${SPECULATION}</head>`);
  if (!ALLOW_INDEX) out = out.replace('<head>', '<head><meta name="robots" content="noindex,nofollow">');
  return out;
}

function forwardHeaders(req, live) {
  const h = new Headers();
  for (const k of ['accept', 'accept-language', 'content-type', 'user-agent', 'x-requested-with', 'x-wp-nonce', 'nonce', 'cart-token', 'range']) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }
  if (live) {
    const c = req.headers.get('cookie');
    if (c) h.set('cookie', c);
    const ref = req.headers.get('referer');
    if (ref) { try { const r = new URL(ref); h.set('referer', ORIGIN + r.pathname + r.search); } catch {} }
    const o = req.headers.get('origin');
    if (o) h.set('origin', ORIGIN);
  }
  h.set('x-choci-front', '1');
  return h;
}

function copyResponseHeaders(src, { live }) {
  const h = new Headers();
  for (const [k, v] of src.headers) {
    const key = k.toLowerCase();
    if (['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie', 'x-kinsta-cache', 'ki-cache-type', 'ki-edge', 'alt-svc', 'cf-ray', 'server', 'link'].includes(key)) continue;
    if (key === 'location') { h.set('location', rewriteBody(v) || '/'); continue; }
    h.set(k, v);
  }
  if (live && typeof src.headers.getSetCookie === 'function') {
    for (const c of src.headers.getSetCookie()) h.append('set-cookie', c.replace(/;\s*domain=[^;]*/i, ''));
  }
  return h;
}

const isText = (ct = '') => /text\/html|javascript|json|text\/css|xml/i.test(ct);

export async function handle(req) {
  const url = new URL(req.url);
  const target = ORIGIN + url.pathname + url.search;
  const live = isLive(req, url);

  const init = { method: req.method, headers: forwardHeaders(req, live), redirect: 'manual' };
  if (live) {
    init.cache = 'no-store';
    if (!['GET', 'HEAD'].includes(req.method)) { init.body = await req.arrayBuffer(); }
  } else {
    init.next = { revalidate: REVALIDATE, tags: ['page'] };
  }

  let res;
  try {
    res = await fetch(target, init);
  } catch (e) {
    return new Response('האתר אינו זמין כרגע, נסו שוב בעוד רגע.', { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  const headers = copyResponseHeaders(res, { live });
  const ct = res.headers.get('content-type') || '';
  let body;
  if (req.method === 'HEAD' || res.status === 204 || res.status === 304) body = null;
  else if (isText(ct)) {
    let t = rewriteBody(await res.text());
    if (/text\/html/i.test(ct)) t = enhance(t);
    body = t;
  } else body = await res.arrayBuffer();

  if (live) {
    headers.set('cache-control', 'private, no-store');
  } else if (res.ok && /text\/html/i.test(ct)) {
    // הדפדפן שומר את העמוד לדקה, ושרת הקצה לעשר דקות — ובינתיים מרענן ברקע
    headers.set('cache-control', `public, max-age=60, s-maxage=${REVALIDATE}, stale-while-revalidate=86400`);
  }
  if (!ALLOW_INDEX) headers.set('x-robots-tag', 'noindex, nofollow');
  headers.set('x-choci-mode', live ? 'live' : 'cached');
  return new Response(body, { status: res.status, statusText: res.statusText, headers });
}
