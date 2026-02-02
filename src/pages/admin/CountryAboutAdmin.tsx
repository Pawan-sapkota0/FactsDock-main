import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_AVAILABLE } from "@/integrations/supabase/client";
import {
  Search,
  Save,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES_A_TO_Z } from "@/lib/countries";
import logger from "@/lib/logger";
import { format } from "date-fns";

interface CountryAbout {
  id: string;
  country_name: string;
  about: string;
  last_updated: string;
  created_at: string;
}

const CountryAboutAdmin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [editedText, setEditedText] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch all countries with their about text
  const { data: countriesAbout = [], isLoading: isLoadingCountries } = useQuery(
    {
      queryKey: ["countriesAbout"],
      queryFn: async () => {
        if (!SUPABASE_AVAILABLE) return [];

        try {
          const { data, error } = await supabase
            .from("country_about")
            .select("*")
            .order("country_name");

          if (error) {
            logger.error(
              "[CountryAboutAdmin] Failed to fetch countries about",
              error,
            );
            return [];
          }

          return (data as CountryAbout[]) || [];
        } catch (e) {
          logger.error("[CountryAboutAdmin] Exception fetching countries", e);
          return [];
        }
      },
    },
  );

  // Get the current selected country data
  const currentCountryData = useMemo(() => {
    return countriesAbout.find(
      (c) => c.country_name.toLowerCase() === selectedCountry.toLowerCase(),
    );
  }, [countriesAbout, selectedCountry]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    const allCountries = COUNTRIES_A_TO_Z;
    if (!searchQuery) return allCountries.slice(0, 20); // Limit to 20 for performance

    return allCountries.filter((country) =>
      country.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  // Handle country selection
  const handleSelectCountry = (country: string) => {
    setSelectedCountry(country);
    setSearchQuery("");
    const found = countriesAbout.find(
      (c) => c.country_name.toLowerCase() === country.toLowerCase(),
    );
    setEditedText(found?.about || "");
  };

  // Mutation for updating country about text
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCountry || !editedText.trim()) {
        throw new Error("Country and text are required");
      }

      if (!SUPABASE_AVAILABLE) {
        throw new Error("Supabase not available");
      }

      try {
        // Check if country exists in DB using maybeSingle instead of single
        const { data: existing, error: checkError } = await supabase
          .from("country_about")
          .select("id")
          .eq("country_name", selectedCountry)
          .maybeSingle();

        if (checkError) {
          logger.error("[CountryAboutAdmin] Check error", checkError);
          throw checkError;
        }

        if (existing?.id) {
          // Update existing
          const { error: updateError } = await supabase
            .from("country_about")
            .update({
              about: editedText.trim(),
              last_updated: new Date().toISOString(),
            })
            .eq("id", existing.id);

          if (updateError) {
            logger.error("[CountryAboutAdmin] Update error", updateError);
            throw updateError;
          }

          logger.debug("[CountryAboutAdmin] Successfully updated", {
            country: selectedCountry,
          });
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from("country_about")
            .insert([
              {
                country_name: selectedCountry,
                about: editedText.trim(),
                created_at: new Date().toISOString(),
                last_updated: new Date().toISOString(),
              },
            ]);

          if (insertError) {
            logger.error("[CountryAboutAdmin] Insert error", insertError);
            throw insertError;
          }

          logger.debug("[CountryAboutAdmin] Successfully inserted", {
            country: selectedCountry,
          });
        }

        return true;
      } catch (error) {
        logger.error("[CountryAboutAdmin] Mutation error", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["countriesAbout"] });
      toast({
        title: "Success",
        description: `About text for ${selectedCountry} has been updated.`,
      });
      // Clear cache for this country in fetchCountryAbout
      try {
        const key = `wf:about:${selectedCountry.toLowerCase().trim()}`;
        localStorage.removeItem(key);
      } catch (e) {
        // ignore cache clearing errors
      }
    },
    onError: (error) => {
      logger.error("[CountryAboutAdmin] Update failed", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update about text. Please check RLS policies and try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Country About</h1>
        <p className="text-muted-foreground mt-2">
          Manage professional descriptions for countries displayed on their
          pages.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Country Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Country</CardTitle>
              <CardDescription>
                Search or choose a country to edit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Country List */}
              <div className="border border-border rounded-md max-h-96 overflow-y-auto">
                {isLoadingCountries ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : filteredCountries.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredCountries.map((country) => {
                      const hasAbout = countriesAbout.some(
                        (c) =>
                          c.country_name.toLowerCase() ===
                          country.toLowerCase(),
                      );
                      return (
                        <button
                          key={country}
                          onClick={() => handleSelectCountry(country)}
                          className={`w-full text-left px-4 py-2 transition-colors ${
                            selectedCountry === country
                              ? "bg-primary/10 text-primary font-semibold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{country}</span>
                            {hasAbout && (
                              <div className="h-2 w-2 bg-green-500 rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-muted-foreground">
                    No countries found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Editor Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCountry ? (
            <>
              {/* Current Data Info */}
              {currentCountryData && currentCountryData.last_updated ? (
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="pt-6 flex items-start gap-3">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      Last updated:{" "}
                      <span className="font-semibold">
                        {(() => {
                          try {
                            const date = new Date(
                              currentCountryData.last_updated,
                            );
                            if (isNaN(date.getTime())) {
                              return "N/A";
                            }
                            return format(date, "MMM dd, yyyy HH:mm");
                          } catch (e) {
                            return "N/A";
                          }
                        })()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Editor Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedCountry}</CardTitle>
                      <CardDescription>
                        Edit professional description
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="gap-2"
                    >
                      {showPreview ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          Hide Preview
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          Preview
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showPreview ? (
                    // Preview Mode
                    <div className="border border-border rounded-md p-4 bg-muted/30 min-h-64">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        About
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {editedText || "No text entered yet..."}
                      </p>
                    </div>
                  ) : (
                    // Editor Mode
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      placeholder="Enter professional description for this country..."
                      className="w-full min-h-64 p-4 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
                    />
                  )}

                  {/* Character Count */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{editedText.length} characters</span>
                    <span>Recommended: 100-500 characters</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => updateMutation.mutate()}
                      disabled={
                        updateMutation.isPending ||
                        !editedText.trim() ||
                        !selectedCountry
                      }
                      className="gap-2"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    {!editedText && selectedCountry && (
                      <Button
                        variant="outline"
                        onClick={() => handleSelectCountry(selectedCountry)}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Info Box */}
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <CardContent className="pt-6 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-900 dark:text-amber-100">
                    <p className="font-semibold mb-1">Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Keep descriptions professional and informative</li>
                      <li>Aim for 100-500 characters for better readability</li>
                      <li>
                        Include key facts about geography, culture, or history
                      </li>
                      <li>Changes appear on the country page immediately</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>Select a country to edit its description</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CountryAboutAdmin;
