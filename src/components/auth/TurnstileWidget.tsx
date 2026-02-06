'use client';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    // Auto-verify when site key is not configured
    if (!siteKey) {
      console.warn('Turnstile site key not configured, auto-verifying');
      onVerify('bypass-token');
      return;
    }

    // Load Turnstile script
    const existingScript = document.querySelector(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        renderWidget();
      };
    } else {
      renderWidget();
    }

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return;

      // Clear any existing widget
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget might already be removed
        }
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme: 'light',
      });
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Widget might already be removed
        }
      }
    };
  }, [onVerify, onError, onExpire]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Don't render anything if no site key (auto-verified in useEffect)
  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className="flex justify-center" />;
}
