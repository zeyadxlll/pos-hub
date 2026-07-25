"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShieldCheck, Search, Laptop, User, Calendar, Phone, CheckCircle2, XCircle, Clock, AlertTriangle, FileText } from "lucide-react";

export default function WarrantyCheckPage() {
  const [serialQuery, setSerialQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/warranty/check?serial=${encodeURIComponent(serialQuery.trim())}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "فشل الاستعلام عن الضمان والسيريال");

      if (!data.found) {
        setError(data.message || "لم يتم العثور على أي جهاز مباع بهذا السيريال نمبر في سجلات المحل.");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <span>نظام تتبع الضمان بالسيريال نمبر (S/N Warranty Tracker)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            اكتب أو امسح السيريال نمبر لأي جهاز لاب توب لمعرفة موقفه من الضمان، تاريخ الشراء، بيانات العميل، والتعديلات المخصصة.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="glass-panel p-5 rounded-2xl border border-border/50 space-y-3">
          <label className="text-xs font-bold text-foreground">ادخل السيريال نمبر الخاص بالجهاز (Serial Number)</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-muted-foreground" />
              <input
                type="text"
                required
                placeholder="مثال: 5CG1234567 أو اكتب جزء من السيريال..."
                value={serialQuery}
                onChange={(e) => setSerialQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl bg-secondary/40 border border-border text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-right"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>فحص موقف الضمان</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error / Not Found Alert */}
        {error && (
          <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <p className="font-bold text-sm">نتيجة الاستعلام:</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Search Result Card */}
        {result && (
          <div className="space-y-6">
            {/* Warranty Status Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 90 Days Warranty Banner */}
              <div
                className={`glass-panel p-5 rounded-2xl border ${
                  result.warrantyStatus.isWarrantyValid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.warrantyStatus.isWarrantyValid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-rose-400" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm font-heading">ضمان 3 شهور (ضد عيوب الصناعة)</h3>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        ينتهي في: {formatDate(result.warrantyStatus.warrantyExpiryDate)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      result.warrantyStatus.isWarrantyValid ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {result.warrantyStatus.isWarrantyValid
                      ? `ساري (متبقي ${result.warrantyStatus.remainingWarrantyDays} يوم)`
                      : "منتهي الضمان"}
                  </span>
                </div>
              </div>

              {/* 14 Days Replacement Banner */}
              <div
                className={`glass-panel p-5 rounded-2xl border ${
                  result.warrantyStatus.isReplacementValid
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-secondary/40 border-border/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.warrantyStatus.isReplacementValid ? (
                      <Clock className="w-6 h-6 text-blue-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-bold text-sm font-heading">مهلة الاستبدال (أسبوعين 14 يوماً)</h3>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        انتهت في: {formatDate(result.warrantyStatus.replacementExpiryDate)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      result.warrantyStatus.isReplacementValid ? "bg-blue-500/20 text-blue-300" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {result.warrantyStatus.isReplacementValid
                      ? `متاحة (متبقي ${result.warrantyStatus.remainingReplacementDays} يوم)`
                      : "انتهت فترة الاستبدال"}
                  </span>
                </div>
              </div>
            </div>

            {/* Laptop & Customer Full Details Card */}
            <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-5">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-base text-foreground font-heading">تفاصيل الجهاز والفاتورة والعميل</h3>
                </div>

                <span className="text-xs font-bold text-blue-400 font-mono bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                  فاتورة رقم: {result.saleItem.sale.invoiceNumber}
                </span>
              </div>

              {/* Laptop Hardware Specs Box */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-foreground">{result.saleItem.product.name}</h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(result.saleItem.unitPrice)}</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  💻 المواصفات العتادية: {[
                    result.saleItem.product.cpu,
                    result.saleItem.product.ram,
                    result.saleItem.product.ssd,
                    result.saleItem.product.gpu,
                    result.saleItem.product.condition === "NEW" ? "جديد" : "مستعمل",
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>

                {result.saleItem.customSpecs && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mt-2">
                    ⚡ التعديل والترقية بطلب العميل: {result.saleItem.customSpecs}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 pt-1">
                  <span>السيريال نمبر الرسمي:</span>
                  <span className="font-extrabold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {result.saleItem.serialNumber}
                  </span>
                </div>
              </div>

              {/* Customer & Sales Rep Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40 space-y-1 text-xs">
                  <p className="font-semibold text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>اسم العميل والمشتري:</span>
                  </p>
                  <p className="font-bold text-sm text-foreground">{result.saleItem.sale.customer?.name || "عميل كاش مباشر"}</p>
                  {result.saleItem.sale.customer?.phone && (
                    <p className="font-mono text-blue-400 flex items-center gap-1 pt-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{result.saleItem.sale.customer?.phone}</span>
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40 space-y-1 text-xs">
                  <p className="font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تاريخ وسيلز الفاتورة:</span>
                  </p>
                  <p className="font-bold text-sm text-foreground">{formatDate(result.saleItem.sale.createdAt)}</p>
                  <p className="text-muted-foreground pt-1">
                    مباع بواسطة: <span className="font-bold text-emerald-400">{result.saleItem.sale.salespersonName}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
