import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logger from "@/lib/logger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type Option = {
  id?: string | number;
  name?: string;
  category_id?: string | number;
};
type PreviewItem = {
  fact?: string;
  fact_text?: string;
  description?: string;
  title?: string;
  text?: string;
} & Record<string, unknown>;

const FactsEdit: React.FC = () => {
  const { id: editId } = useParams<{ id?: string }>();
  const [category, setCategory] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  // keep the Select controlled for its whole lifecycle by using an empty string
  // as the initial value instead of null/undefined
  const [factTypeId, setFactTypeId] = useState<string>("");
  const [country, setCountry] = useState("");
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [openCountDialog, setOpenCountDialog] = useState(false);
  const [generateCount, setGenerateCount] = useState<number>(5);
  const [skippedLines, setSkippedLines] = useState<
    { line: string; index: number; error?: unknown }[]
  >([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLines, setConfirmLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const factTypesQ = useQuery({
    queryKey: ["admin", "fact-types"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fact_types")
        .select("*")
        .order("name");
      return data || [];
    },
  });
  const factTypes = (factTypesQ?.data as Option[]) || [];

  const catsQ = useQuery({
    queryKey: ["admin", "categories", factTypeId],
    queryFn: async () => {
      if (!factTypeId) return [];
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("fact_type_id", factTypeId)
        .order("name");
      return data || [];
    },
    enabled: factTypeId !== "",
  });
  const categories = useMemo(
    () => (catsQ?.data as Option[]) || [],
    [catsQ?.data],
  );

  const _factQ = useQuery({
    queryKey: ["admin", "fact", editId],
    queryFn: async () => {
      if (!editId) return null;
      const { data } = await supabase
        .from("facts")
        .select("*")
        .eq("id", editId)
        .single();
      return data || null;
    },
    enabled: !!editId,
  });
  const factData = _factQ?.data;
  useEffect(() => {
    if (!factData) return;

    // When loading an existing fact, try to resolve category/subcategory ids
    // from names if only names are present in the row. This ensures the
    // Select components receive the matching option values (ids as strings)
    // and show the previously-selected values.
    (async () => {
      // fact type
      const ft =
        factData.fact_type_id != null
          ? String(factData.fact_type_id)
          : factData.fact_type || "";
      setFactTypeId(ft);

      // category: prefer id; if only a name is present, try to look it up
      if (factData.category_id != null) {
        setCategory(String(factData.category_id));
      } else if (factData.category) {
        try {
          const catResp = await supabase
            .from("categories")
            .select("id")
            .ilike("name", factData.category)
            .maybeSingle();
          const cat = catResp?.data || null;
          if (cat) {
            setCategory(String(cat.id));
          } else {
            // fallback to the raw name so the field isn't blank
            setCategory(factData.category);
          }
        } catch (e) {
          setCategory(factData.category);
        }
      } else {
        setCategory("");
      }

      // subcategory: prefer id; if only a name is present, try to look it up
      if (factData.subcategory_id != null) {
        setSubcategory(String(factData.subcategory_id));
      } else if (factData.subcategory) {
        try {
          const subResp = await supabase
            .from("subcategories")
            .select("id,category_id")
            .ilike("name", factData.subcategory)
            .maybeSingle();
          const sub = subResp?.data || null;
          if (sub) {
            setSubcategory(String(sub.id));
            // ensure category matches the subcategory's category if we don't have it
            if (
              !factData.category_id &&
              (!factData.category || factData.category === "")
            ) {
              setCategory(String(sub.category_id));
            }
          } else {
            setSubcategory(factData.subcategory);
          }
        } catch (e) {
          setSubcategory(factData.subcategory);
        }
      } else {
        setSubcategory("");
      }

      setCountry(factData.country || "");
      setText(factData.fact_text || "");
    })();
  }, [factData]);

  // load current user id to set created_by on generated/persisted facts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await supabase.auth.getUser();
        const user = resp?.data?.user || null;
        if (mounted && user) setAdminUserId(user.id);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (category) fetchSubcategories(category);
  }, [category, categories]);

  const fetchSubcategories = async (catIdOrName: string) => {
    const catId = catIdOrName;
    const { data } = await supabase
      .from("subcategories")
      .select("*")
      .eq("category_id", catId)
      .order("name");
    setSubcategories(data || []);
  };

  // reset category/subcategory when fact type changes
  useEffect(() => {
    // When editing an existing fact, factTypeId will be set from the fetched
    // `factData`. In that case we should NOT clear category/subcategory here
    // (that was causing the selects to reset). Only clear when the user
    // actually changes the factTypeId after the form has been initialized.
    if (factData) {
      // If the current factData's fact_type_id matches the new factTypeId,
      // this effect was triggered by loading the existing fact — skip reset.
      const fdType =
        factData.fact_type_id != null
          ? String(factData.fact_type_id)
          : String(factData.fact_type || "");
      if (String(factTypeId) === fdType) return;
    }

    setCategory("");
    setSubcategory("");
    setSubcategories([]);
  }, [factTypeId, factData]);

  // helper to create a slug for fuzzy matching
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // When categories finish loading and we're editing an existing fact,
  // ensure the category select gets the correct id string value so the
  // Select can show the selected option. This covers cases where the
  // fact row stores only a category name instead of category_id.
  useEffect(() => {
    if (!factData) return;
    if (!categories || categories.length === 0) return;
    // if category already set to an id/string, don't override
    if (category && category !== "") return;

    (async () => {
      // prefer explicit category_id from the fact row
      if (factData.category_id != null) {
        setCategory(String(factData.category_id));
        return;
      }
      const name = (factData.category || "").trim();
      if (!name) return;
      // try exact, case-insensitive, then slug match
      let found = categories.find(
        (c: Option) =>
          c.id != null && String(c.id) === String(factData.category_id),
      );
      if (!found) found = categories.find((c: Option) => c.name === name);
      if (!found)
        found = categories.find(
          (c: Option) => (c.name || "").toLowerCase() === name.toLowerCase(),
        );
      if (!found) {
        const target = slugify(name);
        found = categories.find(
          (c: Option) => slugify(c.name || "") === target,
        );
      }
      if (found) setCategory(String(found.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, factData]);

  // After the category select's options are loaded (subcategories), ensure
  // the subcategory select shows the saved value when editing.
  useEffect(() => {
    if (!factData) return;
    if (!subcategories || subcategories.length === 0) return;
    if (subcategory && subcategory !== "") return;

    (async () => {
      if (factData.subcategory_id != null) {
        setSubcategory(String(factData.subcategory_id));
        return;
      }
      const name = (factData.subcategory || "").trim();
      if (!name) return;
      // try exact, case-insensitive, slug
      let found = subcategories.find(
        (s: Option) =>
          s.id != null && String(s.id) === String(factData.subcategory_id),
      );
      if (!found) found = subcategories.find((s: Option) => s.name === name);
      if (!found)
        found = subcategories.find(
          (s: Option) => (s.name || "").toLowerCase() === name.toLowerCase(),
        );
      if (!found) {
        const target = slugify(name);
        found = subcategories.find(
          (s: Option) => slugify(s.name || "") === target,
        );
      }
      if (found) setSubcategory(String(found.id));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategories, factData]);

  const parseTextareaLines = (raw: string) => {
    if (!raw) return [] as string[];
    return raw
      .split(/\r?\n/)
      .map((r) => r.trim())
      .filter(Boolean);
  };

  const generatePreview = async (count = 1) => {
    setLoading(true);
    try {
      if (!factTypeId || !category) {
        toast({
          title: "Missing selection",
          description:
            "Please choose a fact type and category before generating.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      const url =
        (import.meta.env.VITE_GENERATE_FACT_URL as string) ||
        (import.meta.env.VITE_GENERATE_FACTS_URL as string) ||
        "/.netlify/functions/generate-facts";
      // find selected names to give the AI a friendly prompt
      const ft = factTypes.find((f: Option) => f.id === factTypeId) || null;
      const catObj = categories.find((c: Option) => c.id === category) || null;
      const subObj =
        subcategories.find((s: Option) => s.id === subcategory) || null;
      const body: Record<string, unknown> = {
        // send both friendly names and ids so server functions can accept either
        fact_type: ft?.name || null,
        fact_type_id: factTypeId || null,
        category: catObj?.name || null,
        category_id: category || null,
        subcategory: subObj?.name || null,
        subcategory_id: subcategory || null,
        country: country || null,
        count,
      };

      logger.debug("generatePreview -> POST", url, body);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(text || "AI generation failed. Please try again.");
        }

        const json = await res.json().catch(() => null);
        logger.debug("generatePreview response", json);
        const items = (json && (json.data || json.items || json)) || [];
        const arr = Array.isArray(items) ? items : [items];
        setPreview(arr);

        // populate the editor with the first generated item if present
        if (arr.length > 0) {
          const first = arr[0];
          const candidate =
            first.fact ||
            first.fact_text ||
            first.description ||
            first.title ||
            first.text ||
            null;
          if (candidate) setText(candidate);
        }
      } catch (outerErr) {
        // network/CORS failure or other issue calling the external endpoint. Try supabase.functions.invoke
        logger.warn(
          "Primary fetch failed, attempting supabase.functions.invoke fallback",
          outerErr,
        );
        try {
          const inv = await supabase.functions.invoke("generate-facts", {
            body,
          });
          const invRes = inv as unknown as { data?: unknown; error?: unknown };
          if (invRes.error) throw invRes.error;
          const payload = invRes.data || invRes;
          const items = (() => {
            if (Array.isArray(payload)) return payload;
            if (payload && typeof payload === "object" && payload !== null) {
              const p = payload as Record<string, unknown>;
              if (Array.isArray(p.data)) return p.data;
              if (Array.isArray(p.items)) return p.items;
            }
            return [] as unknown[];
          })();
          const arr = Array.isArray(items) ? items : [items];
          setPreview(arr);
          if (arr.length > 0) {
            const candidate =
              arr[0].fact ||
              arr[0].fact_text ||
              arr[0].description ||
              arr[0].title ||
              arr[0].text ||
              null;
            if (candidate) setText(candidate);
          }
          return;
        } catch (invErr) {
          logger.error("Fallback invoke failed", invErr);
          throw outerErr;
        }
      }
    } catch (e: unknown) {
      logger.error("generatePreview error", e);
      const message =
        e instanceof Error
          ? e.message
          : String(e || "AI generation failed. Please try again.");
      toast({
        title: "AI error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAndPersist = async () => {
    if (!factTypeId || !category) {
      toast({
        title: "Missing selection",
        description:
          "Please choose a fact type and category before generating.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const url =
        (import.meta.env.VITE_GENERATE_FACT_URL as string) ||
        (import.meta.env.VITE_GENERATE_FACTS_URL as string) ||
        "/.netlify/functions/generate-facts";
      const ft = factTypes.find((f: Option) => f.id === factTypeId) || null;
      const catObj = categories.find((c: Option) => c.id === category) || null;
      const subObj =
        subcategories.find((s: Option) => s.id === subcategory) || null;
      const body: Record<string, unknown> = {
        count: 5,
        country: country || null,
        fact_type_id: factTypeId || null,
        fact_type_name: ft?.name || null,
        category_id: category || null,
        category: catObj?.name || null,
        subcategory_id: subcategory || null,
        subcategory: subObj?.name || null,
        persist: true,
        created_by: adminUserId || null,
      };
      logger.debug("generateAndPersist -> POST", url, body);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      logger.debug("generateAndPersist response", json);
      if (json.error) {
        toast({
          title: "Error",
          description: json.error,
          variant: "destructive",
        });
        logger.error("generateAndPersist error", json);
      } else {
        const items = json.data || [];
        setPreview(items);
        const count = Array.isArray(items) ? items.length : 1;
        toast({
          title: "Saved",
          description: `Generated and persisted ${count} fact${
            count > 1 ? "s" : ""
          } as drafts.`,
        });
        qc.invalidateQueries({ queryKey: ["admin", "facts"] });
      }
    } catch (e) {
      logger.error(e);
      toast({
        title: "Error",
        description: "Failed to generate and persist facts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performBulkInsert = async (lines: string[], publish = false) => {
    // Prepare items for insertion
    const items = lines.map((l) => ({
      fact_type_id: factTypeId || null,
      category_id: category || null,
      subcategory_id: subcategory || null,
      country: country || null,
      created_by: adminUserId || null,
      fact_text: l.slice(0, 1000),
      source: "admin",
      status: publish ? "approved" : "draft",
    }));

    try {
      const { data, error } = await supabase
        .from("facts")
        .insert(items)
        .select();
      if (error) throw error;
      return { inserted: data || [], skipped: [] as unknown[] };
    } catch (bulkErr) {
      // bulk insert failed -> fallback to per-item inserts to provide granular errors
      const inserted: unknown[] = [];
      const skipped: unknown[] = [];
      for (let i = 0; i < items.length; i++) {
        try {
          const { data, error } = await supabase
            .from("facts")
            .insert([items[i]])
            .select();
          if (error || !data) {
            skipped.push({
              index: i,
              line: lines[i],
              error: error || "unknown",
            });
          } else {
            inserted.push(data[0]);
          }
        } catch (e) {
          skipped.push({ index: i, line: lines[i], error: e });
        }
      }
      return { inserted, skipped };
    }
  };

  const saveMut = useMutation({
    mutationFn: async (payload: { publish?: boolean }) => {
      // For edits: mark edited facts as 'pending' so they require re-approval.
      if (editId) {
        const status = "pending";
        return supabase
          .from("facts")
          .update({
            fact_type_id: factTypeId || null,
            category_id: category || null,
            subcategory_id: subcategory || null,
            country,
            fact_text: text,
            status,
          })
          .eq("id", editId);
      } else {
        // For a creation, support multiline input. Each non-empty line is a separate fact.
        const lines = parseTextareaLines(text);
        if (lines.length <= 1) {
          const status = payload.publish ? "approved" : "draft";
          return supabase
            .from("facts")
            .insert([
              {
                fact_type_id: factTypeId || null,
                category_id: category || null,
                subcategory_id: subcategory || null,
                country,
                fact_text: text,
                status,
                created_by: adminUserId,
              },
            ])
            .select("id");
        }

        // multiple lines -> perform bulk insert
        const publish = !!payload.publish;
        const res = await performBulkInsert(lines, publish);
        return res;
      }
    },
  });

  const handleSave = async (publishFlag = false, bypassConfirm = false) => {
    setSaving(true);
    try {
      // Validate required fields: fact type, category, and some text (single or multiline)
      if (!factTypeId || !category) {
        toast({
          title: "Missing selection",
          description: "Please choose a fact type and category before saving.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // If text is empty (and no multiline lines) disallow save
      const linesNow = parseTextareaLines(text);
      if (linesNow.length === 0) {
        toast({
          title: "Empty content",
          description:
            "Please enter at least one fact (one per line) before saving.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // If creating and the editor contains multiple lines, require confirmation
      if (!editId && linesNow.length > 1 && !bypassConfirm) {
        setConfirmLines(linesNow);
        setConfirmOpen(true);
        setSaving(false);
        return;
      }

      const res = await saveMut.mutateAsync({ publish: publishFlag });
      // If we just created multiple rows, the result can have inserted/skipped arrays
      if (!editId && res && res.inserted) {
        // inserted may be an array of rows
        const insertedCount = Array.isArray(res.inserted)
          ? res.inserted.length
          : 0;
        const skipped = Array.isArray(res.skipped) ? res.skipped : [];
        if (skipped.length) {
          setSkippedLines(
            skipped.map(
              (s: { index: number; line: string; error?: unknown }) => ({
                line: s.line,
                index: s.index,
                error: s.error,
              }),
            ),
          );
          toast({
            title: "Partial success",
            description: `Inserted ${insertedCount} facts, ${skipped.length} failed. See below.`,
          });
        } else {
          toast({
            title: publishFlag ? "Published" : "Saved",
            description: `${insertedCount} facts ${
              publishFlag ? "published" : "saved"
            } successfully.`,
          });
          qc.invalidateQueries({ queryKey: ["admin", "facts"], exact: false });
          navigate("/admin/facts");
          return;
        }
      }
      qc.invalidateQueries({ queryKey: ["admin", "facts"] });
      // If created, try to redirect to edit page using returned id
      if (!editId && res && res.data && res.data.length && res.data[0].id) {
        const newId = res.data[0].id;
        toast({
          title: "Created",
          description: "Fact created. Redirecting to edit page.",
        });
        navigate(`/admin/facts/${newId}/edit`);
        return;
      }
      toast({
        title: publishFlag ? "Published" : "Saved",
        description: publishFlag ? "Fact published." : "Draft saved.",
      });
      navigate("/admin/facts");
    } catch (e: unknown) {
      logger.error(e);
      let message = "Failed to save fact.";
      if (e instanceof Error) message = e.message;
      else if (typeof e === "object" && e !== null) {
        const obj = e as Record<string, unknown>;
        const m =
          obj["message"] ??
          (obj["error"] &&
            (obj["error"] as Record<string, unknown>)["message"]);
        if (typeof m === "string" && m.length > 0) message = m;
      }
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => handleSave(false);
  const publish = () => handleSave(true);

  const confirmBulkAndSave = async (publishFlag = false) => {
    // used by the confirmation dialog to bypass re-check and proceed
    setConfirmOpen(false);
    await handleSave(publishFlag, true);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {editId ? "Edit Fact" : "New Fact"}
      </h2>
      <div className="grid gap-2 mb-4">
        <label className="text-sm">Fact Type</label>
        <Select
          onValueChange={(v: string) => setFactTypeId(v)}
          value={factTypeId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select fact type" />
          </SelectTrigger>
          <SelectContent>
            {factTypesQ.isLoading && (
              <div className="p-2 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {!factTypesQ.isLoading && factTypes.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                No fact types found
              </div>
            )}
            {factTypes.map((ft: Option) => (
              <SelectItem key={ft.id} value={String(ft.id)}>
                {ft.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="text-sm">Category</label>
        <Select
          onValueChange={(v: string) => setCategory(v)}
          value={category}
          disabled={factTypeId === ""}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                factTypeId ? "Select category" : "Select fact type first"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {catsQ.isLoading && (
              <div className="p-2 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {!catsQ.isLoading && categories.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                {factTypeId ? "No categories found" : "Select fact type first"}
              </div>
            )}
            {categories.map((c: Option) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label className="text-sm">Subcategory</label>
        <Select
          onValueChange={(v: string) => setSubcategory(v)}
          value={subcategory}
          disabled={category === ""}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                category ? "Select subcategory" : "Select category first"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {subcategories.length === 0 && (
              <div className="p-2 text-sm text-muted-foreground">
                {category ? "No subcategories found" : "Select category first"}
              </div>
            )}
            {subcategories.map((s: Option) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground mt-1">
          Optional — leave blank to save under category
        </div>

        <Input
          placeholder="Country (optional)"
          value={country}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setCountry(e.target.value)
          }
        />
        <Textarea
          placeholder="Fact text"
          value={text}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setText(e.target.value)
          }
        />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => setOpenCountDialog(true)}
          disabled={loading || factTypeId === "" || category === ""}
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate with AI
        </Button>
        <Button onClick={saveDraft} variant="outline" disabled={loading}>
          Save Draft
        </Button>
        <Button onClick={publish} disabled={loading}>
          Publish
        </Button>
      </div>

      {preview.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="grid gap-2">
            {preview.map((p: PreviewItem, i: number) => (
              <div key={i} className="p-3 bg-card rounded">
                {p.fact || p.title || JSON.stringify(p)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Count/Generate dialog */}
      <Dialog open={openCountDialog} onOpenChange={setOpenCountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate facts</DialogTitle>
            <DialogDescription>
              Choose how many facts to generate (1–50).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={50}
                value={generateCount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGenerateCount(Number(e.target.value || 1))
                }
              />
              <Button
                onClick={async () => {
                  await generatePreview(generateCount);
                }}
                disabled={loading}
              >
                Generate
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (preview && preview.length) {
                    const lines = (preview || []).map(
                      (p: PreviewItem) =>
                        p.fact ||
                        p.fact_text ||
                        p.title ||
                        p.description ||
                        p.text ||
                        JSON.stringify(p),
                    );
                    setText(
                      lines
                        .map((l: unknown) => String(l).trim())
                        .filter(Boolean)
                        .join("\n"),
                    );
                    setOpenCountDialog(false);
                    toast({
                      title: "Inserted",
                      description: `Inserted ${lines.length} generated items into the editor.`,
                    });
                  }
                }}
                disabled={!preview || preview.length === 0}
              >
                Use results
              </Button>
            </div>
            {preview && preview.length > 0 ? (
              <div className="mt-3">
                <h4 className="font-semibold">Preview</h4>
                <div className="mt-2 grid gap-2 max-h-48 overflow-y-auto">
                  {preview.map((p: PreviewItem, i: number) => (
                    <div key={i} className="p-2 rounded bg-card">
                      {p.fact ||
                        p.fact_text ||
                        p.title ||
                        p.description ||
                        JSON.stringify(p)}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm import ({confirmLines.length} facts)
            </DialogTitle>
            <DialogDescription>
              You're about to create {confirmLines.length} facts; each non-empty
              line will be a separate fact. Confirm to proceed.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 max-h-64 overflow-y-auto grid gap-2">
            {confirmLines.slice(0, 20).map((l, i) => (
              <div key={i} className="p-2 rounded bg-card text-sm">
                {l}
              </div>
            ))}
            {confirmLines.length > 20 ? (
              <div className="text-xs text-muted-foreground">
                ...and {confirmLines.length - 20} more
              </div>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => confirmBulkAndSave(false)}>
              Save Drafts
            </Button>
            <Button onClick={() => confirmBulkAndSave(true)}>Publish</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* show skipped lines if any */}
      {skippedLines.length > 0 && (
        <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
          <strong>Some lines failed to save:</strong>
          <ul className="mt-2 list-disc list-inside">
            {skippedLines.map((s, i) => (
              <li key={i}>
                <span className="font-semibold">Line {s.index + 1}:</span>{" "}
                {s.line} —{" "}
                {(() => {
                  const e = s.error;
                  if (e && typeof e === "object") {
                    const obj = e as Record<string, unknown>;
                    const msg = obj["message"];
                    if (typeof msg === "string") return msg;
                    try {
                      return JSON.stringify(obj);
                    } catch (_err) {
                      return String(e);
                    }
                  }
                  return String(e ?? "error");
                })()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FactsEdit;
