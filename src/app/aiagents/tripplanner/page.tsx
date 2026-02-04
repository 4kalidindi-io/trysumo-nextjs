import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import TripPlannerApp from '@/components/apps/tripplanner/TripPlannerApp';

export const metadata: Metadata = {
  title: 'Trip Planner – TrySumo.App',
  description: 'AI-powered family vacation planning guide',
};

export default function TripPlannerPage() {
  return (
    <Container className="py-10 max-w-wide">
      <BackLink href="/aiagents" label="Back to AI Agents" />
      <TripPlannerApp />
    </Container>
  );
}
