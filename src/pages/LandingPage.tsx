import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, Shield, Users, FileText, TrendingUp, Check, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

const features = [
  { icon: Brain, title: "AI Tax Assistant", description: "Get instant answers to complex tax queries powered by advanced AI models." },
  { icon: BarChart3, title: "Financial Dashboard", description: "Real-time overview of revenue, expenses, and profitability with smart charts." },
  { icon: Users, title: "Client Management", description: "Organize and track all your clients, their filings, and compliance status." },
  { icon: FileText, title: "Invoice Tracking", description: "Create, send, and manage invoices with automated payment reminders." },
  { icon: TrendingUp, title: "Expense Analytics", description: "Smart categorization and analysis of expenses with AI-powered insights." },
  { icon: Shield, title: "Compliance Guard", description: "Stay ahead of deadlines with automated compliance tracking and alerts." },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    description: "Perfect for individual CAs",
    features: ["Up to 25 clients", "Basic AI assistant", "Invoice management", "Expense tracking", "Email support"],
    popular: false,
  },
  {
    name: "Professional",
    price: "₹2,499",
    period: "/month",
    description: "For growing CA practices",
    features: ["Up to 100 clients", "Advanced AI with tax insights", "Full invoice suite", "Team collaboration", "Priority support", "Custom reports"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₹4,999",
    period: "/month",
    description: "For large firms",
    features: ["Unlimited clients", "Premium AI features", "API access", "White-label options", "Dedicated manager", "SLA guarantee"],
    popular: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <span className="font-bold text-sm text-gold-foreground font-['Space_Grotesk']">CA</span>
            </div>
            <span className="font-bold text-lg text-foreground font-['Space_Grotesk']">FinanceAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button>
            <Button className="bg-gradient-gold text-gold-foreground hover:opacity-90" asChild>
              <Link to="/auth?tab=signup">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 flex flex-col gap-3">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-muted-foreground py-2">{l.label}</a>
            ))}
            <Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button>
            <Button className="bg-gradient-gold text-gold-foreground" asChild>
              <Link to="/auth?tab=signup">Get Started</Link>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-accent blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent blur-[150px]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-6">
              <Brain className="h-4 w-4 text-gold" />
              <span className="text-sm text-gold-light">AI-Powered Finance Management</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-tight mb-6 font-['Space_Grotesk']">
              The Smartest Way to
              <span className="text-gradient-gold block mt-1">Manage CA Practice</span>
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl mx-auto">
              Streamline your chartered accountancy practice with AI-driven insights, automated compliance, and intelligent financial management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 text-base px-8" asChild>
                <Link to="/auth?tab=signup">Start Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-base" asChild>
                <a href="#features">See Features</a>
              </Button>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="rounded-xl border border-primary-foreground/10 bg-navy/80 backdrop-blur-sm p-4 shadow-elevated">
              <div className="flex gap-1.5 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-gold/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Revenue", value: "₹24.5L", change: "+12.5%" },
                  { label: "Active Clients", value: "148", change: "+8" },
                  { label: "Pending Invoices", value: "23", change: "₹3.2L" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-navy-dark/50 p-4">
                    <p className="text-xs text-primary-foreground/50">{stat.label}</p>
                    <p className="text-xl font-bold text-primary-foreground mt-1">{stat.value}</p>
                    <p className="text-xs text-success mt-1">{stat.change}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-navy-dark/50 p-4 h-32 flex items-end gap-1">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-gold rounded-t opacity-70" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="rounded-lg bg-navy-dark/50 p-4 h-32 flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(222, 40%, 22%)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(40, 90%, 50%)" strokeWidth="3" strokeDasharray="75 25" strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary-foreground">75%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Features</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-foreground font-['Space_Grotesk']">
              Everything Your Practice Needs
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground mt-4 max-w-lg mx-auto">
              Powerful tools designed specifically for Chartered Accountants to streamline operations and grow their practice.
            </motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group p-6 rounded-xl bg-card border hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-gradient-gold group-hover:text-gold-foreground transition-colors">
                  <f.icon className="h-6 w-6 text-accent group-hover:text-gold-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-['Space_Grotesk']">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-['Space_Grotesk']">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground mt-4 max-w-md mx-auto">Choose the plan that fits your practice size.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`relative p-6 rounded-xl bg-card border ${plan.popular ? "border-accent shadow-elevated ring-1 ring-accent/20" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-gold text-xs font-semibold text-gold-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-foreground font-['Space_Grotesk']">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "bg-gradient-gold text-gold-foreground hover:opacity-90" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth?tab=signup">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground font-['Space_Grotesk'] mb-4">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-primary-foreground/70 max-w-lg mx-auto mb-8">
            Join thousands of CAs who are already using FinanceAI to automate their workflows and grow their revenue.
          </p>
          <Button size="lg" className="bg-gradient-gold text-gold-foreground hover:opacity-90 text-base px-8" asChild>
            <Link to="/auth?tab=signup">Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-navy-dark border-t border-navy-light/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-gold flex items-center justify-center">
              <span className="text-xs font-bold text-gold-foreground font-['Space_Grotesk']">CA</span>
            </div>
            <span className="text-sm font-semibold text-primary-foreground/70 font-['Space_Grotesk']">FinanceAI</span>
          </div>
          <p className="text-xs text-primary-foreground/40">© 2026 CA FinanceAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
