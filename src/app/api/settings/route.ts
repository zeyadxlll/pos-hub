import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let settings = await prisma.companySettings.findUnique({
    where: { tenantId: session.user.tenantId },
  });

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        tenantId: session.user.tenantId,
        companyName: session.user.tenantName || "Laptop Store",
        currency: "EGP",
        taxRate: 0.0,
        autoCashDeduction: true,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.companySettings.upsert({
      where: { tenantId: session.user.tenantId },
      update: {
        companyName: body.companyName,
        logo: body.logo || null,
        currency: body.currency || "EGP",
        taxRate: Number(body.taxRate || 0),
        autoCashDeduction: Boolean(body.autoCashDeduction),
        thermalReceiptHeader: body.thermalReceiptHeader || null,
        thermalReceiptFooter: body.thermalReceiptFooter || null,
      },
      create: {
        tenantId: session.user.tenantId,
        companyName: body.companyName,
        logo: body.logo || null,
        currency: body.currency || "EGP",
        taxRate: Number(body.taxRate || 0),
        autoCashDeduction: Boolean(body.autoCashDeduction),
        thermalReceiptHeader: body.thermalReceiptHeader || null,
        thermalReceiptFooter: body.thermalReceiptFooter || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
