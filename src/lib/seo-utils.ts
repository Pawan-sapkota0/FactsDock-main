/**
 * SEO Utilities for World Facts
 * Handles meta tags, structured data, and SEO best practices
 */

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  robots?: string;
}

export interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
}

/**
 * Update document meta tags
 */
export const updateMetaTags = (meta: MetaTags): void => {
  // Title
  document.title = meta.title;
  updateOrCreateTag("meta", "name", "title", meta.title);

  // Description
  updateOrCreateTag("meta", "name", "description", meta.description);

  // Keywords (if provided)
  if (meta.keywords) {
    updateOrCreateTag("meta", "name", "keywords", meta.keywords);
  }

  // Canonical (if provided)
  if (meta.canonical) {
    updateOrCreateTag("link", "rel", "canonical", meta.canonical, true);
  }

  // Robots
  updateOrCreateTag("meta", "name", "robots", meta.robots || "index, follow");

  // Open Graph
  if (meta.ogImage) {
    updateOrCreateTag("meta", "property", "og:image", meta.ogImage);
  }
  if (meta.ogTitle) {
    updateOrCreateTag("meta", "property", "og:title", meta.ogTitle);
  }
  if (meta.ogDescription) {
    updateOrCreateTag("meta", "property", "og:description", meta.ogDescription);
  }

  // Always set og:type and og:url
  updateOrCreateTag("meta", "property", "og:type", "website");
  updateOrCreateTag("meta", "property", "og:url", window.location.href);

  // Twitter Card
  updateOrCreateTag("meta", "name", "twitter:card", "summary_large_image");
  if (meta.ogTitle) {
    updateOrCreateTag("meta", "name", "twitter:title", meta.ogTitle);
  }
  if (meta.ogDescription) {
    updateOrCreateTag("meta", "name", "twitter:description", meta.ogDescription);
  }
};

/**
 * Update or create a meta/link tag
 */
function updateOrCreateTag(
  tagName: string,
  attrName: string,
  attrValue: string,
  content: string,
  isLink?: boolean
): void {
  let element = document.querySelector(`${tagName}[${attrName}="${attrValue}"]`);

  if (!element) {
    element = document.createElement(tagName);
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }

  if (isLink) {
    (element as HTMLLinkElement).href = content;
  } else {
    (element as HTMLMetaElement).content = content;
  }
}

/**
 * Add structured data (JSON-LD) to page
 */
export const addStructuredData = (data: StructuredData): void => {
  let script = document.querySelector('script[type="application/ld+json"]');

  if (!script) {
    script = document.createElement("script");
    (script as HTMLScriptElement).type = "application/ld+json";
    document.head.appendChild(script);
  }

  (script as HTMLScriptElement).textContent = JSON.stringify(data);
};

/**
 * Generate Organization structured data
 */
export const generateOrganizationSchema = (logoUrl: string): StructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "World Facts",
    url: window.location.origin,
    logo: logoUrl,
    description: "Educational platform providing country facts, global information, and interactive quizzes",
    sameAs: [
      // Add social media URLs if available
    ],
  };
};

/**
 * Generate Website structured data
 */
export const generateWebsiteSchema = (): StructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "World Facts",
    url: window.location.origin,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${window.location.origin}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

/**
 * Generate Article/Fact structured data
 */
export const generateArticleSchema = (data: {
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
}): StructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    image: data.image || `${window.location.origin}/og-image.jpg`,
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: data.author || "World Facts",
    },
  };
};

/**
 * Generate FAQPage structured data
 */
export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
): StructuredData => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

/**
 * Generate Place/Country structured data
 */
export const generatePlaceSchema = (data: {
  name: string;
  description: string;
  image?: string;
  url?: string;
  geo?: { latitude: number; longitude: number };
}): StructuredData => {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: data.name,
    description: data.description,
    url: data.url || window.location.href,
  };

  if (data.image) {
    schema.image = data.image;
  }

  if (data.geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    };
  }

  return schema as StructuredData;
};

/**
 * Keyword strategy for World Facts
 */
export const KEYWORD_STRATEGY = {
  primary: [
    "world facts",
    "country facts",
    "facts about countries",
    "world quizzes",
    "geography quizzes",
  ],
  secondary: [
    "interesting facts about countries",
    "fun quizzes about the world",
    "educational geography quizzes",
    "global knowledge",
    "country information",
    "geography learning",
  ],
  longtail: [
    "fun facts about [country]",
    "interesting trivia about [country]",
    "quiz about [country]",
    "learn about [country]",
    "facts about [country] for kids",
  ],
};

/**
 * Page meta tag templates
 */
export const PAGE_TEMPLATES = {
  home: {
    title: "World Facts | Global Knowledge",
    description: "Explore fascinating facts, country data, and fun quizzes from around the world. Learn geography the smart way.",
    keywords: "world facts, country facts, geography quizzes, fun facts",
  },
  facts: {
    title: "World Facts | Country Facts & Information",
    description: "Discover detailed facts about countries worldwide. Learn culture, geography, history, economy, and more.",
    keywords: "country facts, world information, geography, facts about countries",
  },
  quizzes: {
    title: "World Facts | Geography Quizzes",
    description: "Challenge yourself with fun, educational geography quizzes. Test your knowledge about countries, capitals, and global facts.",
    keywords: "geography quizzes, world quizzes, country quizzes, educational quizzes",
  },
  funzone: {
    title: "World Facts | Fun Zone",
    description: "Enjoy interactive games and quizzes to learn about the world in a fun way. Perfect for students and curious minds.",
    keywords: "educational games, quizzes, fun learning, interactive education",
  },
  country: (countryName: string) => ({
    title: `World Facts | ${countryName}`,
    description: `Explore fascinating facts about ${countryName}. Learn about culture, geography, history, economy, and interesting trivia.`,
    keywords: `${countryName} facts, facts about ${countryName}, ${countryName} information, ${countryName} quiz`,
  }),
  about: {
    title: "World Facts | About",
    description: "Learn about World Facts - an educational platform dedicated to spreading global knowledge through facts, information, and interactive quizzes.",
    keywords: "about world facts, educational platform, global knowledge",
  },
  contact: {
    title: "World Facts | Contact Us",
    description: "Get in touch with the World Facts team. We'd love to hear your feedback, suggestions, and questions.",
    keywords: "contact world facts, support, feedback",
  },
};

/**
 * Get page templates with settings applied dynamically
 * This allows admin settings to override hardcoded templates
 */
export const getPageTemplatesWithSettings = (settings: {
  website_name: string;
  meta_description: string;
  meta_keywords: string;
  meta_title: string;
}) => {
  const { website_name, meta_description, meta_keywords } = settings;
  
  return {
    home: {
      title: `${website_name} | Global Knowledge`,
      description: meta_description,
      keywords: meta_keywords,
    },
    facts: {
      title: `${website_name} | Country Facts & Information`,
      description: meta_description,
      keywords: meta_keywords,
    },
    quizzes: {
      title: `${website_name} | Geography Quizzes`,
      description: meta_description,
      keywords: meta_keywords,
    },
    funzone: {
      title: `${website_name} | Fun Zone`,
      description: meta_description,
      keywords: meta_keywords,
    },
    country: (countryName: string) => ({
      title: `${website_name} | ${countryName}`,
      description: `Explore fascinating facts about ${countryName}. Learn about culture, geography, history, economy, and interesting trivia.`,
      keywords: `${countryName} facts, facts about ${countryName}, ${countryName} information, ${countryName} quiz`,
    }),
    about: {
      title: `${website_name} | About`,
      description: meta_description,
      keywords: meta_keywords,
    },
    contact: {
      title: `${website_name} | Contact Us`,
      description: meta_description,
      keywords: meta_keywords,
    },
  };
};

/**
 * Generate SEO report for a page
 */
export const generateSEOReport = (meta: MetaTags): string[] => {
  const issues: string[] = [];

  // Title checks
  if (!meta.title) {
    issues.push("❌ Missing page title");
  } else if (meta.title.length < 30) {
    issues.push("⚠️ Title too short (should be 50-60 characters)");
  } else if (meta.title.length > 60) {
    issues.push("⚠️ Title too long (should be 50-60 characters)");
  } else {
    issues.push("✅ Title length is good");
  }

  // Description checks
  if (!meta.description) {
    issues.push("❌ Missing meta description");
  } else if (meta.description.length < 100) {
    issues.push("⚠️ Description too short (should be 140-160 characters)");
  } else if (meta.description.length > 160) {
    issues.push("⚠️ Description too long (should be 140-160 characters)");
  } else {
    issues.push("✅ Description length is good");
  }

  // Keywords checks
  if (!meta.keywords) {
    issues.push("⚠️ No keywords specified");
  } else {
    issues.push("✅ Keywords defined");
  }

  // OG tags
  if (!meta.ogImage) {
    issues.push("⚠️ No Open Graph image");
  } else {
    issues.push("✅ Open Graph image set");
  }

  return issues;
};
