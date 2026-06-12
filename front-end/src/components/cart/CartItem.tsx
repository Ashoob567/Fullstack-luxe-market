"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { CartItem as CartItemType } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/useToast";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          borderBottom: "1px solid #E8E0D5",
          opacity: 0.5,
        }}
      >
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        padding: "16px 0",
        borderBottom: "1px solid #E8E0D5",
        opacity: isUpdating ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Product image */}
      <div
        style={{
          width: "72px",
          height: "72px",
          flexShrink: 0,
          background: "#F5F0E8",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #E8E0D5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "6px",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#F5F0E8",
            }}
          />
        )}
      </div>

      {/* Middle: info + controls */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* Name + trash row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "0.9rem",
              color: "#3D2F1F",
              lineHeight: 1.3,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "calc(100% - 28px)",
            }}
          >
            {item.name}
          </p>

          <button
            onClick={handleRemove}
            disabled={isRemoving || isUpdating}
            aria-label="Remove item"
            style={{
              background: "none",
              border: "none",
              padding: "2px",
              cursor: isRemoving || isUpdating ? "not-allowed" : "pointer",
              color: "#A09080",
              flexShrink: 0,
              lineHeight: 1,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!isRemoving && !isUpdating) {
                (e.currentTarget as HTMLButtonElement).style.color = "#C4621A";
              }
            }}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#A09080")}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Variant info */}
        {(item.size || item.color) && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: "0.8rem",
              color: "#A09080",
              margin: "3px 0 0",
            }}
          >
            {[item.size, item.color].filter(Boolean).join(" · ")}
          </p>
        )}

        {/* Quantity controls + subtotal row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "auto",
          }}
        >
          {/* Stepper */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#F5F0E8",
              borderRadius: "8px",
              padding: "2px",
              position: "relative",
            }}
          >
            {isUpdating && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(245, 240, 232, 0.9)",
                  borderRadius: "8px",
                }}
              >
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}

            <button
              onClick={() => handleUpdateQuantity(item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating || !cartItemId}
              aria-label="Decrease quantity"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                color: "#3D2F1F",
                fontSize: "1.1rem",
                cursor: item.quantity <= 1 || isUpdating ? "not-allowed" : "pointer",
                opacity: item.quantity <= 1 || isUpdating ? 0.3 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (item.quantity > 1 && !isUpdating)
                  (e.currentTarget as HTMLButtonElement).style.background = "#E8E0D5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              −
            </button>

            <span
              style={{
                minWidth: "28px",
                textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "#3D2F1F",
              }}
            >
              {item.quantity}
            </span>

            <button
              onClick={() => handleUpdateQuantity(item.quantity + 1)}
              disabled={isUpdating || !cartItemId}
              aria-label="Increase quantity"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                color: "#3D2F1F",
                fontSize: "1.1rem",
                cursor: isUpdating ? "not-allowed" : "pointer",
                opacity: isUpdating ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.12s ease",
              }}
              onMouseEnter={(e) => {
                if (!isUpdating)
                  (e.currentTarget as HTMLButtonElement).style.background = "#E8E0D5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              +
            </button>
          </div>

          {/* Subtotal */}
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "#3D2F1F",
              alignSelf: "flex-end",
            }}
          >
            {formatPrice(subtotal)}
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
