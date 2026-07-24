"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { Settings, Save, CheckCircle, Wallet, Users, UserPlus, Trash2, ShieldCheck, Lock, Key, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    companyName: "",
    logo: "",
    currency: "EGP",
    taxRate: 0,
    autoCashDeduction: true,
    thermalReceiptHeader: "TechZone Laptops - El Bustan Center Cairo",
    thermalReceiptFooter: "ضمان 3 شهور ضد عيوب الصناعة • استبدال الجهاز فقط لمدة أسبوعين • لا يوجد ترجيع جهاز",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Own Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [myNewPassword, setMyNewPassword] = useState("");
  const [myPassLoading, setMyPassLoading] = useState(false);
  const [myPassMsg, setMyPassMsg] = useState<string | null>(null);

  // Staff Creation Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffData, setStaffData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CASHIER",
  });
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Staff Password Reset Modal State
  const [resetStaffModalOpen, setResetStaffModalOpen] = useState(false);
  const [selectedStaffUser, setSelectedStaffUser] = useState<any | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [resetPassLoading, setResetPassLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error("فشل حفظ الإعدادات");

      setMsg("تم تحديث إعدادات الشركة والفواتير وشروط الضمان بنجاح!");
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMyPassLoading(true);
    setMyPassMsg(null);

    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword: myNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تغيير كلمة السر");

      setMyPassMsg("تم تغيير كلمة السر الخاصة بك بنجاح!");
      setCurrentPassword("");
      setMyNewPassword("");
    } catch (err: any) {
      setMyPassMsg(err.message);
    } finally {
      setMyPassLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoading(true);
    setStaffError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء حساب الموظف");

      setStaffModalOpen(false);
      setStaffData({ name: "", email: "", phone: "", password: "", role: "CASHIER" });
      fetchUsers();
    } catch (err: any) {
      setStaffError(err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleResetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffUser || !newStaffPassword) return;

    setResetPassLoading(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedStaffUser.id,
          newPassword: newStaffPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تغيير كلمة سر الموظف");

      alert(`تم تغيير كلمة سر الموظف (${selectedStaffUser.name}) بنجاح!`);
      setResetStaffModalOpen(false);
      setNewStaffPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResetPassLoading(false);
    }
  };

  const handleDeleteStaff = async (userId: string) => {
    if (!confirm("هل أنت تأكد من حذف حساب هذا الموظف؟ لن يتمكن من تسجيل الدخول بعد الآن.")) return;

    try {
      const res = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حذف الموظف");

      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            <span>{t("companySettings")}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ضبط الهوية التجارية للمحل، تغيير كلمات السر، وإدارة حسابات موظفي السيلز والكاشير وتحديد صلاحياتهم.
          </p>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{msg}</span>
          </div>
        )}

        {/* Section 1: Change My Own Password */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base text-foreground font-heading">تغيير كلمة المرور الحالية لحسابك</h3>
          </div>

          {myPassMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{myPassMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangeMyPassword} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold">كلمة المرور الحالية</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">كلمة المرور الجديدة</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={myNewPassword}
                onChange={(e) => setMyNewPassword(e.target.value)}
                className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                dir="ltr"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={myPassLoading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                {myPassLoading ? "جاري التحديث..." : "تحديث كلمة السر الخاصة بي"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Staff & Employee Accounts Management */}
        <div className="glass-panel p-6 rounded-2xl border border-border/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div>
              <h3 className="font-bold text-base text-foreground font-heading flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>إدارة موظفي السيلز والكاشير وتغيير كلمات السر لهم</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                إضافة موظفين، تغيير كلمات السر الخاصة بالسيلز، وتحديد الصلاحيات المتاحة لهم بالمنظومة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStaffModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة حساب موظف / سيلز جديد</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">البريد الإلكتروني للوجين</th>
                  <th className="p-3">رقم الهاتف</th>
                  <th className="p-3">الصلاحية ودور النظام</th>
                  <th className="p-3 text-left">تغيير كلمة السر والحذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/20">
                    <td className="p-3 font-bold text-foreground">{u.name}</td>
                    <td className="p-3 font-mono text-muted-foreground">{u.email}</td>
                    <td className="p-3 text-blue-400">{u.phone || "-"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "OWNER" || u.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {u.role === "OWNER" ? "صاحب المحل / المالك" : u.role === "CASHIER" ? "كاشير / سيلز (محدود)" : u.role}
                      </span>
                    </td>
                    <td className="p-3 text-left">
                      {u.role !== "OWNER" && (
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => {
                              setSelectedStaffUser(u);
                              setNewStaffPassword("");
                              setResetStaffModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-[11px] border border-amber-500/20 flex items-center gap-1 transition-all"
                            title="تغيير كلمة سر هذا الموظف"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>تغير الباسورد</span>
                          </button>

                          <button
                            onClick={() => handleDeleteStaff(u.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="حذف حساب الموظف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Store Branding & Settings Form */}
        <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-border/50 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground font-heading border-b border-border/40 pb-2">الهوية التجارية وشعار المحل</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold">اسم المحل / الشركة الظاهر بالفاتورة</label>
                <input
                  type="text"
                  required
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">رابط صورة اللوجو (Logo URL)</label>
                <input
                  type="text"
                  placeholder="https://cloudinary.com/logo.png"
                  value={settings.logo || ""}
                  onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-blue-400 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-blue-500" />
                  <span>خاصية الخصم التلقائي من الخزينة (Auto Cash Deduction Option)</span>
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  عند تفعيل هذا الخيار، سيتم خصم قيمة أي فواتير شراء أجهزة أو مصروفات من رصيد الخزينة الرئيسية تلقائياً.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoCashDeduction}
                onChange={(e) => setSettings({ ...settings, autoCashDeduction: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground font-heading border-b border-border/40 pb-2">العملة والضرائب</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold">رمز العملة (مثال: EGP)</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">نسبة ضريبة المبيعات (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-foreground font-heading border-b border-border/40 pb-2">نصوص الفاتورة الحرارية وشروط الضمان</h3>
            <div>
              <label className="text-xs font-semibold">نص ترويسة أعلى الفاتورة (Header)</label>
              <input
                type="text"
                value={settings.thermalReceiptHeader || ""}
                onChange={(e) => setSettings({ ...settings, thermalReceiptHeader: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">نص شروط الضمان والاستبدال بالفاتورة (Footer)</label>
              <textarea
                rows={2}
                value={settings.thermalReceiptFooter || ""}
                onChange={(e) => setSettings({ ...settings, thermalReceiptFooter: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "جاري الحفظ..." : "حفظ الإعدادات وشروط الضمان"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Create Staff User Modal */}
      {staffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-heading">إضافة حساب موظف / سيلز جديد</h3>
              <button onClick={() => setStaffModalOpen(false)} className="text-muted-foreground">
                ✕
              </button>
            </div>

            {staffError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {staffError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>هذا الحساب سيتيح للموظف الوصول لشاشة الكاشير (POS) ومخزون الأجهزة فقط وسيحظر عنه الخزينة والتقارير والاشتراكات.</span>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">اسم الموظف / السيلز</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود"
                  value={staffData.name}
                  onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">البريد الإلكتروني لتسجيل الدخول</label>
                <input
                  type="email"
                  required
                  placeholder="ahmed@store.com"
                  value={staffData.email}
                  onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                  dir="ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">رقم الهاتف</label>
                  <input
                    type="text"
                    placeholder="01012345678"
                    value={staffData.phone}
                    onChange={(e) => setStaffData({ ...staffData, phone: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">كلمة المرور الحماية</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={staffData.password}
                    onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">دور الحساب بالمنظومة</label>
                <select
                  value={staffData.role}
                  onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground"
                >
                  <option value="CASHIER">كاشير وسيلز (صلاحية الكاشير والمخزون فقط)</option>
                  <option value="SALES">مسؤول مبيعات (صلاحية الكاشير والمخزون فقط)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={staffLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md"
                >
                  {staffLoading ? "جاري الإنشاء..." : "إنشاء حساب الموظف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Staff Password Modal */}
      {resetStaffModalOpen && selectedStaffUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-foreground font-heading">تغير باسورد الموظف السيلز</h3>
              </div>
              <button onClick={() => setResetStaffModalOpen(false)} className="text-muted-foreground">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
              <p className="text-xs font-bold text-foreground">الموظف: {selectedStaffUser.name}</p>
              <p className="text-[11px] font-mono text-muted-foreground">{selectedStaffUser.email}</p>
            </div>

            <form onSubmit={handleResetStaffPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">كلمة المرور الجديدة للموظف</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={resetPassLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md"
                >
                  {resetPassLoading ? "جاري التحديث..." : "حفظ الباسورد الجديد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
