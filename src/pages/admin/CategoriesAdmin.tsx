import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Globe,
  MapPin,
} from "lucide-react";

const PAGE_SIZE = 50;

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

  // Group categories by type
  const groupedCategories = useMemo(() => {
    const groups: Record<string, Record<string, unknown>[]> = {
      fun: [],
      world: [],
      country: [],
    };
    categories.forEach((cat) => {
      const type = String((cat as Record<string, unknown>)?.type || "fun");
      const key = type.toLowerCase().includes("world")
        ? "world"
        : type.toLowerCase().includes("country")
          ? "country"
          : "fun";
      groups[key].push(cat);
    });
    return groups;
  }, [categories]);

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

  const typeConfig = {
    fun: {
      label: "Fun Facts",
      icon: Sparkles,
      color: "from-amber-500/10 to-amber-500/5",
      badge:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    },
    world: {
      label: "World Facts",
      icon: Globe,
      color: "from-blue-500/10 to-blue-500/5",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    country: {
      label: "Country Facts",
      icon: MapPin,
      color: "from-green-500/10 to-green-500/5",
      badge:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
  };

  const renderCategoryCard = (cat: Record<string, unknown>) => {
    const id = String(cat.id);
    const name = String(cat.name || "");
    const description = String(cat.description || "");

    return (
      <Card
        key={id}
        className="p-4 group hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/50 hover:border-l-primary"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
              {name}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/admin/categories/${id}/edit`)}
              disabled={!!actionLoading}
              className="gap-2"
            >
              {actionLoading === id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!!actionLoading}
                  className="gap-2"
                >
                  {actionLoading === id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete category?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{name}"? This action cannot
                    be undone and will also remove related subcategories.
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
        </div>
      </Card>
    );
  };

  const renderTypeSection = (
    typeKey: "fun" | "world" | "country",
    items: Record<string, unknown>[],
  ) => {
    const config = typeConfig[typeKey];
    const Icon = config.icon;

    return (
      <div key={typeKey} className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{config.label}</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "category" : "categories"}
          </span>
        </div>
        <div className={`rounded-lg p-4 bg-gradient-to-r ${config.color}`}>
          <div className="grid gap-3">
            {items.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No {config.label.toLowerCase()} yet
              </div>
            ) : (
              items.map((cat) =>
                renderCategoryCard(cat as Record<string, unknown>),
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your fact categories organized by type
          </p>
        </div>
        <Button
          onClick={() => navigate("/admin/categories/new")}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search categories by name..."
          value={query}
          onChange={(e) => {
            const ev = e as React.ChangeEvent<HTMLInputElement>;
            setQuery(ev.target.value);
            setPage(1);
          }}
          className="pl-10"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          🔍
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No categories found</p>
          <Button onClick={() => navigate("/admin/categories/new")}>
            Create your first category
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {renderTypeSection("fun", groupedCategories.fun)}
          {renderTypeSection("world", groupedCategories.world)}
          {renderTypeSection("country", groupedCategories.country)}
        </div>
      )}

      {/* Pagination */}
      {categories.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, total)} of {total} categories
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * PAGE_SIZE >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesAdmin;
