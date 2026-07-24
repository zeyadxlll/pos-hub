import { prisma } from "@/lib/prisma";
import { ExpenseInput } from "@/lib/validations";
import { AuditService } from "./audit-service";

export class FinanceService {
  static async getCashRegister(tenantId: string) {
    let register = await prisma.cashRegister.findFirst({
      where: { tenantId, isDefault: true },
      include: { cashTransactions: { take: 50, orderBy: { createdAt: "desc" }, include: { createdByUser: true } } },
    });

    if (!register) {
      register = await prisma.cashRegister.create({
        data: { tenantId, name: "Main Safe (الخزينة الرئيسية)", balance: 0.0, isDefault: true },
        include: { cashTransactions: true },
      });
    }

    return register;
  }

  static async depositCash(tenantId: string, userId: string, amount: number, notes: string) {
    if (amount <= 0) throw new Error("Deposit amount must be greater than zero");

    return await prisma.$transaction(
      async (tx: any) => {
        const register = await this.getCashRegister(tenantId);
        const balanceBefore = register.balance;
        const balanceAfter = balanceBefore + amount;

        await tx.cashRegister.update({
          where: { id: register.id },
          data: { balance: balanceAfter },
        });

        const transaction = await tx.cashTransaction.create({
          data: {
            tenantId,
            cashRegisterId: register.id,
            type: "MANUAL_DEPOSIT",
            amount,
            balanceBefore,
            balanceAfter,
            notes,
            createdByUserId: userId,
          },
        });

        await AuditService.log({
          tenantId,
          userId,
          action: "CASH_DEPOSIT",
          entity: "CashRegister",
          entityId: register.id,
          details: { amount, balanceAfter, notes },
        });

        return transaction;
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async withdrawCash(tenantId: string, userId: string, amount: number, notes: string) {
    if (amount <= 0) throw new Error("Withdrawal amount must be greater than zero");

    return await prisma.$transaction(
      async (tx: any) => {
        const register = await this.getCashRegister(tenantId);
        if (register.balance < amount) {
          throw new Error(`Insufficient cash register balance. Current balance: ${register.balance}`);
        }

        const balanceBefore = register.balance;
        const balanceAfter = balanceBefore - amount;

        await tx.cashRegister.update({
          where: { id: register.id },
          data: { balance: balanceAfter },
        });

        const transaction = await tx.cashTransaction.create({
          data: {
            tenantId,
            cashRegisterId: register.id,
            type: "MANUAL_WITHDRAWAL",
            amount,
            balanceBefore,
            balanceAfter,
            notes,
            createdByUserId: userId,
          },
        });

        await AuditService.log({
          tenantId,
          userId,
          action: "CASH_WITHDRAWAL",
          entity: "CashRegister",
          entityId: register.id,
          details: { amount, balanceAfter, notes },
        });

        return transaction;
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async deleteTransaction(tenantId: string, userId: string, transactionId: string) {
    return await prisma.$transaction(
      async (tx: any) => {
        const transaction = await tx.cashTransaction.findFirst({
          where: { id: transactionId, tenantId },
        });

        if (!transaction) throw new Error("Transaction not found");

        const register = await tx.cashRegister.findFirst({
          where: { id: transaction.cashRegisterId, tenantId },
        });

        if (!register) throw new Error("Cash register not found");

        const isAddType = transaction.type.includes("INCOME") || transaction.type.includes("DEPOSIT");
        const adjustment = isAddType ? -transaction.amount : transaction.amount;
        const newBalance = Math.max(0, register.balance + adjustment);

        await tx.cashRegister.update({
          where: { id: register.id },
          data: { balance: newBalance },
        });

        await tx.cashTransaction.delete({
          where: { id: transactionId },
        });

        await AuditService.log({
          tenantId,
          userId,
          action: "DELETE_CASH_TRANSACTION",
          entity: "CashTransaction",
          entityId: transactionId,
          details: { amount: transaction.amount, type: transaction.type, newBalance },
        });

        return { success: true, newBalance };
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async createExpense(tenantId: string, userId: string, input: ExpenseInput) {
    return await prisma.$transaction(
      async (tx: any) => {
        const settings = await tx.companySettings.findUnique({ where: { tenantId } });
        const shouldAutoDeduct = input.autoCashDeducted ?? (settings?.autoCashDeduction ?? true);

        let cashRegister = await tx.cashRegister.findFirst({ where: { tenantId, isDefault: true } });
        if (!cashRegister) {
          cashRegister = await tx.cashRegister.create({
            data: { tenantId, name: "Main Safe", balance: 0.0, isDefault: true },
          });
        }

        const expense = await tx.expense.create({
          data: {
            tenantId,
            categoryId: input.categoryId,
            amount: input.amount,
            description: input.description,
            paymentMethod: input.paymentMethod,
            cashRegisterId: cashRegister.id,
            autoCashDeducted: shouldAutoDeduct,
            createdByUserId: userId,
          },
          include: { category: true, createdByUser: true },
        });

        if (shouldAutoDeduct) {
          const balanceBefore = cashRegister.balance;
          const balanceAfter = balanceBefore - input.amount;

          await tx.cashRegister.update({
            where: { id: cashRegister.id },
            data: { balance: balanceAfter },
          });

          await tx.cashTransaction.create({
            data: {
              tenantId,
              cashRegisterId: cashRegister.id,
              type: "EXPENSE_PAYMENT",
              amount: input.amount,
              balanceBefore,
              balanceAfter,
              reference: expense.id,
              notes: `Expense Payment: ${input.description}`,
              createdByUserId: userId,
            },
          });
        }

        await AuditService.log({
          tenantId,
          userId,
          action: "CREATE_EXPENSE",
          entity: "Expense",
          entityId: expense.id,
          details: { amount: input.amount, description: input.description },
        });

        return expense;
      },
      { timeout: 20000, maxWait: 10000 }
    );
  }

  static async getDashboardMetrics(tenantId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      todaySales,
      monthlySales,
      yearlySales,
      allProducts,
      cashRegister,
      monthlyExpenses,
      recentSales,
      topSellingItems,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: startOfToday } },
        _sum: { netAmount: true, profitAmount: true },
      }),
      prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth } },
        _sum: { netAmount: true, profitAmount: true },
      }),
      prisma.sale.aggregate({
        where: { tenantId, createdAt: { gte: startOfYear } },
        _sum: { netAmount: true, profitAmount: true },
      }),
      prisma.product.findMany({
        where: { tenantId },
        select: { quantity: true, purchasePrice: true, sellingPrice: true },
      }),
      prisma.cashRegister.findFirst({
        where: { tenantId, isDefault: true },
      }),
      prisma.expense.aggregate({
        where: { tenantId, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.sale.findMany({
        where: { tenantId },
        include: { customer: true, createdByUser: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.saleItem.groupBy({
        by: ["productId"],
        where: { sale: { tenantId } },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const inventoryValuation = allProducts.reduce((acc: number, p: any) => acc + p.quantity * p.purchasePrice, 0);
    const totalPotentialValue = allProducts.reduce((acc: number, p: any) => acc + p.quantity * p.sellingPrice, 0);

    const netProfit = (monthlySales._sum.profitAmount || 0) - (monthlyExpenses._sum.amount || 0);

    const topProductIds = topSellingItems.map((item: any) => item.productId);
    const topProducts = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
    });

    const topSellersFormatted = topSellingItems.map((item: any) => {
      const prod = topProducts.find((p: any) => p.id === item.productId);
      return {
        id: item.productId,
        name: prod?.name || "Unknown Product",
        code: prod?.code || "-",
        totalQty: item._sum.quantity || 0,
        totalRevenue: item._sum.subtotal || 0,
      };
    });

    const monthlyChartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = d.toLocaleString("en-US", { month: "short" });

      const [mSale, mExp] = await Promise.all([
        prisma.sale.aggregate({
          where: { tenantId, createdAt: { gte: d, lt: nextD } },
          _sum: { netAmount: true },
        }),
        prisma.expense.aggregate({
          where: { tenantId, createdAt: { gte: d, lt: nextD } },
          _sum: { amount: true },
        }),
      ]);

      monthlyChartData.push({
        month: monthLabel,
        sales: mSale._sum.netAmount || 0,
        expenses: mExp._sum.amount || 0,
      });
    }

    return {
      todaySalesAmount: todaySales._sum.netAmount || 0,
      todayProfit: todaySales._sum.profitAmount || 0,
      monthlySalesAmount: monthlySales._sum.netAmount || 0,
      monthlyProfit: monthlySales._sum.profitAmount || 0,
      yearlySalesAmount: yearlySales._sum.netAmount || 0,
      inventoryValuation,
      totalPotentialValue,
      cashBalance: cashRegister?.balance || 0,
      monthlyExpenses: monthlyExpenses._sum.amount || 0,
      netProfit,
      recentSales,
      topSellersFormatted,
      monthlyChartData,
    };
  }
}
