import HeroSection from '@/components/landing/HeroSection';
import AppShowcase from '@/components/landing/AppShowcase';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CTASection from '@/components/landing/CTASection';
import { AdBanner } from '@/components/ads';

export default function Home() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <AppShowcase />
      <div className="py-6 px-4 max-w-4xl mx-auto">
        <AdBanner position="top" />
      </div>
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
