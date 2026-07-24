import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { RegisterCompanyInput, PaymentReceiptSubmissionInput } from "@/lib/validations";
import { AuditService } from "./audit-service";

export class TenantService {
  static async registerCompany(input: RegisterCompanyInput) {
    const slug = input.companyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) {
      throw new Error("A user with this email address already exists.");
    }

    const existingSlug = await prisma.tenant.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Math.floor(1000 + Math.random() * 9000)}` : slug;

    // Perform bcrypt password hash BEFORE starting DB transaction to prevent transaction timeout
    const hashedPassword = await bcrypt.hash(input.password, 10);

    return await prisma.$transaction(
      async (tx: any) => {
        const tenant = await tx.tenant.create({
          data: {
            name: input.companyName,
            slug: finalSlug,
            ownerName: input.ownerName,
            phone: input.phone,
            email: input.email,
            country: input.country || "Egypt",
            address: input.address,
            businessType: input.businessType || "Laptop & Electronics Store",
            logo: input.logo || null,
            status: "PENDING_PAYMENT",
          },
        });

        await tx.companySettings.create({
          data: {
            tenantId: tenant.id,
            companyName: input.companyName,
            logo: input.logo || null,
            currency: "EGP",
            taxRate: 0.0,
            autoCashDeduction: true,
          },
        });

        await tx.cashRegister.create({
          data: {
            tenantId: tenant.id,
            name: "Main Safe (الخزينة الرئيسية)",
            balance: 0.0,
            isDefault: true,
          },
        });

        const ownerUser = await tx.user.create({
          data: {
            tenantId: tenant.id,
            name: input.ownerName,
            email: input.email,
            passwordHash: hashedPassword,
            phone: input.phone,
            role: "OWNER",
          },
        });

        const endDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planType: "MONTHLY",
            status: "ACTIVE",
            priceAmount: 500.0,
            startDate: new Date(),
            endDate: endDate,
          },
        });

        await tx.tenant.update({
          where: { id: tenant.id },
          data: { status: "ACTIVE" },
        });

        await AuditService.log({
          tenantId: tenant.id,
          userId: ownerUser.id,
          action: "REGISTER_COMPANY",
          entity: "Tenant",
          entityId: tenant.id,
          details: { companyName: input.companyName, slug: finalSlug },
        });

        return { tenant, user: ownerUser };
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async submitPaymentReceipt(tenantId: string, input: PaymentReceiptSubmissionInput) {
    const receipt = await prisma.paymentReceipt.create({
      data: {
        tenantId,
        planType: input.planType,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference || null,
        receiptImage: input.receiptImage,
        status: "PENDING",
      },
    });

    await prisma.subscription.create({
      data: {
        tenantId,
        planType: input.planType,
        status: "PENDING_PAYMENT",
        priceAmount: input.amount,
        startDate: new Date(),
        endDate: new Date(Date.now() + (input.planType === "YEARLY" ? 365 : 30) * 24 * 60 * 60 * 1000),
      },
    });

    await AuditService.log({
      tenantId,
      action: "SUBMIT_PAYMENT_RECEIPT",
      entity: "PaymentReceipt",
      entityId: receipt.id,
      details: { amount: input.amount, method: input.paymentMethod },
    });

    return receipt;
  }

  static async activateViaLicenseKey(tenantId: string, keyString: string) {
    const key = await prisma.subscriptionKey.findUnique({ where: { key: keyString } });

    if (!key) {
      throw new Error("Invalid license key. Please verify the code entered.");
    }

    if (key.isUsed) {
      throw new Error("This license key has already been redeemed.");
    }

    if (key.expiresAt && key.expiresAt < new Date()) {
      throw new Error("This license key has expired.");
    }

    return await prisma.$transaction(
      async (tx: any) => {
        await tx.subscriptionKey.update({
          where: { id: key.id },
          data: {
            isUsed: true,
            usedByTenantId: tenantId,
          },
        });

        const endDate = new Date(Date.now() + key.durationDays * 24 * 60 * 60 * 1000);

        const sub = await tx.subscription.create({
          data: {
            tenantId,
            planType: key.planType,
            status: "ACTIVE",
            priceAmount: key.planType === "YEARLY" ? 5000 : 500,
            startDate: new Date(),
            endDate,
            licenseKeyId: key.id,
          },
        });

        await tx.tenant.update({
          where: { id: tenantId },
          data: { status: "ACTIVE" },
        });

        await AuditService.log({
          tenantId,
          action: "REDEEM_LICENSE_KEY",
          entity: "SubscriptionKey",
          entityId: key.id,
          details: { key: key.key, durationDays: key.durationDays },
        });

        return sub;
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async getSubscriptionStatus(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!tenant) throw new Error("Tenant not found");

    const latestSub = tenant.subscriptions[0];
    const now = new Date();
    const isExpired = latestSub ? latestSub.endDate < now : true;
    const diffTime = latestSub ? latestSub.endDate.getTime() - now.getTime() : 0;
    const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      status: isExpired ? "EXPIRED" : latestSub?.status || "PENDING_PAYMENT",
      planType: latestSub?.planType || "MONTHLY",
      endDate: latestSub?.endDate || now,
      remainingDays,
      isExpired,
    };
  }
}
