// front-end/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display, DM_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CartProvider } from "@/providers/CartProvider";
import { ToastContainer } from "@/components/common/ToastContainer";
import "./globals.css";
import { AuthInitializer } from "@/components/common/AuthInitializer";
import { WishlistInitializer } from "@/components/common/WishlistInitializer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// ✅ Preload critical fonts used in hero banner (LCP element)
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["700"],
  preload: true, // ⚡ Force preload for LCP element
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
  display: "swap",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Luxe Market",
  description: "Discover luxury watches and elegant undergarments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} min-h-screen flex flex-col font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <CartProvider>
              <AuthInitializer/>
              <WishlistInitializer/>
              <Navbar />
              <main className="flex-1 pt-16">
                {children}
              </main>
              <MobileBottomNav />
              <CartDrawer />
              <ToastContainer />
              <Toaster richColors position="top-right" />
            </CartProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}