import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface DidYouKnowCardProps {
  onClick: () => void;
}

const DidYouKnowCard = ({ onClick }: DidYouKnowCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 h-48 md:h-56 flex items-center justify-center"
    >
      {/* Background accent */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 dark:bg-white/5" />

      {/* Content */}
      <div className="relative z-10 text-center px-6">
        <div className="flex justify-center mb-3">
          <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Did You Know?
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Click to discover fascinating facts
        </p>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-4 right-4 text-2xl opacity-50 group-hover:opacity-100 transition-opacity">
        ✨
      </div>
    </Card>
  );
};

export default DidYouKnowCard;
