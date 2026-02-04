import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import PomodoroTimer from '@/components/apps/pomodoro/PomodoroTimer';

export const metadata: Metadata = {
  title: 'Pomodoro Timer – TrySumo.App',
  description: 'Focus timer with work and break cycles',
};

export default function PomodoroPage() {
  return (
    <Container className="py-10">
      <BackLink href="/productivity" label="Back to Productivity" />
      <PomodoroTimer />
    </Container>
  );
}
