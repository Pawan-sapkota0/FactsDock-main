import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

// ✅ Fetch facts by type, category, and optional subcategory
export async function fetchFactsByCategory(
  factType: string,
  category: string,
  subcategoryOrOpts?: string | { ttl?: number; force?: boolean; fact_type_id?: string }
) {
  // support old callers that pass an opts object as the 3rd argument
  let subcategory: string | undefined;
  let opts: { ttl?: number; force?: boolean; fact_type_id?: string } | undefined;
  if (typeof subcategoryOrOpts === 'string') subcategory = subcategoryOrOpts;
  else opts = subcategoryOrOpts;
  
    // If the category param contains a separator like ' — ' or '-' treat it as "Category — Subcategory"
    // so callers that pass the combined label continue to work.
    if (!subcategory && typeof category === 'string' && /[—–-]/.test(category)) {
      const parts = category.split(/\s*[—–-]\s*/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // first part is the main category, rest joined form the subcategory
        category = parts[0];
        subcategory = parts.slice(1).join(' — ');
      }
    }
  try {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { logger.debug('[fetchFactsByCategory] called', { factType, category, subcategory, opts }); } catch (e) { /* ignored - debug only */ }
    }
    // Step 1: resolve IDs
    let factTypeId: string | null = null;
    // allow callers to supply fact_type_id in opts
    if (opts?.fact_type_id) {
      factTypeId = opts.fact_type_id;
    } else {
      // try direct slug match first
      // Allow `any` here — this is a Supabase row shape boundary.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let typeRow: any = null;
      try {
        // Supabase response, allow `any` at this SDK boundary.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res: any = await supabase
          .from('fact_types')
          .select('id,slug,name')
          .ilike('slug', String(factType || ''))
          .maybeSingle();
        if (res?.error) throw res.error;
        typeRow = res?.data || null;
      } catch (e) {
        // ignore and continue to fallback attempts
      }

      // If not found, try some reasonable fallbacks to tolerate caller differences
      if (!typeRow) {
        try {
          // 1) strip optional '-facts' suffix
          const raw = String(factType || '');
          const stripped = raw.replace(/[-_]?facts$/i, '');
          if (stripped && stripped !== raw) {
            // Supabase response, allow `any` at this SDK boundary.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res2: any = await supabase
              .from('fact_types')
              .select('id,slug,name')
              .ilike('slug', `${stripped}%`)
              .maybeSingle();
            if (!res2?.error && res2?.data) typeRow = res2.data;
          }
        } catch (e) {
          // ignore
        }
      }

      // 2) try to match on the name column (e.g. 'World Facts')
      if (!typeRow) {
        try {
          // Supabase response, allow `any` at this SDK boundary.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const res3: any = await supabase
            .from('fact_types')
            .select('id,slug,name')
            .ilike('name', `%${String(factType || '')}%`)
            .maybeSingle();
          if (!res3?.error && res3?.data) typeRow = res3.data;
        } catch (e) {
          // ignore
        }
      }

      // assign id if we found a row
      factTypeId = typeRow?.id || null;
    }

    if (!factTypeId) {
      // helpful debug output for local dev — list available fact types when missing
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        try {
          const { data: all } = await supabase.from('fact_types').select('id,slug,name');
          logger.debug('[fetchFactsByCategory] available fact_types', all || []);
        } catch (e) { /* ignored - debug only */ }
      }
      logger.warn('[fetchFactsByCategory] No fact type found for:', factType);
      return [];
    }

    // Resolve category id with multiple fallback strategies (ilike, normalized match, slug)
    let categoryId: string | null = null;
    const base = String(category || '').trim();
    const tryNames = [base];
    // If incoming base contains dashes (slug-style), also try variants that
    // substitute the dash with a space, ampersand, or the word 'and' so
    // slug -> title mismatches like `animals-wildlife` -> `Animals & Wildlife`
    // are covered.
    if (/[–—-]/.test(base)) {
      tryNames.push(base.replace(/[–—-]/g, ' '));
      tryNames.push(base.replace(/[–—-]/g, ' & '));
      tryNames.push(base.replace(/[–—-]/g, ' and '));
    }
    // try swapping 'and' <-> '&'
    tryNames.push(base.replace(/\band\b/gi, '&'));
    tryNames.push(base.replace(/&/g, 'and'));
    // try joining tokens with common separators (for slugs like 'animals-nature' -> 'Animals & Nature')
    const tokens = base.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      tryNames.push(tokens.join(' & '));
      tryNames.push(tokens.join(' and '));
      tryNames.push(tokens.join(' - '));
    }

    // de-duplicate
    const nameCandidates = Array.from(new Set(tryNames.map((s) => (s || '').trim()).filter(Boolean)));
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { logger.debug('[fetchFactsByCategory] category name candidates', nameCandidates); } catch (e) { /* ignored - debug only */ }
    }

    for (const nameTry of nameCandidates) {
      try {
        // try exact ilike first
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] trying category exact ilike', nameTry); } catch (e) { /* ignored - debug only */ }
        }
        const { data: categoryRow, error: catErr } = await supabase
          .from('categories')
          .select('id,name')
          .eq('fact_type_id', factTypeId)
          .ilike('name', nameTry)
          .maybeSingle();
        if (catErr) throw catErr;
        if (categoryRow?.id) {
          categoryId = categoryRow.id;
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] matched category exact', { nameTry, categoryRow }); } catch (e) { /* ignored - debug only */ }
          }
          break;
        }

        // then try wildcard ilike to match partials
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] trying category wildcard ilike', `%${nameTry}%`); } catch (e) { /* ignored - debug only */ }
        }
        const { data: categoryRow2, error: catErr2 } = await supabase
          .from('categories')
          .select('id,name')
          .eq('fact_type_id', factTypeId)
          .ilike('name', `%${nameTry}%`)
          .maybeSingle();
        if (catErr2) throw catErr2;
        if (categoryRow2?.id) {
          categoryId = categoryRow2.id;
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] matched category wildcard', { nameTry, categoryRow2 }); } catch (e) { /* ignored - debug only */ }
          }
          break;
        }
      } catch (e) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] category try failed', { nameTry, error: e }); } catch (err) { /* ignored - debug only */ }
        }
        // continue
      }
    }

    // Fallback: fetch all categories for this fact type and try normalized matching
    if (!categoryId) {
      // If the caller provided an explicit fact_type_id, do not attempt a
      // permissive cross-type match. Silently adopting a category from a
      // different fact_type can cause surprising results (e.g. showing
      // 'fun-facts' rows in the 'world-facts' UI). When callers explicitly
      // request a fact_type_id we treat that as authoritative and return no
      // results when the category cannot be found under that type.
      if (opts?.fact_type_id) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] category not found under explicit fact_type_id, skipping cross-type fallback', { category, factTypeId, opts }); } catch (e) { /* ignored - debug only */ }
        }
        logger.warn('[fetchFactsByCategory] category not found for explicit fact_type_id', { category, factTypeId });
        return [];
      }
        try {
          const { data: list } = await supabase.from('categories').select('id,name').eq('fact_type_id', factTypeId);
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] fetched categories list for fallback', { count: (list || []).length }); } catch (e) { /* ignored - debug only */ }
        }
        const normalize = (s = '') =>
          String(s)
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const target = normalize(category || '');
        // The list items come from the DB; allow `any` at this boundary.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const found = (list || []).find((c: any) => normalize(c.name) === target || normalize(c.name).includes(target) || target.includes(normalize(c.name)));
        if (found) {
          categoryId = found.id;
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] fallback normalized match', { target, found }); } catch (e) { /* ignored - debug only */ }
          }
        }
      } catch (e) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] fallback category list fetch failed', e); } catch (err) { /* ignored - debug only */ }
        }
        // ignore
      }
    }

    if (!categoryId) {
      // Didn't find a category under the resolved fact_type. As a more permissive
      // fallback, try to find a matching category across all fact types. This
      // helps when the UI label (e.g. 'Foods & Flavors') exists in the DB but
      // under a different fact_type (admins may have organized categories
      // differently for 'fun-facts' vs 'world-facts').
      try {
        const { data: listAll } = await supabase.from('categories').select('id,name,fact_type_id');
        const normalize = (s = '') =>
          String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        const target = normalize(category || '');
        // The list items come from the DB; allow `any` at this boundary.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const foundAny = (listAll || []).find((c: any) => normalize(c.name) === target || normalize(c.name).includes(target) || target.includes(normalize(c.name)));
        if (foundAny) {
          categoryId = foundAny.id;
          // Adopt the fact_type_id that this category actually belongs to so
          // subsequent queries match rows (category may live under a different
          // fact_type than the requested one).
          if (foundAny.fact_type_id) {
            factTypeId = foundAny.fact_type_id;
          }
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] permissive cross-type match for category', { category, foundAny }); } catch (e) { /* ignored - debug only */ }
          }
        }
      } catch (e) {
        // ignore
      }

      if (!categoryId) {
        // log available categories for debugging
        try {
          const { data: list } = await supabase.from('categories').select('id,name').eq('fact_type_id', factTypeId);
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] category not found, available categories for factTypeId', factTypeId, list || []); } catch (e) { /* ignored - debug only */ }
          }
        } catch (e) {
          // ignore
        }
        logger.warn('[fetchFactsByCategory] No category found for:', category);
        return [];
      }
    }

    let subcategoryId: string | null = null;
    let requireSubcategoryOnly = false;
    if (subcategory) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        try { logger.debug('[fetchFactsByCategory] resolving subcategory', { subcategory }); } catch (e) { /* ignored - debug only */ }
      }
      try {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] trying subcategory exact ilike', String(subcategory).trim()); } catch (e) { /* ignored - debug only */ }
        }
        const { data: subRow, error: subErr } = await supabase
          .from('subcategories')
          .select('id,name')
          .eq('category_id', categoryId)
          .ilike('name', String(subcategory).trim())
          .maybeSingle();
        if (subErr) throw subErr;
        subcategoryId = subRow?.id ?? null;
        if (subcategoryId && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] matched subcategory exact', { subRow }); } catch (e) { /* ignored - debug only */ }
        }
      } catch (e) {
        // fallback: fetch list and normalize
        try {
          const { data: subs } = await supabase.from('subcategories').select('id,name').eq('category_id', categoryId);
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] fetched subcategories for fallback', { count: (subs || []).length }); } catch (err) { /* ignored - debug only */ }
          }
          // More robust normalization for subcategory matching: handle
          // ampersand/and, multiple dash types, curly quotes, and stray
          // punctuation so minor differences don't block matches.
          const normalize = (s = '') =>
            String(s)
              .toLowerCase()
              .replace(/[’‘“”]/g, "'") // normalize smart quotes
              .replace(/[–—-]/g, '-') // normalize dashes to simple dash
              .replace(/&/g, ' and ')
              .replace(/[^a-z0-9\s\-']/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          const slugify = (s = '') => normalize(s).replace(/\s+/g, '-');
          const target = normalize(String(subcategory));
          const targetSlug = slugify(String(subcategory));
          // subcategory rows from DB — normalize using unknown and runtime narrowers
          const found = ((subs || []) as unknown[]).find((s) => {
            const name = (s as Record<string, unknown>).name as string | undefined;
            const n = normalize(name || '');
            if (n === target) return true;
            if (n.includes(target) || target.includes(n)) return true;
            const sl = slugify(name || '');
            if (sl === targetSlug) return true;
            if (sl.includes(targetSlug) || targetSlug.includes(sl)) return true;
            // try loose wildcard-ish match
            if (n.includes(target.split(' ').slice(0, 2).join(' '))) return true;
            return false;
          });
            if (found) {
            subcategoryId = (found as Record<string, unknown>).id as string;
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
              try { logger.debug('[fetchFactsByCategory] fallback subcategory normalized match', { target, found }); } catch (err) { /* ignored - debug only */ }
            }
          }
        } catch (e2) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { logger.debug('[fetchFactsByCategory] fallback subcategory fetch failed', e2); } catch (err) { /* ignored - debug only */ }
          }
        }
      }
      // If caller asked for a subcategory but we failed to resolve an id, require
      // that results be tied to some subcategory (don't return category-level facts).
        if (subcategory && !subcategoryId) {
        requireSubcategoryOnly = true;
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { logger.debug('[fetchFactsByCategory] requested subcategory not resolved, will require subcategory_id NOT NULL', { subcategory }); } catch (e) { /* ignored - debug only */ }
        }
      }
    }

    // Step 2: fetch facts
    // Base query scoped to fact_type_id and category_id and approved status
    let query = supabase.from('facts').select('*').eq('status', 'approved').eq('fact_type_id', factTypeId).eq('category_id', categoryId).order('created_at', { ascending: false });

    if (subcategoryId) {
      // Strictly filter to the requested subcategory
      query = query.eq('subcategory_id', subcategoryId);
    } else if (requireSubcategoryOnly) {
      // Caller asked for a subcategory but we couldn't resolve it: require any subcategory (NOT NULL)
      try {
        // prefer .neq which is broadly supported by PostgREST/Supabase
        type QueryLike = { neq?: (col: string, val: unknown) => unknown };
        const qLike = query as unknown as QueryLike;
        const maybe = qLike.neq?.('subcategory_id', null);
        if (maybe) query = maybe as unknown as typeof query;
      } catch (e) {
        // leave query as-is if .neq unsupported
      }
    } else {
      // No specific subcategory requested: include both category-level facts
      // (subcategory_id IS NULL) AND all facts that belong to any subcategory
      // of this category. This mirrors the behavior in the other API path.
      try {
        const subListResp = await supabase.from('subcategories').select('id').eq('category_id', categoryId);
        const subs = ((subListResp?.data || []) as unknown[]).map((s) => (s as Record<string, unknown>).id).filter(Boolean);
        if (subs.length > 0) {
          const ids = subs.join(',');
          query = query.or(`subcategory_id.is.null,subcategory_id.in.(${ids})`);
        } else {
          // no subcategories: only category-level facts
          try {
            type QueryLike2 = { is?: (col: string, val: unknown) => unknown };
            const q2 = query as unknown as QueryLike2;
            const maybeIs = q2.is?.('subcategory_id', null);
            if (maybeIs) query = maybeIs as unknown as typeof query;
          } catch (e) { /* ignored - SDK quirk */ }
        }
      } catch (e) {
        // fallback: leave the base query as-is (will return category-level rows)
      }
    }

    const { data: facts, error } = await query;

    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { logger.debug('Fetched facts:', facts); } catch (e) { /* ignored - debug only */ }
    }

    if (error) throw error;
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { logger.debug('[fetchFactsByCategory] raw facts rows', { count: (facts || []).length, sample: (facts || [])[0] }); } catch (e) { /* ignored - debug only */ }
    }
    // Facts are DB rows; normalize rows safely using `unknown` and runtime narrowers.
    const normalized = (facts || []).map((r: unknown) => {
      const row = r as Record<string, unknown>;
      return {
        id: (row.id as string) || undefined,
        title: (row.title as string) ?? null,
        fact: (row.fact_text as string) ?? (row.fact as string) ?? (row.description as string) ?? (row.title as string) ?? null,
        fact_text: (row.fact_text as string) ?? null,
        metadata: row.metadata ?? null,
        category_id: (row.category_id as string) ?? null,
        subcategory_id: (row.subcategory_id as string) ?? null,
        fact_type_id: (row.fact_type_id as string) ?? null,
      };
    });
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try {
        logger.debug('[fetchFactsByCategory] returning', normalized.length, 'facts', { factType, category, subcategory, factTypeId, categoryId, subcategoryId });
      } catch (e) { /* ignored - fallback */ }
      try {
        const payload = { source: 'fetchFactsByCategory', factType, category, subcategory, factTypeId, categoryId, subcategoryId, ts: Date.now() };
        (window as unknown as Record<string, unknown>).__wf_last_resolve = payload;
        window.dispatchEvent(new CustomEvent('wf:resolve', { detail: payload }));
      } catch (e) { /* ignored - fallback */ }
    }
    return normalized;
  } catch (e) {
    logger.error('[fetchFactsByCategory] error', e);
    return [];
  }
}

// 🧪 expose for debugging in console (dev only)
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // expose dev helper in a typed way to avoid ts-ignore
  (window as unknown as Record<string, unknown>).fetchFactsByCategory = fetchFactsByCategory;
}

/**
 * Fetch facts by category with pagination support
 * Loads a specific batch of facts (initial load or load more)
 * 
 * @param factType - Type of facts (e.g., 'fun-facts', 'world-facts')
 * @param category - Category name
 * @param page - Page number (0-indexed), default 0
 * @param pageSize - Number of facts per page, default 8
 * @param subcategory - Optional subcategory
 * @returns Array of facts for the requested page
 */
export async function fetchFactsByPage(
  factType: string,
  category: string,
  page: number = 0,
  pageSize: number = 8,
  subcategoryOrOpts?: string | { ttl?: number; force?: boolean; fact_type_id?: string }
) {
  let subcategory: string | undefined;
  let opts: { ttl?: number; force?: boolean; fact_type_id?: string } | undefined;
  if (typeof subcategoryOrOpts === 'string') subcategory = subcategoryOrOpts;
  else opts = subcategoryOrOpts;

  try {
    // Resolve category and fact type IDs (reuse existing logic by fetching all first)
    // For pagination, we need to fetch all facts and then slice
    const allFacts = await fetchFactsByCategory(factType, category, subcategory || opts);
    
    const start = page * pageSize;
    const end = start + pageSize;
    
    return {
      facts: allFacts.slice(start, end),
      total: allFacts.length,
      page,
      pageSize,
      hasMore: end < allFacts.length,
    };
  } catch (e) {
    logger.error('[fetchFactsByPage] error', e);
    return {
      facts: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }
}

/**
 * Fetch initial batch of facts (typically for page load)
 * 
 * @param factType - Type of facts
 * @param category - Category name
 * @param initialCount - Number of initial facts to load (default 8)
 * @returns Object with facts array and hasMore flag
 */
export async function fetchFactsInitialBatch(
  factType: string,
  category: string,
  initialCount: number = 8,
  subcategoryOrOpts?: string | { ttl?: number; force?: boolean; fact_type_id?: string }
) {
  return fetchFactsByPage(factType, category, 0, initialCount, subcategoryOrOpts);
}

/**
 * Fetch next batch of facts (for "Load More" functionality)
 * 
 * @param factType - Type of facts
 * @param category - Category name
 * @param currentPage - Current page number (0-indexed)
 * @param pageSize - Facts per page
 * @returns Object with next batch of facts and hasMore flag
 */
export async function fetchFactsNextBatch(
  factType: string,
  category: string,
  currentPage: number,
  pageSize: number = 8,
  subcategoryOrOpts?: string | { ttl?: number; force?: boolean; fact_type_id?: string }
) {
  return fetchFactsByPage(factType, category, currentPage + 1, pageSize, subcategoryOrOpts);
}
