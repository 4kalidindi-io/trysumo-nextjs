'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-header border-b border-primary-100">
      <div className="max-w-container mx-auto px-6">
        <div className="flex items-center justify-between h-[58px]">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="7" fill="#0f172a"/>
              <path d="M20.5 10.8C19.6 9.7 18.0 9 16.5 9C13.5 9 11 11.0 11 13.5C11 15.7 12.8 17.2 15.0 17.6L17.2 18.0C19.0 18.4 20.5 19.8 20.5 21.8C20.5 24.0 18.7 25.5 16.2 25.5C14.5 25.5 13.1 24.9 12.0 23.8" stroke="white" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
            </svg>
            <span className="text-sm font-medium">
              TrySumo<span className="text-primary-400">.App</span>
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/productivity"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/productivity') ? 'text-primary-900 font-semibold' : 'text-primary-500 hover:text-primary-900'
              }`}
            >
              Productivity
            </Link>
            <Link
              href="/games"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/games') ? 'text-primary-900 font-semibold' : 'text-primary-500 hover:text-primary-900'
              }`}
            >
              Games
            </Link>
            <Link
              href="/aiagents"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/aiagents') ? 'text-primary-900 font-semibold' : 'text-primary-500 hover:text-primary-900'
              }`}
            >
              AI Agents
            </Link>
            <Link
              href="/news"
              className={`text-sm font-medium transition-colors duration-150 ${
                isActive('/news') ? 'text-primary-900 font-semibold' : 'text-primary-500 hover:text-primary-900'
              }`}
            >
              News
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
