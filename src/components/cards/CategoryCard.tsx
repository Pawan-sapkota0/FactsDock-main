import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  onClick?: () => void;
}

const CategoryCard = ({ title, icon: Icon, onClick }: CategoryCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-bold text-lg text-center text-foreground">
          {title}
        </h3>
      </CardContent>
    </Card>
  );
};

export default CategoryCard;
