#!/usr/bin/env node

/**
 * Generate sitemap.xml for FactsDock
 * Usage: npm run generate-sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generateSitemap = () => {
  // Read countries data
  const countriesPath = path.join(__dirname, '../src/lib/countries.ts');
  const countriesContent = fs.readFileSync(countriesPath, 'utf-8');
  
  // Extract countries from the TypeScript file
  const countriesMatch = countriesContent.match(/export const COUNTRIES_A_TO_Z = \[([\s\S]*?)\];/);
  if (!countriesMatch) {
    console.error('❌ Could not find COUNTRIES_A_TO_Z in countries.ts');
    process.exit(1);
  }
  
  const countriesStr = countriesMatch[1];
  const countries = countriesStr
    .split('\n')
    .filter(line => line.includes('"') || line.includes("'"))
    .map(line => {
      const match = line.match(/["']([^"']+)["']/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
  
  console.log(`✅ Found ${countries.length} countries`);
  
  // Base URL
  const baseUrl = process.env.SITEMAP_URL || 'https://factsdock.com';
  const now = new Date().toISOString().split('T')[0];
  
  // Build XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Home page
  xml += '  <url>\n';
  xml += `    <loc>${escapeXml(baseUrl)}</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  xml += '  </url>\n';
  
  // Main pages
  const mainPages = [
    { path: '/facts', priority: 0.9, changefreq: 'daily' },
    { path: '/quiz', priority: 0.9, changefreq: 'daily' },
    { path: '/fun-zone', priority: 0.8, changefreq: 'daily' },
    { path: '/about', priority: 0.7, changefreq: 'monthly' },
    { path: '/contact', priority: 0.7, changefreq: 'monthly' },
    { path: '/privacy-policy', priority: 0.5, changefreq: 'yearly' },
    { path: '/terms-and-conditions', priority: 0.5, changefreq: 'yearly' },
  ];
  
  mainPages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(baseUrl + page.path)}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Country pages
  countries.forEach((country, index) => {
    const daysAgo = Math.floor(index / 10);
    const lastmod = new Date();
    lastmod.setDate(lastmod.getDate() - daysAgo);
    const lastmodStr = lastmod.toISOString().split('T')[0];
    
    const slug = country.toLowerCase().replace(/ /g, '-');
    
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(baseUrl + '/country/' + slug)}</loc>\n`;
    xml += `    <lastmod>${lastmodStr}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  });
  
  // Category pages
  const categories = ['geography', 'history', 'culture', 'economy', 'facts', 'nature'];
  categories.forEach(category => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(baseUrl + '/categories/' + category)}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });
  
  xml += '</urlset>\n';
  
  // Write file
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, xml);
  
  console.log(`\n✅ Sitemap generated successfully!`);
  console.log(`📁 Location: ${outputPath}`);
  console.log(`📊 Total URLs: ${countries.length + mainPages.length + categories.length + 1}`);
  console.log(`🌐 Base URL: ${baseUrl}`);
  console.log(`\n✨ Ready to submit to Google Search Console at: ${baseUrl}/sitemap.xml`);
};

function escapeXml(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };
  return str.replace(/[&<>"']/g, char => map[char]);
}

try {
  generateSitemap();
} catch (error) {
  console.error('❌ Error generating sitemap:', error.message);
  process.exit(1);
}
