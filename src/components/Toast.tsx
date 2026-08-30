import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastProps {
    toast: ToastItem;
    onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 flex-shrink-0" />,
    info: <Info className="w-4 h-4 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200',
    error: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200',
    info: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200',
};

const ICON_STYLES: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    info: 'text-blue-500',
    warning: 'text-amber-500',
};

const PROGRESS_STYLES: Record<ToastType, string> = {
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    info: 'bg-blue-400',
    warning: 'bg-amber-400',
};

const ToastCard: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const DURATION = 4000;

    useEffect(() => {
        // Slide in
        const show = setTimeout(() => setVisible(true), 10);

        // Progress bar countdown
        const start = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.max(0, 100 - (elapsed / DURATION) * 100));
        }, 30);

        // Auto-dismiss
        const dismiss = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 350);
        }, DURATION);

        return () => {
            clearTimeout(show);
            clearTimeout(dismiss);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [toast.id, onDismiss]);

    return (
        <div
            className={`relative overflow-hidden rounded-xl border shadow-lg text-sm font-medium flex items-start gap-3 px-4 py-3 w-full max-w-sm transition-all duration-350 ${STYLES[toast.type]} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
            style={{ transition: 'opacity 0.35s ease, transform 0.35s ease' }}
        >
            <span className={`mt-0.5 ${ICON_STYLES[toast.type]}`}>{ICONS[toast.type]}</span>
            <p className="flex-1 leading-snug text-[13px]">{toast.message}</p>
            <button
                onClick={() => {
                    setVisible(false);
                    setTimeout(() => onDismiss(toast.id), 350);
                }}
                className="opacity-50 hover:opacity-100 transition mt-0.5 flex-shrink-0"
            >
                <X className="w-3.5 h-3.5" />
            </button>
            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-0.5 ${PROGRESS_STYLES[toast.type]} transition-all`}
                style={{ width: `${progress}%`, transition: 'width 30ms linear' }}
            />
        </div>
    );
};

/* ─── Hook ─────────────────────────────────────────────────────────────────── */
export function useToast() {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return { toasts, showToast, dismiss };
}

/* ─── Container ─────────────────────────────────────────────────────────────── */
interface ToastContainerProps {
    toasts: ToastItem[];
    dismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, dismiss }) => {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 items-end pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastCard toast={t} onDismiss={dismiss} />
                </div>
            ))}
        </div>
    );
};
