import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinanceService } from "@/services/finance-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const register = await FinanceService.getCashRegister(session.user.tenantId);
  return NextResponse.json(register);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, amount, notes } = body;

    if (action === "DEPOSIT") {
      const tx = await FinanceService.depositCash(session.user.tenantId, session.user.id, Number(amount), notes);
      return NextResponse.json(tx);
    } else if (action === "WITHDRAW") {
      const tx = await FinanceService.withdrawCash(session.user.tenantId, session.user.id, Number(amount), notes);
      return NextResponse.json(tx);
    } else {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "OWNER" && role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Only company owner can delete cash safe movements." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    const res = await FinanceService.deleteTransaction(session.user.tenantId, session.user.id, transactionId);
    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
