import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import AppCard from '@/components/shared/AppCard';

export const metadata: Metadata = {
  title: 'Games – TrySumo.App',
  description: 'Fun games to take a break and recharge',
};

export default function GamesPage() {
  return (
    <Container className="py-10">
      <BackLink href="/" />
      <h1 className="text-2xl font-bold text-primary-900 mb-8">🎮 Games</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AppCard
          href="/games/snake"
          icon="🐍"
          title="Snake"
          description="Eat, grow, and don't hit the walls"
        />
      </div>
    </Container>
  );
}
