"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { toggleDrawer, items } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const isActive = (path: string) => pathname === path;

  const tabBase =
    "relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200";
  const activeColor = "text-[#1B3A5C]";
  const inactiveColor = "text-[#9A8870]";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#F5F0E8] border-t border-[#D8CFC0]">
      <div className="flex items-stretch h-16">

        {/* Home */}
        <Link href="/" className={`${tabBase} ${isActive("/") ? activeColor : inactiveColor}`}>
          {isActive("/") && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#1B3A5C]" />
          )}
          <House size={22} strokeWidth={isActive("/") ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Search */}
        <Link href="/search" className={`${tabBase} ${isActive("/search") ? activeColor : inactiveColor}`}>
          {isActive("/search") && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#1B3A5C]" />
          )}
          <Search size={22} strokeWidth={isActive("/search") ? 2 : 1.5} />
          <span className="text-[10px] font-medium">Search</span>
        </Link>

        {/* Cart */}
        <button
          onClick={toggleDrawer}
          className={`${tabBase} ${inactiveColor} hover:text-[#1B3A5C]`}
        >
          <span className="relative">
            <ShoppingCart size={22} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#1B3A5C] text-white text-[9px] font-semibold leading-none">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">Cart</span>
        </button>

        {/* Account */}
        <Link
          href={isAuthenticated ? "/account" : "/login"}
          className={`${tabBase} ${isActive("/account") || isActive("/login") ? activeColor : inactiveColor}`}
        >
          {(isActive("/account") || isActive("/login")) && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#1B3A5C]" />
          )}
          <User size={22} strokeWidth={isActive("/account") || isActive("/login") ? 2 : 1.5} />
          <span className="text-[10px] font-medium">
            {isAuthenticated ? "Account" : "Login"}
          </span>
        </Link>

      </div>
    </nav>
  );
}