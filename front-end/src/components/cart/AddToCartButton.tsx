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

  // Size mappings
  const sizeStyles = {
    sm: {
      padding: '8px 16px',
      fontSize: '0.8rem',
      iconSize: 16,
    },
    md: {
      padding: '12px 24px',
      fontSize: '0.9rem',
      iconSize: 18,
    },
    lg: {
      padding: '14px 28px',
      fontSize: '1rem',
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  // Variant styles
  const variantStyles = {
    default: {
      background: disabled ? '#E8E0D5' : '#3D2F1F',
      color: '#FFFFFF',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: disabled ? '#A09080' : '#3D2F1F',
      border: `1.5px solid ${disabled ? '#E8E0D5' : '#3D2F1F'}`,
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      style={{
        width: fullWidth ? '100%' : 'auto',
        ...currentVariant,
        borderRadius: '10px',
        padding: currentSize.padding,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: currentSize.fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        cursor: disabled || isAdding ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isAdding) {
          const el = e.currentTarget as HTMLButtonElement;
          if (variant === 'default') {
            el.style.background = '#5C4A32';
          } else {
            el.style.background = '#F5F0E8';
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isAdding) {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.background = currentVariant.background;
        }
      }}
      aria-label={label}
    >
      {isAdding ? (
        <>
          <Loader2
            size={currentSize.iconSize}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          Adding...
        </>
      ) : showSuccess ? (
        <>
          <Check size={currentSize.iconSize} />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart size={currentSize.iconSize} />
          {label}
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
