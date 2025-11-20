import { supabase } from '@/integrations/supabase/client';

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
      try { console.debug('[fetchFactsByCategory] called', { factType, category, subcategory, opts }); } catch (e) {}
    }
    // Step 1: resolve IDs
    let factTypeId: string | null = null;
    // allow callers to supply fact_type_id in opts
    if (opts?.fact_type_id) {
      factTypeId = opts.fact_type_id;
    } else {
      const { data: typeRow, error: typeErr } = await supabase
        .from('fact_types')
        .select('id')
        .ilike('slug', String(factType || ''))
        .maybeSingle();
      if (typeErr) throw typeErr;
      factTypeId = typeRow?.id || null;
    }

    if (!factTypeId) {
      console.warn('[fetchFactsByCategory] No fact type found for:', factType);
      return [];
    }

    // Resolve category id with multiple fallback strategies (ilike, normalized match, slug)
    let categoryId: string | null = null;
    const base = String(category || '').trim();
    const tryNames = [base];
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
      try { console.debug('[fetchFactsByCategory] category name candidates', nameCandidates); } catch (e) {}
    }

    for (const nameTry of nameCandidates) {
      try {
        // try exact ilike first
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] trying category exact ilike', nameTry); } catch (e) {}
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
            try { console.debug('[fetchFactsByCategory] matched category exact', { nameTry, categoryRow }); } catch (e) {}
          }
          break;
        }

        // then try wildcard ilike to match partials
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] trying category wildcard ilike', `%${nameTry}%`); } catch (e) {}
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
            try { console.debug('[fetchFactsByCategory] matched category wildcard', { nameTry, categoryRow2 }); } catch (e) {}
          }
          break;
        }
      } catch (e) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] category try failed', { nameTry, error: e }); } catch (err) {}
        }
        // continue
      }
    }

    // Fallback: fetch all categories for this fact type and try normalized matching
    if (!categoryId) {
      try {
        const { data: list } = await supabase.from('categories').select('id,name').eq('fact_type_id', factTypeId);
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] fetched categories list for fallback', { count: (list || []).length }); } catch (e) {}
        }
        const normalize = (s = '') =>
          String(s)
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        const target = normalize(category || '');
        const found = (list || []).find((c: any) => normalize(c.name) === target || normalize(c.name).includes(target) || target.includes(normalize(c.name)));
        if (found) {
          categoryId = found.id;
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { console.debug('[fetchFactsByCategory] fallback normalized match', { target, found }); } catch (e) {}
          }
        }
      } catch (e) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] fallback category list fetch failed', e); } catch (err) {}
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
            try { console.debug('[fetchFactsByCategory] permissive cross-type match for category', { category, foundAny }); } catch (e) {}
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
            try { console.debug('[fetchFactsByCategory] category not found, available categories for factTypeId', factTypeId, list || []); } catch (e) {}
          }
        } catch (e) {
          // ignore
        }
        console.warn('[fetchFactsByCategory] No category found for:', category);
        return [];
      }
    }

    let subcategoryId: string | null = null;
    let requireSubcategoryOnly = false;
    if (subcategory) {
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        try { console.debug('[fetchFactsByCategory] resolving subcategory', { subcategory }); } catch (e) {}
      }
      try {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] trying subcategory exact ilike', String(subcategory).trim()); } catch (e) {}
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
          try { console.debug('[fetchFactsByCategory] matched subcategory exact', { subRow }); } catch (e) {}
        }
      } catch (e) {
        // fallback: fetch list and normalize
        try {
          const { data: subs } = await supabase.from('subcategories').select('id,name').eq('category_id', categoryId);
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { console.debug('[fetchFactsByCategory] fetched subcategories for fallback', { count: (subs || []).length }); } catch (err) {}
          }
          const normalize = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
          const target = normalize(String(subcategory));
          const found = (subs || []).find((s: any) => normalize(s.name) === target || normalize(s.name).includes(target) || target.includes(normalize(s.name)));
          if (found) {
            subcategoryId = found.id;
            if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
              try { console.debug('[fetchFactsByCategory] fallback subcategory normalized match', { target, found }); } catch (err) {}
            }
          }
        } catch (e2) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
            try { console.debug('[fetchFactsByCategory] fallback subcategory fetch failed', e2); } catch (err) {}
          }
        }
      }
      // If caller asked for a subcategory but we failed to resolve an id, require
      // that results be tied to some subcategory (don't return category-level facts).
      if (subcategory && !subcategoryId) {
        requireSubcategoryOnly = true;
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
          try { console.debug('[fetchFactsByCategory] requested subcategory not resolved, will require subcategory_id NOT NULL', { subcategory }); } catch (e) {}
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
        query = (query as any).not('subcategory_id', 'is', null);
      } catch (e) {
        // leave query as-is if .not unsupported
      }
    } else {
      // No specific subcategory requested: include both category-level facts
      // (subcategory_id IS NULL) AND all facts that belong to any subcategory
      // of this category. This mirrors the behavior in the other API path.
      try {
        const subListResp: any = await supabase.from('subcategories').select('id').eq('category_id', categoryId);
        const subs = (subListResp?.data || []).map((s: any) => s.id).filter(Boolean);
        if (subs.length > 0) {
          const ids = subs.join(',');
          query = query.or(`subcategory_id.is.null,subcategory_id.in.(${ids})`);
        } else {
          // no subcategories: only category-level facts
          try { query = (query as any).is('subcategory_id', null); } catch (e) {}
        }
      } catch (e) {
        // fallback: leave the base query as-is (will return category-level rows)
      }
    }

    const { data: facts, error } = await query;

    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { console.log('Fetched facts:', facts); } catch (e) {}
    }

    if (error) throw error;
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { console.debug('[fetchFactsByCategory] raw facts rows', { count: (facts || []).length, sample: (facts || [])[0] }); } catch (e) {}
    }
    const normalized = (facts || []).map((r: any) => ({
      id: r.id,
      title: r.title || null,
      fact: r.fact_text || r.fact || r.description || r.title || null,
      fact_text: r.fact_text || null,
      metadata: r.metadata || null,
      category_id: r.category_id || null,
      subcategory_id: r.subcategory_id || null,
      fact_type_id: r.fact_type_id || null,
    }));
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      try { console.debug('[fetchFactsByCategory] returning', normalized.length, 'facts', { factType, category, subcategory, factTypeId, categoryId, subcategoryId }); } catch (e) {}
    }
    return normalized;
  } catch (e) {
    console.error('[fetchFactsByCategory] error', e);
    return [];
  }
}

// 🧪 expose for debugging in console
if (typeof window !== 'undefined') {
  // @ts-ignore
  (window as any).fetchFactsByCategory = fetchFactsByCategory;
}
