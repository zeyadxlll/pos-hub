"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Sparkles,
  Laptop,
  ShieldCheck,
  Zap,
  Bot,
  Mic,
  Megaphone,
  FileSpreadsheet,
  Lock,
  Printer,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  const [platformSettings, setPlatformSettings] = useState({
    monthlyOriginalPrice: 500,
    monthlyDiscountPrice: 350,
    yearlyOriginalPrice: 5000,
    yearlyDiscountPrice: 3500,
    promoBanner: "🔥 عرض خاص لفترة محدودة: خصم 30% على الاشتراك الشهري والسنوي للمنظومة!",
  });

  useEffect(() => {
    fetchPlatformSettings();
  }, []);

  const fetchPlatformSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setPlatformSettings({
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

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans" dir="rtl">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-8 md:p-12 shadow-2xl border border-white/20">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold border border-white/30">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>دليلك الشامل لمميزات منظومة POS Hub 🚀</span>
            </span>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight font-heading leading-tight">
              أقوى منظومة سحابية ومساعد AI لإدارة محلات أجهزة اللاب توب والالكترونيات
            </h1>

            <p className="text-sm md:text-base text-white/90 leading-relaxed font-medium">
              صممت المنظومة خصيصاً لتلبي كافة احتياجات صاحب المحل والكاشير: حماية المبيعات من العجز، تتبع الضمان بالسيريال، طباعة الفواتير الاحترافية، ودعم الذكاء الاصطناعي الصوتي والتسويقي!
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/subscription"
                className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-xl flex items-center gap-2 transition-all duration-300 hover:scale-105"
              >
                <CreditCard className="w-4 h-4" />
                <span>اشترك الآن واستمتع بالعرض ⚡</span>
              </Link>
            </div>
          </div>

          <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        {/* Section 1: AI Agent Features (مميزات الذكاء الاصطناعي المتقدمة) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-foreground font-heading">
              🤖 مميزات المساعد الذكي والمفتش الأمني (POS AI Agent)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1 */}
            <div className="glass-panel p-5 rounded-2xl border border-purple-500/30 bg-purple-500/5 space-y-3 hover:border-purple-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">🎙️ الإدخال والتحكم الصوتي </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                اضغط المايك وتحدث صوتاً بالكاشير، وسيقوم الـ AI بسماع صوتك وترشيح أجهزة اللاب توب المناسبة لزبونك فوراً!
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-panel p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3 hover:border-rose-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">🚨 المفتش الأمني وسجل المحذوفات</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                رصد دقيق لأي عملية حذف فاتورة بالاسم والتاريخ والدقيقة والمبلغ المالي، يمنع وقوع أي عجز بالخزينة نهائياً!
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3 hover:border-amber-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Megaphone className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">✨ مولد المنشورات التسويقية</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                توليد بوستات تسويقية جذابة لفيسبوك وانستجرام لأي جهاز بالمخزن بضغطة زر واحدة تشمل الأسعار والمواصفات!
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-3 hover:border-blue-500/50 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-foreground">💡 مطابقة ميزانية العميل</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                اكتب ميزانية زبونك والاستخدام المطلوبة، وسيقوم الـ AI بمطابقتها وترشيح أفضل 3 أجهزة متاحة بمخزنك.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Platform Core Capabilities (أهم مميزات النظام للمحل) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-foreground font-heading">
              ⚡ أهم مميزات وتسهيلات المنظومة لصاحب المحل
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">🔍 تتبع الضمان بالسيريال (S/N)</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                صفحة مخصصة للبحث بالسيريال نمبر ومعرفة موقف ضمان الـ 3 شهور ضد عيوب الصناعة ومهلة الـ 14 يوماً للاستبدال واسم العميل والسيلز.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">🧾 الفواتير الحرارية والشروط المخصصة</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                طباعة فواتير احترافية تعكس لوجو المحل، مواصفات الجهاز الكاملة، التعديلات والترقيات، وشروط الضمان القابلة للتعديل والإضافة.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-foreground">📊 تصدير تقارير Excel بنقرة واحدة</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                تحميل وتنزيل شيت Excel مالي شامل بحركة المبيعات، الصافي، صافي الربح، الخصومات، وبيانات الفواتير بضغطة زر واحدة.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Pricing & Subscription Plans Showcase */}
        <div className="glass-panel p-8 rounded-3xl border border-border/50 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              خطط وأسعار الاشتراكات
            </span>
            <h2 className="text-2xl font-extrabold text-foreground font-heading">
              اختر الخطة المناسبة لمحلك واستمتع بالعرض الترويجي
            </h2>
            <p className="text-xs text-muted-foreground">
              جميع الخطط تشمل الربط السحابي، النسخ الاحتياطي المستمر، تحديثات النظام المجانية، والدعم الفني عبر الواتساب.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4">
            {/* Monthly Plan */}
            <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-5 relative">
              <div className="space-y-1">
                <span className="text-xs font-bold text-blue-400">📅 الخطة الشهرية</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-foreground font-mono">
                    {platformSettings.monthlyDiscountPrice} EGP
                  </span>
                  <span className="text-xs text-muted-foreground line-through font-mono">
                    {platformSettings.monthlyOriginalPrice} EGP / شهر
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>دعم كامل لكافة شاشات الكاشير والمخزن</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>المساعد الذكي POS AI والإدخال الصوتي 🎙️</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>نظام تتبع الضمان بالسيريال نمبر</span>
                </li>
              </ul>

              <Link
                href="/subscription"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>تفعيل الخطة الشهرية</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>

            {/* Yearly Plan (Best Value) */}
            <div className="glass-panel p-6 rounded-2xl border border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-indigo-500/5 space-y-5 relative shadow-xl">
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-purple-500 text-white text-[10px] font-extrabold shadow">
                الأعلى توفيراً 👑
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-purple-400">👑 الخطة السنوية</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-purple-300 font-mono">
                    {platformSettings.yearlyDiscountPrice} EGP
                  </span>
                  <span className="text-xs text-muted-foreground line-through font-mono">
                    {platformSettings.yearlyOriginalPrice} EGP / سنة
                  </span>
                </div>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>توفير شهرين مجاناً عند الاشتراك السنوي</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>دعم فني وتدريب أولوية ممتازة</span>
                </li>
                <li className="flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>توليد بوستات الفيسبوك والتسويق بالـ AI ✨</span>
                </li>
              </ul>

              <Link
                href="/subscription"
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <span>تفعيل الخطة السنوية</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
