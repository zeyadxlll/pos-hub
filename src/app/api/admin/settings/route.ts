import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SYSTEM_TENANT_ID = "SYSTEM_PLATFORM_SETTINGS";

export async function GET() {
  try {
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
