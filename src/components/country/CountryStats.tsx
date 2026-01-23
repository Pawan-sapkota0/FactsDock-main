import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Users, DollarSign, Globe, Phone } from "lucide-react";
import { DateTime } from "luxon";
import { useState, useEffect } from "react";
import { scrollToElementObserver } from "@/lib/scroll-utils";
import { log, debug, warn, error } from "@/lib/logger";
type Props = {
  flag?: string;
  capital?: string;
  population?: string;
  currency?: string;
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

export default function CountryStats({
  flag,
  capital,
  population,
  currency,
  callingCode,
  languages,
  timezones,
  capitalTimezone,
  area,
  continent,
  weather,
}: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-6 items-start mb-8">
      <div className="col-span-1 flex flex-col items-center gap-4">
        {flag ? (
          <img
            src={flag}
            alt="flag"
            className="w-60 h-46 object-cover rounded-lg shadow"
          />
        ) : (
          <div className="w-60 h-46 bg-muted rounded-lg flex items-center justify-center">
            No flag
          </div>
        )}
        <Button
          onClick={() => {
            scrollToElementObserver("latest-news", 5000).catch((err) => {
              error("[Latest News Button] Scroll failed:", err);
            });
          }}
          variant="outline"
          className="px-6 py-2"
        >
          View Latest News
        </Button>
      </div>

      <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {(() => {
              const TimeDisplay = () => {
                const [time, setTime] = React.useState("N/A");

                React.useEffect(() => {
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
                            ? DateTime.now()
                                .setZone(first)
                                .toFormat("hh:mm a '(UTC'ZZ')'")
                            : "N/A",
                        );
                      } else {
                        setTime("N/A");
                      }
                    } catch {
                      setTime("N/A");
                    }
                  };

                  updateTime(); // initial render
                  const interval = setInterval(updateTime, 60000); // update every minute
                  return () => clearInterval(interval);
                }, [capitalTimezone, timezones]);

                return <>{time}</>;
              };

              return <TimeDisplay />;
            })()}
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

      {/* lastUpdated removed per request */}
    </div>
  );
}
