import './globals.css';
import { Header, Footer } from '../components/Shell';

const SITE = process.env.SITE_URL || 'https://chocistore.com';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: "צ'וקי — מוצרי אפייה וקונדיטוריה בכשרות בד\"ץ", template: "%s | צ'וקי" },
  description: "חנות מוצרי אפייה וקונדיטוריה: חומרי גלם, צבעי מאכל, תבניות, קישוטים ואריזות — בכשרות בד\"ץ העדה החרדית. משלוח חינם מעל 450 ₪.",
  robots: process.env.ALLOW_INDEX === '1' ? { index: true, follow: true } : { index: false, follow: false },
};

export const viewport = { themeColor: '#573D2F', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap" />
        <link rel="preconnect" href={process.env.WC_URL || 'https://choci.kinsta.cloud'} />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
