/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
// dnd-kit imports are loaded dynamically so the dev server can run even if
// the packages aren't installed. We provide a non-dnd fallback UI.
// Safe dynamic loader for the DnD builder. Some environments (duplicate React
// copies, incompatible dnd-kit versions) can throw during module evaluation.
// We import dynamically inside an effect and fall back to the static UI if
// loading fails so the page doesn't crash.
function DynamicQuizBuilder(props: any) {
  const { questions, setQuestions, setQuestionsJson } = props;
  const [Comp, setComp] = React.useState<React.ComponentType<any> | null>(null);
  const [error, setError] = React.useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('./QuizBuilderDnd');
        if (mounted && mod && mod.default) setComp(() => mod.default);
      } catch (e) {
        console.warn('Failed to load QuizBuilderDnd, falling back to static builder', e);
        if (mounted) setError(e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (Comp) return <Comp questions={questions} setQuestions={setQuestions} setQuestionsJson={setQuestionsJson} />;
  // If loading failed or still pending, render the StaticQuestion list as fallback
  return (
    <div className="space-y-3">
      {questions.map((qq:any, qi:number) => (<StaticQuestion key={qq.id || qq._localId || qi} qi={qi} qq={qq} questions={questions} setQuestions={setQuestions} setQuestionsJson={setQuestionsJson} />))}
    </div>
  );
}

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackRender?: () => React.ReactNode;
}

type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    // swallow or log
    console.error('ErrorBoundary caught', error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallbackRender ? this.props.fallbackRender() : null;
    }
    return this.props.children;
  }
}

// SortableQuestion and dnd-kit specific helpers were moved to the
// `QuizBuilderDnd` module. This file keeps the StaticQuestion fallback and
// dynamically loads the DnD builder. Keeping a duplicate SortableQuestion
// here caused references to `useSortable`/`CSS` without imports and produced
// red-squiggles; remove the duplicate implementation to avoid lint/runtime
// issues in environments where dnd-kit isn't available.

// Local helper to move array elements when dnd-kit isn't present or
// when we prefer a small local implementation.
function arrayMoveLocal(arr:any[], from:number, to:number) {
  const copy = arr.slice();
  if (from < 0 || from >= copy.length || to < 0 || to >= copy.length) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

// Static (non-draggable) question card used as a fallback when dnd-kit
// cannot be resolved. Provides up/down buttons for reordering.
function StaticQuestion({ qi, qq, questions, setQuestions, setQuestionsJson } : any) {
  const updateQuestion = (updater: (q:any)=>void) => {
    const copy = [...questions];
    updater(copy[qi]);
    setQuestions(copy); setQuestionsJson(JSON.stringify(copy,null,2));
  };
  return (
    <div className="p-3 border rounded">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Input value={qq.q} onChange={(e:any)=> updateQuestion((q:any)=>{ q.q = e.target.value; })} placeholder={`Question ${qi+1}`} />
          <div className="mt-2">
            <div className="text-sm font-semibold mb-1">Options</div>
            {qq.options && qq.options.map((opt:any, oi:number) => (
              <div key={oi} className="flex gap-2 items-center mb-2">
                <Input value={opt} onChange={(e:any)=> updateQuestion((q:any)=>{ q.options[oi] = e.target.value; })} />
                <Button variant="outline" onClick={()=> updateQuestion((q:any)=>{ q.options.splice(oi,1); if (q.answer >= q.options.length) q.answer = Math.max(0, q.options.length-1); }) }>Remove</Button>
                <Button variant="outline" onClick={()=> updateQuestion((q:any)=>{ q.answer = oi; }) } className="text-xs">Set Correct</Button>
                {qq.answer===oi && <div className="text-xs text-green-600">Correct</div>}
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={()=> updateQuestion((q:any)=>{ q.options.push(''); }) }>Add option</Button>
              <Button variant="outline" onClick={()=>{ const copy=[...questions]; const dup = JSON.parse(JSON.stringify(copy[qi])); copy.splice(qi+1,0,dup); setQuestions(copy); setQuestionsJson(JSON.stringify(copy,null,2)); }}>Duplicate</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="p-2 border rounded">Drag (install dnd-kit for real drag)</div>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" onClick={()=>{ if (qi>0) { const copy = arrayMoveLocal(questions, qi, qi-1); setQuestions(copy); setQuestionsJson(JSON.stringify(copy,null,2)); } }}>&uarr;</Button>
            <Button variant="ghost" onClick={()=>{ if (qi<questions.length-1) { const copy = arrayMoveLocal(questions, qi, qi+1); setQuestions(copy); setQuestionsJson(JSON.stringify(copy,null,2)); } }}>&darr;</Button>
            <Button variant="destructive" onClick={()=>{ const copy=[...questions]; copy.splice(qi,1); setQuestions(copy); setQuestionsJson(JSON.stringify(copy,null,2)); }}>Remove</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const QuizEdit: React.FC = () => {
  const { id: editId } = useParams<{ id?: string }>();
  const [country, setCountry] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionsJson, setQuestionsJson] = useState('[]');
  const [questions, setQuestions] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [factTypeId, setFactTypeId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('draft');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const quizQ = useQuery({ queryKey: ['admin','quiz', editId], queryFn: async () => { if (!editId) return null; const { data } = await supabase.from('quizzes').select('*').eq('id', editId).single(); return data || null; }, enabled: !!editId });

  // Admin generation helpers (moved here so generation is available on New Quiz page)
  const factTypesQ = useQuery({ queryKey: ['admin','fact_types'], queryFn: async () => { const { data } = await supabase.from('fact_types').select('*').order('name'); return data || []; } });
  const factTypes = (factTypesQ?.data as any) || [];

  const [selectedFactTypeSlug, setSelectedFactTypeSlug] = useState<string | null>(null);
  const categoriesForTypeQ = useQuery({ queryKey: ['admin','categories','byFactType', selectedFactTypeSlug], queryFn: async () => {
    if (!selectedFactTypeSlug) return [];
    // resolve fact_type id from slug first (selectedFactTypeSlug stores slug)
    const { data: ft } = await supabase.from('fact_types').select('id,slug').eq('slug', selectedFactTypeSlug).single();
    if (!ft || !ft.id) return [];
    const { data } = await supabase.from('categories').select('*').eq('fact_type_id', ft.id).order('name');
    return data || [];
  }, enabled: !!selectedFactTypeSlug });
  const categoriesForType = (categoriesForTypeQ?.data as any) || [];

  const [selectedCatForType, setSelectedCatForType] = useState<string | null>(null);

  const [selectedCountryForType, setSelectedCountryForType] = useState<string | null>(null);
  const countriesForTypeQ = useQuery({ queryKey: ['admin','facts','countries', selectedFactTypeSlug], queryFn: async () => { if (!selectedFactTypeSlug) return []; // find fact_type id by slug
    const { data: ft } = await supabase.from('fact_types').select('id,slug').eq('slug', selectedFactTypeSlug).single(); if (!ft || !ft.id) return []; const { data } = await supabase.from('facts').select('country').eq('fact_type_id', ft.id).not('country','is', null); const unique = Array.from(new Set((data || []).map((r:any)=>r.country).filter(Boolean))).sort(); return unique; }, enabled: !!selectedFactTypeSlug });
  const countriesForType = (countriesForTypeQ?.data as any) || [];

  const [generating, setGenerating] = useState(false);
  const [generatedQuizzes, setGeneratedQuizzes] = useState<any[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  // local generator: fetch facts matching filters and build simple multiple-choice questions
  const shuffle = (arr:any[]) => arr.slice().sort(() => Math.random() - 0.5);

  const generateLocally = async ({ mode, fact_type_slug, category_id, country, count }: any) => {
    // resolve fact_type id if slug provided
    let factTypeId: string | null = null;
    if (fact_type_slug) {
      const { data: ft } = await supabase.from('fact_types').select('id,slug').eq('slug', fact_type_slug).single();
      if (ft && ft.id) factTypeId = ft.id;
    }

    // build base query
    let q = supabase.from('facts').select('*').eq('status', 'approved');
    if (mode === 'random') {
      q = q.order('id', { ascending: false }).limit(count || 10).order('created_at', { ascending: false });
    }
    if (factTypeId) q = q.eq('fact_type_id', factTypeId);
    if (category_id) q = q.eq('category_id', category_id);
    if (country) q = q.eq('country', country);

    // For randomness, use RPC/randomization via order('random') if supported; fallback to client-side shuffle
    const { data } = await q.limit(count || 10);
    const facts = data || [];

    // For each fact, pick up to 3 distractors from same fact_type
    const questions:any[] = [];
    for (const f of facts) {
      // fetch distractors
      const { data: others } = await supabase.from('facts').select('*').neq('id', f.id).eq('fact_type_id', f.fact_type_id).limit(10);
      const pool = (others || []).map((o:any)=>o.fact_text).filter(Boolean);
      const distractors = shuffle(pool).slice(0,3);
      const correct = f.fact_text;
      const options = shuffle([correct, ...distractors]);
      questions.push({ question: correct, options, correct_answer: correct, fact_id: f.id, fact_type_id: f.fact_type_id, category_id: f.category_id || category_id, country: f.country || country, difficulty });
    }
    return questions;
  };

  // Try AI endpoint first, fall back to local generator
  const generateViaFunction = async (payload: any) => {
    const generateUrl = (import.meta.env.VITE_GENERATE_QUIZ_URL as string) || '';
    try {
      if (generateUrl) {
        const res = await fetch(generateUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Generation endpoint failed');
        const j = await res.json();
        return j.data || j;
      }
    } catch (e) {
      console.warn('AI generation failed, falling back to local generator', e);
    }
    return await generateLocally(payload);
  };

  const handleGenerateRandom = async () => {
    setGenerating(true);
    try {
      const data = await generateViaFunction({ mode: 'random', count: questionCount });
      setGeneratedQuizzes(data || []);
      toast({ title: 'Generated', description: `✅ ${ (data||[]).length } quizzes generated.` });
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Generation failed', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  const handleGenerateByFactType = async () => {
    if (!selectedFactTypeSlug) return toast({ title: 'Select type', description: 'Please select a fact type first.', variant: 'destructive' });
    setGenerating(true);
    try {
      const data = await generateViaFunction({ mode: 'fact_type', fact_type_slug: selectedFactTypeSlug, category_id: selectedCatForType, count: questionCount });
      setGeneratedQuizzes(data || []);
      toast({ title: 'Generated', description: `✅ ${ (data||[]).length } quizzes generated for ${selectedFactTypeSlug}.` });
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Generation failed', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  const handleGenerateByCountry = async () => {
    if (!selectedFactTypeSlug || !selectedCountryForType) return toast({ title: 'Select options', description: 'Please select fact type and country.', variant: 'destructive' });
    setGenerating(true);
    try {
      const data = await generateViaFunction({ mode: 'country', fact_type_slug: selectedFactTypeSlug, country: selectedCountryForType, count: questionCount });
      setGeneratedQuizzes(data || []);
      toast({ title: 'Generated', description: `✅ ${ (data||[]).length } quizzes generated for ${selectedCountryForType}.` });
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Generation failed', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  // Generate random quiz from pre-existing approved/published quizzes in DB
  const handleGenerateRandomFromApproved = async () => {
    setGenerating(true);
    try {
      const { data } = await supabase.from('quizzes').select('*').eq('status', 'published').limit(200);
      const pool = data || [];
      const shuffled = shuffle(pool).slice(0, questionCount);
      // map to the preview shape
      const mapped = shuffled.map((q:any) => ({ question: q.question || q.questions?.[0]?.question || q.question_text || '', options: q.options || q.questions?.[0]?.options || [], correct_answer: q.correct_answer || (q.questions?.[0]?.correct_answer) || null, id: q.id }));
      setGeneratedQuizzes(mapped);
      toast({ title: 'Generated', description: `✅ ${mapped.length} quizzes selected from approved pool.` });
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Failed to fetch approved quizzes', variant: 'destructive' });
    } finally { setGenerating(false); }
  };

  const publishQuiz = async (id: string) => {
    try {
      const { error } = await supabase.from('quizzes').update({ status: 'published' }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Published', description: 'Quiz published.' });
      qc.invalidateQueries({ queryKey: ['admin','quizzes'] });
      // remove from preview list
      setGeneratedQuizzes((g) => g.filter(q => q.id !== id));
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Publish failed', variant: 'destructive' });
    }
  };

  const publishGenerated = async (g:any) => {
    try {
      // prevent duplicate quizzes for same fact_id
      if (g.fact_id) {
        const { data: exists } = await supabase.from('quizzes').select('id').eq('fact_id', g.fact_id).limit(1);
        if (exists && exists.length) {
          toast({ title: 'Skipped', description: 'A quiz for this fact already exists.', variant: 'destructive' });
          return;
        }
      }
      const payload:any = { question: g.question, options: g.options, correct_answer: g.correct_answer, fact_id: g.fact_id, fact_type_id: g.fact_type_id, category_id: g.category_id, country: g.country, difficulty: g.difficulty, status: 'published', created_by: adminUserId };
      const { data, error } = await supabase.from('quizzes').insert([payload]).select('id');
      if (error) throw error;
      toast({ title: 'Published', description: 'Generated quiz saved.' });
      qc.invalidateQueries({ queryKey: ['admin','quizzes'] });
      // remove from preview
      setGeneratedQuizzes((prev) => prev.filter(x => x !== g));
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Publish failed', variant: 'destructive' });
    }
  };

  const saveGeneratedAsDraft = async (g:any) => {
    try {
      const payload:any = { question: g.question, options: g.options, correct_answer: g.correct_answer, fact_id: g.fact_id, fact_type_id: g.fact_type_id, category_id: g.category_id, country: g.country, difficulty: g.difficulty, status: 'draft', created_by: adminUserId };
      const { data, error } = await supabase.from('quizzes').insert([payload]).select('id');
      if (error) throw error;
      toast({ title: 'Saved', description: 'Generated quiz saved as draft.' });
      qc.invalidateQueries({ queryKey: ['admin','quizzes'] });
      setGeneratedQuizzes((prev) => prev.filter(x => x !== g));
    } catch (e:any) {
      toast({ title: 'Error', description: e?.message || 'Save failed', variant: 'destructive' });
    }
  };

  // fetch categories for select
  const categoriesAllQ = useQuery({ queryKey: ['admin','categories','all'], queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('name'); return data || []; } });
  const categoriesAll = (categoriesAllQ?.data as any) || [];
  const categoriesByFactTypeQ = useQuery({ queryKey: ['admin','categories','byFactTypeForSave', factTypeId], queryFn: async () => { if (!factTypeId) return []; const { data } = await supabase.from('categories').select('*').eq('fact_type_id', factTypeId).order('name'); return data || []; }, enabled: !!factTypeId });
  const categories = factTypeId ? (categoriesByFactTypeQ?.data as any) || [] : categoriesAll;

  // fetch subcategories for selected category
  const subsQ = useQuery({ queryKey: ['admin','subcategories', categoryId], queryFn: async () => { if (!categoryId) return []; const { data } = await supabase.from('subcategories').select('*').eq('category_id', categoryId).order('name'); return data || []; }, enabled: !!categoryId });
  const subcategories = (subsQ?.data as any) || [];

  useEffect(() => {
    if (!quizQ?.data) return;
    // Resolve fact_type (id/slug/name) and category/subcategory names to ids so selects show correctly
    (async () => {
      const row = quizQ.data as any;
      // set simple fields
      setCountry(row.country || '');
      setDifficulty(row.difficulty || 'medium');
      const q = row.questions || [];
      setQuestions(q);
      setQuestionsJson(JSON.stringify(q, null, 2));

      // Resolve fact_type: prefer fact_type_id, otherwise try slug/name
      try {
        if (row.fact_type_id) {
          // try to fetch slug for UI generation controls
          const { data: ft } = await supabase.from('fact_types').select('id,slug').eq('id', row.fact_type_id).maybeSingle();
          if (ft && ft.slug) {
            setSelectedFactTypeSlug(ft.slug);
          }
          setFactTypeId(row.fact_type_id || null);
        } else if (row.fact_type) {
          // try to find fact_type by name
          const name = String(row.fact_type || '').trim();
          // try local cache first
          let found = (factTypes || []).find((f:any) => (f.name || '').toLowerCase() === name.toLowerCase() || (f.slug || '').toLowerCase() === name.toLowerCase());
          if (!found) {
            const { data: ft2 } = await supabase.from('fact_types').select('id,slug').ilike('name', name).limit(1).maybeSingle();
            found = ft2 || found;
          }
          if (found) {
            setFactTypeId(found.id || null);
            setSelectedFactTypeSlug(found.slug || null);
          }
        }
      } catch (e) {
        console.warn('Failed to resolve fact type for quiz edit', e);
      }

      // Resolve category: prefer id, otherwise try to match by name
      try {
        if (row.category_id) {
          setCategoryId(row.category_id || null);
          setSelectedCatForType(row.category_id || null);
        } else if (row.category) {
          const name = String(row.category || '').trim();
          // try to lookup in categories table
          const { data: cat } = await supabase.from('categories').select('id').ilike('name', name).limit(1).maybeSingle();
          if (cat && cat.id) {
            setCategoryId(String(cat.id));
            setSelectedCatForType(String(cat.id));
          }
        }
      } catch (e) {
        console.warn('Failed to resolve category for quiz edit', e);
      }

      // Resolve subcategory id if present (for editor fields)
      try {
        if (row.subcategory_id) {
          setSubcategoryId(row.subcategory_id || null);
        } else if (row.subcategory) {
          const name = String(row.subcategory || '').trim();
          const { data: sub } = await supabase.from('subcategories').select('id').ilike('name', name).limit(1).maybeSingle();
          if (sub && sub.id) setSubcategoryId(String(sub.id));
        }
      } catch (e) {
        console.warn('Failed to resolve subcategory for quiz edit', e);
      }
      // status
      try {
        if (row.status) setStatus(row.status);
      } catch (e) {
        // ignore
      }
    })();
  }, [quizQ?.data]);

  // load current user id to set created_by on generated/persisted quizzes
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

  const saveMut = useMutation({ mutationFn: async ({ publish }: { publish?: boolean } = {}) => {
    let payloadQuestions = questions;
    // If questions array empty, try parse the JSON textarea fallback
    if (!payloadQuestions || payloadQuestions.length === 0) {
      try { payloadQuestions = JSON.parse(questionsJson); } catch (e) { throw new Error('Questions must be valid JSON'); }
    }
  // basic client-side validation
  if (!factTypeId) throw new Error('Fact Type is required');
  if (!Array.isArray(payloadQuestions) || payloadQuestions.length === 0) throw new Error('At least one question is required');
    // call server-side validator (if available)
    try {
      const validateUrl = (import.meta.env.VITE_VALIDATE_QUIZ_URL as string) || '/.netlify/functions/validate-quiz';
      // If the env var is intentionally empty string, skip calling server validation
      if (validateUrl) {
        const res = await fetch(validateUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions: payloadQuestions }) });
        if (res.status >= 400) {
          const j = await res.json();
          const msg = (j && j.errors && j.errors.join('; ')) || 'Server-side validation failed';
          throw new Error(msg);
        }
      }
    } catch (e) {
      // If the validation function isn't deployed or the fetch fails, fall back to client-side validation only.
      // This keeps the editor usable during development or before deployment.
      console.debug('validate-quiz call failed or not available:', e);
    }
  const status = publish ? 'published' : 'draft';
  const payload:any = { fact_type_id: factTypeId, country, difficulty, questions: payloadQuestions, category_id: categoryId, subcategory_id: subcategoryId, status, created_by: adminUserId };
    if (editId) return supabase.from('quizzes').update(payload).eq('id', editId);
    return supabase.from('quizzes').insert([payload]).select('id');
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin','quizzes'] }); }, onError: (err:any) => { const message = err?.message || err?.error?.message || 'Failed to save quiz.'; toast({ title: 'Error', description: message, variant: 'destructive' }); } });

  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const res:any = await saveMut.mutateAsync({ publish });
      if (!editId && res && res.data && res.data.length && res.data[0].id) {
        const newId = res.data[0].id;
        toast({ title: publish ? 'Published' : 'Created', description: publish ? 'Quiz published.' : 'Quiz created.' });
        navigate(`/admin/quizzes/${newId}/edit`);
        return;
      }
      toast({ title: publish ? 'Published' : 'Saved', description: publish ? 'Quiz published.' : 'Quiz saved.' });
      navigate('/admin/quizzes');
    } catch (e) {
      // error handled in onError
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => handleSave(false);
  const handlePublish = async () => handleSave(true);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Quiz' : 'New Quiz'}</h2>
      <div className="grid gap-2 mb-4">
        {/* Admin generation panel (only in admin New/Edit) */}
        {!editId && (
          <div className="p-4 border rounded mb-4">
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-sm block mb-1">Fact Type</label>
                  <select value={selectedFactTypeSlug || ''} onChange={(e:any)=>{ setSelectedFactTypeSlug(e.target.value); setSelectedCatForType(null); setSelectedCountryForType(null); }} className="p-2 border rounded w-full">
                    <option value="">Choose type</option>
                    {factTypes.map((ft:any)=>(<option key={ft.slug} value={ft.slug}>{ft.name}</option>))}
                  </select>
                </div>

                <div>
                  <label className="text-sm block mb-1">Category (optional)</label>
                  <select value={selectedCatForType || ''} onChange={(e:any)=>setSelectedCatForType(e.target.value)} className="p-2 border rounded w-full">
                    <option value="">All categories</option>
                    {categoriesForType.map((c:any)=>(<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>

                {selectedFactTypeSlug === 'country-facts' && (
                  <div>
                    <label className="text-sm block mb-1">Country</label>
                    <select value={selectedCountryForType || ''} onChange={(e:any)=>setSelectedCountryForType(e.target.value)} className="p-2 border rounded w-full">
                      <option value="">Any</option>
                      {countriesForType.map((c:any)=>(<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm block mb-1">Count</label>
                  <input type="number" min={1} value={questionCount} onChange={(e:any)=>setQuestionCount(Math.max(1, Number(e.target.value) || 1))} className="w-32 p-2 border rounded" />
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleGenerateRandom} disabled={generating}>{generating ? 'Generating...' : 'Generate (from facts/AI)'}</Button>
                  <Button onClick={handleGenerateByFactType} disabled={generating || !selectedFactTypeSlug}>{generating ? 'Generating...' : 'Generate by Fact Type'}</Button>
                  <Button onClick={handleGenerateByCountry} disabled={generating || !selectedCountryForType}>{generating ? 'Generating...' : 'Generate by Country'}</Button>
                  <Button onClick={handleGenerateRandomFromApproved} disabled={generating}>{generating ? 'Selecting...' : 'Generate Random (from approved quizzes)'}</Button>
                </div>
              </div>
            {/* Preview panel for generated quizzes */}
            {generatedQuizzes.length > 0 && (
              <div className="mt-4 max-h-64 overflow-auto">
                {generatedQuizzes.map((g:any)=>(
                  <Card key={g.id} className="p-3 mb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{g.question}</div>
                        <div className="text-sm mt-2">
                          {(g.options || []).map((o:any, i:number)=>(<div key={i} className={`py-1 ${g.correct_answer===o? 'text-green-600 font-medium':'text-muted-foreground'}`}>{o}</div>))}
                        </div>
                      </div>
                            <div className="flex flex-col gap-2 ml-4">
                              {!g.id ? (
                                  <>
                                    <Button onClick={() => saveGeneratedAsDraft(g)} variant="outline">💾 Save Draft</Button>
                                    <Button onClick={() => publishGenerated(g)} variant="ghost">✅ Publish</Button>
                                  </>
                                ) : (
                                  <>
                                    <Button onClick={()=>publishQuiz(g.id)} variant="outline">✅ Publish</Button>
                                    <Button onClick={()=>navigate(`/admin/quizzes/${g.id}/edit`)}>📝 Edit</Button>
                                  </>
                                )}
                            </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        <label className="text-sm">Fact Type</label>
        <Select onValueChange={(v:any)=>setFactTypeId(v)} value={factTypeId || ''}>
          <SelectTrigger>
            <SelectValue placeholder="Select fact type" />
          </SelectTrigger>
          <SelectContent>
            {factTypes.map((ft:any)=>(<SelectItem key={ft.id} value={String(ft.id)}>{ft.name}</SelectItem>))}
          </SelectContent>
        </Select>

        <label className="text-sm">Category</label>
        <Select onValueChange={(v:any)=>setCategoryId(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c:any)=>(<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>

        <label className="text-sm">Country (optional)</label>
        <Input value={country} onChange={(e:any)=>setCountry(e.target.value)} />

        <label className="text-sm">Difficulty</label>
        <select value={difficulty} onChange={(e:any)=>setDifficulty(e.target.value)} className="p-2 border rounded">
          <option value="easy">easy</option>
          <option value="medium">medium</option>
          <option value="hard">hard</option>
        </select>

        <label className="text-sm">Questions</label>
        <div className="space-y-3">
          {questions.length === 0 && <div className="p-3 bg-card rounded">No questions yet. Use "Add question" to start.</div>}

          {/* If there's exactly one question, show single-question vertical editor */}
          {questions.length === 1 && (() => {
            const single = questions[0] || {};
            // normalize fields
            const qText = single.question || single.q || single.question_text || '';
            const opts = single.options || single.opts || single.choices || [];
            const correct = single.correct_answer || single.correct || single.answer || null;

            const updateSingle = (patch: any) => {
              const copy = [...questions];
              const curr = Object.assign({}, copy[0] || {});
              Object.assign(curr, patch);
              // normalize to { question, options, correct_answer }
              if (patch.question_text !== undefined) curr.question = patch.question_text;
              copy[0] = curr;
              setQuestions(copy);
              setQuestionsJson(JSON.stringify(copy, null, 2));
            };

            const setOption = (idx:number, val:string) => {
              const next = Array.isArray(opts) ? opts.slice() : [];
              next[idx] = val;
              updateSingle({ options: next });
            };
            const addOption = () => updateSingle({ options: [...(opts||[]), ''] });
            const removeOption = (idx:number) => { const next = (opts||[]).slice(); next.splice(idx,1); updateSingle({ options: next }); };
            const setCorrect = (val:string) => updateSingle({ correct_answer: val });

            return (
              <div className="p-3 border rounded">
                <div className="mb-2">
                  <label className="text-sm block mb-1">Question</label>
                  <textarea className="w-full p-2 border rounded" value={qText} onChange={(e:any)=>updateSingle({ question: e.target.value })} />
                </div>
                <div className="mb-2">
                  <div className="text-sm font-semibold mb-1">Options</div>
                  {(opts || []).map((opt:string, oi:number) => (
                    <div key={oi} className="flex items-center gap-2 mb-2">
                      <input className="flex-1 p-2 border rounded" value={opt} onChange={(e:any)=>setOption(oi, e.target.value)} />
                      <label className="flex items-center gap-1">
                        <input type="radio" name="correct" checked={String(correct)===String(opt)} onChange={()=>setCorrect(opt)} />
                        <span className="text-sm">Correct</span>
                      </label>
                      <Button variant="destructive" onClick={()=>removeOption(oi)}>Remove</Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={addOption}>Add option</Button>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="text-sm block mb-1">Correct Answer</label>
                  <div className="text-sm text-muted-foreground">Select the correct answer using the radio next to an option above.</div>
                </div>
                <div className="mb-2">
                  <label className="text-sm block mb-1">Status</label>
                  <select className="p-2 border rounded" value={status} onChange={(e:any)=>setStatus(e.target.value)}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            );
          })()}

          {/* Multi-question builder (drag/drop or static) */}
          {/* ErrorBoundary catches runtime errors from dnd-kit and falls back to static UI */}
          <ErrorBoundary fallbackRender={() => (
            <div className="space-y-3">
              {questions.map((qq, qi) => (
                <StaticQuestion key={qq.id || qq._localId || qi} qi={qi} qq={qq} questions={questions} setQuestions={setQuestions} setQuestionsJson={setQuestionsJson} />
              ))}
            </div>
          )}>
            <React.Suspense fallback={<div className="space-y-3">{questions.map((qq, qi) => (<StaticQuestion key={qq.id || qq._localId || qi} qi={qi} qq={qq} questions={questions} setQuestions={setQuestions} setQuestionsJson={setQuestionsJson} />))}</div>}>
              <DynamicQuizBuilder questions={questions} setQuestions={setQuestions} setQuestionsJson={setQuestionsJson} />
            </React.Suspense>
          </ErrorBoundary>

          <div className="flex gap-2">
            <Button onClick={()=>{ const copy=[...questions]; copy.push({ q: '', options: ['',''], answer: 0 }); setQuestions(copy); setQuestionsJson(JSON.stringify(copy,null,2)); }}>Add question</Button>
            <Button variant="outline" onClick={()=>{ try { const parsed = JSON.parse(questionsJson); if (Array.isArray(parsed)) { setQuestions(parsed); toast({ title: 'Loaded', description: 'Questions loaded from JSON.' }); } else { toast({ title: 'Error', description: 'JSON must be an array', variant: 'destructive' }); } } catch (e) { toast({ title: 'Error', description: 'Invalid JSON', variant: 'destructive' }); } }}>Load from JSON</Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSaveDraft} disabled={saving}>{saving ? 'Saving...' : 'Save Draft'}</Button>
        <Button onClick={handlePublish} disabled={saving} variant="secondary">Publish</Button>
        <Button variant="outline" onClick={() => navigate('/admin/quizzes')}>Cancel</Button>
      </div>
    </div>
  );
};

export default QuizEdit;
