"use client";
import { motion } from 'framer-motion';
import React from 'react';

const floatIn = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: 'easeOut' } },
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
        <div className="pointer-events-none absolute left-4 top-4 text-slate-400 opacity-80">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 15.5A4.5 4.5 0 0015.5 11H15a6 6 0 10-6 6h6.5c1.65 0 3-1.35 3-3z" fill="#94A3B8" />
          </svg>
        </div>
        <div className="pointer-events-none absolute right-4 top-4 text-slate-400 opacity-80">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M2.5 19.5L21 12 2.5 4.5 2.5 10l12.5 2-12.5 2z" fill="#94A3B8" />
          </svg>
        </div>
        <div className="pointer-events-none absolute left-4 bottom-4 text-slate-400 opacity-80">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2L15 8l6 1-4.5 4 1 6L12 17l-6.5 3 1-6L2 9l6-1 3-6z" fill="#94A3B8" />
          </svg>
        </div>
        <div className="pointer-events-none absolute right-4 bottom-4 text-slate-400 opacity-80">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2v4M12 18v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M2 12h4M18 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="#94A3B8" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Central layout: text left, globe right */}
        <div className="absolute inset-0 flex items-center justify-between px-8">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-slate-900">
              Discover the world
            </h1>
            <p className="mt-4 text-lg text-slate-700">
              Explore facts, quizzes and stories from every country. Learn something new every day.
            </p>

            {/* Scroll hint */}
            <motion.div
              className="mt-8 inline-flex items-center gap-3 text-sm text-slate-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.span
                className="flex items-center gap-2"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span>Scroll to explore</span>
                <span aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#94A3B8" />
                    <path d="M2 12h20M12 2c3 4 3 8 0 12c-3-4-3-8 0-12z" stroke="#ffffff" strokeWidth="0.6" opacity="0.8" />
                  </svg>
                </span>
              </motion.span>

              <motion.span
                className="ml-1 text-2xl"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                ↧
              </motion.span>
            </motion.div>
          </div>

          {/* Globe and floating icons */}
          <div className="relative w-[240px] h-[240px] flex items-center justify-center">
            {/* Globe - slightly reduced and no shadow */}
            <motion.div
              className="w-[180px] h-[180px] rounded-full bg-gradient-to-br from-[#8B5CF6] via-[#FB923C] to-[#FDE68A] flex items-center justify-center text-white"
              {...floatIn}
            >
              {/* Simple globe illustration (SVG) */}
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

            {/* Floating travel-themed icons around the globe */}
            <motion.div className="absolute" style={{ left: -28, top: -18 }} {...gentleFloat(0.2)}>
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-orange-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="#FB923C" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ right: -18, top: -28 }} {...gentleFloat(0.6)}>
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-pink-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2C8 2 5 5 5 9c0 6 7 13 7 13s7-7 7-13c0-4-3-7-7-7z" fill="#EC4899" />
                  <circle cx="12" cy="9" r="2" fill="#fff" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ right: -36, bottom: 8 }} {...gentleFloat(1)}>
              <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-yellow-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 2l1.9 4.9L19 9l-4.5 1.9L12 16l-2.5-5.1L5 9l5.1-2.1L12 2z" fill="#FACC15" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ left: -10, bottom: -24 }} {...gentleFloat(0.4)}>
              <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-sky-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" fill="#60A5FA" />
                  <path d="M2 12h20M12 2c3 4 3 8 0 12c-3-4-3-8 0-12z" stroke="#fff" strokeWidth="0.6" opacity="0.9" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ left: 40, top: -36 }} {...gentleFloat(0.9)}>
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M20 18a4 4 0 00-4-4H8a4 4 0 00-.94 7.86A5 5 0 1020 18z" fill="#94A3B8" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ left: 78, bottom: -18 }} {...gentleFloat(1.3)}>
              <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-amber-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="1.2" />
                  <path d="M8.5 15.5l6-3.5 3-6-6 3.5-3 6z" fill="#FBBF24" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ right: 46, bottom: -36 }} {...gentleFloat(1.6)}>
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-yellow-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 4v2M12 18v2M4 12h2M18 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" fill="#FDE68A" />
                </svg>
              </div>
            </motion.div>

            <motion.div className="absolute" style={{ left: 92, top: 18 }} {...gentleFloat(1.9)}>
              <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-indigo-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" fill="#6366F1" />
                </svg>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
