"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownRight, Plus, Trash2 } from "lucide-react";

export default function FinancePage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [cashRegister, setCashRegister] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<{ expenses: any[]; categories: any[] }>({
    expenses: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);

  const [cashModal, setCashModal] = useState<{ open: boolean; action: "DEPOSIT" | "WITHDRAW" }>({
    open: false,
    action: "DEPOSIT",
  });
  const [cashAmount, setCashAmount] = useState(0);
  const [cashNotes, setCashNotes] = useState("");

  const [expenseModal, setExpenseModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseDescription, setExpenseDescription] = useState("");

  const isOwnerOrAdmin =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchCashData();
    fetchExpensesData();
  }, []);

  const fetchCashData = async () => {
    try {
      const res = await fetch("/api/finance/cash");
      if (res.ok) {
        const data = await res.json();
        setCashRegister(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpensesData = async () => {
    try {
      const res = await fetch("/api/finance/expenses");
      if (res.ok) {
        const data = await res.json();
        setExpensesData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCashAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: cashModal.action,
          amount: cashAmount,
          notes: cashNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشلت عملية الخزينة");
      }

      setCashModal({ open: false, action: "DEPOSIT" });
      setCashAmount(0);
      setCashNotes("");
      fetchCashData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCashTransaction = async (txId: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف حركة الخزينة هذه وإعادة ضبط رصيد الخزينة؟")) return;

    try {
      const res = await fetch(`/api/finance/cash?transactionId=${txId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حذف الحركة");

      fetchCashData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategory,
          amount: expenseAmount,
          description: expenseDescription,
          autoCashDeducted: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل تسجيل المصروفات");
      }

      setExpenseModal(false);
      setExpenseAmount(0);
      setExpenseDescription("");
      fetchExpensesData();
      fetchCashData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-500" />
              <span>{t("financeCash")}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              متابعة حركة الخزينة الرئيسية، الإيداعات والسحوبات اليدوية، وحذف الحركات بفرص إعادة ضبط الخزينة.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCashModal({ open: true, action: "DEPOSIT" })}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>إيداع مالي بالخزينة</span>
            </button>
            <button
              onClick={() => setCashModal({ open: true, action: "WITHDRAW" })}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>سحب مالي من الخزينة</span>
            </button>
            <button
              onClick={() => setExpenseModal(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مصروف جديد</span>
            </button>
          </div>
        </div>

        {/* Cash Safe Card */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("cashBalance")}</span>
            <h2 className="text-3xl font-extrabold text-foreground font-heading mt-1">
              {loading ? "..." : formatCurrency(cashRegister?.balance || 0)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              الخزينة نشطة ومحمية
            </span>
          </div>
        </div>

        {/* Grid for Cash Transactions History & Expense Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cash Safe Audit Movement Log */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="font-bold text-base text-foreground font-heading">سجل حركة الخزينة اللحظي</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">نوع الحركة</th>
                    <th className="p-2.5">المبلغ</th>
                    <th className="p-2.5">الرصيد بعد الحركة</th>
                    <th className="p-2.5">التاريخ</th>
                    {isOwnerOrAdmin && <th className="p-2.5 text-left">حذف</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {cashRegister?.cashTransactions?.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-secondary/20">
                      <td className="p-2.5 font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] ${
                            tx.type.includes("INCOME") || tx.type.includes("DEPOSIT")
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {tx.type === "SALE_INCOME"
                            ? "إيراد مبيعات POS"
                            : tx.type === "MANUAL_DEPOSIT"
                            ? "إيداع مالي يدوي"
                            : tx.type === "PURCHASE_EXPENSE"
                            ? "مشتريات وبضاعة"
                            : tx.type === "MANUAL_WITHDRAWAL"
                            ? "سحب يدوي"
                            : "سداد مصروفات"}
                        </span>
                      </td>
                      <td
                        className={`p-2.5 font-bold ${
                          tx.type.includes("INCOME") || tx.type.includes("DEPOSIT") ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-2.5 font-semibold">{formatCurrency(tx.balanceAfter)}</td>
                      <td className="p-2.5 text-muted-foreground">{formatDate(tx.createdAt)}</td>
                      {isOwnerOrAdmin && (
                        <td className="p-2.5 text-left">
                          <button
                            onClick={() => handleDeleteCashTransaction(tx.id)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="حذف هذه الحركة وتعديل رصيد الخزينة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Expenses Log */}
          <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
            <h3 className="font-bold text-base text-foreground font-heading">سجل المصروفات التشغيلية للمحل</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">فئة المصروف</th>
                    <th className="p-2.5">البيان / التفاصيل</th>
                    <th className="p-2.5">المبلغ</th>
                    <th className="p-2.5">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {expensesData.expenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-secondary/20">
                      <td className="p-2.5 font-bold text-blue-400">{exp.category?.name}</td>
                      <td className="p-2.5 text-foreground">{exp.description}</td>
                      <td className="p-2.5 font-extrabold text-rose-400">{formatCurrency(exp.amount)}</td>
                      <td className="p-2.5 text-muted-foreground">{formatDate(exp.expenseDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit / Withdraw Modal */}
      {cashModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-heading">
                {cashModal.action === "DEPOSIT" ? "إيداع مالي بالخزينة" : "سحب مالي من الخزينة"}
              </h3>
              <button onClick={() => setCashModal({ open: false, action: "DEPOSIT" })} className="text-muted-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleCashAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">المبلغ (EGP)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">السبب / البيان</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ضخ رأس مال جديد / سداد دفعة مورد"
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashModal({ open: false, action: "DEPOSIT" })}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-md ${
                    cashModal.action === "DEPOSIT" ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  تأكيد {cashModal.action === "DEPOSIT" ? "الإيداع" : "السحب"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {expenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-heading">تسجيل مصروف جديد</h3>
              <button onClick={() => setExpenseModal(false)} className="text-muted-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">فئة المصروف</label>
                <select
                  required
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground"
                >
                  <option value="">-- اختر الفئة --</option>
                  {expensesData.categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold">المبلغ (EGP)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">البيان / الوصف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة كهرباء المحل لشهر يوليو"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExpenseModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md">
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
