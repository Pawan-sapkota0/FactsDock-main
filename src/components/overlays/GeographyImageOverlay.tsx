/**
 * GeographyImageOverlay - Image gallery overlay for geography highlight cards
 * Features: Grid display with left/right navigation, auto-scroll, responsive, dismissible
 * Minimal UI: Shows only location icon + card heading, no attribution text
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import logger from "@/lib/logger";
import { useGalleryImageProtection } from "@/hooks/use-image-protection";

export interface GalleryImage {
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  width?: number;
  height?: number;
  location?: string;
}

interface GeographyImageOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  title: string;
  isLoading?: boolean;
}

const GeographyImageOverlay: React.FC<GeographyImageOverlayProps> = ({
  isOpen,
  onClose,
  images,
  title,
  isLoading = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const resetAutoScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const overlayRef = useGalleryImageProtection({ enabled: true });

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoScrolling || images.length === 0 || !isOpen) {
      return;
    }

    autoScrollIntervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Auto-advance every 4 seconds

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling, images.length, isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      if (resetAutoScrollTimeout.current) {
        clearTimeout(resetAutoScrollTimeout.current);
      }
    };
  }, []);

  // Handle previous image
  const handlePrevious = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

    if (resetAutoScrollTimeout.current) {
      clearTimeout(resetAutoScrollTimeout.current);
    }
    resetAutoScrollTimeout.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 6000);
  }, [images.length]);

  // Handle next image
  const handleNext = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);

    if (resetAutoScrollTimeout.current) {
      clearTimeout(resetAutoScrollTimeout.current);
    }
    resetAutoScrollTimeout.current = setTimeout(() => {
      setIsAutoScrolling(true);
    }, 6000);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrevious, handleNext, onClose]);

  // Touch gesture support
  const touchStartXRef = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  };

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div
        ref={overlayRef}
        className="w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border/50 bg-background">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close gallery"
            title="Close (or press Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image gallery content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">Loading images...</span>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">No images available</p>
            </div>
          ) : (
            <div
              className="relative flex-1 group bg-black/5 dark:bg-black/20"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseEnter={() => setIsAutoScrolling(false)}
              onMouseLeave={() => setIsAutoScrolling(true)}
            >
              {/* Main image display */}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt={currentImage.alt}
                  loading="lazy"
                  className="w-full h-full object-cover animate-in fade-in duration-300"
                />
              </div>

              {/* Left arrow button */}
              <button
                onClick={handlePrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-black dark:text-white rounded-full p-2 md:p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
                title="Previous image (or use ← arrow key)"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              {/* Right arrow button */}
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-black/60 hover:bg-white dark:hover:bg-black text-black dark:text-white rounded-full p-2 md:p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Next image"
                title="Next image (or use → arrow key)"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              {/* Image counter at bottom */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>

        {/* Dot indicators and footer */}
        {images.length > 0 && !isLoading && (
          <div className="px-4 md:px-6 py-4 border-t border-border/50 bg-background">
            <div className="flex items-center justify-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsAutoScrolling(false);
                    if (resetAutoScrollTimeout.current) {
                      clearTimeout(resetAutoScrollTimeout.current);
                    }
                    resetAutoScrollTimeout.current = setTimeout(() => {
                      setIsAutoScrolling(true);
                    }, 6000);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "bg-primary w-6 md:w-8"
                      : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeographyImageOverlay;
