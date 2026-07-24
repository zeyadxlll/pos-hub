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
