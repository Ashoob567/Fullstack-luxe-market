import { Suspense } from 'react';

import  HeroBanner  from '@/components/home/HeroBanner';
import  CategoryGrid  from '@/components/home/CategoryGrid';
import FeaturedProducts  from '@/components/home/FeaturedProducts';
import FlashSaleTimer from '@/components/home/FlashSaleTimer';
import TrustBadges  from '@/components/home/TrustBadges';
import Footer from '@/components/layout/Footer';
import Newsletter from '@/components/home/Newsletter'
import SkeletonCard from '@/components/common/SkeletonCard';


function CategorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}


export default function HomePage() {
  return (
    <main className='bg-[#F5F3EF]'>
      {/* ✅ Hero banner renders immediately - no Suspense needed */}
      <HeroBanner />
      <Suspense fallback={<CategorySkeleton/>}>
      <CategoryGrid />
      </Suspense>
      <Suspense fallback={<FeaturedSkeleton/>}>
      <FeaturedProducts />
      </Suspense> 
      
      
      <TrustBadges /> 
      <FlashSaleTimer 
      isActive={true} 
      endTime="2026-05-10T23:59:59Z"
      />
      <Newsletter/> 
      <Footer/>

    </main>
  );
}
