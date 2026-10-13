// שכבת הנתונים: כל המוצרים, הקטגוריות והמחירים מגיעים מווקומרס (Store API) של צ'וקי.
// ווקומרס נשאר "המחסן" — כאן רק מציגים.
import fs from 'node:fs';
import path from 'node:path';

export const WC_URL = (process.env.WC_URL || 'https://choci.kinsta.cloud').replace(/\/+$/, '');
const API = `${WC_URL}/wp-json/wc/store/v1`;
const REVALIDATE = Number(process.env.REVALIDATE || 600); // שניות עד רענון אוטומטי של עמוד
const MOCK = process.env.MOCK === '1';

function fixture(name) {
  const f = path.join(process.cwd(), 'fixtures', `${name}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

async function api(route, params = {}, { tags = [] } = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));
  const url = `${API}${route}${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, { next: { revalidate: REVALIDATE, tags: ['wc', ...tags] }, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`WooCommerce ${res.status} ${url}`);
  return { data: await res.json(), total: Number(res.headers.get('x-wp-total') || 0), pages: Number(res.headers.get('x-wp-totalpages') || 1) };
}

/** כתובת יחסית מתוך קישור מלא של וורדפרס — כך הכתובות באתר החדש זהות לישנות (חשוב לגוגל) */
export function toPath(url) {
  try {
    const u = new URL(url, WC_URL);
    return decodeURIComponent(u.pathname).replace(/\/+$/, '') + '/';
  } catch { return '/'; }
}

const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };

export async function getCategories() {
  if (MOCK) return fixture('categories') || [];
  const { data } = await api('/products/categories', { per_page: 100 }, { tags: ['cats'] });
  return data
    .filter((c) => c.slug !== 'uncategorized')
    .map((c) => ({ id: c.id, name: unescapeHtml(c.name), slug: dec(c.slug), parent: c.parent, count: c.count, image: c.image?.thumbnail || c.image?.src || '', path: toPath(c.permalink), description: c.description || '' }));
}

export async function getCategoryByPath(segments) {
  const cats = await getCategories();
  const want = '/product-category/' + segments.map(dec).join('/') + '/';
  return cats.find((c) => c.path === want) || cats.find((c) => c.slug === dec(segments[segments.length - 1])) || null;
}

export function slimProduct(p) {
  const minor = p.prices?.currency_minor_unit ?? 2;
  const n = (v) => (v == null || v === '' ? null : Number(v) / 10 ** minor);
  return {
    id: p.id,
    name: unescapeHtml(p.name),
    slug: dec(p.slug),
    path: toPath(p.permalink),
    sku: p.sku || '',
    price: n(p.prices?.price),
    regular: n(p.prices?.regular_price),
    onSale: !!p.on_sale,
    inStock: p.is_in_stock !== false,
    purchasable: p.is_purchasable !== false,
    type: p.type,
    image: p.images?.[0] ? { src: p.images[0].src, thumb: p.images[0].thumbnail, srcset: p.images[0].thumbnail_srcset || p.images[0].srcset || '', alt: p.images[0].alt || unescapeHtml(p.name) } : null,
    images: (p.images || []).map((i) => ({ src: i.src, srcset: i.srcset || '', alt: i.alt || '' })),
    categories: (p.categories || []).map((c) => ({ id: c.id, name: unescapeHtml(c.name), path: toPath(c.link) })),
    short: p.short_description || '',
    description: p.description || '',
    attributes: (p.attributes || []).map((a) => ({ name: a.name, values: (a.terms || []).map((t) => t.name) })),
  };
}

export async function getProducts({ category, page = 1, perPage = 24, orderby, order, onSale, search, include } = {}) {
  if (MOCK) {
    const all = (fixture('products') || []).map(slimProduct);
    const list = category ? all.filter((p) => p.categories.some((c) => c.id === Number(category))) : all;
    return { products: list.slice((page - 1) * perPage, page * perPage), total: list.length, pages: Math.max(1, Math.ceil(list.length / perPage)) };
  }
  const { data, total, pages } = await api('/products', {
    category, page, per_page: perPage, orderby, order, search, include,
    on_sale: onSale ? 'true' : undefined,
  }, { tags: category ? [`cat-${category}`] : [] });
  return { products: data.map(slimProduct), total, pages };
}

export async function getProductBySlug(slug) {
  if (MOCK) {
    const p = (fixture('products') || []).find((x) => dec(x.slug) === dec(slug));
    return p ? slimProduct(p) : null;
  }
  // סינון ?slug= של ווקומרס לא מוצא כתובות בעברית, לכן פונים ישירות ל-/products/<slug>
  const s = dec(slug);
  if (/^\d+$/.test(s)) {
    const { data } = await api('/products', { slug: s }, { tags: ['product'] });
    return data[0] ? slimProduct(data[0]) : null;
  }
  try {
    const { data } = await api(`/products/${encodeURIComponent(s)}`, {}, { tags: ['product'] });
    return data?.id ? slimProduct(data) : null;
  } catch (e) {
    if (String(e.message).includes('WooCommerce 404')) return null;
    throw e;
  }
}

export async function getRelated(id) {
  if (MOCK) return [];
  try {
    const { data } = await api('/products', { related: id, per_page: 8 });
    return data.map(slimProduct);
  } catch { return []; }
}

export function unescapeHtml(s = '') {
  return String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&#8217;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8211;/g, '–').replace(/&#8362;/g, '₪').replace(/&nbsp;/g, ' ');
}

export function formatPrice(n) {
  if (n == null) return '';
  return (Number.isInteger(n) ? String(n) : n.toFixed(2)) + ' ₪';
}

/** קישור להוספה לעגלה באתר הקיים (עד שהעגלה החדשה תהיה מוכנה) */
export function addToCartUrl(id, qty = 1) {
  return `${WC_URL}/?add-to-cart=${id}&quantity=${qty}`;
}
