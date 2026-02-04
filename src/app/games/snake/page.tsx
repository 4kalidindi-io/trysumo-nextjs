import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import SnakeGame from '@/components/apps/snake/SnakeGame';

export const metadata: Metadata = {
  title: 'Snake – TrySumo.App',
  description: 'Classic snake game – eat, grow, and don\'t hit the walls',
};

export default function SnakePage() {
  return (
    <Container className="py-10">
      <BackLink href="/games" label="Back to Games" />
      <SnakeGame />
    </Container>
  );
}
