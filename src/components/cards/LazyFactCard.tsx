import React, { Suspense } from 'react';

// Lazy wrapper that centralizes how FactCard is loaded and rendered.
// This prevents per-file lazy definitions (and accidental undefined wrappers)
// and keeps Suspense handling in one place.
const FactCard = React.lazy(() => import('@/components/cards/FactCard'));

type Props = {
  fact: any;
  className?: string;
};

export default function LazyFactCard({ fact, className }: Props) {
  return (
    <Suspense fallback={<div />}>
      <FactCard fact={fact} className={className} />
    </Suspense>
  );
}
