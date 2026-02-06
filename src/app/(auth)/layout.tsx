import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Simple header with logo */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-900 hover:text-accent-600 transition-colors">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path d="M8 12h16M8 16h12M8 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="font-bold text-lg">TrySumo</span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Simple footer */}
      <footer className="p-4 text-center text-sm text-primary-400">
        &copy; {new Date().getFullYear()} TrySumo. All rights reserved.
      </footer>
    </div>
  );
}
