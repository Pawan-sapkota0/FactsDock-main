import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SUPABASE_AVAILABLE } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  BookOpen,
  HelpCircle,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const fetchAdminStats = async () => {
  if (!SUPABASE_AVAILABLE)
    return {
      total_approved_facts: 0,
      total_quizzes: 0,
      pending_approvals: 0,
      recent_facts: [],
      recent_quizzes: [],
    };

  try {
    const factsApproved = await supabase
      .from("facts")
      .select("id", { count: "exact" })
      .eq("status", "approved");
    const factsDraft = await supabase
      .from("facts")
      .select("id", { count: "exact" })
      .eq("status", "draft");
    const quizzes = await supabase
      .from("quizzes")
      .select("id", { count: "exact" });

    // Fetch recent facts
    const recentFactsRes = await supabase
      .from("facts")
      .select("id, fact_text, country, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    // Fetch recent quizzes
    const recentQuizzesRes = await supabase
      .from("quizzes")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    return {
      total_approved_facts: factsApproved.count || 0,
      total_quizzes: quizzes.count || 0,
      pending_approvals: factsDraft.count || 0,
      recent_facts: recentFactsRes.data || [],
      recent_quizzes: recentQuizzesRes.data || [],
    };
  } catch (e) {
    console.error("Failed to fetch admin stats", e);
    return {
      total_approved_facts: 0,
      total_quizzes: 0,
      pending_approvals: 0,
      recent_facts: [],
      recent_quizzes: [],
    };
  }
};

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  color: "blue" | "purple" | "orange";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
}) => {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
    purple:
      "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900",
    orange:
      "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900",
  };

  const iconColorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
  };

  return (
    <Card className={`border-2 ${colorClasses[color]} overflow-hidden`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-2">
              {title}
            </p>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold text-foreground">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 text-green-600 text-sm font-medium mb-1">
                  <TrendingUp className="h-4 w-4" />
                  {trend}
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg bg-white/50 dark:bg-black/20`}>
            <div className={iconColorClasses[color]}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });

  const stats = data || {
    total_approved_facts: 0,
    total_quizzes: 0,
    pending_approvals: 0,
    recent_facts: [],
    recent_quizzes: [],
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your WorldFacts platform.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Approved Facts"
          value={isLoading ? "..." : stats.total_approved_facts}
          icon={<BookOpen className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Total Quizzes"
          value={isLoading ? "..." : stats.total_quizzes}
          icon={<HelpCircle className="h-6 w-6" />}
          color="purple"
        />
        <MetricCard
          title="Pending Approvals"
          value={isLoading ? "..." : stats.pending_approvals}
          icon={<Clock className="h-6 w-6" />}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link to="/admin/facts">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3 px-4"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Fact</span>
            </Button>
          </Link>
          <Link to="/admin/quizzes">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3 px-4"
            >
              <Plus className="h-4 w-4" />
              <span>Create Quiz</span>
            </Button>
          </Link>
          <Link to="/admin/facts">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-auto py-3 px-4"
            >
              <Clock className="h-4 w-4" />
              <span>Review Pending</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Facts */}
        <Card className="border-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Recent Facts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : stats.recent_facts.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No facts yet
                </div>
              ) : (
                stats.recent_facts.map((fact: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {fact.fact_text}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {fact.country}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(fact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to="/admin/facts">
              <button className="w-full p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-muted/50 transition-colors border-t border-border">
                View All Facts
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card className="border-2">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-purple-600" />
              Recent Quizzes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading...
                </div>
              ) : stats.recent_quizzes.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No quizzes yet
                </div>
              ) : (
                stats.recent_quizzes.map((quiz: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground line-clamp-2">
                      {quiz.title}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        Quiz ID: {quiz.id.substring(0, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to="/admin/quizzes">
              <button className="w-full p-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:bg-muted/50 transition-colors border-t border-border">
                View All Quizzes
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
        <p>
          Last updated:{" "}
          <span className="font-medium">{new Date().toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
