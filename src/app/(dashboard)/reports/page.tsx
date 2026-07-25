"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, Download, Calendar, DollarSign, TrendingUp, ShoppingBag, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState("MONTHLY");
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sales");
      if (res.ok) {
        const data = await res.json();
        setSales(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Financial Calculations
  const totalSalesRevenue = sales.reduce((acc, s) => acc + (s.netAmount || 0), 0);
  const totalGrossSales = sales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalDiscountsGiven = sales.reduce((acc, s) => acc + (s.discountAmount || 0), 0);
  const totalNetProfit = sales.reduce((acc, s) => acc + (s.profitAmount || 0), 0);

  const exportExcelCSV = () => {
    if (sales.length === 0) {
      alert("لا توجد مبيعات لتصديرها.");
      return;
    }

    const headers = ["رقم الفاتورة", "اسم العميل", "تليفون العميل", "السيلز المسؤول", "الإجمالي قبل الخصم", "الخصم المالي", "الصافي المطلوب", "طريقة الدفع", "التاريخ والوقت"];
    
    const rows = sales.map((s) => [
      s.invoiceNumber,
      `"${s.customer?.name || "عميل كاش"}"`,
      `"${s.customer?.phone || "-"}"`,
      `"${s.salespersonName || s.createdByUser?.name || "الكاشير"}"`,
      s.totalAmount,
      s.discountAmount,
      s.netAmount,
      s.paymentMethod,
      `"${formatDate(s.createdAt)}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_مبيعات_وأرباح_POS_Hub_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <span>{t("reportsAnalytics")}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              تقارير الأرباح والخسائر الشاملة، حركة التدفقات النقدية، وتصدير الملفات المحاسبية بصيغة Excel/CSV.
            </p>
          </div>

          <button
            onClick={exportExcelCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير تقرير المبيعات والأرباح Excel/CSV</span>
          </button>
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-border/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">إجمالي مبيعات المحل (الصافي)</span>
            <h3 className="text-2xl font-extrabold text-blue-400 font-heading">{formatCurrency(totalSalesRevenue)}</h3>
            <p className="text-[10px] text-muted-foreground">إجمالي الفواتير الصادرة</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-border/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">صافي أرباح المبيعات</span>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-heading">{formatCurrency(totalNetProfit)}</h3>
            <p className="text-[10px] text-emerald-500/80 font-medium">هامش الربح بعد خصم التكلفة</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-border/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">إجمالي الخصومات المقدمة للعملاء</span>
            <h3 className="text-2xl font-extrabold text-amber-400 font-heading">{formatCurrency(totalDiscountsGiven)}</h3>
            <p className="text-[10px] text-muted-foreground">تخفيضات أجهزة اللاب توب</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-border/50 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">عدد الفواتير المنفذة</span>
            <h3 className="text-2xl font-extrabold text-purple-400 font-heading">{sales.length} فاتورة</h3>
            <p className="text-[10px] text-muted-foreground">عمليات بيع ناجحة</p>
          </div>
        </div>

        {/* Sales Log Table */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-foreground font-heading">سجل فواتير البيع الحسابي الشامل</h3>
            <button
              onClick={exportExcelCSV}
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل الشيت</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">اسم العميل ورقم الهاتف</th>
                  <th className="p-3">السيلز المسؤول</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">الإجمالي قبل الخصم</th>
                  <th className="p-3">الخصم المالي</th>
                  <th className="p-3">الصافي المطلوب</th>
                  <th className="p-3">صافي الربح</th>
                  <th className="p-3">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      جاري تحميل البيانات المالية...
                    </td>
                  </tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      لا توجد فواتير مبيعات مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-bold text-blue-400">{s.invoiceNumber}</td>
                      <td className="p-3">
                        <p className="font-bold text-foreground">{s.customer?.name || "عميل كاش مباشر"}</p>
                        {s.customer?.phone && <p className="text-[10px] text-muted-foreground font-mono">{s.customer?.phone}</p>}
                      </td>
                      <td className="p-3 font-medium text-foreground">{s.salespersonName || s.createdByUser?.name || "الكاشير"}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-foreground">
                          {s.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-muted-foreground">{formatCurrency(s.totalAmount)}</td>
                      <td className="p-3 font-medium text-amber-400">{s.discountAmount > 0 ? `- ${formatCurrency(s.discountAmount)}` : "-"}</td>
                      <td className="p-3 font-extrabold text-foreground">{formatCurrency(s.netAmount)}</td>
                      <td className="p-3 font-extrabold text-emerald-400">+{formatCurrency(s.profitAmount)}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(s.createdAt)}</td>
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
