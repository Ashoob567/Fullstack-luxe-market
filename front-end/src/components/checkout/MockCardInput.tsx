'use client';

// src/components/checkout/MockCardInput.tsx

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatCardNumber, formatExpiry } from '@/lib/validations/checkout';
import type { MockCardFormData } from '@/lib/validations/checkout';

function detectBrand(number: string): 'VISA' | 'MC' | 'AMEX' | null {
  const raw = number.replace(/\s/g, '');
  if (/^4/.test(raw))       return 'VISA';
  if (/^5[1-5]/.test(raw))  return 'MC';
  if (/^3[47]/.test(raw))   return 'AMEX';
  return null;
}

export function MockCardInput() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<{ card: MockCardFormData }>();

  const [cvvFocused, setCvvFocused] = useState(false);

  const cardNumber = watch('card.cardNumber') ?? '';
  const expiry     = watch('card.expiry')     ?? '';
  const cardName   = watch('card.cardholderName') ?? '';
  const brand      = detectBrand(cardNumber);

  return (
    <div className="space-y-4">

      {/* Dev badge */}
      <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-800 text-xs">
        DEV — Test mode, no real charges
      </Badge>

      {/* Card preview */}
      <div className="relative w-full max-w-sm mx-auto aspect-[1.586] rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 text-white p-5 flex flex-col justify-between shadow-xl select-none overflow-hidden">
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

        <div className="flex justify-between items-start">
          {/* Chip */}
          <div className="w-9 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner" />
          {brand && <span className="text-xs font-bold tracking-widest text-white/80">{brand}</span>}
        </div>

        <div className="font-mono text-lg tracking-widest text-white/90">
          {!cvvFocused
            ? (cardNumber || '•••• •••• •••• ••••')
            : '•••• •••• •••• ••••'}
        </div>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/50 mb-0.5">Card Holder</p>
            <p className="text-xs font-medium uppercase tracking-wide">{cardName || 'YOUR NAME'}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/50 mb-0.5">Expires</p>
            <p className="text-xs font-medium">{expiry || 'MM/YY'}</p>
          </div>
          {cvvFocused && (
            <div className="bg-white/20 rounded px-2 py-1">
              <p className="text-[9px] uppercase tracking-widest text-white/70 mb-0.5">CVV</p>
              <p className="text-xs font-mono">•••</p>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">

        {/* Card number */}
        <div className="space-y-1.5">
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input
            id="cardNumber"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            maxLength={19}
            autoComplete="cc-number"
            value={formatCardNumber(cardNumber)}
            {...register('card.cardNumber')}
            onChange={(e) => setValue('card.cardNumber', formatCardNumber(e.target.value), { shouldValidate: true })}
          />
          {errors.card?.cardNumber && (
            <p className="text-xs text-destructive">{errors.card.cardNumber.message}</p>
          )}
        </div>

        {/* Cardholder name */}
        <div className="space-y-1.5">
          <Label htmlFor="cardholderName">Cardholder Name</Label>
          <Input
            id="cardholderName"
            placeholder="Ali Khan"
            autoComplete="cc-name"
            {...register('card.cardholderName')}
          />
          {errors.card?.cardholderName && (
            <p className="text-xs text-destructive">{errors.card.cardholderName.message}</p>
          )}
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="expiry">Expiry (MM/YY)</Label>
            <Input
              id="expiry"
              inputMode="numeric"
              placeholder="08/27"
              maxLength={5}
              autoComplete="cc-exp"
              value={formatExpiry(expiry)}
              {...register('card.expiry')}
              onChange={(e) => setValue('card.expiry', formatExpiry(e.target.value), { shouldValidate: true })}
            />
            {errors.card?.expiry && (
              <p className="text-xs text-destructive">{errors.card.expiry.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cvv">CVV</Label>
            <Input
              id="cvv"
              inputMode="numeric"
              placeholder="•••"
              maxLength={4}
              autoComplete="cc-csc"
              {...register('card.cvv')}
              onFocus={() => setCvvFocused(true)}
              onBlur={() => setCvvFocused(false)}
            />
            {errors.card?.cvv && (
              <p className="text-xs text-destructive">{errors.card.cvv.message}</p>
            )}
          </div>
        </div>

      </div>

      {/* Test card hints */}
      <div className="rounded-md border bg-muted/40 p-3 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Test Cards</p>
        <div className="flex justify-between items-center">
          <code className="text-xs bg-background rounded px-1.5 py-0.5">4242 4242 4242 4242</code>
          <span className="text-xs text-green-700 font-medium">Always succeeds</span>
        </div>
        <div className="flex justify-between items-center">
          <code className="text-xs bg-background rounded px-1.5 py-0.5">Any card ending 0000</code>
          <span className="text-xs text-destructive font-medium">Always declined</span>
        </div>
        <p className="text-xs text-muted-foreground">Use any future expiry and any 3-digit CVV.</p>
      </div>

    </div>
  );
}