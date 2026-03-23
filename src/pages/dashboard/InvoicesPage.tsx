import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Send, Download } from "lucide-react";

const invoicesData = [
  { id: "INV-1042", client: "Mehta & Associates", amount: "₹85,000", date: "2026-03-20", due: "2026-04-20", status: "Sent" },
  { id: "INV-1041", client: "Kapoor Group", amount: "₹1,20,000", date: "2026-03-18", due: "2026-04-18", status: "Paid" },
  { id: "INV-1040", client: "Sharma Industries", amount: "₹65,000", date: "2026-03-15", due: "2026-04-15", status: "Overdue" },
  { id: "INV-1039", client: "Patel Exports", amount: "₹45,000", date: "2026-03-10", due: "2026-04-10", status: "Sent" },
  { id: "INV-1038", client: "Nair & Sons", amount: "₹90,000", date: "2026-03-05", due: "2026-04-05", status: "Paid" },
  { id: "INV-1037", client: "Rajesh Kumar", amount: "₹25,000", date: "2026-02-28", due: "2026-03-28", status: "Paid" },
  { id: "INV-1036", client: "Gupta Textiles", amount: "₹1,50,000", date: "2026-02-20", due: "2026-03-20", status: "Overdue" },
];

const statusColor = (s: string) =>
  s === "Paid" ? "default" : s === "Sent" ? "secondary" : "destructive";

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const filtered = invoicesData.filter((i) => i.client.toLowerCase().includes(search.toLowerCase()) || i.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and track all invoices</p>
        </div>
        <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Create Invoice
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Outstanding", value: "₹3,45,000", sub: "4 invoices" },
          { label: "Paid This Month", value: "₹2,35,000", sub: "3 invoices" },
          { label: "Overdue", value: "₹2,15,000", sub: "2 invoices" },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm font-medium">{inv.id}</TableCell>
                  <TableCell className="text-foreground">{inv.client}</TableCell>
                  <TableCell className="font-semibold">{inv.amount}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{inv.date}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{inv.due}</TableCell>
                  <TableCell><Badge variant={statusColor(inv.status)} className="text-xs">{inv.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3 w-3" /></Button>
                    </div>
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
