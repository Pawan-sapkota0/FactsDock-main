/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
import { supabase, SUPABASE_AVAILABLE } from '@/integrations/supabase/client';
import { generateMockFacts, generateMockQuiz } from './mockData';

// Simple in-memory cache for the current session
const memoryCache = new Map<string, { ts: number; value: any }>();

// Helper: localStorage-backed cache with TTL (seconds)
function cacheKey(prefix: string, key: string) {
  return `wf:${prefix}:${key}`;
}

function setLocalCache(prefix: string, key: string, value: any, ttlSeconds = 3600) {
  try {
    const obj = { ts: Date.now(), ttl: ttlSeconds * 1000, value };
    localStorage.setItem(cacheKey(prefix, key), JSON.stringify(obj));
  } catch (e) {
    // ignore
  }
}

function getLocalCache(prefix: string, key: string) {
  try {
    const raw = localStorage.getItem(cacheKey(prefix, key));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > obj.ttl) {
      localStorage.removeItem(cacheKey(prefix, key));
      return null;
    }
    return obj.value;
  } catch (e) {
    return null;
  }
}

// Return the raw cached object { ts, ttl, value } or null if not present/expired
export function getLocalCacheMeta(prefix: string, key: string) {
  try {
    const raw = localStorage.getItem(cacheKey(prefix, key));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > obj.ttl) {
      localStorage.removeItem(cacheKey(prefix, key));
      return null;
    }
    return obj;
  } catch (e) {
    return null;
  }
}

async function callGenerateContent(body: Record<string, any>) {
  if (!SUPABASE_AVAILABLE) {
    // Return deterministic mock data for local development. Use the request body type to decide.
    const t = (body.type || 'fun-facts').toLowerCase();
    if (t === 'quiz') {
      const cnt = body.questionCount || 10;
      return generateMockQuiz(body.country || body.topic || 'General', cnt as number);
    }
    // for 'fun-facts' or 'world-facts'
    const category = body.category || 'General';
    // return a modest number of items so paging works
    return generateMockFacts(category, 60);
  }

  try {
    const res = await supabase.functions.invoke('generate-content', { body });
    if (res.error) throw res.error;
    return res.data?.data || [];
  } catch (e) {
    console.warn('Supabase function failed or unreachable - returning empty result', e);
    return [];
  }
}

export async function fetchCountryByName(countryName: string, opts?: { ttl?: number; force?: boolean }) {
  const key = countryName.toLowerCase().trim();
  // check in-memory
  if (!opts?.force) {
    const mem = memoryCache.get('country:' + key);
    if (mem) return mem.value;

    // check localStorage
    const local = getLocalCache('country', key);
    if (local) {
      memoryCache.set('country:' + key, { ts: Date.now(), value: local });
      return local;
    }
  }

  // Prefer Supabase function but fallback to RestCountries
  try {
  const res = await supabase.functions.invoke('fetch-country-data', { body: { countryName } });
    if (res.error) throw res.error;
    const value = res.data?.data || [];
    memoryCache.set('country:' + key, { ts: Date.now(), value });
    setLocalCache('country', key, value, opts?.ttl || 86400);
    return value;
  } catch (e) {
    const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}`;
    const r = await fetch(url);
    if (!r.ok) return [];
    const data = await r.json();
    memoryCache.set('country:' + key, { ts: Date.now(), value: data });
    setLocalCache('country', key, data, opts?.ttl || 86400);
    return data || [];
  }
}

export async function fetchFactsByCategory(
  typeOrFactType: string,
  categoryOrCategory: string,
  opts?: { ttl?: number; force?: boolean; fact_type_id?: string; category_id?: string; subcategory_id?: string }
) {
  const key = `${typeOrFactType}:${categoryOrCategory}`.toLowerCase();
  if (!opts?.force) {
    const mem = memoryCache.get(key);
    if (mem) return mem.value;
    const local = getLocalCache('facts', key);
    if (local) {
      memoryCache.set(key, { ts: Date.now(), value: local });
      return local;
    }
  }
  // Try to read approved facts from the database first. The `category` may be
  // a category label or a combined "Category — Subcategory" label used by the
  // UI. If no approved facts are found, fall back to AI-generated content.
  

  // Prefer ID-based queries: fact_type_id (required), category_id (required), optional subcategory_id.
  // Fallback to name/slug resolution only when IDs are not supplied.
  try {
    if (SUPABASE_AVAILABLE) {
      let factTypeId: string | null = opts?.fact_type_id || null;
      let categoryId: string | null = opts?.category_id || null;
      let subcategoryId: string | null = opts?.subcategory_id || null;
      // Resolve factTypeId when the caller passed a slug (e.g., 'fun-facts' or 'world-facts')
      if (!factTypeId) {
        const maybeSlug = String(typeOrFactType || '').trim();
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(maybeSlug);
        if (isUuid) {
          factTypeId = maybeSlug;
        } else if (maybeSlug) {
          try {
            const ftResp: any = await supabase.from('fact_types').select('id,slug').eq('slug', maybeSlug).maybeSingle();
            factTypeId = ftResp?.data?.id || null;
          } catch (e) {
            factTypeId = null;
          }
        }
      }
      // Resolve categoryId from name/slug if not provided
      if (!categoryId) {
        const parts = String(categoryOrCategory || '').split(' — ').map((s) => s.trim());
        const categoryName = parts[0] || '';
        const subName = parts.length > 1 ? parts.slice(1).join(' — ') : null;
        if (factTypeId && categoryName) {
          try {
            const catResp: any = await supabase.from('categories').select('id,name,fact_type_id').eq('name', categoryName).eq('fact_type_id', factTypeId).maybeSingle();
            categoryId = catResp?.data?.id || null;
          } catch (e) {}
        }
        if (!categoryId && factTypeId && categoryName) {
          try {
            const catResp2: any = await supabase.from('categories').select('id,name,fact_type_id').ilike('name', categoryName).eq('fact_type_id', factTypeId).maybeSingle();
            categoryId = catResp2?.data?.id || null;
          } catch (e) {}
        }
        if (!categoryId && factTypeId && categoryName) {
          try {
            const candidates: any = await supabase.from('categories').select('id,name,fact_type_id').eq('fact_type_id', factTypeId);
            const list = candidates?.data || [];
            const normalize = (s = '') =>
              String(s)
                .toLowerCase()
                .replace(/&/g, 'and')
                .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
                .replace(/\s+/g, ' ')
                .trim();
            const target = normalize(categoryName);
            // prefer exact normalized match
            let found = list.find((c: any) => normalize(c.name) === target);
            // fallback: try matching by slug-like form (dashes)
            if (!found) {
              const slugify = (s: string) => normalize(s).replace(/\s+/g, '-');
              const targetSlug = slugify(categoryName);
              found = list.find((c: any) => slugify(c.name) === targetSlug || normalize(c.name).includes(target) || target.includes(normalize(c.name)));
            }
            if (found) categoryId = found.id;
          } catch (e) {}
        }
        // Resolve subcategory id if needed
        if (categoryId && subName && !subcategoryId) {
          try {
            const subResp: any = await supabase.from('subcategories').select('id,name,category_id').eq('category_id', categoryId).eq('name', subName).maybeSingle();
            subcategoryId = subResp?.data?.id || null;
          } catch (e) {}
        }
      }
      if (process.env.NODE_ENV !== 'production') {
        try { console.debug('[fetchFactsByCategory] resolved ids', { factTypeId, categoryId, subcategoryId, typeOrFactType, categoryOrCategory }); } catch (e) {}
      }
      // If we have a categoryId (and optional subcategoryId), query facts directly by ids
      if (categoryId) {
        // Build query that returns category-level facts (subcategory_id IS NULL)
        // and all facts under that category's subcategories when no subcategory selected.
        let qBase = supabase.from('facts').select('id, title, fact_text, metadata, category_id, subcategory_id, fact_type_id').eq('status', 'approved').eq('category_id', categoryId);
        if (subcategoryId) {
          qBase = qBase.eq('subcategory_id', subcategoryId);
        } else {
          // fetch subcategory ids for this category and include them in the query
          try {
            const subListResp: any = await supabase.from('subcategories').select('id').eq('category_id', categoryId);
            const subs = (subListResp?.data || []).map((s: any) => s.id).filter(Boolean);
            if (subs.length > 0) {
              // Build OR: subcategory_id IS NULL OR subcategory_id IN (ids)
              const ids = subs.join(',');
              qBase = qBase.or(`subcategory_id.is.null,subcategory_id.in.(${ids})`);
            } else {
              // No subcategories: only category-level facts
              qBase = qBase.is('subcategory_id', null);
            }
          } catch (e) {
            // fallback: only category-level facts
            qBase = qBase.is('subcategory_id', null);
          }
        }
        if (factTypeId) qBase = qBase.eq('fact_type_id', factTypeId);
        const factsResp: any = await qBase.order('created_at', { ascending: false });
        if (process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] factsResp', { factsResp }); } catch (e) {}
        }
        const rows = factsResp?.data || [];
        if (rows && rows.length > 0) {
          const normalized = rows.map((r: any) => ({
            id: r.id,
            title: r.title || null,
            fact: r.fact_text || r.fact || r.description || r.title || null,
            fact_text: r.fact_text || null,
            metadata: r.metadata || null,
            category_id: r.category_id || null,
            subcategory_id: r.subcategory_id || null,
            fact_type_id: r.fact_type_id || null,
            category: categoryOrCategory,
            subcategory: null,
          }));
          if (process.env.NODE_ENV !== 'production') {
            try { console.debug('[fetchFactsByCategory] returning', { count: normalized.length }); } catch (e) {}
          }
          memoryCache.set(key, { ts: Date.now(), value: normalized });
          setLocalCache('facts', key, normalized, opts?.ttl || 86400);
          return normalized;
        }
      }
    }
  } catch (e) {
    console.warn('DB lookup for facts failed, falling back to generator', e);
  }
 

  // If Supabase is available, DO NOT generate AI content on the public site.
  // Return an empty list so the frontend only shows approved facts from the DB.
  if (SUPABASE_AVAILABLE) {
    if (process.env.NODE_ENV !== 'production') {
      try { console.debug('[fetchFactsByCategory] no approved facts found in DB for', { typeOrFactType, categoryOrCategory }); } catch (e) {}
    }
    const empty: any[] = [];
    memoryCache.set(key, { ts: Date.now(), value: empty });
    setLocalCache('facts', key, empty, opts?.ttl || 300);
    return empty;
  }

  // If Supabase is not available (local dev), fallback to AI-generated content for convenience
  const body = { type: typeOrFactType, category: categoryOrCategory };
  const result = await callGenerateContent(body);
  const resultWithLabels = (Array.isArray(result) ? result : [result]).map((item: any) => ({
    ...item,
    category: categoryOrCategory,
    subcategory: null,
    fact: item.fact || item.description || item.title || item.text || null,
    fact_text: item.fact || item.description || item.title || item.text || null,
  }));
  memoryCache.set(key, { ts: Date.now(), value: resultWithLabels });
  setLocalCache('facts', key, resultWithLabels, opts?.ttl || 86400);
  // notify interested components to reload
  try {
    window.dispatchEvent(new CustomEvent('wf:facts-updated'));
  } catch (e) {}
  return resultWithLabels;
}

export function clearFactsCacheForKey(type: string, category: string) {
  try {
    const k = `wf:facts:${type.toLowerCase()}:${category.toLowerCase()}`;
    memoryCache.delete(`${type}:${category}`.toLowerCase());
    localStorage.removeItem(k);
  } catch (e) {}
  try { window.dispatchEvent(new CustomEvent('wf:facts-updated', { detail: { type, category } })); } catch (e) {}
}

/**
 * Clear all facts-related caches (in-memory and localStorage) and notify listeners.
 * This is intended to be called by admin workflows after publish/approve/delete.
 */
export function clearFactsCacheAll() {
  try {
    // remove memory cache entries related to facts, countries and quizzes
    for (const k of Array.from(memoryCache.keys())) {
      if (
        k.startsWith('fun-facts:') ||
        k.startsWith('world-facts:') ||
        k.startsWith('country:') ||
        k.startsWith('quiz:') ||
        k.startsWith('facts:')
      ) {
        memoryCache.delete(k);
      }
    }

    // remove localStorage keys created by this module
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('wf:facts:') || key.startsWith('wf:country:') || key.startsWith('wf:quiz:')) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // ignore
  }
  try { window.dispatchEvent(new CustomEvent('wf:facts-updated')); } catch (e) {}
}

/**
 * Fetch facts for a specific country and category. This composes a category label
 * that includes the country so generators receive contextual info. It caches under
 * a country-specific key to avoid collisions with global category pages.
 */
export async function fetchFactsForCountry(country: string, category: string, opts?: { ttl?: number; force?: boolean; fact_type_id?: string }) {
  const label = `${category} of ${country}`;
  const key = `country:${country.toLowerCase().trim()}: ${category.toLowerCase().trim()}`;
  if (!opts?.force) {
    const mem = memoryCache.get(key);
    if (mem) return mem.value;
    const local = getLocalCache('facts', key);
    if (local) {
      memoryCache.set(key, { ts: Date.now(), value: local });
      return local;
    }
  }

  // For country-scoped fetches we should prefer resolving the category in
  // the `country-facts` fact_type context and then fetch facts tied to that
  // category (avoids accidental cross-type matches).
  try {
    // try to resolve a category under the `country-facts` fact_type
    const ftResp: any = await supabase.from('fact_types').select('id').eq('slug', 'country-facts').maybeSingle();
    const countryFactTypeId = ftResp?.data?.id || opts?.fact_type_id || null;
    if (countryFactTypeId) {
      // Attempt to find the category by name under the country fact_type
      let resolvedCategoryName: string | null = null;
      try {
        const catExact: any = await supabase.from('categories').select('id,name').eq('fact_type_id', countryFactTypeId).eq('name', category).maybeSingle();
        if (catExact?.data?.id) resolvedCategoryName = catExact.data.name;
      } catch (e) {
        // ignore
      }
      // try ilike if exact didn't match
      if (!resolvedCategoryName) {
        try {
          const catLike: any = await supabase.from('categories').select('id,name').eq('fact_type_id', countryFactTypeId).ilike('name', category).maybeSingle();
          if (catLike?.data?.id) resolvedCategoryName = catLike.data.name;
        } catch (e) {
          // ignore
        }
      }
      // fallback: normalized search limited to this fact_type
      if (!resolvedCategoryName) {
        try {
          const candidates: any = await supabase.from('categories').select('id,name').eq('fact_type_id', countryFactTypeId);
          const list = candidates?.data || [];
          const normalize = (s = '') =>
            String(s)
              .toLowerCase()
              .replace(/&/g, 'and')
              .replace(/[^a-z0-9\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          const target = normalize(category || '');
          let found = list.find((c: any) => normalize(c.name) === target);
          if (!found) {
            const slugify = (s: string) => normalize(s).replace(/\s+/g, '-');
            const targetSlug = slugify(category || '');
            found = list.find((c: any) => slugify(c.name) === targetSlug || normalize(c.name).includes(target) || target.includes(normalize(c.name)));
          }
          if (found) resolvedCategoryName = found.name;
        } catch (e) {
          // ignore
        }
      }

      if (resolvedCategoryName) {
        // Use fetchCountryFacts (which itself enforces strict resolution) to
        // fetch the facts tied to the resolved category name for the requested country.
        const res = await fetchCountryFacts(country, { ...opts, category: resolvedCategoryName });
        memoryCache.set(key, { ts: Date.now(), value: res });
        setLocalCache('facts', key, res, opts?.ttl || 86400);
        return res;
      }
    }
  } catch (e) {
    // If resolver fails, fall back to the old generator-oriented strategy
  }

  // fallback: label approach (keeps existing generator behavior)
  const result = await fetchFactsByCategory('world-facts', label, opts);
  memoryCache.set(key, { ts: Date.now(), value: result });
  setLocalCache('facts', key, result, opts?.ttl || 86400);
  return result;
}

/**
 * Fetch facts specifically for a country from the DB.
 * Filters by status = 'approved' and country (case-insensitive).
 * Optionally filters by fact_type name (defaults to 'country fact'), category name and subcategory name.
 */
export async function fetchCountryFacts(
  country: string,
  opts?: { ttl?: number; force?: boolean; fact_type_name?: string; category?: string; subcategory?: string }
) {
  const factTypeName = (opts?.fact_type_name || 'country fact').toLowerCase();
  const key = `countryfacts:${country.toLowerCase().trim()}:${(opts?.category || '').toLowerCase().trim()}:${(opts?.subcategory || '').toLowerCase().trim()}`;
  if (!opts?.force) {
    const mem = memoryCache.get(key);
    if (mem) return mem.value;
    const local = getLocalCache('facts', key);
    if (local) {
      memoryCache.set(key, { ts: Date.now(), value: local });
      return local;
    }
  }

  if (!SUPABASE_AVAILABLE) {
    // fallback to empty in local dev to avoid AI generation for country-specific facts
    const empty: any[] = [];
    memoryCache.set(key, { ts: Date.now(), value: empty });
    setLocalCache('facts', key, empty, opts?.ttl || 300);
    return empty;
  }

  try {
    // Resolve the authoritative fact_type_id for country-scoped categories
    // We always prefer the 'country-facts' slug when trying to resolve
    // categories/subcategories for country-specific queries so we can
    // restrict lookups to the correct fact_type.
    const ftResp: any = await supabase.from('fact_types').select('id,slug,name').eq('slug', 'country-facts').maybeSingle();
    const countryFactTypeId = ftResp?.data?.id || null;
    if (!countryFactTypeId) {
      // If we can't resolve a country fact_type row, return empty (do not
      // attempt name-only matches across unrelated fact types).
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        try { console.debug('[fetchCountryFacts] cannot find fact_type for slug country-facts'); } catch (e) {}
      }
      const empty: any[] = [];
      memoryCache.set(key, { ts: Date.now(), value: empty });
      setLocalCache('facts', key, empty, opts?.ttl || 300);
      return empty;
    }
  // fetch candidate facts by country and status (server-side filtering is cheaper than fetching all)
  // Be permissive on country matching: allow partial matches and case-insensitive compare
  const countryPattern = String(country || '').trim();
  let q = supabase.from('facts').select('*').eq('status', 'approved').ilike('country', `%${countryPattern}%`);
    let requireSubcategoryOnly = false;
    if (opts?.category) {
      // Try to resolve category id robustly (exact, wildcard, and normalized fallback)
      let categoryId: string | null = null;
      let subName: string | null = null;
      try {
        const parts = String(opts.category || '').split(' — ').map((s) => s.trim());
        const categoryName = parts[0] || '';
        subName = parts.length > 1 ? parts.slice(1).join(' — ') : null;

        if (categoryName) {
          try {
            // Require that category match is scoped to the country fact_type
            const catResp: any = await supabase
              .from('categories')
              .select('id,name')
              .eq('fact_type_id', countryFactTypeId)
              .eq('name', categoryName)
              .maybeSingle();
            categoryId = catResp?.data?.id || null;
          } catch (e) {
            categoryId = null;
          }
        }

        if (!categoryId && categoryName) {
          try {
            // ilike but scoped to the country fact_type
            const catResp2: any = await supabase
              .from('categories')
              .select('id,name')
              .eq('fact_type_id', countryFactTypeId)
              .ilike('name', categoryName)
              .maybeSingle();
            categoryId = catResp2?.data?.id || null;
          } catch (e) {
            categoryId = null;
          }
        }

        if (!categoryId && categoryName) {
          try {
            // Only look up candidates inside the country fact_type
            const candidates: any = await supabase.from('categories').select('id,name').eq('fact_type_id', countryFactTypeId);
            const list = candidates?.data || [];
            const normalize = (s = '') =>
              String(s)
                .toLowerCase()
                .replace(/&/g, 'and')
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const target = normalize(categoryName);
            let found = list.find((c: any) => normalize(c.name) === target);
            if (!found) {
              const slugify = (s: string) => normalize(s).replace(/\s+/g, '-');
              const targetSlug = slugify(categoryName);
              found = list.find((c: any) => slugify(c.name) === targetSlug || normalize(c.name).includes(target) || target.includes(normalize(c.name)));
            }
            if (found) categoryId = found.id;
          } catch (e) {
            categoryId = null;
          }
        }

        // If we couldn't resolve the requested category (within country fact_type), return no results
        if (!categoryId) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { console.debug('[fetchCountryFacts] category resolution failed, returning empty', { requestedCategory: opts.category }); } catch (e) {}
          }
          const empty: any[] = [];
          memoryCache.set(key, { ts: Date.now(), value: empty });
          setLocalCache('facts', key, empty, opts?.ttl || 300);
          return empty;
        }

        // scope to resolved category_id
        q = q.eq('category_id', categoryId);

        // If caller passed a combined label like 'Main — Sub', treat that as
        // an explicit subcategory request even when opts.subcategory is not set.
        const requestedSubName = opts?.subcategory || subName || null;
        if (requestedSubName) {
          // resolve subcategory id strictly and filter to it
          try {
            // When resolving subcategories make sure we query only subcategories
            // that belong to the resolved category id (which is already scoped
            // to the country fact_type).
            const subResp: any = await supabase.from('subcategories').select('id,name').eq('category_id', categoryId).ilike('name', String(requestedSubName)).maybeSingle();
            const subId = subResp?.data?.id || null;
            if (subId) {
              q = q.eq('subcategory_id', subId);
            } else {
              // requested subcategory not found -> return empty to avoid broad results
              if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
                try { console.debug('[fetchCountryFacts] requested subcategory not found, returning empty', { requestedSubName, categoryId }); } catch (e) {}
              }
              const empty: any[] = [];
              memoryCache.set(key, { ts: Date.now(), value: empty });
              setLocalCache('facts', key, empty, opts?.ttl || 300);
              return empty;
            }
          } catch (e) {
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
              try { console.debug('[fetchCountryFacts] subcategory resolution error, returning empty', { err: e }); } catch (er) {}
            }
            const empty: any[] = [];
            memoryCache.set(key, { ts: Date.now(), value: empty });
            setLocalCache('facts', key, empty, opts?.ttl || 300);
            return empty;
          }
        } else {
          // No specific subcategory requested: include category-level facts and
          // all subcategory facts for this category (if any)
          try {
            const subListResp: any = await supabase.from('subcategories').select('id').eq('category_id', categoryId);
            const subs = (subListResp?.data || []).map((s: any) => s.id).filter(Boolean);
            if (subs.length > 0) {
              const ids = subs.join(',');
              q = q.or(`subcategory_id.is.null,subcategory_id.in.(${ids})`);
            } else {
              // No subcategories: only category-level facts
              q = q.is('subcategory_id', null);
            }
          } catch (e) {
            // fallback: only category-level facts
            try { q = (q as any).is('subcategory_id', null); } catch (err) {}
          }
        }
      } catch (e) {
        // on any resolution error, return empty to avoid broad country-wide results
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchCountryFacts] category resolution exception, returning empty', { err: e }); } catch (err) {}
        }
        const empty: any[] = [];
        memoryCache.set(key, { ts: Date.now(), value: empty });
        setLocalCache('facts', key, empty, opts?.ttl || 300);
        return empty;
      }
    }

    if (opts?.subcategory) {
      // Resolve subcategory id for strict subcategory filtering. If we fail to
      // resolve the provided subcategory label, require that results be tied to
      // some subcategory (don't return category-level facts), matching the
      // behavior in fetchFactsByCategory.
      try {
        const subResp: any = await supabase
          .from('subcategories')
          .select('id,name')
          .ilike('name', String(opts.subcategory))
          .maybeSingle();
        const subId = subResp?.data?.id || null;
        if (subId) {
          q = q.eq('subcategory_id', subId);
        } else {
          requireSubcategoryOnly = true;
        }
      } catch (e) {
        requireSubcategoryOnly = true;
      }
      if (requireSubcategoryOnly) {
        try { q = (q as any).not('subcategory_id', 'is', null); } catch (err) {}
      }
    }

    const { data: rows, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    if (typeof window !== 'undefined') {
      try {
        console.log('[fetchCountryFacts] raw rows:', { country, category: opts?.category, subcategory: opts?.subcategory, rowsCount: (rows || []).length, sample: (rows || []).slice(0, 3) });
      } catch (e) {}
    }

    const filtered = (rows || []).filter((r: any) => {
      // prefer rows that explicitly have fact_type text matching 'country fact' (case-insensitive)
      if (r.fact_type && String(r.fact_type).toLowerCase() === factTypeName) return true;
      // be permissive: accept entries whose fact_type text contains 'country'
      if (r.fact_type && String(r.fact_type).toLowerCase().includes('country')) return true;
      // or if fact_type_id is present, try resolving the id to a name match later
      return false;
    });

  // If none matched via fact_type string, attempt to resolve fact_type_id for a name match and filter
    let finalRows = filtered;
    if (finalRows.length === 0) {
      try {
        const ftRes: any = await supabase.from('fact_types').select('id,name,slug');
        const list = ftRes?.data || [];
        // try exact match, slug match, or contains 'country'
        const found = list.find((f: any) => {
          const n = ((f.name || '') + '').toLowerCase();
          const s = ((f.slug || '') + '').toLowerCase();
          if (n === factTypeName) return true;
          if (s === factTypeName.replace(/\s+/g, '-')) return true;
          if (n.includes('country') || s.includes('country')) return true;
          return false;
        });
        if (found) {
          finalRows = (rows || []).filter((r: any) => r.fact_type_id === found.id || (r.fact_type && String(r.fact_type).toLowerCase().includes('country')));
        }
      } catch (e) {
        // ignore
      }
    }

    // If filtering by fact_type removed all rows but the DB returned rows, fall back to returning the raw rows
    if ((finalRows || []).length === 0 && (rows || []).length > 0) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        try { console.debug('[fetchCountryFacts] fact_type filtering removed all rows, falling back to raw rows', { rowsCount: (rows || []).length }); } catch (e) {}
      }
      finalRows = rows || [];
    }

    const normalized = (finalRows || []).map((r: any) => ({
      id: r.id,
      title: r.title || null,
      fact: r.fact_text || r.fact || r.description || r.title || null,
      fact_text: r.fact_text || null,
      metadata: r.metadata || null,
      category_id: r.category_id || null,
      subcategory_id: r.subcategory_id || null,
      fact_type_id: r.fact_type_id || null,
      country: r.country || null,
    }));

    // Dev-only: emit resolved identifiers so the UI debug panel can display them
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        const resolvedCategoryId = (normalized && normalized[0] && normalized[0].category_id) || null;
        const resolvedSubcategoryId = (normalized && normalized[0] && normalized[0].subcategory_id) || null;
        const payload = {
          source: 'fetchCountryFacts',
          country,
          requestedCategory: opts?.category || null,
          requestedSubcategory: opts?.subcategory || null,
          resolvedFactTypeId: countryFactTypeId || null,
          resolvedCategoryId,
          resolvedSubcategoryId,
          rowsCount: (normalized || []).length,
          ts: Date.now(),
        };
        (window as any).__wf_last_resolve = payload;
        window.dispatchEvent(new CustomEvent('wf:resolve', { detail: payload }));
      } catch (e) {}
    }
    memoryCache.set(key, { ts: Date.now(), value: normalized });
    setLocalCache('facts', key, normalized, opts?.ttl || 86400);
    // Additional debug: compare each row's category/subcategory ids to requested values
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        const requestedCategory = opts?.category || null;
        const requestedSub = opts?.subcategory || null;
        console.log('[fetchCountryFacts] comparing row ids to requested', {
          requestedCategory,
          requestedSub,
          rowsCompared: (normalized || []).slice(0, 10).map((r: any) => ({ id: r.id, category_id: r.category_id, subcategory_id: r.subcategory_id })),
        });
      } catch (e) {}
    }

    return normalized;
  } catch (e) {
    console.warn('fetchCountryFacts failed', e);
    const empty: any[] = [];
    memoryCache.set(key, { ts: Date.now(), value: empty });
    setLocalCache('facts', key, empty, opts?.ttl || 300);
    return empty;
  }
}

export async function generateQuizForTopic(
  topic?: string,
  questionCount = 10,
  opts?: { ttl?: number; sourceType?: string; fact_type_slug?: string }
) {
  const key = `quiz:${(topic || 'world').toLowerCase()}:${questionCount}:${opts?.sourceType || opts?.fact_type_slug || ''}`;
  const mem = memoryCache.get(key);
  if (mem) return mem.value;
  const local = getLocalCache('quiz', key);
  if (local) {
    memoryCache.set(key, { ts: Date.now(), value: local });
    return local;
  }
  // When Supabase is available, only return quizzes stored in the DB that are
  // approved/published and NOT random. Do NOT call AI generation from the public frontend.
  if (SUPABASE_AVAILABLE) {
    try {
      // prefer statuses that indicate public visibility
      const allowedStatuses = ['approved', 'published'];
      // Build query - EXCLUDE random quizzes (is_random=false OR is_random IS NULL)
      let q = supabase.from('quizzes').select('id, questions, country, status, is_random, fact_type_id');
      // filter by topic/country if provided. For country-scoped quizzes use a
      // case-insensitive partial match (ilike) so slugs or partial names match DB values.
      if (topic) {
        if (opts?.sourceType === 'country') {
          // Normalize slug-like topics (e.g. 'united-states') to a space-separated
          // form so they match DB values like 'United States'. Also decode URI components.
          try {
            const normalized = decodeURIComponent(String(topic || '')).replace(/-/g, ' ').trim();
            q = q.ilike('country', `%${normalized}%`);
          } catch (e) {
            q = q.ilike('country', `%${topic}%`);
          }
        } else {
          q = q.eq('country', topic);
        }
      }
      // If caller requested a specific sourceType/fact_type_slug, resolve and filter by fact_type_id
      let factTypeId: string | null = null;
      let slug = opts?.fact_type_slug;
      if (!slug && opts?.sourceType) {
        if (opts.sourceType === 'country') slug = 'country-facts';
        else if (opts.sourceType === 'fun') slug = 'fun-facts';
        else if (opts.sourceType === 'world') slug = 'world-facts';
      }
      if (slug) {
        try {
          const ftResp: any = await supabase.from('fact_types').select('id').eq('slug', slug).maybeSingle();
          factTypeId = ftResp?.data?.id || null;
          if (factTypeId) q = q.eq('fact_type_id', factTypeId);
        } catch (e) {
          // ignore and continue without fact_type filter
        }
      }
      // filter by allowed statuses using or() expression
      q = q.or(allowedStatuses.map(s => `status.eq.${s}`).join(','));
      // Exclude random quizzes - only include where is_random is false or null
      q = q.or('is_random.eq.false,is_random.is.null');
      const resp: any = await q.limit(1000);
      const rows = resp?.data || [];
      // flatten questions arrays from matching quizzes
      const allQuestions: any[] = [];
      for (const r of rows) {
        const qs = Array.isArray(r.questions) ? r.questions : (r.questions?.data || []);
        for (const item of qs) allQuestions.push(item);
        if (allQuestions.length >= questionCount) break;
      }
      const selected = allQuestions.slice(0, questionCount);
      memoryCache.set(key, { ts: Date.now(), value: selected });
      setLocalCache('quiz', key, selected, opts?.ttl || 3600);
      return selected;
    } catch (e) {
      console.warn('Failed to load quizzes from DB, returning empty', e);
      memoryCache.set(key, { ts: Date.now(), value: [] });
      setLocalCache('quiz', key, [], opts?.ttl || 60);
      return [];
    }
  }

  // Fallback for local development when Supabase isn't available: generate mock/AI quizzes
  const body = { type: 'quiz', country: topic || 'world geography', questionCount };
  const result = await callGenerateContent(body);

  // Normalize quiz items: backend may return { correctAnswer: index } or { correctAnswer: string }
  const normalized = (result || []).map((q: any) => {
    const obj: any = { ...q };
    if (typeof obj.correctAnswer === 'number' && Array.isArray(obj.options)) {
      obj.answer = obj.options[obj.correctAnswer];
    } else if (typeof obj.correctAnswer === 'string') {
      obj.answer = obj.correctAnswer;
    } else if (obj.answer) {
      // already present
    }
    return obj;
  });

  memoryCache.set(key, { ts: Date.now(), value: normalized });
  setLocalCache('quiz', key, normalized, opts?.ttl || 3600);
  return normalized;
}

/**
 * Fetch random quizzes from the database
 * Returns quizzes where is_random=true AND status='published'
 * Quizzes are selected randomly each time this is called
 */
export async function generateRandomQuiz(questionCount = 10, opts?: { ttl?: number }) {
  const key = `random-quiz:${questionCount}`;
  const mem = memoryCache.get(key);
  if (mem) return mem.value;
  const local = getLocalCache('randomquiz', key);
  if (local) {
    memoryCache.set(key, { ts: Date.now(), value: local });
    return local;
  }
  // When Supabase is available, fetch random quizzes
  if (SUPABASE_AVAILABLE) {
    try {
      // Fetch all published random quizzes from any fact type/country
      let q = supabase.from('quizzes').select('id, questions, status, is_random');
      q = q.eq('status', 'published');
      q = q.eq('is_random', true);
      const resp: any = await q.limit(1000);
      const rows = resp?.data || [];
      
      // Flatten questions arrays from matching quizzes
      const allQuestions: any[] = [];
      for (const r of rows) {
        const qs = Array.isArray(r.questions) ? r.questions : (r.questions?.data || []);
        for (const item of qs) allQuestions.push(item);
      }

      // If we don't have enough random questions, fetch published non-random quizzes
      let pool = allQuestions.slice();
      if (pool.length < questionCount) {
        try {
          let q2 = supabase.from('quizzes').select('id, questions, status, is_random').eq('status', 'published');
          // include only non-random quizzes
          q2 = q2.or('is_random.eq.false,is_random.is.null');
          const resp2: any = await q2.limit(1000);
          const rows2 = resp2?.data || [];
          for (const r of rows2) {
            const qs = Array.isArray(r.questions) ? r.questions : (r.questions?.data || []);
            for (const item of qs) pool.push(item);
          }
        } catch (e) {
          // ignore secondary fetch errors and proceed with what we have
          console.warn('Failed to fetch fallback non-random quizzes', e);
        }
      }

      // Deduplicate by question text (case-insensitive) and shuffle
      const seen = new Set<string>();
      const unique: any[] = [];
      for (const it of pool) {
        const text = String(it?.question || it?.q || '').trim().toLowerCase();
        if (!text) continue;
        if (seen.has(text)) continue;
        seen.add(text);
        unique.push(it);
      }

      // Shuffle unique array
      for (let i = unique.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = unique[i];
        unique[i] = unique[j];
        unique[j] = tmp;
      }

      // Select up to requested count. If we don't have enough unique items,
      // fill the remainder by sampling from the full pool (allowing repeats)
      const selected: any[] = [];
      for (let i = 0; i < Math.min(unique.length, questionCount); i++) selected.push(unique[i]);
      const remaining = questionCount - selected.length;
      if (remaining > 0 && pool.length > 0) {
        for (let i = 0; i < remaining; i++) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          // shallow copy to avoid accidental shared refs
          selected.push(JSON.parse(JSON.stringify(pick)));
        }
      }

      memoryCache.set(key, { ts: Date.now(), value: selected });
      setLocalCache('randomquiz', key, selected, opts?.ttl || 3600);
      return selected;
    } catch (e) {
      console.warn('Failed to load random quizzes from DB, returning empty', e);
      memoryCache.set(key, { ts: Date.now(), value: [] });
      setLocalCache('randomquiz', key, [], opts?.ttl || 60);
      return [];
    }
  }

  // Fallback for local development when Supabase isn't available
  const body = { type: 'quiz', country: 'random', questionCount };
  const result = await callGenerateContent(body);

  // Normalize quiz items
  const normalized = (result || []).map((q: any) => {
    const obj: any = { ...q };
    if (typeof obj.correctAnswer === 'number' && Array.isArray(obj.options)) {
      obj.answer = obj.options[obj.correctAnswer];
    } else if (typeof obj.correctAnswer === 'string') {
      obj.answer = obj.correctAnswer;
    } else if (obj.answer) {
      // already present
    }
    return obj;
  });

  memoryCache.set(key, { ts: Date.now(), value: normalized });
  setLocalCache('randomquiz', key, normalized, opts?.ttl || 3600);
  return normalized;
}