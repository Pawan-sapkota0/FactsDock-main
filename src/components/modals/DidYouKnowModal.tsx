import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface DidYouKnowQuestion {
  id: string;
  question: string;
  answer: string;
}

interface DidYouKnowModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestion: DidYouKnowQuestion;
  onNext?: () => void;
}

const DidYouKnowModal = ({
  isOpen,
  onClose,
  currentQuestion,
  onNext,
}: DidYouKnowModalProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex items-center justify-center min-h-screen bg-black/50 border-0 p-4">
        {/* Accessible title and description (visually hidden) */}
        <DialogTitle className="sr-only">Did You Know Fact</DialogTitle>
        <DialogDescription className="sr-only">
          Interactive flip card showing an interesting world fact. Click to
          reveal the answer.
        </DialogDescription>
        <div className="w-full max-w-md">
          {/* Flip Card Container */}
          <div
            className="h-96 cursor-pointer rounded-xl overflow-visible shadow-2xl transition-transform duration-500 transform-gpu"
            onClick={() => setIsFlipped(!isFlipped)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsFlipped(!isFlipped);
              }
            }}
            style={{
              perspective: "1000px",
            }}
          >
            {/* Inner Flip Container */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: "transform 0.5s ease-in-out",
              }}
            >
              {/* Front - Question */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 p-8 flex flex-col items-center justify-center text-white rounded-xl"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <p className="text-sm font-semibold text-white/80 mb-4">
                  Did You Know?
                </p>
                <p className="text-2xl md:text-3xl font-bold text-center leading-snug">
                  {currentQuestion.question}
                </p>
                <p className="text-sm mt-8 text-white/70">Click to reveal</p>
              </div>

              {/* Back - Answer */}
              <div
                className="absolute inset-0 bg-white dark:bg-slate-900 p-8 flex flex-col items-center justify-center rounded-xl"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-lg md:text-xl text-foreground text-center leading-relaxed font-medium mb-6">
                  {currentQuestion.answer}
                </p>
                <p className="text-sm text-muted-foreground">
                  ← Click to flip back
                </p>
              </div>
            </div>
          </div>

          {/* Play Next Button */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => {
                setIsFlipped(false);
                onNext?.();
              }}
              className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Play Next →
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 border border-primary/30 text-primary font-semibold rounded-lg hover:border-primary/60 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DidYouKnowModal;
