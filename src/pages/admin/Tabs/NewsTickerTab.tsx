import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    Plus,
    Trash2,
    Edit3,
    Check,
    X,
    ExternalLink,
    RefreshCw,
    Radio,
    Flame,
    Zap,
    Tag,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import {
    NewsTickerItem,
    getNewsTickerItems,
    saveNewsTickerItems,
    createNewsTickerItem,
    updateNewsTickerItem,
    deleteNewsTickerItem,
    toggleNewsTickerItem,
    resetNewsTickerToDefault,
    NEWS_TICKER_CHANGED_EVENT,
    restoreTicker
} from '../../../utils/newsTicker';

interface NewsTickerTabProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const NewsTickerTab: React.FC<NewsTickerTabProps> = ({ showToast }) => {
    const [items, setItems] = useState<NewsTickerItem[]>(() => getNewsTickerItems());
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form inputs
    const [text, setText] = useState('');
    const [tag, setTag] = useState('');
    const [tagColor, setTagColor] = useState<NewsTickerItem['tagColor']>('blue');
    const [link, setLink] = useState('');
    const [isExternal, setIsExternal] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const refreshItems = () => {
        setItems(getNewsTickerItems());
    };

    useEffect(() => {
        const handler = () => refreshItems();
        window.addEventListener(NEWS_TICKER_CHANGED_EVENT, handler);
        return () => window.removeEventListener(NEWS_TICKER_CHANGED_EVENT, handler);
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setText('');
        setTag('');
        setTagColor('blue');
        setLink('');
        setIsExternal(false);
        setIsActive(true);
    };

    const handleStartEdit = (item: NewsTickerItem) => {
        setEditingId(item.id);
        setText(item.text);
        setTag(item.tag || '');
        setTagColor(item.tagColor || 'blue');
        setLink(item.link || '');
        setIsExternal(!!item.isExternal);
        setIsActive(item.isActive);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) {
            showToast('Please enter an update message or headline.', 'error');
            return;
        }

        if (editingId) {
            updateNewsTickerItem(editingId, {
                text: text.trim(),
                tag: tag.trim() || undefined,
                tagColor,
                link: link.trim() || undefined,
                isExternal,
                isActive
            });
            showToast('News ticker update saved successfully!', 'success');
        } else {
            createNewsTickerItem({
                text: text.trim(),
                tag: tag.trim() || undefined,
                tagColor,
                link: link.trim() || undefined,
                isExternal,
                isActive
            });
            showToast('New update announcement added to ticker!', 'success');
        }

        resetForm();
    };

    const handleDelete = (id: string, itemText: string) => {
        if (window.confirm(`Delete announcement: "${itemText.substring(0, 40)}..."?`)) {
            deleteNewsTickerItem(id);
            if (editingId === id) resetForm();
            showToast('Announcement removed.', 'info');
        }
    };

    const handleToggle = (id: string) => {
        toggleNewsTickerItem(id);
        showToast('Ticker item status toggled.', 'info');
    };

    const handleResetDefaults = () => {
        if (window.confirm('Reset ticker to default recommended website announcements?')) {
            resetNewsTickerToDefault();
            restoreTicker();
            resetForm();
            showToast('News ticker reset to default updates!', 'success');
        }
    };

    const getTagClasses = (color?: NewsTickerItem['tagColor']) => {
        switch (color) {
            case 'emerald':
                return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
            case 'rose':
                return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
            case 'amber':
                return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
            case 'purple':
                return 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30';
            case 'blue':
            default:
                return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in text-left">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                            <Radio className="w-5 h-5 animate-pulse" />
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                            Website Latest Updates (News Scrolling Bar)
                        </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Control the live horizontal scrolling announcements bar visible right below the top navigation bar.
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Restore Defaults</span>
                    </button>
                </div>
            </div>

            {/* Live Ticker Preview */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>Live Ticker Preview</span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                        {items.filter(i => i.isActive).length} active items
                    </span>
                </div>

                {/* Simulated Ticker Preview Bar */}
                <div className="w-full bg-[#081226] border border-red-950 rounded-xl px-3 h-10 flex items-center overflow-hidden">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#154ED0] text-white text-[10px] font-extrabold uppercase shrink-0 mr-3 border-r border-white/10 pr-3">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
                        </span>
                        <span>Latest Updates</span>
                    </div>

                    <div className="overflow-x-auto whitespace-nowrap text-xs text-slate-200 flex items-center space-x-6 scrollbar-none py-1">
                        {items.filter(i => i.isActive).map(item => (
                            <span key={item.id} className="inline-flex items-center space-x-2">
                                {item.tag && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getTagClasses(item.tagColor)}`}>
                                        {item.tag}
                                    </span>
                                )}
                                <span>{item.text}</span>
                                <span className="text-red-400/50">✦</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Form & List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Create / Edit Form */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                            {editingId ? <Edit3 className="w-4 h-4 text-red-600" /> : <Plus className="w-4 h-4 text-red-600" />}
                            <span>{editingId ? 'Edit Announcement' : 'Add New Announcement'}</span>
                        </h3>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center space-x-1"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSave} className="space-y-4">
                        {/* Announcement Text */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Update Message / Headline <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={2}
                                required
                                placeholder="e.g. Summer 2026 Batch Applications Open — Apply for Free Task-Based Virtual Internships!"
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        {/* Tag & Color */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Tag Label (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    placeholder="e.g. NEW, BATCH 2026"
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Tag Color
                                </label>
                                <select
                                    value={tagColor}
                                    onChange={(e: any) => setTagColor(e.target.value)}
                                    className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    <option value="blue">Blue (Default)</option>
                                    <option value="emerald">Emerald Green (New / Success)</option>
                                    <option value="rose">Rose Red (Hot / Urgent)</option>
                                    <option value="amber">Amber Gold (Official / Notice)</option>
                                    <option value="purple">Purple (Featured)</option>
                                </select>
                            </div>
                        </div>

                        {/* Link / URL */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Action Link / Path (Optional)
                            </label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="e.g. /internships, /domains, /verify"
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        {/* Checkbox Options */}
                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="font-medium">Active (Visible in ticker)</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={isExternal}
                                    onChange={(e) => setIsExternal(e.target.checked)}
                                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="font-medium">External link (opens tab)</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition flex items-center justify-center space-x-2"
                        >
                            {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            <span>{editingId ? 'Update Announcement' : 'Add Announcement to Ticker'}</span>
                        </button>
                    </form>
                </div>

                {/* List of Existing Items */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Active & Inactive Announcements ({items.length})
                        </h3>
                        <span className="text-xs text-slate-400">
                            Click toggle switch to show/hide
                        </span>
                    </div>

                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                        {items.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-400">
                                No announcements found. Add one above or click Restore Defaults.
                            </div>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                                        item.isActive
                                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 shadow-sm'
                                            : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-60'
                                    }`}
                                >
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            {item.tag && (
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wide ${getTagClasses(
                                                        item.tagColor
                                                    )}`}
                                                >
                                                    {item.tag}
                                                </span>
                                            )}
                                            {item.link && (
                                                <span className="text-[10px] text-red-600 dark:text-red-400 truncate max-w-[140px] flex items-center space-x-0.5">
                                                    <span>{item.link}</span>
                                                    {item.isExternal && <ArrowUpRight className="w-2.5 h-2.5" />}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                                            {item.text}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleToggle(item.id)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                                item.isActive
                                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {item.isActive ? 'Active' : 'Hidden'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(item)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition"
                                            title="Edit announcement"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id, item.text)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition"
                                            title="Delete announcement"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsTickerTab;
