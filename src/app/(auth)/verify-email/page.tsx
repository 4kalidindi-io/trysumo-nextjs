import { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyEmailForm from '@/components/auth/VerifyEmailForm';

export const metadata: Metadata = {
  title: 'Verify Email | TrySumo',
  description: 'Verify your email address to complete registration.',
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card shadow-card p-8 text-center">
          <div className="animate-pulse">
            <div className="w-12 h-12 bg-primary-200 rounded-full mx-auto mb-4" />
            <div className="h-6 bg-primary-200 rounded w-3/4 mx-auto mb-2" />
            <div className="h-4 bg-primary-100 rounded w-1/2 mx-auto" />
          </div>
        </div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
