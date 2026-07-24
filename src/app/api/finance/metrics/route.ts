import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinanceService } from "@/services/finance-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await FinanceService.getDashboardMetrics(session.user.tenantId);
  return NextResponse.json(metrics);
}
