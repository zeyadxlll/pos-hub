import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const cleanEmail = credentials.email.trim().toLowerCase();
        let user = await prisma.user.findUnique({
          where: { email: cleanEmail },
          include: { tenant: true },
        });

        // Production Auto-Seed Fallback for Vercel / Supabase deployment
        if (!user && cleanEmail === "zeyadadel132123@gmail.com") {
          const hashedAdminPassword = await bcrypt.hash("201018", 10);
          user = (await prisma.user.create({
            data: {
              name: "Zeyad Adel (Super Admin)",
              email: "zeyadadel132123@gmail.com",
              passwordHash: hashedAdminPassword,
              role: "SUPER_ADMIN",
            },
            include: { tenant: true },
          })) as any;
        } else if (!user && cleanEmail === "owner@techzone.com") {
          const hashedOwnerPassword = await bcrypt.hash("password123", 10);
          const demoTenant = await prisma.tenant.upsert({
            where: { slug: "techzone" },
            update: {},
            create: {
              name: "TechZone Laptops & Electronics",
              slug: "techzone",
              ownerName: "Mahmoud El-Sayed",
              phone: "+201001234567",
              email: "owner@techzone.com",
              country: "Egypt",
              address: "Bustan Computer Center, Mall 2, Shop 14, Cairo, Egypt",
              businessType: "Laptop Retail & Wholesale",
              status: "ACTIVE",
            },
          });

          await prisma.companySettings.upsert({
            where: { tenantId: demoTenant.id },
            update: {},
            create: {
              tenantId: demoTenant.id,
              companyName: "TechZone Laptops",
              currency: "EGP",
              taxRate: 0.0,
              autoCashDeduction: true,
              thermalReceiptHeader: "TechZone Laptops - El Bustan Mall Cairo",
              thermalReceiptFooter: "ضمان 3 شهور ضد عيوب الصناعة • استبدال الجهاز فقط لمدة أسبوعين • لا يوجد ترجيع جهاز",
              language: "ar",
            },
          });

          await prisma.cashRegister.upsert({
            where: { id: "main-safe-demo" },
            update: {},
            create: {
              id: "main-safe-demo",
              tenantId: demoTenant.id,
              name: "Main Safe (الخزينة الرئيسية)",
              balance: 150000.0,
              isDefault: true,
            },
          });

          user = (await prisma.user.create({
            data: {
              tenantId: demoTenant.id,
              name: "Mahmoud El-Sayed",
              email: "owner@techzone.com",
              passwordHash: hashedOwnerPassword,
              phone: "+201001234567",
              role: "OWNER",
            },
            include: { tenant: true },
          })) as any;
        }

        if (!user || !user.passwordHash || !user.isActive) {
          throw new Error("Invalid email or password");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as any,
          tenantId: user.tenantId ?? undefined,
          tenantName: user.tenant?.name ?? "System Admin",
          tenantSlug: user.tenant?.slug ?? "admin",
          subscriptionStatus: (user.tenant?.status || "ACTIVE") as any,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantSlug = user.tenantSlug;
        token.subscriptionStatus = user.subscriptionStatus;
      }

      // Always fetch fresh tenant status from database to reflect real-time SuperAdmin actions or license activations
      if (token.tenantId) {
        const freshTenant = await prisma.tenant.findUnique({
          where: { id: token.tenantId as string },
          select: { status: true },
        });
        if (freshTenant) {
          token.subscriptionStatus = freshTenant.status;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session && session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as any) || "OWNER";
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.tenantName = (token.tenantName as string) || "Store";
        session.user.tenantSlug = (token.tenantSlug as string) || "store";
        session.user.subscriptionStatus = (token.subscriptionStatus as any) || "ACTIVE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-laptophub-2026",
};
