"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/language-context";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Laptop,
  Truck,
  Wallet,
  BarChart3,
  CreditCard,
  Settings,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Laptop2,
  Store,
  ChevronRight,
  Globe,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIAssistantWidget } from "@/components/ai/ai-assistant-widget";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const { lang, toggleLanguage, t, isRtl } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  const isCashierOrSales = session?.user?.role === "CASHIER" || session?.user?.role === "SALES";
  const subStatus = session?.user?.subscriptionStatus;
  const isSuspendedOrExpired = !isSuperAdmin && (subStatus === "SUSPENDED" || subStatus === "EXPIRED");

  // Redirection Enforcement for Suspended Tenants or Staff Roles
  useEffect(() => {
    if (!mounted) return;

    if (isSuspendedOrExpired && pathname !== "/subscription") {
      router.push("/subscription");
      return;
    }

    if (isCashierOrSales) {
      const allowedPaths = ["/pos", "/products", "/warranty-check"];
      if (!allowedPaths.includes(pathname)) {
        router.push("/pos");
      }
    }
  }, [mounted, isSuspendedOrExpired, isCashierOrSales, pathname, router]);

  let navigation = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("posTerminal"), href: "/pos", icon: ShoppingCart },
    { name: t("laptopInventory"), href: "/products", icon: Laptop },
    { name: "تتبع الضمان بالسيريال", href: "/warranty-check", icon: ShieldCheck },
    { name: "مميزات المنظومة والـ AI", href: "/features", icon: Sparkles },
    { name: t("purchaseOrders"), href: "/purchases", icon: Truck },
    { name: t("financeCash"), href: "/finance", icon: Wallet },
    { name: t("reportsAnalytics"), href: "/reports", icon: BarChart3 },
    { name: t("subscriptions"), href: "/subscription", icon: CreditCard },
    { name: t("companySettings"), href: "/settings", icon: Settings },
  ];

  // RBAC: Cashiers and Sales Representatives only see POS & Products
  if (isCashierOrSales) {
    navigation = [
      { name: t("posTerminal"), href: "/pos", icon: ShoppingCart },
      { name: t("laptopInventory"), href: "/products", icon: Laptop },
    ];
  } else if (isSuperAdmin) {
    navigation.push({ name: t("superAdminPortal"), href: "/admin/dashboard", icon: ShieldAlert });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-border/60 bg-card/60 backdrop-blur-xl flex flex-col justify-between hidden md:flex z-30">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-border/40">
            <Link href={isCashierOrSales ? "/pos" : "/dashboard"} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Laptop2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight leading-none text-foreground font-heading">
                  {t("brandName")} <span className="text-blue-500 text-xs font-semibold uppercase">ERP</span>
                </h1>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{t("brandSubtitle")}</p>
              </div>
            </Link>
          </div>

          {/* Active Tenant Switcher & Language Switcher */}
          <div className="p-3 space-y-2">
            <div className="px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <Store className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-semibold truncate text-foreground">{session?.user?.tenantName || "System Portal"}</p>
                  <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                    {t("role")}: {session?.user?.role?.replace("_", " ") || "User"}
                  </p>
                </div>
              </div>
              <span className={`w-2 h-2 rounded-full ${isSuspendedOrExpired ? "bg-rose-500" : "bg-emerald-500 animate-pulse"} shrink-0`} />
            </div>

            {/* Language Switcher Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/20 text-xs font-bold text-blue-400 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500 animate-spin-slow" />
                <span>{lang === "ar" ? "اللغة العربية (RTL)" : "English (LTR)"}</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-[10px] font-extrabold uppercase">
                {t("langSwitch")}
              </span>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = isSuspendedOrExpired && item.href !== "/subscription";
              const Icon = item.icon;

              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground/40 cursor-not-allowed opacity-50 select-none"
                    title="الاشتراك متوقف - يرجى التفعيل لفتح هذه الشاشة"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground/40" />
                      <span>{item.name}</span>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-rose-500/60" />
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className={cn("w-3.5 h-3.5 opacity-80", isRtl && "rotate-180")} />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Footer Controls */}
        <div className="p-3 border-t border-border/40 space-y-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary/40">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center text-xs border border-blue-500/20">
                {session?.user?.name?.slice(0, 2).toUpperCase() || "US"}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium truncate text-foreground">{session?.user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              title="Toggle Theme"
            >
              {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Mobile Bar */}
        <header className="h-16 border-b border-border/40 bg-card/60 backdrop-blur-md px-6 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              LH
            </div>
            <span className="font-bold text-sm">{session?.user?.tenantName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs border border-blue-500/20 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === "ar" ? "EN" : "عربى"}</span>
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Suspended Alert Banner */}
        {isSuspendedOrExpired && (
          <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white px-6 py-3 text-xs font-bold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                تنبيه: اشتراك شركتك متوقف حالياً. يرجى إدخال مفتاح ترخيص جديد أو إرسال إشعار تحويل لإعادة فتح النظام فوراً.
              </span>
            </div>
          </div>
        )}

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>

        {/* Hack-Proof Embedded AI Assistant Widget */}
        <AIAssistantWidget />
      </div>
    </div>
  );
}
