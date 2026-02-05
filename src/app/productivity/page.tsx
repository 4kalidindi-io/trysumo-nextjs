import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import AppCard from '@/components/shared/AppCard';

export const metadata: Metadata = {
  title: 'Productivity – TrySumo.App',
  description: 'Productivity tools and time management apps',
};

export default function ProductivityPage() {
  return (
    <Container className="py-10">
      <BackLink href="/" />
      <h1 className="text-2xl font-bold text-primary-900 mb-8">💼 Productivity</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AppCard
          href="/productivity/pomodoro"
          icon="⏱️"
          title="Pomodoro App"
          description="Focus timer with work & break cycles"
        />
        <AppCard
          href="/productivity/spinwheel"
          icon="🎡"
          title="Spin Wheel"
          description="Random name picker for decisions & raffles"
        />
      </div>
    </Container>
  );
}
