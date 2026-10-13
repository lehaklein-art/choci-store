// דף הבית — בדיוק כמו המקור, מוגש קל ומהיר
import { buildFromWp, documentHtml, htmlResponse } from '../lib/wp';
import { handle } from '../lib/mirror';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const url = new URL(req.url);
  if (url.search) return handle(req); // דף הבית עם פרמטרים (חיפוש, פעולות) — עובר לווקומרס
  try {
    const p = await buildFromWp('/');
    return htmlResponse(documentHtml({ ...p, body: p.body.innerHTML }));
  } catch (e) {
    return handle(req);
  }
}
export const HEAD = GET;
export const POST = handle;
