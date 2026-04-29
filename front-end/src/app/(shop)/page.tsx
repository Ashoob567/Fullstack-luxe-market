import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FlashSaleTimer } from '@/components/home/FlashSaleTimer';
import { TrustBadges } from '@/components/home/TrustBadges';

export default function HomePage() {
  return (
    <main>
      <HeroBanner />
      <FlashSaleTimer />
      <CategoryGrid />
      <FeaturedProducts />
      <TrustBadges />
    </main>
  );
}
