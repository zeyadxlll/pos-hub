import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit-service";

export class AdminService {
  static async getPlatformStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      pendingPaymentsCount,
      monthlyRevenue,
      yearlyRevenue,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "SUSPENDED" } }),
      prisma.paymentReceipt.count({ where: { status: "PENDING" } }),
      prisma.paymentReceipt.aggregate({
        where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.paymentReceipt.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      pendingPaymentsCount,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      yearlyRevenue: yearlyRevenue._sum.amount || 0,
    };
  }

  static async getAllTenants() {
    return await prisma.tenant.findMany({
      include: {
        subscriptions: { orderBy: { endDate: "desc" }, take: 1 },
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { sales: true, products: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async toggleTenantStatus(tenantId: string, status: string, adminUserId: string) {
    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });

    await AuditService.log({
      userId: adminUserId,
      action: "SUPERADMIN_CHANGE_TENANT_STATUS",
      entity: "Tenant",
      entityId: tenantId,
      details: { newStatus: status },
    });

    return updated;
  }

  static async reviewPaymentReceipt(
    receiptId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason: string | undefined,
    adminUserId: string
  ) {
    const receipt = await prisma.paymentReceipt.findUnique({ where: { id: receiptId } });
    if (!receipt) throw new Error("Payment receipt not found");

    if (action === "APPROVE") {
      return await prisma.$transaction(async (tx) => {
        await tx.paymentReceipt.update({
          where: { id: receiptId },
          data: {
            status: "APPROVED",
            reviewedAt: new Date(),
            reviewedBy: adminUserId,
          },
        });

        const durationDays = receipt.planType === "YEARLY" ? 365 : 30;
        const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

        await tx.subscription.create({
          data: {
            tenantId: receipt.tenantId,
            planType: receipt.planType,
            status: "ACTIVE",
            priceAmount: receipt.amount,
            startDate: new Date(),
            endDate,
          },
        });

        await tx.tenant.update({
          where: { id: receipt.tenantId },
          data: { status: "ACTIVE" },
        });

        await AuditService.log({
          userId: adminUserId,
          action: "APPROVE_PAYMENT_RECEIPT",
          entity: "PaymentReceipt",
          entityId: receiptId,
          details: { tenantId: receipt.tenantId, amount: receipt.amount, planType: receipt.planType },
        });

        return { approved: true };
      });
    } else {
      await prisma.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Invalid transfer receipt",
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
        },
      });

      await AuditService.log({
        userId: adminUserId,
        action: "REJECT_PAYMENT_RECEIPT",
        entity: "PaymentReceipt",
        entityId: receiptId,
        details: { rejectionReason },
      });

      return { approved: false };
    }
  }

  static async generateLicenseKey(planType: string, durationDays: number, adminUserId: string) {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const keyString = `LAPTOPHUB-${planType}-${durationDays}D-${randomCode}`;

    const key = await prisma.subscriptionKey.create({
      data: {
        key: keyString,
        planType,
        durationDays,
      },
    });

    await AuditService.log({
      userId: adminUserId,
      action: "GENERATE_LICENSE_KEY",
      entity: "SubscriptionKey",
      entityId: key.id,
      details: { keyString, planType, durationDays },
    });

    return key;
  }

  static async getSystemLogs() {
    return await prisma.auditLog.findMany({
      include: { tenant: { select: { name: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
}
