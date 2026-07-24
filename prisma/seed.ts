// @ts-ignore
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting POS Hub ERP Database Seeding...");

  // 1. Create Super Admin (Zeyad Adel)
  const hashedAdminPassword = await bcrypt.hash("201018", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "zeyadadel132123@gmail.com" },
    update: {
      passwordHash: hashedAdminPassword,
      role: "SUPER_ADMIN",
    },
    create: {
      name: "Zeyad Adel (Super Admin)",
      email: "zeyadadel132123@gmail.com",
      passwordHash: hashedAdminPassword,
      role: "SUPER_ADMIN",
    },
  });
  console.log("✅ Official Super Admin created:", superAdmin.email);

  // 2. Create Demo Tenant: TechZone Laptops
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
  console.log("✅ Tenant created:", demoTenant.name);

  // 3. Create Tenant Owner
  const hashedOwnerPassword = await bcrypt.hash("password123", 10);
  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@techzone.com" },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: "Mahmoud El-Sayed",
      email: "owner@techzone.com",
      passwordHash: hashedOwnerPassword,
      phone: "+201001234567",
      role: "OWNER",
    },
  });
  console.log("✅ Owner User created:", ownerUser.email);

  // 4. Subscription for Demo Tenant
  await prisma.subscription.create({
    data: {
      tenantId: demoTenant.id,
      planType: "YEARLY",
      status: "ACTIVE",
      priceAmount: 5000.0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  // 5. Settings & Cash Register
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

  await prisma.cashRegister.create({
    data: {
      tenantId: demoTenant.id,
      name: "Main Safe (الخزينة الرئيسية)",
      balance: 150000.0,
      isDefault: true,
    },
  });

  // 6. Categories & Brands
  const appleBrand = await prisma.brand.create({ data: { tenantId: demoTenant.id, name: "Apple" } });
  const hpBrand = await prisma.brand.create({ data: { tenantId: demoTenant.id, name: "HP" } });
  const dellBrand = await prisma.brand.create({ data: { tenantId: demoTenant.id, name: "Dell" } });
  const lenovoBrand = await prisma.brand.create({ data: { tenantId: demoTenant.id, name: "Lenovo" } });

  const gamingCategory = await prisma.category.create({ data: { tenantId: demoTenant.id, name: "Gaming Laptops" } });
  const ultrabookCategory = await prisma.category.create({ data: { tenantId: demoTenant.id, name: "Ultrabooks" } });
  const workstationCategory = await prisma.category.create({ data: { tenantId: demoTenant.id, name: "Workstations" } });

  // 7. Supplier & Customer
  const supplier = await prisma.supplier.create({
    data: {
      tenantId: demoTenant.id,
      name: "El-Badr International Import",
      phone: "+201223344556",
      email: "badr@import-laptops.com",
      address: "Free Zone, Nasr City, Cairo",
      notes: "Primary importer for US used laptops",
      balance: 0.0,
    },
  });

  await prisma.customer.create({
    data: {
      tenantId: demoTenant.id,
      name: "Eng. Ahmed Hassan",
      phone: "+201099887766",
      email: "ahmed.hassan@example.com",
      address: "Maadi, Cairo",
      notes: "VIP Client - Software Developer",
      balance: 0.0,
    },
  });

  // 8. Sample Laptop Products with Specs & Serials
  const productsData = [
    {
      code: "MAC-M3-16",
      name: "Apple MacBook Pro 14 M3",
      brandId: appleBrand.id,
      categoryId: ultrabookCategory.id,
      supplierId: supplier.id,
      cpu: "Apple M3 Pro (11-Core CPU)",
      ram: "18GB Unified Memory",
      ssd: "512GB NVMe SSD",
      gpu: "14-Core GPU",
      condition: "NEW",
      purchasePrice: 72000.0,
      sellingPrice: 85000.0,
      quantity: 5,
      barcode: "194253982001",
      qrCode: "MAC-M3-16-TECHZONE",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      serialNumber: "C02G10XXMD6M",
      description: "Space Black, English/Arabic Backlit Keyboard, Sealed Box",
    },
    {
      code: "HP-840-G8",
      name: "HP EliteBook 840 G8",
      brandId: hpBrand.id,
      categoryId: ultrabookCategory.id,
      supplierId: supplier.id,
      cpu: "Intel Core i7-1185G7",
      ram: "16GB DDR4",
      ssd: "512GB PCIe M.2 SSD",
      gpu: "Intel Iris Xe Graphics",
      condition: "USED",
      purchasePrice: 16500.0,
      sellingPrice: 21000.0,
      quantity: 8,
      barcode: "884420192831",
      qrCode: "HP-840-G8-TECHZONE",
      imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800",
      serialNumber: "5CG1493Z1P",
      description: "Imported US Grade A, 14 inch FHD IPS Touchscreen",
    },
    {
      code: "DELL-5560",
      name: "Dell Precision 5560 Workstation",
      brandId: dellBrand.id,
      categoryId: workstationCategory.id,
      supplierId: supplier.id,
      cpu: "Intel Core i9-11950H 8-Core",
      ram: "32GB DDR4 3200MHz",
      ssd: "1TB NVMe Gen4 SSD",
      gpu: "Nvidia RTX A2000 4GB GDDR6",
      condition: "REFURBISHED",
      purchasePrice: 38000.0,
      sellingPrice: 46000.0,
      quantity: 3,
      barcode: "739201948123",
      qrCode: "DELL-5560-TECHZONE",
      imageUrl: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800",
      serialNumber: "7X8K2M3",
      description: "Slim Premium CNC Aluminum, 4K UHD+ Touch Display",
    },
    {
      code: "LEN-LEGION5",
      name: "Lenovo Legion 5 Pro 16",
      brandId: lenovoBrand.id,
      categoryId: gamingCategory.id,
      supplierId: supplier.id,
      cpu: "AMD Ryzen 7 7745HX",
      ram: "32GB DDR5 5600MHz",
      ssd: "1TB NVMe M.2 SSD",
      gpu: "Nvidia GeForce RTX 4070 8GB",
      condition: "NEW",
      purchasePrice: 58000.0,
      sellingPrice: 66500.0,
      quantity: 4,
      barcode: "196801948291",
      qrCode: "LEN-LEGION5-TECHZONE",
      imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800",
      serialNumber: "PF49A3ZK",
      description: "16 inch WQXGA 240Hz 500 nits, RGB Backlit Keyboard",
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        tenantId: demoTenant.id,
        ...p,
      },
    });

    await prisma.stockMovement.create({
      data: {
        tenantId: demoTenant.id,
        productId: product.id,
        type: "PURCHASE",
        quantityDelta: product.quantity,
        previousQty: 0,
        newQty: product.quantity,
        reason: "Initial Stock Import",
      },
    });
  }
  console.log("✅ Laptop Products & Initial Stock Movements Created.");

  // 9. Generate Demo Subscription Keys
  const keys = [
    { key: "POSHUB-MONTHLY-KEY-2026-X1", planType: "MONTHLY", durationDays: 30 },
    { key: "POSHUB-YEARLY-KEY-2026-Y1", planType: "YEARLY", durationDays: 365 },
  ];

  for (const k of keys) {
    await prisma.subscriptionKey.upsert({
      where: { key: k.key },
      update: {},
      create: k,
    });
  }

  // 10. Sample Expense Categories
  await prisma.expenseCategory.createMany({
    data: [
      { tenantId: demoTenant.id, name: "Shop Rent (إيجار المحل)" },
      { tenantId: demoTenant.id, name: "Electricity & Utilities (كهرباء ومرافق)" },
      { tenantId: demoTenant.id, name: "Internet & Comms (إنترنت وتواصل)" },
      { tenantId: demoTenant.id, name: "Transportation & Freight (نقل وشحن)" },
      { tenantId: demoTenant.id, name: "Staff Salaries (أجور ومرتبات)" },
    ],
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
