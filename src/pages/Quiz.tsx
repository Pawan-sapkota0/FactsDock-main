import React, { useState, useEffect, useRef } from "react";
import { Shuffle, MapPin, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SearchBar from "@/components/common/SearchBar";
import { useToast } from "@/hooks/use-toast";
import { generateQuizForTopic } from "@/lib/api";

const QuizModal = React.lazy(() => import("@/components/QuizModal"));

const Quiz = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizType, setQuizType] = useState<"country" | "random" | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoQuiz, setAutoQuiz] = useState<any[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // inline modal state
  const [openInline, setOpenInline] = useState(false);
  const [inlineTopic, setInlineTopic] = useState<string | undefined>(undefined);
  const [inlineCount, setInlineCount] = useState<number>(10);

  const questionOptions = [10, 20, 30, 40, 50];

  const countryRef = useRef<HTMLDivElement | null>(null);
  const countRef = useRef<HTMLDivElement | null>(null);

  const handleStartQuiz = async () => {
    if (quizType === "country" && !selectedCountry) {
      toast({
        title: "Selection Required",
        description: "Please select a country first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const topic = quizType === "country" ? selectedCountry : undefined;
      // open inline quiz modal instead of navigating
      setInlineTopic(topic || undefined);
      setInlineCount(questionCount);
      setOpenInline(true);
      toast({
        title: "Quiz Ready!",
        description: `Starting quiz ${topic ? `for ${topic}` : "random"}`,
      });
    } catch (error) {
      console.error("Error preparing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to prepare quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Try to auto-start quiz if currentQuiz exists or autoStart flag present
  useEffect(() => {
    // react to query changes so navigation to /quiz?autoStart=1 triggers auto-run
    const params = new URLSearchParams(window.location.search);
    const autoStart = params.get("autoStart");
    const stored = localStorage.getItem("currentQuiz");
    if ((autoStart === "1" || stored) && !autoQuiz) {
      try {
        let parsed = stored ? JSON.parse(stored) : null;
        // support shape { data: [...] } or raw array
        if (parsed && parsed.data && Array.isArray(parsed.data))
          parsed = parsed.data;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAutoQuiz(parsed.map((q: any) => ({ ...q })));
        }
      } catch (e) {
        console.error("Invalid stored quiz:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.location.search]);

  // Smooth scroll to appropriate section when quiz type is selected
  useEffect(() => {
    try {
      if (quizType === "country" && countryRef.current) {
        countryRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else if (quizType === "random" && countRef.current) {
        countRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (e) {}
  }, [quizType]);

  useEffect(() => {
    if (autoQuiz && autoQuiz.length > 0) {
      // reset runner state
      setCurrentIndex(0);
      setAnswers({});
      setShowResults(false);
    }
  }, [autoQuiz]);

  const handleAnswer = (choice: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: choice }));
    setSelectedChoice(choice);
    // auto-advance after a short delay to show feedback
    setTimeout(() => {
      setSelectedChoice(null);
      nextQuestion();
    }, 800);
  };

  const nextQuestion = () => {
    if (!autoQuiz) return;
    if (currentIndex < autoQuiz.length - 1) setCurrentIndex((i) => i + 1);
    else {
      // compute score
      let correct = 0;
      autoQuiz.forEach((q, idx) => {
        const ans = answers[idx];
        if (!ans && idx === currentIndex) return; // skip
        if (ans && q.answer && ans === q.answer) correct++;
      });
      setShowResults(true);
      setLastScore(correct);
      try {
        localStorage.setItem(
          "lastQuizScore",
          JSON.stringify({ total: autoQuiz.length, correct })
        );
      } catch (e) {}
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Back button removed per request */}

            <div className="text-center">
              <h1 className="text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  Quiz Setup
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Choose your quiz type and get started!
              </p>
            </div>

            {/* If autoQuiz is present, render the quiz runner; otherwise show the quiz type cards */}
            {autoQuiz ? (
              !showResults ? (
                <div className="space-y-6">
                  <Card className="p-6">
                    <CardHeader>
                      <CardTitle>
                        Question {currentIndex + 1} of {autoQuiz.length}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{autoQuiz[currentIndex].question}</p>
                      <div className="grid gap-3">
                        {(autoQuiz[currentIndex].options || []).map(
                          (opt: string, i: number) => {
                            const isSelected =
                              answers[currentIndex] === opt ||
                              selectedChoice === opt;
                            const isCorrect =
                              autoQuiz[currentIndex].answer === opt;
                            const variant = selectedChoice
                              ? isCorrect
                                ? "default"
                                : isSelected
                                ? "destructive"
                                : "outline"
                              : answers[currentIndex] === opt
                              ? "default"
                              : "outline";
                            return (
                              <Button
                                key={i}
                                variant={variant as any}
                                onClick={() => handleAnswer(opt)}
                                disabled={!!selectedChoice}
                              >
                                {opt}
                              </Button>
                            );
                          }
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevQuestion}
                      disabled={currentIndex === 0}
                    >
                      Previous
                    </Button>
                    <Button onClick={nextQuestion}>
                      {currentIndex < autoQuiz.length - 1 ? "Next" : "Finish"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Results</h2>
                  <p className="mb-4">
                    Score: {lastScore ?? 0} / {autoQuiz.length}
                  </p>
                  <div className="space-y-4">
                    {autoQuiz.map((q, idx) => (
                      <Card key={idx} className="p-4">
                        <div className="font-semibold mb-2">
                          Q{idx + 1}: {q.question}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Your answer: {answers[idx] ?? "—"}
                        </div>
                        <div className="text-sm text-primary">
                          Correct answer: {q.answer}
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => {
                        localStorage.removeItem("currentQuiz");
                        setAutoQuiz(null);
                        navigate("/");
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    quizType === "country" ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setQuizType("country")}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="bg-primary/10 p-4 rounded-2xl">
                        <MapPin className="h-10 w-10 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">
                      Country-wise Quiz
                    </CardTitle>
                    <CardDescription className="text-center">
                      Test your knowledge about a specific country
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    quizType === "random" ? "border-primary border-2" : ""
                  }`}
                  onClick={() => setQuizType("random")}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <div className="bg-secondary/10 p-4 rounded-2xl">
                        <Shuffle className="h-10 w-10 text-secondary" />
                      </div>
                    </div>
                    <CardTitle className="text-center">Random Quiz</CardTitle>
                    <CardDescription className="text-center">
                      Questions from multiple countries
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}

            {/* Country Selection (if country-wise) */}
            {quizType === "country" && (
              <div ref={countryRef} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Select a Country
                </h3>
                <SearchBar
                  placeholder="Search and select a country..."
                  onChange={(value) => setSelectedCountry(value)}
                  onSelect={(value) => setSelectedCountry(value)}
                />
              </div>
            )}

            {/* Question Count Selection */}
            {quizType && (
              <div ref={countRef} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Number of Questions
                </h3>
                <div className="flex flex-wrap gap-3">
                  {questionOptions.map((count) => (
                    <Button
                      key={count}
                      variant={questionCount === count ? "default" : "outline"}
                      onClick={() => setQuestionCount(count)}
                      className="px-6"
                    >
                      {count}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Quiz Button (starts inline modal) */}
            {quizType && (quizType === "random" || selectedCountry) && (
              <div className="text-center pt-4">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={handleStartQuiz}
                  className="px-12"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Start Quiz"
                  )}
                </Button>
                {/* When a country is selected, provide a separate explicit action to view details */}
                {quizType === "country" && selectedCountry && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const slug = selectedCountry
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, "");
                        navigate(`/country/${slug}`);
                      }}
                    >
                      View Country Details
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <React.Suspense fallback={<div />}>
        <QuizModal
          open={openInline}
          onOpenChange={setOpenInline}
          topic={inlineTopic}
          questionCount={inlineCount}
        />
      </React.Suspense>
    </div>
  );
};

export default Quiz;
