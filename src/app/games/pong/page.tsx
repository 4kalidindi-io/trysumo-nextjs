import ModernPongApp from '@/components/apps/pong/ModernPongApp';

export const metadata = {
  title: 'Modern Pong | TrySumo',
  description: 'Classic Pong game with power-ups! Play single player against AI or challenge a friend in 2-player mode.',
};

export default function PongPage() {
  return <ModernPongApp />;
}
