'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, del } from '@/lib/api';
import { Address } from '@/types/user';

const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad'] as const;

const addressSchema = z.object({
  label:          z.string().min(1, 'Label is required'),
  first_name:     z.string().min(1, 'First name is required'),
  last_name:      z.string().min(1, 'Last name is required'),
  phone:          z.string().min(1, 'Phone is required'),
  street_address: z.string().min(1, 'Street address is required'),
  city:           z.string().min(1, 'City is required'),
  province:       z.string().min(1, 'Province is required'),
  postal_code:    z.string().min(1, 'Postal code is required'),
  is_default:     z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Home', is_default: false },
  });

  // Fetch addresses from backend
  useEffect(() => {
    get<Address[]>('/api/auth/addresses/')
      .then(setAddresses)
      .catch(() => toast.error('Could not load addresses'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddAddress = async (data: any) => {
    setSubmitting(true);
    try {
      const newAddress = await post<Address>('/api/auth/addresses/', data);
      setAddresses((prev) => [...prev, newAddress]);
      setShowAddForm(false);
      reset();
      toast.success('Address added successfully');
    } catch {
      toast.error('Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del(`/api/auth/addresses/${id}/`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address removed');
    } catch {
      toast.error('Failed to remove address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await post<Address>(`/api/auth/addresses/${id}/set-default/`);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: a.id === id }))
      );
      toast.success('Default address updated');
    } catch {
      toast.error('Failed to update default address');
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        )}
      </div>

      {/* Add address form */}
      {showAddForm && (
        <Card className="max-w-2xl mb-8">
          <CardHeader>
            <CardTitle>Add New Address</CardTitle>
            <CardDescription>Enter your shipping address details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleAddAddress)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input id="label" placeholder="Home / Office" {...register('label')} />
                  {errors.label && <p className="text-sm text-destructive">{errors.label.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...register('phone')} />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" {...register('first_name')} />
                  {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...register('last_name')} />
                  {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street_address">Street Address</Label>
                <Input id="street_address" {...register('street_address')} />
                {errors.street_address && <p className="text-sm text-destructive">{errors.street_address.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} />
                  {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Province</Label>
                  <Select onValueChange={(v) => setValue('province', v as AddressFormData['province'])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && <p className="text-sm text-destructive">{errors.province.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input id="postal_code" {...register('postal_code')} />
                  {errors.postal_code && <p className="text-sm text-destructive">{errors.postal_code.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Address'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowAddForm(false); reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showAddForm ? (
        <EmptyState
          title="No addresses saved"
          description="Add your shipping addresses for faster checkout"
          actionText="Add Address"
          onAction={() => setShowAddForm(true)}
          icon={<MapPin className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {address.label}
                    {address.is_default && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!address.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => address.id && handleSetDefault(address.id)}
                        title="Set as default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => address.id && handleDelete(address.id)}
                      title="Delete address"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-medium">{address.first_name} {address.last_name}</p>
                <p>{address.street_address}</p>
                <p>{address.city}, {address.province} {address.postal_code}</p>
                <p className="text-muted-foreground">{address.phone}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
