/** הכתובות עוברות כמו שהן, בלי שינוי — בדיוק כמו באתר המקורי */
const nextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: '/choci-lite.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};
export default nextConfig;
