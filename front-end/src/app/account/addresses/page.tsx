'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AddressForm } from '@/components/checkout/AddressForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';
import { Address } from '@/types/user';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddAddress = async (data: Omit<Address, 'id' | 'isDefault'> & { addressLine2?: string | null }) => {

    try {
      const newAddress = await post<Address>('/api/addresses/', { ...data, user: user?.id });
      setAddresses([...addresses, newAddress]);
      setShowAddForm(false);
      toast.success('Address added successfully');
    } catch (error) {
      console.error('Failed to add address:', error);
      toast.error('Failed to add address');
    }
  };

  if (addresses.length === 0 && !showAddForm) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Addresses</h1>
        <EmptyState
          title="No addresses saved"
          description="Add your shipping addresses for faster checkout"
          actionText="Add Address"
          onAction={() => setShowAddForm(true)}
          icon={<MapPin className="h-12 w-12 text-muted-foreground" />}
        />
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

      {showAddForm ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Add New Address</CardTitle>
            <CardDescription>Enter your shipping address details</CardDescription>
          </CardHeader>
          <CardContent>
            <AddressForm onSubmit={(data) => handleAddAddress({
  ...data,
  addressLine2: data.addressLine2 ?? null,
} as Address)} />
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {address.firstName} {address.lastName}
                  </CardTitle>
                  {address.isDefault && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>{address.addressLine1}</p>
                {address.addressLine2 && <p>{address.addressLine2}</p>}
                <p>{address.city}, {address.state} {address.postalCode}</p>
                <p>{address.country}</p>
                <p className="text-muted-foreground">{address.phone}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
