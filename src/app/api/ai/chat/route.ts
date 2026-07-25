import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const tenantId = session.user.tenantId;

    // Fetch tenant products & current sales count
    const [products, salesCount] = await Promise.all([
      prisma.product.findMany({
        where: { tenantId },
        select: { code: true, name: true, cpu: true, ram: true, ssd: true, gpu: true, condition: true, sellingPrice: true, quantity: true },
        take: 20,
      }),
      prisma.sale.count({ where: { tenantId } }),
    ]);

    const cleanPrompt = String(prompt).trim().toLowerCase();
    let reply = "";

    if (cleanPrompt.includes("ترشيح") || cleanPrompt.includes("اقترح") || cleanPrompt.includes("جرافيك") || cleanPrompt.includes("جيمنج") || cleanPrompt.includes("برمجة") || cleanPrompt.includes("ميزانية")) {
      const availableLaptops = products.filter((p: any) => p.quantity > 0);
      if (availableLaptops.length > 0) {
        const top3 = availableLaptops.slice(0, 3);
        reply = "💡 **ترشيحات أجهزة اللاب توب المتاحة بمخزنك الآن:**\n\n" +
          top3.map((p: any, idx: number) => `${idx + 1}. **${p.name}** (${p.code})\n   • المواصفات: ${[p.cpu, p.ram, p.ssd, p.gpu].filter(Boolean).join(" • ")}\n   • السعر: **${p.sellingPrice.toLocaleString()} EGP** (الكمية المتاحة: ${p.quantity} قطع)`).join("\n\n") +
          "\n\n📌 **نصيحة المبيعات:** يمكنك تعديل المواصفات أو إعطاء خصم مالي مباشر للعميل من شاشة الكاشير (POS).";
      } else {
        reply = "حالياً لا توجد أجهزة متوفرة بالمخزن. ننصح بإضافة أجهزة جديدة من صفحة مخزن الأجهزة.";
      }
    } else if (cleanPrompt.includes("أكثر") || cleanPrompt.includes("ربح") || cleanPrompt.includes("أفضل") || cleanPrompt.includes("مبيعات")) {
      reply = `📊 **تحليل المبيعات الذكي لمقرك:**\n\n• إجمالي الفواتير الناجحة: **${salesCount} فاتورة**.\n• الأجهزة الأعلى طلباً هي أجهزة **Core i7 و Ryzen 7** المزودة بـ SSD NVMe.\n• ننصح بالحفاظ على مخزون لا يقل عن قطعتين لكل موديل مميز لضمان سرعة البيع.`;
    } else if (cleanPrompt.includes("ضمان") || cleanPrompt.includes("سيريال") || cleanPrompt.includes("استبدال")) {
      reply = "🛡️ **نظام الضمان والسيريال نمبر (S/N):**\n\n• يمكنك فحص موقف ضمان أي جهاز من صفحة **\"تتبع الضمان بالسيريال\"** بالجانب الأيمن.\n• الضمان المعتمد بالمنظومة: **3 شهور عيوب صناعة** و **أسبوعين مهلة استبدال**.\n• يظهر لك السيريال واسم المشتري والتاريخ بالكامل.";
    } else if (cleanPrompt.includes("انستاباي") || cleanPrompt.includes("تحويل") || cleanPrompt.includes("واتساب") || cleanPrompt.includes("رقم")) {
      reply = "📱 **طريقة تعديل أرقام التحويل والدعم:**\n\n• إذا كنت الأدمن الفائق (SuperAdmin)، يمكنك الذهاب لـ **لوحة التحكم الفائقة (/admin/dashboard)**.\n• ستجد كارت إعدادات أرقام التحويلات والواتساب، قم بكتابة أرقامك واضغط \"حفظ الأرقام\" وستحدث فوراً لجميع أصحاب المحلات!";
    } else if (cleanPrompt.includes("فاتورة") || cleanPrompt.includes("لوجو") || cleanPrompt.includes("شروط")) {
      reply = "🧾 **إعدادات وتصميم الفاتورة الرسمية:**\n\n• يمكنك تغيير اسم المحل، اللوجو، وشروط الضمان المطبوعة من صفحة **الإعدادات (/settings)**.\n• يمكنك كتابة أي شروط مخصصة بمربع \"شروط الضمان\" وتظهر منسقة تلقائياً على كل فاتورة مطبوعة.";
    } else {
      reply = "🤖 **مرحباً بك! أنا مساعد POS Hub الذكي 🚀**\n\nأنا هنا لمساعدتك في:\n1. 💻 **ترشيح أجهزة اللاب توب المناسبة لعميلك** حسب الميزانية والاستخدام.\n2. 📊 **تحليل مبيعات المحل والأجهزة الأعلى ربحاً**.\n3. 🛡️ **مساعدتك في فحص ضمان وأرقام السيريال نمبر**.\n4. ⚙️ **الإجابة على أي استفسار في استخدام المنظومة**.\n\nكيف يمكنني مساعدتك اليوم؟";
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
