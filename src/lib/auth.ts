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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        });

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
