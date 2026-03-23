import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal, Mail, Phone } from "lucide-react";

const clientsData = [
  { id: 1, name: "Mehta & Associates", email: "info@mehta.co.in", phone: "+91 98765 43210", type: "Business", status: "Active", filings: 12 },
  { id: 2, name: "Sharma Industries Pvt Ltd", email: "accounts@sharma.in", phone: "+91 87654 32109", type: "Business", status: "Active", filings: 8 },
  { id: 3, name: "Kapoor Group", email: "ca@kapoorgroup.com", phone: "+91 76543 21098", type: "Business", status: "Active", filings: 15 },
  { id: 4, name: "Patel Exports", email: "finance@patelexp.com", phone: "+91 65432 10987", type: "Business", status: "Pending", filings: 5 },
  { id: 5, name: "Rajesh Kumar (Individual)", email: "rajesh.k@gmail.com", phone: "+91 54321 09876", type: "Individual", status: "Active", filings: 3 },
  { id: 6, name: "Gupta Textiles", email: "gupta.t@textiles.in", phone: "+91 43210 98765", type: "Business", status: "Inactive", filings: 20 },
  { id: 7, name: "Nair & Sons", email: "office@nairsons.com", phone: "+91 32109 87654", type: "Business", status: "Active", filings: 7 },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const filtered = clientsData.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Clients</h1>
          <p className="text-sm text-muted-foreground">{clientsData.length} total clients</p>
        </div>
        <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" /> Add Client
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search clients..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Filings</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.type === "Business" ? "default" : "secondary"} className="text-xs">{c.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.status === "Active" ? "default" : c.status === "Pending" ? "secondary" : "outline"} className="text-xs">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{c.filings}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
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
