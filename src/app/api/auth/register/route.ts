import { NextResponse } from "next/server";
import { RegisterCompanySchema } from "@/lib/validations";
import { TenantService } from "@/services/tenant-service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = RegisterCompanySchema.parse(body);

    const result = await TenantService.registerCompany(validatedData);
    return NextResponse.json({ success: true, tenant: result.tenant }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to register company" },
      { status: 400 }
    );
  }
}
