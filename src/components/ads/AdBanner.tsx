'use client';

import AdSense from './AdSense';

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar';
  className?: string;
}

// Ad slot IDs - configure these in your AdSense dashboard
const AD_SLOTS = {
  top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || '',
  bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM || '',
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '',
};

export default function AdBanner({ position = 'bottom', className = '' }: AdBannerProps) {
  const adSlot = AD_SLOTS[position];

  // Don't render if no slot configured
  if (!adSlot && process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatMap = {
    top: 'horizontal' as const,
    bottom: 'horizontal' as const,
    sidebar: 'vertical' as const,
  };

  const styleMap = {
    top: { minHeight: '90px' },
    bottom: { minHeight: '90px' },
    sidebar: { minHeight: '250px', minWidth: '160px' },
  };

  return (
    <div className={`ad-container ${className}`}>
      <AdSense
        adSlot={adSlot || 'placeholder'}
        adFormat={formatMap[position]}
        style={styleMap[position]}
      />
    </div>
  );
}
