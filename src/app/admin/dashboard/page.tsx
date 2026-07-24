"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyPlan, setKeyPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [keyDays, setKeyDays] = useState(30);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, receiptsRes, keysRes] = await Promise.all([
        fetch("/api/admin/tenants"),
        fetch("/api/admin/payments"),
        fetch("/api/admin/keys"),
      ]);

      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (receiptsRes.ok) setReceipts(await receiptsRes.json());
      if (keysRes.ok) setKeys(await keysRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, status: newStatus }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewReceipt = async (receiptId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, action }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: keyPlan, durationDays: keyDays }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            <span>لوحة التحكم الفائقة للمنصة (SuperAdmin)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة كافة الشركات والمحلات المسجلة، مراجعة تحويلات انستاباي وفودافون كاش، وتوليد تراخيص الاشتراكات.
          </p>
        </div>

        {/* Tenants Table */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
          <h3 className="font-bold text-base text-foreground font-heading">دليل الشركات والمحلات المشتركة بالمنصة</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">اسم الشركة / المحل</th>
                  <th className="p-3">اسم المالك</th>
                  <th className="p-3">البريد والهاتف</th>
                  <th className="p-3">حالة الاشتراك</th>
                  <th className="p-3">تاريخ التسجيل</th>
                  <th className="p-3 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/20">
                    <td className="p-3 font-bold text-foreground">{t.name}</td>
                    <td className="p-3 font-medium">{t.ownerName}</td>
                    <td className="p-3 text-muted-foreground">
                      <div>{t.email}</div>
                      <div className="text-[10px] text-blue-400">{t.phone}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {t.status === "ACTIVE" ? "اشتراك نشط" : "موقوف / منتهي"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                    <td className="p-3 text-left">
                      <button
                        onClick={() => handleToggleStatus(t.id, t.status)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold ${
                          t.status === "ACTIVE" ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {t.status === "ACTIVE" ? "إيقاف الشركة" : "تفعيل الشركة"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Local Payments Review & License Keys Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Payment Receipts Review */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="font-bold text-base text-foreground font-heading">مراجعة وتأكيد تحويلات انستاباي وفودافون كاش</h3>
            <div className="space-y-3">
              {receipts.length === 0 ? (
                <p className="text-xs text-muted-foreground">لا توجد إيصالات في انتظار المراجعة.</p>
              ) : (
                receipts.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-secondary/40 border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground">{r.tenant?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{r.paymentMethod} • {formatCurrency(r.amount)}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">
                        {r.status === "PENDING" ? "في انتظار المراجعة" : r.status}
                      </span>
                    </div>

                    {r.status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleReviewReceipt(r.id, "APPROVE")}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs shadow"
                        >
                          تأكيد وتفعيل الاشتراك
                        </button>
                        <button
                          onClick={() => handleReviewReceipt(r.id, "REJECT")}
                          className="flex-1 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-xs shadow"
                        >
                          رفض الإشعار
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Generate License Keys Generator */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="font-bold text-base text-foreground font-heading">مولد أكواد التراخيص (License Keys)</h3>
            <form onSubmit={handleGenerateKey} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold">خطة الاشتراك</label>
                  <select
                    value={keyPlan}
                    onChange={(e: any) => {
                      setKeyPlan(e.target.value);
                      setKeyDays(e.target.value === "YEARLY" ? 365 : 30);
                    }}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs"
                  >
                    <option value="MONTHLY">خطة شهرية (500 EGP)</option>
                    <option value="YEARLY">خطة سنوية (5,000 EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold">عدد الأيام</label>
                  <input
                    type="number"
                    value={keyDays}
                    onChange={(e) => setKeyDays(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                  />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow">
                توليد كود ترخيص جديد
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">سجل المفاتيح التي تم توليدها:</p>
              {keys.map((k) => (
                <div key={k.id} className="p-2 rounded-lg bg-secondary/40 border border-border/40 flex justify-between text-xs font-mono">
                  <span className="text-blue-400 font-bold">{k.key}</span>
                  <span className={k.isUsed ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
                    {k.isUsed ? "تم الاستخدام" : "متاح للتفعيل"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
