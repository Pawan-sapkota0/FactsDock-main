import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "./ui/card";

interface CountryCardProps {
  name: string;
  slug: string;
  flag?: string;
}

const CountryCard = ({ name, slug, flag }: CountryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      onClick={() => navigate(`/country/${slug}`)}
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
      style={{ boxShadow: 'var(--shadow-card)' }}
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

export default CountryCard;
