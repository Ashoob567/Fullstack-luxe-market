'use client';

// src/components/checkout/AddressForm.tsx
//
// Aligned with Django backend shipping_address JSONField which expects:
// { firstName, lastName, phone, streetAddress, city, province, postalCode }

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addressSchema,
  type AddressFormData,
  PROVINCE_OPTIONS,
} from '@/lib/validations/checkout';

// ── Saved address type (from user profile API) ────────────────────────────────

export interface SavedAddress {
  id: string;
  label: string;           // e.g. "Home", "Office"
  firstName: string;
  lastName: string;
  phone: string;
  streetAddress: string ;
  city: string;
  province: string;
  postalCode: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddressFormProps {
  /** Called on every change — gives parent the current data + validity flag */
  onChange: (data: AddressFormData, isValid: boolean) => void;
  /** Saved addresses from user profile (empty for guests) */
  savedAddresses?: SavedAddress[];
  /** Optional pre-fill (e.g. restore state after back-navigation) */
  defaultValues?: Partial<AddressFormData>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddressForm({
  onChange,
  savedAddresses = [],
  defaultValues,
}: AddressFormProps) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: {
      firstName:     defaultValues?.firstName     ?? '',
      lastName:      defaultValues?.lastName      ?? '',
      phone:         defaultValues?.phone         ?? '',
      streetAddress: defaultValues?.streetAddress ?? '',
      city:          defaultValues?.city          ?? '',
      province:      defaultValues?.province,
      postalCode:    defaultValues?.postalCode    ?? '',
    },
  });

  // Notify parent on every field change
  useEffect(() => {
    const subscription = watch((values) => {
      const result = addressSchema.safeParse(values);
      onChange(values as AddressFormData, result.success);
    });
    return () => subscription.unsubscribe();
  }, [watch, onChange]);

  // Auto-fill all fields when user picks a saved address
  function handleSavedAddressSelect(id: string | null) {
    const saved = savedAddresses.find((a) => a.id === id);
    if (!saved) return;
    const opts = { shouldValidate: true, shouldDirty: true };
    setValue('firstName',     saved.firstName,                                opts);
    setValue('lastName',      saved.lastName,                                 opts);
    setValue('phone',         saved.phone,                                    opts);
    setValue('streetAddress', saved.streetAddress,                            opts);
    setValue('city',          saved.city,                                     opts);
    setValue('province',      saved.province as AddressFormData['province'],  opts);
    setValue('postalCode',    saved.postalCode,                               opts);
  }

  return (
    <div className="space-y-5">

      {/* ── Saved address picker ──────────────────────────────────────── */}
      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <Label>Use a saved address</Label>
          <Select onValueChange={handleSavedAddressSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a saved address…" />
            </SelectTrigger>
            <SelectContent>
              {savedAddresses.map((addr) => (
                <SelectItem key={addr.id} value={addr.id}>
                  {addr.label} — {addr.streetAddress}, {addr.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Selecting will auto-fill the fields below.
          </p>
        </div>
      )}

      {/* ── Name row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Ali"
            {...register('firstName')}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Khan"
            {...register('lastName')}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      {/* ── Phone ─────────────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="03001234567"
          autoComplete="tel"
          {...register('phone')}
        />
        {errors.phone ? (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Pakistani number format: 03XXXXXXXXX
          </p>
        )}
      </div>

      {/* ── Street address ────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="streetAddress">Street Address</Label>
        <Input
          id="streetAddress"
          placeholder="123 Main Blvd, DHA Phase 5"
          autoComplete="street-address"
          {...register('streetAddress')}
        />
        {errors.streetAddress && (
          <p className="text-xs text-destructive">{errors.streetAddress.message}</p>
        )}
      </div>

      {/* ── City + Province ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="Lahore"
            autoComplete="address-level2"
            {...register('city')}
          />
          {errors.city && (
            <p className="text-xs text-destructive">{errors.city.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="province">Province</Label>
          <Controller
            name="province"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCE_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.province && (
            <p className="text-xs text-destructive">{errors.province.message}</p>
          )}
        </div>
      </div>

      {/* ── Postal code ───────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input
          id="postalCode"
          placeholder="54000"
          maxLength={5}
          autoComplete="postal-code"
          {...register('postalCode')}
        />
        {errors.postalCode && (
          <p className="text-xs text-destructive">{errors.postalCode.message}</p>
        )}
      </div>

    </div>
  );
}