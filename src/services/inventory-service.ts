import { prisma } from "@/lib/prisma";
import { ProductInput } from "@/lib/validations";
import { AuditService } from "./audit-service";

export interface ProductFilterParams {
  search?: string;
  brandId?: string;
  categoryId?: string;
  condition?: string;
  lowStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export class InventoryService {
  static async getProducts(tenantId: string, params: ProductFilterParams) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (params.search) {
      const query = params.search.trim();
      where.OR = [
        { name: { contains: query } },
        { code: { contains: query } },
        { serialNumber: { contains: query } },
        { barcode: { contains: query } },
        { cpu: { contains: query } },
        { ram: { contains: query } },
      ];
    }

    if (params.brandId) where.brandId = params.brandId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.condition) where.condition = params.condition;

    if (params.lowStockOnly) {
      where.quantity = { lte: 2 };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { brand: true, category: true, supplier: true },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getProductById(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { brand: true, category: true, supplier: true, stockMovements: { take: 20, orderBy: { createdAt: "desc" } } },
    });
    if (!product) throw new Error("Product not found");
    return product;
  }

  static async createProduct(tenantId: string, input: ProductInput, userId?: string) {
    const existing = await prisma.product.findUnique({
      where: { tenantId_code: { tenantId, code: input.code } },
    });

    if (existing) {
      throw new Error(`Product code '${input.code}' is already used by another item.`);
    }

    const product = await prisma.$transaction(async (tx: any) => {
      const newProduct = await tx.product.create({
        data: {
          tenantId,
          code: input.code,
          name: input.name,
          brandId: input.brandId || null,
          categoryId: input.categoryId || null,
          supplierId: input.supplierId || null,
          cpu: input.cpu || null,
          ram: input.ram || null,
          ssd: input.ssd || null,
          gpu: input.gpu || null,
          condition: input.condition || "NEW",
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          quantity: input.quantity,
          lowStockThreshold: input.lowStockThreshold || 2,
          barcode: input.barcode || null,
          qrCode: input.qrCode || `${input.code}-${tenantId.slice(0, 5)}`,
          imageUrl: input.imageUrl || null,
          serialNumber: input.serialNumber || null,
          description: input.description || null,
          status: input.quantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
        },
      });

      if (input.quantity > 0) {
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: newProduct.id,
            type: "PURCHASE",
            quantityDelta: input.quantity,
            previousQty: 0,
            newQty: input.quantity,
            reason: "Initial Stock Creation",
            createdByUserId: userId || null,
          },
        });
      }

      return newProduct;
    });

    await AuditService.log({
      tenantId,
      userId,
      action: "CREATE_PRODUCT",
      entity: "Product",
      entityId: product.id,
      details: { code: product.code, name: product.name, quantity: product.quantity },
    });

    return product;
  }

  static async updateProduct(tenantId: string, productId: string, input: Partial<ProductInput>, userId?: string) {
    const existing = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!existing) throw new Error("Product not found");

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: input.name ?? existing.name,
        brandId: input.brandId ?? existing.brandId,
        categoryId: input.categoryId ?? existing.categoryId,
        supplierId: input.supplierId ?? existing.supplierId,
        cpu: input.cpu ?? existing.cpu,
        ram: input.ram ?? existing.ram,
        ssd: input.ssd ?? existing.ssd,
        gpu: input.gpu ?? existing.gpu,
        condition: input.condition ?? existing.condition,
        purchasePrice: input.purchasePrice ?? existing.purchasePrice,
        sellingPrice: input.sellingPrice ?? existing.sellingPrice,
        lowStockThreshold: input.lowStockThreshold ?? existing.lowStockThreshold,
        barcode: input.barcode ?? existing.barcode,
        qrCode: input.qrCode ?? existing.qrCode,
        imageUrl: input.imageUrl ?? existing.imageUrl,
        serialNumber: input.serialNumber ?? existing.serialNumber,
        description: input.description ?? existing.description,
      },
    });

    await AuditService.log({
      tenantId,
      userId,
      action: "UPDATE_PRODUCT",
      entity: "Product",
      entityId: productId,
      details: { updatedFields: Object.keys(input) },
    });

    return updated;
  }

  static async adjustStock(tenantId: string, productId: string, delta: number, reason: string, userId?: string) {
    return await prisma.$transaction(async (tx: any) => {
      const product = await tx.product.findFirst({ where: { id: productId, tenantId } });
      if (!product) throw new Error("Product not found");

      const newQty = product.quantity + delta;
      if (newQty < 0) {
        throw new Error(`Insufficient stock. Current quantity: ${product.quantity}, requested adjustment: ${delta}`);
      }

      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          quantity: newQty,
          status: newQty > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
          version: { increment: 1 },
        },
      });

      await tx.stockMovement.create({
        data: {
          tenantId,
          productId,
          type: delta > 0 ? "ADJUSTMENT_ADD" : "ADJUSTMENT_SUB",
          quantityDelta: delta,
          previousQty: product.quantity,
          newQty,
          reason,
          createdByUserId: userId || null,
        },
      });

      await AuditService.log({
        tenantId,
        userId,
        action: "ADJUST_STOCK",
        entity: "Product",
        entityId: productId,
        details: { previousQty: product.quantity, delta, newQty, reason },
      });

      return updated;
    });
  }

  static async deleteProduct(tenantId: string, productId: string, userId?: string) {
    const existing = await prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!existing) throw new Error("Product not found");

    await prisma.product.delete({ where: { id: productId } });

    await AuditService.log({
      tenantId,
      userId,
      action: "DELETE_PRODUCT",
      entity: "Product",
      entityId: productId,
      details: { code: existing.code, name: existing.name },
    });
  }
}
