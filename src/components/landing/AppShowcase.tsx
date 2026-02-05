'use client';

import Link from 'next/link';

interface AppCard {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
}

const apps: AppCard[] = [
  {
    href: '/productivity/pomodoro',
    title: 'Pomodoro Timer',
    description: 'Master your focus with the proven time-boxing technique.',
    gradient: 'from-rose-500 to-orange-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    features: ['25/5 work cycles', 'Session tracking', 'Break reminders'],
  },
  {
    href: '/productivity/spinwheel',
    title: 'Spin Wheel',
    description: 'Random name picker for decisions, raffles, and fun games.',
    gradient: 'from-pink-500 to-purple-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    features: ['Custom entries', 'Spin animation', 'Winner celebration'],
  },
  {
    href: '/productivity/focus',
    title: 'Focus',
    description: 'Schedule your day and stay focused with customizable timers.',
    gradient: 'from-indigo-500 to-blue-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    features: ['Manual event scheduling', 'Focus timer', 'Session tracking'],
  },
  {
    href: '/games/snake',
    title: 'Snake Game',
    description: 'Classic arcade fun to refresh your mind between tasks.',
    gradient: 'from-emerald-500 to-teal-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    features: ['Arrow & WASD controls', 'High score tracking', 'Mobile support'],
  },
  {
    href: '/games/pong',
    title: 'Modern Pong',
    description: 'Classic pong reimagined with power-ups and multiplayer.',
    gradient: 'from-amber-500 to-orange-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    features: ['Single & 2-player modes', 'Power-ups', 'AI opponent'],
  },
  {
    href: '/aiagents/tripplanner',
    title: 'AI Trip Planner',
    description: 'Plan your perfect vacation with AI-powered recommendations.',
    gradient: 'from-violet-500 to-purple-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    features: ['Powered by Claude AI', 'Family-friendly', 'Custom itineraries'],
  },
  {
    href: '/news/livenews',
    title: 'Live News Stream',
    description: 'Stay informed with real-time news across multiple categories.',
    gradient: 'from-blue-500 to-cyan-500',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    features: ['5 categories', 'Auto-refresh', 'Global sources'],
  },
];

function AppCard({ app }: { app: AppCard }) {
  return (
    <Link
      href={app.href}
      className="group relative"
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${app.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
      <div className="relative bg-white border border-primary-100 rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-transparent group-hover:shadow-2xl group-hover:-translate-y-2">
        {/* Icon */}
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${app.gradient} text-white mb-4`}>
          {app.icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-primary-900 mb-2 group-hover:text-primary-800">
          {app.title}
        </h3>

        {/* Description */}
        <p className="text-primary-500 mb-4 leading-relaxed">
          {app.description}
        </p>

        {/* Features */}
        <ul className="space-y-2">
          {app.features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-primary-600">
              <svg className={`w-4 h-4 text-emerald-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>

        {/* Arrow indicator */}
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

export default function AppShowcase() {
  return (
    <section id="apps" className="py-24 px-6 bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-accent-100 text-accent-700 text-sm font-semibold rounded-full mb-4">
            Our Apps
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-primary-900 mb-4">
            Tools Built for You
          </h2>
          <p className="text-lg text-primary-500 max-w-2xl mx-auto">
            Each app is crafted with care to help you work smarter, play harder, and live better.
          </p>
        </div>

        {/* App grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {apps.map((app, i) => (
            <AppCard key={i} app={app} />
          ))}
        </div>
      </div>
    </section>
  );
}
