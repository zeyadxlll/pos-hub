import { prisma } from "@/lib/prisma";
import { SaleCheckoutInput } from "@/lib/validations";
import { generateInvoiceNumber } from "@/lib/utils";
import { AuditService } from "./audit-service";

export class POSService {
  static async checkout(tenantId: string, userId: string, input: SaleCheckoutInput) {
    return await prisma.$transaction(
      async (tx) => {
        let cashRegister = await tx.cashRegister.findFirst({
          where: { tenantId, isDefault: true },
        });

        if (!cashRegister) {
          cashRegister = await tx.cashRegister.create({
            data: {
              tenantId,
              name: "Main Safe",
              balance: 0.0,
              isDefault: true,
            },
          });
        }

        let grossSubtotal = 0;
        let totalCost = 0;
        const processedItems = [];

        for (const item of input.items) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, tenantId },
          });

          if (!product) {
            throw new Error(`Product ID ${item.productId} not found.`);
          }

          if (product.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for '${product.name}' (${product.code}). Available: ${product.quantity}, Requested: ${item.quantity}`
            );
          }

          const unitCost = product.purchasePrice;
          const unitPrice = item.unitPrice || product.sellingPrice;
          const subtotal = unitPrice * item.quantity;
          const costSubtotal = unitCost * item.quantity;
          const profit = subtotal - costSubtotal;

          grossSubtotal += subtotal;
          totalCost += costSubtotal;

          processedItems.push({
            productId: product.id,
            productCode: product.code,
            productName: product.name,
            serialNumber: item.serialNumber || product.serialNumber,
            unitPrice,
            unitCost,
            quantity: item.quantity,
            subtotal,
            profit,
            previousQty: product.quantity,
            newQty: product.quantity - item.quantity,
          });

          await tx.product.update({
            where: { id: product.id },
            data: {
              quantity: { decrement: item.quantity },
              status: product.quantity - item.quantity > 0 ? "AVAILABLE" : "OUT_OF_STOCK",
              version: { increment: 1 },
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId,
              productId: product.id,
              type: "SALE",
              quantityDelta: -item.quantity,
              previousQty: product.quantity,
              newQty: product.quantity - item.quantity,
              reason: `POS Sale Checkout`,
              createdByUserId: userId,
            },
          });
        }

        const discount = input.discountAmount || 0;
        const tax = input.taxAmount || 0;
        const netAmount = Math.max(0, grossSubtotal - discount + tax);
        const paidAmount = Math.min(netAmount, input.paidAmount);
        const remainingAmount = Math.max(0, netAmount - paidAmount);
        const totalProfit = Math.max(0, netAmount - totalCost);

        const invoiceNumber = generateInvoiceNumber("INV");

        const sale = await tx.sale.create({
          data: {
            tenantId,
            invoiceNumber,
            customerId: input.customerId || null,
            totalAmount: grossSubtotal,
            discountAmount: discount,
            taxAmount: tax,
            netAmount,
            profitAmount: totalProfit,
            paymentMethod: input.paymentMethod,
            paidAmount,
            remainingAmount,
            paymentStatus: remainingAmount === 0 ? "APPROVED" : "PENDING",
            cashRegisterId: cashRegister.id,
            createdByUserId: userId,
            items: {
              create: processedItems.map((pi) => ({
                productId: pi.productId,
                serialNumber: pi.serialNumber || null,
                unitPrice: pi.unitPrice,
                unitCost: pi.unitCost,
                quantity: pi.quantity,
                subtotal: pi.subtotal,
                profit: pi.profit,
              })),
            },
          },
          include: {
            items: { include: { product: true } },
            customer: true,
            createdByUser: true,
            tenant: true,
          },
        });

        // Deduct/Add Cash to Safe ONLY ONCE with Duplicate Check (Idempotency)
        if (paidAmount > 0) {
          const existingTx = await tx.cashTransaction.findFirst({
            where: { tenantId, reference: invoiceNumber },
          });

          if (!existingTx) {
            const balanceBefore = cashRegister.balance;
            const balanceAfter = balanceBefore + paidAmount;

            await tx.cashRegister.update({
              where: { id: cashRegister.id },
              data: { balance: balanceAfter },
            });

            await tx.cashTransaction.create({
              data: {
                tenantId,
                cashRegisterId: cashRegister.id,
                type: "SALE_INCOME",
                amount: paidAmount,
                balanceBefore,
                balanceAfter,
                reference: invoiceNumber,
                notes: `POS Income for Invoice ${invoiceNumber}`,
                createdByUserId: userId,
              },
            });
          }
        }

        if (input.customerId && remainingAmount > 0) {
          await tx.customer.update({
            where: { id: input.customerId },
            data: { balance: { increment: remainingAmount } },
          });
        }

        const qrPayload = `Tenant:${tenantId}|Inv:${invoiceNumber}|Total:${netAmount}|Date:${new Date().toISOString()}`;
        const barcodePayload = invoiceNumber.replace(/-/g, "");

        const invoice = await tx.invoice.create({
          data: {
            tenantId,
            saleId: sale.id,
            invoiceNumber,
            qrCodeData: qrPayload,
            barcodeData: barcodePayload,
          },
        });

        await AuditService.log({
          tenantId,
          userId,
          action: "POS_CHECKOUT",
          entity: "Sale",
          entityId: sale.id,
          details: { invoiceNumber, netAmount, paidAmount, itemCount: processedItems.length },
        });

        return { sale, invoice };
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }
}
