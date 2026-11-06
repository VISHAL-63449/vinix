import React, { useEffect, useRef, useState } from 'react';

interface GoogleAdProps {
  slot?: string;
  layoutKey?: string;
  format?: string;
  className?: string;
  showLabel?: boolean;
}

export const GoogleAd: React.FC<GoogleAdProps> = ({
  slot = '2361585746',
  layoutKey,
  format = 'auto',
  className = 'my-8 max-w-4xl mx-auto px-4',
  showLabel = true,
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isLoadedRef = useRef(false);
  const [isFilled, setIsFilled] = useState(false);
  const [isUnfilled, setIsUnfilled] = useState(false);

  useEffect(() => {
    const el = adRef.current;
    if (!el) return;

    // Observe changes to Google AdSense status attribute
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-ad-status') {
          const status = el.getAttribute('data-ad-status');
          if (status === 'filled') {
            setIsFilled(true);
            setIsUnfilled(false);
          } else if (status === 'unfilled') {
            setIsFilled(false);
            setIsUnfilled(true);
          }
        }
      }
    });

    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });

    // Initialize adsbygoogle
    if (!isLoadedRef.current) {
      try {
        if (typeof window !== 'undefined' && !el.getAttribute('data-adsbygoogle-status')) {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          isLoadedRef.current = true;
        }
      } catch (e) {
        console.warn('AdSense unit notice:', e);
      }
    }

    return () => observer.disconnect();
  }, []);

  // During review or if no ad is available, completely hide to prevent policy violations
  if (isUnfilled) {
    return null;
  }

  return (
    <div
      className={`google-ad-container w-full overflow-hidden text-center transition-opacity duration-300 ${
        isFilled ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden m-0 p-0'
      } ${className}`}
    >
      {showLabel && isFilled && (
        <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 select-none">
          Advertisement
        </span>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-2526772201379380"
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default GoogleAd;
