import Link from 'next/link';

interface AppCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

export default function AppCard({ href, icon, title, description }: AppCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-5 p-5 bg-white border border-primary-200 rounded-card transition-all duration-200 hover:border-primary-900 hover:shadow-card hover:-translate-y-0.5"
    >
      <div className="w-12 h-12 flex items-center justify-center bg-primary-50 rounded-xl text-2xl flex-shrink-0">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-primary-900 mb-1">
          {title}
        </h3>
        <p className="text-sm text-primary-500 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="text-primary-400 transition-transform group-hover:translate-x-0.5">
        →
      </div>
    </Link>
  );
}
