// src/hooks/useCheckout.ts
//
// Owns all checkout state and the "Place Order" logic.
// Used by the checkout page — keeps the page component clean.

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { AddressFormData }           from '@/lib/validations/checkout';
import type { MockCardFormData }          from '@/lib/validations/checkout';
import type { PaymentMethod, CartItem }   from '@/types';
import {
  savePendingOrder,
  loadCart,
  isAuthenticated,
  getOrCreateGuestId,
  type PendingOrder,
} from '@/lib/storage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CheckoutState {
  // Address
  addressData:   AddressFormData | null;
  addressValid:  boolean;

  // Payment
  selectedMethod:  PaymentMethod;
  cardData:        MockCardFormData | null;
  isDiscreet:      boolean;
  notes:           string;

  // UI
  isSubmitting: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCheckout() {
  const router = useRouter();

  const [addressData,    setAddressData]    = useState<AddressFormData | null>(null);
  const [addressValid,   setAddressValid]   = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cod');
  const [cardData,       setCardData]       = useState<MockCardFormData | null>(null);
  const [isDiscreet,     setIsDiscreet]     = useState(false);
  const [notes,          setNotes]          = useState('');
  const [isSubmitting,   setIsSubmitting]   = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────

  const canSubmit = useCallback((): boolean => {
    if (!addressValid || !addressData) return false;
    if (selectedMethod === 'mock_card' && !cardData) return false;
    return true;
  }, [addressValid, addressData, selectedMethod, cardData]);

  // ── Place order (OTP flow) ───────────────────────────────────────────────

  const placeOrder = useCallback(() => {
    if (!canSubmit() || !addressData) return;

    const auth = isAuthenticated();

    /**
     * Build pending order snapshot.
     *
     * SECURITY: card_number is intentionally excluded.
     * It will be re-entered on the verify page and sent directly in the verify request.
     * Never persist it to client storage (XSS risk).
     */
    const pendingOrder: PendingOrder = {
      shipping_address: addressData,
      payment_method: selectedMethod as "mock_card" | "cod",
      is_discreet: isDiscreet,
      notes: notes || undefined,
      idempotency_key: crypto.randomUUID(),  // Generated once, reused on retries
    };

    if (!auth) {
      // Guest checkout - snapshot cart items
      pendingOrder.cart_id = getOrCreateGuestId();
      pendingOrder.cart_items = loadCart().map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || undefined,
        product_name: item.name,
        variant_info: { size: item.size || undefined, color: item.color || undefined },
        unit_price: parseFloat(item.price),
        quantity: item.quantity,
        image_url: item.image || undefined,
      }));
    }

    savePendingOrder(pendingOrder);
    router.push("/checkout/verify");
  }, [canSubmit, addressData, selectedMethod, isDiscreet, notes, router]);

  return {
    // Address
    addressData,
    addressValid,
    onAddressChange: (data: AddressFormData, valid: boolean) => {
      setAddressData(data);
      setAddressValid(valid);
    },

    // Payment
    selectedMethod,
    onMethodChange:   setSelectedMethod,
    cardData,
    onCardDataChange: setCardData,
    isDiscreet,
    onDiscreetChange: setIsDiscreet,
    notes,
    onNotesChange:    setNotes,

    // Actions
    canSubmit,
    isSubmitting,
    placeOrder,
  };
}