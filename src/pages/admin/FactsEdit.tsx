import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const FactsEdit: React.FC = () => {
  const { id: editId } = useParams<{ id?: string }>();
  const [category, setCategory] = useState<string>('');
  const [subcategory, setSubcategory] = useState<string>('');
  // keep the Select controlled for its whole lifecycle by using an empty string
  // as the initial value instead of null/undefined
  const [factTypeId, setFactTypeId] = useState<string>('');
  const [country, setCountry] = useState('');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  const factTypesQ = useQuery({ queryKey: ['admin','fact-types'], queryFn: async () => {
    const { data } = await supabase.from('fact_types').select('*').order('name');
    return data || [];
  } });
  const factTypes = (factTypesQ?.data as any) || [];

  const catsQ = useQuery({ queryKey: ['admin','categories', factTypeId], queryFn: async () => {
    if (!factTypeId) return [];
    const { data } = await supabase.from('categories').select('*').eq('fact_type_id', factTypeId).order('name');
    return data || [];
  }, enabled: factTypeId !== '' });
  const categories = (catsQ?.data as any) || [];

  const _factQ = useQuery({ queryKey: ['admin','fact', editId], queryFn: async () => {
    if (!editId) return null;
    const { data } = await supabase.from('facts').select('*').eq('id', editId).single();
    return data || null;
  }, enabled: !!editId });
  const factData = _factQ?.data;
  useEffect(() => {
    if (!factData) return;

    // When loading an existing fact, try to resolve category/subcategory ids
    // from names if only names are present in the row. This ensures the
    // Select components receive the matching option values (ids as strings)
    // and show the previously-selected values.
    (async () => {
      // fact type
      const ft = factData.fact_type_id != null ? String(factData.fact_type_id) : (factData.fact_type || '');
      setFactTypeId(ft);

      // category: prefer id; if only a name is present, try to look it up
      if (factData.category_id != null) {
        setCategory(String(factData.category_id));
      } else if (factData.category) {
        try {
          const catResp: any = await supabase.from('categories').select('id').ilike('name', factData.category).maybeSingle();
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
        setCategory('');
      }

      // subcategory: prefer id; if only a name is present, try to look it up
      if (factData.subcategory_id != null) {
        setSubcategory(String(factData.subcategory_id));
      } else if (factData.subcategory) {
        try {
          const subResp: any = await supabase.from('subcategories').select('id,category_id').ilike('name', factData.subcategory).maybeSingle();
          const sub = subResp?.data || null;
          if (sub) {
            setSubcategory(String(sub.id));
            // ensure category matches the subcategory's category if we don't have it
            if (!factData.category_id && (!factData.category || factData.category === '')) {
              setCategory(String(sub.category_id));
            }
          } else {
            setSubcategory(factData.subcategory);
          }
        } catch (e) {
          setSubcategory(factData.subcategory);
        }
      } else {
        setSubcategory('');
      }

      setCountry(factData.country || '');
      setText(factData.fact_text || '');
    })();
  }, [factData]);

  // load current user id to set created_by on generated/persisted facts
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp: any = await supabase.auth.getUser();
        const user = resp?.data?.user || null;
        if (mounted && user) setAdminUserId(user.id);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (category) fetchSubcategories(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, categories]);

  const fetchSubcategories = async (catIdOrName: string) => {
    const catId = catIdOrName;
    const { data } = await supabase.from('subcategories').select('*').eq('category_id', catId).order('name');
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
      const fdType = factData.fact_type_id != null ? String(factData.fact_type_id) : String(factData.fact_type || '');
      if (String(factTypeId) === fdType) return;
    }

    setCategory('');
    setSubcategory('');
    setSubcategories([]);
  }, [factTypeId, factData]);

  // helper to create a slug for fuzzy matching
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // When categories finish loading and we're editing an existing fact,
  // ensure the category select gets the correct id string value so the
  // Select can show the selected option. This covers cases where the
  // fact row stores only a category name instead of category_id.
  useEffect(() => {
    if (!factData) return;
    if (!categories || categories.length === 0) return;
    // if category already set to an id/string, don't override
    if (category && category !== '') return;

    (async () => {
      // prefer explicit category_id from the fact row
      if (factData.category_id != null) {
        setCategory(String(factData.category_id));
        return;
      }
      const name = (factData.category || '').trim();
      if (!name) return;
      // try exact, case-insensitive, then slug match
      let found = categories.find((c:any) => c.id != null && String(c.id) === String(factData.category_id));
      if (!found) found = categories.find((c:any) => c.name === name);
      if (!found) found = categories.find((c:any) => (c.name || '').toLowerCase() === name.toLowerCase());
      if (!found) {
        const target = slugify(name);
        found = categories.find((c:any) => slugify(c.name || '') === target);
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
    if (subcategory && subcategory !== '') return;

    (async () => {
      if (factData.subcategory_id != null) {
        setSubcategory(String(factData.subcategory_id));
        return;
      }
      const name = (factData.subcategory || '').trim();
      if (!name) return;
      // try exact, case-insensitive, slug
      let found = subcategories.find((s:any) => s.id != null && String(s.id) === String(factData.subcategory_id));
      if (!found) found = subcategories.find((s:any) => s.name === name);
      if (!found) found = subcategories.find((s:any) => (s.name || '').toLowerCase() === name.toLowerCase());
      if (!found) {
        const target = slugify(name);
        found = subcategories.find((s:any) => slugify(s.name || '') === target);
      }
      if (found) setSubcategory(String(found.id));
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcategories, factData]);

  const generatePreview = async () => {
    setLoading(true);
    try {
      if (!factTypeId || !category) {
        toast({ title: 'Missing selection', description: 'Please choose a fact type and category before generating.', variant: 'destructive' });
        setLoading(false);
        return;
      }
  const url = (import.meta.env.VITE_GENERATE_FACT_URL as string) || (import.meta.env.VITE_GENERATE_FACTS_URL as string) || '/.netlify/functions/generate-facts';
      // find selected names to give the AI a friendly prompt
      const ft = factTypes.find((f:any)=>f.id===factTypeId) || null;
      const catObj = categories.find((c:any)=>c.id===category) || null;
      const subObj = subcategories.find((s:any)=>s.id===subcategory) || null;
      const body: any = {
        // send both friendly names and ids so server functions can accept either
        fact_type: ft?.name || null,
        fact_type_id: factTypeId || null,
        category: catObj?.name || null,
        category_id: category || null,
        subcategory: subObj?.name || null,
        subcategory_id: subcategory || null,
        country: country || null,
        count: 1,
      };

      console.log('generatePreview -> POST', url, body);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => null);
          throw new Error(text || 'AI generation failed. Please try again.');
        }

        const json = await res.json().catch(() => null);
        console.log('generatePreview response', json);
        const items = (json && (json.data || json.items || json)) || [];
        const arr = Array.isArray(items) ? items : [items];
        setPreview(arr);

        // populate the editor with the first generated item if present
        if (arr.length > 0) {
          const first = arr[0];
          const candidate = first.fact || first.fact_text || first.description || first.title || first.text || null;
          if (candidate) setText(candidate);
        }
      } catch (outerErr) {
        // network/CORS failure or other issue calling the external endpoint. Try supabase.functions.invoke
        console.warn('Primary fetch failed, attempting supabase.functions.invoke fallback', outerErr);
        try {
          const inv = await supabase.functions.invoke('generate-facts', { body });
          if ((inv as any).error) throw (inv as any).error;
          const payload = (inv as any).data || (inv as any);
          const items = (payload && (payload.data || payload.items || payload)) || [];
          const arr = Array.isArray(items) ? items : [items];
          setPreview(arr);
          if (arr.length > 0) {
            const candidate = arr[0].fact || arr[0].fact_text || arr[0].description || arr[0].title || arr[0].text || null;
            if (candidate) setText(candidate);
          }
          return;
        } catch (invErr) {
          console.error('Fallback invoke failed', invErr);
          throw outerErr;
        }
      }
    } catch (e) {
      console.error('generatePreview error', e);
      const message = (e as any)?.message || 'AI generation failed. Please try again.';
      toast({ title: 'AI error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateAndPersist = async () => {
    if (!factTypeId || !category) {
      toast({ title: 'Missing selection', description: 'Please choose a fact type and category before generating.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
  const url = (import.meta.env.VITE_GENERATE_FACT_URL as string) || (import.meta.env.VITE_GENERATE_FACTS_URL as string) || '/.netlify/functions/generate-facts';
      const ft = factTypes.find((f:any)=>f.id===factTypeId) || null;
      const catObj = categories.find((c:any)=>c.id===category) || null;
      const subObj = subcategories.find((s:any)=>s.id===subcategory) || null;
      const body: any = {
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
      console.log('generateAndPersist -> POST', url, body);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      console.log('generateAndPersist response', json);
      if (json.error) {
        toast({ title: 'Error', description: json.error, variant: 'destructive' });
        console.error('generateAndPersist error', json);
      } else {
        const items = json.data || [];
        setPreview(items);
        const count = Array.isArray(items) ? items.length : 1;
        toast({ title: 'Saved', description: `Generated and persisted ${count} fact${count>1?'s':''} as drafts.` });
        qc.invalidateQueries({ queryKey: ['admin','facts'] });
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to generate and persist facts.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveMut = useMutation({ mutationFn: async (payload:{publish?:boolean}) => {
    // For edits: mark edited facts as 'pending' so they require re-approval.
    if (editId) {
      const status = 'pending';
      return supabase.from('facts').update({ fact_type_id: factTypeId || null, category_id: category || null, subcategory_id: subcategory || null, country, fact_text: text, status }).eq('id', editId);
    } else {
      const status = payload.publish ? 'approved' : 'draft';
      return supabase.from('facts').insert([{ fact_type_id: factTypeId || null, category_id: category || null, subcategory_id: subcategory || null, country, fact_text: text, status, created_by: adminUserId }]).select('id');
    }
  } });

  const handleSave = async (publishFlag = false) => {
    setSaving(true);
    try {
      const res:any = await (saveMut as any).mutateAsync({ publish: publishFlag });
  qc.invalidateQueries({ queryKey: ['admin','facts'] });
      // If created, try to redirect to edit page using returned id
      if (!editId && res && res.data && res.data.length && res.data[0].id) {
        const newId = res.data[0].id;
        toast({ title: 'Created', description: 'Fact created. Redirecting to edit page.' });
        navigate(`/admin/facts/${newId}/edit`);
        return;
      }
      toast({ title: publishFlag ? 'Published' : 'Saved', description: publishFlag ? 'Fact published.' : 'Draft saved.' });
      navigate('/admin/facts');
    } catch (e:any) {
      console.error(e);
      const message = e?.message || e?.error?.message || 'Failed to save fact.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => handleSave(false);
  const publish = () => handleSave(true);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Fact' : 'New Fact'}</h2>
      <div className="grid gap-2 mb-4">
        <label className="text-sm">Fact Type</label>
  <Select onValueChange={(v:any)=>setFactTypeId(v)} value={factTypeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select fact type" />
          </SelectTrigger>
          <SelectContent>
            {factTypesQ.isLoading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}
            {!factTypesQ.isLoading && factTypes.length === 0 && <div className="p-2 text-sm text-muted-foreground">No fact types found</div>}
            {factTypes.map((ft:any)=>(<SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <label className="text-sm">Category</label>
  <Select onValueChange={(v:any)=>setCategory(v)} value={category} disabled={factTypeId === ''}>
          <SelectTrigger>
            <SelectValue placeholder={factTypeId ? "Select category" : "Select fact type first"} />
          </SelectTrigger>
          <SelectContent>
            {catsQ.isLoading && <div className="p-2 text-sm text-muted-foreground">Loading...</div>}
            {!catsQ.isLoading && categories.length === 0 && <div className="p-2 text-sm text-muted-foreground">{factTypeId ? 'No categories found' : 'Select fact type first'}</div>}
            {categories.map((c:any)=>(<SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>

        <label className="text-sm">Subcategory</label>
  <Select onValueChange={(v:any)=>setSubcategory(v)} value={subcategory} disabled={category === ''}>
          <SelectTrigger>
            <SelectValue placeholder={category ? "Select subcategory" : "Select category first"} />
          </SelectTrigger>
          <SelectContent>
            {subcategories.length === 0 && <div className="p-2 text-sm text-muted-foreground">{category ? 'No subcategories found' : 'Select category first'}</div>}
            {subcategories.map((s:any)=>(<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground mt-1">Optional — leave blank to save under category</div>

        <Input placeholder="Country (optional)" value={country} onChange={(e:any)=>setCountry(e.target.value)} />
        <textarea className="p-2 border rounded" placeholder="Fact text" value={text} onChange={(e:any)=>setText(e.target.value)} />
      </div>
      <div className="flex gap-2">
  <Button onClick={generatePreview} disabled={loading || factTypeId === '' || category === ''}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generate with AI
        </Button>
        <Button onClick={saveDraft} variant="outline" disabled={loading}>Save Draft</Button>
        <Button onClick={publish} disabled={loading}>Publish</Button>
      </div>

      {preview.length>0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Preview</h3>
          <div className="grid gap-2">
            {preview.map((p:any, i:number)=> (
              <div key={i} className="p-3 bg-card rounded">{p.fact || p.title || JSON.stringify(p)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FactsEdit;
