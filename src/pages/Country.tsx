import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
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
// CategoryTabs removed in favor of main category cards
import NewsSection from "@/components/country/NewsSection";
import QuizButton from "@/components/country/QuizButton";
import LazyFactCard from "@/components/cards/LazyFactCard";

const Country = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [countryData, setCountryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  // removed isCached flag — header no longer shows cached badge

  useEffect(() => {
    fetchCountryData();
  }, [slug]);

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
          const currencyValues = Object.values(currencies) as Array<{
            name?: string;
            symbol?: string;
          }>;
          const firstCurrency = currencyValues[0] || {};
          const cacheMeta = getLocalCacheMeta(
            "country",
            (country?.name?.common || candidate).toLowerCase().trim()
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
          const safeValue = (v: any) =>
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
          const continentVal = safeValue(continentValRaw);

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
            languages: languagesVal || "N/A",
            timezones: timezonesVal || "N/A",
            area: areaVal
              ? `${Number(areaVal).toLocaleString()} km\u00b2`
              : "N/A",
            region: regionVal || "N/A",
            continent: continentVal || "N/A",
            callingCode: callingCodeVal || "N/A",
            subregion: country?.subregion || "N/A",

            lastUpdated: cacheMeta?.ts || Date.now(),
            capitalTimezone: null,
          };

          setCountryData(newData);
        }
      } catch (e) {
        // background refresh failures are silent
        // console.debug('background refresh failed', e);
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

  const fetchCountryData = async () => {
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
        console.warn("Forced fetch failed, trying cached fetch", e);
        results = await fetchCountryByName(candidate);
      }
      let country =
        Array.isArray(results) && results.length > 0 ? results[0] : null;

      // heuristic: if population is unrealistically small or area/region missing, fallback to direct RestCountries
      const looksSuspicious = (c: any) => {
        const pop = c?.population || c?.populationTotal || c?.pop_est || 0;
        const area = c?.area || c?.area_km2 || c?.areaInSqKm || null;
        const region = c?.region || c?.continent || c?.subregion || null;
        return (
          (typeof pop === "number" && pop > 0 && pop < 1000) || !area || !region
        );
      };

      if (country && looksSuspicious(country)) {
        try {
          const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(
            candidate
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
                  })
                );
              } catch (e) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore fallback failures
        }
      }
      // debug log the raw country object so we can inspect fields in the console
      console.debug(
        "fetchCountryData results count:",
        Array.isArray(results) ? results.length : 0,
        "country:",
        country
      );

      const currencies = country?.currencies || {};
      const currencyValues = Object.values(currencies) as Array<{
        name?: string;
        symbol?: string;
      }>;
      const firstCurrency = currencyValues[0] || {};

      const cacheMeta = getLocalCacheMeta(
        "country",
        (country?.name?.common || candidate).toLowerCase().trim()
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

      const safeValue = (v: any) =>
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
          ? "N/A"
          : v;
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
      console.error("Error fetching country:", error);
      toast({
        title: "Error",
        description: "Failed to load country data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      const looksSuspiciousBg = (c: any) => {
        const pop = c?.population || c?.populationTotal || c?.pop_est || 0;
        const area = c?.area || c?.area_km2 || c?.areaInSqKm || null;
        const region = c?.region || c?.continent || c?.subregion || null;
        return (
          (typeof pop === "number" && pop > 0 && pop < 1000) || !area || !region
        );
      };
      if (country && looksSuspiciousBg(country)) {
        try {
          const url = `https://restcountries.com/v3.1/name/${encodeURIComponent(
            candidate
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
                  })
                );
              } catch (e) {}
            }
          }
        } catch (e) {}
      }
      console.debug(
        "handleRefresh results count:",
        Array.isArray(results) ? results.length : 0,
        "country:",
        country
      );
      const currencies = country?.currencies || {};
      const currencyValues = Object.values(currencies) as Array<{
        name?: string;
        symbol?: string;
      }>;
      const firstCurrency = currencyValues[0] || {};
      const cacheMeta = getLocalCacheMeta(
        "country",
        (country?.name?.common || candidate).toLowerCase().trim()
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
      const safeValue = (v: any) =>
        v === null ||
        v === undefined ||
        (typeof v === "string" && v.trim() === "")
          ? "N/A"
          : v;
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
        languages: languagesVal || "N/A",
        timezones: timezonesVal || "N/A",
        area: areaVal ? `${Number(areaVal).toLocaleString()} km\u00b2` : "N/A",
        region: regionVal || "N/A",
        continent: continentVal || "N/A",
        subregion: country?.subregion || "N/A",
        lastUpdated: cacheMeta?.ts || Date.now(),
        capitalTimezone: null,
      });
    } catch (error) {
      console.error("Error refreshing country data:", error);
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
  const [factsList, setFactsList] = useState<any[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const location = useLocation();

  // Debug: log facts list changes so we can verify parent is receiving fetched data
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      try {
        console.debug("[Country] factsList changed", factsList);
      } catch (e) {}
    }
  }, [factsList]);

  // Fetch weather for the capital city and merge into countryData
  useEffect(() => {
    if (!countryData || !countryData.capital || countryData.capital === "N/A")
      return;
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
        // Log presence (do not print the key itself)
        console.debug("[Weather] fetch start", {
          capital: countryData.capital,
          hasApiKey: !!apiKey,
        });
        if (!apiKey) {
          console.debug(
            "[Weather] no API key available, skipping weather fetch"
          );
          return;
        }
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
            countryData.capital
          )}`
        );
        if (!res.ok) {
          console.debug("[Weather] fetch failed", { status: res.status });
          return;
        }
        const data = await res.json();
        console.debug(
          "[Weather] fetch response",
          data?.current
            ? {
                temp_c: data.current.temp_c,
                condition: data.current.condition?.text,
              }
            : data
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
        console.debug("[Weather] fetch error", e);
      }
    };
    fetchWeather();
    return () => {
      cancelled = true;
    };
  }, [countryData?.capital]);

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
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            <CountryHeader name={countryData.name} />
            <CountryStats
              flag={countryData.flagImage}
              capital={countryData.capital}
              population={countryData.population}
              currency={countryData.currency}
              callingCode={countryData.callingCode}
              languages={countryData.languages}
              timezones={countryData.timezones}
              capitalTimezone={countryData.capitalTimezone}
              area={countryData.area}
              continent={countryData.continent}
              weather={countryData.weather}
            />

            {new URLSearchParams(location.search).get("debug") === "1" ? (
              <div className="bg-black/5 p-4 rounded border mt-4">
                <h3 className="font-semibold mb-2">Debug: raw countryData</h3>
                <pre className="text-sm max-h-64 overflow-auto">
                  {JSON.stringify(countryData, null, 2)}
                </pre>
              </div>
            ) : null}

            {/* previous category button removed; main category cards shown below */}

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
                        .replace(/\s+/g, "-")}`
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
              {factsList.map((f, i) => (
                <div key={i}>
                  <LazyFactCard
                    fact={f?.fact_text || f?.fact || f?.title || ""}
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
