import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, FileText, IndianRupee,
  ArrowUpRight, ArrowDownRight, Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  format, subMonths, subDays, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, isWithinInterval, parseISO,
} from "date-fns";
import { toast } from "sonner";
import { DashboardSkeleton } from "@/components/TableSkeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { exportExcel } from "@/lib/export-utils";

const COLORS = [
  "hsl(40, 90%, 50%)", "hsl(222, 60%, 18%)", "hsl(152, 60%, 42%)",
  "hsl(222, 40%, 28%)", "hsl(220, 16%, 70%)", "hsl(0, 84%, 60%)",
];

type DateRange = "week" | "month" | "quarter" | "year";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function pctChange(curr: number, prev: number): string {
  if (prev === 0) return curr > 0 ? "+100%" : "0%";
  const pct = ((curr - prev) / prev) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

function getRange(range: DateRange) {
  const now = new Date();
  switch (range) {
    case "week": return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month": return { start: startOfMonth(now), end: endOfMonth(now) };
    case "quarter": return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "year": return { start: startOfYear(now), end: endOfYear(now) };
  }
}

function getPrevRange(range: DateRange) {
  const now = new Date();
  switch (range) {
    case "week": { const s = startOfWeek(subDays(now, 7), { weekStartsOn: 1 }); return { start: s, end: endOfWeek(s, { weekStartsOn: 1 }) }; }
    case "month": { const s = startOfMonth(subMonths(now, 1)); return { start: s, end: endOfMonth(s) }; }
    case "quarter": { const s = startOfQuarter(subMonths(now, 3)); return { start: s, end: endOfQuarter(s) }; }
    case "year": { const s = startOfYear(subMonths(now, 12)); return { start: s, end: endOfYear(s) }; }
  }
}

function inRange(dateStr: string, start: Date, end: Date) {
  try { return isWithinInterval(parseISO(dateStr), { start, end }); } catch { return false; }
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("month");

  const { data: invoices, isLoading: invLoading } = useQuery({
    queryKey: ["dash-invoices", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("id, invoice_number, amount, status, created_at, due_date, description");
      if (error) { toast.error("Failed to load invoices"); throw error; }
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: expenses, isLoading: expLoading } = useQuery({
    queryKey: ["dash-expenses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("id, amount, category, status, date, description, created_at");
      if (error) { toast.error("Failed to load expenses"); throw error; }
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: clients } = useQuery({
    queryKey: ["dash-clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, status");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const isLoading = invLoading || expLoading;
  if (isLoading) return <DashboardSkeleton />;

  const { start: curStart, end: curEnd } = getRange(dateRange);
  const { start: prevStart, end: prevEnd } = getPrevRange(dateRange);

  // ── KPI computations ──
  const curRevenue = (invoices ?? []).filter(i => i.status === "Paid" && inRange(i.created_at, curStart, curEnd)).reduce((s, i) => s + Number(i.amount), 0);
  const prevRevenue = (invoices ?? []).filter(i => i.status === "Paid" && inRange(i.created_at, prevStart, prevEnd)).reduce((s, i) => s + Number(i.amount), 0);

  const curExpenses = (expenses ?? []).filter(e => inRange(e.date, curStart, curEnd)).reduce((s, e) => s + Number(e.amount), 0);
  const prevExpenses = (expenses ?? []).filter(e => inRange(e.date, prevStart, prevEnd)).reduce((s, e) => s + Number(e.amount), 0);

  const netProfit = curRevenue - curExpenses;
  const prevNet = prevRevenue - prevExpenses;

  const pendingInv = (invoices ?? []).filter(i => i.status === "Pending" || i.status === "Sent");
  const pendingCount = pendingInv.length;
  const pendingTotal = pendingInv.reduce((s, i) => s + Number(i.amount), 0);

  // Expense category breakdown for hover tooltip
  const catBreakdown: Record<string, number> = {};
  (expenses ?? []).filter(e => inRange(e.date, curStart, curEnd)).forEach(e => {
    catBreakdown[e.category] = (catBreakdown[e.category] ?? 0) + Number(e.amount);
  });
  const catTooltip = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c, v]) => `${c}: ${fmt(v)}`).join("\n");

  const stats = [
    { title: "Total Revenue", value: fmt(curRevenue), change: pctChange(curRevenue, prevRevenue), up: curRevenue >= prevRevenue, icon: IndianRupee },
    { title: "Total Expenses", value: fmt(curExpenses), change: pctChange(curExpenses, prevExpenses), up: curExpenses <= prevExpenses, icon: TrendingDown, tooltip: catTooltip },
    { title: "Net Profit/Loss", value: fmt(netProfit), change: pctChange(netProfit, prevNet), up: netProfit >= 0, icon: TrendingUp, color: netProfit >= 0 },
    { title: "Pending Invoices", value: `${pendingCount}`, change: fmt(pendingTotal), up: false, icon: FileText },
  ];

  // ── Bar chart: Revenue vs Expenses last 6 months ──
  const now = new Date();
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    const ms = format(d, "yyyy-MM");
    const label = format(d, "MMM");
    const rev = (invoices ?? []).filter(inv => inv.status === "Paid" && inv.created_at.startsWith(ms)).reduce((s, inv) => s + Number(inv.amount), 0);
    const exp = (expenses ?? []).filter(e => e.date.startsWith(ms)).reduce((s, e) => s + Number(e.amount), 0);
    return { month: label, Revenue: rev, Expenses: exp };
  });

  // ── Line chart: Cash flow last 30 days ──
  const lineData = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    const ds = format(d, "yyyy-MM-dd");
    const label = format(d, "dd MMM");
    const inc = (invoices ?? []).filter(inv => inv.status === "Paid" && inv.created_at.startsWith(ds)).reduce((s, inv) => s + Number(inv.amount), 0);
    const out = (expenses ?? []).filter(e => e.date === ds).reduce((s, e) => s + Number(e.amount), 0);
    return { day: label, "Cash Flow": inc - out };
  });

  // ── Donut chart: Expense breakdown ──
  const allCatMap: Record<string, number> = {};
  (expenses ?? []).forEach(e => { allCatMap[e.category] = (allCatMap[e.category] ?? 0) + Number(e.amount); });
  const donutData = Object.entries(allCatMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));

  // ── Transactions table ──
  type Tx = { date: string; description: string; category: string; amount: number; type: "Income" | "Expense" };
  const transactions: Tx[] = [];
  (invoices ?? []).filter(i => i.status === "Paid").forEach(i => {
    transactions.push({ date: i.created_at.slice(0, 10), description: i.description || `Invoice ${i.invoice_number}`, category: "Revenue", amount: Number(i.amount), type: "Income" });
  });
  (expenses ?? []).forEach(e => {
    transactions.push({ date: e.date, description: e.description || e.category, category: e.category, amount: Number(e.amount), type: "Expense" });
  });
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  const recentTx = transactions.slice(0, 15);

  const handleExport = () => {
    const rows = transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Category: t.category,
      Amount: t.amount,
      Type: t.type,
    }));
    exportExcel(rows, `dashboard-data-${format(now, "yyyy-MM-dd")}`, "Transactions");
    toast.success("Excel exported");
  };

  const rangeTabs: { label: string; value: DateRange }[] = [
    { label: "This Week", value: "week" },
    { label: "This Month", value: "month" },
    { label: "This Quarter", value: "quarter" },
    { label: "This Year", value: "year" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your practice overview.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border bg-muted p-0.5">
            {rangeTabs.map(t => (
              <button
                key={t.value}
                onClick={() => setDateRange(t.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  dateRange === t.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} aria-label="Export to Excel">
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.title} className="shadow-card hover:shadow-elevated transition-shadow" title={s.tooltip || ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent" />
                </div>
              </div>
              <p className={`text-2xl font-bold ${
                s.title === "Net Profit/Loss" ? (netProfit >= 0 ? "text-green-600" : "text-red-500") : "text-foreground"
              }`}>{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.up ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                <span className={`text-xs ${s.up ? "text-green-600" : "text-red-500"}`}>{s.change}</span>
                <span className="text-xs text-muted-foreground ml-1">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-['Space_Grotesk']">Revenue vs Expenses (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `₹${v / 1000}K`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="Revenue" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-['Space_Grotesk']">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {donutData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {donutData.map(c => (
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

      {/* Cash Flow Line Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-['Space_Grotesk']">Cash Flow Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 90%)" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 46%)" interval={4} />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={v => `₹${v / 1000}K`} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="Cash Flow" stroke="hsl(40, 90%, 50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-['Space_Grotesk']">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTx.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTx.map((tx, i) => (
                    <TableRow key={`tx-${i}-${tx.date}-${tx.amount}`} className="hover:bg-muted/50">
                      <TableCell className="text-sm">{format(parseISO(tx.date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{tx.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{tx.category}</Badge></TableCell>
                      <TableCell className={`text-sm text-right font-medium ${tx.type === "Income" ? "text-green-600" : "text-red-500"}`}>
                        {tx.type === "Income" ? "+" : "-"}{fmt(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.type === "Income" ? "default" : "secondary"} className="text-xs">
                          {tx.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">No transactions yet. Start by adding invoices or expenses.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
