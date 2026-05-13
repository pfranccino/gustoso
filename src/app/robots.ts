import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/mostrador', '/api/'],
      },
    ],
    sitemap: 'https://gustoso-dun.vercel.app/sitemap.xml',
  };
}
