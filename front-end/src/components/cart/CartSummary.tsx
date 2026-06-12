"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";

export function CartSummary() {
  const { items, discount, setDiscount } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [applying, setApplying] = useState(false);

  const subtotal = items.reduce((sum, item) => {
    const effectivePrice = item.price + (item.price_modifier ?? 0);
    return sum + effectivePrice * item.quantity;
  }, 0);

  const shipping = subtotal > 2000 ? 0 : 200;
  const discountAmount = discount?.amount ?? 0;
  const total = subtotal - discountAmount + shipping;

  async function handleApplyCoupon() {
    const code = couponCode.trim();
    if (!code) return;

    setApplying(true);
    try {
      const res = await fetch("http://localhost:8000/api/cart/coupon/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Invalid coupon code.");
      }

      const data = await res.json();
      setDiscount({ code, amount: data.discount_amount ?? 0 });
      toast.success(`Coupon applied! You saved ${formatPrice(data.discount_amount ?? 0)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not apply coupon.";
      toast.error(message);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      style={{
        borderTop: "1px solid #E8E0D5",
        paddingTop: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Coupon row */}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
          placeholder="Enter coupon code"
          disabled={applying}
          style={{
            flex: 1,
            border: "1.5px solid #E8E0D5",
            borderRadius: "8px",
            padding: "10px 14px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.875rem",
            color: "#3D2F1F",
            background: "#FAF8F4",
            outline: "none",
            transition: "border-color 0.2s ease",
            // placeholder color applied via CSS class below
          }}
          className="luxe-coupon-input"
          onFocus={(e) => (e.currentTarget.style.borderColor = "#3D2F1F")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#E8E0D5")}
        />

        <button
          onClick={handleApplyCoupon}
          disabled={applying || !couponCode.trim()}
          style={{
            background: "#3D2F1F",
            color: "#FAF8F4",
            border: "none",
            borderRadius: "8px",
            padding: "10px 18px",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: applying || !couponCode.trim() ? "not-allowed" : "pointer",
            opacity: applying || !couponCode.trim() ? 0.4 : 1,
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!applying && couponCode.trim())
              (e.currentTarget as HTMLButtonElement).style.background = "#1A1A1A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#3D2F1F";
          }}
        >
          {applying ? "Applying…" : "Apply"}
        </button>
      </div>

      {/* Subtotal */}
      <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />

      {/* Discount */}
      {discountAmount > 0 && (
        <SummaryRow
          label={`Discount${discount?.code ? ` (${discount.code})` : ""}`}
          value={`− ${formatPrice(discountAmount)}`}
          valueStyle={{ color: "#2E7D32", fontWeight: 600 }}
          labelStyle={{ color: "#2E7D32", fontWeight: 600 }}
        />
      )}

      {/* Shipping */}
      <SummaryRow
        label="Shipping"
        value={shipping === 0 ? "Free" : formatPrice(shipping)}
        valueStyle={shipping === 0 ? { color: "#2E7D32", fontWeight: 600 } : undefined}
      />

      {/* Total */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #E8E0D5",
          paddingTop: "12px",
          marginTop: "4px",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "#3D2F1F",
          }}
        >
          Total
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "#3D2F1F",
          }}
        >
          {formatPrice(total)}
        </span>
      </div>

      {/* Inline style for placeholder colour */}
      <style>{`
        .luxe-coupon-input::placeholder { color: #A09080; }
      `}</style>
    </div>
  );
}

/* ── tiny helper ── */
interface SummaryRowProps {
  label: string;
  value: string;
  labelStyle?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}

function SummaryRow({ label, value, labelStyle, valueStyle }: SummaryRowProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: "0.875rem",
          color: "#5C4A32",
          ...labelStyle,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: "0.875rem",
          color: "#5C4A32",
          ...valueStyle,
        }}
      >
        {value}
      </span>
    </div>
  );
}