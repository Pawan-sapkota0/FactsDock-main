"use client";
import React from "react";
import {
  Search,
  Sparkles,
  Cloud,
  Globe2,
  Sun,
  Moon,
  MapPin,
  Brain,
  Lightbulb,
} from "lucide-react";

const gentleFloatDelay = (delay = 0) => ({
  animation: `floatSlow 6s ease-in-out ${delay}s infinite`,
});

export default function HeroIllustration({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={
        (className ?? "relative flex justify-center items-center") +
        " w-full max-w-4xl"
      }
    >
      {/* Background panel with purple->orange pastel gradient */}
      <div className="relative w-full h-auto md:h-[420px] rounded-2xl overflow-visible md:overflow-hidden bg-gradient-to-br from-[#F1E5FF] via-[#FFF2B3] to-[#FFF4EA]">
        {/* decorative icons removed to keep globe area clean */}

        {/* Central layout: text left, globe right */}
        <div className="md:absolute md:inset-0 flex flex-col md:flex-row items-start md:items-center justify-between px-6 md:px-8 py-6 md:py-0">
          <div className="max-w-lg relative">
            {/* Icon above the 'Discover' line (visible on md+) */}
            <div
              className="hidden md:block absolute"
              style={{ left: "-10px", top: "-30px" }}
            >
              <Brain
                className="h-7 w-7 text-accent/40"
                style={{ animation: "floatSlow 10s ease-in-out infinite" }}
              />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-[#FB923C] to-[#8B5CF6] text-slate-900">
                Discover the world
              </span>
              {/* <span className="block mt-1 bg-clip-text text-transparent bg-gradient-to-r from-[#FB923C] to-[#8B5CF6]">
                the world
              </span> */}
            </h1>
            {/* Icon below the 'the world' line (visible on md+) */}
            <div
              className="hidden md:block absolute"
              style={{ left: "-20px", bottom: "-50px" }}
            >
              <MapPin
                className="h-7 w-7 text-primary/40"
                style={{ animation: "floatSlow 11s ease-in-out infinite" }}
              />
            </div>
            <p className="mt-4 text-base md:text-lg text-gray-600 max-w-lg leading-relaxed tracking-wide font-medium  drop-shadow-md">
              Explore fascinating facts and quizzes from every corner of the
              globe. Turn curiosity into adventure with world quizzes that make
              learning fun.
            </p>

            {/* Badges removed to keep the globe section minimal and balanced */}
          </div>

          {/* Globe and floating icons (icons hidden on small screens) */}
          <div className="relative w-full md:w-[260px] h-auto md:h-[260px] flex items-center justify-center mt-4 md:mt-0">
            {/* Globe removed from hero section (static SVG/wireframe removed). */}
            <div
              className="w-[180px] h-[180px] rounded-full flex items-center justify-center text-white relative"
              aria-hidden
            >
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-hidden
              >
                <defs>
                  <path id="curve-top" d="M 40 115 A 60 60 0 0 1 160 110" />
                  <path
                    id="curve-bottom"
                    d=" M 40 105
  A 60 60 0 0 0 160 105"
                  />
                  
                  <style>{`
                    .dyk-text { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; font-weight: 700; font-size: 13px; letter-spacing: 0.6px; }
                    .dyk-circle { transition: filter .3s ease; }
                    .dyk-circle.glow { animation: glow 2.4s ease-in-out infinite; }
                    @keyframes glow {
    0%, 100% {
      filter: drop-shadow(0 0 0 rgba(0,0,0,0.0));
    }
    50% {
      filter: drop-shadow(0 6px 22px rgba(0,0,0,0.25)); /* Soft grey glow */
    }
  }
 `}</style>
                </defs> 
                {/* Bold glowing circular badge */}
                {/* <circle
                  cx="100"
                  cy="100"
                  r="68"
                  stroke="#48484A"
                  strokeWidth="4"
                  fill="none"
                  className="dyk-circle glow"
                /> */}
                {/* LEFT half-circle */}


                {/* Top text (DID YOU) */}
                <text
                  x="100"
                  y="20"
                  textAnchor="middle"
                  fill="#48484A"
                  className="dyk-text glow text-secondary/80"
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: "inherit",
                    letterSpacing: "2px"
                  }}
                >
                  <textPath
                    href="#curve-top"
                    startOffset="-1%"
                    textAnchor="middle"
                  >
                    DID YOU
                  </textPath>
                </text>

               

                {/* Bottom text (KNOW?) */}
                <text
                  x="105"
                  y="180"
                  textAnchor="middle"
                  fill="#48484A"
                  className="dyk-text glow text-secondary/80"
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: "inherit",
                    letterSpacing: "4px",
                  }}
                >
                  <textPath
                    href="#curve-bottom"
                    startOffset="-2%"
                    textAnchor="middle"
                  >
                    KNOW?
                  </textPath>
                </text>
              </svg>

              {/* Centered animated lightbulb — keeps same alignment/spacing as other icons */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* decorative rays above the bulb */}
                <svg
                  width="85"
                  height="85"
                  viewBox="0 0 85 85"
                  className="absolute -translate-y-2"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    className="text-yellow-400 opacity-80"
                    style={{
                      transformOrigin: "center",
                      // animation: "shine 3.1s ease-in-out infinite"
                    }}
                  >
                    <path d="M43 8 L43 18" />
                    <path d="M55 12 L50 20" />
                    <path d="M65 19 L59 26" />
                    <path d="M73 27 L65 33" />
                    <path d="M14 28 L22 33" />
                    <path d="M21 18 L28 25" />
                    <path d="M31 12 L36 20" />
                  </g>
                  <style>{`@keyframes shine { 0%,100% { opacity: .6; transform: translateY(0);} 50% { opacity: 1; transform: translateY(-3px);} }`}</style>
                </svg>

                <Lightbulb
                  className="h-14 w-14 text-yellow-400"
                  style={{
                    filter: "drop-shadow(0 10px 28px rgba(255,200,60,0.22))",
                  }}
                />
              </div>
            </div>

            {/* floating decorative icons removed */}

            {/* Icons anchored to the globe area (visible on md+) */}
            <div className="absolute inset-0 pointer-events-none ">
              {/* <Search
                className="absolute h-6 w-6 text-primary/40"
                style={{
                  right: 300,
                  top: -25,
                  animation: "floatSlow 8s ease-in-out infinite",
                }}
              /> */}
              <Globe2
                className="hidden md:block absolute h-7 w-7 text-secondary/40"
                style={{
                  right: 28,
                  bottom: -45,
                  animation: "floatSlow 10s ease-in-out infinite",
                }}
              />
              <Sun
                className="hidden md:block absolute h-7 w-7 text-primary/40"
                style={{
                  right: -11,
                  top: -55,
                  animation: "floatSlow 13s ease-in-out infinite",
                }}
              />
              {/* <Moon
                className="absolute h-6 w-6 text-secondary/40"
                style={{
                  right: 280,
                  bottom: -45,
                  animation: "floatSlow 14s ease-in-out infinite",
                }}
              /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
