"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShieldAlert, Trash2, Phone, MessageSquare, Save, CheckCircle, Smartphone } from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [tenants, setTenants] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings State
  const [platformSettings, setPlatformSettings] = useState({
    transferNumber: "01001234567",
    whatsappNumber: "01001234567",
    instructionNote: "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
    monthlyOriginalPrice: 500,
    monthlyDiscountPrice: 350,
    yearlyOriginalPrice: 5000,
    yearlyDiscountPrice: 3500,
    promoBanner: "🔥 عرض خاص لفترة محدودة: خصم 30% على الاشتراك الشهري والسنوي للمنظومة!",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  // License Key Form State
  const [keyPlan, setKeyPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [keyDays, setKeyDays] = useState(30);

  useEffect(() => {
    fetchAdminData();
    fetchPlatformSettings();
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

  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setPlatformSettings({
          transferNumber: data.transferNumber || "01001234567",
          whatsappNumber: data.whatsappNumber || "01001234567",
          instructionNote: data.instructionNote || "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
          monthlyOriginalPrice: Number(data.monthlyOriginalPrice || 500),
          monthlyDiscountPrice: Number(data.monthlyDiscountPrice || 350),
          yearlyOriginalPrice: Number(data.yearlyOriginalPrice || 5000),
          yearlyDiscountPrice: Number(data.yearlyDiscountPrice || 3500),
          promoBanner: data.promoBanner || "🔥 عرض خاص لفترة محدودة: خصم 30% على الاشتراك الشهري والسنوي للمنظومة!",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMsg(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(platformSettings),
      });

      if (res.ok) {
        setSettingsMsg("تم حفظ أسعار الخطط التنافسية وأرقام التحويل والعروض بنجاح!");
      } else {
        const d = await res.json();
        alert(d.error || "فشل الحفظ");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSettingsSaving(false);
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
        body: JSON.stringify({ plan: keyPlan, validDays: keyDays }),
      });
      if (res.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف مفتاح الترخيص هذا؟")) return;
    try {
      const res = await fetch(`/api/admin/keys?keyId=${keyId}`, { method: "DELETE" });
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
            إدارة كافة الشركات والمحلات المسجلة، تعديل أسعار خطط الاشتراكات (شهري وسنوي)، العروض الترويجية، وأرقام التحويلات.
          </p>
        </div>

        {/* Section 1: Platform Payment Numbers, Prices & Promo Settings */}
        <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div>
              <h3 className="font-bold text-base text-foreground font-heading flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>إعدادات أسعار خطط الاشتراكات والعروض الترويجية وأرقام التحويلات</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                تحكم في أسعار الخطتين (الشهرية والسنوية)، التخصيمات، والتنبيهات المباشرة التي تظهر للعملاء غير المشتركين.
              </p>
            </div>

            <button
              type="submit"
              disabled={settingsSaving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{settingsSaving ? "جاري الحفظ..." : "حفظ أسعار الخطط والعروض"}</span>
            </button>
          </div>

          {settingsMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{settingsMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>رقم محفظة التحويل (انستاباي / فودافون كاش)</span>
              </label>
              <input
                type="text"
                required
                value={platformSettings.transferNumber}
                onChange={(e) => setPlatformSettings({ ...platformSettings, transferNumber: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground font-mono text-right"
              />
            </div>

            <div>
              <label className="text-xs font-semibold flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>رقم الواتساب الرسمي لاستلام الإشعارات</span>
              </label>
              <input
                type="text"
                required
                value={platformSettings.whatsappNumber}
                onChange={(e) => setPlatformSettings({ ...platformSettings, whatsappNumber: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground font-mono text-right"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold">نص التعليمات الظاهر للعميل عند التحويل</label>
              <input
                type="text"
                required
                value={platformSettings.instructionNote}
                onChange={(e) => setPlatformSettings({ ...platformSettings, instructionNote: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
              />
            </div>

            {/* Monthly Pricing Inputs */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
              <span className="text-xs font-extrabold text-blue-400 block">📅 الخطة الشهرية (Monthly Plan)</span>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block">السعر الأساسي (EGP)</label>
                <input
                  type="number"
                  required
                  value={platformSettings.monthlyOriginalPrice}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, monthlyOriginalPrice: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs font-mono text-right"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-emerald-400 block">السعر بعد الخصم والعرض (EGP)</label>
                <input
                  type="number"
                  required
                  value={platformSettings.monthlyDiscountPrice}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, monthlyDiscountPrice: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-emerald-500/40 text-xs font-bold text-emerald-400 font-mono text-right"
                />
              </div>
            </div>

            {/* Yearly Pricing Inputs */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
              <span className="text-xs font-extrabold text-purple-400 block">👑 الخطة السنوية (Yearly Plan)</span>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground block">السعر الأساسي (EGP)</label>
                <input
                  type="number"
                  required
                  value={platformSettings.yearlyOriginalPrice}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, yearlyOriginalPrice: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs font-mono text-right"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-purple-400 block">السعر بعد الخصم والعرض (EGP)</label>
                <input
                  type="number"
                  required
                  value={platformSettings.yearlyDiscountPrice}
                  onChange={(e) => setPlatformSettings({ ...platformSettings, yearlyDiscountPrice: Number(e.target.value) })}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-purple-500/40 text-xs font-bold text-purple-400 font-mono text-right"
                />
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-2">
              <label className="text-xs font-bold text-amber-400 block">نص العرض الترويجي والتنبيه التنافسي (Banner للعملاء غير المشتركين)</label>
              <textarea
                rows={4}
                required
                value={platformSettings.promoBanner}
                onChange={(e) => setPlatformSettings({ ...platformSettings, promoBanner: e.target.value })}
                className="w-full mt-1.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 text-right"
                placeholder="مثال: 🔥 عرض خاص لفترة محدودة: خصم 30% على الاشتراك وخصم فوري!"
              />
            </div>
          </div>
        </form>

        {/* Section 2: Tenants Table */}
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
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                          t.status === "ACTIVE" ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
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

        {/* Section 3: Receipts Review & License Keys Grid */}
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

          {/* Generate & Delete License Keys */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="font-bold text-base text-foreground font-heading">إدارة وتوليد أكواد التراخيص (License Keys)</h3>
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
              <button type="submit" className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all">
                توليد كود ترخيص جديد
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-[11px] font-bold text-muted-foreground uppercase">سجل المفاتيح (يمكنك حذف أي مفتاح):</p>
              {keys.map((k) => (
                <div key={k.id} className="p-2.5 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">{k.key}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${k.isUsed ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                      {k.isUsed ? "تم الاستخدام" : "متاح للتفعيل"}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteKey(k.id)}
                    className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="حذف هذا المفتاح"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
