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
import type { CreatePaymentIntentResponse } from '@/types';
import { rawCardNumber }                  from '@/lib/validations/checkout';
import { post }                           from '@/lib/api';

// ── Guest Cart ID Helper ──────────────────────────────────────────────────────
function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';

  let guestId = localStorage.getItem('guest_cart_id');
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_cart_id', guestId);
  }
  return guestId;
}

function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

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

  // ── Place order ───────────────────────────────────────────────────────────

  const placeOrder = useCallback(async () => {
    if (!canSubmit() || !addressData) return;

    setIsSubmitting(true);

    try {
      const isAuth = isAuthenticated();

      const payload: Record<string, unknown> = {
        shipping_address: addressData,
        payment_method:   selectedMethod,
        is_discreet:      isDiscreet,
        notes:            notes || undefined,
      };

      // For guest users: include cart_id and cart_items
      if (!isAuth) {
        payload.cart_id = getOrCreateGuestId();

        // Get cart from localStorage and transform for backend
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cartItems = JSON.parse(savedCart);
          payload.cart_items = cartItems.map((item: CartItem) => ({
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.name,
            variant_info: { size: item.size, color: item.color },
            unit_price: item.price,
            quantity: item.quantity,
            image_url: item.image,
          }));
        }
      }

      // Attach raw card number for mock_card (strip spaces)
      if (selectedMethod === 'mock_card' && cardData) {
        payload.card_number = rawCardNumber(cardData.cardNumber);
      }

      const data = await post<CreatePaymentIntentResponse>(
        '/api/payments/create-intent/',
        payload,
      );

      if (data.status === 'success') {
        router.push(`/order/success?id=${data.order_id}`);
      } else {
        // 402 — payment failed (declined card etc.)
        toast.error(data.error ?? 'Payment failed. Please try again.');
      }
    } catch {
      toast.error('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    canSubmit, addressData, selectedMethod,
    isDiscreet, notes, cardData, router,
  ]);

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