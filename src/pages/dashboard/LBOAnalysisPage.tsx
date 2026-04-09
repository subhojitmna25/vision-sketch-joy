import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Download, Calculator, IndianRupee, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtPct = (n: number) => n.toFixed(1) + "%";

function calcIRR(cashFlows: number[], guess = 0.1): number {
  let rate = guess;
  for (let iter = 0; iter < 1000; iter++) {
    let npv = 0, dnpv = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      npv += cashFlows[i] / Math.pow(1 + rate, i);
      dnpv -= (i * cashFlows[i]) / Math.pow(1 + rate, i + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-10) return newRate;
    rate = newRate;
  }
  return rate;
}

interface LBOInputs {
  companyName: string;
  entryEBITDA: number;
  entryMultiple: number;
  revenueGrowth: number;
  ebitdaMargin: number;
  debtEquityRatio: number;
  interestRate: number;
  holdPeriod: number;
  exitMultiple: number;
  initialRevenue: number;
}

interface LBOResults {
  entryEV: number;
  entryEquity: number;
  entryDebt: number;
  projections: { year: number; revenue: number; ebitda: number; interest: number; netIncome: number; debtBalance: number }[];
  exitEV: number;
  exitEquity: number;
  totalReturn: number;
  irr: number;
  moic: number;
  cashOnCash: number;
  ebitdaGrowthValue: number;
  multipleExpansionValue: number;
  debtPaydownValue: number;
}

function computeLBO(inputs: LBOInputs): LBOResults {
  const entryEV = inputs.entryEBITDA * inputs.entryMultiple;
  const entryDebt = entryEV * (inputs.debtEquityRatio / (1 + inputs.debtEquityRatio));
  const entryEquity = entryEV - entryDebt;

  const projections = [];
  let debtBalance = entryDebt;
  let revenue = inputs.initialRevenue || inputs.entryEBITDA / (inputs.ebitdaMargin / 100);

  for (let y = 1; y <= inputs.holdPeriod; y++) {
    revenue *= 1 + inputs.revenueGrowth / 100;
    const ebitda = revenue * (inputs.ebitdaMargin / 100);
    const interest = debtBalance * (inputs.interestRate / 100);
    const netIncome = ebitda - interest;
    // Assume 50% of net income used for debt repayment
    const debtRepay = Math.min(Math.max(netIncome * 0.5, 0), debtBalance);
    debtBalance -= debtRepay;
    projections.push({ year: y, revenue, ebitda, interest, netIncome, debtBalance });
  }

  const exitEBITDA = projections[projections.length - 1].ebitda;
  const exitDebt = projections[projections.length - 1].debtBalance;
  const exitEV = exitEBITDA * inputs.exitMultiple;
  const exitEquity = exitEV - exitDebt;
  const totalReturn = exitEquity - entryEquity;

  // IRR
  const cashFlows = [-entryEquity, ...Array(inputs.holdPeriod - 1).fill(0), exitEquity];
  const irr = calcIRR(cashFlows) * 100;

  const moic = exitEquity / entryEquity;
  const cashOnCash = totalReturn / entryEquity * 100;

  // Value creation breakdown
  const ebitdaGrowthValue = (exitEBITDA - inputs.entryEBITDA) * inputs.entryMultiple;
  const multipleExpansionValue = (inputs.exitMultiple - inputs.entryMultiple) * exitEBITDA;
  const debtPaydownValue = entryDebt - exitDebt;

  return {
    entryEV, entryEquity, entryDebt, projections,
    exitEV, exitEquity, totalReturn, irr, moic, cashOnCash,
    ebitdaGrowthValue, multipleExpansionValue, debtPaydownValue,
  };
}

export default function LBOAnalysisPage() {
  const [companyName, setCompanyName] = useState("Sample Corp");
  const [entryEBITDA, setEntryEBITDA] = useState("10000000");
  const [entryMultiple, setEntryMultiple] = useState("8");
  const [revenueGrowth, setRevenueGrowth] = useState("15");
  const [ebitdaMargin, setEbitdaMargin] = useState("25");
  const [debtEquityRatio, setDebtEquityRatio] = useState("1.5");
  const [interestRate, setInterestRate] = useState("10");
  const [holdPeriod, setHoldPeriod] = useState("5");
  const [exitMultiple, setExitMultiple] = useState("10");
  const [initialRevenue, setInitialRevenue] = useState("");

  const results = useMemo(() => {
    const eb = parseFloat(entryEBITDA) || 0;
    if (eb <= 0) return null;
    return computeLBO({
      companyName,
      entryEBITDA: eb,
      entryMultiple: parseFloat(entryMultiple) || 8,
      revenueGrowth: parseFloat(revenueGrowth) || 10,
      ebitdaMargin: parseFloat(ebitdaMargin) || 25,
      debtEquityRatio: parseFloat(debtEquityRatio) || 1.5,
      interestRate: parseFloat(interestRate) || 10,
      holdPeriod: parseInt(holdPeriod) || 5,
      exitMultiple: parseFloat(exitMultiple) || 10,
      initialRevenue: parseFloat(initialRevenue) || 0,
    });
  }, [companyName, entryEBITDA, entryMultiple, revenueGrowth, ebitdaMargin, debtEquityRatio, interestRate, holdPeriod, exitMultiple, initialRevenue]);

  // Sensitivity table
  const entryMultiples = [6, 7, 8, 9, 10];
  const exitMultiples = [8, 9, 10, 11, 12];

  const sensitivityTable = useMemo(() => {
    const eb = parseFloat(entryEBITDA) || 0;
    if (eb <= 0) return [];
    return entryMultiples.map((em) => {
      const row: { entryMult: number; [key: number]: number } = { entryMult: em };
      exitMultiples.forEach((xm) => {
        const r = computeLBO({
          companyName, entryEBITDA: eb,
          entryMultiple: em, revenueGrowth: parseFloat(revenueGrowth) || 10,
          ebitdaMargin: parseFloat(ebitdaMargin) || 25, debtEquityRatio: parseFloat(debtEquityRatio) || 1.5,
          interestRate: parseFloat(interestRate) || 10, holdPeriod: parseInt(holdPeriod) || 5,
          exitMultiple: xm, initialRevenue: parseFloat(initialRevenue) || 0,
        });
        row[xm] = r.irr;
      });
      return row;
    });
  }, [entryEBITDA, revenueGrowth, ebitdaMargin, debtEquityRatio, interestRate, holdPeriod, initialRevenue, companyName]);

  const waterfallData = results ? [
    { name: "EBITDA Growth", value: results.ebitdaGrowthValue, fill: "hsl(var(--primary))" },
    { name: "Multiple Expansion", value: results.multipleExpansionValue, fill: "hsl(var(--accent))" },
    { name: "Debt Paydown", value: results.debtPaydownValue, fill: "hsl(142 76% 36%)" },
  ] : [];

  const ebitdaChartData = results ? results.projections.map((p) => ({
    year: `Year ${p.year}`,
    ebitda: Math.round(p.ebitda),
  })) : [];

  const exportPDF = () => {
    if (!results) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`LBO Analysis - ${companyName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);

    doc.setFontSize(12);
    doc.text("Key Metrics", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Metric", "Value"]],
      body: [
        ["Entry EV", fmt(results.entryEV)],
        ["Entry Equity", fmt(results.entryEquity)],
        ["Entry Debt", fmt(results.entryDebt)],
        ["Exit EV", fmt(results.exitEV)],
        ["Exit Equity", fmt(results.exitEquity)],
        ["Total Return", fmt(results.totalReturn)],
        ["IRR", fmtPct(results.irr)],
        ["MOIC", results.moic.toFixed(2) + "x"],
        ["Cash-on-Cash", fmtPct(results.cashOnCash)],
      ],
    });

    doc.text("Year-by-Year Projections", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Year", "Revenue", "EBITDA", "Interest", "Net Income", "Debt Balance"]],
      body: results.projections.map((p) => [
        p.year, fmt(p.revenue), fmt(p.ebitda), fmt(p.interest), fmt(p.netIncome), fmt(p.debtBalance),
      ]),
    });

    doc.addPage();
    doc.setFontSize(12);
    doc.text("IRR Sensitivity Table (Entry vs Exit Multiple)", 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [["Entry \\ Exit", ...exitMultiples.map((x) => x + "x")]],
      body: sensitivityTable.map((row) => [
        row.entryMult + "x",
        ...exitMultiples.map((xm) => fmtPct(row[xm])),
      ]),
    });

    doc.text("Value Creation Breakdown", 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [["Component", "Value"]],
      body: [
        ["EBITDA Growth", fmt(results.ebitdaGrowthValue)],
        ["Multiple Expansion", fmt(results.multipleExpansionValue)],
        ["Debt Paydown", fmt(results.debtPaydownValue)],
        ["Total Value Created", fmt(results.ebitdaGrowthValue + results.multipleExpansionValue + results.debtPaydownValue)],
      ],
    });

    doc.save(`LBO-Analysis-${companyName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">LBO Analysis</h1>
            <p className="text-muted-foreground">Leveraged Buyout modeling with IRR sensitivity</p>
          </div>
        </div>
        {results && (
          <Button onClick={exportPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export PDF
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-lg">Input Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Company Name</Label><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
            <div><Label>Entry EBITDA (₹)</Label><Input type="number" value={entryEBITDA} onChange={(e) => setEntryEBITDA(e.target.value)} /></div>
            <div><Label>Initial Revenue (₹) <span className="text-muted-foreground text-xs">(optional, auto from margin)</span></Label><Input type="number" value={initialRevenue} onChange={(e) => setInitialRevenue(e.target.value)} placeholder="Auto-calculated" /></div>
            <div><Label>Entry EV/EBITDA Multiple</Label><Input type="number" step="0.5" value={entryMultiple} onChange={(e) => setEntryMultiple(e.target.value)} /></div>
            <div><Label>Revenue Growth Rate (%/yr)</Label><Input type="number" value={revenueGrowth} onChange={(e) => setRevenueGrowth(e.target.value)} /></div>
            <div><Label>EBITDA Margin (%)</Label><Input type="number" value={ebitdaMargin} onChange={(e) => setEbitdaMargin(e.target.value)} /></div>
            <div><Label>Debt/Equity Ratio at Entry</Label><Input type="number" step="0.1" value={debtEquityRatio} onChange={(e) => setDebtEquityRatio(e.target.value)} /></div>
            <div><Label>Interest Rate on Debt (%)</Label><Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} /></div>
            <div>
              <Label>Hold Period (years)</Label>
              <Select value={holdPeriod} onValueChange={setHoldPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="4">4 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Exit EV/EBITDA Multiple</Label><Input type="number" step="0.5" value={exitMultiple} onChange={(e) => setExitMultiple(e.target.value)} /></div>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {results ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">Entry EV</p>
                  <p className="text-lg font-bold text-foreground">{fmt(results.entryEV)}</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">IRR</p>
                  <p className={`text-lg font-bold ${results.irr >= 20 ? "text-green-600" : results.irr >= 10 ? "text-yellow-600" : "text-destructive"}`}>
                    {fmtPct(results.irr)}
                  </p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">MOIC</p>
                  <p className="text-lg font-bold text-foreground">{results.moic.toFixed(2)}x</p>
                </CardContent></Card>
                <Card><CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground">Cash-on-Cash</p>
                  <p className={`text-lg font-bold ${results.cashOnCash > 0 ? "text-green-600" : "text-destructive"}`}>
                    {fmtPct(results.cashOnCash)}
                  </p>
                </CardContent></Card>
              </div>

              {/* Entry/Exit Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Entry Structure</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Equity:</span><span className="font-semibold">{fmt(results.entryEquity)}</span></div>
                    <div className="flex justify-between"><span>Debt:</span><span className="font-semibold">{fmt(results.entryDebt)}</span></div>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Exit Values</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Exit EV:</span><span className="font-semibold">{fmt(results.exitEV)}</span></div>
                    <div className="flex justify-between"><span>Exit Equity:</span><span className="font-semibold">{fmt(results.exitEquity)}</span></div>
                  </div>
                </CardContent></Card>
                <Card><CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Returns</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Total Return:</span>
                      <span className={`font-semibold ${results.totalReturn >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {fmt(results.totalReturn)}
                      </span>
                    </div>
                  </div>
                </CardContent></Card>
              </div>

              {/* Projections Table */}
              <Card>
                <CardHeader><CardTitle className="text-base">Year-by-Year Projections</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">EBITDA</TableHead>
                          <TableHead className="text-right">Interest</TableHead>
                          <TableHead className="text-right">Net Income</TableHead>
                          <TableHead className="text-right">Debt Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.projections.map((p) => (
                          <TableRow key={p.year}>
                            <TableCell>{p.year}</TableCell>
                            <TableCell className="text-right">{fmt(p.revenue)}</TableCell>
                            <TableCell className="text-right">{fmt(p.ebitda)}</TableCell>
                            <TableCell className="text-right text-destructive">{fmt(p.interest)}</TableCell>
                            <TableCell className={`text-right ${p.netIncome >= 0 ? "text-green-600" : "text-destructive"}`}>{fmt(p.netIncome)}</TableCell>
                            <TableCell className="text-right">{fmt(p.debtBalance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">EBITDA Growth</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={ebitdaChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" fontSize={12} />
                        <YAxis tickFormatter={(v) => "₹" + (v / 1e6).toFixed(1) + "M"} fontSize={10} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="ebitda" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Value Creation Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={waterfallData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(v) => "₹" + (v / 1e6).toFixed(1) + "M"} fontSize={10} />
                        <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {waterfallData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* IRR Sensitivity */}
              <Card>
                <CardHeader><CardTitle className="text-base">IRR Sensitivity (Entry vs Exit Multiple)</CardTitle></CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-muted">Entry \ Exit</TableHead>
                          {exitMultiples.map((x) => (
                            <TableHead key={x} className="text-center bg-muted">{x}x</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sensitivityTable.map((row) => (
                          <TableRow key={row.entryMult}>
                            <TableCell className="font-semibold bg-muted">{row.entryMult}x</TableCell>
                            {exitMultiples.map((xm) => {
                              const irr = row[xm];
                              const bg = irr >= 25 ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : irr >= 15 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
                              return (
                                <TableCell key={xm} className={`text-center font-mono text-sm ${bg}`}>
                                  {fmtPct(irr)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Enter EBITDA to generate LBO analysis</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
