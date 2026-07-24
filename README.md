# 💻 POS Hub ERP - Multi-Tenant SaaS Platform

<p align="center">
  <b>منصة إدارة ومبيعات أجهزة اللاب توب والـ POS المتكاملة للمؤسسات والمحلات</b>
</p>

---

## 🚀 المميزات الرئيسية (Key Features)

- **🏢 هندسة متعددة المستأجرين (Multi-Tenant Architecture)**: عزل تام ومحمي لبيانات كل شركة ومحل مع لوحة أدمن فائقة (SuperAdmin).
- **🛒 نقطة بيع كاشير سريعة (POS Terminal)**: دعم الخصومات (مبلغ ثابت / نسبة مئوية)، الباركود، الفواتير الحرارية (80mm) الشاملة لشروط الضمان ورقم المحل، مع اسم موظف السيلز المسؤول.
- **💻 إدارة مخزون اللاب توب (Hardware Specs & Images)**: تتبع مواصفات العتاد (CPU, RAM, SSD, GPU, S/N) مع مصغرات الصور وزر التزويد السريع للكميات.
- **💰 الخزينة والمصروفات الحية**: متابعة رصيد Safe الخزينة الرئيسي، الخصم التلقائي عند المشتريات، وحذف الحركات المالية للمالك مع تعديل الرصيد تلقائياً.
- **📱 دفعات انستاباي وفودافون كاش وكروت التراخيص**: نظام اشتراكات محلّي متكامل يدعم أكواد الـ License Keys والتحويل اليدوي.
- **🔒 تقييد الصلاحيات (RBAC)**: حسابات خاصة لموظفي السيلز والكاشير تقتصر على شاشة البيع والمخزون مع حظر الخزينة والتقارير والاشتراكات.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Framework**: Next.js 15 (App Router)
- **UI & Styling**: React 19, TailwindCSS, Lucide Icons, Next-Themes (Dark/Light mode)
- **Database & ORM**: Prisma ORM with SQLite (or Supabase PostgreSQL)
- **Authentication**: NextAuth.js (JWT Strategy with Tenant Isolation)
- **Validation**: Zod Schema Validations

---

## 📦 خطوات التشغيل المحلي (Local Setup)

1. **استنساخ المشروع (Clone Repository)**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd POS
   ```

2. **تثبيت الاعتماديات (Install Dependencies)**:
   ```bash
   npm install
   ```

3. **إعداد ملف البيئة (.env)**:
   قم بإنشاء ملف `.env` وانسخ المحتوى من `.env.example`:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-super-secret-key"
   ```

4. **تحديث قاعدة البيانات وتوليد البيانات الأولية (Database Push & Seed)**:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **تشغيل سيرفر التطوير (Run Dev Server)**:
   ```bash
   npm run dev
   ```

افتح المتصفح على: [http://localhost:3000](http://localhost:3000)

---

## 🔐 بيانات الدخول التجريبية (Demo Credentials)

- **حساب صاحب المحل (Tenant Owner)**: `owner@techzone.com` / `password123`
- **حساب أدمن المنصة (Super Admin)**: `admin@laptophub.com` / `admin123456`
