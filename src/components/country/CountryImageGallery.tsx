/**
 * CountryImageGallery - Carousel-style image gallery for country details
 * Features: Single image display, arrow navigation, responsive, lazy loading, theme support
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import logger from "@/lib/logger";
import { useGalleryImageProtection } from "@/hooks/use-image-protection";

export interface GalleryImage {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  location?: string;
}

interface CountryImageGalleryProps {
  images: GalleryImage[];
  country: string;
  isLoading?: boolean;
}

const CountryImageGallery: React.FC<CountryImageGalleryProps> = ({
  images,
  country,
  isLoading = false,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetAutoScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const galleryContainerRef = useGalleryImageProtection({ enabled: true });

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrolling || images.length === 0) {
      return;
    }

    autoScrollIntervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, images.length]);

  // Handle previous image
  const handlePrevious = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

    // Resume auto-scroll after 8 seconds of inactivity
    if (resetAutoScrollTimeout.current) {
      clearTimeout(resetAutoScrollTimeout.current);
    }
    resetAutoScrollTimeout.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 8000);
  }, [images.length]);

  // Handle next image
  const handleNext = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);

    // Resume auto-scroll after 8 seconds of inactivity
    if (resetAutoScrollTimeout.current) {
      clearTimeout(resetAutoScrollTimeout.current);
    }
    resetAutoScrollTimeout.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 8000);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevious, handleNext]);

  // Touch gesture support
  const touchStartXRef = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      // Minimum swipe distance
      if (diff > 0) {
        // Swiped left - show next
        handleNext();
      } else {
        // Swiped right - show previous
        handlePrevious();
      }
    }
  };

  // Don't render if no images and not loading
  if (!isLoading && images.length === 0) {
    return null;
  }

  const currentImage = images[currentImageIndex];

  return (
    <Card className="w-full bg-card border-border/50 overflow-hidden">
      <div className="p-4 md:p-6">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
          Images of {country}
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center h-96 md:h-[500px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>Loading gallery images...</span>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-96 md:h-[500px]">
            <p className="text-muted-foreground">
              No images available for {country}
            </p>
          </div>
        ) : (
          <div
            ref={galleryContainerRef}
            className="relative group rounded-lg overflow-hidden bg-black/5 dark:bg-black/20"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
          >
            {/* Main image display */}
            <div className="relative w-full h-96 md:h-[500px] flex items-center justify-center overflow-hidden rounded-lg">
              <img
                key={currentImage.url}
                src={currentImage.url}
                alt={currentImage.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />

              {/* Location/Label at top left */}
              {(currentImage.location || currentImage.alt) && (
                <div className="absolute top-4 left-4 bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="line-clamp-2 text-xs md:text-sm">
                      {currentImage.location || currentImage.alt}
                    </span>
                  </div>
                </div>
              )}

              {/* Photographer credit at bottom right (always visible) */}
              {currentImage.photographer &&
                currentImage.photographer !== "Unknown" && (
                  <div className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white px-3 py-2 rounded-lg text-xs transition-colors">
                    Photo by{" "}
                    <a
                      href={`${currentImage.photographerUrl}?utm_source=factsdock&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold"
                    >
                      {currentImage.photographer}
                    </a>
                  </div>
                )}
            </div>

            {/* Left arrow button */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-black dark:text-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
              title="Previous image (or use ← arrow key)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right arrow button */}
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-black dark:text-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
              aria-label="Next image"
              title="Next image (or use → arrow key)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Dot indicators */}
        {images.length > 0 && !isLoading && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentImageIndex(index);
                  setIsAutoScrolling(false);
                  if (resetAutoScrollTimeout.current) {
                    clearTimeout(resetAutoScrollTimeout.current);
                  }
                  resetAutoScrollTimeout.current = setTimeout(() => {
                    setIsAutoScrolling(true);
                  }, 8000);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? "bg-primary w-8"
                    : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Attribution text */}
        <div className="text-xs text-muted-foreground mt-3 text-center">
          Images from Unsplash
        </div>
      </div>
    </Card>
  );
};

export default CountryImageGallery;
