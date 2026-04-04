import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, FileText, IndianRupee, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth } from "date-fns";

const COLORS = [
  "hsl(40, 90%, 50%)",
  "hsl(222, 60%, 18%)",
  "hsl(152, 60%, 42%)",
  "hsl(222, 40%, 28%)",
  "hsl(220, 16%, 70%)",
  "hsl(0, 84%, 60%)",
];

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function DashboardOverview() {
  const { user } = useAuth();

  // Fetch all data in parallel
  const { data: clients } = useQuery({
    queryKey: ["dash-clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, status, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: invoices } = useQuery({
    queryKey: ["dash-invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("id, amount, status, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: expenses } = useQuery({
    queryKey: ["dash-expenses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("id, amount, category, status, date, created_at");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const isLoading = !clients || !invoices || !expenses;

  // ── Compute stats ──────────────────────────────────────────────────────
  const totalRevenue = invoices?.filter((i) => i.status === "Paid").reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const activeClients = clients?.filter((c) => c.status === "Active").length ?? 0;
  const pendingInvoices = invoices?.filter((i) => i.status === "Pending" || i.status === "Sent").length ?? 0;
  const pendingAmount = invoices?.filter((i) => i.status === "Pending" || i.status === "Sent").reduce((s, i) => s + Number(i.amount), 0) ?? 0;
  const totalExpenses = expenses?.reduce((s, e) => s + Number(e.amount), 0) ?? 0;
  const netIncome = totalRevenue - totalExpenses;

  // Month-over-month clients
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const newClientsThisMonth = clients?.filter((c) => new Date(c.created_at) >= thisMonthStart).length ?? 0;

  const stats = [
    { title: "Total Revenue", value: fmt(totalRevenue), change: `${invoices?.filter((i) => i.status === "Paid").length ?? 0} paid invoices`, up: true, icon: IndianRupee },
    { title: "Active Clients", value: String(activeClients), change: `+${newClientsThisMonth} this month`, up: true, icon: Users },
    { title: "Pending Invoices", value: String(pendingInvoices), change: fmt(pendingAmount), up: false, icon: FileText },
    { title: "Net Income", value: fmt(netIncome), change: `Expenses: ${fmt(totalExpenses)}`, up: netIncome >= 0, icon: TrendingUp },
  ];

  // ── Revenue trend (last 9 months) ─────────────────────────────────────
  const revenueData = Array.from({ length: 9 }, (_, i) => {
    const d = subMonths(now, 8 - i);
    const monthStr = format(d, "yyyy-MM");
    const label = format(d, "MMM");
    const revenue = invoices
      ?.filter((inv) => inv.status === "Paid" && inv.created_at.startsWith(monthStr))
      .reduce((s, inv) => s + Number(inv.amount), 0) ?? 0;
    return { month: label, revenue };
  });

  // ── Expense breakdown by category ─────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  expenses?.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + Number(e.amount);
  });
  const expenseCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // ── Recent activity (last 10 events) ──────────────────────────────────
  type Activity = { action: string; time: string; ts: number };
  const activities: Activity[] = [];

  invoices?.forEach((i) => {
    const ts = new Date(i.created_at).getTime();
    if (i.status === "Paid") activities.push({ action: `Payment received – ${fmt(Number(i.amount))}`, time: "", ts });
    else activities.push({ action: `Invoice created – ${fmt(Number(i.amount))} (${i.status})`, time: "", ts });
  });
  clients?.forEach((c) => {
    activities.push({ action: `Client added (${c.status})`, time: "", ts: new Date(c.created_at).getTime() });
  });
  expenses?.forEach((e) => {
    activities.push({ action: `Expense: ${e.category} – ${fmt(Number(e.amount))}`, time: "", ts: new Date(e.created_at).getTime() });
  });
  activities.sort((a, b) => b.ts - a.ts);
  const recentActivity = activities.slice(0, 8).map((a) => {
    const diff = Date.now() - a.ts;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    const time = days > 0 ? `${days}d ago` : hrs > 0 ? `${hrs}h ago` : `${Math.max(1, mins)}m ago`;
    return { ...a, time };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your practice overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-accent" />}
                <span className={`text-xs ${s.up ? "text-success" : "text-accent"}`}>{s.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-['Space_Grotesk']">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(40, 90%, 50%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(40, 90%, 50%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-['Space_Grotesk']">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {expenseCategories.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {expenseCategories.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {expenseCategories.map((c) => (
                    <div key={c.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-12">No expenses recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-['Space_Grotesk']">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet. Start by adding clients, invoices, or expenses.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
