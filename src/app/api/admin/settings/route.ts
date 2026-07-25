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

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          tenantId: SYSTEM_TENANT_ID,
          companyName: "POS Hub Payment Platform",
          currency: "EGP",
          thermalReceiptHeader: "01001234567", // Transfer Number (Vodafone Cash / Instapay)
          thermalReceiptFooter: "01001234567", // WhatsApp Support Number
          logo: "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً", // Instruction note
        },
      });
    }

    return NextResponse.json({
      transferNumber: settings.thermalReceiptHeader || "01001234567",
      whatsappNumber: settings.thermalReceiptFooter || "01001234567",
      instructionNote: settings.logo || "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
    });
  } catch (error: any) {
    return NextResponse.json({
      transferNumber: "01001234567",
      whatsappNumber: "01001234567",
      instructionNote: "بعد تحويل المبلغ يرجى إرسال صورة إشعار التحويل على رقم الواتساب لفتح النظام فوراً",
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
    const { transferNumber, whatsappNumber, instructionNote } = await req.json();

    const updated = await prisma.companySettings.upsert({
      where: { tenantId: SYSTEM_TENANT_ID },
      update: {
        thermalReceiptHeader: transferNumber,
        thermalReceiptFooter: whatsappNumber,
        logo: instructionNote,
      },
      create: {
        tenantId: SYSTEM_TENANT_ID,
        companyName: "POS Hub Payment Platform",
        currency: "EGP",
        thermalReceiptHeader: transferNumber,
        thermalReceiptFooter: whatsappNumber,
        logo: instructionNote,
      },
    });

    return NextResponse.json({
      transferNumber: updated.thermalReceiptHeader,
      whatsappNumber: updated.thermalReceiptFooter,
      instructionNote: updated.logo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
