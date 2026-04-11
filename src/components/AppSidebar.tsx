import {
  LayoutDashboard, Users, FileText, TrendingDown, Bot, Shield, LogOut, Calculator, CalendarDays, TrendingUp, BarChart3,
  Building2, Sparkles, LineChart, Landmark, Home, Factory, Leaf, Award, Scale, GitMerge, ClipboardList, Rocket, HardHat,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const mainItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", url: "/dashboard/clients", icon: Users },
  { title: "Invoices", url: "/dashboard/invoices", icon: FileText },
  { title: "Expenses", url: "/dashboard/expenses", icon: TrendingDown },
  { title: "Compliance", url: "/dashboard/compliance", icon: CalendarDays },
  { title: "AI Assistant", url: "/dashboard/ai", icon: Bot },
];

const toolItems = [
  { title: "Calculators", url: "/dashboard/tools", icon: Calculator },
  { title: "LBO Analysis", url: "/dashboard/tools/lbo", icon: TrendingUp },
  { title: "Investment", url: "/dashboard/tools/investment", icon: BarChart3 },
  { title: "Bank Analyzer", url: "/dashboard/tools/bank-analyzer", icon: Building2 },
  { title: "Tax Optimizer", url: "/dashboard/tools/tax-optimizer", icon: Sparkles },
  { title: "LBO Analyzer", url: "/dashboard/tools/lbo-analyzer", icon: LineChart },
  { title: "Investment Analyzer", url: "/dashboard/tools/investment-analyzer", icon: BarChart3 },
];

const valuationItems = [
  { title: "Valuation Hub", url: "/valuation", icon: Landmark },
  { title: "Real Estate", url: "/valuation/real-estate", icon: Home },
  { title: "Business", url: "/valuation/business", icon: Factory },
  { title: "Assets", url: "/valuation/assets", icon: Award },
  { title: "Agriculture", url: "/valuation/agriculture", icon: Leaf },
  { title: "Intangibles", url: "/valuation/intangibles", icon: ClipboardList },
  { title: "Stock & Equity", url: "/valuation/stock", icon: StockIcon },
  { title: "Startup", url: "/valuation/startup", icon: Rocket },
  { title: "Infrastructure", url: "/valuation/infrastructure", icon: HardHat },
  { title: "Legal & Court", url: "/valuation/legal", icon: Scale },
  { title: "M&A", url: "/valuation/merger", icon: GitMerge },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await signOut();
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-xs text-gold-foreground font-['Space_Grotesk']">CA</span>
          </div>
          {!collapsed && <span className="font-bold text-sm text-sidebar-foreground font-['Space_Grotesk']">FinanceAI</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end={item.url === "/dashboard"} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Valuation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {valuationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 mr-2" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/dashboard/admin")}>
                    <NavLink to="/dashboard/admin" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Shield className="h-4 w-4 mr-2" />
                      {!collapsed && <span>Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {!collapsed && <span>Log out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
