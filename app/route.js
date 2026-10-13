// דף הבית (וגם תוצאות חיפוש)
import { buildFromWp, documentHtml, htmlResponse } from '../lib/wp';
import { cached, warmOnce, normKey } from '../lib/pagecache';
import { handle, isLive } from '../lib/mirror';
import { isNativePath, renderNative } from '../lib/native';
import { serveNative } from '../lib/serve';

export const dynamic = 'force-dynamic';

const build = (key) => async () => {
  const p = await buildFromWp(key);
  return { html: documentHtml({ ...p, body: p.body.innerHTML }), status: p.status };
};

export async function GET(req) {
  const url = new URL(req.url);
  if (isLive(req, url)) return handle(req);
  if (isNativePath(url.pathname, url.search) && !url.searchParams.has('legacy')) {
    try { const r = await serveNative(req, url); if (r) return r; } catch (e) { console.error('native /', e?.message); }
  }
  try {
    const key = normKey('/', url.search);
    const out = await cached(key, 60e3, build(key));
    // בפעם הראשונה אחרי עלייה: מכינים מראש ברקע את כל עמודי הקטגוריות שבתפריט
    if (key === '/') {
      warmOnce(out.html, (k) => (/^\/product-category\//.test(k)
        ? cached('n:' + k, 60e3, async () => { const r = await renderNative(k, ''); if (!r) throw new Error('x'); return r; })
        : cached(k, 60e3, build(k))));
    }
    return htmlResponse(out.html, { status: out.status });
  } catch (e) {
    return handle(req);
  }
}
export const HEAD = GET;
export const POST = handle;
