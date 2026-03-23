import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, FileText, IndianRupee, ArrowUpRight, ArrowDownRight } from "lucide-react";

const stats = [
  { title: "Total Revenue", value: "₹24,50,000", change: "+12.5%", up: true, icon: IndianRupee },
  { title: "Active Clients", value: "148", change: "+8 this month", up: true, icon: Users },
  { title: "Pending Invoices", value: "23", change: "₹3,20,000", up: false, icon: FileText },
  { title: "Monthly Growth", value: "18.2%", change: "+3.1%", up: true, icon: TrendingUp },
];

const revenueData = [
  { month: "Jul", revenue: 180000 }, { month: "Aug", revenue: 220000 }, { month: "Sep", revenue: 195000 },
  { month: "Oct", revenue: 280000 }, { month: "Nov", revenue: 250000 }, { month: "Dec", revenue: 310000 },
  { month: "Jan", revenue: 290000 }, { month: "Feb", revenue: 340000 }, { month: "Mar", revenue: 380000 },
];

const expenseCategories = [
  { name: "Salaries", value: 45, color: "hsl(40, 90%, 50%)" },
  { name: "Rent", value: 20, color: "hsl(222, 60%, 18%)" },
  { name: "Software", value: 15, color: "hsl(152, 60%, 42%)" },
  { name: "Marketing", value: 12, color: "hsl(222, 40%, 28%)" },
  { name: "Other", value: 8, color: "hsl(220, 16%, 70%)" },
];

const recentActivity = [
  { action: "Invoice #1042 sent to Mehta & Associates", time: "2 hours ago" },
  { action: "GST return filed for Q3 2025-26", time: "5 hours ago" },
  { action: "New client onboarded: Sharma Industries", time: "1 day ago" },
  { action: "Payment received from Kapoor Group - ₹1,20,000", time: "1 day ago" },
  { action: "Tax audit completed for Patel Exports", time: "2 days ago" },
];

export default function DashboardOverview() {
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
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
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
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {expenseCategories.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} />
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-['Space_Grotesk']">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
