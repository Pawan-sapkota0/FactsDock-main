import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const PAGE_SIZE = 20;

const CategoriesAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCategories = async ({
    pageParam = page,
  }: {
    pageParam?: number;
  }) => {
    const from = (pageParam - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let builder = supabase
      .from("categories")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (query && query.trim().length > 0)
      builder = builder.ilike("name", `%${query.trim()}%`);
    const { data, error, count } = await builder;
    if (error) throw error;
    setTotal(count || 0);
    return data || [];
  };

  const catsQ = useQuery({
    queryKey: ["admin", "categories", { page, query }],
    queryFn: () => fetchCategories({ pageParam: page }),
  });
  const categories =
    (catsQ?.data as unknown as Record<string, unknown>[]) || [];
  const isLoading = !!catsQ?.isLoading;

  const deleteMut = useMutation({
    mutationFn: async (id: string) =>
      supabase.from("categories").delete().eq("id", id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast({ title: "Deleted", description: "Category deleted." });
    },
    onError: (err: unknown) => {
      const e = err as Record<string, unknown> | undefined;
      const nested = (e && (e.error as unknown)) as
        | Record<string, unknown>
        | undefined;
      const message =
        (e &&
          ((e.message as string) || (nested && (nested.message as string)))) ||
        String(err || "Failed to delete category.");
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
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search categories..."
            value={query}
            onChange={(e) => {
              const ev = e as React.ChangeEvent<HTMLInputElement>;
              setQuery(ev.target.value);
              setPage(1);
            }}
          />
          <Button onClick={() => navigate("/admin/categories/new")}>
            New Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {categories.map((c) => {
            const row = c as Record<string, unknown>;
            const id = String(row.id);
            const name = String(row.name || "");
            const type = String(row.type || "");
            const description = String(row.description || "");
            return (
              <Card key={id} className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-sm text-muted-foreground">
                    {type || "—"} • {description || ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/admin/categories/${id}/edit`)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      "Edit"
                    )}
                  </Button>
                  <AlertDialog>
                    <Button
                      variant="destructive"
                      onClick={() => setDeletingId(id)}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete category?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this category? This
                          will also remove related subcategories.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(id)}>
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

export default CategoriesAdmin;
