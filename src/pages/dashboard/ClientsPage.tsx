import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/TableSkeleton";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", type: "Business" });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load clients: " + error.message);
        throw error;
      }
      return data;
    },
  });

  const addClient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").insert({ ...newClient, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setNewClient({ name: "", email: "", phone: "", type: "Business" });
      toast.success("Client added!");
    },
    onError: (err: Error) => toast.error("Failed to add client: " + err.message),
  });

  const filtered = clients.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Clients</h1>
          <p className="text-sm text-muted-foreground">{clients.length} total clients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addClient.mutate(); }} className="space-y-4">
              <div><Label htmlFor="client-name">Name</Label><Input id="client-name" aria-label="Client name" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required /></div>
              <div><Label htmlFor="client-email">Email</Label><Input id="client-email" aria-label="Client email" type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} /></div>
              <div><Label htmlFor="client-phone">Phone</Label><Input id="client-phone" aria-label="Client phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} /></div>
              <div><Label htmlFor="client-type">Type</Label>
                <Select value={newClient.type} onValueChange={(v) => setNewClient({ ...newClient, type: v })}>
                  <SelectTrigger aria-label="Client type"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Business">Business</SelectItem><SelectItem value="Individual">Individual</SelectItem></SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90" disabled={addClient.isPending}>
                {addClient.isPending ? "Adding..." : "Add Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search clients" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={4} />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No clients yet. Add your first client!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{c.email || "—"}</span>
                    </TableCell>
                    <TableCell><Badge variant={c.type === "Business" ? "default" : "secondary"} className="text-xs">{c.type}</Badge></TableCell>
                    <TableCell><Badge variant={c.status === "Active" ? "default" : c.status === "Pending" ? "secondary" : "outline"} className="text-xs">{c.status}</Badge></TableCell>
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
