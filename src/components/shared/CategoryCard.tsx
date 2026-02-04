import Link from 'next/link';

interface CategoryCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
}

export default function CategoryCard({ href, icon, title, description }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center text-center px-6 pt-11 pb-8 bg-white border border-primary-200 rounded-card transition-all duration-200 hover:border-primary-900 hover:shadow-card-hover hover:-translate-y-1"
    >
      <div className="w-17 h-17 flex items-center justify-center bg-primary-50 rounded-card text-3xl mb-5.5 transition-colors group-hover:bg-primary-100">
        {icon}
      </div>

      <h2 className="text-xl font-bold text-primary-900 tracking-tight mb-1.5">
        {title}
      </h2>

      <p className="text-sm text-primary-500 leading-relaxed mb-7 max-w-[180px]">
        {description}
      </p>

      <div className="mt-auto w-9 h-9 flex items-center justify-center border-[1.5px] border-primary-200 rounded-full text-primary-400 transition-all group-hover:border-primary-900 group-hover:bg-primary-900 group-hover:text-white">
        →
      </div>
    </Link>
  );
}
