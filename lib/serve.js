// הגשת עמוד שנבנה בטכנולוגיה החדשה, עם זיכרון עמודים מוכנים
import { htmlResponse as nativeResponse } from './document';
import { cached, normKey } from './pagecache';
import { renderNative } from './native';

export async function serveNative(req, url) {
  const key = 'n:' + normKey(url.pathname, url.search);
  const out = await cached(key, 60e3, async () => {
    const r = await renderNative(normKey(url.pathname), url.search.replace(/^\?/, ''));
    return r || { fallback: true }; // עמוד שעוד לא עבר — זוכרים את זה כדי לא לבדוק שוב בכל כניסה
  });
  if (out.fallback) { return null; }
  if (out.redirect) {
    return new Response(null, { status: out.status, headers: { location: out.redirect, 'cache-control': 'public, max-age=300' } });
  }
  return nativeResponse(out.html, { status: out.status });
}

