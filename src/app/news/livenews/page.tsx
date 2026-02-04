import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import LiveNewsApp from '@/components/apps/livenews/LiveNewsApp';

export const metadata: Metadata = {
  title: 'Live News – TrySumo.App',
  description: 'Real-time news from Business, Technology, Kids Research, and Emotional Intelligence',
};

export default function LiveNewsPage() {
  return (
    <Container className="py-10 max-w-wide">
      <BackLink href="/news" label="Back to News" />
      <LiveNewsApp />
    </Container>
  );
}
