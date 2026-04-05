import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingDown, Download, FileText, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TableSkeleton, CardSkeleton } from "@/components/TableSkeleton";

const categories = ["Rent", "Software", "Salaries", "Utilities", "Travel", "Marketing", "Miscellaneous"];

export default function ExpensesPage() {
  const [open, setOpen] = useState(false);
  const [newExp, setNewExp] = useState({ description: "", category: "Miscellaneous", amount: "", date: "", vendor: "" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false });
      if (error) {
        toast.error("Failed to load expenses: " + error.message);
        throw error;
      }
      return data;
    },
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("expenses").insert({
        user_id: user!.id,
        description: newExp.description,
        category: newExp.category,
        amount: parseFloat(newExp.amount) || 0,
        date: newExp.date || new Date().toISOString().split("T")[0],
        vendor: newExp.vendor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setOpen(false);
      setNewExp({ description: "", category: "Miscellaneous", amount: "", date: "", vendor: "" });
      toast.success("Expense added!");
    },
    onError: (err: Error) => toast.error("Failed to add expense: " + err.message),
  });

  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    try {
      const headers = ["Description", "Category", "Amount (₹)", "Date", "Vendor", "Status"];
      const rows = expenses.map((e: any) => [
        e.description || "", e.category, Number(e.amount), e.date, e.vendor || "", e.status,
      ]);
      const opts = { fileName: "Expenses", headers, rows, title: "Expenses Report" };
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
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and categorize your practice expenses</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Export expenses"><Download className="h-4 w-4 mr-2" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport("csv")}><FileText className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("xlsx")}><FileSpreadsheet className="h-4 w-4 mr-2" /> Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}><FileText className="h-4 w-4 mr-2" /> PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addExpense.mutate(); }} className="space-y-4">
                <div><Label htmlFor="exp-desc">Description</Label><Input id="exp-desc" aria-label="Expense description" value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} required /></div>
                <div><Label htmlFor="exp-amount">Amount (₹)</Label><Input id="exp-amount" aria-label="Expense amount" type="number" value={newExp.amount} onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })} required /></div>
                <div><Label>Category</Label>
                  <Select value={newExp.category} onValueChange={(v) => setNewExp({ ...newExp, category: v })}>
                    <SelectTrigger aria-label="Expense category"><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label htmlFor="exp-date">Date</Label><Input id="exp-date" aria-label="Expense date" type="date" value={newExp.date} onChange={(e) => setNewExp({ ...newExp, date: e.target.value })} /></div>
                <div><Label htmlFor="exp-vendor">Vendor</Label><Input id="exp-vendor" aria-label="Vendor name" value={newExp.vendor} onChange={(e) => setNewExp({ ...newExp, vendor: e.target.value })} /></div>
                <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90" disabled={addExpense.isPending}>
                  {addExpense.isPending ? "Adding..." : "Add Expense"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          <Card className="shadow-card"><CardSkeleton /></Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-accent" /><p className="text-sm text-muted-foreground">Total Expenses</p></div>
              <p className="text-xl font-bold text-foreground mt-1">₹{total.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">{expenses.length} transactions</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-base font-['Space_Grotesk']">All Expenses</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No expenses yet. Add your first!</p>
          ) : (
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
                {expenses.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium text-foreground">{e.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{e.category}</Badge></TableCell>
                    <TableCell className="font-semibold">₹{Number(e.amount).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{e.date}</TableCell>
                    <TableCell><Badge variant={e.status === "Approved" ? "default" : "secondary"} className="text-xs">{e.status}</Badge></TableCell>
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
