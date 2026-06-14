"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CartItem as CartItemType } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/useToast";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const router = useRouter();
  const { updateQuantity, removeItem } = useCartStore();
  const { error } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const effectivePrice = Number(item.price ?? 0);
  const subtotal = effectivePrice * item.quantity;
  const cartItemId = item.cart_item_id;

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (!cartItemId || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (err) {
      error("Failed to update quantity");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!cartItemId || isRemoving) return;

    setIsRemoving(true);
    try {
      await removeItem(cartItemId);
    } catch (err) {
      error("Failed to remove item");
      setIsRemoving(false);
    }
  };

  if (isRemoving) {
    return (
      <div className="flex items-center justify-center py-8 px-4 border-b border-brand-border opacity-50">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex gap-3.5 py-4 border-b border-brand-border transition-opacity duration-200"
      style={{ opacity: isUpdating ? 0.6 : 1 }}
    >
      {/* Product image */}
      <div className="w-[72px] h-[72px] shrink-0 bg-brand-text-light rounded-xl overflow-hidden border border-brand-border flex items-center justify-center">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-contain p-1.5"
          />
        ) : (
          <div className="w-full h-full bg-brand-text-light" />
        )}
      </div>

      {/* Middle: info + controls */}
      <div className="flex-1 flex flex-col gap-1.5">
        {/* Name + trash row */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-dm-sans font-semibold text-[0.9rem] text-brand-brown leading-tight m-0 line-clamp-2 max-w-[calc(100%-28px)]">
            {item.name}
          </p>

          <button
            onClick={handleRemove}
            disabled={isRemoving || isUpdating}
            aria-label="Remove item"
            className="bg-transparent border-none p-0.5 shrink-0 leading-none transition-colors duration-150 text-brand-text-gold-muted hover:text-brand-accent disabled:cursor-not-allowed"
            style={{ cursor: isRemoving || isUpdating ? "not-allowed" : "pointer" }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Variant info with edit button */}
        {(item.size || item.color) && (
          <div className="flex items-center gap-2 mt-0.5">
            <p className="font-dm-sans font-normal text-[0.8rem] text-brand-text-gold-muted m-0">
              {[item.size, item.color].filter(Boolean).join(" · ")}
            </p>
            {item.slug && (
              <button
                onClick={() => router.push(`/products/${item.slug}?edit=${cartItemId}`)}
                className="font-dm-sans font-medium text-[0.75rem] text-brand-gold hover:text-brand-text-gold-light bg-transparent border-none p-0 cursor-pointer transition-colors duration-150"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Quantity controls + subtotal row */}
        <div className="flex items-center justify-between mt-auto">
          {/* Stepper */}
          <div className="flex items-center bg-brand-text-light rounded-lg p-0.5 relative">
            {isUpdating && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: "rgba(245, 240, 232, 0.9)" }}>
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}

            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating || !cartItemId}
              aria-label="Decrease quantity"
              className="w-8 h-8 rounded-md bg-transparent border-none text-brand-brown text-lg flex items-center justify-center transition-all duration-[120ms] hover:bg-brand-border disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
              style={{ cursor: item.quantity <= 1 || isUpdating ? "not-allowed" : "pointer" }}
            >
              −
            </button>

            <span className="min-w-[28px] text-center font-dm-sans font-bold text-sm text-brand-brown">
              {item.quantity}
            </span>

            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={isUpdating || !cartItemId}
              aria-label="Increase quantity"
              className="w-8 h-8 rounded-md bg-transparent border-none text-brand-brown text-lg flex items-center justify-center transition-all duration-[120ms] hover:bg-brand-border disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
              style={{ cursor: isUpdating ? "not-allowed" : "pointer" }}
            >
              +
            </button>
          </div>

          {/* Subtotal */}
          <span className="font-dm-sans font-bold text-[0.95rem] text-brand-brown self-end">
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
