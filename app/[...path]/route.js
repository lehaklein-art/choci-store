// כל עמודי האתר. עמודים שכבר עברו לטכנולוגיה החדשה נבנים כאן מנתונים גולמיים (lib/native.js).
// עגלה, קופה, החשבון שלי ופעולות עוברים ישירות לווקומרס.
import { buildFromWp, documentHtml, htmlResponse } from '../../lib/wp';
import { cached, normKey } from '../../lib/pagecache';
import { handle, isLive } from '../../lib/mirror';
import { isNativePath } from '../../lib/native';
import { serveNative } from '../../lib/serve';

export const dynamic = 'force-dynamic';

async function GET(req) {
  const url = new URL(req.url);
  if (isLive(req, url) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return handle(req);
  if (isNativePath(url.pathname, url.search) && !url.searchParams.has('legacy')) {
    try { const r = await serveNative(req, url); if (r) return r; } catch (e) { console.error('native', url.pathname, e?.message); }
  }
  try {
    const key = normKey(url.pathname, url.search);
    const out = await cached(key, 60e3, async () => {
      const p = await buildFromWp(key);
      return { html: documentHtml({ ...p, body: p.body.innerHTML }), status: p.status };
    });
    return htmlResponse(out.html, { status: out.status });
  } catch {
    return handle(req);
  }
}

export { GET };
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
