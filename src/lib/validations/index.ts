import { z } from "zod";

export const RegisterCompanySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Valid phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  country: z.string().default("Egypt"),
  address: z.string().min(3, "Address is required"),
  businessType: z.string().default("Laptop & Electronics"),
  logo: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const ProductSchema = z.object({
  code: z.string().min(1, "Product code required"),
  name: z.string().min(2, "Product name required"),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  cpu: z.string().optional(),
  ram: z.string().optional(),
  ssd: z.string().optional(),
  gpu: z.string().optional(),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]).default("NEW"),
  purchasePrice: z.coerce.number().min(0, "Purchase price must be positive"),
  sellingPrice: z.coerce.number().min(0, "Selling price must be positive"),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  lowStockThreshold: z.coerce.number().int().min(0).default(2),
  barcode: z.string().optional(),
  qrCode: z.string().optional(),
  imageUrl: z.string().optional(),
  serialNumber: z.string().optional(),
  description: z.string().optional(),
});

export const SaleCheckoutSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  salespersonName: z.string().optional(),
  paymentMethod: z.enum(["CASH", "INSTAPAY", "VODAFONE_CASH", "CARD", "PARTIAL"]),
  paidAmount: z.coerce.number().min(0, "Paid amount required"),
  discountAmount: z.coerce.number().min(0).default(0),
  taxAmount: z.coerce.number().min(0).default(0),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
      unitPrice: z.number().min(0),
      unitCost: z.number().min(0),
      serialNumber: z.string().optional(),
      customName: z.string().optional(),
      customSpecs: z.string().optional(),
    })
  ).min(1, "At least one product required"),
});

export const PurchaseOrderSchema = z.object({
  supplierId: z.string().optional(),
  paymentMethod: z.enum(["CASH", "INSTAPAY", "VODAFONE_CASH", "CARD", "PARTIAL"]),
  paidAmount: z.coerce.number().min(0),
  autoCashDeducted: z.boolean().default(true),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().min(1),
      unitCost: z.number().min(0),
      serialNumber: z.string().optional(),
    })
  ).min(1, "At least one item required"),
});

export const ExpenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(2, "Description is required"),
  paymentMethod: z.enum(["CASH", "INSTAPAY", "CARD"]).default("CASH"),
  autoCashDeducted: z.boolean().default(true),
});

export const LicenseKeySchema = z.object({
  key: z.string().min(5, "License key is required"),
});

export const PaymentReceiptSubmissionSchema = z.object({
  planType: z.enum(["MONTHLY", "YEARLY"]),
  amount: z.coerce.number().positive(),
  paymentMethod: z.enum(["INSTAPAY", "VODAFONE_CASH"]),
  transactionReference: z.string().optional(),
  receiptImage: z.string().min(1, "Receipt screenshot is required"),
});

export type RegisterCompanyInput = z.infer<typeof RegisterCompanySchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProductInput = z.infer<typeof ProductSchema>;
export type SaleCheckoutInput = z.infer<typeof SaleCheckoutSchema>;
export type PurchaseOrderInput = z.infer<typeof PurchaseOrderSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type LicenseKeyInput = z.infer<typeof LicenseKeySchema>;
export type PaymentReceiptSubmissionInput = z.infer<typeof PaymentReceiptSubmissionSchema>;
