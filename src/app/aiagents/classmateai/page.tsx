import { Metadata } from 'next';
import BackLink from '@/components/layout/BackLink';
import Container from '@/components/shared/Container';
import ClassmateAIApp from '@/components/apps/classmateai/ClassmateAIApp';

export const metadata: Metadata = {
  title: 'Classmate AI – TrySumo.App',
  description: 'AI-powered study companion with flashcards, quizzes, and memory tricks',
};

export default function ClassmateAIPage() {
  return (
    <Container className="py-10">
      <BackLink href="/aiagents" label="Back to AI Agents" />
      <ClassmateAIApp />
    </Container>
  );
}
