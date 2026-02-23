import { Metadata } from 'next';
import Container from '@/components/shared/Container';
import BackLink from '@/components/layout/BackLink';
import PenaltyShootoutApp from '@/components/apps/penalty/PenaltyShootoutApp';

export const metadata: Metadata = {
  title: 'Penalty Shootout – TrySumo.App',
  description: 'Take penalties and save shots in this football penalty shootout game',
};

export default function PenaltyPage() {
  return (
    <Container className="py-10">
      <BackLink href="/games" label="Back to Games" />
      <PenaltyShootoutApp />
    </Container>
  );
}
