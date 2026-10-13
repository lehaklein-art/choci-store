import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '60px 16px', textAlign: 'center' }}>
      <h1>העמוד לא נמצא</h1>
      <p>אולי המוצר הועבר או שהקישור שגוי.</p>
      <Link className="btn" href="/">לדף הבית</Link>
    </div>
  );
}
