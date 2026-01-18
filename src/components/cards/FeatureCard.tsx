import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  iconColor?: string;
}

const FeatureCard = ({
  title,
  description,
  icon: Icon,
  link,
  iconColor = "text-primary",
}: FeatureCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(link)}
      className="relative cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary h-full"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-xl">
            <Icon className={`h-10 w-10 ${iconColor}`} />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
