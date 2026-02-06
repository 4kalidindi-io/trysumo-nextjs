import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In | TrySumo',
  description: 'Sign in to your TrySumo account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
