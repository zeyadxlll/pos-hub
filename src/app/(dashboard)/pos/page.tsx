"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  Printer,
  Barcode,
  CreditCard,
  Banknote,
  Smartphone,
  Phone,
  UserCheck,
  ShieldCheck,
  History,
  Percent,
  DollarSign,
  Eye,
} from "lucide-react";

export default function POSTerminalPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [salespersonName, setSalespersonName] = useState<string>("");

  // Payment & Discount State
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Archive & Search Past Sales State
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [pastSales, setPastSales] = useState<any[]>([]);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search]);

  useEffect(() => {
    if (session?.user?.name && !salespersonName) {
      setSalespersonName(session.user.name);
    }
  }, [session]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPastSales = async () => {
    setArchiveLoading(true);
    try {
      const res = await fetch("/api/sales");
      if (res.ok) {
        const data = await res.json();
        setPastSales(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setArchiveLoading(false);
    }
  };

  const addToCart = (product: any) => {
    if (product.quantity <= 0) {
      alert(`الجهاز '${product.name}' غير متوفر بالمخزن حالياً.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`الكمية المتاحة بالمخزن فقط هي (${product.quantity})`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          code: product.code,
          name: product.name,
          unitPrice: product.sellingPrice,
          unitCost: product.purchasePrice,
          quantity: 1,
          maxStock: product.quantity,
          serialNumber: product.serialNumber || "",
          specs: `${product.cpu || ""} | ${product.ram || ""} | ${product.ssd || ""}`,
        },
      ];
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              alert(`أقصى كمية متوفرة هي ${item.maxStock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Financial Calculations (Fixed vs Percentage Discount)
  const grossSubtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  const calculatedDiscountAmount =
    discountType === "PERCENTAGE"
      ? Math.round(((grossSubtotal * Math.min(100, Math.max(0, discountInput))) / 100) * 100) / 100
      : Math.min(grossSubtotal, Math.max(0, discountInput));

  const netAmount = Math.max(0, grossSubtotal - calculatedDiscountAmount + taxAmount);
  const currentPaid = paidAmount > 0 ? paidAmount : netAmount;

  const handleCheckout = async () => {
    if (cart.length === 0 || submitting) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer || undefined,
          salespersonName: salespersonName || session?.user?.name || "الكاشير",
          paymentMethod,
          paidAmount: currentPaid,
          discountAmount: calculatedDiscountAmount,
          taxAmount,
          items: cart.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            unitCost: i.unitCost,
            serialNumber: i.serialNumber || undefined,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشلت عملية البيع");

      setReceiptModal(data);
      setCart([]);
      setPaidAmount(0);
      setDiscountInput(0);
      fetchProducts();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openReprintModal = (saleRecord: any) => {
    setReceiptModal({
      sale: saleRecord,
      invoice: {
        qrCodeData: `Tenant:${saleRecord.tenantId}|Inv:${saleRecord.invoiceNumber}|Total:${saleRecord.netAmount}|Date:${saleRecord.createdAt}`,
      },
    });
  };

  const filteredArchiveSales = pastSales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      s.salespersonName?.toLowerCase().includes(archiveSearch.toLowerCase()) ||
      s.customer?.name?.toLowerCase().includes(archiveSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
        {/* Left Side: Product Selector Grid & Archive Bar */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Barcode Search & History Archive Trigger */}
          <div className="glass-panel p-3 rounded-2xl border border-border/50 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
              />
            </div>

            <button
              onClick={() => {
                setArchiveModalOpen(true);
                fetchPastSales();
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold text-xs border border-blue-500/20 flex items-center gap-1.5 shrink-0 transition-all"
            >
              <History className="w-4 h-4" />
              <span>سجل الفواتير السابقة</span>
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-1">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="glass-panel p-4 rounded-2xl border border-border/50 hover:border-blue-500/50 cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                      {product.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.quantity > 0
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {product.quantity > 0 ? `${product.quantity} قطع بالمخزن` : "نفذت الكمية"}
                    </span>
                  </div>

                  {product.imageUrl && (
                    <div className="my-2 overflow-hidden rounded-xl h-28 border border-border/40 bg-secondary/30">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}

                  <h3 className="font-bold text-sm text-foreground mt-2 line-clamp-1 group-hover:text-blue-400 transition-colors text-right">
                    {product.name}
                  </h3>

                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 text-right">
                    {[product.cpu, product.ram, product.ssd, product.gpu].filter(Boolean).join(" • ")}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-base font-extrabold text-blue-400 font-heading">
                    {formatCurrency(product.sellingPrice)}
                  </span>
                  <button className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: POS Cart & Salesperson / Discount Panel */}
        <div className="w-full md:w-96 glass-panel rounded-2xl border border-border/50 p-5 flex flex-col justify-between overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <h2 className="font-bold text-base text-foreground font-heading flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <span>{t("checkoutCart")}</span>
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">{cart.length} أصناف</span>
          </div>

          {/* Sales Representative Name Input */}
          <div className="my-2 p-2.5 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>اسم البائع / السيلز المسؤول:</span>
            </label>
            <input
              type="text"
              placeholder="مثال: محمود السيد"
              value={salespersonName}
              onChange={(e) => setSalespersonName(e.target.value)}
              className="w-full p-2 rounded-lg bg-background border border-border text-xs text-foreground font-semibold text-right"
            />
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto my-2 space-y-2.5 pl-1">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 stroke-1 mb-2 opacity-40" />
                <p className="text-xs font-medium">سلة المبيعات فارغة</p>
                <p className="text-[11px] opacity-70">اضغط على أي جهاز لإضافته لطلب البيع الحالي</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.code}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-rose-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-400">{formatCurrency(item.unitPrice)}</span>
                    <div className="flex items-center gap-2 bg-secondary/80 rounded-lg p-1 border border-border/50">
                      <button
                        onClick={() => updateCartQuantity(item.productId, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-foreground hover:bg-background"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productId, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-foreground hover:bg-background"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout & Discount Controls */}
          <div className="pt-3 border-t border-border/40 space-y-3">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Discount Percentage vs Fixed Switcher */}
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">نوع الخصم:</span>
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 border border-border/50">
                  <button
                    type="button"
                    onClick={() => setDiscountType("FIXED")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                      discountType === "FIXED" ? "bg-blue-600 text-white" : "text-muted-foreground"
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>مبلغ ثابت (ج.م)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                      discountType === "PERCENTAGE" ? "bg-blue-600 text-white" : "text-muted-foreground"
                    }`}
                  >
                    <Percent className="w-3 h-3" />
                    <span>نسبة (%)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={discountType === "PERCENTAGE" ? 100 : grossSubtotal}
                  placeholder={discountType === "PERCENTAGE" ? "مثال: 5%" : "مثال: 500 ج.م"}
                  value={discountInput || ""}
                  onChange={(e) => setDiscountInput(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-background border border-border text-xs text-foreground font-bold text-right"
                />
                {discountType === "PERCENTAGE" && discountInput > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                    = {formatCurrency(calculatedDiscountAmount)}
                  </span>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">طريقة الدفع بالمحل</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "CASH", label: t("cash"), icon: Banknote },
                  { id: "INSTAPAY", label: t("instapay"), icon: Smartphone },
                  { id: "CARD", label: t("card"), icon: CreditCard },
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                          : "bg-secondary/40 text-muted-foreground border-border/50 hover:bg-secondary"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>الإجمالي الفرعي</span>
                <span>{formatCurrency(grossSubtotal)}</span>
              </div>
              {calculatedDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>الخصم المطبق</span>
                  <span>- {formatCurrency(calculatedDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-foreground font-bold text-sm pt-1 border-t border-border/40">
                <span>{t("totalPayable")}</span>
                <span className="text-emerald-400 font-extrabold text-base font-heading">{formatCurrency(netAmount)}</span>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{t("completeSale")} ({formatCurrency(netAmount)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Printable Professional Invoice Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-border/50 space-y-5 shadow-2xl bg-card text-card-foreground my-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">فاتورة بيع رسمية</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="py-1.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الفاتورة</span>
                </button>
                <button onClick={() => setReceiptModal(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold px-2">
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="p-5 rounded-2xl bg-white text-slate-900 font-sans space-y-4 text-xs shadow-md border border-slate-200">
              {/* Header: Company Name & Phone */}
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <h2 className="text-lg font-black tracking-tight text-slate-950 font-heading">
                  {receiptModal.sale?.tenant?.name || "TechZone Laptops & Electronics"}
                </h2>
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600 font-medium">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-600" />
                    <span>رقم التواصل بالفرع: {receiptModal.sale?.tenant?.phone || "+20 100 123 4567"}</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{receiptModal.sale?.tenant?.address || "القاهرة - مصر"}</p>
              </div>

              {/* Metadata: Invoice Number, Date, Salesperson */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-500 font-medium">رقم الفاتورة:</span>{" "}
                  <span className="font-bold text-blue-600 font-mono">{receiptModal.sale?.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">التاريخ:</span>{" "}
                  <span className="font-semibold text-slate-800">{formatDate(receiptModal.sale?.createdAt)}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 pt-1 border-t border-slate-200/60 mt-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-500 font-medium">مباع بواسطة (السيلز):</span>{" "}
                  <span className="font-bold text-slate-900">
                    {receiptModal.sale?.salespersonName || receiptModal.sale?.createdByUser?.name || "السيلز المسؤول"}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">الجهاز والبيان</th>
                      <th className="p-2 text-center">الكمية</th>
                      <th className="p-2 text-left">السعر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receiptModal.sale?.items?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="p-2">
                          <p className="font-bold text-slate-900">{item.product?.name}</p>
                          {item.serialNumber && (
                            <p className="text-[10px] text-slate-500 font-mono">S/N: {item.serialNumber}</p>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold">{item.quantity}</td>
                        <td className="p-2 text-left font-extrabold text-slate-900">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Net Totals & Discount Breakdown */}
              <div className="bg-slate-950 text-white p-3.5 rounded-xl space-y-1.5">
                {receiptModal.sale?.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-slate-300 text-[11px]">
                      <span>إجمالي الأجهزة قبل الخصم:</span>
                      <span>{formatCurrency(receiptModal.sale?.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 text-[11px] font-semibold">
                      <span>قيمة الخصم المالي المطبق:</span>
                      <span>- {formatCurrency(receiptModal.sale?.discountAmount)}</span>
                    </div>
                    <div className="border-t border-slate-800 my-1"></div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">صافي الفاتورة المطلوب سداده:</span>
                  <span className="text-base font-black text-emerald-400 font-heading">
                    {formatCurrency(receiptModal.sale?.netAmount)}
                  </span>
                </div>
              </div>

              {/* Explicit Customer Warranty Terms Box */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-slate-900 space-y-1.5">
                <p className="font-extrabold text-[11px] text-amber-700 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>شروط الضمان الرسمية والاستبدال:</span>
                </p>
                <ul className="space-y-1 text-[10px] font-semibold text-slate-700 leading-relaxed pr-2">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>ضمان لمدة <strong>3 شهور</strong> ضد عيوب الصناعة.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>استبدال الجهاز فقط خلال <strong>أسبوعين</strong> من تاريخ الفاتورة.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    <span><strong>لا يوجد ترجيع نقدي للجهاز بعد الشراء (استبدال فقط)</strong>.</span>
                  </li>
                </ul>
              </div>

              {/* Footer QR Payload */}
              <div className="pt-2 text-center border-t border-slate-200">
                <p className="text-[9px] font-mono text-slate-400">QR: {receiptModal.invoice?.qrCodeData}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">شكراً لتعاملكم معنا!</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setReceiptModal(null)}
                className="w-full py-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold"
              >
                إغلاق الشاشة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Past Sales Archive & Reprint Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground my-8">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-base text-foreground font-heading">سجل الفواتير وطباعة المبيعات السابقة</h3>
              </div>
              <button onClick={() => setArchiveModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة، اسم السيلز، أو العميل..."
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
              />
            </div>

            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-right text-xs">
                <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">السيلز المسؤول</th>
                    <th className="p-3">العميل / طريقة الدفع</th>
                    <th className="p-3">المبلغ الإجمالي</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3 text-left">طباعة الفاتورة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {archiveLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        جاري تحميل سجل الفواتير...
                      </td>
                    </tr>
                  ) : filteredArchiveSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        لا توجد فواتير سابقة مطابقة.
                      </td>
                    </tr>
                  ) : (
                    filteredArchiveSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-3 font-bold text-blue-400">{sale.invoiceNumber}</td>
                        <td className="p-3 font-semibold text-foreground">
                          {sale.salespersonName || sale.createdByUser?.name || "السيلز"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{sale.customer?.name || "عميل كاش مباشر"}</div>
                          <div className="text-[10px] font-bold text-emerald-400">{sale.paymentMethod}</div>
                        </td>
                        <td className="p-3 font-extrabold text-foreground">{formatCurrency(sale.netAmount)}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(sale.createdAt)}</td>
                        <td className="p-3 text-left">
                          <button
                            onClick={() => {
                              setArchiveModalOpen(false);
                              openReprintModal(sale);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة وطباعة</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
