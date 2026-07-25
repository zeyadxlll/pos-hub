"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  DollarSign,
  Laptop,
  Wallet,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/finance/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to load dashboard metrics", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
              <span>{t("dashboard")}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-semibold">
                مباشر / Live
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              متابعة الإيرادات، الأرباح، وتقييم حركة المخزون ورصيد الخزينة لحظياً.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/pos"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t("openPos")}</span>
            </a>
          </div>
        </div>

        {/* Top Financial Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Sales */}
          <div className="glass-panel p-5 rounded-2xl border border-border/50 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{t("todaySales")}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-extrabold text-foreground font-heading">
                {loading ? "..." : formatCurrency(metrics?.todaySalesAmount || 0)}
              </h2>
              <p className="text-[11px] text-emerald-500 font-medium mt-1">
                {t("profit")}: {formatCurrency(metrics?.todayProfit || 0)}
              </p>
            </div>
          </div>

          {/* Card 2: Monthly Sales */}
          <div className="glass-panel p-5 rounded-2xl border border-border/50 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{t("monthlySales")}</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-extrabold text-foreground font-heading">
                {loading ? "..." : formatCurrency(metrics?.monthlySalesAmount || 0)}
              </h2>
              <p className="text-[11px] text-blue-400 font-medium mt-1">
                {t("yearlySales")}: {formatCurrency(metrics?.yearlySalesAmount || 0)}
              </p>
            </div>
          </div>

          {/* Card 3: Inventory Valuation */}
          <div className="glass-panel p-5 rounded-2xl border border-border/50 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{t("inventoryValue")}</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-extrabold text-foreground font-heading">
                {loading ? "..." : formatCurrency(metrics?.inventoryValuation || 0)}
              </h2>
              <p className="text-[11px] text-purple-400 font-medium mt-1">
                قيمة البيع المحتملة: {formatCurrency(metrics?.totalPotentialValue || 0)}
              </p>
            </div>
          </div>

          {/* Card 4: Cash Balance & Net Profit */}
          <div className="glass-panel p-5 rounded-2xl border border-border/50 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{t("cashBalance")}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-extrabold text-foreground font-heading">
                {loading ? "..." : formatCurrency(metrics?.cashBalance || 0)}
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">
                {t("netProfit")}: {formatCurrency(metrics?.netProfit || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Sales vs Expenses Bar Chart */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground font-heading">مقارنة الإيرادات والمصروفات (آخر 6 أشهر)</h3>
                <p className="text-xs text-muted-foreground">رسم بياني توضيحي لمقارنة المبيعات الفلية مقابل مصاريف المحل</p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              {loading ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">جاري تحميل البيانات...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.monthlyChartData || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#888" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="sales" name="إيرادات المبيعات" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="المصروفات" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top Selling Laptop Products Widget */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-foreground font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t("topSellingModels")}</span>
              </h3>
            </div>

            <div className="space-y-3">
              {metrics?.topSellersFormatted?.length === 0 ? (
                <p className="text-xs text-muted-foreground">لا توجد مبيعات مسجلة حتى الآن.</p>
              ) : (
                metrics?.topSellersFormatted?.map((prod: any, idx: number) => (
                  <div key={prod.id || idx} className="p-3 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground truncate max-w-[180px]">{prod.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{prod.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-400">{formatCurrency(prod.totalRevenue)}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{prod.totalQty} قطعة مباعة</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent POS Sales Activity Table */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-foreground font-heading">{t("recentSales")}</h3>
              <p className="text-xs text-muted-foreground">أحدث الفواتير التي تم بيعها من شاشة الـ POS</p>
            </div>
            <a href="/pos" className="text-xs text-blue-500 hover:underline font-semibold">
              عرض الكاشير
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="p-3 font-semibold">{t("invoiceNumber")}</th>
                  <th className="p-3 font-semibold">{t("customer")}</th>
                  <th className="p-3 font-semibold">{t("paymentMethod")}</th>
                  <th className="p-3 font-semibold">{t("totalPayable")}</th>
                  <th className="p-3 font-semibold">{t("profit")}</th>
                  <th className="p-3 font-semibold">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {metrics?.recentSales?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      لا توجد مبيعات حديثة.
                    </td>
                  </tr>
                ) : (
                  metrics?.recentSales?.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-bold text-blue-400">{sale.invoiceNumber}</td>
                      <td className="p-3 font-medium text-foreground">{sale.customer?.name || "عميل نقدي (كاش)"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-foreground">{formatCurrency(sale.netAmount)}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatCurrency(sale.profitAmount)}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
