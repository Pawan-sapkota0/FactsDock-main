import { useSiteImages } from "@/hooks/use-site-images";

interface HeroBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export function HeroBackground({
  children,
  className = "",
}: HeroBackgroundProps) {
  const { heroBackground } = useSiteImages();

  // Default image from public folder
  const defaultImage = "/hero-bg.jpg";
  const backgroundUrl = heroBackground || defaultImage;

  const backgroundStyle = {
    backgroundImage: `url('${backgroundUrl}')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };

  return (
    <div style={backgroundStyle} className={`relative ${className}`}>
      {/* Overlay for better text readability */}
      {heroBackground && (
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
