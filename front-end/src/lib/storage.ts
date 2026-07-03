/**
 * Typed browser storage with security constraints.
 *
 * SECURITY: Card numbers are NEVER persisted (not in sessionStorage, not in localStorage).
 * PendingOrder intentionally omits cardNumber - it's re-entered at verify time.
 *
 * All storage operations wrapped in try/catch (private browsing mode can throw).
 */

export interface PendingOrder {
  shipping_address: ShippingAddress;
  payment_method: "mock_card" | "cod";
  is_discreet: boolean;
  notes?: string;
  cart_id?: string;          // Guest only
  cart_items?: CartItem[];   // Guest only
  idempotency_key: string;   // UUID - generated once, reused on retry
  // ⚠️ card_number intentionally absent - re-entered at verify time
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  email?: string;  // Required for guest checkout only
}

// Cart item as stored in localStorage (matches types/cart.ts)
export interface StoredCartItem {
  cart_item_id: string;
  product_id: string;
  variant_id: string | null;
  name: string;
  image: string;
  price: string;  // Decimal as string
  quantity: number;
  size: string;
  color: string;
  slug?: string;
}

// Cart item format for backend order creation
export interface CartItem {
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_info: { size?: string; color?: string };
  unit_price: number;
  quantity: number;
  image_url?: string;
}

// Centralized key names (prevents typos)
const KEYS = {
  pendingOrder: "luxe_pending_order",
  cart: "cart",  // Matches existing cart localStorage key
  accessToken: "accessToken",
  guestId: "guest_cart_id",
  otpCooldownTs: "luxe_otp_cooldown_ts",  // Unix ms when cooldown expires
} as const;

// --- Pending Order ---

export function savePendingOrder(order: PendingOrder): void {
  try {
    sessionStorage.setItem(KEYS.pendingOrder, JSON.stringify(order));
  } catch (err) {
    console.error("Failed to save pending order:", err);
  }
}

export function loadPendingOrder(): PendingOrder | null {
  try {
    const raw = sessionStorage.getItem(KEYS.pendingOrder);
    return raw ? (JSON.parse(raw) as PendingOrder) : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder(): void {
  try {
    sessionStorage.removeItem(KEYS.pendingOrder);
  } catch {
    // Ignore
  }
}

// --- OTP Cooldown (survives page refresh) ---

export function saveCooldownExpiry(seconds: number): void {
  const expiresAt = Date.now() + seconds * 1000;
  try {
    sessionStorage.setItem(KEYS.otpCooldownTs, String(expiresAt));
  } catch {
    // Ignore
  }
}

export function loadCooldownRemaining(): number {
  try {
    const raw = sessionStorage.getItem(KEYS.otpCooldownTs);
    if (!raw) return 0;
    const remaining = Math.max(0, Math.ceil((Number(raw) - Date.now()) / 1000));
    return remaining;
  } catch {
    return 0;
  }
}

export function clearCooldown(): void {
  try {
    sessionStorage.removeItem(KEYS.otpCooldownTs);
  } catch {
    // Ignore
  }
}

// --- Cart ---

export function loadCart(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(KEYS.cart);
    return raw ? (JSON.parse(raw) as StoredCartItem[]) : [];
  } catch {
    return [];
  }
}

export function clearCart(): void {
  try {
    localStorage.removeItem(KEYS.cart);
  } catch {
    // Ignore
  }
}

// --- Auth & Guest ---

export function isAuthenticated(): boolean {
  try {
    return !!localStorage.getItem(KEYS.accessToken);
  } catch {
    return false;
  }
}

export function getOrCreateGuestId(): string {
  try {
    const existing = localStorage.getItem(KEYS.guestId);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(KEYS.guestId, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
