export interface NewsTickerItem {
    id: string;
    text: string;
    tag?: string;
    tagColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
    link?: string;
    isExternal?: boolean;
    isActive: boolean;
    createdAt?: string;
}

const STORAGE_KEY = 'vinix_news_ticker_items_v1';
export const NEWS_TICKER_CHANGED_EVENT = 'vinix_news_ticker_changed';
const TICKER_DISMISSED_KEY = 'vinix_ticker_dismissed_session';

export const DEFAULT_NEWS_ITEMS: NewsTickerItem[] = [
    {
        id: 'news-batch-2026',
        text: 'Summer & Monsoon 2026 Batch Admissions Open — Apply for Free Task-Based Virtual Internships!',
        tag: 'BATCH 2026',
        tagColor: 'emerald',
        link: '/internships',
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'news-verified-certs',
        text: '100% Free Virtual Internships with Verifiable QR Certificates, Official Student ID & LOR.',
        tag: 'FEATURED',
        tagColor: 'blue',
        link: '/internships',
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'news-ai-track',
        text: 'New Track Launched: AI & Machine Learning Specialization with Generative AI & LLM Live Projects!',
        tag: 'NEW',
        tagColor: 'rose',
        link: '/domains',
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'news-instant-credentials',
        text: 'Instant Digital Student ID Card & Official Offer Letter on Registration.',
        tag: 'INSTANT',
        tagColor: 'purple',
        link: '/register',
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'news-msme-verification',
        text: 'Official MSME Registered Certification with Tamper-Proof QR Code Verification Portal.',
        tag: 'VERIFIED',
        tagColor: 'amber',
        link: '/verify',
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'news-codelab-feature',
        text: 'Practice in Vinix CodeLab: In-browser live editor with auto-linting & submission checks.',
        tag: 'CODELAB',
        tagColor: 'blue',
        link: '/codelab',
        isActive: true,
        createdAt: new Date().toISOString()
    }
];

export function getNewsTickerItems(): NewsTickerItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Failed to parse news ticker items:', e);
    }

    // Default fallback & initialize
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NEWS_ITEMS));
    } catch {
        // ignore storage errors
    }
    return DEFAULT_NEWS_ITEMS;
}

export function saveNewsTickerItems(items: NewsTickerItem[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent(NEWS_TICKER_CHANGED_EVENT));
    } catch (e) {
        console.error('Failed to save news ticker items:', e);
    }
}

export function createNewsTickerItem(item: Omit<NewsTickerItem, 'id' | 'createdAt'>): NewsTickerItem {
    const items = getNewsTickerItems();
    const newItem: NewsTickerItem = {
        ...item,
        id: 'news_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString()
    };
    saveNewsTickerItems([newItem, ...items]);
    return newItem;
}

export function updateNewsTickerItem(id: string, updates: Partial<NewsTickerItem>) {
    const items = getNewsTickerItems();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
        items[index] = { ...items[index], ...updates };
        saveNewsTickerItems(items);
    }
}

export function deleteNewsTickerItem(id: string) {
    const items = getNewsTickerItems();
    const filtered = items.filter((i) => i.id !== id);
    saveNewsTickerItems(filtered);
}

export function toggleNewsTickerItem(id: string) {
    const items = getNewsTickerItems();
    const index = items.findIndex((i) => i.id === id);
    if (index !== -1) {
        items[index].isActive = !items[index].isActive;
        saveNewsTickerItems(items);
    }
}

export function resetNewsTickerToDefault(): NewsTickerItem[] {
    saveNewsTickerItems(DEFAULT_NEWS_ITEMS);
    return DEFAULT_NEWS_ITEMS;
}

export function isTickerDismissed(): boolean {
    return sessionStorage.getItem(TICKER_DISMISSED_KEY) === 'true';
}

export function dismissTicker() {
    sessionStorage.setItem(TICKER_DISMISSED_KEY, 'true');
    window.dispatchEvent(new CustomEvent(NEWS_TICKER_CHANGED_EVENT));
}

export function restoreTicker() {
    sessionStorage.removeItem(TICKER_DISMISSED_KEY);
    window.dispatchEvent(new CustomEvent(NEWS_TICKER_CHANGED_EVENT));
}
