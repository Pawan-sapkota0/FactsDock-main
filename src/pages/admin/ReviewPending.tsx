import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchPendingFacts,
  fetchPendingQuizzes,
  clearFactsCacheAll,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, HelpCircle, Check, X, Loader2 } from "lucide-react";
import logger from "@/lib/logger";

interface PendingFact {
  id: string;
  fact_text: string;
  country: string;
  category: string;
  subcategory: string;
  fact_type: string;
  created_at: string;
  status: string;
}

interface PendingQuiz {
  id: string;
  country: string;
  difficulty: string;
  category: string;
  created_at: string;
  status: string;
  questions: Record<string, unknown>[];
}

const PAGE_SIZE = 10;

const ReviewPending: React.FC = () => {
  const [factsPage, setFactsPage] = useState(1);
  const [quizzesPage, setQuizzesPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch pending facts
  const factsQuery = useQuery({
    queryKey: ["admin", "pending-facts", factsPage],
    queryFn: () => fetchPendingFacts(PAGE_SIZE, factsPage),
  });

  // Fetch pending quizzes
  const quizzesQuery = useQuery({
    queryKey: ["admin", "pending-quizzes", quizzesPage],
    queryFn: () => fetchPendingQuizzes(PAGE_SIZE, quizzesPage),
  });

  // Approve fact mutation
  const approveFact = useMutation({
    mutationFn: async (id: string) => {
      return supabase.from("facts").update({ status: "approved" }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "pending-facts"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["admin", "stats"], exact: false });
      try {
        clearFactsCacheAll();
      } catch (e) {
        logger.warn("Failed to clear facts cache", e);
      }
      toast({
        title: "Success",
        description: "Fact approved successfully",
        variant: "default",
      });
    },
    onError: (err: Error) => {
      const message = err?.message || "Failed to approve fact";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Reject fact mutation
  const rejectFact = useMutation({
    mutationFn: async (id: string) => {
      return supabase.from("facts").update({ status: "rejected" }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "pending-facts"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["admin", "stats"], exact: false });
      try {
        clearFactsCacheAll();
      } catch (e) {
        logger.warn("Failed to clear facts cache", e);
      }
      toast({
        title: "Success",
        description: "Fact rejected",
        variant: "default",
      });
    },
    onError: (err: Error) => {
      const message = err?.message || "Failed to reject fact";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Approve quiz mutation
  const approveQuiz = useMutation({
    mutationFn: async (id: string) => {
      return supabase
        .from("quizzes")
        .update({ status: "approved" })
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "pending-quizzes"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["admin", "stats"], exact: false });
      toast({
        title: "Success",
        description: "Quiz approved successfully",
        variant: "default",
      });
    },
    onError: (err: Error) => {
      const message = err?.message || "Failed to approve quiz";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Reject quiz mutation
  const rejectQuiz = useMutation({
    mutationFn: async (id: string) => {
      return supabase
        .from("quizzes")
        .update({ status: "rejected" })
        .eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin", "pending-quizzes"],
        exact: false,
      });
      qc.invalidateQueries({ queryKey: ["admin", "stats"], exact: false });
      toast({
        title: "Success",
        description: "Quiz rejected",
        variant: "default",
      });
    },
    onError: (err: Error) => {
      const message = err?.message || "Failed to reject quiz";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleApproveFact = async (id: string) => {
    setActionLoading(id);
    try {
      await approveFact.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectFact = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectFact.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveQuiz = async (id: string) => {
    setActionLoading(id);
    try {
      await approveQuiz.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectQuiz = async (id: string) => {
    setActionLoading(id);
    try {
      await rejectQuiz.mutateAsync(id);
    } finally {
      setActionLoading(null);
    }
  };

  const factsData = factsQuery.data || { facts: [], total: 0 };
  const quizzesData = quizzesQuery.data || { quizzes: [], total: 0 };
  const factsTotalPages = Math.ceil(factsData.total / PAGE_SIZE);
  const quizzesTotalPages = Math.ceil(quizzesData.total / PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Review Pending
        </h1>
        <p className="text-muted-foreground">
          Approve or reject pending facts and quizzes for publication.
        </p>
      </div>

      {/* Pending Facts Section */}
      <div>
        <Card className="border-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              📘 Pending Facts ({factsData.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {factsQuery.isLoading ? (
              <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pending facts...
              </div>
            ) : factsData.facts.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No pending facts for review
              </div>
            ) : (
              <div className="divide-y divide-border">
                {factsData.facts.map((fact: PendingFact) => (
                  <div
                    key={fact.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {fact.fact_text}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-semibold">Country:</span>{" "}
                          {fact.country}
                        </div>
                        <div>
                          <span className="font-semibold">Category:</span>{" "}
                          {fact.category}
                        </div>
                        {fact.subcategory && (
                          <div>
                            <span className="font-semibold">Subcategory:</span>{" "}
                            {fact.subcategory}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">Created:</span>{" "}
                          {new Date(fact.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-green-600 hover:text-green-700"
                              disabled={actionLoading === fact.id}
                            >
                              {actionLoading === fact.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve Fact?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This fact will be published and visible to all
                                users.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleApproveFact(fact.id)}
                              >
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-red-600 hover:text-red-700"
                              disabled={actionLoading === fact.id}
                            >
                              {actionLoading === fact.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Fact?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This fact will be marked as rejected and not
                                published.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRejectFact(fact.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {factsTotalPages > 1 && (
              <div className="flex gap-2 items-center justify-center p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFactsPage((p) => Math.max(1, p - 1))}
                  disabled={factsPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {factsPage} of {factsTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFactsPage((p) => Math.min(factsTotalPages, p + 1))
                  }
                  disabled={factsPage === factsTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Quizzes Section */}
      <div>
        <Card className="border-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />❓ Pending
              Quizzes ({quizzesData.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {quizzesQuery.isLoading ? (
              <div className="p-6 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pending quizzes...
              </div>
            ) : quizzesData.quizzes.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No pending quizzes for review
              </div>
            ) : (
              <div className="divide-y divide-border">
                {quizzesData.quizzes.map((quiz: PendingQuiz) => (
                  <div
                    key={quiz.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {quiz.country} - {quiz.difficulty || "General"}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-semibold">Category:</span>{" "}
                          {quiz.category}
                        </div>
                        <div>
                          <span className="font-semibold">Questions:</span>{" "}
                          {Array.isArray(quiz.questions)
                            ? quiz.questions.length
                            : 0}
                        </div>
                        <div>
                          <span className="font-semibold">Created:</span>{" "}
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-green-600 hover:text-green-700"
                              disabled={actionLoading === quiz.id}
                            >
                              {actionLoading === quiz.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Approve Quiz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This quiz will be published and available to all
                                users.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleApproveQuiz(quiz.id)}
                              >
                                Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-red-600 hover:text-red-700"
                              disabled={actionLoading === quiz.id}
                            >
                              {actionLoading === quiz.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Quiz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This quiz will be marked as rejected and not
                                published.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRejectQuiz(quiz.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {quizzesTotalPages > 1 && (
              <div className="flex gap-2 items-center justify-center p-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuizzesPage((p) => Math.max(1, p - 1))}
                  disabled={quizzesPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {quizzesPage} of {quizzesTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuizzesPage((p) => Math.min(quizzesTotalPages, p + 1))
                  }
                  disabled={quizzesPage === quizzesTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewPending;
