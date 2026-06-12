'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/types/order';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MockCardInput } from './MockCardInput';
import { useFormContext } from 'react-hook-form';
import type { MockCardFormData } from '@/lib/validations/checkout';

// ── Props ─────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  selectedMethod:   PaymentMethod;
  onMethodChange:   (method: PaymentMethod) => void;
  isDiscreet:       boolean;
  onDiscreetChange: (val: boolean) => void;
  notes:            string;
  onNotesChange:    (val: string) => void;
  totalAmount:      string; // e.g. "3,200" — displayed in COD label
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PaymentForm({
  selectedMethod,
  onMethodChange,
  isDiscreet,
  onDiscreetChange,
  notes,
  onNotesChange,
  totalAmount,
}: PaymentFormProps) {

  // ── Payment method definitions ────────────────────────────────────────────
  // ✅ 'stripe' removed — replaced with 'mock_card'
  // ✅ 'jazzcash' kept as UI-only (disabled, Coming Soon)
  const paymentMethods: {
    value: PaymentMethod | 'jazzcash';
    label: string;
    description: string;
    icon: React.ReactNode;
    disabled?: boolean;
    comingSoon?: boolean;
  }[] = [
    {
      value:       'mock_card',
      label:       'Credit / Debit Card',
      description: 'Test mode — no real charges',
      icon:        <CreditCard className="h-5 w-5" />,
    },
    {
      value:       'cod',
      label:       'Cash on Delivery',
      description: `Pay PKR ${totalAmount} when your order arrives`,
      icon:        <Banknote className="h-5 w-5" />,
    },
    {
      value:       'jazzcash',
      label:       'JazzCash',
      description: 'Mobile wallet payment',
      icon:        <Smartphone className="h-5 w-5" />,
      disabled:    true,
      comingSoon:  true,
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Payment method selector ─────────────────────────────────────── */}
      <RadioGroup
        value={selectedMethod}
        onValueChange={(v) => {
          // ✅ Type-safe guard — only valid PaymentMethod values reach the handler
          // 'jazzcash' is disabled in UI but guarded here too for safety
          if (v === 'mock_card' || v === 'cod') {
            onMethodChange(v);
          }
        }}
      >
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.value}>
              <Label
                htmlFor={method.value}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all',
                  // ✅ Active state — matches on mock_card not stripe
                  selectedMethod === method.value
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary',
                  // ✅ Disabled style for JazzCash
                  method.disabled && 'cursor-not-allowed opacity-50 hover:border-border',
                )}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem
                    value={method.value}
                    id={method.value}
                    disabled={method.disabled}
                  />
                  <div className="flex items-center gap-2">
                    {method.icon}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{method.label}</span>
                        {/* ✅ DEV badge for mock card */}
                        {method.value === 'mock_card' && (
                          <span className="rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-yellow-800">
                            DEV
                          </span>
                        )}
                        {/* Coming Soon badge for JazzCash */}
                        {method.comingSoon && (
                          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {method.description}
                      </span>
                    </div>
                  </div>
                </div>
              </Label>

              {/* ✅ MockCardInput — expands below when mock_card is selected */}
              {method.value === 'mock_card' && selectedMethod === 'mock_card' && (
                <div className="mt-2 rounded-lg border border-t-0 rounded-t-none p-4 bg-muted/30">
                  <MockCardInput />
                </div>
              )}

              {/* COD note — expands below when cod is selected */}
              {method.value === 'cod' && selectedMethod === 'cod' && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-t-0 rounded-t-none bg-muted/30 p-4 text-sm text-muted-foreground">
                  <span>ℹ</span>
                  Please keep the exact amount ready. Our rider cannot provide change.
                </div>
              )}
            </div>
          ))}
        </div>
      </RadioGroup>

      {/* ── Discreet packaging toggle ───────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="discreet" className="cursor-pointer font-medium">
            Discreet Packaging
          </Label>
          <p className="text-xs text-muted-foreground">
            Plain box — no branding or product labels on the outside
          </p>
        </div>
        <Switch
          id="discreet"
          checked={isDiscreet}
          onCheckedChange={onDiscreetChange}
        />
      </div>

      {/* ── Order notes ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-2">
          Order Notes
          <span className="text-xs font-normal text-muted-foreground">optional</span>
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g. Leave at the gate, call before delivery…"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="text-right text-xs text-muted-foreground">{notes.length}/500</p>
      </div>

    </div>
  );
}