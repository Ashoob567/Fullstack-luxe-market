'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function HeroBanner() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white">
      <div className="container py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Discover Luxury
              <br />
              <span className="text-amber-400">Timeless Elegance</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-md">
              Explore our curated collection of premium watches and elegant undergarments.
              Quality craftsmanship meets modern sophistication.
            </p>
            <div className="flex gap-4">
              <Button size="lg" onClick={() => router.push('/products')}>
                Shop Now
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                View Collections
              </Button>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative w-80 h-80 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-amber-400/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
