import { useState } from "react";
import { Shuffle, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SearchBar from "@/components/SearchBar";

const Quiz = () => {
  const [quizType, setQuizType] = useState<"country" | "random" | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  const questionOptions = [10, 20, 30, 40, 50];

  const handleStartQuiz = () => {
    console.log("Starting quiz:", { quizType, selectedCountry, questionCount });
    // Quiz logic will be implemented later
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8">
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

            {/* Quiz Type Selection */}
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
                  <CardTitle className="text-center">Country-wise Quiz</CardTitle>
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

            {/* Country Selection (if country-wise) */}
            {quizType === "country" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Select a Country</h3>
                <SearchBar 
                  placeholder="Search and select a country..."
                  onChange={(value) => setSelectedCountry(value)}
                />
              </div>
            )}

            {/* Question Count Selection */}
            {quizType && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Number of Questions</h3>
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

            {/* Start Quiz Button */}
            {quizType && (quizType === "random" || selectedCountry) && (
              <div className="text-center pt-4">
                <Button 
                  variant="hero" 
                  size="lg"
                  onClick={handleStartQuiz}
                  className="px-12"
                >
                  Start Quiz
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Quiz;
