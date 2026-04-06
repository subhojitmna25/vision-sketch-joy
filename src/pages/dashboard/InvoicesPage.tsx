import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Plus, Download, FileText, FileSpreadsheet, Trash2, X } from "lucide-react";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export-utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TableSkeleton, CardSkeleton } from "@/components/TableSkeleton";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const statusColor = (s: string) => {
  if (s === "Paid") return "default" as const;
  if (s === "Sent") return "secondary" as const;
  if (s === "Overdue") return "destructive" as const;
  return "outline" as const;
};

interface LineItem {
  description: string;
  qty: number;
  rate: number;
  gstPct: number;
}

const emptyLine = (): LineItem => ({ description: "", qty: 1, rate: 0, gstPct: 18 });

function generateInvoicePDF(inv: {
  invoiceNumber: string;
  clientName: string;
  date: string;
  dueDate: string;
  lineItems: LineItem[];
}) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(41, 50, 65);
  doc.text("INVOICE", 14, 25);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Your Company Name", 14, 33);
  doc.text("GSTIN: XXXXXXXXXXXX", 14, 38);

  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(41, 50, 65);
  doc.text(`Invoice #: ${inv.invoiceNumber}`, w - 14, 25, { align: "right" });
  doc.text(`Date: ${inv.date}`, w - 14, 31, { align: "right" });
  doc.text(`Due: ${inv.dueDate || "N/A"}`, w - 14, 37, { align: "right" });

  // Bill To
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Bill To:", 14, 50);
  doc.setFontSize(11);
  doc.setTextColor(41, 50, 65);
  doc.text(inv.clientName || "—", 14, 56);

  // Line items table
  const subtotal = inv.lineItems.reduce((s, l) => s + l.qty * l.rate, 0);
  const totalGST = inv.lineItems.reduce((s, l) => s + (l.qty * l.rate * l.gstPct) / 100, 0);
  const cgst = totalGST / 2;
  const sgst = totalGST / 2;
  const grandTotal = subtotal + totalGST;

  autoTable(doc, {
    startY: 64,
    head: [["#", "Description", "Qty", "Rate (₹)", "GST %", "Amount (₹)"]],
    body: inv.lineItems.map((l, i) => [
      i + 1,
      l.description,
      l.qty,
      l.rate.toLocaleString("en-IN"),
      `${l.gstPct}%`,
      (l.qty * l.rate).toLocaleString("en-IN"),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 50, 65] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary
  const summaryX = w - 70;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Subtotal:", summaryX, finalY);
  doc.text(`₹${subtotal.toLocaleString("en-IN")}`, w - 14, finalY, { align: "right" });
  doc.text("CGST:", summaryX, finalY + 6);
  doc.text(`₹${cgst.toLocaleString("en-IN")}`, w - 14, finalY + 6, { align: "right" });
  doc.text("SGST:", summaryX, finalY + 12);
  doc.text(`₹${sgst.toLocaleString("en-IN")}`, w - 14, finalY + 12, { align: "right" });
  doc.line(summaryX, finalY + 15, w - 14, finalY + 15);
  doc.setFontSize(11);
  doc.setTextColor(41, 50, 65);
  doc.text("Grand Total:", summaryX, finalY + 22);
  doc.text(`₹${grandTotal.toLocaleString("en-IN")}`, w - 14, finalY + 22, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Thank you for your business!", 14, doc.internal.pageSize.getHeight() - 15);

  doc.save(`${inv.invoiceNumber}.pdf`);
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);

  // Create invoice form state
  const [clientName, setClientName] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false });
      if (error) { toast.error("Failed to load invoices"); throw error; }
      return data;
    },
  });

  // Auto-generate invoice number
  const nextInvNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${String(count).padStart(3, "0")}`;
  }, [invoices.length]);

  const addInvoice = useMutation({
    mutationFn: async () => {
      const subtotal = lineItems.reduce((s, l) => s + l.qty * l.rate, 0);
      const gst = lineItems.reduce((s, l) => s + (l.qty * l.rate * l.gstPct) / 100, 0);
      const total = subtotal + gst;
      const desc = lineItems.map(l => l.description).filter(Boolean).join(", ");

      const { error } = await supabase.from("invoices").insert({
        user_id: user!.id,
        invoice_number: nextInvNumber,
        amount: total,
        description: `${clientName}: ${desc}`,
        status: "Draft",
        due_date: dueDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setCreateOpen(false);
      resetForm();
      toast.success("Invoice saved as Draft!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setClientName("");
    setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
    setDueDate("");
    setLineItems([emptyLine()]);
  };

  const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const subtotal = lineItems.reduce((s, l) => s + l.qty * l.rate, 0);
  const totalGST = lineItems.reduce((s, l) => s + (l.qty * l.rate * l.gstPct) / 100, 0);
  const grandTotal = subtotal + totalGST;

  const totalOutstanding = invoices.filter((i: any) => i.status !== "Paid").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter((i: any) => i.status === "Paid").reduce((s: number, i: any) => s + Number(i.amount), 0);

  const filtered = invoices.filter((i: any) => {
    const matchesSearch = i.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (i.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.clients?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = (fmt: "csv" | "xlsx" | "pdf") => {
    try {
      const headers = ["Invoice #", "Client", "Amount (₹)", "Due Date", "Status"];
      const rows = invoices.map((i: any) => [
        i.invoice_number, i.clients?.name || "—", Number(i.amount), i.due_date || "—", i.status,
      ]);
      const opts = { fileName: "Invoices", headers, rows, title: "Invoices Report" };
      if (fmt === "csv") exportCSV(opts);
      else if (fmt === "xlsx") exportExcel(opts);
      else exportPDF(opts);
      toast.success(`Exported as ${fmt.toUpperCase()}`);
    } catch (err: any) {
      toast.error("Export failed");
    }
  };

  const handleDownloadPDF = (inv: any) => {
    const desc = inv.description || "";
    const client = inv.clients?.name || desc.split(":")[0] || "Client";
    generateInvoicePDF({
      invoiceNumber: inv.invoice_number,
      clientName: client,
      date: inv.created_at?.slice(0, 10) || "",
      dueDate: inv.due_date || "",
      lineItems: [{ description: desc, qty: 1, rate: Number(inv.amount), gstPct: 0 }],
    });
  };

  const statusTabs = ["All", "Draft", "Sent", "Paid", "Overdue"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90"><Plus className="h-4 w-4 mr-2" /> Create Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addInvoice.mutate(); }} className="space-y-5">
                {/* Header fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inv-client">Client Name</Label>
                    <Input id="inv-client" value={clientName} onChange={(e) => setClientName(e.target.value)} required placeholder="Client name" aria-label="Client name" />
                  </div>
                  <div>
                    <Label>Invoice #</Label>
                    <Input value={nextInvNumber} disabled className="bg-muted" aria-label="Invoice number" />
                  </div>
                  <div>
                    <Label htmlFor="inv-date">Date</Label>
                    <Input id="inv-date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} aria-label="Invoice date" />
                  </div>
                  <div>
                    <Label htmlFor="inv-due">Due Date</Label>
                    <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <Label className="mb-2 block">Line Items</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Description</TableHead>
                          <TableHead className="w-[12%]">Qty</TableHead>
                          <TableHead className="w-[16%]">Rate (₹)</TableHead>
                          <TableHead className="w-[12%]">GST %</TableHead>
                          <TableHead className="w-[16%] text-right">Amount</TableHead>
                          <TableHead className="w-[4%]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((l, i) => (
                          <TableRow key={`line-${i}`}>
                            <TableCell>
                              <Input
                                value={l.description}
                                onChange={(e) => updateLine(i, "description", e.target.value)}
                                placeholder="Item description"
                                className="h-8 text-sm"
                                aria-label={`Line item ${i + 1} description`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min={1}
                                value={l.qty}
                                onChange={(e) => updateLine(i, "qty", Number(e.target.value))}
                                className="h-8 text-sm"
                                aria-label={`Line item ${i + 1} quantity`}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min={0}
                                value={l.rate}
                                onChange={(e) => updateLine(i, "rate", Number(e.target.value))}
                                className="h-8 text-sm"
                                aria-label={`Line item ${i + 1} rate`}
                              />
                            </TableCell>
                            <TableCell>
                              <Select value={String(l.gstPct)} onValueChange={(v) => updateLine(i, "gstPct", Number(v))}>
                                <SelectTrigger className="h-8 text-sm" aria-label={`Line item ${i + 1} GST`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[0, 5, 12, 18, 28].map(g => <SelectItem key={g} value={String(g)}>{g}%</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              ₹{(l.qty * l.rate).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell>
                              {lineItems.length > 1 && (
                                <button onClick={() => setLineItems(prev => prev.filter((_, j) => j !== i))} className="p-1 hover:text-red-500" aria-label="Remove line item">
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setLineItems(prev => [...prev, emptyLine()])}>
                    <Plus className="h-3 w-3 mr-1" /> Add Line
                  </Button>
                </div>

                {/* Totals */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CGST</span>
                    <span>₹{(totalGST / 2).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SGST</span>
                    <span>₹{(totalGST / 2).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-gradient-gold text-gold-foreground hover:opacity-90" disabled={addInvoice.isPending}>
                    {addInvoice.isPending ? "Saving..." : "Save as Draft"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      generateInvoicePDF({
                        invoiceNumber: nextInvNumber,
                        clientName,
                        date: invoiceDate,
                        dueDate,
                        lineItems,
                      });
                    }}
                    disabled={lineItems.every(l => !l.description)}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download PDF
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={`skel-${i}`} className="shadow-card"><CardSkeleton /></Card>)
        ) : (
          [
            { label: "Total Outstanding", value: `₹${totalOutstanding.toLocaleString("en-IN")}` },
            { label: "Total Paid", value: `₹${totalPaid.toLocaleString("en-IN")}` },
            { label: "Total Invoices", value: invoices.length.toString() },
          ].map(s => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Status filter tabs + Search */}
      <Card className="shadow-card">
        <CardHeader className="space-y-3">
          <div className="flex rounded-lg border bg-muted p-0.5 w-fit">
            {statusTabs.map(t => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by invoice #, client, or description..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search invoices" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv: any) => {
                    const amt = Number(inv.amount);
                    return (
                      <TableRow key={inv.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm font-medium">{inv.invoice_number}</TableCell>
                        <TableCell className="text-sm">{inv.clients?.name || (inv.description?.split(":")[0]) || "—"}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{inv.created_at?.slice(0, 10)}</TableCell>
                        <TableCell className="text-right text-sm">₹{amt.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="hidden sm:table-cell text-right text-sm text-muted-foreground">incl.</TableCell>
                        <TableCell className="text-right text-sm font-semibold">₹{amt.toLocaleString("en-IN")}</TableCell>
                        <TableCell><Badge variant={statusColor(inv.status)} className="text-xs">{inv.status}</Badge></TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(inv)} aria-label={`Download PDF for ${inv.invoice_number}`}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
