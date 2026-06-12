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
      const payload: Record<string, unknown> = {
        shipping_address: addressData,
        payment_method:   selectedMethod,
        is_discreet:      isDiscreet,
        notes:            notes || undefined,
      };

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