"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
  Heart,
  ShoppingBag,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/hooks/useWishlistStore";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Watches", href: "/category/watches" },
  { label: "Ladies Fashion", href: "/category/undergarments" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/sale", accent: true },
];

export default function Navbar() {
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, toggleDrawer } = useCartStore();
  const { wishlistIds, guestItems } = useWishlistStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const cartCount = mounted
    ? items?.reduce((a: number, i: any) => a + i.quantity, 0) ?? 0
    : 0;

  const wishlistCount = mounted
    ? (isAuthenticated ? wishlistIds.size : guestItems.length)
    : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const userInitials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "U";

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/95 backdrop-blur-md shadow-[0_1px_0_rgba(201,168,76,0.2)]"
          : "bg-[#0a0a0a]/80 backdrop-blur-sm"
      }`}
    >
      {/* Gold accent line at top */}
      <div
        className="w-full h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #E8C97A 50%, #C9A84C 70%, transparent 100%)",
        }}
      />

      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">

        {/* LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold"
          style={{
            fontFamily: "'Cormorant Garamond', 'Garamond', Georgia, serif",
            letterSpacing: "0.12em",
            color: "#E8C97A",
            fontSize: "1.15rem",
          }}
        >
          ⌚ <span>Luxe</span>
          <span style={{ color: "#F5F0E8" }}>Market</span>
        </Link>

        {/* NAV LINKS */}
        <ul className="hidden lg:flex gap-1">
          {NAV_LINKS.map((l, i) => (
            <motion.li
              key={l.label}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
            >
              <Link
                href={l.href}
                className={`px-4 py-2 rounded-sm text-sm font-medium tracking-wide transition-all duration-200 relative group ${
                  l.accent
                    ? "text-[#C9A84C] hover:text-[#E8C97A]"
                    : "text-[#A8BDD1] hover:text-[#F5F0E8]"
                }`}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {l.label}
                {/* Underline hover effect */}
                <span
                  className="absolute bottom-0 left-4 right-4 h-px scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                  style={{ backgroundColor: l.accent ? "#C9A84C" : "#C9A84C" }}
                />
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* RIGHT ACTIONS */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >

          {/* SEARCH */}
          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.form
                key="search-open"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSearch}
                className="flex items-center gap-1"
              >
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="h-8 px-3 text-sm rounded-sm bg-[#1a1a2e] border border-[#C9A84C]/40 text-[#F5F0E8] placeholder-[#6B8FAF] focus:outline-none focus:border-[#C9A84C]"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-[#A8BDD1] hover:text-[#C9A84C] transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="search-closed"
                onClick={() => setSearchOpen(true)}
                className="text-[#A8BDD1] hover:text-[#C9A84C] transition-colors duration-200 p-1"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Search size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* WISHLIST */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Link href="/account/wishlist" className="relative text-[#A8BDD1] hover:text-[#C9A84C] transition-colors duration-200 p-1 block">
              <Heart size={18} />
              {wishlistCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 text-[10px] h-4 w-4 p-0 flex items-center justify-center"
                  style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
                >
                  {wishlistCount}
                </Badge>
              )}
            </Link>
          </motion.div>

          {/* CART */}
          <motion.button
            onClick={toggleDrawer}
            className="relative text-[#A8BDD1] hover:text-[#C9A84C] transition-colors duration-200 p-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 text-[10px] h-4 w-4 p-0 flex items-center justify-center"
                style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
              >
                {cartCount}
              </Badge>
            )}
          </motion.button>

          {/* AUTH DROPDOWN */}
          {mounted && isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[#1a1a2e] transition-colors">
                  <Avatar className="h-8 w-8 border border-[#C9A84C]/40">
                    <AvatarFallback
                      className="text-xs font-semibold"
                      style={{ backgroundColor: "#1a1a2e", color: "#C9A84C" }}
                    >
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown size={14} className="text-[#A8BDD1]" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-52 border border-[#C9A84C]/20"
                style={{ backgroundColor: "#0f0f1a", color: "#F5F0E8" }}
              >
                <div className="px-2 py-1 text-sm font-semibold text-[#E8C97A]">
                  {user.first_name} {user.last_name}
                  <div className="text-xs text-[#6B8FAF]">{user.email}</div>
                </div>

                <DropdownMenuSeparator className="bg-[#C9A84C]/20" />

                <DropdownMenuItem className="text-[#A8BDD1] hover:text-[#F5F0E8] focus:bg-[#1a1a2e]">
                  <Link href="/account" className="flex items-center gap-2">
                    <User size={14} /> Account
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem className="text-[#A8BDD1] hover:text-[#F5F0E8] focus:bg-[#1a1a2e]">
                  <Link href="/orders" className="flex items-center gap-2">
                    <Package size={14} /> Orders
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-[#C9A84C]/20" />

                <DropdownMenuItem
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="text-red-400 focus:text-red-400 focus:bg-[#1a1a2e]"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="text-xs font-medium tracking-wide"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #C9A84C",
                color: "#C9A84C",
              }}
            >
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* MOBILE HAMBURGER */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden text-[#A8BDD1] hover:text-[#C9A84C] transition-colors p-1">
                <Menu size={20} />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="p-0 border-l border-[#C9A84C]/20"
              style={{ backgroundColor: "#0a0a0a" }}
            >
              <SheetHeader className="px-6 py-5 border-b border-[#C9A84C]/20">
                <SheetTitle
                  className="text-left"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    color: "#E8C97A",
                    letterSpacing: "0.15em",
                    fontSize: "1.1rem",
                  }}
                >
                  ⌚ Luxe Market
                </SheetTitle>
              </SheetHeader>

              <div className="mt-2 px-4 space-y-1">
                {NAV_LINKS.map((l) => (
                  <SheetClose key={l.label} asChild>
                    <Link
                      href={l.href}
                      className={`block px-3 py-3 rounded-sm text-sm font-medium tracking-wide transition-colors duration-200 border-b border-[#C9A84C]/10 ${
                        l.accent
                          ? "text-[#C9A84C]"
                          : "text-[#A8BDD1] hover:text-[#F5F0E8]"
                      }`}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {l.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>

        </motion.div>
      </nav>
    </motion.header>
  );
}
