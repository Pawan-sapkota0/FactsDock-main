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
import logger from "@/lib/logger";

const PAGE_SIZE = 10;

const QuizzesAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<string | null>(null);
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
  const quizzes =
    (quizzesQ?.data as unknown as Record<string, unknown>[]) || [];
  const isLoading = !!quizzesQ?.isLoading;

  const deleteMut = useMutation({
    mutationFn: async (id: string) =>
      supabase.from("quizzes").delete().eq("id", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
      toast({ title: "Deleted", description: "Quiz deleted." });
    },
    onError: (err: unknown) => {
      const e = err as Record<string, unknown> | undefined;
      const nestedErr = (e && (e.error as unknown)) as
        | Record<string, unknown>
        | undefined;
      const message =
        (e &&
          ((e.message as string) ||
            (nestedErr && (nestedErr.message as string)))) ||
        String(err || "Failed to delete quiz.");
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const approveMut = useMutation({
    mutationFn: async (id: string) =>
      // Set status to 'approved'. Do not touch `approved_at` column (may not exist).
      supabase.from("quizzes").update({ status: "approved" }).eq("id", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
      toast({ title: "Approved", description: "Quiz approved." });
    },
    onError: (err: unknown) => {
      const e = err as Record<string, unknown> | undefined;
      const nestedErr2 = (e && (e.error as unknown)) as
        | Record<string, unknown>
        | undefined;
      const message =
        (e &&
          ((e.message as string) ||
            (nestedErr2 && (nestedErr2.message as string)))) ||
        String(err || "Failed to approve quiz.");
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      // read metadata for targeted cache invalidation (if useful)
      let meta: Record<string, unknown> | null = null;
      try {
        const m = await supabase
          .from("quizzes")
          .select("fact_type_id,country,category_id,is_random")
          .eq("id", id)
          .maybeSingle();
        // SDK boundary: m.data comes from Supabase; treat as unknown then narrow
        meta = (m?.data as unknown as Record<string, unknown>) || null;
      } catch (e) {
        // ignore
      }

      // optimistic UI update
      setStatusMap((s) => ({ ...s, [id]: "approved" }));
      try {
        const res = (await approveMut.mutateAsync(id)) as unknown;
        const resRec = res as Record<string, unknown> | undefined;
        if (resRec && (resRec.error as unknown)) throw resRec.error;
      } catch (mutErr) {
        // rollback optimistic update
        setStatusMap((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
        throw mutErr;
      }

      // Invalidate queries and clear quiz caches stored in localStorage
      try {
        qc.invalidateQueries({ queryKey: ["admin", "quizzes"] });
        qc.invalidateQueries({ queryKey: ["quiz"] });
        // remove localStorage entries created by api.ts for quiz cache
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i) || "";
          if (key.startsWith("wf:quiz:") || key.startsWith("wf:randomquiz:")) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        logger.warn("Failed to clear quiz caches", e);
      }

      toast({ title: "Approved", description: "Quiz approved." });
    } catch (e: unknown) {
      const errRec = e as Record<string, unknown> | undefined;
      const message = (errRec && (errRec.message as string)) || String(e);
      setLastError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

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
            onChange={(e) => {
              const ev = e as React.ChangeEvent<HTMLInputElement>;
              setQuery(ev.target.value);
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
          {quizzes.map((q) => {
            const row = q as Record<string, unknown>;
            const id = String(row.id);
            const country = String(row.country || "");
            const difficulty = String(row.difficulty || "");
            const status = String(row.status || "");
            return (
              <Card key={id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{id}</div>
                  <div className="text-sm text-muted-foreground">
                    {country || "—"} • {difficulty || "—"}
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
                  {status === "approved" ? (
                    <div className="px-3 py-1 rounded bg-green-100 text-green-800 text-sm flex items-center">
                      Approved
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => approve(id)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === q.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Approve"
                      )}
                    </Button>
                  )}
                  <AlertDialog
                    open={deletingId === q.id}
                    onOpenChange={(open) => {
                      if (!open) setDeletingId(null);
                    }}
                  >
                    <Button
                      variant="destructive"
                      onClick={() => setDeletingId(String(q.id))}
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
                        <AlertDialogAction onClick={() => remove(String(q.id))}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}

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
