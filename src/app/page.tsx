import Hero from '@/components/home/Hero';
import Stats from '@/components/home/Stats';
import CategoryGrid from '@/components/home/CategoryGrid';
import Container from '@/components/shared/Container';

export default function Home() {
  return (
    <>
      <Hero />
      <Container>
        <Stats />
        <div className="w-10 h-px bg-primary-200 mx-auto mt-10 mb-12"></div>
      </Container>
      <CategoryGrid />
    </>
  );
}
