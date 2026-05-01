import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar  from "@/components/layout/Navbar";
import  Footer  from "@/components/layout/Footer";
import  MobileBottomNav  from "@/components/layout/MobileBottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import HeroBanner from "@/components/home/HeroBanner";
import "./globals.css";
import { Playfair_Display } from "next/font/google";
import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FlashSaleTimer from "@/components/home/FlashSaleTimer";
import {TrustBadges}  from "@/components/home/TrustBadges";
import { Main } from "next/document";
import NewsletterSection from "@/components/home/Newsletter";
import HomePage from "./(shop)/page";
const playfair = Playfair_Display({ subsets: ["latin"] });


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Luxe Market",
  description: "Discover luxury watches and elegant undergarments. Quality craftsmanship meets modern sophistication.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen flex flex-col font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Navbar />
            <HomePage/>
            <MobileBottomNav />
            <CartDrawer />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
