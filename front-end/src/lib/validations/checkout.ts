// src/lib/validations/checkout.ts

import { z } from "zod";

// ── Address Schema ────────────────────────────────────────────────────────────

const provinces = [
  "Punjab",
  "Sindh",
  "KPK",
  "Balochistan",
  "Islamabad",
] as const;

export const addressSchema = z.object({
  firstName: z
    .string()
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name must be less than 50 characters.")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes."),

  lastName: z
    .string()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name must be less than 50 characters.")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes."),

  email: z
    .string()
    .email("Please enter a valid email address.")
    .optional(),

  phone: z
    .string()
    .regex(
      /^03[0-9]{9}$/,
      "Phone number must be a valid Pakistani number (e.g. 03001234567)."
    ),

  streetAddress: z
    .string()
    .min(5, "Street address must be at least 5 characters.")
    .max(200, "Street address must be less than 200 characters."),

  city: z
    .string()
    .min(2, "City must be at least 2 characters.")
    .max(100, "City must be less than 100 characters."),



province: z.enum(provinces, {
  message: "Please select a valid province.",
}),

  postalCode: z
    .string()
    .regex(/^[0-9]{5}$/, "Postal code must be exactly 5 digits."),
});

// Guest checkout requires email
export const guestAddressSchema = addressSchema.extend({
  email: z.string().email("Please enter a valid email address."),
});

export type AddressFormData = z.infer<typeof addressSchema>;


// ── Mock Card Schema ──────────────────────────────────────────────────────────
// Purely for UI realism in dev/testing. No real validation against a processor.

export const mockCardSchema = z.object({
  cardholderName: z
    .string()
    .min(3, "Cardholder name must be at least 3 characters.")
    .max(80, "Cardholder name must be less than 80 characters.")
    .regex(/^[a-zA-Z\s'-]+$/, "Cardholder name can only contain letters and spaces."),

  cardNumber: z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))   // strip spaces before validation
    .pipe(
      z
        .string()
        .length(16, "Card number must be exactly 16 digits.")
        .regex(/^[0-9]{16}$/, "Card number must contain only digits.")
    ),

  expiry: z
    .string()
    .regex(
      /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
      "Expiry must be in MM/YY format (e.g. 08/27)."
    )
    .refine((val) => {
      const [month, year] = val.split("/").map(Number);
      const now = new Date();
      const expDate = new Date(2000 + year, month - 1, 1);
      // Card expires at END of the expiry month
      expDate.setMonth(expDate.getMonth() + 1);
      return expDate > now;
    }, "This card has expired."),

  cvv: z
    .string()
    .regex(/^[0-9]{3,4}$/, "CVV must be 3 or 4 digits."),
});

export type MockCardFormData = z.infer<typeof mockCardSchema>;


// ── Combined Checkout Schema ──────────────────────────────────────────────────
// Used to validate the full checkout form in one shot when payment_method
// is "mock_card". For COD, only addressSchema is needed.

export const checkoutSchemaCard = z.object({
  address:     addressSchema,
  card:        mockCardSchema,
  isDiscreet:  z.boolean().default(false),
  notes:       z.string().max(500, "Notes must be less than 500 characters.").optional(),
});

export const checkoutSchemaCOD = z.object({
  address:     addressSchema,
  isDiscreet:  z.boolean().default(false),
  notes:       z.string().max(500, "Notes must be less than 500 characters.").optional(),
});

export type CheckoutCardFormData = z.infer<typeof checkoutSchemaCard>;
export type CheckoutCODFormData  = z.infer<typeof checkoutSchemaCOD>;


// ── Province options (for dropdown) ──────────────────────────────────────────

export const PROVINCE_OPTIONS = [
  { value: "Punjab",      label: "Punjab" },
  { value: "Sindh",       label: "Sindh" },
  { value: "KPK",         label: "Khyber Pakhtunkhwa (KPK)" },
  { value: "Balochistan", label: "Balochistan" },
  { value: "Islamabad",   label: "Islamabad (Federal Capital)" },
] as const;

export type Province = typeof PROVINCE_OPTIONS[number]["value"];


// ── Card number formatter helper ──────────────────────────────────────────────
// Use in onChange handlers to auto-insert spaces: "4242424242424242" → "4242 4242 4242 4242"

export function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")           // digits only
    .slice(0, 16)                  // cap at 16
    .replace(/(.{4})/g, "$1 ")    // group into 4s
    .trim();
}

// ── Expiry formatter helper ───────────────────────────────────────────────────
// Auto-inserts slash: "0827" → "08/27"

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// ── Strip card number for API ─────────────────────────────────────────────────
// Never send formatted card numbers to the backend — strip spaces first.
// In real Stripe you'd never send the full number; here it's mock-only.

export function rawCardNumber(formatted: string): string {
  return formatted.replace(/\s+/g, "");
}