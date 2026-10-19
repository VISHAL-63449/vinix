import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.vinix.online';
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_ROUTES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/internships', changefreq: 'daily', priority: '0.9' },
  { path: '/domains', changefreq: 'weekly', priority: '0.9' },
  { path: '/about', changefreq: 'weekly', priority: '0.8' },
  { path: '/founder', changefreq: 'weekly', priority: '0.8' },
  { path: '/reviews', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.7' },
  { path: '/verify', changefreq: 'monthly', priority: '0.7' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.5' },
  { path: '/terms', changefreq: 'monthly', priority: '0.5' },
  { path: '/refund', changefreq: 'monthly', priority: '0.5' }
];

const DOMAIN_SLUGS = [
  'artificial-intelligence',
  'backend-development',
  'blockchain',
  'c-cpp-development',
  'cloud-computing',
  'cyber-security',
  'data-science',
  'database-management',
  'devops',
  'digital-marketing',
  'frontend-development',
  'full-stack-development',
  'iot',
  'java-development',
  'machine-learning',
  'mobile-app-development',
  'python-development',
  'software-testing',
  'ui-ux-design',
  'web-development'
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add static routes
for (const route of STATIC_ROUTES) {
  xml += `  <url>
    <loc>${BASE_URL}${route.path || '/'}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
}

// Add domain detail routes
for (const slug of DOMAIN_SLUGS) {
  xml += `  <url>
    <loc>${BASE_URL}/domains/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
}

xml += `</urlset>
`;

const outputPath = path.resolve(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`Generated canonical sitemap with ${STATIC_ROUTES.length + DOMAIN_SLUGS.length} URLs at ${outputPath}`);
