import { prisma } from "@/lib/prisma";
import { PurchaseOrderInput } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";
import { AuditService } from "./audit-service";

export class PurchaseService {
  static async createPurchaseOrder(tenantId: string, userId: string, input: PurchaseOrderInput) {
    return await prisma.$transaction(
      async (tx: any) => {
        const settings = await tx.companySettings.findUnique({ where: { tenantId } });
        const shouldAutoDeduct = input.autoCashDeducted ?? (settings?.autoCashDeduction ?? true);

        let cashRegister = await tx.cashRegister.findFirst({
          where: { tenantId, isDefault: true },
        });

        if (!cashRegister) {
          cashRegister = await tx.cashRegister.create({
            data: { tenantId, name: "Main Safe", balance: 0.0, isDefault: true },
          });
        }

        const purchaseNumber = generateInvoiceNumber("PO");
        let totalAmount = 0;
        const itemsToCreate = [];

        for (const item of input.items) {
          const product = await tx.product.findFirst({ where: { id: item.productId, tenantId } });
          if (!product) throw new Error(`Product ${item.productId} not found.`);

          const subtotal = item.unitCost * item.quantity;
          totalAmount += subtotal;

          itemsToCreate.push({
            productId: product.id,
            unitCost: item.unitCost,
            quantity: item.quantity,
            subtotal,
            serialNumber: item.serialNumber || null,
          });

          const newQty = product.quantity + item.quantity;
          await tx.product.update({
            where: { id: product.id },
            data: {
              quantity: { increment: item.quantity },
              purchasePrice: item.unitCost,
              status: "AVAILABLE",
              version: { increment: 1 },
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: product.id,
              type: "PURCHASE",
              quantityDelta: item.quantity,
              previousQty: product.quantity,
              newQty,
              reason: `Purchase Order ${purchaseNumber}`,
              createdByUserId: userId,
            },
          });
        }

        const paidAmount = Math.min(totalAmount, input.paidAmount);
        const remainingAmount = Math.max(0, totalAmount - paidAmount);

        const purchaseOrder = await tx.purchaseOrder.create({
          data: {
            tenantId,
            purchaseNumber,
            supplierId: input.supplierId || null,
            totalAmount,
            paidAmount,
            remainingAmount,
            paymentMethod: input.paymentMethod,
            cashRegisterId: cashRegister.id,
            autoCashDeducted: shouldAutoDeduct,
            createdByUserId: userId,
            items: {
              create: itemsToCreate,
            },
          },
          include: {
            items: { include: { product: true } },
            supplier: true,
            createdByUser: true,
          },
        });

        // Deduct from Safe ONLY ONCE with Duplicate Check (Idempotency)
        if (shouldAutoDeduct && paidAmount > 0) {
          const existingTx = await tx.cashTransaction.findFirst({
            where: { tenantId, reference: purchaseNumber },
          });

          if (!existingTx) {
            const balanceBefore = cashRegister.balance;
            const balanceAfter = balanceBefore - paidAmount;

            await tx.cashRegister.update({
              where: { id: cashRegister.id },
              data: { balance: balanceAfter },
            });

            await tx.cashTransaction.create({
              data: {
                tenantId,
                cashRegisterId: cashRegister.id,
                type: "PURCHASE_EXPENSE",
                amount: paidAmount,
                balanceBefore,
                balanceAfter,
                reference: purchaseNumber,
                notes: `Auto Cash Deduction for Purchase Order ${purchaseNumber}`,
                createdByUserId: userId,
              },
            });
          }
        }

        if (input.supplierId && remainingAmount > 0) {
          await tx.supplier.update({
            where: { id: input.supplierId },
            data: { balance: { increment: remainingAmount } },
          });
        }

        await AuditService.log({
          tenantId,
          userId,
          action: "CREATE_PURCHASE_ORDER",
          entity: "PurchaseOrder",
          entityId: purchaseOrder.id,
          details: { purchaseNumber, totalAmount, paidAmount, autoCashDeducted: shouldAutoDeduct },
        });

        return purchaseOrder;
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async getPurchases(tenantId: string) {
    return await prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: { supplier: true, createdByUser: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
