import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string; // e.g. "/about" or "/"
  ogType?: string;
  ogImage?: string;
  schema?: Record<string, any> | Array<Record<string, any>>;
  noindex?: boolean;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage = 'https://www.vinix.online/vinix-logo.png',
  schema,
  noindex = false,
}) => {
  useEffect(() => {
    // 1. Format & Set Document Title
    const formattedTitle = title.includes('VINIX') ? title : `${title} | VINIX`;
    document.title = formattedTitle;

    // Helper to safely set or create a meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}='${name}']`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Set Meta Description
    setMeta('description', description);

    // 3. Set Robots Directive
    setMeta(
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 4. Set Self-Referencing Canonical Tag
    const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const cleanCanonical =
      normalizedPath === '/'
        ? 'https://www.vinix.online/'
        : `https://www.vinix.online${normalizedPath.replace(/\/$/, '')}`;

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', cleanCanonical);

    // 5. OpenGraph Tags
    setMeta('og:title', formattedTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:url', cleanCanonical, true);
    setMeta('og:type', ogType, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:site_name', 'VINIX', true);

    // 6. Twitter Card Tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', formattedTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:url', cleanCanonical);
    setMeta('twitter:image', ogImage);

    // 7. Route-Specific JSON-LD Structured Data
    const scriptId = 'dynamic-route-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement;
    if (schema) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(schema);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, canonicalPath, ogType, ogImage, schema, noindex]);

  return null;
};

export default SEO;
