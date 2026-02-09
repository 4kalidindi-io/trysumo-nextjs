'use client';

import { useEffect, useRef } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Array<object>;
  }
}

export default function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style,
  className = '',
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

    // Don't render ads if no publisher ID or in development
    if (!publisherId || process.env.NODE_ENV === 'development') {
      return;
    }

    // Prevent double initialization
    if (isInitialized.current) {
      return;
    }

    try {
      if (adRef.current && !adRef.current.innerHTML) {
        isInitialized.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  // Don't render in development or if no publisher ID
  if (!publisherId || process.env.NODE_ENV === 'development') {
    return (
      <div
        className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm ${className}`}
        style={{ minHeight: '100px', ...style }}
      >
        Ad Placeholder (Configure NEXT_PUBLIC_ADSENSE_PUBLISHER_ID)
      </div>
    );
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client={publisherId}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  );
}
