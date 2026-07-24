"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "ar" | "en";

export const translations = {
  ar: {
    brandName: "بوس هاب",
    brandSubtitle: "نظام إدارة ومبيعات أجهزة اللاب توب SaaS",
    dashboard: "لوحة التحكم الرئيسية",
    posTerminal: "نقطة البيع (الكاشير)",
    laptopInventory: "مخزون أجهزة اللاب توب",
    purchaseOrders: "أوامر الشراء والمستوردين",
    financeCash: "الخزينة والمصروفات",
    reportsAnalytics: "التقارير الماليّة والتحليلات",
    subscriptions: "الاشتراكات والمدفوعات المحلّية",
    companySettings: "إعدادات الشركة والفواتير",
    superAdminPortal: "لوحة الأدمن الرئيسي (SuperAdmin)",
    signOut: "تسجيل الخروج",
    role: "الصلاحية",
    todaySales: "مبيعات اليوم",
    monthlySales: "مبيعات الشهر",
    yearlySales: "مبيعات السنة",
    inventoryValue: "قيمة المخزون بسعر الشراء",
    cashBalance: "رصيد الخزينة الرئيسية",
    netProfit: "صافي ربح الشهر",
    openPos: "فتح شاشة البيع السريعة (POS)",
    topSellingModels: "الأجهزة الأكثر مبيعاً",
    recentSales: "أحدث عمليات البيع من الكاشير",
    invoiceNumber: "رقم الفاتورة",
    customer: "العميل",
    paymentMethod: "طريقة الدفع",
    totalPayable: "الإجمالي المطلوب",
    profit: "الأرباح",
    date: "التاريخ",
    searchPlaceholder: "ابحث باسم الجهاز، الموديل، السيريال، أو قارئ الباركود...",
    addToCart: "إضافة للسلة",
    checkoutCart: "سلة المبيعات والتسليم",
    cash: "كاش (نقدي)",
    instapay: "انستاباي (Instapay)",
    vodafoneCash: "فودافون كاش",
    card: "كارت فيزا",
    completeSale: "إتمام عملية البيع وطباعة الفاتورة",
    printReceipt: "طباعة الفاتورة الحرارية (80mm)",
    close: "إغلاق",
    addProduct: "إضافة جهاز لاب توب جديد",
    cpu: "المعالج (CPU)",
    ram: "الرامات (RAM)",
    ssd: "الهارد (SSD)",
    gpu: "كارت الشاشة (GPU)",
    condition: "حالة الجهاز",
    purchasePrice: "سعر الشراء (EGP)",
    sellingPrice: "سعر البيع (EGP)",
    quantity: "الكمية بالمخزن",
    serialNumber: "السيريال نمبر (S/N)",
    actions: "الإجراءات",
    newCondition: "جديد (NEW)",
    usedCondition: "مستعمل (USED)",
    refurbishedCondition: "مجدد (REFURBISHED)",
    autoCashOption: "الخصم التلقائي من الخزينة عند الشراء",
    langSwitch: "English",
  },
  en: {
    brandName: "POS Hub",
    brandSubtitle: "Enterprise Multi-Tenant SaaS ERP",
    dashboard: "Executive Dashboard",
    posTerminal: "POS Terminal",
    laptopInventory: "Laptop Inventory",
    purchaseOrders: "Purchase Orders",
    financeCash: "Cash & Expenses",
    reportsAnalytics: "Reports & Analytics",
    subscriptions: "Subscriptions",
    companySettings: "Company Settings",
    superAdminPortal: "SuperAdmin Portal",
    signOut: "Sign Out",
    role: "Role",
    todaySales: "Today's Sales",
    monthlySales: "Monthly Sales",
    yearlySales: "Yearly Sales",
    inventoryValue: "Inventory Value",
    cashBalance: "Cash Register Safe",
    netProfit: "Net Monthly Profit",
    openPos: "Open POS Terminal",
    topSellingModels: "Top Selling Models",
    recentSales: "Recent POS Transactions",
    invoiceNumber: "Invoice #",
    customer: "Customer",
    paymentMethod: "Payment Method",
    totalPayable: "Net Total Payable",
    profit: "Profit",
    date: "Date",
    searchPlaceholder: "Search products by Name, Code, Serial Number, or Scan Barcode...",
    addToCart: "Add to Cart",
    checkoutCart: "Checkout Cart",
    cash: "Cash",
    instapay: "Instapay",
    vodafoneCash: "Vodafone Cash",
    card: "Card",
    completeSale: "Complete Sale",
    printReceipt: "Thermal Invoice",
    close: "Close",
    addProduct: "Add New Laptop Item",
    cpu: "CPU",
    ram: "RAM",
    ssd: "SSD",
    gpu: "GPU",
    condition: "Condition",
    purchasePrice: "Cost Price",
    sellingPrice: "Selling Price",
    quantity: "Stock Qty",
    serialNumber: "Serial Number",
    actions: "Actions",
    newCondition: "New",
    usedCondition: "Used",
    refurbishedCondition: "Refurbished",
    autoCashOption: "Auto Cash Deduction",
    langSwitch: "العربية",
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations["ar"]) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar");

  useEffect(() => {
    const saved = localStorage.getItem("laptophub_lang") as Language;
    const finalLang = saved === "en" ? "en" : "ar";
    setLangState(finalLang);
    document.documentElement.dir = finalLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = finalLang;
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("laptophub_lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  const toggleLanguage = () => {
    const nextLang = lang === "ar" ? "en" : "ar";
    setLang(nextLang);
  };

  const t = (key: keyof typeof translations["ar"]) => {
    return translations[lang][key] || translations["ar"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, isRtl: lang === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
