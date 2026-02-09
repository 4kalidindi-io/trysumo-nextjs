import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import HangmanApp from '@/components/apps/hangman/HangmanApp';

export const metadata: Metadata = {
  title: 'Hangman – TrySumo.App',
  description: 'Classic word guessing game with 1-word and 2-word modes',
};

export default function HangmanPage() {
  return (
    <Container className="py-10">
      <BackLink href="/games" label="Back to Games" />
      <HangmanApp />
    </Container>
  );
}
