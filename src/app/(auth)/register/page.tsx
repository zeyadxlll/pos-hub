"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Laptop2, Building2, User, Phone, Mail, Lock, MapPin, CheckCircle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    country: "Egypt",
    address: "",
    businessType: "تجارة لاب توب وإلكترونيات",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشلت عملية إنشاء الحساب");
      }

      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background relative overflow-hidden" dir="rtl">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/25 mb-2">
            <Laptop2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            إنشاء حساب شركة أو محل جديد
          </h1>
          <p className="text-sm text-muted-foreground">احصل على نظام إدارة ومبيعات مستقل ومعزول بالكامل لشركتك</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border border-border/50 backdrop-blur-2xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">اسم الشركة / المحل</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: البستان لعلوم الكمبيوتر"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">اسم المالك الثلاثي</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمود السيد أحمد"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="owner@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">رقم الهاتف / الواتساب</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    placeholder="01001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">كلمة السر الحماية</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">عنوان الفرع / المحل الرئيسي</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="مول البستان، الدور الثاني، محل 14، القاهرة"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground text-right"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
              <span>يتضمن فترة تجربة مجانية تلقائية لمدة 3 أيام بكافة صلاحيات النظام.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>إنشاء حساب الشركة الآن</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          لديك حساب مسجل بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-blue-500 hover:underline">
            تسجيل الدخول للمحل
          </Link>
        </p>
      </div>
    </div>
  );
}
