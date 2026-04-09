import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calculator, TrendingUp, PieChart as PieIcon, Wallet, Plus, Trash2, BarChart3 } from "lucide-react";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtPct = (n: number) => n.toFixed(2) + "%";

// ─── DCF Calculator ────────────────────────────────────────────────────────
function DCFCalculator() {
  const [revenue, setRevenue] = useState("100000000");
  const [growthRate, setGrowthRate] = useState("15");
  const [ebitdaMargin, setEbitdaMargin] = useState("25");
  const [taxRate, setTaxRate] = useState("25");
  const [capexPct, setCapexPct] = useState("5");
  const [wcPct, setWcPct] = useState("3");
  const [wacc, setWacc] = useState("12");
  const [terminalGrowth, setTerminalGrowth] = useState("4");
  const [sharesOutstanding, setSharesOutstanding] = useState("10000000");
  const [netDebt, setNetDebt] = useState("20000000");
  const [scenario, setScenario] = useState<"base" | "bull" | "bear">("base");

  const scenarioMultipliers = { bull: 1.2, base: 1, bear: 0.8 };

  const results = useMemo(() => {
    const rev = (parseFloat(revenue) || 0) * scenarioMultipliers[scenario];
    const gr = parseFloat(growthRate) || 0;
    const em = parseFloat(ebitdaMargin) || 0;
    const tr = parseFloat(taxRate) || 0;
    const cp = parseFloat(capexPct) || 0;
    const wc = parseFloat(wcPct) || 0;
    const w = parseFloat(wacc) || 12;
    const tg = parseFloat(terminalGrowth) || 3;
    const shares = parseFloat(sharesOutstanding) || 1;
    const debt = parseFloat(netDebt) || 0;

    if (rev <= 0 || w <= tg) return null;

    const projections = [];
    let cumRev = rev;
    let totalPVFCF = 0;

    for (let y = 1; y <= 5; y++) {
      cumRev *= 1 + gr / 100;
      const ebitda = cumRev * (em / 100);
      const nopat = ebitda * (1 - tr / 100);
      const capex = cumRev * (cp / 100);
      const wcChange = cumRev * (wc / 100);
      const fcf = nopat - capex - wcChange;
      const pvFactor = 1 / Math.pow(1 + w / 100, y);
      const pvFCF = fcf * pvFactor;
      totalPVFCF += pvFCF;
      projections.push({ year: y, revenue: cumRev, ebitda, fcf, pvFCF });
    }

    const terminalFCF = projections[4].fcf * (1 + tg / 100);
    const terminalValue = terminalFCF / (w / 100 - tg / 100);
    const pvTerminal = terminalValue / Math.pow(1 + w / 100, 5);
    const enterpriseValue = totalPVFCF + pvTerminal;
    const equityValue = enterpriseValue - debt;
    const pricePerShare = equityValue / shares;

    return { projections, terminalValue, pvTerminal, totalPVFCF, enterpriseValue, equityValue, pricePerShare };
  }, [revenue, growthRate, ebitdaMargin, taxRate, capexPct, wcPct, wacc, terminalGrowth, sharesOutstanding, netDebt, scenario]);

  // Sensitivity table
  const waccValues = [10, 11, 12, 13, 14];
  const tgValues = [2, 3, 4, 5, 6];

  const sensitivityTable = useMemo(() => {
    const rev = (parseFloat(revenue) || 0) * scenarioMultipliers[scenario];
    const gr = parseFloat(growthRate) || 0;
    const em = parseFloat(ebitdaMargin) || 0;
    const tr = parseFloat(taxRate) || 0;
    const cp = parseFloat(capexPct) || 0;
    const wc = parseFloat(wcPct) || 0;
    const shares = parseFloat(sharesOutstanding) || 1;
    const debt = parseFloat(netDebt) || 0;
    if (rev <= 0) return [];

    return waccValues.map((w) => {
      const row: { wacc: number; [key: number]: number } = { wacc: w };
      tgValues.forEach((tg) => {
        if (w / 100 <= tg / 100) { row[tg] = NaN; return; }
        let cumRev = rev, totalPV = 0, lastFCF = 0;
        for (let y = 1; y <= 5; y++) {
          cumRev *= 1 + gr / 100;
          const ebitda = cumRev * (em / 100);
          const nopat = ebitda * (1 - tr / 100);
          const fcf = nopat - cumRev * (cp / 100) - cumRev * (wc / 100);
          totalPV += fcf / Math.pow(1 + w / 100, y);
          lastFCF = fcf;
        }
        const tv = (lastFCF * (1 + tg / 100)) / (w / 100 - tg / 100);
        const pvTV = tv / Math.pow(1 + w / 100, 5);
        const ev = totalPV + pvTV;
        row[tg] = (ev - debt) / shares;
      });
      return row;
    });
  }, [revenue, growthRate, ebitdaMargin, taxRate, capexPct, wcPct, sharesOutstanding, netDebt, scenario]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        {(["bull", "base", "bear"] as const).map((s) => (
          <Button key={s} variant={scenario === s ? "default" : "outline"} size="sm" onClick={() => setScenario(s)}
            className={scenario === s ? (s === "bull" ? "bg-green-600 hover:bg-green-700" : s === "bear" ? "bg-red-600 hover:bg-red-700" : "") : ""}>
            {s.charAt(0).toUpperCase() + s.slice(1)} Case
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label>Revenue (₹)</Label><Input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></div>
        <div><Label>Growth Rate (%)</Label><Input type="number" value={growthRate} onChange={(e) => setGrowthRate(e.target.value)} /></div>
        <div><Label>EBITDA Margin (%)</Label><Input type="number" value={ebitdaMargin} onChange={(e) => setEbitdaMargin(e.target.value)} /></div>
        <div><Label>Tax Rate (%)</Label><Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
        <div><Label>Capex (% of Rev)</Label><Input type="number" value={capexPct} onChange={(e) => setCapexPct(e.target.value)} /></div>
        <div><Label>Working Capital (%)</Label><Input type="number" value={wcPct} onChange={(e) => setWcPct(e.target.value)} /></div>
        <div><Label>WACC (%)</Label><Input type="number" value={wacc} onChange={(e) => setWacc(e.target.value)} /></div>
        <div><Label>Terminal Growth (%)</Label><Input type="number" value={terminalGrowth} onChange={(e) => setTerminalGrowth(e.target.value)} /></div>
        <div><Label>Shares Outstanding</Label><Input type="number" value={sharesOutstanding} onChange={(e) => setSharesOutstanding(e.target.value)} /></div>
        <div><Label>Net Debt (₹)</Label><Input type="number" value={netDebt} onChange={(e) => setNetDebt(e.target.value)} /></div>
      </div>

      {results && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Enterprise Value</p><p className="text-lg font-bold text-foreground">{fmt(results.enterpriseValue)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Equity Value</p><p className="text-lg font-bold text-foreground">{fmt(results.equityValue)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Price/Share</p><p className="text-lg font-bold text-primary">{fmt(results.pricePerShare)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Terminal Value</p><p className="text-lg font-bold text-foreground">{fmt(results.pvTerminal)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">FCF Projections</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Year</TableHead><TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">EBITDA</TableHead><TableHead className="text-right">FCF</TableHead>
                    <TableHead className="text-right">PV of FCF</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {results.projections.map((p) => (
                      <TableRow key={p.year}>
                        <TableCell>{p.year}</TableCell>
                        <TableCell className="text-right">{fmt(p.revenue)}</TableCell>
                        <TableCell className="text-right">{fmt(p.ebitda)}</TableCell>
                        <TableCell className="text-right">{fmt(p.fcf)}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(p.pvFCF)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Sensitivity: Price/Share (WACC vs Terminal Growth)</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="bg-muted">WACC \ TGR</TableHead>
                    {tgValues.map((t) => <TableHead key={t} className="text-center bg-muted">{t}%</TableHead>)}
                  </TableRow></TableHeader>
                  <TableBody>
                    {sensitivityTable.map((row) => (
                      <TableRow key={row.wacc}>
                        <TableCell className="font-semibold bg-muted">{row.wacc}%</TableCell>
                        {tgValues.map((t) => {
                          const v = row[t];
                          return <TableCell key={t} className={`text-center font-mono text-sm ${isNaN(v) ? "bg-muted" : ""}`}>
                            {isNaN(v) ? "N/A" : fmt(v)}
                          </TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Ratio Analysis ────────────────────────────────────────────────────────
const BENCHMARKS: Record<string, { good: number; warn: number; higher?: boolean }> = {
  "P/E": { good: 20, warn: 35, higher: false },
  "P/B": { good: 3, warn: 5, higher: false },
  "EV/EBITDA": { good: 12, warn: 18, higher: false },
  "D/E": { good: 1, warn: 2, higher: false },
  "ROE (%)": { good: 15, warn: 10, higher: true },
  "ROCE (%)": { good: 15, warn: 10, higher: true },
  "Current Ratio": { good: 1.5, warn: 1, higher: true },
  "Quick Ratio": { good: 1, warn: 0.7, higher: true },
  "Interest Coverage": { good: 3, warn: 1.5, higher: true },
};

function getRatioColor(name: string, value: number): string {
  const b = BENCHMARKS[name];
  if (!b) return "";
  if (b.higher) {
    if (value >= b.good) return "text-green-600 dark:text-green-400";
    if (value >= b.warn) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  } else {
    if (value <= b.good) return "text-green-600 dark:text-green-400";
    if (value <= b.warn) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  }
}

function getRatioBadge(name: string, value: number): string {
  const b = BENCHMARKS[name];
  if (!b) return "outline";
  if (b.higher) return value >= b.good ? "default" : value >= b.warn ? "secondary" : "destructive";
  return value <= b.good ? "default" : value <= b.warn ? "secondary" : "destructive";
}

function RatioAnalysis() {
  const [marketCap, setMarketCap] = useState("50000000000");
  const [revenueR, setRevenueR] = useState("10000000000");
  const [ebitdaR, setEbitdaR] = useState("2500000000");
  const [pat, setPat] = useState("1500000000");
  const [totalDebt, setTotalDebt] = useState("5000000000");
  const [equity, setEquity] = useState("8000000000");
  const [currentAssets, setCurrentAssets] = useState("4000000000");
  const [currentLiab, setCurrentLiab] = useState("2500000000");
  const [inventory, setInventory] = useState("1000000000");
  const [interestExp, setInterestExp] = useState("500000000");
  const [bookValue, setBookValue] = useState("80");
  const [cmp, setCmp] = useState("500");
  const [capitalEmployed, setCapitalEmployed] = useState("13000000000");

  const ratios = useMemo(() => {
    const mc = parseFloat(marketCap) || 0;
    const p = parseFloat(pat) || 1;
    const eb = parseFloat(ebitdaR) || 1;
    const d = parseFloat(totalDebt) || 0;
    const eq = parseFloat(equity) || 1;
    const ca = parseFloat(currentAssets) || 0;
    const cl = parseFloat(currentLiab) || 1;
    const inv = parseFloat(inventory) || 0;
    const ie = parseFloat(interestExp) || 1;
    const bv = parseFloat(bookValue) || 1;
    const price = parseFloat(cmp) || 0;
    const ce = parseFloat(capitalEmployed) || 1;

    return [
      { name: "P/E", value: price > 0 && p > 0 ? mc / p : 0 },
      { name: "P/B", value: price / bv },
      { name: "EV/EBITDA", value: (mc + d) / eb },
      { name: "D/E", value: d / eq },
      { name: "ROE (%)", value: (p / eq) * 100 },
      { name: "ROCE (%)", value: (eb * 0.75 / ce) * 100 },
      { name: "Current Ratio", value: ca / cl },
      { name: "Quick Ratio", value: (ca - inv) / cl },
      { name: "Interest Coverage", value: eb / ie },
    ];
  }, [marketCap, pat, ebitdaR, totalDebt, equity, currentAssets, currentLiab, inventory, interestExp, bookValue, cmp, capitalEmployed]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label>Market Cap (₹)</Label><Input type="number" value={marketCap} onChange={(e) => setMarketCap(e.target.value)} /></div>
        <div><Label>CMP (₹)</Label><Input type="number" value={cmp} onChange={(e) => setCmp(e.target.value)} /></div>
        <div><Label>Revenue (₹)</Label><Input type="number" value={revenueR} onChange={(e) => setRevenueR(e.target.value)} /></div>
        <div><Label>EBITDA (₹)</Label><Input type="number" value={ebitdaR} onChange={(e) => setEbitdaR(e.target.value)} /></div>
        <div><Label>PAT (₹)</Label><Input type="number" value={pat} onChange={(e) => setPat(e.target.value)} /></div>
        <div><Label>Total Debt (₹)</Label><Input type="number" value={totalDebt} onChange={(e) => setTotalDebt(e.target.value)} /></div>
        <div><Label>Equity (₹)</Label><Input type="number" value={equity} onChange={(e) => setEquity(e.target.value)} /></div>
        <div><Label>Book Value/Share</Label><Input type="number" value={bookValue} onChange={(e) => setBookValue(e.target.value)} /></div>
        <div><Label>Current Assets (₹)</Label><Input type="number" value={currentAssets} onChange={(e) => setCurrentAssets(e.target.value)} /></div>
        <div><Label>Current Liabilities (₹)</Label><Input type="number" value={currentLiab} onChange={(e) => setCurrentLiab(e.target.value)} /></div>
        <div><Label>Inventory (₹)</Label><Input type="number" value={inventory} onChange={(e) => setInventory(e.target.value)} /></div>
        <div><Label>Interest Expense (₹)</Label><Input type="number" value={interestExp} onChange={(e) => setInterestExp(e.target.value)} /></div>
        <div><Label>Capital Employed (₹)</Label><Input type="number" value={capitalEmployed} onChange={(e) => setCapitalEmployed(e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ratios.map((r) => (
          <Card key={r.name}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{r.name}</p>
                <p className={`text-2xl font-bold ${getRatioColor(r.name, r.value)}`}>
                  {r.value.toFixed(2)}
                </p>
              </div>
              <Badge variant={getRatioBadge(r.name, r.value) as any}>
                {getRatioBadge(r.name, r.value) === "default" ? "Healthy" : getRatioBadge(r.name, r.value) === "secondary" ? "Caution" : "Warning"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Portfolio Tracker ─────────────────────────────────────────────────────
interface Holding {
  id: string;
  name: string;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  purchaseDate: string;
}

function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { id: "1", name: "Reliance Industries", purchasePrice: 2400, currentPrice: 2850, quantity: 50, purchaseDate: "2025-01-15" },
    { id: "2", name: "TCS", purchasePrice: 3800, currentPrice: 3600, quantity: 30, purchaseDate: "2025-03-01" },
    { id: "3", name: "HDFC Bank", purchasePrice: 1600, currentPrice: 1750, quantity: 100, purchaseDate: "2024-12-10" },
  ]);
  const [newName, setNewName] = useState("");
  const [newPP, setNewPP] = useState("");
  const [newCP, setNewCP] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newDate, setNewDate] = useState("");

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 36%)", "hsl(45 93% 47%)", "hsl(280 65% 60%)"];

  const addHolding = () => {
    if (!newName || !newPP || !newCP || !newQty) return;
    setHoldings([...holdings, {
      id: Date.now().toString(), name: newName,
      purchasePrice: parseFloat(newPP), currentPrice: parseFloat(newCP),
      quantity: parseInt(newQty), purchaseDate: newDate || new Date().toISOString().split("T")[0],
    }]);
    setNewName(""); setNewPP(""); setNewCP(""); setNewQty(""); setNewDate("");
  };

  const removeHolding = (id: string) => setHoldings(holdings.filter((h) => h.id !== id));

  const totalInvested = holdings.reduce((s, h) => s + h.purchasePrice * h.quantity, 0);
  const totalCurrent = holdings.reduce((s, h) => s + h.currentPrice * h.quantity, 0);
  const totalGain = totalCurrent - totalInvested;
  const totalReturn = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const sorted = [...holdings].sort((a, b) => {
    const retA = (a.currentPrice - a.purchasePrice) / a.purchasePrice;
    const retB = (b.currentPrice - b.purchasePrice) / b.purchasePrice;
    return retB - retA;
  });

  const pieData = holdings.map((h) => ({
    name: h.name,
    value: h.currentPrice * h.quantity,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Invested</p><p className="text-lg font-bold text-foreground">{fmt(totalInvested)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Current Value</p><p className="text-lg font-bold text-foreground">{fmt(totalCurrent)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Gain/Loss</p><p className={`text-lg font-bold ${totalGain >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(totalGain)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Return</p><p className={`text-lg font-bold ${totalReturn >= 0 ? "text-green-600" : "text-destructive"}`}>{fmtPct(totalReturn)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Allocation</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Best & Worst Performers</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {sorted.slice(0, 2).map((h) => {
              const ret = ((h.currentPrice - h.purchasePrice) / h.purchasePrice) * 100;
              return (
                <div key={h.id} className="flex justify-between items-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <span className="font-medium text-sm">{h.name}</span>
                  <span className="text-green-600 font-bold text-sm">+{fmtPct(ret)}</span>
                </div>
              );
            })}
            {sorted.slice(-1).map((h) => {
              const ret = ((h.currentPrice - h.purchasePrice) / h.purchasePrice) * 100;
              return (
                <div key={h.id} className={`flex justify-between items-center p-2 rounded-lg ${ret < 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}`}>
                  <span className="font-medium text-sm">{h.name}</span>
                  <span className={`font-bold text-sm ${ret < 0 ? "text-destructive" : "text-green-600"}`}>{fmtPct(ret)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Add holding */}
      <Card>
        <CardHeader><CardTitle className="text-base">Add Holding</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Input placeholder="Stock Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input type="number" placeholder="Buy Price" value={newPP} onChange={(e) => setNewPP(e.target.value)} />
            <Input type="number" placeholder="Current Price" value={newCP} onChange={(e) => setNewCP(e.target.value)} />
            <Input type="number" placeholder="Quantity" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            <Button onClick={addHolding}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>
        </CardContent>
      </Card>

      {/* Holdings table */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Stock</TableHead><TableHead className="text-right">Buy Price</TableHead>
            <TableHead className="text-right">Current</TableHead><TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Invested</TableHead><TableHead className="text-right">Current Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead><TableHead className="text-right">Return</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {holdings.map((h) => {
              const invested = h.purchasePrice * h.quantity;
              const current = h.currentPrice * h.quantity;
              const gain = current - invested;
              const ret = (gain / invested) * 100;
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="text-right">{fmt(h.purchasePrice)}</TableCell>
                  <TableCell className="text-right">{fmt(h.currentPrice)}</TableCell>
                  <TableCell className="text-right">{h.quantity}</TableCell>
                  <TableCell className="text-right">{fmt(invested)}</TableCell>
                  <TableCell className="text-right">{fmt(current)}</TableCell>
                  <TableCell className={`text-right font-semibold ${gain >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(gain)}</TableCell>
                  <TableCell className={`text-right font-semibold ${ret >= 0 ? "text-green-600" : "text-destructive"}`}>{fmtPct(ret)}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => removeHolding(h.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ─── SIP Calculator ────────────────────────────────────────────────────────
function SIPCalculator() {
  const [monthly, setMonthly] = useState("25000");
  const [returnRate, setReturnRate] = useState("12");
  const [years, setYears] = useState("20");

  const results = useMemo(() => {
    const m = parseFloat(monthly) || 0;
    const r = (parseFloat(returnRate) || 0) / 100 / 12;
    const n = (parseInt(years) || 0) * 12;
    if (m <= 0 || n <= 0) return null;

    const totalInvested = m * n;
    const futureValue = r > 0 ? m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : totalInvested;
    const totalReturns = futureValue - totalInvested;

    // Chart data
    const chartData = [];
    let cumInvested = 0, cumValue = 0;
    for (let y = 1; y <= parseInt(years); y++) {
      const months = y * 12;
      cumInvested = m * months;
      cumValue = r > 0 ? m * ((Math.pow(1 + r, months) - 1) / r) * (1 + r) : cumInvested;
      chartData.push({ year: `Year ${y}`, invested: Math.round(cumInvested), wealth: Math.round(cumValue) });
    }

    return { totalInvested, futureValue, totalReturns, chartData };
  }, [monthly, returnRate, years]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><Label>Monthly SIP Amount (₹)</Label><Input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
        <div><Label>Expected Annual Return (%)</Label><Input type="number" value={returnRate} onChange={(e) => setReturnRate(e.target.value)} /></div>
        <div><Label>Investment Period (Years)</Label><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></div>
      </div>

      {results && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Invested</p><p className="text-lg font-bold text-foreground">{fmt(results.totalInvested)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total Returns</p><p className="text-lg font-bold text-green-600">{fmt(results.totalReturns)}</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Final Corpus</p><p className="text-lg font-bold text-primary">{fmt(results.futureValue)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Wealth Growth Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={results.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={11} />
                  <YAxis tickFormatter={(v) => "₹" + (v / 1e5).toFixed(0) + "L"} fontSize={10} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="invested" name="Invested" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="wealth" name="Wealth" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function InvestmentAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Investment Analysis</h1>
          <p className="text-muted-foreground">DCF, Ratios, Portfolio & SIP tools</p>
        </div>
      </div>

      <Tabs defaultValue="dcf" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="dcf"><Calculator className="h-4 w-4 mr-1" /> DCF Valuation</TabsTrigger>
          <TabsTrigger value="ratios"><TrendingUp className="h-4 w-4 mr-1" /> Ratio Analysis</TabsTrigger>
          <TabsTrigger value="portfolio"><Wallet className="h-4 w-4 mr-1" /> Portfolio Tracker</TabsTrigger>
          <TabsTrigger value="sip"><PieIcon className="h-4 w-4 mr-1" /> SIP Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="dcf"><DCFCalculator /></TabsContent>
        <TabsContent value="ratios"><RatioAnalysis /></TabsContent>
        <TabsContent value="portfolio"><PortfolioTracker /></TabsContent>
        <TabsContent value="sip"><SIPCalculator /></TabsContent>
      </Tabs>
    </div>
  );
}
