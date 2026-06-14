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
    <div className="border-t border-[#E8E0D5] pt-4 flex flex-col gap-3">
      {/* Coupon row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
          placeholder="Enter coupon code"
          disabled={applying}
          className="flex-1 border-[1.5px] border-[#E8E0D5] rounded-lg px-3.5 py-2.5 font-['DM_Sans',sans-serif] font-normal text-sm text-[#3D2F1F] bg-brand-bg-light outline-none transition-[border-color] duration-200 ease-[ease] focus:border-[#3D2F1F] luxe-coupon-input"
        />

        <button
          onClick={handleApplyCoupon}
          disabled={applying || !couponCode.trim()}
          className="bg-[#3D2F1F] text-brand-bg-light border-none rounded-lg px-4.5 py-2.5 font-['DM_Sans',sans-serif] font-semibold text-[0.8rem] cursor-pointer transition-all duration-200 ease-[ease] whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#1A1A1A] hover:disabled:bg-[#3D2F1F]"
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
      <div className="flex justify-between border-t border-[#E8E0D5] pt-3 mt-1">
        <span className="font-['DM_Sans',sans-serif] font-bold text-base text-[#3D2F1F]">
          Total
        </span>
        <span className="font-['DM_Sans',sans-serif] font-bold text-base text-[#3D2F1F]">
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
    <div className="flex justify-between">
      <span
        className="font-['DM_Sans',sans-serif] font-normal text-sm text-[#5C4A32]"
        style={labelStyle}
      >
        {label}
      </span>
      <span
        className="font-['DM_Sans',sans-serif] font-normal text-sm text-[#5C4A32]"
        style={valueStyle}
      >
        {value}
      </span>
    </div>
  );
}