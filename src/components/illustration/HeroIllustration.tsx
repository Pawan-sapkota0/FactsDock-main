"use client";
import { motion } from 'framer-motion';
import React from 'react';

const floatAnim = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.2, ease: 'easeOut' } },
  float: { y: [0, -8, 0], transition: { y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } } },
};

export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <motion.div
      className={className ?? 'flex justify-center items-center'}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Simplified illustrative SVG inspired by exploring/quiz themes */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
          <rect width="800" height="600" rx="24" fill="url(#g)" />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#EDE9FE" />
              <stop offset="1" stopColor="#FEF3E8" />
            </linearGradient>
          </defs>

          {/* Person with laptop */}
          <g transform="translate(140 110)">
            <rect x="180" y="220" width="280" height="160" rx="12" fill="#fff" opacity="0.9" />
            <rect x="210" y="160" width="220" height="90" rx="10" fill="#7C83FF" opacity="0.12" />

            <g>
              <circle cx="320" cy="120" r="34" fill="#FDE68A" />
              <rect x="288" y="150" width="64" height="46" rx="8" fill="#F3F4F6" />
              <rect x="300" y="168" width="40" height="6" rx="3" fill="#E5E7EB" />
            </g>

            <g transform="translate(60 220)">
              <rect x="0" y="0" width="180" height="110" rx="8" fill="#fff" stroke="#EDE9FE" />
              <rect x="12" y="16" width="156" height="54" rx="6" fill="#EFF6FF" />
              <circle cx="36" cy="84" r="8" fill="#A78BFA" />
              <circle cx="72" cy="84" r="8" fill="#7C3AED" />
              <circle cx="108" cy="84" r="8" fill="#60A5FA" />
            </g>

            {/* Floating quiz icons */}
            <g>
              <circle cx="50" cy="40" r="20" fill="#FEE2E2" />
              <path d="M46 36h8v8" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            <g>
              <circle cx="500" cy="48" r="24" fill="#DBEAFE" />
              <path d="M492 48c6-8 16-8 24 0" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>

            <g>
              <rect x="420" y="220" width="120" height="80" rx="8" fill="#EFF6FF" />
              <path d="M434 256h92" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>

        </svg>
    </motion.div>
  );
}
