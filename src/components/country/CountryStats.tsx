import React, { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, DollarSign, Globe, Phone, Flag } from "lucide-react";
import { DateTime } from "luxon";

type Props = {
  flag?: string;
  capital?: string;
  population?: string;
  currency?: string;
  currencyCode?: string;
  callingCode?: string;
  languages?: string;
  timezones?: string;
  area?: string;
  continent?: string;
  capitalTimezone?: string | null;
  weather?: {
    temp_c?: number;
    condition?: { text?: string; icon?: string };
    wind_kph?: number;
    humidity?: number;
  } | null;
};

/**
 * TimeDisplay - Memoized component for displaying capital timezone
 * Updates every minute without remounting parent
 */
const TimeDisplay = memo(function TimeDisplay({
  capitalTimezone,
  timezones,
}: {
  capitalTimezone?: string | null;
  timezones?: string;
}) {
  const [time, setTime] = useState("N/A");

  useEffect(() => {
    if (!capitalTimezone && !timezones) return;

    const updateTime = () => {
      try {
        if (capitalTimezone) {
          setTime(
            DateTime.now()
              .setZone(capitalTimezone)
              .toFormat("hh:mm a '(UTC'ZZ')'"),
          );
        } else if (timezones) {
          const first = String(timezones).split(",")[0].trim();
          setTime(
            first
              ? DateTime.now().setZone(first).toFormat("hh:mm a '(UTC'ZZ')'")
              : "N/A",
          );
        } else {
          setTime("N/A");
        }
      } catch {
        setTime("N/A");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [capitalTimezone, timezones]);

  return <>{time}</>;
});

TimeDisplay.displayName = "TimeDisplay";

/**
 * CountryStats - Displays country information in a grid layout
 * Memoized to prevent re-renders when props haven't changed
 */
const CountryStats = memo(function CountryStats({
  flag,
  capital,
  population,
  currency,
  currencyCode,
  callingCode,
  languages,
  timezones,
  capitalTimezone,
  area,
  continent,
  weather,
}: Props) {
  // Memoize timezone parsing to avoid re-computation
  const firstTimezone = useMemo(() => {
    if (!timezones) return null;
    return String(timezones).split(",")[0].trim();
  }, [timezones]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Capital
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {capital || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Population
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {population || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {currency || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            Currency Code
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground text-sm font-mono">
          {currencyCode || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-primary" />
            Calling Code
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {callingCode || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {languages || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Timezones {capital ? `: ${capital}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          <TimeDisplay
            capitalTimezone={capitalTimezone}
            timezones={timezones}
          />
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Area
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {area || "N/A"}
        </CardContent>
      </Card>

      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Continent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {continent || "N/A"}
        </CardContent>
      </Card>

      {/* Weather Card: always show; display fallback message when no data */}
      <Card className="p-4">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            Weather {capital ? `in ${capital}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 text-foreground">
          {weather ? (
            <div className="flex flex-wrap items-center gap-2">
              {weather.condition?.icon && (
                <img
                  src={weather.condition.icon}
                  alt="weather icon"
                  className="w-8 h-8 flex-shrink-0"
                  loading="lazy"
                  width={32}
                  height={32}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}

              <div className="flex items-baseline gap-2 min-w-0">
                <span className="truncate font-medium max-w-[10rem]">
                  {weather.condition?.text || ""}
                </span>
                <span className="ml-2 font-semibold">
                  {weather.temp_c ?? ""}°C
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
                <span className="whitespace-nowrap">
                  Humidity: {weather.humidity ?? ""}%
                </span>
                <span className="whitespace-nowrap">
                  Wind: {weather.wind_kph ?? ""} kph
                </span>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">N/A</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

CountryStats.displayName = "CountryStats";

export default CountryStats;
