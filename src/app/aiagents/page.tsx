import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import AppCard from '@/components/shared/AppCard';

export const metadata: Metadata = {
  title: 'AI Agents – TrySumo.App',
  description: 'Intelligent AI-powered agents',
};

export default function AIAgentsPage() {
  return (
    <Container className="py-10">
      <BackLink href="/" />
      <h1 className="text-2xl font-bold text-primary-900 mb-8">🤖 AI Agents</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AppCard
          href="/aiagents/tripplanner"
          icon="✈️"
          title="Trip Planner"
          description="AI-powered family vacation guide"
        />
        <AppCard
          href="/aiagents/calorieai"
          icon="📸"
          title="Calorie AI"
          description="Snap a photo to get instant nutrition info"
        />
      </div>
    </Container>
  );
}
