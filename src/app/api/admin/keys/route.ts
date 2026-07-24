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

  const keys = await prisma.subscriptionKey.findMany({
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json(keys);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN" || !session?.user?.id) {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  try {
    const { planType, durationDays } = await req.json();
    const key = await AdminService.generateLicenseKey(planType, Number(durationDays), session.user.id);
    return NextResponse.json(key, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "SUPER_ADMIN" || !session?.user?.id) {
    return NextResponse.json({ error: "Access denied. SuperAdmin required." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const keyId = searchParams.get("keyId");

  if (!keyId) {
    return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
  }

  try {
    await prisma.subscriptionKey.delete({
      where: { id: keyId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
