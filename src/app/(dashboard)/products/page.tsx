"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useLanguage } from "@/context/language-context";
import { formatCurrency, generateProductCode } from "@/lib/utils";
import {
  Laptop,
  Plus,
  Search,
  Trash2,
  PackagePlus,
  ImageIcon,
  Pencil,
} from "lucide-react";

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Add/Edit Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    cpu: "",
    ram: "",
    ssd: "",
    gpu: "",
    condition: "NEW",
    purchasePrice: 0,
    sellingPrice: 0,
    quantity: 1,
    serialNumber: "",
    barcode: "",
    imageUrl: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Stock Increment Modal State
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<any | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(1);
  const [stockReason, setStockReason] = useState<string>("تغذية مخزون - شحنة جديدة");
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [search, conditionFilter, lowStockFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `/api/products?search=${encodeURIComponent(search)}&condition=${conditionFilter}&lowStockOnly=${lowStockFilter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setFormData({
      code: generateProductCode("HP"),
      name: "",
      cpu: "Intel Core i7 11th Gen",
      ram: "16GB DDR4",
      ssd: "512GB NVMe SSD",
      gpu: "Intel Iris Xe",
      condition: "NEW",
      purchasePrice: 15000,
      sellingPrice: 19500,
      quantity: 5,
      serialNumber: "",
      barcode: "",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: any) => {
    setEditingProductId(product.id);
    setFormData({
      code: product.code,
      name: product.name,
      cpu: product.cpu || "",
      ram: product.ram || "",
      ssd: product.ssd || "",
      gpu: product.gpu || "",
      condition: product.condition || "NEW",
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      serialNumber: product.serialNumber || "",
      barcode: product.barcode || "",
      imageUrl: product.imageUrl || "",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);

    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";
      const method = editingProductId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بيانات الجهاز");

      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleOpenStockModal = (product: any) => {
    setSelectedProductForStock(product);
    setStockDelta(1);
    setStockReason("تغذية مخزون - شحنة جديدة");
    setStockModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock || stockDelta <= 0) return;

    setStockLoading(true);
    try {
      const res = await fetch(`/api/products/${selectedProductForStock.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta: stockDelta,
          reason: stockReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل تزويد كمية المخزون");

      setStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStockLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا الجهاز من المخزن؟")) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("حجم صورة الجهاز كبير جداً. يرجى اختيار صورة أقل من 5 ميجابايت.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
              <Laptop className="w-6 h-6 text-blue-500" />
              <span>{t("laptopInventory")}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              إدارة أجهزة اللاب توب، رفع الصور (ملف أو رابط)، تزويد الكميات، وضبط مواصفات العتاد (CPU, RAM, SSD, GPU).
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addProduct")}</span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-border/50 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث بكود الجهاز، اسم الجهاز، السيريال، أو المعالج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-right"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
            >
              <option value="">جميع الحالات</option>
              <option value="NEW">جديد (NEW)</option>
              <option value="USED">مستعمل (USED)</option>
              <option value="REFURBISHED">مجدد (REFURBISHED)</option>
            </select>

            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer px-3 py-2 rounded-xl bg-secondary/40 border border-border">
              <input
                type="checkbox"
                checked={lowStockFilter}
                onChange={(e) => setLowStockFilter(e.target.checked)}
                className="rounded border-border text-primary"
              />
              <span>تنبيهات نواقص المخزون</span>
            </label>
          </div>
        </div>

        {/* Products Table */}
        <div className="glass-panel rounded-2xl border border-border/50 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50">
                <tr>
                  <th className="p-3">صورة الجهاز</th>
                  <th className="p-3 font-semibold">الكود</th>
                  <th className="p-3 font-semibold">اسم موديل الجهاز</th>
                  <th className="p-3 font-semibold">المواصفات (CPU/RAM/SSD/GPU)</th>
                  <th className="p-3 font-semibold">حالة الجهاز</th>
                  <th className="p-3 font-semibold">سعر الشراء</th>
                  <th className="p-3 font-semibold">سعر البيع</th>
                  <th className="p-3 font-semibold">الكمية بالمخزن</th>
                  <th className="p-3 font-semibold text-left">الإجراءات والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      جاري تحميل الأجهزة والمخزون...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      لا توجد أجهزة مطابقة لخيارات البحث.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-2.5">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border/60 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground border border-border/40">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-bold text-blue-400">{product.code}</td>
                      <td className="p-3">
                        <p className="font-bold text-foreground">{product.name}</p>
                        {product.serialNumber && (
                          <p className="text-[10px] text-muted-foreground font-mono">S/N: {product.serialNumber}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {product.cpu && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-semibold">{product.cpu}</span>}
                          {product.ram && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-semibold">{product.ram}</span>}
                          {product.ssd && <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-semibold">{product.ssd}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            product.condition === "NEW"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : product.condition === "USED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {product.condition === "NEW" ? "جديد" : product.condition === "USED" ? "مستعمل" : "مجدد"}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-muted-foreground">{formatCurrency(product.purchasePrice)}</td>
                      <td className="p-3 font-extrabold text-foreground">{formatCurrency(product.sellingPrice)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            product.quantity <= product.lowStockThreshold
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {product.quantity} قطع
                        </span>
                      </td>
                      <td className="p-3 text-left">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Quick Stock Increment Button */}
                          <button
                            onClick={() => handleOpenStockModal(product)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1 transition-all"
                            title="تزويد كمية المخزون لهذا الجهاز"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                            <span>تزويد</span>
                          </button>

                          {/* Edit Product Button */}
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="تعديل بيانات ورابط صورة الجهاز"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Product Button */}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="حذف الجهاز"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-bold text-base text-foreground font-heading">
                {editingProductId ? "تعديل بيانات وصورة جهاز اللاب توب" : "إضافة جهاز لاب توب جديد للمخزن"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Dual Image Input: File Upload OR URL */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/40 space-y-3">
                <label className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-500" />
                  <span>صورة الجهاز (اختيار ملف صورة من جهازك أو كتابة رابط)</span>
                </label>

                <div className="flex gap-3 items-center">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-border/60 shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border/40 shrink-0">
                      <ImageIcon className="w-6 h-6 opacity-40" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground">رفع صورة مباشرة من الكمبيوتر / الموبايل:</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileSelect}
                        className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer mt-0.5"
                      />
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="أو ضع رابط صورة مباشرة https://..."
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full p-2 rounded-xl bg-background border border-border text-xs text-foreground"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">كود الجهاز المميز</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">اسم وموديل الجهاز</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: HP EliteBook 840 G8"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                  />
                </div>
              </div>

              {/* Specs Grid */}
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-3">
                <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider text-right">مواصفات العتاد والـ Hardware</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold">المعالج (CPU)</label>
                    <input
                      type="text"
                      placeholder="Core i7 1185G7"
                      value={formData.cpu}
                      onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">الرامات (RAM)</label>
                    <input
                      type="text"
                      placeholder="16GB DDR4"
                      value={formData.ram}
                      onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">الهارد الستورج (SSD)</label>
                    <input
                      type="text"
                      placeholder="512GB NVMe"
                      value={formData.ssd}
                      onChange={(e) => setFormData({ ...formData, ssd: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs text-right"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold">كارت الشاشة (GPU)</label>
                    <input
                      type="text"
                      placeholder="Intel Iris Xe"
                      value={formData.gpu}
                      onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
                      className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold">حالة الجهاز</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-foreground"
                  >
                    <option value="NEW">جديد (NEW)</option>
                    <option value="USED">مستعمل (USED)</option>
                    <option value="REFURBISHED">مجدد (REFURBISHED)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold">سعر الشراء (EGP)</label>
                  <input
                    type="number"
                    required
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">سعر البيع (EGP)</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">الكمية بالمخزن</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">السيريال نمبر S/N (اختياري)</label>
                  <input
                    type="text"
                    placeholder="5CG1493Z1P"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full mt-1 p-2 rounded-xl bg-secondary/40 border border-border text-xs text-right"
                    dir="ltr"
                  />
                </div>
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
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20"
                >
                  {saveLoading ? "جاري الحفظ..." : "حفظ بيانات الجهاز والصورة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Increment Modal */}
      {stockModalOpen && selectedProductForStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-border/50 space-y-4 shadow-2xl bg-card text-card-foreground">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-foreground font-heading">تزويد كمية الجهاز بالمخزن</h3>
              </div>
              <button onClick={() => setStockModalOpen(false)} className="text-muted-foreground">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-secondary/40 border border-border/40 space-y-1">
              <p className="text-xs font-bold text-foreground">{selectedProductForStock.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono">الكود: {selectedProductForStock.code}</p>
              <p className="text-[11px] font-bold text-blue-400 mt-1">الكمية الحالية بالمخزن: {selectedProductForStock.quantity} قطع</p>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">الكمية الإضافية المراد تزويدها (+)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={stockDelta}
                  onChange={(e) => setStockDelta(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">سبب التزويد / بيان الشحنة</label>
                <input
                  type="text"
                  required
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full mt-1 p-2.5 rounded-xl bg-secondary/40 border border-border text-xs text-foreground text-right"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={stockLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  {stockLoading ? "جاري التزويد..." : `تأكيد تزويد (+${stockDelta}) قطع`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
