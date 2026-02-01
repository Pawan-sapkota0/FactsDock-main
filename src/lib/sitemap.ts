/**
 * Sitemap Generation for FactsDock
 * Generates dynamic XML sitemap for SEO
 */

import { COUNTRIES_A_TO_Z } from "./countries";

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Generate complete sitemap entries for FactsDock
 */
export const generateSitemapEntries = (baseUrl: string): SitemapEntry[] => {
  const now = new Date().toISOString().split("T")[0];
  const entries: SitemapEntry[] = [];

  // Home page
  entries.push({
    url: baseUrl,
    lastmod: now,
    changefreq: "weekly",
    priority: 1.0,
  });

  // Main navigation pages
  const mainPages = [
    {
      path: "/",
      priority: 1.0,
      changefreq: "weekly" as const,
    },
    {
      path: "/facts",
      priority: 0.9,
      changefreq: "daily" as const,
    },
    {
      path: "/quiz",
      priority: 0.9,
      changefreq: "daily" as const,
    },
    {
      path: "/fun-zone",
      priority: 0.8,
      changefreq: "daily" as const,
    },
    {
      path: "/about",
      priority: 0.7,
      changefreq: "monthly" as const,
    },
    {
      path: "/contact",
      priority: 0.7,
      changefreq: "monthly" as const,
    },
    {
      path: "/privacy-policy",
      priority: 0.5,
      changefreq: "yearly" as const,
    },
    {
      path: "/terms-and-conditions",
      priority: 0.5,
      changefreq: "yearly" as const,
    },
  ];

  mainPages.forEach((page) => {
    entries.push({
      url: `${baseUrl}${page.path}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  // Country pages (all 195 countries)
  COUNTRIES_A_TO_Z.forEach((country, index) => {
    // Stagger lastmod dates to make sitemap look more realistic
    const daysAgo = Math.floor(index / 10);
    const lastmod = new Date();
    lastmod.setDate(lastmod.getDate() - daysAgo);
    const lastmodStr = lastmod.toISOString().split("T")[0];

    entries.push({
      url: `${baseUrl}/country/${country.toLowerCase().replace(/ /g, "-")}`,
      lastmod: lastmodStr,
      changefreq: "weekly",
      priority: 0.8,
    });
  });

  // Category pages
  const categories = [
    "geography",
    "history",
    "culture",
    "economy",
    "facts",
    "nature",
  ];

  categories.forEach((category) => {
    entries.push({
      url: `${baseUrl}/categories/${category}`,
      lastmod: now,
      changefreq: "weekly",
      priority: 0.7,
    });

    // Subcategory pages (example subcategories)
    const subcategories: Record<string, string[]> = {
      geography: ["capitals", "borders", "landmarks", "climate"],
      history: ["independence", "revolutions", "ancient", "modern"],
      culture: ["languages", "traditions", "cuisine", "arts"],
      economy: ["trade", "currency", "industries", "development"],
      facts: ["population", "demographics", "records", "trivia"],
      nature: ["wildlife", "vegetation", "climate", "disasters"],
    };

    if (subcategories[category]) {
      subcategories[category].forEach((subcat) => {
        entries.push({
          url: `${baseUrl}/categories/${category}/${subcat}`,
          lastmod: now,
          changefreq: "weekly",
          priority: 0.6,
        });
      });
    }
  });

  return entries;
};

/**
 * Generate XML sitemap string
 */
export const generateXMLSitemap = (entries: SitemapEntry[]): string => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  entries.forEach((entry) => {
    xml.push("  <url>");
    xml.push(`    <loc>${escapeXml(entry.url)}</loc>`);
    if (entry.lastmod) {
      xml.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    }
    if (entry.changefreq) {
      xml.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }
    if (entry.priority !== undefined) {
      xml.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
    }
    xml.push("  </url>");
  });

  xml.push("</urlset>");
  return xml.join("\n");
};

/**
 * Generate sitemap index (for splitting large sitemaps)
 */
export const generateSitemapIndex = (sitemapUrls: string[]): string => {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  sitemapUrls.forEach((url) => {
    xml.push("  <sitemap>");
    xml.push(`    <loc>${escapeXml(url)}</loc>`);
    xml.push(`    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>`);
    xml.push("  </sitemap>");
  });

  xml.push("</sitemapindex>");
  return xml.join("\n");
};

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate robots.txt content
 */
export const generateRobotsTxt = (
  baseUrl: string,
  allowCrawling: boolean = true
): string => {
  const lines = [
    "# FactsDock robots.txt",
    `# Generated on ${new Date().toISOString()}`,
    "",
    "# Default rules for all crawlers",
    "User-agent: *",
  ];

  if (allowCrawling) {
    lines.push("Allow: /");
    lines.push("Disallow: /admin");
    lines.push("Disallow: /api");
    lines.push("Disallow: /*.json$");
    lines.push("Disallow: /*?*sort=");
    lines.push("Disallow: /*?*filter=");
  } else {
    lines.push("Disallow: /");
  }

  lines.push("");
  lines.push("# Specific rules for search engines");
  lines.push("User-agent: Googlebot");
  lines.push("Allow: /");
  lines.push("Crawl-delay: 0");
  lines.push("");
  lines.push("User-agent: Bingbot");
  lines.push("Allow: /");
  lines.push("Crawl-delay: 1");
  lines.push("");
  lines.push("# Reference to sitemap");
  lines.push(`Sitemap: ${baseUrl}/sitemap.xml`);

  return lines.join("\n");
};

/**
 * Type for robots.txt rules
 */
export interface RobotsRules {
  userAgent: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  requestRate?: number;
}

/**
 * Generate advanced robots.txt with custom rules
 */
export const generateAdvancedRobotsTxt = (
  baseUrl: string,
  rules: RobotsRules[] = []
): string => {
  let content = [
    "# FactsDock robots.txt",
    `# Generated on ${new Date().toISOString()}`,
    "",
  ].join("\n");

  // Default rules
  const defaultRules: RobotsRules[] = [
    {
      userAgent: "*",
      allow: ["/"],
      disallow: ["/admin", "/api", "/*.json$", "/*?*sort=", "/*?*filter="],
    },
    {
      userAgent: "Googlebot",
      allow: ["/"],
      crawlDelay: 0,
    },
    {
      userAgent: "Bingbot",
      allow: ["/"],
      crawlDelay: 1,
    },
  ];

  const allRules = [...defaultRules, ...rules];

  allRules.forEach((rule, index) => {
    if (index > 0) content += "\n";
    content += `User-agent: ${rule.userAgent}\n`;

    if (rule.allow && rule.allow.length > 0) {
      rule.allow.forEach((path) => {
        content += `Allow: ${path}\n`;
      });
    }

    if (rule.disallow && rule.disallow.length > 0) {
      rule.disallow.forEach((path) => {
        content += `Disallow: ${path}\n`;
      });
    }

    if (rule.crawlDelay !== undefined) {
      content += `Crawl-delay: ${rule.crawlDelay}\n`;
    }

    if (rule.requestRate !== undefined) {
      content += `Request-rate: ${rule.requestRate}\n`;
    }
  });

  content += `\n# Reference to sitemap\nSitemap: ${baseUrl}/sitemap.xml\n`;

  return content;
};
