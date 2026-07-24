import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TenantService } from "@/services/tenant-service";
import { LicenseKeySchema } from "@/lib/validations";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { key } = LicenseKeySchema.parse(body);
    const subscription = await TenantService.activateViaLicenseKey(session.user.tenantId, key);
    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid license key" }, { status: 400 });
  }
}
