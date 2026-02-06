import { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account | TrySumo',
  description: 'Create your TrySumo account to access games, AI agents, and productivity tools.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
