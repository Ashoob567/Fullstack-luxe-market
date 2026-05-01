"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Watches", href: "/watches" },
  { label: "Undergarments", href: "/undergarments" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Sale", href: "/sale", accent: true },
];

export default function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Defer store reads to client only — prevents SSR/client mismatch when
  // Zustand is persisted to localStorage (server always starts empty).
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Zustand stores
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, toggleDrawer } = useCartStore();

  const cartCount = isMounted
    ? (items?.reduce((acc: number, item: any) => acc + item.quantity, 0) ?? 0)
    : 0;
  // Wishlist count — wire to wishlistStore when ready
  const wishlistCount = 0;

  // Sticky scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const userInitials = user
  ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
  : "U";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-[0_1px_24px_0_rgba(15,23,66,0.08)] border-b border-slate-100"
          : "bg-white/70 backdrop-blur-sm"
      }`}
    >
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex-shrink-0 flex items-center gap-1.5 group"
          aria-label="Luxe Market home"
        >
          <span className="text-xl leading-none select-none">⌚</span>
          <span
            className="font-bold text-[1.15rem] tracking-tight"
            style={{ color: "#0f1742", letterSpacing: "-0.02em" }}
          >
            Luxe{" "}
            <span
              style={{
                background: "linear-gradient(90deg,#0f1742 0%,#2952cc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Market
            </span>
          </span>
        </Link>

        {/* ── Center Nav (desktop) ── */}
        <ul className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map(({ label, href, accent }) => (
            <li key={label}>
              <Link
                href={href}
                className={`
                  relative px-3.5 py-2 text-[0.875rem] font-medium rounded-lg transition-colors
                  ${
                    accent
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-700 hover:text-navy-900 hover:bg-slate-50"
                  }
                  after:absolute after:bottom-1 after:left-3.5 after:right-3.5 after:h-[1.5px]
                  after:bg-current after:scale-x-0 after:transition-transform after:origin-left
                  hover:after:scale-x-100
                `}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Right Side Actions ── */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Search */}
          <div className="relative flex items-center">
            {searchOpen ? (
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-1 animate-in fade-in slide-in-from-right-4 duration-200"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                  placeholder="Search products…"
                  className="w-44 sm:w-56 h-8 px-3 text-sm border border-slate-200 rounded-full bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                  aria-label="Search"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
                  aria-label="Close search"
                >
                  <X size={15} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Open search"
              >
                <Search size={19} />
              </button>
            )}
          </div>

          {/* Wishlist — single <Link>, no nested <button> (invalid HTML: <a> cannot contain <button>) */}
          <Link
            href="/wishlist"
            aria-label={`Wishlist (${wishlistCount} items)`}
            className="relative p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors inline-flex items-center justify-center"
          >
            <Heart size={19} />
            {wishlistCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold bg-rose-500 text-white border-0 rounded-full flex items-center justify-center">
                {wishlistCount}
              </Badge>
            )}
          </Link>

          {/* Cart */}
          <button
            onClick={toggleDrawer}
            className="relative p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
            aria-label={`Shopping cart (${cartCount} items)`}
          >
            <ShoppingBag size={19} />
            {cartCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] font-bold bg-blue-600 text-white border-0 rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </Badge>
            )}
          </button>

          {/* Auth — guarded by isMounted to prevent SSR mismatch with persisted Zustand state */}
          {isMounted && isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger >
                <button className="flex items-center gap-1.5 ml-1 p-1 rounded-full hover:bg-slate-100 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Avatar className="h-8 w-8 ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all">
                    <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown size={13} className="text-slate-400 hidden sm:block group-data-[state=open]:rotate-180 transition-transform" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 mt-1 shadow-lg border-slate-100">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem >
                  <Link href="/account" className="cursor-pointer">
                    <User size={14} className="mr-2 text-slate-500" />
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem >
                  <Link href="/orders" className="cursor-pointer">
                    <Package size={14} className="mr-2 text-slate-500" />
                    My Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              
              variant="outline"
              size="sm"
              className="ml-1 hidden sm:flex h-8 px-4 text-sm font-medium border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-700 transition-all rounded-full"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Hamburger */}
          {/* SheetTrigger with  merges onto our <button>, avoiding double-button nesting.
               Sheet is kept uncontrolled (no `open` prop) so Radix handles SSR correctly;
               we sync state via onOpenChange for the mobile auth footer display. */}
          <Sheet onOpenChange={setMobileOpen}>
            <SheetTrigger className="p-2" >
              
                <Menu size={20} />
            
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0 flex flex-col">
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
                <SheetTitle className="flex items-center gap-2 text-left">
                  <span className="text-lg">⌚</span>
                  <span className="font-bold text-[#0f1742]">Luxe Market</span>
                </SheetTitle>
              </SheetHeader>

              {/* Mobile Nav Links — SheetClose  replaces setMobileOpen(false) calls */}
              <nav className="flex-1 px-3 py-4 overflow-y-auto">
                <ul className="space-y-0.5">
                  {NAV_LINKS.map(({ label, href, accent }) => (
                    <li key={label}>
                      <SheetClose >
                        <Link
                          href={href}
                          className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            accent
                              ? "text-rose-600 hover:bg-rose-50"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {label}
                          {accent && (
                            <span className="ml-2 text-[10px] font-bold bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                              Hot
                            </span>
                          )}
                        </Link>
                      </SheetClose>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-0.5">
                  <SheetClose >
                    <Link
                      href="/wishlist"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Heart size={16} className="text-rose-400" />
                      Wishlist
                      {wishlistCount > 0 && (
                        <Badge className="ml-auto bg-rose-100 text-rose-600 text-xs border-0">
                          {wishlistCount}
                        </Badge>
                      )}
                    </Link>
                  </SheetClose>
                  <SheetClose >
                    <button
                      onClick={toggleDrawer}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <ShoppingBag size={16} className="text-blue-500" />
                      Cart
                      {cartCount > 0 && (
                        <Badge className="ml-auto bg-blue-100 text-blue-600 text-xs border-0">
                          {cartCount}
                        </Badge>
                      )}
                    </button>
                  </SheetClose>
                </div>
              </nav>

              {/* Mobile Auth Footer — guarded by isMounted */}
              <div className="px-5 py-4 border-t border-slate-100">
                {isMounted && isAuthenticated && user ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-1 py-1">
                      <Avatar className="h-9 w-9 ring-2 ring-blue-100">
                        <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs font-bold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button variant="outline" size="sm"  className="text-xs h-8 rounded-lg">
                        <SheetClose >
                          <Link href="/account">My Account</Link>
                        </SheetClose>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="text-xs h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button  className="w-full h-9 rounded-xl bg-[#0f1742] hover:bg-[#1a2a6e] text-sm">
                      <SheetClose >
                        <Link href="/login">Login</Link>
                      </SheetClose>
                    </Button>
                    <Button  variant="outline" className="w-full h-9 rounded-xl text-sm border-slate-200">
                      <SheetClose >
                        <Link href="/register">Create Account</Link>
                      </SheetClose>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}