"use client";
import React from 'react';
import { Search, Sparkles, Cloud, Globe2, Sun, Moon, MapPin, Brain } from 'lucide-react';

const gentleFloatDelay = (delay = 0) => ({ animation: `floatSlow 6s ease-in-out ${delay}s infinite` });

export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={(className ?? 'relative flex justify-center items-center') + ' w-full max-w-4xl'}>
      {/* Background panel with purple->orange pastel gradient */}
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#F1E5FF] via-[#FFF2B3] to-[#FFF4EA]">
        {/* decorative icons removed to keep globe area clean */}

        {/* Central layout: text left, globe right */}
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div className="max-w-lg relative">
            {/* Icon above the 'Discover' line (visible on md+) */}
            <div className="hidden md:block absolute" style={{ left: '-10px', top: '-30px' }}>
              <Brain className="h-6 w-6 text-accent/40" style={{ animation: 'floatSlow 10s ease-in-out infinite' }} />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#FB923C] to-[#8B5CF6] text-slate-900">Discover</span>
              <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-[#FB923C] to-[#8B5CF6]">the world</span>
            </h1>
            {/* Icon below the 'the world' line (visible on md+) */}
            <div className="hidden md:block absolute" style={{ left: '-10px', bottom: '-45px' }}>
              <MapPin className="h-6 w-6 text-primary/40" style={{ animation: 'floatSlow 11s ease-in-out infinite' }} />
            </div>
            <p className="mt-4 text-sm md:text-base text-slate-600 max-w-md leading-relaxed tracking-wide drop-shadow-sm">
  "Explore fascinating facts and quizzes from every corner of the globe. Turn curiosity into adventure with world quizzes that make learning fun."
</p>


            {/* Badges removed to keep the globe section minimal and balanced */}
          </div>

          {/* Globe and floating icons (icons hidden on small screens) */}
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            <div className="w-[180px] h-[180px] rounded-full bg-gradient-to-br from-[#8B5CF6] via-[#FB923C] to-[#FDE68A] flex items-center justify-center text-white">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="60" cy="60" r="56" fill="url(#gl)" />
                <defs>
                  <radialGradient id="gl" cx="0" cy="0">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" />
                    <stop offset="1" stopColor="#000000" stopOpacity="0.04" />
                  </radialGradient>
                </defs>
                {/* decorative globe lines removed for a cleaner globe */}
              </svg>
              
              {/* rotating wireframe removed */}
            </div>

            {/* floating decorative icons removed */}

            {/* Icons anchored to the globe area (visible on md+) */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
              <Search className="absolute h-6 w-6 text-primary/40" style={{ right: 300, top: -25, animation: 'floatSlow 8s ease-in-out infinite' }} />
              <Globe2 className="absolute h-7 w-7 text-secondary/40" style={{ right: 28, bottom: -45, animation: 'floatSlow 10s ease-in-out infinite' }} />
              <Sun className="absolute h-6 w-6 text-primary/40" style={{ right: 44, top: -15, animation: 'floatSlow 13s ease-in-out infinite' }} />
              <Moon className="absolute h-6 w-6 text-secondary/40" style={{ right: 280, bottom: -45, animation: 'floatSlow 14s ease-in-out infinite' }} />
            </div>

            {/* right-side globe icons removed (page-level stack will handle page-right icons) */}
          </div>
        </div>
        
        {/* corner balance icons removed */}

  {/* Right-side stacked icons (balance the left) */}
  {/* right-side stacked icons removed */}

        {/* Scroll hint is handled at the page level (Index.tsx) to avoid duplication */}
      </div>
    </div>
  );
}
