import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '../../../components/ProductCard';
import { getCategories, getCategoryByPath, getProducts } from '../../../lib/woo';

export const revalidate = 600;
export const dynamicParams = true;

const PER_PAGE = 24;

/** הכתובת זהה לווקומרס: /product-category/<קטגוריה>/ ו-/product-category/<קטגוריה>/page/2/ */
function parse(slug) {
  const s = [...slug];
  let page = 1;
  if (s.length >= 2 && s[s.length - 2] === 'page' && /^\d+$/.test(s[s.length - 1])) { page = Number(s.pop()); s.pop(); }
  return { segs: s, page };
}

export async function generateStaticParams() {
  try {
    const cats = await getCategories();
    return cats.filter((c) => c.count > 0).map((c) => ({ slug: c.path.replace(/^\/product-category\/|\/$/g, '').split('/') }));
  } catch { return []; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { segs, page } = parse(slug);
  const cat = await getCategoryByPath(segs);
  if (!cat) return {};
  return {
    title: page > 1 ? `${cat.name} — עמוד ${page}` : cat.name,
    description: `${cat.name} בצ'וקי — ${cat.count} מוצרים לאפייה וקונדיטוריה בכשרות בד"ץ. משלוח חינם מעל 450 ₪.`,
    alternates: { canonical: cat.path + (page > 1 ? `page/${page}/` : '') },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const { segs, page } = parse(slug);
  const [cat, cats] = await Promise.all([getCategoryByPath(segs), getCategories()]);
  if (!cat) notFound();

  const children = cats.filter((c) => c.parent === cat.id && c.count > 0);
  const parent = cats.find((c) => c.id === cat.parent);
  const { products, total, pages } = await getProducts({ category: cat.id, page, perPage: PER_PAGE, orderby: 'menu_order', order: 'asc' });

  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="פירורי לחם">
        <Link href="/">דף הבית</Link>{parent && <> › <Link href={parent.path}>{parent.name}</Link></>} › {cat.name}
      </nav>
      <div className="cat-head">
        <h1>{cat.name}</h1>
        <small>{total} מוצרים</small>
      </div>
      {children.length > 0 && (
        <div className="subcats">
          {children.map((c) => <Link key={c.id} href={c.path}>{c.name}</Link>)}
        </div>
      )}
      <div className="grid">
        {products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}
      </div>
      {pages > 1 && (
        <nav className="pager" aria-label="עמודים">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
            n === page ? <span key={n} aria-current="page">{n}</span>
              : <Link key={n} href={n === 1 ? cat.path : `${cat.path}page/${n}/`}>{n}</Link>)}
        </nav>
      )}
    </div>
  );
}
