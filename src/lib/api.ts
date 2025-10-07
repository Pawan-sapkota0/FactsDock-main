import { supabase } from '@/integrations/supabase/client';

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
  try {
    const res = await supabase.functions.invoke('generate-content', { body });
    if (res.error) throw res.error;
    return res.data?.data || [];
  } catch (e) {
    console.warn('Supabase function failed, falling back if possible', e);
    throw e;
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

export async function fetchFactsByCategory(type: 'fun-facts' | 'world-facts', category: string, opts?: { ttl?: number; force?: boolean }) {
  const key = `${type}:${category}`.toLowerCase();
  if (!opts?.force) {
    const mem = memoryCache.get(key);
    if (mem) return mem.value;
    const local = getLocalCache('facts', key);
    if (local) {
      memoryCache.set(key, { ts: Date.now(), value: local });
      return local;
    }
  }

  const body = { type, category };
  const result = await callGenerateContent(body);
  memoryCache.set(key, { ts: Date.now(), value: result });
  setLocalCache('facts', key, result, opts?.ttl || 86400);
  return result;
}

export async function generateQuizForTopic(topic?: string, questionCount = 10, opts?: { ttl?: number }) {
  const key = `quiz:${(topic || 'world').toLowerCase()}:${questionCount}`;
  const mem = memoryCache.get(key);
  if (mem) return mem.value;
  const local = getLocalCache('quiz', key);
  if (local) {
    memoryCache.set(key, { ts: Date.now(), value: local });
    return local;
  }

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
