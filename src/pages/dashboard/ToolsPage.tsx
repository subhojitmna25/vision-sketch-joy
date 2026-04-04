import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, IndianRupee, Percent, TrendingDown, Receipt, PiggyBank, ArrowRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ─── Income Tax Calculator (New Regime FY 2025-26) ──────────────────────────

const NEW_REGIME_SLABS = [
  { from: 0, to: 400000, rate: 0 },
  { from: 400000, to: 800000, rate: 5 },
  { from: 800000, to: 1200000, rate: 10 },
  { from: 1200000, to: 1600000, rate: 15 },
  { from: 1600000, to: 2000000, rate: 20 },
  { from: 2000000, to: 2400000, rate: 25 },
  { from: 2400000, to: Infinity, rate: 30 },
];

const OLD_REGIME_SLABS = [
  { from: 0, to: 250000, rate: 0 },
  { from: 250000, to: 500000, rate: 5 },
  { from: 500000, to: 1000000, rate: 20 },
  { from: 1000000, to: Infinity, rate: 30 },
];

function calcTax(income: number, slabs: typeof NEW_REGIME_SLABS) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.from) break;
    const taxable = Math.min(income, slab.to) - slab.from;
    tax += (taxable * slab.rate) / 100;
  }
  return tax;
}

function IncomeTaxCalc() {
  const [income, setIncome] = useState("");
  const [deductions80C, setDeductions80C] = useState("");
  const [deductions80D, setDeductions80D] = useState("");
  const [hra, setHra] = useState("");
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [result, setResult] = useState<{
    taxableIncome: number;
    tax: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
    rebate87A: number;
  } | null>(null);

  const calculate = () => {
    const gross = parseFloat(income) || 0;
    let taxableIncome = gross;
    let standardDeduction = 75000; // FY 2025-26

    if (regime === "old") {
      const d80C = Math.min(parseFloat(deductions80C) || 0, 150000);
      const d80D = Math.min(parseFloat(deductions80D) || 0, 100000);
      const hraExempt = parseFloat(hra) || 0;
      taxableIncome = Math.max(0, gross - standardDeduction - d80C - d80D - hraExempt);
    } else {
      taxableIncome = Math.max(0, gross - standardDeduction);
    }

    const slabs = regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
    let tax = calcTax(taxableIncome, slabs);

    // Section 87A rebate
    let rebate = 0;
    if (regime === "new" && taxableIncome <= 1200000) {
      rebate = Math.min(tax, 60000);
    } else if (regime === "old" && taxableIncome <= 500000) {
      rebate = Math.min(tax, 12500);
    }
    tax = Math.max(0, tax - rebate);

    const cess = tax * 0.04;
    const totalTax = Math.round(tax + cess);
    const effectiveRate = gross > 0 ? (totalTax / gross) * 100 : 0;

    setResult({ taxableIncome, tax, cess, totalTax, effectiveRate, rebate87A: rebate });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Gross Annual Income (₹)</Label>
          <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 1500000" />
        </div>
        <div>
          <Label>Tax Regime</Label>
          <Select value={regime} onValueChange={(v) => setRegime(v as "new" | "old")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New Regime (FY 2025-26)</SelectItem>
              <SelectItem value="old">Old Regime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {regime === "old" && (
          <>
            <div>
              <Label>Section 80C Deductions (₹)</Label>
              <Input type="number" value={deductions80C} onChange={(e) => setDeductions80C(e.target.value)} placeholder="Max ₹1,50,000" />
            </div>
            <div>
              <Label>Section 80D (Medical Insurance) (₹)</Label>
              <Input type="number" value={deductions80D} onChange={(e) => setDeductions80D(e.target.value)} placeholder="Max ₹1,00,000" />
            </div>
            <div>
              <Label>HRA Exemption (₹)</Label>
              <Input type="number" value={hra} onChange={(e) => setHra(e.target.value)} placeholder="Calculated HRA exemption" />
            </div>
          </>
        )}
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Calculate Tax
      </Button>
      {result && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Taxable Income</span><p className="font-semibold text-foreground">₹{result.taxableIncome.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Tax Before Cess</span><p className="font-semibold text-foreground">₹{Math.round(result.tax).toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">87A Rebate</span><p className="font-semibold text-success">- ₹{Math.round(result.rebate87A).toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Health & Education Cess (4%)</span><p className="font-semibold text-foreground">₹{Math.round(result.cess).toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Total Tax Payable</span><p className="font-bold text-lg text-accent">₹{result.totalTax.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Effective Rate</span><p className="font-semibold text-foreground">{result.effectiveRate.toFixed(2)}%</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── GST Calculator ─────────────────────────────────────────────────────────

function GSTCalc() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [type, setType] = useState<"exclusive" | "inclusive">("exclusive");
  const [result, setResult] = useState<{ base: number; cgst: number; sgst: number; igst: number; total: number } | null>(null);

  const calculate = () => {
    const a = parseFloat(amount) || 0;
    const r = parseFloat(rate) || 0;
    let base: number, gst: number;
    if (type === "exclusive") {
      base = a;
      gst = (a * r) / 100;
    } else {
      base = (a * 100) / (100 + r);
      gst = a - base;
    }
    setResult({ base, cgst: gst / 2, sgst: gst / 2, igst: gst, total: base + gst });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Amount (₹)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
        </div>
        <div>
          <Label>GST Rate (%)</Label>
          <Select value={rate} onValueChange={setRate}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["0", "0.25", "3", "5", "12", "18", "28"].map((r) => (
                <SelectItem key={r} value={r}>{r}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as "exclusive" | "inclusive")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="exclusive">GST Exclusive (Add GST)</SelectItem>
              <SelectItem value="inclusive">GST Inclusive (Extract GST)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Calculate GST
      </Button>
      {result && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Base Amount</span><p className="font-semibold text-foreground">₹{result.base.toFixed(2)}</p></div>
            <div><span className="text-muted-foreground">CGST ({parseFloat(rate) / 2}%)</span><p className="font-semibold text-foreground">₹{result.cgst.toFixed(2)}</p></div>
            <div><span className="text-muted-foreground">SGST ({parseFloat(rate) / 2}%)</span><p className="font-semibold text-foreground">₹{result.sgst.toFixed(2)}</p></div>
            <div><span className="text-muted-foreground">Total (Intra-state)</span><p className="font-bold text-accent">₹{result.total.toFixed(2)}</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── TDS Calculator ─────────────────────────────────────────────────────────

const TDS_SECTIONS = [
  { section: "194A", description: "Interest (other than on securities)", rate: 10, threshold: 40000 },
  { section: "194C", description: "Payment to Contractor (Individual/HUF)", rate: 1, threshold: 30000 },
  { section: "194C", description: "Payment to Contractor (Others)", rate: 2, threshold: 30000 },
  { section: "194H", description: "Commission / Brokerage", rate: 5, threshold: 15000 },
  { section: "194I(a)", description: "Rent - Plant & Machinery", rate: 2, threshold: 240000 },
  { section: "194I(b)", description: "Rent - Land/Building/Furniture", rate: 10, threshold: 240000 },
  { section: "194J(a)", description: "Professional / Technical Fees (FTS)", rate: 2, threshold: 30000 },
  { section: "194J(b)", description: "Professional Fees (Others)", rate: 10, threshold: 30000 },
  { section: "194Q", description: "Purchase of Goods", rate: 0.1, threshold: 5000000 },
  { section: "192", description: "Salary (as per slab)", rate: 0, threshold: 0 },
];

function TDSCalc() {
  const [amount, setAmount] = useState("");
  const [section, setSection] = useState("0");
  const [hasPAN, setHasPAN] = useState(true);
  const [result, setResult] = useState<{ tds: number; rate: number; net: number; section: string } | null>(null);

  const calculate = () => {
    const a = parseFloat(amount) || 0;
    const sel = TDS_SECTIONS[parseInt(section)];
    if (!sel) return;
    let rate = sel.rate;
    if (!hasPAN && rate > 0) rate = 20; // Section 206AA
    const tds = a > sel.threshold ? (a * rate) / 100 : 0;
    setResult({ tds, rate, net: a - tds, section: sel.section });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Payment Amount (₹)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
        </div>
        <div>
          <Label>TDS Section</Label>
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TDS_SECTIONS.map((s, i) => (
                <SelectItem key={i} value={String(i)}>{s.section} - {s.description} ({s.rate}%)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={hasPAN} onChange={(e) => setHasPAN(e.target.checked)} id="hasPAN" className="rounded border-input" />
          <Label htmlFor="hasPAN">Deductee has valid PAN</Label>
        </div>
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Calculate TDS
      </Button>
      {result && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Section</span><p className="font-semibold text-foreground">{result.section}</p></div>
            <div><span className="text-muted-foreground">TDS Rate</span><p className="font-semibold text-foreground">{result.rate}%</p></div>
            <div><span className="text-muted-foreground">TDS Amount</span><p className="font-bold text-destructive">₹{result.tds.toFixed(2)}</p></div>
            <div><span className="text-muted-foreground">Net Payable</span><p className="font-bold text-accent">₹{result.net.toFixed(2)}</p></div>
          </CardContent>
        </Card>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        * If PAN is not available, TDS is deducted at 20% or applicable rate, whichever is higher (Section 206AA).
      </div>
    </div>
  );
}

// ─── Depreciation Calculator (IT Act) ───────────────────────────────────────

const DEPRECIATION_BLOCKS = [
  { block: "Building (Residential)", rate: 5 },
  { block: "Building (Non-residential)", rate: 10 },
  { block: "Furniture & Fittings", rate: 10 },
  { block: "Plant & Machinery (General)", rate: 15 },
  { block: "Motor Cars", rate: 15 },
  { block: "Computers & Software", rate: 40 },
  { block: "Intangible Assets", rate: 25 },
  { block: "Renewable Energy Devices", rate: 40 },
];

function DepreciationCalc() {
  const [cost, setCost] = useState("");
  const [block, setBlock] = useState("0");
  const [years, setYears] = useState("5");
  const [usedLess180, setUsedLess180] = useState(false);
  const [result, setResult] = useState<{ schedule: { year: number; opening: number; depreciation: number; closing: number }[] } | null>(null);

  const calculate = () => {
    const c = parseFloat(cost) || 0;
    const rate = DEPRECIATION_BLOCKS[parseInt(block)]?.rate || 15;
    const y = parseInt(years) || 5;
    const schedule: { year: number; opening: number; depreciation: number; closing: number }[] = [];
    let wdv = c;

    for (let i = 1; i <= y; i++) {
      const effectiveRate = i === 1 && usedLess180 ? rate / 2 : rate;
      const dep = (wdv * effectiveRate) / 100;
      schedule.push({ year: i, opening: wdv, depreciation: dep, closing: wdv - dep });
      wdv -= dep;
    }
    setResult({ schedule });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Cost of Asset (₹)</Label>
          <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="e.g. 500000" />
        </div>
        <div>
          <Label>Asset Block</Label>
          <Select value={block} onValueChange={setBlock}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DEPRECIATION_BLOCKS.map((b, i) => (
                <SelectItem key={i} value={String(i)}>{b.block} ({b.rate}%)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Number of Years</Label>
          <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} min="1" max="30" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={usedLess180} onChange={(e) => setUsedLess180(e.target.checked)} id="less180" className="rounded border-input" />
        <Label htmlFor="less180">Asset used for less than 180 days in first year (50% depreciation)</Label>
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Generate Schedule
      </Button>
      {result && (
        <div className="rounded-lg border overflow-auto max-h-80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Opening WDV</TableHead>
                <TableHead className="text-right">Depreciation</TableHead>
                <TableHead className="text-right">Closing WDV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.schedule.map((row) => (
                <TableRow key={row.year}>
                  <TableCell>{row.year}</TableCell>
                  <TableCell className="text-right">₹{row.opening.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="text-right text-destructive">₹{row.depreciation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                  <TableCell className="text-right font-semibold">₹{row.closing.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── EMI Calculator ─────────────────────────────────────────────────────────

function EMICalc() {
  const [principal, setPrincipal] = useState("");
  const [rateAnnual, setRateAnnual] = useState("");
  const [tenure, setTenure] = useState("");
  const [result, setResult] = useState<{ emi: number; totalInterest: number; totalPayment: number; schedule: { month: number; emi: number; principalPart: number; interestPart: number; balance: number }[] } | null>(null);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const annualRate = parseFloat(rateAnnual) || 0;
    const n = parseInt(tenure) || 0;
    if (p <= 0 || annualRate <= 0 || n <= 0) return;

    const r = annualRate / 12 / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const schedule: { month: number; emi: number; principalPart: number; interestPart: number; balance: number }[] = [];
    let balance = p;

    for (let i = 1; i <= Math.min(n, 360); i++) {
      const interestPart = balance * r;
      const principalPart = emi - interestPart;
      balance -= principalPart;
      schedule.push({ month: i, emi, principalPart, interestPart, balance: Math.max(0, balance) });
    }

    setResult({ emi, totalInterest: emi * n - p, totalPayment: emi * n, schedule });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Loan Amount (₹)</Label>
          <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g. 5000000" />
        </div>
        <div>
          <Label>Annual Interest Rate (%)</Label>
          <Input type="number" value={rateAnnual} onChange={(e) => setRateAnnual(e.target.value)} placeholder="e.g. 8.5" step="0.1" />
        </div>
        <div>
          <Label>Tenure (months)</Label>
          <Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} placeholder="e.g. 240" />
        </div>
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Calculate EMI
      </Button>
      {result && (
        <>
          <Card className="bg-muted/50">
            <CardContent className="pt-4 grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Monthly EMI</span><p className="font-bold text-lg text-accent">₹{Math.round(result.emi).toLocaleString("en-IN")}</p></div>
              <div><span className="text-muted-foreground">Total Interest</span><p className="font-semibold text-destructive">₹{Math.round(result.totalInterest).toLocaleString("en-IN")}</p></div>
              <div><span className="text-muted-foreground">Total Payment</span><p className="font-semibold text-foreground">₹{Math.round(result.totalPayment).toLocaleString("en-IN")}</p></div>
            </CardContent>
          </Card>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground font-medium">View Amortization Schedule (first 24 months)</summary>
            <div className="rounded-lg border overflow-auto max-h-72 mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">EMI</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.schedule.slice(0, 24).map((row) => (
                    <TableRow key={row.month}>
                      <TableCell>{row.month}</TableCell>
                      <TableCell className="text-right">₹{Math.round(row.emi).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right">₹{Math.round(row.principalPart).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-muted-foreground">₹{Math.round(row.interestPart).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right font-semibold">₹{Math.round(row.balance).toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

// ─── Interest Calculator (234A/B/C) ─────────────────────────────────────────

function InterestCalc() {
  const [taxPayable, setTaxPayable] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [tdsPaid, setTdsPaid] = useState("");
  const [monthsDelay234A, setMonthsDelay234A] = useState("");
  const [result, setResult] = useState<{ interest234A: number; interest234B: number; interest234C: number; total: number } | null>(null);

  const calculate = () => {
    const tax = parseFloat(taxPayable) || 0;
    const advance = parseFloat(advancePaid) || 0;
    const tds = parseFloat(tdsPaid) || 0;
    const months234A = parseInt(monthsDelay234A) || 0;

    const netTax = Math.max(0, tax - tds);

    // 234A: 1% per month on unpaid tax (if return filed after due date)
    const interest234A = months234A > 0 ? netTax * 0.01 * months234A : 0;

    // 234B: 1% per month if advance tax paid < 90% of assessed tax (April to March = max 12 months)
    const shortfall234B = netTax * 0.9 - advance;
    const interest234B = shortfall234B > 0 ? shortfall234B * 0.01 * 12 : 0;

    // 234C: 1% per month for deferment of advance tax installments (simplified)
    // Q1: 15%, Q2: 45%, Q3: 75%, Q4: 100% of tax should be paid
    const interest234C = advance < netTax * 0.9 ? (netTax - advance) * 0.01 * 3 : 0;

    setResult({
      interest234A: Math.round(interest234A),
      interest234B: Math.round(interest234B),
      interest234C: Math.round(interest234C),
      total: Math.round(interest234A + interest234B + interest234C),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Total Tax Payable (₹)</Label>
          <Input type="number" value={taxPayable} onChange={(e) => setTaxPayable(e.target.value)} placeholder="Assessed tax amount" />
        </div>
        <div>
          <Label>Advance Tax Paid (₹)</Label>
          <Input type="number" value={advancePaid} onChange={(e) => setAdvancePaid(e.target.value)} placeholder="Total advance tax paid" />
        </div>
        <div>
          <Label>TDS/TCS Already Deducted (₹)</Label>
          <Input type="number" value={tdsPaid} onChange={(e) => setTdsPaid(e.target.value)} placeholder="TDS + TCS credit" />
        </div>
        <div>
          <Label>Months of Delay in Filing (234A)</Label>
          <Input type="number" value={monthsDelay234A} onChange={(e) => setMonthsDelay234A(e.target.value)} placeholder="0 if filed on time" />
        </div>
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Calculate Interest
      </Button>
      {result && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted-foreground">Sec 234A (Late Filing)</span><p className="font-semibold text-foreground">₹{result.interest234A.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Sec 234B (Default)</span><p className="font-semibold text-foreground">₹{result.interest234B.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Sec 234C (Deferment)</span><p className="font-semibold text-foreground">₹{result.interest234C.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Total Interest</span><p className="font-bold text-lg text-destructive">₹{result.total.toLocaleString("en-IN")}</p></div>
          </CardContent>
        </Card>
      )}
      <div className="text-xs text-muted-foreground">
        * Simplified calculation. For exact 234C interest, quarter-wise advance tax payment dates are needed.
      </div>
    </div>
  );
}

// ─── Compound Interest / FD Calculator ──────────────────────────────────────

function CompoundInterestCalc() {
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [years, setYears] = useState("");
  const [compounding, setCompounding] = useState("4"); // quarterly
  const [result, setResult] = useState<{ maturity: number; interest: number; effectiveRate: number } | null>(null);

  const calculate = () => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(rate) || 0;
    const t = parseFloat(years) || 0;
    const n = parseInt(compounding) || 4;
    const maturity = p * Math.pow(1 + r / (100 * n), n * t);
    const interest = maturity - p;
    const effectiveRate = (Math.pow(1 + r / (100 * n), n) - 1) * 100;
    setResult({ maturity: Math.round(maturity), interest: Math.round(interest), effectiveRate });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Principal Amount (₹)</Label>
          <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g. 100000" />
        </div>
        <div>
          <Label>Annual Interest Rate (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 7.1" step="0.1" />
        </div>
        <div>
          <Label>Time Period (years)</Label>
          <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 5" step="0.5" />
        </div>
        <div>
          <Label>Compounding Frequency</Label>
          <Select value={compounding} onValueChange={setCompounding}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Annually</SelectItem>
              <SelectItem value="2">Semi-annually</SelectItem>
              <SelectItem value="4">Quarterly</SelectItem>
              <SelectItem value="12">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={calculate} className="bg-gradient-gold text-gold-foreground hover:opacity-90">
        <Calculator className="h-4 w-4 mr-2" /> Calculate
      </Button>
      {result && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4 grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Maturity Value</span><p className="font-bold text-lg text-accent">₹{result.maturity.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Total Interest Earned</span><p className="font-semibold text-success">₹{result.interest.toLocaleString("en-IN")}</p></div>
            <div><span className="text-muted-foreground">Effective Annual Rate</span><p className="font-semibold text-foreground">{result.effectiveRate.toFixed(2)}%</p></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk'] flex items-center gap-2">
          <Calculator className="h-6 w-6 text-accent" /> Financial Tools & Calculators
        </h1>
        <p className="text-sm text-muted-foreground">Professional-grade calculators for Indian tax, GST, TDS, depreciation, and more</p>
      </div>

      <Tabs defaultValue="income-tax" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="income-tax" className="gap-1.5 text-xs"><IndianRupee className="h-3.5 w-3.5" /> Income Tax</TabsTrigger>
          <TabsTrigger value="gst" className="gap-1.5 text-xs"><Receipt className="h-3.5 w-3.5" /> GST</TabsTrigger>
          <TabsTrigger value="tds" className="gap-1.5 text-xs"><Percent className="h-3.5 w-3.5" /> TDS</TabsTrigger>
          <TabsTrigger value="depreciation" className="gap-1.5 text-xs"><TrendingDown className="h-3.5 w-3.5" /> Depreciation</TabsTrigger>
          <TabsTrigger value="emi" className="gap-1.5 text-xs"><PiggyBank className="h-3.5 w-3.5" /> EMI</TabsTrigger>
          <TabsTrigger value="interest" className="gap-1.5 text-xs"><ArrowRight className="h-3.5 w-3.5" /> Interest 234</TabsTrigger>
          <TabsTrigger value="compound" className="gap-1.5 text-xs"><PiggyBank className="h-3.5 w-3.5" /> FD / CI</TabsTrigger>
        </TabsList>

        <TabsContent value="income-tax">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5 text-accent" /> Income Tax Calculator</CardTitle>
              <CardDescription>Calculate income tax under New Regime (FY 2025-26) or Old Regime with deductions</CardDescription>
            </CardHeader>
            <CardContent><IncomeTaxCalc /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-accent" /> GST Calculator</CardTitle>
              <CardDescription>Add or extract GST with CGST/SGST/IGST breakdown at all standard rates</CardDescription>
            </CardHeader>
            <CardContent><GSTCalc /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5 text-accent" /> TDS Calculator</CardTitle>
              <CardDescription>Calculate TDS for common payment types with Section 206AA applicability</CardDescription>
            </CardHeader>
            <CardContent><TDSCalc /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="depreciation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-accent" /> Depreciation Calculator</CardTitle>
              <CardDescription>WDV depreciation as per Income Tax Act with 180-day rule</CardDescription>
            </CardHeader>
            <CardContent><DepreciationCalc /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5 text-accent" /> EMI Calculator</CardTitle>
              <CardDescription>Calculate EMI with full amortization schedule for any loan</CardDescription>
            </CardHeader>
            <CardContent><EMICalc /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interest">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ArrowRight className="h-5 w-5 text-accent" /> Interest u/s 234A, 234B, 234C</CardTitle>
              <CardDescription>Calculate penal interest for late filing, default, and deferment of advance tax</CardDescription>
            </CardHeader>
            <CardContent><InterestCalc /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compound">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5 text-accent" /> FD / Compound Interest Calculator</CardTitle>
              <CardDescription>Calculate maturity value, total interest, and effective annual rate</CardDescription>
            </CardHeader>
            <CardContent><CompoundInterestCalc /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
