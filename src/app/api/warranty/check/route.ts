import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const serial = searchParams.get("serial")?.trim();

  if (!serial) {
    return NextResponse.json({ error: "Serial number required" }, { status: 400 });
  }

  try {
    // Search in SaleItems created under this tenant
    const saleItem = await prisma.saleItem.findFirst({
      where: {
        sale: { tenantId: session.user.tenantId },
        OR: [
          { serialNumber: { equals: serial } },
          { product: { serialNumber: { equals: serial } } },
          { serialNumber: { contains: serial } },
        ],
      },
      include: {
        sale: {
          include: {
            customer: true,
            createdByUser: true,
            tenant: { include: { settings: true } },
          },
        },
        product: true,
      },
      orderBy: { sale: { createdAt: "desc" } },
    });

    if (!saleItem) {
      return NextResponse.json({ found: false, message: "لم يتم العثور على أي فاتورة مبيعات بهذا السيريال نمبر في المحل." });
    }

    const saleDate = new Date(saleItem.sale.createdAt);
    const now = new Date();

    // 90 Days Warranty
    const warrantyExpiry = new Date(saleDate);
    warrantyExpiry.setDate(warrantyExpiry.getDate() + 90);
    const isWarrantyValid = now <= warrantyExpiry;
    const remainingWarrantyDays = Math.max(0, Math.ceil((warrantyExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // 14 Days Replacement
    const replacementExpiry = new Date(saleDate);
    replacementExpiry.setDate(replacementExpiry.getDate() + 14);
    const isReplacementValid = now <= replacementExpiry;
    const remainingReplacementDays = Math.max(0, Math.ceil((replacementExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return NextResponse.json({
      found: true,
      saleItem: {
        id: saleItem.id,
        serialNumber: saleItem.serialNumber || saleItem.product.serialNumber || serial,
        customSpecs: saleItem.customSpecs,
        unitPrice: saleItem.unitPrice,
        quantity: saleItem.quantity,
        subtotal: saleItem.subtotal,
        product: {
          code: saleItem.product.code,
          name: saleItem.product.name,
          cpu: saleItem.product.cpu,
          ram: saleItem.product.ram,
          ssd: saleItem.product.ssd,
          gpu: saleItem.product.gpu,
          condition: saleItem.product.condition,
          imageUrl: saleItem.product.imageUrl,
        },
        sale: {
          invoiceNumber: saleItem.sale.invoiceNumber,
          createdAt: saleItem.sale.createdAt,
          salespersonName: saleItem.sale.salespersonName || saleItem.sale.createdByUser?.name || "السيلز",
          paymentMethod: saleItem.sale.paymentMethod,
          customer: saleItem.sale.customer,
        },
      },
      warrantyStatus: {
        isWarrantyValid,
        remainingWarrantyDays,
        warrantyExpiryDate: warrantyExpiry,
        isReplacementValid,
        remainingReplacementDays,
        replacementExpiryDate: replacementExpiry,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
