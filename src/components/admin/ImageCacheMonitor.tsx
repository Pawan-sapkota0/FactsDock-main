import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCacheHealthSummary,
  getRefreshStats,
  getFailedRefreshes,
  getExpiringCaches,
  triggerFullRefresh,
} from "@/lib/image-cache-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import logger from "@/lib/logger";

const ImageCacheMonitor: React.FC = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch cache health summary
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ["cache", "health"],
    queryFn: getCacheHealthSummary,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch refresh stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["cache", "stats"],
    queryFn: getRefreshStats,
    refetchInterval: 60000,
  });

  // Fetch failed refreshes
  const { data: failedRefreshes, refetch: refetchFailed } = useQuery({
    queryKey: ["cache", "failed"],
    queryFn: getFailedRefreshes,
    refetchInterval: 120000, // Every 2 minutes
  });

  // Fetch expiring caches
  const { data: expiringCaches, refetch: refetchExpiring } = useQuery({
    queryKey: ["cache", "expiring"],
    queryFn: getExpiringCaches,
    refetchInterval: 120000,
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await triggerFullRefresh();

      if (result && result.success) {
        toast({
          title: "Refresh Started",
          description: `Refreshing ${Array.isArray(result.countries) ? result.countries.length : 0} countries...`,
          variant: "default",
        });

        // Refetch all health data after a delay to let the function complete
        setTimeout(() => {
          refetchHealth();
          refetchStats();
          refetchFailed();
          refetchExpiring();
        }, 3000);
      } else {
        const errorMsg = result?.error
          ? String(result.error)
          : "Failed to start refresh";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error("Manual refresh error:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to trigger refresh";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getHealthStatus = () => {
    const score = parseFloat(health?.healthScore as string);
    if (isNaN(score))
      return {
        color: "border-gray-200 bg-gray-50 dark:bg-gray-950/20",
        text: "Unknown",
      };
    if (score >= 95)
      return {
        color: "border-green-200 bg-green-50 dark:bg-green-950/20",
        text: "Excellent",
      };
    if (score >= 80)
      return {
        color: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
        text: "Good",
      };
    if (score >= 60)
      return {
        color: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
        text: "Fair",
      };
    return {
      color: "border-red-200 bg-red-50 dark:bg-red-950/20",
      text: "Poor",
    };
  };

  const status = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Image Cache Monitor
          </h2>
          <p className="text-muted-foreground">
            Monitor daily image refresh status and health
          </p>
        </div>
        <Button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? "Refreshing..." : "Manual Refresh"}
        </Button>
      </div>

      {/* Health Score Card */}
      {health && !healthLoading && (
        <Card className={`border-2 ${status.color}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Cache Health
                </p>
                <p className="text-4xl font-bold text-foreground">
                  {health.healthScore}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {status.text}
                </p>
              </div>
              <div className="text-right space-y-2">
                {health.alertCount > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {health.alertCount} alert
                      {health.alertCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Last check: {new Date(health.lastCheck).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Countries */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Countries</p>
                <p className="text-2xl font-bold">{stats.totalCountries}</p>
              </div>
            </CardContent>
          </Card>

          {/* Successful Refreshes */}
          <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">Successful</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.successCount}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Failed Refreshes */}
          <Card
            className={`border-2 ${
              stats.failureCount > 0
                ? "border-red-200 bg-red-50 dark:bg-red-950/20"
                : "border-green-200 bg-green-50 dark:bg-green-950/20"
            }`}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle
                    className={`h-4 w-4 ${
                      stats.failureCount > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  />
                  <p
                    className={`text-sm ${
                      stats.failureCount > 0 ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    Failed
                  </p>
                </div>
                <p
                  className={`text-2xl font-bold ${
                    stats.failureCount > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {stats.failureCount}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pending Refreshes */}
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">Pending</p>
                </div>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pendingCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failed Refreshes Alert */}
        {failedRefreshes && failedRefreshes.length > 0 && (
          <Card className="border-2 border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Failed Refreshes ({failedRefreshes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {failedRefreshes.slice(0, 10).map((country) => (
                <div
                  key={country.country}
                  className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm"
                >
                  <div>
                    <p className="font-medium">{country.country}</p>
                    <p className="text-xs text-muted-foreground">
                      {country.consecutiveFailures} consecutive failure
                      {country.consecutiveFailures !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              ))}
              {failedRefreshes.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {failedRefreshes.length - 10} more
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expiring Cache Alert */}
        {expiringCaches && expiringCaches.length > 0 && (
          <Card className="border-2 border-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                Expiring Soon ({expiringCaches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {expiringCaches.slice(0, 10).map((country) => (
                <div
                  key={country.country}
                  className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded text-sm"
                >
                  <div>
                    <p className="font-medium">{country.country}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(country.fetchedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              ))}
              {expiringCaches.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  ... and {expiringCaches.length - 10} more
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {failedRefreshes &&
          expiringCaches &&
          failedRefreshes.length === 0 &&
          expiringCaches.length === 0 && (
            <div className="col-span-1 lg:col-span-2">
              <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">
                    All image caches are healthy!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    No failed refreshes or expiring entries detected
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
      </div>

      {/* Info Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-sm">About Image Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            🔄 <span className="font-medium">Daily Refresh:</span> Runs at 2 AM
            UTC
          </p>
          <p>
            ⏰ <span className="font-medium">Cache Duration:</span> 48 hours
            from last refresh
          </p>
          <p>
            🔍 <span className="font-medium">Update Strategy:</span> Fetches 24+
            images from 3 Unsplash queries per country
          </p>
          <p>
            📊 <span className="font-medium">Monitoring:</span> Health checked
            every 1 minute
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageCacheMonitor;
