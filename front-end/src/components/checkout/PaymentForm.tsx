'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentFormProps {
  onSubmit: (method: PaymentMethod) => void;
}

export function PaymentForm({ onSubmit }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('stripe');

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    {
      value: 'stripe',
      label: 'Credit / Debit Card',
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      value: 'cod',
      label: 'Cash on Delivery',
      icon: <Banknote className="h-5 w-5" />,
    },
    {
      value: 'jazzcash',
      label: 'JazzCash',
      icon: <Banknote className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as PaymentMethod)}>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <Label
              key={method.value}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all',
                selectedMethod === method.value
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary'
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={method.value} id={method.value} />
                <div className="flex items-center gap-2">
                  {method.icon}
                  <span className="font-medium">{method.label}</span>
                </div>
              </div>
            </Label>
          ))}
        </div>
      </RadioGroup>

      {selectedMethod === 'stripe' && (
        <div className="rounded-lg border p-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You will be redirected to Stripe secure payment page
          </p>
        </div>
      )}

      <Button className="w-full" size="lg" onClick={() => onSubmit(selectedMethod)}>
        {selectedMethod === 'cod' ? 'Place Order' : `Pay with ${selectedMethod === 'stripe' ? 'Card' : 'JazzCash'}`}
      </Button>
    </div>
  );
}
