import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Users, DollarSign, Languages, Flag, Loader2, Globe } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryCard from "@/components/cards/CategoryCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchFactsByCategory } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import CountryHeader from '@/components/country/CountryHeader';
import CountryStats from '@/components/country/CountryStats';
import CategoryTabs from '@/components/country/CategoryTabs';
import NewsSection from '@/components/country/NewsSection';
import QuizButton from '@/components/country/QuizButton';

const Country = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [countryData, setCountryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCountryData();
  }, [slug]);

  const fetchCountryData = async () => {
    if (!slug) return;
    
    setIsLoading(true);
    try {
      const countryName = slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');

      const { data, error } = await supabase.functions.invoke('fetch-country-data', {
        body: { countryName }
      });

      if (error) throw error;

      const country = data.data[0];
      
      const currencies = country.currencies || {};
      const currencyValues = Object.values(currencies) as Array<{name?: string; symbol?: string}>;
      const firstCurrency = currencyValues[0] || {};
      
      setCountryData({
        name: country.name.common,
        flag: country.flag,
        flagImage: country.flags.svg,
        capital: country.capital?.[0] || 'N/A',
        population: country.population.toLocaleString(),
        currency: firstCurrency.name || 'N/A',
        currencySymbol: firstCurrency.symbol || '',
        languages: Object.values(country.languages || {}).join(', ') || 'N/A',
        area: `${country.area.toLocaleString()} km²`,
        region: country.region,
        subregion: country.subregion,
        timezones: country.timezones[0],
      });
    } catch (error) {
      console.error('Error fetching country:', error);
      toast({
        title: "Error",
        description: "Failed to load country data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { title: "Geography", icon: MapPin },
    { title: "History", icon: Flag },
    { title: "Culture", icon: Users },
    { title: "Current Events", icon: DollarSign },
  ];

  const [factsOpen, setFactsOpen] = useState(false);
  const [factsList, setFactsList] = useState<any[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);

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
            <Button onClick={() => navigate('/')} className="mt-4">
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
            <CountryHeader name={countryData.name} onBack={() => navigate(-1)} />
            <CountryStats
              flag={countryData.flagImage}
              capital={countryData.capital}
              population={countryData.population}
              currency={countryData.currency}
              languages={countryData.languages}
            />

            <CategoryTabs country={countryData.name} />

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
            <DialogDescription>Facts about the selected category</DialogDescription>
          </DialogHeader>
          {factsLoading ? (
            <div className="p-6">Loading...</div>
          ) : (
            <div className="space-y-4 p-4">
              {factsList.map((f, i) => (
                <Card key={i} className="p-4">
                  <h3 className="font-semibold">{f.title || f}</h3>
                  <p className="text-muted-foreground">{f.description || f.fact || ''}</p>
                </Card>
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
