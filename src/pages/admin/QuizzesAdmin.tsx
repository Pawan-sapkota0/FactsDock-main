/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 10;

const QuizzesAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuizzes = async ({ pageParam = page }: { pageParam?: number }) => {
    const from = (pageParam - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let builder = supabase
      .from("quizzes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (query && query.trim().length > 0)
      builder = builder
        .ilike("id", `%${query.trim()}%`)
        .or(`country.ilike.%${query.trim()}%`);
    const { data, error, count } = await builder;
    if (error) throw error;
    setTotal(count || 0);
    return data || [];
  };

  const quizzesQ = useQuery({
    queryKey: ["admin", "quizzes", { page, query }],
    queryFn: () => fetchQuizzes({ pageParam: page }),
  });
  const quizzes = (quizzesQ?.data as any) || [];
  const isLoading = !!quizzesQ?.isLoading;

  const deleteMut = useMutation({
    mutationFn: async (id: string) =>
      supabase.from("quizzes").delete().eq("id", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
      toast({ title: "Deleted", description: "Quiz deleted." });
    },
    onError: (err: any) => {
      const message =
        err?.message || err?.error?.message || "Failed to delete quiz.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const remove = async (id: string) => {
    setDeletingId(id);
    setActionLoading(id);
    try {
      await deleteMut.mutateAsync(id);
    } finally {
      setDeletingId(null);
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by country or id..."
            value={query}
            onChange={(e: any) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <Button onClick={() => navigate("/admin/quizzes/new")}>
            New Quiz
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((q: any) => (
            <Card key={q.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{q.id}</div>
                <div className="text-sm text-muted-foreground">
                  {q.country || "—"} • {q.difficulty || "—"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/quizzes/${q.id}/edit`)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === q.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Edit"
                  )}
                </Button>
                <AlertDialog
                  open={deletingId === q.id}
                  onOpenChange={(open) => {
                    if (!open) setDeletingId(null);
                  }}
                >
                  <Button
                    variant="destructive"
                    onClick={() => setDeletingId(q.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === q.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete quiz?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this quiz?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingId(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(q.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}

          <div className="flex items-center justify-between">
            <div>
              Showing {(page - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(page * PAGE_SIZE, total)} of {total}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * PAGE_SIZE >= total}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesAdmin;
