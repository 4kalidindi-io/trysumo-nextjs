import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import AppCard from '@/components/shared/AppCard';

export const metadata: Metadata = {
  title: 'News – TrySumo.App',
  description: 'Latest news and updates',
};

export default function NewsPage() {
  return (
    <Container className="py-10">
      <BackLink href="/" />
      <h1 className="text-2xl font-bold text-primary-900 mb-8">📰 News</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AppCard
          href="/news/livenews"
          icon="📡"
          title="Live News Stream"
          description="Real-time news from Business, Tech, Kids & Emotional Intelligence"
        />
      </div>
    </Container>
  );
}
