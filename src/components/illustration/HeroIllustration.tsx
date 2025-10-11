"use client";
import { motion } from 'framer-motion';
import React from 'react';

const floatIn = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: 'easeOut' } },
};

const badgesContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const badge = {
  hidden: { opacity: 0, y: 6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

const gentleFloat = (delay = 0) => ({
  animate: { y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay } } as any,
});

export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <motion.div
      className={(className ?? 'relative flex justify-center items-center') + ' w-full max-w-4xl'}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background panel with purple->orange pastel gradient */}
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden bg-gradient-to-br from-[#E9D5FF] via-[#FDE68A] to-[#FFEDE0]">
        {/* Corner decorative icons (SVG) */}
        <div aria-hidden className="pointer-events-none absolute top-6 left-6 md:top-6 md:left-6 opacity-90">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 15.5A4.5 4.5 0 0015.5 11H15a6 6 0 10-6 6h6.5c1.65 0 3-1.35 3-3z" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div aria-hidden className="pointer-events-none absolute top-6 right-6 md:top-6 md:right-6 opacity-90">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M2 12l19-7v14L2 12z" stroke="#FB923C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div aria-hidden className="pointer-events-none absolute bottom-6 left-6 md:bottom-6 md:left-6 opacity-90">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2l3 6 6 1-4.5 4 1 6L12 17 6.5 20l1-6L3 10l6-1 3-6z" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div aria-hidden className="pointer-events-none absolute bottom-6 right-6 md:bottom-6 md:right-6 opacity-90">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="8" stroke="#FB923C" strokeWidth="1.2" />
            <path d="M12 7v2M12 15v2M7 12h2M15 12h2" stroke="#FB923C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Central layout: text left, globe right */}
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div className="max-w-lg">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-slate-900">
              <span className="block">Discover the world</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#FB923C] text-2xl md:text-3xl font-semibold">in beautiful detail</span>
            </h1>
            <p className="mt-4 text-sm md:text-base text-slate-700 max-w-md">
              Bite-sized facts, playful quizzes, and short stories — curated to spark curiosity and make learning about countries delightful.
            </p>

            <motion.div className="mt-5 flex items-center gap-3" variants={badgesContainer} initial="hidden" animate="visible">
              <motion.span className="inline-flex items-center gap-2 bg-white/70 text-slate-900 text-sm md:text-sm px-3 py-1.5 rounded-full shadow-sm font-medium" variants={badge}>
                Facts
              </motion.span>

              <motion.span className="inline-flex items-center gap-2 bg-white/70 text-slate-900 text-sm md:text-sm px-3 py-1.5 rounded-full shadow-sm font-medium" variants={badge}>
                Quizzes
              </motion.span>

              <motion.span className="inline-flex items-center gap-2 bg-white/70 text-slate-900 text-sm md:text-sm px-3 py-1.5 rounded-full shadow-sm font-medium" variants={badge}>
                Stories
              </motion.span>
            </motion.div>
          </div>

          {/* Globe and floating icons (icons hidden on small screens) */}
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            <motion.div className="w-[180px] h-[180px] rounded-full bg-gradient-to-br from-[#8B5CF6] via-[#FB923C] to-[#FDE68A] flex items-center justify-center text-white" {...floatIn}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <circle cx="60" cy="60" r="56" fill="url(#gl)" />
                <defs>
                  <radialGradient id="gl" cx="0" cy="0">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" />
                    <stop offset="1" stopColor="#000000" stopOpacity="0.04" />
                  </radialGradient>
                </defs>
                <path d="M12 60c20-18 56-18 96 0" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M60 6c6 18 6 36 0 54" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </motion.div>

            <div className="hidden md:block">
              <motion.div className="absolute" style={{ left: -28, top: -18 }} {...gentleFloat(0.2)}>
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" stroke="#FB923C" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ right: -18, top: -28 }} {...gentleFloat(0.6)}>
                <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2C8 2 5 5 5 9c0 6 7 13 7 13s7-7 7-13c0-4-3-7-7-7z" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="9" r="2" fill="#A78BFA" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ right: -36, bottom: 8 }} {...gentleFloat(1)}>
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2l1.9 4.9L19 9l-4.5 1.9L12 16l-2.5-5.1L5 9l5.1-2.1L12 2z" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ left: -10, bottom: -24 }} {...gentleFloat(0.4)}>
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="#60A5FA" strokeWidth="1.2" />
                    <path d="M2 12h20M12 2c3 4 3 8 0 12" stroke="#60A5FA" strokeWidth="0.9" strokeLinecap="round" opacity="0.9" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ left: 40, top: -36 }} {...gentleFloat(0.9)}>
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M20 18a4 4 0 00-4-4H8a4 4 0 00-.94 7.86A5 5 0 1020 18z" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ left: 78, bottom: -18 }} {...gentleFloat(1.3)}>
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="8" stroke="#FB923C" strokeWidth="1.2" />
                    <path d="M8.5 15.5l6-3.5 3-6-6 3.5-3 6z" stroke="#FB923C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ right: 46, bottom: -36 }} {...gentleFloat(1.6)}>
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="#FBBF24" strokeWidth="0.9" fill="none" />
                  </svg>
                </div>
              </motion.div>

              <motion.div className="absolute" style={{ left: 92, top: 18 }} {...gentleFloat(1.9)}>
                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M21 12.8A9 9 0 1111.2 3" stroke="#A78BFA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
