import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import logger from "@/lib/logger";

interface CountryCardProps {
  name: string;
  slug: string;
  flag?: string;
}

const CountryCard = ({ name, slug, flag }: CountryCardProps) => {
  const navigate = useNavigate();

  const handleClick = async () => {
    // Track click immediately (don't wait for completion)
    recordCountryClick(name);
    // Navigate to country page
    navigate(`/country/${slug}`);
  };

  return (
    <Card
      onClick={handleClick}
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardContent className="p-6 flex items-center justify-center">
        <div className="text-center">
          {flag && <div className="text-5xl mb-3">{flag}</div>}
          <h3 className="font-bold text-lg text-foreground">{name}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

// Record country click to trending function (fire-and-forget)
async function recordCountryClick(country: string) {
  try {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-country-view`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    });
  } catch (e) {
    logger.debug("[CountryCard] click tracking failed", e);
  }
}

export default CountryCard;
