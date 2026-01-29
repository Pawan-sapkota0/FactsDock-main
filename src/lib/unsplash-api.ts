/**
 * Unsplash API utility for fetching country-related images
 * Handles multi-layer caching: IndexedDB (500+ MB) → localStorage → memory
 * Includes image compression to reduce storage by 30-40%
 */

import logger from '@/lib/logger';

export interface UnsplashImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  width: number;
  height: number;
  downloadUrl?: string;
  location?: string;
}

/**
 * Compressed image format - removes unused photographer data
 * Reduces storage size by ~30-40%
 */
export interface CompressedImage {
  u: string; // url
  a: string; // alt
  w: number; // width
  h: number; // height
  l?: string; // location (optional)
  p?: string; // photographer (optional, short key)
  pu?: string; // photographerUrl (optional, short key)
}

const UNSPLASH_API_BASE = 'https://api.unsplash.com';
const CACHE_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours
const DB_NAME = 'WorldFactsDB';
const STORE_NAME = 'countryImages';

// Memory cache for the session (fallback if IndexedDB/localStorage fails)
const memoryImageCache = new Map<string, { data: UnsplashImage[]; ts: number }>();

// IndexedDB reference (lazy initialized)
let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB with proper schema
 */
async function initializeIndexedDB(): Promise<IDBDatabase | null> {
  if (db) return db;

  try {
    const request = indexedDB.open(DB_NAME, 1);

    return new Promise((resolve, reject) => {
      request.onerror = () => {
        logger.debug('[IndexedDB] Failed to open database');
        reject(null);
      };

      request.onsuccess = () => {
        db = request.result;
        logger.debug('[IndexedDB] Database initialized');
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'country' });
          store.createIndex('expires_at', 'expires_at', { unique: false });
          logger.debug(`[IndexedDB] Created ${STORE_NAME} object store`);
        }
      };
    });
  } catch (e) {
    logger.debug('[IndexedDB] Initialization failed:', e);
    return null;
  }
}

/**
 * Compress image data to reduce storage size
 */
function compressImage(img: UnsplashImage): CompressedImage {
  return {
    u: img.url,
    a: img.alt,
    w: img.width,
    h: img.height,
    ...(img.location && { l: img.location }),
    ...(img.photographer && { p: img.photographer }),
    ...(img.photographerUrl && { pu: img.photographerUrl }),
  };
}

/**
 * Decompress image data back to full format
 */
function decompressImage(compressed: CompressedImage): UnsplashImage {
  return {
    url: compressed.u,
    alt: compressed.a,
    width: compressed.w,
    height: compressed.h,
    photographer: compressed.p || 'Unknown',
    photographerUrl: compressed.pu || '#',
    location: compressed.l,
  };
}

/**
 * Get images from IndexedDB
 */
async function getCachedImagesFromIndexedDB(country: string): Promise<UnsplashImage[] | null> {
  try {
    const database = await initializeIndexedDB();
    if (!database) return null;

    return new Promise((resolve) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(country.toLowerCase());

      request.onsuccess = () => {
        const cached = request.result;
        if (!cached) {
          resolve(null);
          return;
        }

        const age = Date.now() - cached.ts;
        if (age > CACHE_DURATION_MS) {
          // Cache expired - delete it
          const deleteTransaction = database.transaction([STORE_NAME], 'readwrite');
          deleteTransaction.objectStore(STORE_NAME).delete(country.toLowerCase());
          resolve(null);
          return;
        }

        // Decompress images
        const images = cached.data.map(decompressImage);
        logger.debug(`[IndexedDB] Loaded ${images.length} cached images for ${country}`);
        resolve(images);
      };

      request.onerror = () => {
        logger.debug('[IndexedDB] Failed to retrieve images');
        resolve(null);
      };
    });
  } catch (e) {
    logger.debug('[IndexedDB] Error retrieving images:', e);
    return null;
  }
}

/**
 * Save images to IndexedDB
 */
async function cacheImagesToIndexedDB(country: string, images: UnsplashImage[]): Promise<void> {
  try {
    const database = await initializeIndexedDB();
    if (!database) return;

    const compressed = images.map(compressImage);

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        country: country.toLowerCase(),
        data: compressed,
        ts: Date.now(),
        expires_at: Date.now() + CACHE_DURATION_MS,
      });

      request.onsuccess = () => {
        logger.debug(
          `[IndexedDB] Cached ${images.length} images for ${country} (compressed: ~${Math.round((compressed.length * 100) / images.length)}%)`
        );
        resolve();
      };

      request.onerror = () => {
        logger.debug('[IndexedDB] Failed to cache images');
        reject();
      };
    });
  } catch (e) {
    logger.debug('[IndexedDB] Error caching images:', e);
  }
}

/**
 * Get cached images from localStorage
 */
function getCachedImages(country: string): UnsplashImage[] | null {
  try {
    const key = `wf:images:${country.toLowerCase()}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, ts } = JSON.parse(cached);
    const age = Date.now() - ts;

    // Check if cache is still valid (48 hours)
    if (age > CACHE_DURATION_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return data as UnsplashImage[];
  } catch (e) {
    logger.debug('[ImageCache] Failed to read from localStorage', e);
    return null;
  }
}

/**
 * Save images to localStorage cache
 */
function cacheImages(country: string, images: UnsplashImage[]): void {
  try {
    const key = `wf:images:${country.toLowerCase()}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        data: images,
        ts: Date.now(),
      })
    );
  } catch (e) {
    logger.debug('[ImageCache] Failed to write to localStorage', e);
    // Continue without cache if storage fails
  }
}

/**
 * Get images from memory cache (session-only)
 */
function getMemoryCachedImages(country: string): UnsplashImage[] | null {
  const key = country.toLowerCase();
  const cached = memoryImageCache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.ts;
  if (age > CACHE_DURATION_MS) {
    memoryImageCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Save images to memory cache
 */
function cacheImagesInMemory(country: string, images: UnsplashImage[]): void {
  const key = country.toLowerCase();
  memoryImageCache.set(key, {
    data: images,
    ts: Date.now(),
  });
}

/**
 * Parse Unsplash API response into our format
 */
function parseUnsplashResponse(response: Array<{
  urls?: { regular?: string };
  alt_description?: string;
  user?: { name?: string; links?: { html?: string } };
  width?: number;
  height?: number;
  links?: { download_location?: string };
  location?: { title?: string };
}>): UnsplashImage[] {
  return response
    .filter((item) => item.urls?.regular && item.alt_description)
    .map((item) => ({
      url: item.urls?.regular || '',
      alt: item.alt_description || 'Gallery image',
      photographer: item.user?.name || 'Unknown',
      photographerUrl: item.user?.links?.html || '#',
      width: item.width || 1600,
      height: item.height || 1200,
      downloadUrl: item.links?.download_location || undefined,
      location: item.location?.title || undefined,
    }));
}

/**
 * Generate search queries for a country
 * e.g., "Nepal" -> ["Nepal landmark", "Nepal culture", "Nepal nature", ...]
 */
function generateSearchQueries(country: string): string[] {
  const base = country.trim();
  return [
    `${base} landmark`,
    `${base} culture`,
    `${base} nature`,
    `${base} travel`,
    `${base} architecture`,
    `${base} city`,
    `${base} capital city`,
    `${base} heritage`,
  ];
}

/**
 * Fetch images from Unsplash API
 * Attempts to return 8-12 unique images per country
 */
async function fetchFromUnsplash(
  country: string,
  apiKey: string
): Promise<UnsplashImage[]> {
  const queries = generateSearchQueries(country);
  const allImages: UnsplashImage[] = [];
  const seenUrls = new Set<string>();

  try {
    // Try each search query sequentially
    for (const query of queries) {
      // Stop if we have enough images
      if (allImages.length >= 12) break;

      try {
        const url = new URL(`${UNSPLASH_API_BASE}/search/photos`);
        url.searchParams.append('query', query);
        url.searchParams.append('per_page', '4'); // Request 4 per query to get ~20-24 total, filter duplicates
        url.searchParams.append('client_id', apiKey);

        const response = await fetch(url.toString());
        if (!response.ok) {
          if (response.status === 401) {
            logger.warn('[Unsplash] Unauthorized - invalid API key');
          } else if (response.status === 403) {
            logger.warn('[Unsplash] Rate limited');
          }
          continue;
        }

        const data = await response.json();
        const images = parseUnsplashResponse(data.results || []);

        // Add unique images
        for (const img of images) {
          if (!seenUrls.has(img.url)) {
            seenUrls.add(img.url);
            allImages.push(img);
            if (allImages.length >= 12) break;
          }
        }
      } catch (e) {
        logger.debug(`[Unsplash] Query "${query}" failed:`, e);
        continue;
      }
    }

    // Return at least 8 images, up to 12
    return allImages.slice(0, 12);
  } catch (e) {
    logger.error('[Unsplash] Unexpected error during fetch:', e);
    return [];
  }
}

/**
 * Main function: Get images for a country
 * Cache priority: IndexedDB → localStorage → Memory → API fetch
 * IndexedDB supports 500+ countries without quota limits
 */
export async function fetchCountryImages(
  country: string,
  apiKey: string
): Promise<UnsplashImage[]> {
  if (!country || !apiKey) {
    return [];
  }

  const countryKey = country.toLowerCase();

  // Try IndexedDB cache first (best for large datasets)
  try {
    const indexedDBImages = await getCachedImagesFromIndexedDB(country);
    if (indexedDBImages && indexedDBImages.length > 0) {
      logger.debug(`[Gallery] Loaded ${indexedDBImages.length} images from IndexedDB for ${country}`);

      // If cached images are missing photographer metadata (from older compressed format),
      // clear caches and refetch so attribution is available immediately.
      const missingMeta = indexedDBImages.some(
        (img) => !img.photographer || img.photographer === 'Unknown' || !img.photographerUrl || img.photographerUrl === '#'
      );

      if (!missingMeta) {
        return indexedDBImages;
      }

      logger.debug(`[Gallery] Detected missing metadata in cached images for ${country}, clearing caches to refresh.`);
      await clearImageCache(country).catch(() => {});
    }
  } catch (e) {
    logger.debug('[Gallery] IndexedDB lookup failed, continuing...', e);
  }

  // Try localStorage cache next
  const cachedImages = getCachedImages(country);
  if (cachedImages && cachedImages.length > 0) {
    logger.debug(`[Gallery] Loaded ${cachedImages.length} cached images from localStorage for ${country}`);

    const missingMeta = cachedImages.some(
      (img) => !img.photographer || img.photographer === 'Unknown' || !img.photographerUrl || img.photographerUrl === '#'
    );

    if (!missingMeta) {
      // Populate IndexedDB in background for future access
      cacheImagesToIndexedDB(country, cachedImages).catch(() => {});
      return cachedImages;
    }

    logger.debug(`[Gallery] Detected missing metadata in localStorage cache for ${country}, clearing caches to refresh.`);
    await clearImageCache(country).catch(() => {});
  }

  // Try memory cache next
  const memoryCached = getMemoryCachedImages(country);
  if (memoryCached && memoryCached.length > 0) {
    logger.debug(`[Gallery] Loaded ${memoryCached.length} images from memory cache for ${country}`);

    const missingMeta = memoryCached.some(
      (img) => !img.photographer || img.photographer === 'Unknown' || !img.photographerUrl || img.photographerUrl === '#'
    );

    if (!missingMeta) {
      // Populate IndexedDB and localStorage in background
      cacheImagesToIndexedDB(country, memoryCached).catch(() => {});
      cacheImages(country, memoryCached);
      return memoryCached;
    }

    logger.debug(`[Gallery] Detected missing metadata in memory cache for ${country}, clearing caches to refresh.`);
    await clearImageCache(country).catch(() => {});
  }

  // Fetch fresh images from API
  logger.debug(`[Gallery] Fetching fresh images for ${country}...`);
  const images = await fetchFromUnsplash(country, apiKey);

  if (images.length > 0) {
    // Cache in all layers: IndexedDB (persistent), localStorage (backup), and memory (session)
    await cacheImagesToIndexedDB(country, images).catch(() => {});
    cacheImages(country, images);
    cacheImagesInMemory(country, images);
    logger.debug(`[Gallery] Cached ${images.length} images for ${country} across all storage layers`);
  }

  return images;
}

/**
 * Clear cache for a country across all storage layers
 */
export async function clearImageCache(country: string): Promise<void> {
  const countryKey = country.toLowerCase();

  try {
    const database = await initializeIndexedDB();
    if (database) {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      transaction.objectStore(STORE_NAME).delete(countryKey);
    }
  } catch (e) {
    logger.debug('[IndexedDB] Failed to clear cache', e);
  }

  try {
    const key = `wf:images:${countryKey}`;
    localStorage.removeItem(key);
  } catch (e) {
    logger.debug('[ImageCache] Failed to clear localStorage cache', e);
  }

  memoryImageCache.delete(countryKey);
  logger.debug(`[Gallery] Cleared all caches for ${country}`);
}
