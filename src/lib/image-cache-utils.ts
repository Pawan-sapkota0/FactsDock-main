/**
 * Image Cache Management Utilities
 * Frontend helpers for interacting with the image cache system
 */

import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

export interface ImageCacheStatus {
  country: string;
  refreshStatus: 'pending' | 'success' | 'failed';
  lastRefreshAttempt: string | null;
  consecutiveFailures: number;
  fetchedAt: string;
  expiresAt: string;
  imageCount: number;
}

export interface RefreshStats {
  totalCountries: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  averageImageCount: number;
}

/**
 * Get cache status for a specific country
 */
export async function getCacheStatus(country: string): Promise<ImageCacheStatus | null> {
  try {
    const { data, error } = await supabase
      .from('image_cache')
      .select('*')
      .eq('country', country)
      .maybeSingle();

    if (error || !data) return null;

    return {
      country: data.country,
      refreshStatus: data.refresh_status || 'pending',
      lastRefreshAttempt: data.last_refresh_attempt,
      consecutiveFailures: data.consecutive_failures || 0,
      fetchedAt: data.fetched_at,
      expiresAt: data.expires_at,
      imageCount: Array.isArray(data.images) ? data.images.length : 0,
    };
  } catch (error) {
    logger.error('Error getting cache status:', error);
    return null;
  }
}

/**
 * Check if a country's cache is expired (older than 24 hours)
 */
export async function isCacheExpired(country: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('image_cache')
      .select('fetched_at')
      .eq('country', country)
      .maybeSingle();

    if (error || !data) return true; // Consider missing entries as expired

    const fetchedTime = new Date(data.fetched_at).getTime();
    const now = Date.now();
    const ageHours = (now - fetchedTime) / (1000 * 60 * 60);

    return ageHours > 24;
  } catch (error) {
    logger.error('Error checking cache expiration:', error);
    return true;
  }
}

/**
 * Get overall refresh statistics
 */
export async function getRefreshStats(): Promise<RefreshStats> {
  try {
    const { data, error } = await supabase
      .from('image_cache')
      .select('refresh_status, images');

    if (error || !data) {
      return {
        totalCountries: 0,
        successCount: 0,
        failureCount: 0,
        pendingCount: 0,
        averageImageCount: 0,
      };
    }

    const stats = {
      totalCountries: data.length,
      successCount: data.filter((d: Record<string, unknown>) => d.refresh_status === 'success').length,
      failureCount: data.filter((d: Record<string, unknown>) => d.refresh_status === 'failed').length,
      pendingCount: data.filter((d: Record<string, unknown>) => d.refresh_status === 'pending').length,
      averageImageCount: data.reduce((sum: number, d: Record<string, unknown>) => sum + (Array.isArray(d.images) ? (d.images as Array<unknown>).length : 0), 0) / data.length,
    };

    return stats;
  } catch (error) {
    logger.error('Error getting refresh stats:', error);
    return {
      totalCountries: 0,
      successCount: 0,
      failureCount: 0,
      pendingCount: 0,
      averageImageCount: 0,
    };
  }
}

/**
 * Get countries with failed refreshes (for monitoring)
 */
export async function getFailedRefreshes(): Promise<ImageCacheStatus[]> {
  try {
    const { data, error } = await supabase
      .from('image_cache')
      .select('*')
      .eq('refresh_status', 'failed')
      .order('consecutive_failures', { ascending: false });

    if (error || !data) return [];

    return data.map((d: Record<string, unknown>) => ({
      country: d.country as string,
      refreshStatus: d.refresh_status as 'pending' | 'success' | 'failed',
      lastRefreshAttempt: d.last_refresh_attempt as string | null,
      consecutiveFailures: (d.consecutive_failures as number) || 0,
      fetchedAt: d.fetched_at as string,
      expiresAt: d.expires_at as string,
      imageCount: Array.isArray(d.images) ? (d.images as Array<unknown>).length : 0,
    }));
  } catch (error) {
    logger.error('Error getting failed refreshes:', error);
    return [];
  }
}

/**
 * Get countries with expiring cache (older than 24 hours)
 */
export async function getExpiringCaches(): Promise<ImageCacheStatus[]> {
  try {
    const expiryThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('image_cache')
      .select('*')
      .lt('fetched_at', expiryThreshold)
      .order('fetched_at', { ascending: true });

    if (error || !data) return [];

    return data.map((d: Record<string, unknown>) => ({
      country: d.country as string,
      refreshStatus: d.refresh_status as 'pending' | 'success' | 'failed',
      lastRefreshAttempt: d.last_refresh_attempt as string | null,
      consecutiveFailures: (d.consecutive_failures as number) || 0,
      fetchedAt: d.fetched_at as string,
      expiresAt: d.expires_at as string,
      imageCount: Array.isArray(d.images) ? (d.images as Array<unknown>).length : 0,
    }));
  } catch (error) {
    logger.error('Error getting expiring caches:', error);
    return [];
  }
}

/**
 * Manually trigger a refresh for a country
 * (Calls the Edge Function for a specific country)
 */
export async function manuallyRefreshCountry(country: string): Promise<boolean> {
  try {
    logger.info(`Manually triggering refresh for ${country}`);

    const response = await supabase.functions.invoke('refresh-image-cache', {
      body: { country },
    });

    if (response.error) {
      logger.error(`Manual refresh failed for ${country}:`, response.error);
      return false;
    }

    logger.info(`Manual refresh successful for ${country}`);
    return true;
  } catch (error) {
    logger.error(`Error triggering manual refresh for ${country}:`, error);
    return false;
  }
}

/**
 * Manually trigger a full refresh of all caches
 * (Calls the Edge Function without parameters)
 */
export async function triggerFullRefresh(): Promise<Record<string, unknown>> {
  try {
    logger.info('Triggering full image cache refresh');

    // Test if the function is accessible
    const testResponse = await supabase.functions.invoke('refresh-image-cache', {
      method: 'GET',
    });

    logger.debug('Function endpoint test:', { status: testResponse.status });

    // Now do the actual refresh
    const response = await supabase.functions.invoke('refresh-image-cache', {
      body: {},
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    logger.info('Function response:', { error: response.error, status: response.status });

    if (response.error) {
      const errorMsg = response.error instanceof Error ? response.error.message : String(response.error);
      logger.error('Full refresh failed:', errorMsg);
      return { success: false, error: errorMsg };
    }

    logger.info('Full refresh completed');
    return { success: true, ...(response.data || {}) };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Error triggering full refresh:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Clear cache for a country (useful for testing or manual reset)
 */
export async function clearCountryCache(country: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('image_cache')
      .delete()
      .eq('country', country);

    if (error) {
      logger.error(`Error clearing cache for ${country}:`, error);
      return false;
    }

    logger.info(`Cache cleared for ${country}`);
    return true;
  } catch (error) {
    logger.error(`Error clearing cache for ${country}:`, error);
    return false;
  }
}

/**
 * Get cache health summary for dashboard
 */
export async function getCacheHealthSummary() {
  try {
    const stats = await getRefreshStats();
    const failed = await getFailedRefreshes();
    const expiring = await getExpiringCaches();

    const healthScore = stats.totalCountries > 0
      ? ((stats.successCount / stats.totalCountries) * 100).toFixed(1)
      : 'N/A';

    return {
      healthScore,
      stats,
      alertCount: (failed.length > 0 ? 1 : 0) + (expiring.length > 0 ? 1 : 0),
      failedCount: failed.length,
      expiringCount: expiring.length,
      lastCheck: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error getting cache health summary:', error);
    return {
      healthScore: 'Error',
      stats: null,
      alertCount: 0,
      failedCount: 0,
      expiringCount: 0,
      lastCheck: null,
    };
  }
}
