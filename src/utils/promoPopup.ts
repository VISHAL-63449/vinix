export interface PromoPopup {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    linkLabel: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'vinix_promo_popups_v3';
const DISMISSED_KEY_PREFIX = 'vinix_popup_dismissed_';
export const POPUP_CHANGED_EVENT = 'vinix_promo_popup_changed';

// Initial clean default (only if user has never used popup system)
const INITIAL_SETUP_KEY = 'vinix_promo_initialized_v3';

// Automatically compress an uploaded image file using an HTML5 Canvas to guarantee <150KB size
export async function compressImageFile(file: File, maxDimension = 1100, quality = 0.85): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(e.target?.result as string);
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Export as webp or jpeg for ultra-lightweight size
                const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const compressedDataUrl = canvas.toDataURL(mimeType, quality);
                resolve(compressedDataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image for compression'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

// Get all popups. If user has deleted everything, returns [] (does NOT restore deleted defaults!)
export function getPromoPopups(): PromoPopup[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }

        // Migrate from v2 if exists
        const oldV2 = localStorage.getItem('vinix_promo_popups_v2');
        if (oldV2) {
            try {
                const parsedV2 = JSON.parse(oldV2);
                if (Array.isArray(parsedV2)) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedV2));
                    return parsedV2;
                }
            } catch {
                // ignore
            }
        }

        // Only for first-ever setup, if nothing ever initialized
        const hasInit = localStorage.getItem(INITIAL_SETUP_KEY);
        if (!hasInit) {
            localStorage.setItem(INITIAL_SETUP_KEY, 'true');
            const defaultPopups: PromoPopup[] = [
                {
                    id: 'popup_batch_1',
                    title: 'Skyrovix Batch 1 - Full Stack Development Internship',
                    description: 'We are excited to announce Batch 1 of our 3-Month Full Stack Development Internship! 🔥 50+ Real-World Projects, Git & GitHub, Live Deployment, and 1-on-1 Mentorship.',
                    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
                    linkUrl: '/internships',
                    linkLabel: 'Learn More',
                    isActive: false, // Inactive by default so user's own uploads take priority!
                    createdAt: new Date().toLocaleDateString('en-GB'),
                    updatedAt: new Date().toLocaleDateString('en-GB')
                }
            ];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPopups));
            return defaultPopups;
        }

        return [];
    } catch (e) {
        console.error('Failed to parse promo popups:', e);
        return [];
    }
}

export function savePromoPopups(popups: PromoPopup[]): void {
    try {
        localStorage.setItem(INITIAL_SETUP_KEY, 'true');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(popups));
        // Clear v2 key to prevent fallback confusion
        localStorage.removeItem('vinix_promo_popups_v2');
        // Dispatch window event so any open tab or component updates immediately
        window.dispatchEvent(new Event(POPUP_CHANGED_EVENT));
    } catch (e) {
        console.error('Failed to save promo popups:', e);
    }
}

export function getActivePromoPopup(): PromoPopup | null {
    const popups = getPromoPopups();
    return popups.find(p => p.isActive) || null;
}

// Create new popup and make it active
export function createPromoPopup(data: Omit<PromoPopup, 'id' | 'createdAt' | 'updatedAt'>): PromoPopup {
    const popups = getPromoPopups();
    const newId = `popup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Clear dismiss history for this new popup so visitors and admin see it immediately
    clearPopupDismiss(newId);

    const newPopup: PromoPopup = {
        ...data,
        id: newId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toLocaleDateString('en-GB'),
        updatedAt: new Date().toLocaleDateString('en-GB')
    };

    // If new popup is active, ensure all others are inactive
    let updatedList = popups;
    if (newPopup.isActive) {
        updatedList = popups.map(p => ({ ...p, isActive: false }));
    }

    const result = [newPopup, ...updatedList];
    savePromoPopups(result);
    return newPopup;
}

export function updatePromoPopup(id: string, updates: Partial<PromoPopup>): void {
    const popups = getPromoPopups();
    if (updates.isActive) {
        clearPopupDismiss(id);
    }

    const updated = popups.map(p => {
        if (p.id === id) {
            return {
                ...p,
                ...updates,
                updatedAt: new Date().toLocaleDateString('en-GB')
            };
        }
        // If activating this one, deactivate others
        if (updates.isActive) {
            return { ...p, isActive: false };
        }
        return p;
    });
    savePromoPopups(updated);
}

// Truly delete a popup
export function deletePromoPopup(id: string): void {
    const popups = getPromoPopups();
    const filtered = popups.filter(p => p.id !== id);
    clearPopupDismiss(id);
    savePromoPopups(filtered);
}

// Activate or Deactivate
export function setPromoPopupActive(id: string, activate: boolean): void {
    const popups = getPromoPopups();
    if (activate) {
        clearPopupDismiss(id);
    }

    const updated = popups.map(p => {
        if (p.id === id) {
            return { ...p, isActive: activate, updatedAt: new Date().toLocaleDateString('en-GB') };
        }
        // If activating this one, all others must be false
        if (activate) {
            return { ...p, isActive: false };
        }
        return p;
    });
    savePromoPopups(updated);
}

export function isPopupDismissed(popupId: string): boolean {
    try {
        const item = sessionStorage.getItem(`${DISMISSED_KEY_PREFIX}${popupId}`);
        if (item === 'true') return true;
        const localDismiss = localStorage.getItem(`${DISMISSED_KEY_PREFIX}${popupId}`);
        if (localDismiss) {
            const exp = parseInt(localDismiss, 10);
            if (!isNaN(exp) && Date.now() < exp) return true;
        }
        return false;
    } catch {
        return false;
    }
}

export function dismissPopup(popupId: string, rememberForHours = 24): void {
    try {
        sessionStorage.setItem(`${DISMISSED_KEY_PREFIX}${popupId}`, 'true');
        const exp = Date.now() + rememberForHours * 60 * 60 * 1000;
        localStorage.setItem(`${DISMISSED_KEY_PREFIX}${popupId}`, String(exp));
    } catch (e) {
        console.warn('Failed to record dismiss:', e);
    }
}

export function clearPopupDismiss(popupId: string): void {
    try {
        sessionStorage.removeItem(`${DISMISSED_KEY_PREFIX}${popupId}`);
        localStorage.removeItem(`${DISMISSED_KEY_PREFIX}${popupId}`);
    } catch {
        // ignore
    }
}
