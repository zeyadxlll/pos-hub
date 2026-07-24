import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinanceService } from "@/services/finance-service";
import { ExpenseSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [expenses, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { tenantId: session.user.tenantId },
      include: { category: true, createdByUser: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.expenseCategory.findMany({
      where: { tenantId: session.user.tenantId },
    }),
  ]);

  return NextResponse.json({ expenses, categories });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = ExpenseSchema.parse(body);
    const expense = await FinanceService.createExpense(session.user.tenantId, session.user.id, validated);
    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
