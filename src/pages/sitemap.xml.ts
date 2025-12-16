import type { APIRoute } from 'astro';
import { getAllPosts } from '../data/blogPosts';

export const GET: APIRoute = () => {
  const baseUrl = 'https://gamelayer.io';
  const currentDate = new Date().toISOString();
  
  // Get all blog posts
  const blogPosts = getAllPosts();
  
  // Generate blog post URLs
  const blogPostUrls = blogPosts.map(post => {
    const lastmod = new Date(post.date).toISOString();
    return `  <url>
    <loc>${baseUrl}/blog/${post.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');
  
  // Calculate blog pagination pages
  const POSTS_PER_PAGE = 6;
  const totalPages = Math.ceil(blogPosts.length / POSTS_PER_PAGE);
  const blogPaginationUrls = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(page => page > 1) // Page 1 is /blog
    .map(page => `  <url>
    <loc>${baseUrl}/blog/page/${page}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/_astro/gamelayer_logo_blue.BKvJnu9N.png</image:loc>
      <image:title>GameLayer Logo</image:title>
      <image:caption>GameLayer - Gamification API Platform</image:caption>
    </image:image>
  </url>
  
  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/blog/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/api-docs/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/about/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Blog Pagination Pages -->
${blogPaginationUrls}
  
  <!-- Blog Posts -->
${blogPostUrls}
  
  <!-- Legal Pages -->
  <url>
    <loc>${baseUrl}/privacy-policy/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/terms-of-service/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/dpa/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400'
    },
  });
};
