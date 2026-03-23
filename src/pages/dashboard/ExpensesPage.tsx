import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingDown } from "lucide-react";

const monthlyExpenses = [
  { month: "Oct", amount: 145000 }, { month: "Nov", amount: 168000 }, { month: "Dec", amount: 192000 },
  { month: "Jan", amount: 155000 }, { month: "Feb", amount: 178000 }, { month: "Mar", amount: 162000 },
];

const expenses = [
  { id: 1, description: "Office Rent - March", category: "Rent", amount: "₹45,000", date: "2026-03-01", status: "Paid" },
  { id: 2, description: "Tally Prime Subscription", category: "Software", amount: "₹18,000", date: "2026-03-05", status: "Paid" },
  { id: 3, description: "Staff Salaries", category: "Salaries", amount: "₹2,40,000", date: "2026-03-10", status: "Paid" },
  { id: 4, description: "Internet & Phone", category: "Utilities", amount: "₹5,500", date: "2026-03-12", status: "Paid" },
  { id: 5, description: "Google Workspace", category: "Software", amount: "₹4,200", date: "2026-03-15", status: "Pending" },
  { id: 6, description: "Client Meeting - Travel", category: "Travel", amount: "₹8,500", date: "2026-03-18", status: "Pending" },
  { id: 7, description: "Office Supplies", category: "Miscellaneous", amount: "₹3,200", date: "2026-03-20", status: "Paid" },
];

const categoryColors: Record<string, string> = {
  Rent: "default", Software: "secondary", Salaries: "default", Utilities: "outline", Travel: "secondary", Miscellaneous: "outline",
};

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and categorize your practice expenses</p>
        </div>
        <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "This Month", value: "₹3,24,400", sub: "7 transactions" },
          { label: "Last Month", value: "₹1,78,000", sub: "+82% increase" },
          { label: "Avg Monthly", value: "₹1,66,700", sub: "Last 6 months" },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-accent" />
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base font-['Space_Grotesk']">Monthly Expenses</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyExpenses}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" tickFormatter={(v) => `₹${v / 1000}K`} />
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
              <Bar dataKey="amount" fill="hsl(222, 60%, 18%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base font-['Space_Grotesk']">All Expenses</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-foreground">{e.description}</TableCell>
                  <TableCell><Badge variant={categoryColors[e.category] as any} className="text-xs">{e.category}</Badge></TableCell>
                  <TableCell className="font-semibold">{e.amount}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{e.date}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "Paid" ? "default" : "secondary"} className="text-xs">{e.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
