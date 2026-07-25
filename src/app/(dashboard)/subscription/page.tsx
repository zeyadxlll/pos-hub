"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Key, Smartphone, CheckCircle2, MessageSquare, PhoneCall, Sparkles, Tag, AlertCircle } from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [subStatus, setSubStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Platform Settings State
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

  const [licenseKey, setLicenseKey] = useState("");
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyMsg, setKeyMsg] = useState<string | null>(null);

  const [paymentPlan, setPaymentPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState<"INSTAPAY" | "VODAFONE_CASH">("INSTAPAY");
  const [receiptImage, setReceiptImage] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSubStatus();
    fetchPlatformSettings();
  }, []);

  const fetchSubStatus = async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const data = await res.json();
        setSubStatus(data);
      }
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

  const handleRedeemKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyLoading(true);
    setKeyMsg(null);

    try {
      const res = await fetch("/api/subscription/license-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: licenseKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تفعيل مفتاح الترخيص");

      setKeyMsg("تم تفعيل اشتراك الشركة بنجاح واضافة الصلاحيات! جاري توجيهك للنظام...");
      setLicenseKey("");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1200);
    } catch (err: any) {
      setKeyMsg(err.message);
    } finally {
      setKeyLoading(false);
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    setPaymentMsg(null);

    const activePrice = paymentPlan === "YEARLY" ? platformSettings.yearlyDiscountPrice : platformSettings.monthlyDiscountPrice;

    try {
      const res = await fetch("/api/subscription/payment-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: paymentPlan,
          amount: activePrice,
          paymentMethod,
          receiptImage: receiptImage || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تقديم طلب الدفع");

      setPaymentMsg("تم إرسال إشعار التحويل بنجاح! يرجى إرسال الصورة أيضاً على رقم الواتساب لسرعة التفعيل.");
      setReceiptImage("");
      fetchSubStatus();
    } catch (err: any) {
      setPaymentMsg(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const whatsappLink = `https://wa.me/2${platformSettings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("مرحباً، قمت بتحويل مبلغ الاشتراك لمنظومة POS Hub ويرجى تفعيل حساب الشركة.")}`;

  const currentOriginalPrice = paymentPlan === "YEARLY" ? platformSettings.yearlyOriginalPrice : platformSettings.monthlyOriginalPrice;
  const currentDiscountPrice = paymentPlan === "YEARLY" ? platformSettings.yearlyDiscountPrice : platformSettings.monthlyDiscountPrice;
  const savingsAmount = Math.max(0, currentOriginalPrice - currentDiscountPrice);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Promotional Discount Alert Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-purple-700 text-white p-5 shadow-2xl border border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold border border-white/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>عرض ترويجي وخصم خاص على الاشتراكات</span>
              </span>
              <h2 className="text-xl font-extrabold font-heading tracking-tight mt-1 whitespace-pre-line">
                {platformSettings.promoBanner}
              </h2>
              <p className="text-xs text-white/90">
                جدد أو فعل حسابك الآن واستمتع بالربط السحابي والنسخ الاحتياطي وحماية الأوردرات دون أي توقف!
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shrink-0">
              <div className="text-center">
                <span className="text-[10px] text-white/70 block uppercase font-bold">السعر الاصلي</span>
                <span className="text-sm font-bold line-through text-white/60 font-mono">
                  {currentOriginalPrice} EGP
                </span>
              </div>

              <div className="h-8 w-px bg-white/20" />

              <div className="text-center">
                <span className="text-[10px] text-amber-300 block uppercase font-extrabold">السعر بعد الخصم</span>
                <span className="text-xl font-extrabold text-amber-300 font-mono">
                  {currentDiscountPrice} EGP
                </span>
              </div>

              {savingsAmount > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-lg animate-bounce">
                  توفير {savingsAmount} ج
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <span>{t("subscriptions")}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            إدارة حالة اشتراك المحل، التحويل المالي المباشر عبر انستاباي وفودافون كاش، أو تفعيل الكروت ومفاتيح التراخيص.
          </p>
        </div>

        {/* Status Card */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">حالة اشتراك الشركة الحالي</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-extrabold text-foreground font-heading">
                {subStatus?.status === "ACTIVE" ? "اشتراك نشط ومفعل" : subStatus?.status === "EXPIRED" ? "منتهي الصلاحية" : "في انتظار التأكيد / متوقف"}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  subStatus?.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                متبقي {subStatus?.remainingDays || 0} يوم
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              سعر الاشتراك الشهري المعتمد:{" "}
              <span className="font-bold text-emerald-400 font-mono">
                {platformSettings.monthlyDiscountPrice} EGP / شهر
              </span>{" "}
              <span className="line-through text-muted-foreground text-[10px] font-mono">
                ({platformSettings.monthlyOriginalPrice} EGP)
              </span>
              {" | "}
              سعر الاشتراك السنوي المعتمد:{" "}
              <span className="font-bold text-purple-400 font-mono">
                {platformSettings.yearlyDiscountPrice} EGP / سنة
              </span>
            </p>
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option A: License Key Activation */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-foreground font-heading">تفعيل بمفتاح ترخيص (License Key)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              إذا حصلت على كود مفتاح ترخيص مسبقاً من ممثل المبيعات أو الدعم الفني، ادخله أدناه للتفعيل الفوري وفتح النظام.
            </p>

            {keyMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{keyMsg}</span>
              </div>
            )}

            <form onSubmit={handleRedeemKey} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="مثال: POSHUB-YEARLY-KEY-2026-Y1"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground font-mono uppercase text-center"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={keyLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                {keyLoading ? "جاري التحقق والتفعيل..." : "تفعيل مفتاح الاشتراك فوراً"}
              </button>
            </form>
          </div>

          {/* Option B: Instapay / Vodafone Cash Manual Payment */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-foreground font-heading">التحويل المالي المباشر</h3>
            </div>

            {/* Numbers Banner */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-500" />
                <span>أرقام التحويل الرسمية والدعم:</span>
              </p>
              <div className="flex justify-between items-center text-foreground font-mono bg-background/50 p-2 rounded-lg border border-border/40">
                <span>رقم محفظة التحويل (انستاباي / فودافون كاش):</span>
                <span className="font-extrabold text-emerald-400 text-sm">{platformSettings.transferNumber}</span>
              </div>
              <div className="flex justify-between items-center text-foreground font-mono bg-background/50 p-2 rounded-lg border border-border/40">
                <span>رقم التواصل والدعم عبر الواتساب:</span>
                <span className="font-extrabold text-blue-400 text-sm">{platformSettings.whatsappNumber}</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                📌 <span className="font-semibold text-foreground">{platformSettings.instructionNote}</span>
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال إشعار التحويل عبر الواتساب فوراً</span>
              </a>
            </div>

            {paymentMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                {paymentMsg}
              </div>
            )}

            <form onSubmit={handleSubmitReceipt} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold">اختر الخطة</label>
                  <select
                    value={paymentPlan}
                    onChange={(e: any) => setPaymentPlan(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs font-bold"
                  >
                    <option value="MONTHLY">خطة شهرية ({platformSettings.monthlyDiscountPrice} ج.م)</option>
                    <option value="YEARLY">خطة سنوية ({platformSettings.yearlyDiscountPrice} ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold">طريقة التحويل</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs font-bold"
                  >
                    <option value="INSTAPAY">انستاباي Instapay</option>
                    <option value="VODAFONE_CASH">فودافون كاش</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold">رابط صورة إشعار التحويل</label>
                <input
                  type="text"
                  placeholder="https://cloudinary.com/receipt.jpg"
                  value={receiptImage}
                  onChange={(e) => setReceiptImage(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={paymentLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
              >
                {paymentLoading ? "جاري الإرسال..." : "إرسال صورة الإشعار للمراجعة والتفعيل"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
