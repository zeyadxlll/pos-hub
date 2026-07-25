import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SYSTEM_TENANT_ID = "SYSTEM_PLATFORM_SETTINGS";

async function ensureSystemTenant() {
  await prisma.tenant.upsert({
    where: { id: SYSTEM_TENANT_ID },
    update: {},
    create: {
      id: SYSTEM_TENANT_ID,
      name: "POS Hub Platform Settings",
      slug: "system-platform-settings",
      ownerName: "SuperAdmin",
      phone: "01000000000",
      email: "system@poshub.internal",
      address: "Platform System Core",
      status: "ACTIVE",
    },
  });
}

export async function GET() {
  try {
    await ensureSystemTenant();

    let settings = await prisma.companySettings.findUnique({
      where: { tenantId: SYSTEM_TENANT_ID },
    });

    const defaultData = {
      transferNumber: "01001234567",
      whatsappNumber: "01001234567",
      instructionNote: "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
      originalPrice: 500,
      discountPrice: 350,
      promoBanner: "🔥 عرض خاص لفترة محدودة: اشترك الآن بـ 350 ج بدلاً من 500 ج واستمتع بالمنظومة فوراً!",
    };

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          tenantId: SYSTEM_TENANT_ID,
          companyName: JSON.stringify(defaultData),
          currency: "EGP",
          thermalReceiptHeader: defaultData.transferNumber,
          thermalReceiptFooter: defaultData.whatsappNumber,
          logo: defaultData.instructionNote,
        },
      });

      return NextResponse.json(defaultData);
    }

    try {
      const parsed = JSON.parse(settings.companyName);
      return NextResponse.json({
        transferNumber: parsed.transferNumber || settings.thermalReceiptHeader || defaultData.transferNumber,
        whatsappNumber: parsed.whatsappNumber || settings.thermalReceiptFooter || defaultData.whatsappNumber,
        instructionNote: parsed.instructionNote || settings.logo || defaultData.instructionNote,
        originalPrice: Number(parsed.originalPrice || 500),
        discountPrice: Number(parsed.discountPrice || 350),
        promoBanner: parsed.promoBanner || defaultData.promoBanner,
      });
    } catch {
      return NextResponse.json({
        transferNumber: settings.thermalReceiptHeader || defaultData.transferNumber,
        whatsappNumber: settings.thermalReceiptFooter || defaultData.whatsappNumber,
        instructionNote: settings.logo || defaultData.instructionNote,
        originalPrice: 500,
        discountPrice: 350,
        promoBanner: defaultData.promoBanner,
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      transferNumber: "01001234567",
      whatsappNumber: "01001234567",
      instructionNote: "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
      originalPrice: 500,
      discountPrice: 350,
      promoBanner: "🔥 عرض خاص لفترة محدودة: اشترك الآن بـ 350 ج بدلاً من 500 ج واستمتع بالمنظومة فوراً!",
    });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  try {
    await ensureSystemTenant();
    const body = await req.json();

    const payload = {
      transferNumber: body.transferNumber || "01001234567",
      whatsappNumber: body.whatsappNumber || "01001234567",
      instructionNote: body.instructionNote || "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
      originalPrice: Number(body.originalPrice || 500),
      discountPrice: Number(body.discountPrice || 350),
      promoBanner: body.promoBanner || "🔥 عرض خاص لفترة محدودة: اشترك الآن بـ 350 ج بدلاً من 500 ج!",
    };

    const jsonString = JSON.stringify(payload);

    const updated = await prisma.companySettings.upsert({
      where: { tenantId: SYSTEM_TENANT_ID },
      update: {
        companyName: jsonString,
        thermalReceiptHeader: payload.transferNumber,
        thermalReceiptFooter: payload.whatsappNumber,
        logo: payload.instructionNote,
      },
      create: {
        tenantId: SYSTEM_TENANT_ID,
        companyName: jsonString,
        currency: "EGP",
        thermalReceiptHeader: payload.transferNumber,
        thermalReceiptFooter: payload.whatsappNumber,
        logo: payload.instructionNote,
      },
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
