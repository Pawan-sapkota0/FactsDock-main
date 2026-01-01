/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { clearFactsCacheForKey, clearFactsCacheAll } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BulkCountryFactsModal } from "@/components/admin/BulkCountryFactsModal";

const PAGE_SIZE = 10;

const FactsAdmin: React.FC = () => {
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [factTypes, setFactTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  // local map to keep optimistic status updates for facts (id -> status)
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<string | null>(null);

  // Load fact types and categories for bulk generator
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Load all fact types
        const { data: ftypes } = await supabase.from("fact_types").select("*");

        // Prefer categories of type 'country'. If none found, try a case-insensitive
        // match, then fall back to all categories (helps environments with different data).
        let cats: any[] = [];
        try {
          const resp1: any = await supabase
            .from("categories")
            .select("*")
            .eq("type", "country");
          cats = resp1?.data || [];

          // Fallback: case-insensitive match if exact eq returned nothing
          if (!cats.length) {
            const resp2: any = await supabase
              .from("categories")
              .select("*")
              .ilike("type", "%country%");
            cats = resp2?.data || [];
          }

          // Final fallback: load all categories (keeps UI functioning)
          if (!cats.length) {
            const resp3: any = await supabase.from("categories").select("*");
            cats = resp3?.data || [];
            console.warn(
              "[FactsAdmin] No 'country' categories found; falling back to all categories."
            );
          }
        } catch (e) {
          console.error("[FactsAdmin] Error loading categories:", e);
        }

        if (mounted) {
          setFactTypes(ftypes || []);
          setCategories(cats || []);
        }
        console.log("[FactsAdmin] Loaded categories:", cats);
        console.log("[FactsAdmin] Loaded fact types:", ftypes);
      } catch (e) {
        console.error("Failed to load fact types/categories:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchFacts = async ({ pageParam = page }: { pageParam?: number }) => {
    const from = (pageParam - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Select facts and include related names from fact_types, categories, subcategories
    // Use PostgREST foreign table select syntax to fetch related rows in one request.
    // Keep count exact for pagination.
    let builder = supabase
      .from("facts")
      .select(`*, fact_types(name), categories(name), subcategories(name)`, {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query && query.trim().length > 0) {
      const q = query.trim();
      builder = builder.ilike("fact_text", `%${q}%`);
    }

    const { data, error, count } = await builder;
    if (error) throw error;
    setTotal(count || 0);

    // Normalize each row so the UI can access `f.fact_type`, `f.category`, `f.subcategory`.
    const normalized = (data || []).map((r: any) => {
      return {
        ...r,
        fact_type: r.fact_types?.name || r.fact_type || null,
        category: r.categories?.name || r.category || null,
        subcategory: r.subcategories?.name || r.subcategory || null,
      };
    });

    return normalized;
  };

  const factsQ = useQuery({
    queryKey: ["admin", "facts", { page, query }],
    queryFn: () => fetchFacts({ pageParam: page }),
  });
  const facts = (factsQ?.data as any) || [];
  const isLoading = !!factsQ?.isLoading;

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return supabase.from("facts").update({ status: "approved" }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "facts"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin", "stats"], exact: false });
      // clear frontend facts caches so category pages refetch DB-backed facts
      try {
        clearFactsCacheAll();
      } catch (e) {
        console.warn("Failed to clear facts cache", e);
      }
      toast({ title: "Approved", description: "Fact approved." });
    },
    onError: (err: any) => {
      const message =
        err?.message || err?.error?.message || "Failed to approve fact.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const approve = async (id: string) => {
    setActionLoading(id);
    try {
      // fetch metadata for targeted cache invalidation
      let meta: any = null;
      try {
        const m = await supabase
          .from("facts")
          .select("category_id, subcategory_id, fact_type_id")
          .eq("id", id)
          .maybeSingle();
        meta = m?.data || null;
      } catch (e) {
        /* ignore */
      }

      // optimistic UI update: mark as approved locally
      setStatusMap((s) => ({ ...s, [id]: "approved" }));
      try {
        await approveMutation.mutateAsync(id);
      } catch (mutErr) {
        // rollback optimistic update on error
        setStatusMap((s) => {
          const copy = { ...s };
          delete copy[id];
          return copy;
        });
        throw mutErr;
      }

      // targeted cache clear
      try {
        if (meta) {
          const catResp: any = await supabase
            .from("categories")
            .select("name,type")
            .eq("id", meta.category_id)
            .maybeSingle();
          const cat = catResp?.data || null;
          let label = "";
          if (meta.subcategory_id) {
            const subResp: any = await supabase
              .from("subcategories")
              .select("name")
              .eq("id", meta.subcategory_id)
              .maybeSingle();
            const sub = subResp?.data || null;
            label = `${cat?.name || ""} — ${sub?.name || ""}`;
          } else {
            label = cat?.name || "";
          }
          const typeSlug = cat?.type || "fun-facts";
          if (label) clearFactsCacheForKey(typeSlug, label);
        }
      } catch (e) {
        console.warn("Failed to clear targeted facts cache", e);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // return deleted rows to make result clearer and ensure supabase executed
      return supabase.from("facts").delete().eq("id", id).select();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "facts"], exact: false });
      qc.invalidateQueries({ queryKey: ["admin", "stats"], exact: false });
      try {
        clearFactsCacheAll();
      } catch (e) {
        console.warn("Failed to clear facts cache", e);
      }
      toast({ title: "Deleted", description: "Fact deleted." });
    },
    onError: (err: any) => {
      const message =
        err?.message || err?.error?.message || "Failed to delete fact.";
      toast({ title: "Error", description: message, variant: "destructive" });
    },
  });

  const remove = async (id: string) => {
    setDeletingId(id);
    setActionLoading(id);
    try {
      setLastError(null);
      console.debug("[Admin] removing fact", id);
      // read metadata so we can invalidate the affected cache after deletion
      let meta: any = null;
      try {
        const m = await supabase
          .from("facts")
          .select("category_id, subcategory_id, fact_type_id")
          .eq("id", id)
          .maybeSingle();
        meta = m?.data || null;
      } catch (e) {
        /* ignore */
      }

      const res: any = await deleteMutation.mutateAsync(id);
      console.debug("[Admin] delete result", res);
      // Supabase responses are { data, error }; handle error explicitly so UI isn't silent
      if (res && res.error) {
        const message =
          res.error?.message || "Failed to delete fact (server error).";
        console.error("[Admin] delete error", res.error);
        setLastError(message);
        toast({ title: "Error", description: message, variant: "destructive" });
        return;
      }

      // targeted cache clear
      try {
        if (meta) {
          const catResp: any = await supabase
            .from("categories")
            .select("name,type")
            .eq("id", meta.category_id)
            .maybeSingle();
          const cat = catResp?.data || null;
          let label = "";
          if (meta.subcategory_id) {
            const subResp: any = await supabase
              .from("subcategories")
              .select("name")
              .eq("id", meta.subcategory_id)
              .maybeSingle();
            const sub = subResp?.data || null;
            label = `${cat?.name || ""} — ${sub?.name || ""}`;
          } else {
            label = cat?.name || "";
          }
          const typeSlug = cat?.type || "fun-facts";
          if (label) clearFactsCacheForKey(typeSlug, label);
        }
      } catch (e) {
        console.warn("Failed to clear targeted facts cache", e);
      }
    } catch (e: any) {
      const message = e?.message || String(e);
      console.error("[Admin] remove caught error", e);
      setLastError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
      setActionLoading(null);
    }
  };

  const startNew = () => {
    navigate("/admin/facts/new");
  };

  const editFact = (id: string) => {
    navigate(`/admin/facts/${id}/edit`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Facts</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search facts..."
            value={query}
            onChange={(e: any) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
          <Button onClick={startNew}>New Fact</Button>
          <Button variant="secondary" onClick={() => setBulkModalOpen(true)}>
            🌍 Bulk Generate Country Facts
          </Button>
        </div>
      </div>

      {/* Bulk Country Facts Modal */}
      <BulkCountryFactsModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        factTypes={factTypes}
        categories={categories}
      />

      {lastError ? (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <strong>Delete error:</strong>
              <div className="mt-1 text-sm break-words">{lastError}</div>
            </div>
            <div>
              <Button variant="ghost" onClick={() => setLastError(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {(facts || []).map((f: any) => (
            <Card key={f.id} className="p-4 flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{f.fact_text}</h3>
                <div className="text-sm text-muted-foreground">
                  • {f.fact_type || "—"} • {f.country || "—"} •{" "}
                  {f.category || "—"} • {f.subcategory || "—"}
                </div>

                <div className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => editFact(f.id)}
                  disabled={!!actionLoading}
                >
                  {actionLoading === f.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Edit"
                  )}
                </Button>
                {
                  // compute current status (use optimistic override if present)
                  (() => {
                    const status = statusMap[f.id] || f.status || "pending";
                    if (status === "approved") {
                      return (
                        <Button
                          disabled
                          className="opacity-60 cursor-not-allowed"
                        >
                          Approved
                        </Button>
                      );
                    }
                    // pending or other statuses -> show Approve button
                    return (
                      <Button
                        onClick={() => approve(f.id)}
                        disabled={!!actionLoading || actionLoading === f.id}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                      >
                        {actionLoading === f.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    );
                  })()
                }
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setDeletingId(f.id)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === f.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete fact?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this fact? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(f.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}

          {/* pagination controls */}
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

export default FactsAdmin;
