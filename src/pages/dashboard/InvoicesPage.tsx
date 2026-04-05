import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Download, FileText, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TableSkeleton, CardSkeleton } from "@/components/TableSkeleton";

const statusColor = (s: string) =>
  s === "Paid" ? "default" as const : s === "Sent" ? "secondary" as const : "destructive" as const;

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newInv, setNewInv] = useState({ invoice_number: "", amount: "", description: "", status: "Draft", due_date: "" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load invoices: " + error.message);
        throw error;
      }
      return data;
    },
  });

  const addInvoice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("invoices").insert({
        user_id: user!.id,
        invoice_number: newInv.invoice_number,
        amount: parseFloat(newInv.amount) || 0,
        description: newInv.description,
        status: newInv.status,
        due_date: newInv.due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpen(false);
      setNewInv({ invoice_number: "", amount: "", description: "", status: "Draft", due_date: "" });
      toast.success("Invoice created!");
    },
    onError: (err: Error) => toast.error("Failed to create invoice: " + err.message),
  });

  const totalOutstanding = invoices.filter((i: any) => i.status !== "Paid").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "Paid").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const filtered = invoices.filter((i: any) =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase()) || (i.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    try {
      const headers = ["Invoice #", "Amount (₹)", "Description", "Due Date", "Status"];
      const rows = invoices.map((i: any) => [
        i.invoice_number, Number(i.amount), i.description || "", i.due_date || "—", i.status,
      ]);
      const opts = { fileName: "Invoices", headers, rows, title: "Invoices Report" };
      if (format === "csv") exportCSV(opts);
      else if (format === "xlsx") exportExcel(opts);
      else exportPDF(opts);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage and track all invoices</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Export invoices"><Download className="h-4 w-4 mr-2" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}><FileText className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx")}><FileSpreadsheet className="h-4 w-4 mr-2" /> Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}><FileText className="h-4 w-4 mr-2" /> PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-2" /> Create Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addInvoice.mutate(); }} className="space-y-4">
                <div><Label htmlFor="inv-number">Invoice Number</Label><Input id="inv-number" aria-label="Invoice number" value={newInv.invoice_number} onChange={(e) => setNewInv({ ...newInv, invoice_number: e.target.value })} required placeholder="INV-001" /></div>
                <div><Label htmlFor="inv-amount">Amount (₹)</Label><Input id="inv-amount" aria-label="Invoice amount" type="number" value={newInv.amount} onChange={(e) => setNewInv({ ...newInv, amount: e.target.value })} required /></div>
                <div><Label htmlFor="inv-desc">Description</Label><Input id="inv-desc" aria-label="Invoice description" value={newInv.description} onChange={(e) => setNewInv({ ...newInv, description: e.target.value })} /></div>
                <div><Label htmlFor="inv-due">Due Date</Label><Input id="inv-due" aria-label="Due date" type="date" value={newInv.due_date} onChange={(e) => setNewInv({ ...newInv, due_date: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={newInv.status} onValueChange={(v) => setNewInv({ ...newInv, status: v })}>
                    <SelectTrigger aria-label="Invoice status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem><SelectItem value="Sent">Sent</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem><SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90" disabled={addInvoice.isPending}>
                  {addInvoice.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={`skel-${i}`} className="shadow-card"><CardSkeleton /></Card>
          ))
        ) : (
          [
            { label: "Total Outstanding", value: `₹${totalOutstanding.toLocaleString("en-IN")}` },
            { label: "Total Paid", value: `₹${totalPaid.toLocaleString("en-IN")}` },
            { label: "Total Invoices", value: invoices.length.toString() },
          ].map((s) => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search invoices" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet. Create your first!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                    <TableCell className="font-semibold">₹{Number(inv.amount).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{inv.due_date || "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(inv.status)} className="text-xs">{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
