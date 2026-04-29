'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/order';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();

  const displayPrice = item.salePrice ?? item.price;
  const quantityOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="flex gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="font-medium line-clamp-1">{item.name}</h4>
          <p className="text-sm text-muted-foreground">
            {item.size && `Size: ${item.size}`}
            {item.size && item.color && ' | '}
            {item.color && `Color: ${item.color}`}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger >
                <Button variant="outline" size="sm" className="h-8 w-16">
                  {item.quantity}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {quantityOptions.map((qty) => (
                  <DropdownMenuItem
                    key={qty}
                    onClick={() => updateQuantity(item.variantId, qty)}
                  >
                    {qty}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.variantId)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="font-semibold">{formatPrice(displayPrice * item.quantity)}</p>
        </div>
      </div>
    </div>
  );
}
