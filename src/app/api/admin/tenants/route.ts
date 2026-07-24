import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/services/admin-service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  const tenants = await AdminService.getAllTenants();
  return NextResponse.json(tenants);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN" || !session?.user?.id) {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  try {
    const { tenantId, status } = await req.json();
    const updated = await AdminService.toggleTenantStatus(tenantId, status, session.user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
