import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, SUPABASE_AVAILABLE } from '@/integrations/supabase/client';

const fetchAdminStats = async () => {
  if (!SUPABASE_AVAILABLE) return { total_approved_facts: 0, total_quizzes: 0, pending_approvals: 0 };

  try {
    const factsApproved = await supabase.from('facts').select('id', { count: 'exact' }).eq('status', 'approved');
    const factsDraft = await supabase.from('facts').select('id', { count: 'exact' }).eq('status', 'draft');
    const quizzes = await supabase.from('quizzes').select('id', { count: 'exact' });

    return {
      total_approved_facts: factsApproved.count || 0,
      total_quizzes: quizzes.count || 0,
      pending_approvals: factsDraft.count || 0,
    };
  } catch (e) {
    console.error('Failed to fetch admin stats', e);
    return { total_approved_facts: 0, total_quizzes: 0, pending_approvals: 0 };
  }
};

const Dashboard: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin','stats'], queryFn: fetchAdminStats });

  const stats = data || { total_approved_facts: 0, total_quizzes: 0, pending_approvals: 0 };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-card rounded">Total Facts: {isLoading ? 'Loading...' : stats.total_approved_facts}</div>
        <div className="p-4 bg-card rounded">Total Quizzes: {isLoading ? 'Loading...' : stats.total_quizzes}</div>
        <div className="p-4 bg-card rounded">Pending Approvals: {isLoading ? 'Loading...' : stats.pending_approvals}</div>
      </div>
    </div>
  );
};

export default Dashboard;
