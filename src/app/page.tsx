import HeroSection from '@/components/landing/HeroSection';
import AppShowcase from '@/components/landing/AppShowcase';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CTASection from '@/components/landing/CTASection';

export default function Home() {
  return (
    <main className="overflow-hidden">
      <HeroSection />
      <AppShowcase />
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
