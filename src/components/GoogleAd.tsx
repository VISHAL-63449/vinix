import React, { useEffect, useRef } from 'react';

interface GoogleAdProps {
  slot?: string;
  layoutKey?: string;
  format?: string;
  className?: string;
  showLabel?: boolean;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  slot = '2361585746',
  layoutKey = '-hl-9+1e-43+4u',
  format = 'fluid',
  className = 'my-8 max-w-4xl mx-auto px-4',
  showLabel = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate push in React 18 StrictMode
    if (isLoadedRef.current) return;

    try {
      if (typeof window !== 'undefined') {
        const insElement = adRef.current;
        if (insElement && !insElement.getAttribute('data-adsbygoogle-status')) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isLoadedRef.current = true;
        }
      }
    } catch (e) {
      // Catch duplicate or ad-blocker errors silently
      console.warn('AdSense unit initialization notice:', e);
    }
  }, []);

  return (
    <div className={`google-ad-container w-full overflow-hidden text-center ${className}`}>
      {showLabel && (
        <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 select-none">
          Advertisement
        </span>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-format={format}
        data-ad-layout-key={layoutKey}
        data-ad-client="ca-pub-2526772201379380"
        data-ad-slot={slot}
      />
    </div>
  );
};

export default GoogleAd;
