'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToast } from '@/hooks/useToast';
import type { CartItem } from '@/types';

interface AddToCartButtonProps {
  item: Omit<CartItem, 'cart_item_id'>;
  disabled?: boolean;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onSuccess?: () => void;
  label?: string;
}

export function AddToCartButton({
  item,
  disabled = false,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  onSuccess,
  label = 'Add to Cart',
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const { success, error } = useToast();

  const handleAddToCart = async () => {
    setIsAdding(true);

    try {
      await addItem(item);

      // Success feedback
      setShowSuccess(true);
      success(`${item.name} added to cart!`, 2500);
      openDrawer();

      // Reset success state after animation
      setTimeout(() => setShowSuccess(false), 2000);

      onSuccess?.();
    } catch (err: any) {
      console.error('Add to cart error:', err);
      error(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to add item to cart. Please try again.',
        4000
      );
    } finally {
      setIsAdding(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-4 py-2 text-[0.8rem]',
    md: 'px-6 py-3 text-[0.9rem]',
    lg: 'px-7 py-[14px] text-base',
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  // Variant classes
  const variantClasses = {
    default: disabled
      ? 'bg-[#E8E0D5] text-white border-none'
      : 'bg-[#3D2F1F] text-white border-none hover:bg-[#5C4A32]',
    outline: disabled
      ? 'bg-transparent text-[#A09080] border-[1.5px] border-[#E8E0D5]'
      : 'bg-transparent text-[#3D2F1F] border-[1.5px] border-[#3D2F1F] hover:bg-brand-text-light',
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={`
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-[10px]
        font-['DM_Sans',sans-serif]
        font-semibold
        flex
        items-center
        justify-center
        gap-[10px]
        ${disabled || isAdding ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${disabled ? 'opacity-50' : 'opacity-100'}
        transition-all
        duration-200
        ease-in-out
        relative
      `}
      aria-label={label}
    >
      {isAdding ? (
        <>
          <Loader2
            size={iconSizes[size]}
            className="animate-spin"
          />
          Adding...
        </>
      ) : showSuccess ? (
        <>
          <Check size={iconSizes[size]} />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart size={iconSizes[size]} />
          {label}
        </>
      )}
    </button>
  );
}
