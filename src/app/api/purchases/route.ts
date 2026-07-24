import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PurchaseService } from "@/services/purchase-service";
import { PurchaseOrderSchema } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchases = await PurchaseService.getPurchases(session.user.tenantId);
  return NextResponse.json(purchases);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = PurchaseOrderSchema.parse(body);
    const order = await PurchaseService.createPurchaseOrder(session.user.tenantId, session.user.id, validated);
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create purchase order" }, { status: 400 });
  }
}
