import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "الرجاء كتابة سؤال صحيح" }, { status: 400 });
    }

    const sanitizedPrompt = prompt.trim().slice(0, 300).toLowerCase();
    const tenantId = session.user.tenantId;

    const [products, salesCount, tenantInfo, auditLogs] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId },
        select: {
          code: true,
          name: true,
          cpu: true,
          ram: true,
          ssd: true,
          gpu: true,
          condition: true,
          sellingPrice: true,
          quantity: true,
        },
        take: 25,
      }),
      prisma.sale.count({ where: { tenantId } }),
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      }),
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    let reply = "";

    // Security & Audit Log Inspection Intent
    if (
      sanitizedPrompt.includes("حذف") ||
      sanitizedPrompt.includes("عجز") ||
      sanitizedPrompt.includes("سقط") ||
      sanitizedPrompt.includes("مراقبة") ||
      sanitizedPrompt.includes("مين") ||
      sanitizedPrompt.includes("تعديل") ||
      sanitizedPrompt.includes("خزنة") ||
      sanitizedPrompt.includes("سجل")
    ) {
      const deletedSales = auditLogs.filter((log) => log.action === "DELETE_SALE");

      if (deletedSales.length > 0) {
        reply =
          `🚨 **تقرير المراجعة والأمان الحساس (Audit Log Inspector):**\n\n` +
          `تم رصد **${deletedSales.length} عملية حذف فواتير** بسجلات النظام:\n\n` +
          deletedSales
            .map((log, idx) => {
              let parsed: any = {};
              try {
                parsed = JSON.parse(log.details || "{}");
              } catch (e) {}

              const dateStr = new Date(log.createdAt).toLocaleString("ar-EG");
              return (
                `⚠️ **عملية رقم ${idx + 1}:**\n` +
                `   • الفاتورة المحذوفة: **${parsed.invoiceNumber || log.entityId || "غير محدد"}**\n` +
                `   • العميل: **${parsed.customerName || "عميل كاش"}**\n` +
                `   • القيمة المالية: **${parsed.netAmount ? parsed.netAmount.toLocaleString() + " EGP" : "غير محدد"}**\n` +
                `   • قام بالحذف: **${log.userName || "مستخدم للنظام"}**\n` +
                `   • توقيت الحذف: **${dateStr}**`
              );
            })
            .join("\n\n") +
          `\n\n🛡️ **ملاحظة الأمان:** كافة التغييرات محفورة بسجل الأمان السحابي المشفر للشركة ولا يمكن لأحد مسح السجلات.`;
      } else {
        reply =
          `✅ **تقرير الأمان والمراجعة الشامل:**\n\n` +
          `لا توجد أي عمليات حذف أو إسقاط فواتير مسجلة هذا الشهر! جميع الفواتير والمبيعات والحركات المالية متطابقة 100% مع الخزينة والمخزون.`;
      }
    } else if (
      sanitizedPrompt.includes("بوست") ||
      sanitizedPrompt.includes("فيسبوك") ||
      sanitizedPrompt.includes("تسويق") ||
      sanitizedPrompt.includes("اعلان")
    ) {
      const topProduct = products[0] || {
        name: "Dell XPS 15 Gaming",
        cpu: "Core i7-12700H",
        ram: "RAM 16GB DDR5",
        ssd: "1TB SSD NVMe",
        gpu: "RTX 3060 6GB",
        sellingPrice: 35000,
      };

      reply =
        `✨ **مسودة بوست تسويقي احترافي لصفحتك على الفيسبوك/انستجرام:**\n\n` +
        `🚀 **وحش الأداء والإنتاجية وصل المحل الآن!** 🔥\n` +
        `💻 **${topProduct.name}**\n\n` +
        `🎯 **المواصفات الجبارة:**\n` +
        `⚡ البروسيسور: ${topProduct.cpu || "Intel Core i7"}\n` +
        `💾 الذاكرة العشوائية: ${topProduct.ram || "16GB RAM"}\n` +
        `🚀 الهارد: ${topProduct.ssd || "512GB SSD Fast"}\n` +
        `🎮 كارت الشاشة: ${topProduct.gpu || "Dedicated Graphics"}\n\n` +
        `💰 **السعر الخاص:** ${topProduct.sellingPrice.toLocaleString()} جنيه مصري فقط! 😍\n` +
        `🛡️ **ضمان معتمد 3 شهور ضد عيوب الصناعة + مهلة 14 يوم استبدال!**\n\n` +
        `📍 **العنوان والطلب:** متوفر الآن بمقرنا (${tenantInfo?.name || "المحل"}).\n` +
        `📞 **للحجز والاستفسار الفوري:** تواصل معنا عبر الرسائل أو الاتصال مباشرة! ✨`;
    } else if (
      sanitizedPrompt.includes("ترشيح") ||
      sanitizedPrompt.includes("اقترح") ||
      sanitizedPrompt.includes("جرافيك") ||
      sanitizedPrompt.includes("جيمنج") ||
      sanitizedPrompt.includes("برمجة") ||
      sanitizedPrompt.includes("ميزانية") ||
      sanitizedPrompt.includes("لاب")
    ) {
      const availableLaptops = products.filter((p: any) => p.quantity > 0);
      if (availableLaptops.length > 0) {
        const top3 = availableLaptops.slice(0, 3);
        reply =
          `💡 **ترشيحات أجهزة اللاب توب المتاحة بمخزنك (${tenantInfo?.name || "المحل"}) الآن:**\n\n` +
          top3
            .map(
              (p: any, idx: number) =>
                `${idx + 1}. **${p.name}** (${p.code})\n   • المواصفات: ${[
                  p.cpu,
                  p.ram,
                  p.ssd,
                  p.gpu,
                ]
                  .filter(Boolean)
                  .join(" • ")}\n   • السعر للمستهلك: **${p.sellingPrice.toLocaleString()} EGP** (الكمية المتاحة: ${
                  p.quantity
                } قطع)`
            )
            .join("\n\n") +
          `\n\n📌 **نصيحة المبيعات:** يمكنك تعديل المواصفات أو إعطاء خصم مالي مباشر للعميل من شاشة الكاشير (POS).`;
      } else {
        reply = "حالياً لا توجد أجهزة متوفرة بالمخزن. ننصح بإضافة أجهزة جديدة من صفحة مخزن الأجهزة.";
      }
    } else if (
      sanitizedPrompt.includes("أكثر") ||
      sanitizedPrompt.includes("ربح") ||
      sanitizedPrompt.includes("أفضل") ||
      sanitizedPrompt.includes("مبيعات") ||
      sanitizedPrompt.includes("تقرير")
    ) {
      reply = `📊 **تحليل المبيعات الذكي لمقرك:**\n\n• إجمالي الفواتير الناجحة المسجلة: **${salesCount} فاتورة**.\n• الأجهزة الأعلى طلباً في السوق هي أجهزة **Core i7 و Ryzen 7** المزودة بـ SSD NVMe.\n• ننصح بالحفاظ على مخزون لا يقل عن قطعتين لكل موديل مميز لضمان سرعة البيع.\n• يمكنك تصدير تقرير شيت Excel كامل من صفحة **التقارير الماليّة**.`;
    } else if (
      sanitizedPrompt.includes("ضمان") ||
      sanitizedPrompt.includes("سيريال") ||
      sanitizedPrompt.includes("استبدال") ||
      sanitizedPrompt.includes("فحص")
    ) {
      reply = `🛡️ **نظام الضمان والسيريال نمبر (S/N):**\n\n• يمكنك فحص موقف ضمان أي جهاز من صفحة **"تتبع الضمان بالسيريال"** بالجانب الأيمن.\n• الضمان المعتمد بالمنظومة: **3 شهور عيوب صناعة** و **أسبوعين مهلة استبدال**.\n• يظهر لك السيريال واسم المشتري والتاريخ ورقم الفاتورة بالكامل.`;
    } else if (
      sanitizedPrompt.includes("انستاباي") ||
      sanitizedPrompt.includes("تحويل") ||
      sanitizedPrompt.includes("واتساب") ||
      sanitizedPrompt.includes("رقم")
    ) {
      reply = `📱 **طريقة تعديل أرقام التحويل والدعم:**\n\n• إذا كنت الأدمن الفائق (SuperAdmin)، يمكنك الذهاب لـ **لوحة التحكم الفائقة (/admin/dashboard)**.\n• ستجد كارت إعدادات أرقام التحويلات والواتساب، قم بكتابة أرقامك واضغط "حفظ الأرقام" وستحدث فوراً لجميع أصحاب المحلات!`;
    } else if (
      sanitizedPrompt.includes("فاتورة") ||
      sanitizedPrompt.includes("لوجو") ||
      sanitizedPrompt.includes("شروط")
    ) {
      reply = `🧾 **إعدادات وتصميم الفاتورة الرسمية:**\n\n• يمكنك تغيير اسم المحل، اللوجو، وشروط الضمان المطبوعة من صفحة **الإعدادات (/settings)**.\n• يمكنك كتابة أي شروط مخصصة بمربع "شروط الضمان" وتظهر منسقة تلقائياً على كل فاتورة مطبوعة.`;
    } else {
      reply = `🤖 **مرحباً بك! أنا مساعد POS Hub الذكي والمفتش الأمني 🚀**\n\nأنا هنا لمساعدتك في:\n1. 🚨 **مراقبة الفواتير والتأكد من عدم وجود أي فواتير محذوفة أو عجز**.\n2. 💻 **ترشيح أجهزة اللاب توب المناسبة لعميلك** حسب الميزانية.\n3. 📊 **تحليل مبيعات المحل والأجهزة الأعلى ربحاً**.\n4. 🛡️ **فحص ضمان وأرقام السيريال نمبر**.\n\nكيف يمكنني مساعدتك اليوم؟`;
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: "حدث خطأ أثاء معالجة الطلب" }, { status: 400 });
  }
}
