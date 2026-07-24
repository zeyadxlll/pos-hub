"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency } from "@/lib/utils";
import { BarChart3, Download, Calendar } from "lucide-react";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [range, setRange] = useState("MONTHLY");

  const exportCSV = () => {
    alert("جاري تصدير التقرير المالي الشامل إلى ملف Excel/CSV...");
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
              تقارير الأرباح والخسائر الشاملة، حركة التدفقات النقدية، وتصدير المستندات المحاسبية المحمية.
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>تصدير تقرير اكسل (Excel/CSV)</span>
          </button>
        </div>

        {/* Filter Presets */}
        <div className="glass-panel p-4 rounded-2xl border border-border/50 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold">الفترة الزمنيّة للتقرير:</span>
          {[
            { id: "TODAY", label: "اليوم" },
            { id: "WEEKLY", label: "الأسبوع" },
            { id: "MONTHLY", label: "الشهر الحالي" },
            { id: "YEARLY", label: "السنة المالية" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === r.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-border/50">
            <span className="text-xs font-semibold text-muted-foreground">إجمالي مبيعات المحل</span>
            <h3 className="text-xl font-extrabold text-blue-400 font-heading mt-1">{formatCurrency(85000)}</h3>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-border/50">
            <span className="text-xs font-semibold text-muted-foreground">إجمالي مشتريات الأجهزة والبضاعة</span>
            <h3 className="text-xl font-extrabold text-amber-400 font-heading mt-1">{formatCurrency(72000)}</h3>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-border/50">
            <span className="text-xs font-semibold text-muted-foreground">إجمالي المصاريف التشغيلية</span>
            <h3 className="text-xl font-extrabold text-rose-400 font-heading mt-1">{formatCurrency(3500)}</h3>
          </div>
          <div className="glass-panel p-5 rounded-2xl border border-border/50">
            <span className="text-xs font-semibold text-muted-foreground">صافي ربح الفترة الزمنيّة</span>
            <h3 className="text-xl font-extrabold text-emerald-400 font-heading mt-1">{formatCurrency(9500)}</h3>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
