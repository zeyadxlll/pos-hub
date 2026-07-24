import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TenantService } from "@/services/tenant-service";
import { PaymentReceiptSubmissionSchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = PaymentReceiptSubmissionSchema.parse(body);
    const receipt = await TenantService.submitPaymentReceipt(session.user.tenantId, validated);
    return NextResponse.json({ success: true, receipt }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit receipt" }, { status: 400 });
  }
}
