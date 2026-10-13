import ProductCard from '../../components/ProductCard';
import { getProducts } from '../../lib/woo';

export const metadata = { title: 'חיפוש', robots: { index: false } };

export default async function SearchPage({ searchParams }) {
  const { q = '' } = await searchParams;
  const term = String(q).trim();
  const { products, total } = term ? await getProducts({ search: term, perPage: 48 }).catch(() => ({ products: [], total: 0 })) : { products: [], total: 0 };
  return (
    <div className="wrap">
      <div className="cat-head"><h1>{term ? `תוצאות עבור "${term}"` : 'חיפוש'}</h1>{term && <small>{total} מוצרים</small>}</div>
      {term && products.length === 0 && <p>לא מצאנו מוצרים. נסי מילה אחרת או כתיב אחר.</p>}
      <div className="grid">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </div>
  );
}
