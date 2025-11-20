import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const CategoryEdit: React.FC = () => {
  const { id: editId } = useParams<{ id?: string }>();
  const [name, setName] = useState('');
  const [type, setType] = useState('fun');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Subcategory states
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingSubDesc, setEditingSubDesc] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const catQ = useQuery({ queryKey: ['admin','category', editId], queryFn: async () => { if (!editId) return null; const { data } = await supabase.from('categories').select('*').eq('id', editId).single(); return data || null; }, enabled: !!editId });

  useEffect(() => {
    if (catQ?.data) {
      setName(catQ.data.name || '');
      // Normalize stored type values to our select options. DB may store 'fun-facts' or 'fun'
      const rawType = (catQ.data.type || 'fun').toString();
      let normalized = 'fun';
      if (/world/i.test(rawType)) normalized = 'world';
      else if (/country/i.test(rawType)) normalized = 'country';
      else if (/fun/i.test(rawType)) normalized = 'fun';
      setType(normalized);
      setDescription(catQ.data.description || '');
    }
  }, [catQ?.data]);

  const saveMut = useMutation({ mutationFn: async (payload:{}) => {
    if (editId) return supabase.from('categories').update({ name, type, description }).eq('id', editId);
    return supabase.from('categories').insert([{ name, type, description }]).select('id');
  }, onSuccess: (res:any) => { qc.invalidateQueries({ queryKey: ['admin','categories'] }); }, onError: (err:any) => { const message = err?.message || err?.error?.message || 'Failed to save category.'; toast({ title: 'Error', description: message, variant: 'destructive' }); } });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res:any = await saveMut.mutateAsync({});
      // redirect to edit if newly created
      if (!editId && res && res.data && res.data.length && res.data[0].id) {
        const newId = res.data[0].id;
        toast({ title: 'Created', description: 'Category created.' });
        navigate(`/admin/categories/${newId}/edit`);
        return;
      }
      toast({ title: 'Saved', description: 'Category saved.' });
      navigate('/admin/categories');
    } catch (e) {
      // error handled in onError
    } finally {
      setSaving(false);
    }
  };

  // Subcategories queries & mutations
  const subsQ = useQuery({
    queryKey: ['admin','subcategories', editId],
    queryFn: async () => {
      if (!editId) return [];
      const { data, error } = await supabase.from('subcategories').select('*').eq('category_id', editId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!editId
  });

  const createSubMut = useMutation({ mutationFn: async (payload:{}) => {
    if (!editId) throw new Error('Save the category before adding subcategories');
    return supabase.from('subcategories').insert([{ category_id: editId, name: newSubName, description: newSubDesc }]).select();
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin','subcategories', editId] }); qc.invalidateQueries({ queryKey: ['admin','categories'] }); setNewSubName(''); setNewSubDesc(''); toast({ title: 'Created', description: 'Subcategory created.' }); }, onError: (err:any) => { const message = err?.message || err?.error?.message || 'Failed to create subcategory.'; toast({ title: 'Error', description: message, variant: 'destructive' }); } });

  const updateSubMut = useMutation({ mutationFn: async (payload:{id:string}) => {
    return supabase.from('subcategories').update({ name: editingSubName, description: editingSubDesc }).eq('id', payload.id);
  }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin','subcategories', editId] }); setEditingSubId(null); toast({ title: 'Saved', description: 'Subcategory updated.' }); }, onError: (err:any) => { const message = err?.message || err?.error?.message || 'Failed to update subcategory.'; toast({ title: 'Error', description: message, variant: 'destructive' }); } });

  const deleteSubMut = useMutation({ mutationFn: async (id:string) => supabase.from('subcategories').delete().eq('id', id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin','subcategories', editId] }); toast({ title: 'Deleted', description: 'Subcategory deleted.' }); }, onError: (err:any) => { const message = err?.message || err?.error?.message || 'Failed to delete subcategory.'; toast({ title: 'Error', description: message, variant: 'destructive' }); } });

  const startEditSub = (s:any) => { setEditingSubId(s.id); setEditingSubName(s.name); setEditingSubDesc(s.description || ''); };

  const saveEditSub = async (id:string) => {
    setActionLoading(id);
    try { await updateSubMut.mutateAsync({ id }); }
    finally { setActionLoading(null); }
  };

  const removeSub = async (id:string) => {
    setActionLoading(id);
    try { await deleteSubMut.mutateAsync(id); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{editId ? 'Edit Category' : 'New Category'}</h2>
      <div className="grid gap-2 mb-4">
        <label className="text-sm">Name</label>
        <Input value={name} onChange={(e:any)=>setName(e.target.value)} />

        <label className="text-sm">Type</label>
        <select value={type} onChange={(e:any)=>setType(e.target.value)} className="p-2 border rounded">
          <option value="fun">fun</option>
          <option value="world">world</option>
          <option value="country">country</option>
        </select>

        <label className="text-sm">Description</label>
        <textarea className="p-2 border rounded" value={description} onChange={(e:any)=>setDescription(e.target.value)} />
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        <Button variant="outline" onClick={() => navigate('/admin/categories')}>Cancel</Button>
      </div>

      {/* Subcategories management (only when category exists) */}
      {editId ? (
        <div>
          <h3 className="text-lg font-semibold mb-2">Subcategories</h3>

          <div className="mb-4 grid gap-2">
            <Input placeholder="New subcategory name" value={newSubName} onChange={(e:any)=>setNewSubName(e.target.value)} />
            <Input placeholder="Description (optional)" value={newSubDesc} onChange={(e:any)=>setNewSubDesc(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={() => createSubMut.mutateAsync({})} disabled={!newSubName}>Add Subcategory</Button>
              <Button variant="outline" onClick={() => { setNewSubName(''); setNewSubDesc(''); }}>Clear</Button>
            </div>
          </div>

          {subsQ?.isLoading ? <div>Loading subcategories...</div> : (
            <div className="grid gap-3">
              {((subsQ?.data as any[]) || []).length === 0 ? (
                <div className="p-4 bg-card rounded">No subcategories yet.</div>
              ) : (
                (subsQ?.data as any[]).map((s:any) => (
                  <Card key={s.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-sm text-muted-foreground">{s.description || ''}</div>
                    </div>
                    <div className="flex gap-2">
                      {editingSubId === s.id ? (
                        <>
                          <Input value={editingSubName} onChange={(e:any)=>setEditingSubName(e.target.value)} />
                          <Input value={editingSubDesc} onChange={(e:any)=>setEditingSubDesc(e.target.value)} />
                          <Button onClick={() => saveEditSub(s.id)} disabled={actionLoading===s.id}>{actionLoading===s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
                          <Button variant="outline" onClick={() => setEditingSubId(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" onClick={() => startEditSub(s)} disabled={!!actionLoading}>{actionLoading===s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Edit'}</Button>
                          <AlertDialog>
                            <Button variant="destructive" onClick={() => setActionLoading(s.id)} disabled={!!actionLoading}>{actionLoading===s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}</Button>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete subcategory?</AlertDialogTitle>
                                <AlertDialogDescription>Deleting this subcategory cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeSub(s.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-card rounded">Save the category first to add subcategories.</div>
      )}
    </div>
  );
};

export default CategoryEdit;
