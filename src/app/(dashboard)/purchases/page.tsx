"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Truck, Plus } from "lucide-react";

export default function PurchasesPage() {
  const { t } = useLanguage();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [unitCost, setUnitCost] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [paidAmount, setPaidAmount] = useState(0);
  const [autoCashDeducted, setAutoCashDeducted] = useState(true);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPurchases();
    fetchProducts();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch("/api/purchases");
      if (res.ok) {
        const data = await res.json();
        setPurchases(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert("يرجى اختيار الجهاز المطلوب");
      return;
    }

    setSubmitLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "CASH",
          paidAmount: paidAmount > 0 ? paidAmount : unitCost * quantity,
          autoCashDeducted,
          items: [
            {
              productId: selectedProduct,
              quantity,
              unitCost,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تسجيل أمر الشراء");

      setModalOpen(false);
      fetchPurchases();
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
              <Truck className="w-6 h-6 text-blue-500" />
              <span>{t("purchaseOrders")}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              تسجيل الشحنات المستوردة وزيادة كميات المخزون تلقائياً مع نظام الخصم التلقائي من الخزينة.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أمر شراء جديد</span>
          </button>
        </div>

        {/* Purchase Orders Table */}
        <div className="glass-panel rounded-2xl border border-border/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="p-3 font-semibold">رقم أمر الشراء PO</th>
                  <th className="p-3 font-semibold">المورد / المصدر</th>
                  <th className="p-3 font-semibold">الأجهزة والكميات</th>
                  <th className="p-3 font-semibold">إجمالي فاتورة الشراء</th>
                  <th className="p-3 font-semibold">المدفوع للمورد</th>
                  <th className="p-3 font-semibold">حالة خصم الخزينة</th>
                  <th className="p-3 font-semibold">تاريخ الشحنة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      جاري تحميل سجل المشتريات...
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      لا توجد أذون شراء مسجلة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-bold text-blue-400">{po.purchaseNumber}</td>
                      <td className="p-3 font-medium text-foreground">{po.supplier?.name || "مورد استيراد مباشر"}</td>
                      <td className="p-3">
                        {po.items?.map((item: any) => (
                          <div key={item.id} className="text-[11px]">
                            <span className="font-semibold">{item.product?.name}</span> ({item.quantity} قطعة بسعر {formatCurrency(item.unitCost)})
                          </div>
                        ))}
                      </td>
                      <td className="p-3 font-extrabold text-foreground">{formatCurrency(po.totalAmount)}</td>
                      <td className="p-3 font-bold text-emerald-400">{formatCurrency(po.paidAmount)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            po.autoCashDeducted
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {po.autoCashDeducted ? "تم الخصم تلقائياً" : "دفع يدوي"}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{formatDate(po.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-heading">إنشاء أمر شراء وتغذية مخزن</h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">اختر جهاز اللاب توب</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) setUnitCost(prod.purchasePrice);
                  }}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground"
                >
                  <option value="">-- اختر من قائمة الأجهزة --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) - المخزون الحالي: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">سعر تكلفة القطعة (EGP)</label>
                  <input
                    type="number"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">الكمية المضافة للمخزن</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">المبلغ المدفوع كاش للمورد (EGP)</label>
                <input
                  type="number"
                  placeholder={`الإجمالي التلقائي: ${unitCost * quantity}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                />
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">خصم المبلغ تلقائياً من الخزينة الرئيسية</p>
                  <p className="text-[10px] text-muted-foreground">سيتم خصم قيمة الفاتورة من رصيد المحل فوراً</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoCashDeducted}
                  onChange={(e) => setAutoCashDeducted(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  {submitLoading ? "جاري المعالجة..." : "تأكيد أمر الشراء وتغذية المخزون"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
