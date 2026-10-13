// כל עמודי האתר (קטגוריות, מוצרים, מתכונים, דפי מידע) — בדיוק כמו המקור, מוגשים קלים ומהירים.
// עגלה, קופה, החשבון שלי ופעולות עוברים ישירות לווקומרס.
import { buildFromWp, documentHtml, htmlResponse } from '../../lib/wp';
import { handle, isLive } from '../../lib/mirror';

export const dynamic = 'force-dynamic';

async function GET(req) {
  const url = new URL(req.url);
  if (isLive(req, url) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return handle(req);
  try {
    const p = await buildFromWp(url.pathname + url.search);
    return htmlResponse(documentHtml({ ...p, body: p.body.innerHTML }), { status: p.status });
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
