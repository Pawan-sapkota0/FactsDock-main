import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  MapPin,
  Users,
  DollarSign,
  Languages,
  Flag,
  Loader2,
  Globe,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryCard from "@/components/cards/CategoryCard";
import { useToast } from "@/hooks/use-toast";
import { fetchCountryByName, getLocalCacheMeta } from "@/lib/api";
import logger from "@/lib/logger";
import { fetchFactsByCategory } from "@/lib/facts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CountryHeader from "@/components/country/CountryHeader";
import CountryStats from "@/components/country/CountryStats";
import CountryImageGallery from "@/components/country/CountryImageGallery";
import { useCountryImages } from "@/hooks/use-country-images";
// CategoryTabs removed in favor of main category cards
import NewsSection from "@/components/country/NewsSection";
import QuizButton from "@/components/country/QuizButton";
import LazyFactCard from "@/components/cards/LazyFactCard";
import { SEOMeta } from "@/components/common/SEOMeta";
import { generatePlaceSchema, generateArticleSchema } from "@/lib/seo-utils";

interface CountryData {
  name: string;
  flag: string;
  flagImage: string;
  capital: string;
  population: string;
  currency: string;
  currencySymbol: string;
  currencyCode: string;
  languages: string;
  timezones: string;
  area: string;
  region: string;
  continent: string;
  callingCode: string;
  subregion: string;
  lastUpdated: number | null;
  capitalTimezone: string | null;
  weather?: {
    temp_c?: number;
    condition?: { text?: string };
    wind_kph?: number;
    humidity?: number;
  };
}

interface Fact {
  id?: string;
  fact_id?: string;
  fact_text?: string;
  fact?: string;
  title?: string;
  [key: string]: unknown;
}

const Country = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // removed isCached flag — header no longer shows cached badge

  // Gallery hook: fetches images for the country
  const { images, isLoading: isImagesLoading } = useCountryImages(
    countryData?.name || null,
  );

  // Define fetchCountryData early so effects can reference it in dependencies
  const fetchCountryData = useCallback(async () => {
    if (!slug) return;

    setIsLoading(true);
    try {
      // Convert slug -> human-friendly name. Try multiple variants if needed.
      const candidate = slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      // Try a fresh fetch first (bypass cache). If it fails, fallback to cached fetch.
      let results;
      try {
        results = await fetchCountryByName(candidate, { force: true });
      } catch (e) {
        logger.warn("Forced fetch failed, trying cached fetch", e);
        results = await fetchCountryByName(candidate);
      }
      let country =
        Array.isArray(results) && results.length > 0 ? results[0] : null;

      // heuristic: if population is unrealistically small or area/region missing, fallback to direct RestCountries
      const looksSuspicious = (
        c: Record<string, unknown> | null | undefined,
      ) => {
        const obj = c ?? null;
        const pop = Number(
          (obj && (obj.population ?? obj.populationTotal ?? obj.pop_est)) ?? 0,
        );
        const areaVal = obj && (obj.area ?? obj.area_km2 ?? obj.areaInSqKm);
        const area = areaVal != null ? Number(areaVal) : null;
        const region = obj && (obj.region ?? obj.continent ?? obj.subregion);
        return (pop > 0 && pop < 1000) || !area || !region;
      };

      if (country && looksSuspicious(country)) {
        try {
          const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(
            candidate,
          )}?fullText=true`;
          const r = await fetch(url);
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data) && data.length > 0) {
              country = data[0];
              // also update the cache directly so future reads use RestCountries data
              // reuse the same setLocalCache function via api module by writing to localStorage
              try {
                localStorage.setItem(
                  `wf:country:${candidate.toLowerCase()}`,
                  JSON.stringify({
                    ts: Date.now(),
                    ttl: 86400 * 1000,
                    value: data,
                  }),
                );
              } catch (e) {
                /* ignored - storage best-effort */
              }
            }
          }
        } catch (e) {
          /* ignored - fallback failures */
        }
      }
      // debug log the raw country object so we can inspect fields in the console
      logger.debug(
        "fetchCountryData results count:",
        Array.isArray(results) ? results.length : 0,
        "country:",
        country,
      );

      const currencies = country?.currencies || {};
      const currencyKeys = Object.keys(currencies);
      const currencyValues = Object.values(currencies) as Array<{
        name?: string;
        symbol?: string;
      }>;
      const firstCurrency = currencyValues[0] || {};
      const firstCurrencyCode = currencyKeys[0] || "";

      const cacheMeta = getLocalCacheMeta(
        "country",
        (country?.name?.common || candidate).toLowerCase().trim(),
      );

      // defensive field mapping to handle different response shapes
      const capitalVal = Array.isArray(country?.capital)
        ? country.capital[0]
        : country?.capital || country?.capitalCity || null;
      const populationVal =
        country?.population ||
        country?.populationTotal ||
        country?.pop_est ||
        null;
      const meta = country?.metadata || country?.properties || {};
      const areaVal =
        meta?.area ||
        country?.area ||
        country?.area_km2 ||
        country?.areaInSqKm ||
        country?.metrics?.area ||
        country?.geo?.area ||
        null;
      const regionVal =
        meta?.region ||
        country?.region ||
        country?.continent ||
        country?.subregion ||
        country?.regionName ||
        country?.adminRegion ||
        country?.properties?.region ||
        null;
      const languagesVal = country?.languages
        ? Object.values(country.languages).join(", ")
        : country?.lang || country?.language || null;

      const safeValue = (v: unknown) =>
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
          ? "N/A"
          : String(v);
      const continentValRaw =
        meta?.continent ||
        country?.continent ||
        (Array.isArray(country?.continents) ? country.continents[0] : null) ||
        country?.adminRegion ||
        null;
      const continentVal = safeValue(continentValRaw);
      const tzRaw = Array.isArray(country?.timezones)
        ? country.timezones
        : country?.time_zone || country?.timezones || null;
      const timezonesVal = tzRaw
        ? Array.isArray(tzRaw)
          ? tzRaw.join(", ")
          : String(tzRaw)
        : null;
      const callingRoot = country?.idd?.root || meta?.idd?.root || null;
      const callingSuffix =
        Array.isArray(country?.idd?.suffixes) && country.idd.suffixes.length > 0
          ? country.idd.suffixes[0]
          : Array.isArray(meta?.idd?.suffixes) && meta.idd.suffixes.length > 0
            ? meta.idd.suffixes[0]
            : null;
      const callingCodeRaw =
        callingRoot && callingSuffix
          ? `${callingRoot}${callingSuffix}`
          : country?.callingCode || meta?.callingCode || null;
      const callingCodeVal = callingCodeRaw ? String(callingCodeRaw) : null;

      setCountryData({
        name: country?.name?.common || country?.name || candidate,
        flag: country?.flag || "",
        flagImage: country?.flags?.svg || country?.flagImage || "",
        capital: capitalVal || "N/A",
        population: populationVal
          ? typeof populationVal === "number"
            ? populationVal.toLocaleString()
            : populationVal
          : "N/A",
        currency: firstCurrency.name || country?.currency || "N/A",
        currencySymbol: firstCurrency.symbol || "",
        currencyCode: firstCurrencyCode || "N/A",
        languages: languagesVal || "N/A",
        timezones: timezonesVal || "N/A",
        area: areaVal ? `${Number(areaVal).toLocaleString()} km\u00b2` : "N/A",
        region: regionVal || "N/A",
        continent: continentVal || "N/A",
        callingCode: callingCodeVal || "N/A",
        subregion: country?.subregion || "N/A",
        lastUpdated: cacheMeta?.ts || null,
        capitalTimezone: null,
      });
    } catch (error) {
      logger.error("Error fetching country:", error);
      toast({
        title: "Error",
        description: "Failed to load country data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [slug, toast]);

  useEffect(() => {
    fetchCountryData();
  }, [fetchCountryData, slug]);

  // background refresh: fetch fresh data after initial render without blocking UI
  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    const candidate = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    (async () => {
      try {
        const results = await fetchCountryByName(candidate, { force: true });
        if (!mounted) return;
        const country =
          Array.isArray(results) && results.length > 0 ? results[0] : null;
        if (!country) return;

        // Simple shallow compare: if the cached displayed name differs from fresh name, update UI
        const freshName = country?.name?.common || country?.name || candidate;
        if (freshName && freshName !== countryData?.name) {
          // reuse the same mapping logic used in fetchCountryData/handleRefresh
          const currencies = country?.currencies || {};
          const currencyKeys = Object.keys(currencies);
          const currencyValues = Object.values(currencies) as Array<{
            name?: string;
            symbol?: string;
          }>;
          const firstCurrency = currencyValues[0] || {};
          const firstCurrencyCode = currencyKeys[0] || "";
          const cacheMeta = getLocalCacheMeta(
            "country",
            (country?.name?.common || candidate).toLowerCase().trim(),
          );
          const capitalVal = Array.isArray(country?.capital)
            ? country.capital[0]
            : country?.capital || country?.capitalCity || null;
          const populationVal =
            country?.population ||
            country?.populationTotal ||
            country?.pop_est ||
            null;
          // prefer metadata fields if present (some data sources store values under metadata)
          const meta = country?.metadata || country?.properties || {};
          // Accept many possible shapes: top-level, metadata/properties, nested metrics, or alternate names
          const areaVal =
            meta?.area ||
            country?.area ||
            country?.area_km2 ||
            country?.areaInSqKm ||
            country?.metrics?.area ||
            country?.geo?.area ||
            null;
          const regionVal =
            meta?.region ||
            country?.region ||
            country?.continent ||
            country?.subregion ||
            country?.regionName ||
            country?.adminRegion ||
            country?.properties?.region ||
            null;
          const languagesVal = country?.languages
            ? Object.values(country.languages).join(", ")
            : country?.lang || country?.language || null;

          // helper to display a safe value or 'N/A'
          const safeValue = (v: unknown) =>
            v === null ||
            v === undefined ||
            (typeof v === "string" && v.trim() === "")
              ? "N/A"
              : v;

          // continent: may be under continents (array) or continent or metadata
          const continentValRaw =
            meta?.continent ||
            country?.continent ||
            (Array.isArray(country?.continents)
              ? country.continents[0]
              : null) ||
            country?.adminRegion ||
            null;
          const continentVal = String(safeValue(continentValRaw));

          // timezones: if array, join with commas; else try common fields
          const tzRaw = Array.isArray(country?.timezones)
            ? country.timezones
            : country?.time_zone || country?.timezones || null;
          const timezonesVal = tzRaw
            ? Array.isArray(tzRaw)
              ? tzRaw.join(", ")
              : String(tzRaw)
            : null;

          // calling code: prefer idd.root + idd.suffixes[0], fallback to other common fields
          const callingRoot = country?.idd?.root || meta?.idd?.root || null;
          const callingSuffix =
            Array.isArray(country?.idd?.suffixes) &&
            country.idd.suffixes.length > 0
              ? country.idd.suffixes[0]
              : Array.isArray(meta?.idd?.suffixes) &&
                  meta.idd.suffixes.length > 0
                ? meta.idd.suffixes[0]
                : null;
          const callingCodeRaw =
            callingRoot && callingSuffix
              ? `${callingRoot}${callingSuffix}`
              : country?.callingCode || meta?.callingCode || null;
          const callingCodeVal = callingCodeRaw ? String(callingCodeRaw) : null;

          const newData = {
            name: country?.name?.common || country?.name || candidate,
            flag: country?.flag || "",
            flagImage: country?.flags?.svg || country?.flagImage || "",
            capital: capitalVal || "N/A",
            population: populationVal
              ? typeof populationVal === "number"
                ? populationVal.toLocaleString()
                : populationVal
              : "N/A",
            currency: firstCurrency.name || country?.currency || "N/A",
            currencySymbol: firstCurrency.symbol || "",
            currencyCode: firstCurrencyCode || "N/A",
            languages: languagesVal || "N/A",
            timezones: timezonesVal || "N/A",
            area: areaVal
              ? `${Number(areaVal).toLocaleString()} km\u00b2`
              : "N/A",
            region: regionVal || "N/A",
            continent: continentVal,
            callingCode: callingCodeVal || "N/A",
            subregion: country?.subregion || "N/A",

            lastUpdated: cacheMeta?.ts || Date.now(),
            capitalTimezone: null,
          };

          setCountryData(newData);
        }
      } catch (e) {
        // background refresh failures are silent
        // logger.debug('background refresh failed', e);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // refresh when window gains focus (useful if user switches back to tab)
  useEffect(() => {
    const onFocus = () => {
      if (!slug) return;
      // fire-and-forget refresh, reuse existing handleRefresh logic
      handleRefresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleRefresh = async () => {
    // force bypass cache
    setIsLoading(true);
    try {
      const candidate = slug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const results = await fetchCountryByName(candidate, { force: true });
      let country =
        Array.isArray(results) && results.length > 0 ? results[0] : null;
      // background fallback same heuristic
      const looksSuspiciousBg = (
        c: Record<string, unknown> | null | undefined,
      ) => {
        const obj = c ?? null;
        const pop = Number(
          (obj && (obj.population ?? obj.populationTotal ?? obj.pop_est)) ?? 0,
        );
        const areaVal = obj && (obj.area ?? obj.area_km2 ?? obj.areaInSqKm);
        const area = areaVal != null ? Number(areaVal) : null;
        const region = obj && (obj.region ?? obj.continent ?? obj.subregion);
        return (pop > 0 && pop < 1000) || !area || !region;
      };
      if (country && looksSuspiciousBg(country)) {
        try {
          const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(
            candidate,
          )}?fullText=true`;
          const r = await fetch(url);
          if (r.ok) {
            const data = await r.json();
            if (Array.isArray(data) && data.length > 0) {
              country = data[0];
              try {
                localStorage.setItem(
                  `wf:country:${candidate.toLowerCase()}`,
                  JSON.stringify({
                    ts: Date.now(),
                    ttl: 86400 * 1000,
                    value: data,
                  }),
                );
              } catch (e) {
                /* ignored - storage best-effort */
              }
            }
          }
        } catch (e) {
          /* ignored - fallback */
        }
      }
      logger.debug(
        "handleRefresh results count:",
        Array.isArray(results) ? results.length : 0,
        "country:",
        country,
      );
      const currencies = country?.currencies || {};
      const currencyValues = Object.values(currencies) as Array<{
        name?: string;
        symbol?: string;
      }>;
      const firstCurrency = currencyValues[0] || {};
      const currencyKeys = Object.keys(currencies);
      const firstCurrencyCode = currencyKeys[0] || "";
      const cacheMeta = getLocalCacheMeta(
        "country",
        (country?.name?.common || candidate).toLowerCase().trim(),
      );

      const capitalVal = Array.isArray(country?.capital)
        ? country.capital[0]
        : country?.capital || country?.capitalCity || null;
      const populationVal =
        country?.population ||
        country?.populationTotal ||
        country?.pop_est ||
        null;
      const meta = country?.metadata || country?.properties || {};
      const areaVal =
        meta?.area ||
        country?.area ||
        country?.area_km2 ||
        country?.areaInSqKm ||
        country?.metrics?.area ||
        country?.geo?.area ||
        null;
      const regionVal =
        meta?.region ||
        country?.region ||
        country?.continent ||
        country?.subregion ||
        country?.regionName ||
        country?.adminRegion ||
        country?.properties?.region ||
        null;
      const languagesVal = country?.languages
        ? Object.values(country.languages).join(", ")
        : country?.lang || country?.language || null;
      const safeValue = (v: unknown) =>
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
          ? "N/A"
          : String(v);
      const continentValRaw =
        meta?.continent ||
        country?.continent ||
        (Array.isArray(country?.continents) ? country.continents[0] : null) ||
        country?.adminRegion ||
        null;
      const continentVal = safeValue(continentValRaw);
      const tzRaw = Array.isArray(country?.timezones)
        ? country.timezones
        : country?.time_zone || country?.timezones || null;
      const timezonesVal = tzRaw
        ? Array.isArray(tzRaw)
          ? tzRaw.join(", ")
          : String(tzRaw)
        : null;

      setCountryData({
        name: country?.name?.common || country?.name || candidate,
        flag: country?.flag || "",
        flagImage: country?.flags?.svg || country?.flagImage || "",
        capital: capitalVal || "N/A",
        population: populationVal
          ? typeof populationVal === "number"
            ? populationVal.toLocaleString()
            : populationVal
          : "N/A",
        currency: firstCurrency.name || country?.currency || "N/A",
        currencySymbol: firstCurrency.symbol || "",
        currencyCode: firstCurrencyCode || "N/A",
        languages: languagesVal || "N/A",
        timezones: timezonesVal || "N/A",
        area: areaVal ? `${Number(areaVal).toLocaleString()} km\u00b2` : "N/A",
        region: regionVal || "N/A",
        continent: continentVal || "N/A",
        callingCode: country?.callingCodes?.[0] || country?.idd?.root || "+1",
        subregion: country?.subregion || "N/A",
        lastUpdated: cacheMeta?.ts || Date.now(),
        capitalTimezone: null,
      });
    } catch (error) {
      logger.error("Error refreshing country data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh country data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { title: "Geography & Nature", icon: MapPin },
    { title: "Culture & Tradition", icon: Users },
    { title: "History & Heritage", icon: Flag },
    { title: "Economy & Industry", icon: DollarSign },
    { title: "Tourism & Landmarks", icon: Globe },
    { title: "Education & Innovation", icon: MapPin },
    { title: "Sports & Achievements", icon: Users },
    { title: "Fun & Interesting Facts", icon: Flag },
    { title: "Global Presence", icon: Globe },
  ];

  const [factsOpen, setFactsOpen] = useState(false);
  const [factsList, setFactsList] = useState<Fact[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const location = useLocation();

  // Dev: log facts list changes so we can verify parent is receiving fetched data
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        logger.debug("[Country] factsList changed", factsList);
      } catch (e) {
        /* ignored - debug only */
      }
    }
  }, [factsList]);

  // Fetch weather for the capital city and merge into countryData
  // NOTE: depend only on the capital string. Previously depending on
  // the whole `countryData` caused setCountryData to update the object
  // which retriggered this effect and led to repeated fetches.
  useEffect(() => {
    const capital = countryData?.capital;
    if (!capital || capital === "N/A") return;

    // If we already have weather for this country/capital, do not refetch
    if (countryData?.weather) return;

    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        // Log presence (do not print the key itself)
        logger.debug("[Weather] fetch start", {
          capital: capital,
          hasApiKey: !!apiKey,
        });
        if (!apiKey) {
          logger.debug(
            "[Weather] no API key available, skipping weather fetch",
          );
          return;
        }
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
            capital,
          )}`,
        );
        if (!res.ok) {
          logger.debug("[Weather] fetch failed", { status: res.status });
          return;
        }
        const data = await res.json();
        logger.debug(
          "[Weather] fetch response",
          data?.current
            ? {
                temp_c: data.current.temp_c,
                condition: data.current.condition?.text,
              }
            : data,
        );
        if (cancelled) return;
        setCountryData((prev) => ({
          ...prev,
          weather: {
            temp_c: data?.current?.temp_c,
            condition: data?.current?.condition,
            wind_kph: data?.current?.wind_kph,
            humidity: data?.current?.humidity,
          },
          capitalTimezone:
            data?.location?.tz_id || prev?.capitalTimezone || null,
        }));
      } catch (e) {
        logger.debug("[Weather] fetch error", e);
      }
    };
    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [countryData?.capital]);

  // Record a page view once per browser session (uses sessionStorage)
  // eslint-disable react-hooks/exhaustive-deps
  useEffect(() => {
    if (!countryData) return;
    if (!countryData.name || !slug) return;
    const countryName = countryData.name;
    try {
      const key = `wf:viewed:${slug}`;
      if (
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem(key)
      ) {
        return;
      }

      const record = async () => {
        try {
          const url = `${
            import.meta.env.VITE_SUPABASE_URL
          }/functions/v1/record-country-view`;
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: countryName }),
          });
        } catch (e) {
          logger.debug("[record-country-view] failed", e);
        }
      };

      // Fire-and-forget, then mark as recorded for this session
      record();
      try {
        sessionStorage.setItem(key, String(Date.now()));
      } catch (e) {
        /* ignored - session storage best-effort */
      }
    } catch (e) {
      /* ignored - record-country-view failed */
    }
  }, [countryData, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading country data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!countryData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Country not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Go Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={`${countryData.name} Facts & Information | FactsDock`}
        description={`Explore fascinating facts about ${countryData.name}. Learn about culture, geography, history, economy, and interesting trivia.`}
        keywords={`${countryData.name} facts, facts about ${countryData.name}, ${countryData.name} information, ${countryData.name} quiz`}
        ogImage={
          countryData.flagImage || `${window.location.origin}/og-image.jpg`
        }
        structuredData={generatePlaceSchema({
          name: countryData.name,
          description: `Comprehensive facts and information about ${countryData.name}. Capital: ${countryData.capital}, Population: ${countryData.population}`,
          image: countryData.flagImage,
          url: window.location.href,
        })}
      />
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header Section */}
            <CountryHeader
              name={countryData.name}
              continent={countryData.continent}
            />

            {/* Responsive Layout: Desktop (flex row) and Mobile (flex col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Flag + News Button (Desktop: narrow, Mobile: full width) */}
              <div className="lg:col-span-1">
                <div className="flex flex-col items-center gap-4 sticky top-4">
                  {countryData.flagImage ? (
                    <img
                      src={countryData.flagImage}
                      alt="flag"
                      className="w-full max-w-sm h-auto object-cover rounded-lg shadow"
                    />
                  ) : (
                    <div className="w-full max-w-sm h-48 bg-muted rounded-lg flex items-center justify-center">
                      No flag
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      const newsElement =
                        document.getElementById("latest-news");
                      if (newsElement) {
                        newsElement.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    View Latest News
                  </Button>
                </div>
              </div>

              {/* Right Column: Image Gallery (Desktop: 2 cols, Mobile: full width) */}
              <div className="lg:col-span-2">
                <CountryImageGallery
                  images={images}
                  country={countryData.name}
                  isLoading={isImagesLoading}
                />
              </div>
            </div>

            {/* Stats Section - Full Width Below */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {countryData.name} Statistics
            </h2>
            <CountryStats
              flag={countryData.flagImage}
              capital={countryData.capital}
              population={countryData.population}
              currency={countryData.currency}
              currencyCode={countryData.currencyCode}
              callingCode={countryData.callingCode}
              languages={countryData.languages}
              timezones={countryData.timezones}
              capitalTimezone={countryData.capitalTimezone}
              area={countryData.area}
              continent={countryData.continent}
              weather={countryData.weather}
            />

            {/* dev-only raw countryData panel removed */}

            {/* previous category button removed; main category cards shown below */}

            {/* Heading for categories */}
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              View facts about {countryData.name} by categories
            </h2>

            {/* Main categories cards for the country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {categories.map((c) => (
                <CategoryCard
                  key={c.title}
                  title={c.title}
                  icon={c.icon}
                  onClick={() =>
                    navigate(
                      `/countries/${slug}/${c.title
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`,
                    )
                  }
                />
              ))}
            </div>

            <div>
              <QuizButton country={countryData.name} />
            </div>

            <NewsSection country={countryData.name} />
          </div>
        </div>
      </main>

      <Dialog open={factsOpen} onOpenChange={setFactsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Facts</DialogTitle>
            <DialogDescription>
              Facts about the selected category
            </DialogDescription>
          </DialogHeader>
          {factsLoading ? (
            <div className="p-6">Loading...</div>
          ) : (
            <div className="space-y-4 p-4">
              {factsList.map((f: Fact, i) => (
                <div key={i}>
                  <LazyFactCard
                    fact={String(f?.fact_text || f?.fact || f?.title || "")}
                  />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Country;
