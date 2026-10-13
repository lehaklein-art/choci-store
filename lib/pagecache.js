// זיכרון של עמודים מוכנים: הלקוחה תמיד מקבלת עמוד מוכן מיד.
// כשעמוד "מתיישן", הוא מוגש כמו שהוא ובמקביל נבנה מחדש ברקע — אף אחת לא מחכה.
const store = new Map();
const MAX = Number(process.env.PAGE_CACHE_MAX || 150);

export async function cached(key, ttlMs, build) {
  const now = Date.now();
  const e = store.get(key);
  if (e) {
    store.delete(key); store.set(key, e); // הכי חדש בסוף
    if (now - e.t > ttlMs && !e.busy) {
      e.busy = true;
      build().then((v) => store.set(key, { t: Date.now(), v })).catch(() => {}).finally(() => { e.busy = false; });
    }
    return e.v;
  }
  const v = await build();
  store.set(key, { t: now, v });
  while (store.size > MAX) store.delete(store.keys().next().value);
  return v;
}

export function cacheSize() { return store.size; }

let warmed = false;
/** מכין מראש ברקע, אחד-אחד, את העמודים שהתפריט מקשר אליהם */
export function warmOnce(html, buildOne) {
  if (warmed) return;
  warmed = true;
  const paths = [...new Set([...html.matchAll(/href="(\/(?:product-category|recipes)[^"#?]*)"/g)].map((m) => m[1]))].slice(0, 40);
  (async () => {
    for (const p of paths) {
      try { await buildOne(normKey(p)); } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }
  })();
}

/** אותה כתובת יכולה להגיע בכמה כתיבים (עברית / קידוד באותיות גדולות או קטנות) — מאחדים */
export function normKey(pathname, search = '') {
  let p = pathname;
  try { p = encodeURI(decodeURIComponent(pathname)); } catch {}
  return p + search;
}
