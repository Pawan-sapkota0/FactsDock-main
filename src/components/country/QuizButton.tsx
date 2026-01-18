import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// For debugging dynamic import failures, use synchronous import temporarily
import QuizModal from "@/components/QuizModal";

export default function QuizButton({ country }: { country?: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  return (
    <>
      <Button
        variant="hero"
        onClick={() => setOpen(true)}
      >{`Play Quiz about ${country || "this country"}`}</Button>
      <React.Suspense fallback={<div />}>
        <QuizModal
          open={open}
          onOpenChange={setOpen}
          topic={country}
          sourceType="country"
        />
      </React.Suspense>
    </>
  );
}
