import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/services/admin-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  const receipts = await prisma.paymentReceipt.findMany({
    include: { tenant: { select: { name: true, ownerName: true, email: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(receipts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN" || !session?.user?.id) {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  try {
    const { receiptId, action, rejectionReason } = await req.json();
    const result = await AdminService.reviewPaymentReceipt(receiptId, action, rejectionReason, session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
