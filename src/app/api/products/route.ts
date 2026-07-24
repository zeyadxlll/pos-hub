import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InventoryService } from "@/services/inventory-service";
import { ProductSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const brandId = searchParams.get("brandId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const condition = (searchParams.get("condition") as any) || undefined;
  const lowStockOnly = searchParams.get("lowStockOnly") === "true";
  const page = parseInt(searchParams.get("page") || "1");

  const data = await InventoryService.getProducts(session.user.tenantId, {
    search,
    brandId,
    categoryId,
    condition,
    lowStockOnly,
    page,
  });

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = ProductSchema.parse(body);
    const product = await InventoryService.createProduct(session.user.tenantId, validated, session.user.id);
    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Invalid product data" }, { status: 400 });
  }
}
