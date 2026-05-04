import  HeroBanner  from '@/components/home/HeroBanner';
import  CategoryGrid  from '@/components/home/CategoryGrid';
import FeaturedProducts  from '@/components/home/FeaturedProducts';
import FlashSaleTimer from '@/components/home/FlashSaleTimer';
import TrustBadges  from '@/components/home/TrustBadges';
import Footer from '@/components/layout/Footer';
import Newsletter from '@/components/home/Newsletter'






export default function HomePage() {
  return (
    <main className='bg-[#F5F3EF]'>
      <HeroBanner /> 
      <CategoryGrid /> 
      <FeaturedProducts />
      
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
