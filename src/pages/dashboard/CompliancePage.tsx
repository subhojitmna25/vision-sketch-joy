import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, CheckCircle2, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, differenceInDays, startOfDay } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Generate recurring compliance deadlines for a given year range
function generateDeadlines(year: number): { name: string; date: Date }[] {
  const items: { name: string; date: Date }[] = [];
  for (let m = 0; m < 12; m++) {
    items.push({ name: "GSTR-1", date: new Date(year, m, 11) });
    items.push({ name: "GSTR-3B", date: new Date(year, m, 20) });
    items.push({ name: "TDS Payment", date: new Date(year, m, 7) });
    items.push({ name: "PF/ESIC", date: new Date(year, m, 15) });
  }
  // Advance Tax: Jun 15, Sep 15, Dec 15, Mar 15
  items.push({ name: "Advance Tax", date: new Date(year, 5, 15) });
  items.push({ name: "Advance Tax", date: new Date(year, 8, 15) });
  items.push({ name: "Advance Tax", date: new Date(year, 11, 15) });
  items.push({ name: "Advance Tax", date: new Date(year, 2, 15) });
  // ITR deadline
  items.push({ name: "ITR Filing", date: new Date(year, 6, 31) });
  return items;
}

type ComplianceItem = { id: string; name: string; due_date: string; status: string; note: string | null };

export default function CompliancePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDeadline, setSelectedDeadline] = useState<{ name: string; date: Date } | null>(null);
  const [note, setNote] = useState("");
  const today = startOfDay(new Date());

  const { data: completedItems = [] } = useQuery({
    queryKey: ["compliance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("compliance_items").select("*").order("due_date");
      if (error) { toast.error("Failed to load compliance data"); throw error; }
      return data as ComplianceItem[];
    },
    enabled: !!user,
  });

  const markDone = useMutation({
    mutationFn: async ({ name, date, note }: { name: string; date: string; note: string }) => {
      const existing = completedItems.find(c => c.name === name && c.due_date === date);
      if (existing) {
        const { error } = await supabase.from("compliance_items").update({ status: "done", note }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("compliance_items").insert({ user_id: user!.id, name, due_date: date, status: "done", note });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      setSelectedDeadline(null);
      setNote("");
      toast.success("Marked as done!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPending = useMutation({
    mutationFn: async ({ name, date }: { name: string; date: string }) => {
      const existing = completedItems.find(c => c.name === name && c.due_date === date);
      if (existing) {
        const { error } = await supabase.from("compliance_items").update({ status: "pending", note: null }).eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance"] });
      toast.success("Marked as pending");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Generate deadlines for current year and next
  const y = currentMonth.getFullYear();
  const allDeadlines = useMemo(() => [...generateDeadlines(y - 1), ...generateDeadlines(y), ...generateDeadlines(y + 1)], [y]);

  const isCompleted = (name: string, date: Date) => {
    const ds = format(date, "yyyy-MM-dd");
    return completedItems.some(c => c.name === name && c.due_date === ds && c.status === "done");
  };

  const getStatus = (name: string, date: Date): "overdue" | "due-soon" | "upcoming" | "done" => {
    if (isCompleted(name, date)) return "done";
    const diff = differenceInDays(date, today);
    if (diff < 0) return "overdue";
    if (diff <= 7) return "due-soon";
    return "upcoming";
  };

  const statusDot = (status: string) => {
    switch (status) {
      case "overdue": return "bg-red-500";
      case "due-soon": return "bg-orange-400";
      case "upcoming": return "bg-blue-500";
      case "done": return "bg-green-500";
      default: return "bg-muted";
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "overdue": return <Badge variant="destructive" className="text-[10px]">Overdue</Badge>;
      case "due-soon": return <Badge className="text-[10px] bg-orange-400 hover:bg-orange-500">Due Soon</Badge>;
      case "upcoming": return <Badge variant="secondary" className="text-[10px]">Upcoming</Badge>;
      case "done": return <Badge className="text-[10px] bg-green-600 hover:bg-green-700">Done</Badge>;
      default: return null;
    }
  };

  // Calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart); // 0=Sun

  // Deadlines for each day in current month view
  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, { name: string; date: Date; status: string }[]>();
    allDeadlines.forEach(d => {
      if (d.date >= monthStart && d.date <= monthEnd) {
        const key = format(d.date, "yyyy-MM-dd");
        const arr = map.get(key) || [];
        arr.push({ ...d, status: getStatus(d.name, d.date) });
        map.set(key, arr);
      }
    });
    return map;
  }, [allDeadlines, completedItems, currentMonth]);

  // Next 10 upcoming deadlines
  const upcoming = useMemo(() => {
    return allDeadlines
      .filter(d => d.date >= today)
      .map(d => ({ ...d, status: getStatus(d.name, d.date) }))
      .filter(d => d.status !== "done")
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 10);
  }, [allDeadlines, completedItems, today]);

  // Summary
  const overdueCount = allDeadlines.filter(d => getStatus(d.name, d.date) === "overdue").length;
  const dueSoonCount = allDeadlines.filter(d => getStatus(d.name, d.date) === "due-soon").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-accent" /> Compliance Calendar
        </h1>
        <p className="text-sm text-muted-foreground">Indian CA compliance deadlines — GSTR, TDS, ITR, PF/ESIC & more</p>
      </div>

      {/* Summary */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="flex gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle className="h-4 w-4" /> {overdueCount} overdue
            </div>
          )}
          {dueSoonCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-sm">
              <Clock className="h-4 w-4" /> {dueSoonCount} due this week
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-['Space_Grotesk']">{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 text-center mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map(day => {
                const key = format(day, "yyyy-MM-dd");
                const dayDeadlines = deadlinesByDay.get(key) || [];
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={key}
                    className={`min-h-[72px] p-1 border-t text-xs ${isToday ? "bg-accent/5" : ""}`}
                  >
                    <div className={`font-medium mb-0.5 ${isToday ? "text-accent font-bold" : "text-foreground"}`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayDeadlines.slice(0, 3).map((dl, i) => (
                        <button
                          key={`${dl.name}-${i}`}
                          onClick={() => { setSelectedDeadline({ name: dl.name, date: dl.date }); setNote(""); }}
                          className="w-full flex items-center gap-1 text-left hover:bg-muted/50 rounded px-0.5 py-0.5 transition-colors"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot(dl.status)}`} />
                          <span className="truncate text-[10px]">{dl.name}</span>
                        </button>
                      ))}
                      {dayDeadlines.length > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-2">+{dayDeadlines.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-3 border-t">
              {[
                { label: "Overdue", color: "bg-red-500" },
                { label: "Due Soon", color: "bg-orange-400" },
                { label: "Upcoming", color: "bg-blue-500" },
                { label: "Done", color: "bg-green-500" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  {l.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar - Upcoming Deadlines */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-['Space_Grotesk']">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">All caught up! 🎉</p>
            ) : (
              upcoming.map((d, i) => (
                <button
                  key={`upcoming-${d.name}-${i}`}
                  onClick={() => { setSelectedDeadline({ name: d.name, date: d.date }); setNote(""); }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(d.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{format(d.date, "dd MMM yyyy")}</p>
                  </div>
                  {statusBadge(d.status)}
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mark Done Dialog */}
      <Dialog open={!!selectedDeadline} onOpenChange={(o) => { if (!o) setSelectedDeadline(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDeadline?.name}</DialogTitle>
          </DialogHeader>
          {selectedDeadline && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{format(selectedDeadline.date, "dd MMMM yyyy")}</span>
                {statusBadge(getStatus(selectedDeadline.name, selectedDeadline.date))}
              </div>

              {isCompleted(selectedDeadline.name, selectedDeadline.date) ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Completed</span>
                  </div>
                  {completedItems.find(c => c.name === selectedDeadline.name && c.due_date === format(selectedDeadline.date, "yyyy-MM-dd"))?.note && (
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {completedItems.find(c => c.name === selectedDeadline.name && c.due_date === format(selectedDeadline.date, "yyyy-MM-dd"))?.note}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => markPending.mutate({ name: selectedDeadline.name, date: format(selectedDeadline.date, "yyyy-MM-dd") })}
                  >
                    Mark as Pending
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="compliance-note">Note (optional)</Label>
                    <Textarea
                      id="compliance-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Acknowledgment number, remarks..."
                      className="mt-1"
                      aria-label="Compliance note"
                    />
                  </div>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => markDone.mutate({ name: selectedDeadline.name, date: format(selectedDeadline.date, "yyyy-MM-dd"), note })}
                    disabled={markDone.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {markDone.isPending ? "Saving..." : "Mark as Done"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
