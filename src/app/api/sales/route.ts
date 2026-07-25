import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { POSService } from "@/services/pos-service";
import { SaleCheckoutSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sales = await prisma.sale.findMany({
    where: { tenantId: session.user.tenantId },
    include: {
      customer: true,
      createdByUser: true,
      items: { include: { product: true } },
      invoice: true,
      tenant: { include: { settings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = SaleCheckoutSchema.parse(body);
    const result = await POSService.checkout(session.user.tenantId, session.user.id, validated);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process sale checkout" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const saleId = searchParams.get("saleId");

  if (!saleId) {
    return NextResponse.json({ error: "Sale ID is required" }, { status: 400 });
  }

  try {
    const sale = await prisma.sale.findFirst({
      where: { id: saleId, tenantId: session.user.tenantId },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Write Audit Log Snapshot BEFORE deleting
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        userName: session.user.name || "السيلز / الأدمن",
        action: "DELETE_SALE",
        entity: "Sale",
        entityId: sale.id,
        details: JSON.stringify({
          invoiceNumber: sale.invoiceNumber,
          customerName: sale.customer?.name || "عميل كاش",
          customerPhone: sale.customer?.phone || "-",
          netAmount: sale.netAmount,
          profitAmount: sale.profitAmount,
          salespersonName: sale.salespersonName || "الكاشير",
          deletedAt: new Date().toISOString(),
          items: sale.items.map((i) => ({
            productName: i.product.name,
            serialNumber: i.serialNumber || i.product.serialNumber,
            unitPrice: i.unitPrice,
            customSpecs: i.customSpecs,
          })),
        }),
      },
    });

    // Delete sale
    await prisma.sale.delete({ where: { id: sale.id } });

    return NextResponse.json({ success: true, message: "تم إلغاء وحذف الفاتورة وتسجيل العملية بسجل الأمان." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
