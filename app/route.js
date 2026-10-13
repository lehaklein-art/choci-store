// דף הבית (וגם תוצאות חיפוש) — בדיוק כמו המקור, מוגש קל ומהיר
import { buildFromWp, documentHtml, htmlResponse } from '../lib/wp';
import { cached, warmOnce } from '../lib/pagecache';
import { handle, isLive } from '../lib/mirror';

export const dynamic = 'force-dynamic';

const build = (key) => async () => {
  const p = await buildFromWp(key);
  return { html: documentHtml({ ...p, body: p.body.innerHTML }), status: p.status };
};

export async function GET(req) {
  const url = new URL(req.url);
  if (isLive(req, url)) return handle(req);
  try {
    const key = '/' + url.search;
    const out = await cached(key, 60e3, build(key));
    // בפעם הראשונה אחרי עלייה: מכינים מראש ברקע את כל עמודי הקטגוריות שבתפריט
    if (key === '/') warmOnce(out.html, (k) => cached(k, 60e3, build(k)));
    return htmlResponse(out.html, { status: out.status });
  } catch (e) {
    return handle(req);
  }
}
export const HEAD = GET;
export const POST = handle;
