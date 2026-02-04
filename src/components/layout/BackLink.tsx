import Link from 'next/link';

interface BackLinkProps {
  href: string;
  label?: string;
}

export default function BackLink({ href, label = 'Back' }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-500 hover:text-primary-900 transition-colors mb-6"
    >
      <span>←</span>
      <span>{label}</span>
    </Link>
  );
}
