import React, { useState, useEffect, useRef } from 'react';
import {
    Megaphone, Image as ImageIcon, Link as LinkIcon, Eye, Trash2, Edit3,
    Check, X, Upload, ExternalLink, Plus, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
    PromoPopup,
    getPromoPopups,
    createPromoPopup,
    updatePromoPopup,
    deletePromoPopup,
    setPromoPopupActive,
    savePromoPopups,
    compressImageFile,
    POPUP_CHANGED_EVENT
} from '../../../utils/promoPopup';

interface PromoPopupTabProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onPreviewPopup?: (popup: PromoPopup) => void;
}

export const PromoPopupTab: React.FC<PromoPopupTabProps> = ({
    showToast,
    onPreviewPopup
}) => {
    const [popups, setPopups] = useState<PromoPopup[]>(() => getPromoPopups());
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form States
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkLabel, setLinkLabel] = useState('Learn More');
    const [isActive, setIsActive] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const refreshPopups = () => {
        setPopups(getPromoPopups());
    };

    useEffect(() => {
        const handler = () => refreshPopups();
        window.addEventListener(POPUP_CHANGED_EVENT, handler);
        return () => window.removeEventListener(POPUP_CHANGED_EVENT, handler);
    }, []);

    const [isCompressing, setIsCompressing] = useState(false);

    // Handle Image File Selection & High-efficiency Canvas Compression
    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsCompressing(true);
            showToast('Optimizing image for fast popup loading...', 'info');
            const compressed = await compressImageFile(file, 1100, 0.85);
            setImagePreview(compressed);
            setImageUrl(compressed);
            showToast(`Image "${file.name}" ready!`, 'success');
        } catch (err: any) {
            console.error('Failed to compress image:', err);
            showToast('Failed to load image: ' + (err.message || 'Error'), 'error');
        } finally {
            setIsCompressing(false);
        }
    };

    // Reset Form
    const handleResetForm = () => {
        setEditingId(null);
        setTitle('');
        setDescription('');
        setImageUrl('');
        setLinkUrl('');
        setLinkLabel('Learn More');
        setIsActive(false);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Load Popup into Form for Editing
    const handleEditClick = (popup: PromoPopup) => {
        setEditingId(popup.id);
        setTitle(popup.title);
        setDescription(popup.description);
        setImageUrl(popup.imageUrl);
        setImagePreview(popup.imageUrl);
        setLinkUrl(popup.linkUrl);
        setLinkLabel(popup.linkLabel || 'Learn More');
        setIsActive(popup.isActive);

        if (formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Save (Create or Update)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            showToast('Please enter a popup title', 'error');
            return;
        }

        const finalImage = imagePreview || imageUrl.trim();
        if (!finalImage) {
            showToast('Please upload an image or provide an image URL', 'error');
            return;
        }

        if (editingId) {
            // Update existing
            updatePromoPopup(editingId, {
                title: title.trim(),
                description: description.trim(),
                imageUrl: finalImage,
                linkUrl: linkUrl.trim() || '/internships',
                linkLabel: linkLabel.trim() || 'Learn More',
                isActive
            });
            showToast('Promo popup updated successfully!', 'success');
        } else {
            // Create new and automatically make active
            createPromoPopup({
                title: title.trim(),
                description: description.trim(),
                imageUrl: finalImage,
                linkUrl: linkUrl.trim() || '/internships',
                linkLabel: linkLabel.trim() || 'Learn More',
                isActive: true // active immediately
            });
            showToast('New popup created and is now LIVE on your website!', 'success');
        }

        handleResetForm();
        refreshPopups();
    };

    // Toggle Active Status
    const handleToggleActive = (id: string, currentActive: boolean) => {
        const nextState = !currentActive;
        setPromoPopupActive(id, nextState);
        showToast(
            nextState
                ? 'Popup activated! It is now LIVE on the website.'
                : 'Popup deactivated.',
            nextState ? 'success' : 'info'
        );
        refreshPopups();
    };

    // Delete Popup
    const handleDelete = (id: string, popupTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${popupTitle}"?`)) {
            deletePromoPopup(id);
            if (editingId === id) handleResetForm();
            showToast('Popup deleted permanently.', 'info');
            refreshPopups();
        }
    };

    // Clear All Popups
    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to delete ALL popups?')) {
            savePromoPopups([]);
            handleResetForm();
            showToast('All popups deleted.', 'info');
            refreshPopups();
        }
    };

    return (
        <div className="space-y-8 pb-12 text-left animate-fade-in-up">
            {/* Form Section: "New Popup" */}
            <div
                ref={formRef}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
            >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center space-x-2">
                            <Megaphone className="w-5 h-5 text-[#154ED0]" />
                            <span>{editingId ? 'Edit Popup' : 'New Popup'}</span>
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Create promotional banner popups to display special offers, announcements, and coupon codes to students.
                        </p>
                    </div>

                    {editingId && (
                        <button
                            type="button"
                            onClick={handleResetForm}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                    {/* Upload Image */}
                    <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Upload Image
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageFileChange}
                                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#0F286E] file:text-white hover:file:bg-[#154ED0] file:cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Or Image URL */}
                    <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Or Image URL
                        </label>
                        <input
                            type="text"
                            placeholder="https://..."
                            value={imageUrl.startsWith('data:') ? '' : imageUrl}
                            onChange={(e) => {
                                setImageUrl(e.target.value);
                                setImagePreview(e.target.value || null);
                            }}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>

                    {/* Image Preview thumbnail if available */}
                    {imagePreview && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
                            <div className="w-24 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 border border-slate-300 dark:border-slate-600">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={() => setImagePreview(null)}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                    Image Selected & Ready
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">
                                    This image banner will appear at the top of the popup modal.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setImagePreview(null);
                                    setImageUrl('');
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Title
                        </label>
                        <input
                            type="text"
                            placeholder="Summer Sale!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Limited time offer..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition leading-relaxed"
                        />
                    </div>

                    {/* Link URL and Link Label in 2-column row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Link URL
                            </label>
                            <input
                                type="text"
                                placeholder="https://... or /internships"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                                Link Label
                            </label>
                            <input
                                type="text"
                                placeholder="Learn More"
                                value={linkLabel}
                                onChange={(e) => setLinkLabel(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition font-semibold"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center space-x-3">
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-[#0F286E] hover:bg-[#154ED0] text-white text-xs font-bold shadow-md transition active:scale-95 flex items-center space-x-2"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{editingId ? 'Update Popup' : 'Create Popup'}</span>
                        </button>

                        {imagePreview && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (onPreviewPopup) {
                                        onPreviewPopup({
                                            id: 'preview',
                                            title: title || 'Popup Title',
                                            description: description || 'Popup description text here...',
                                            imageUrl: imagePreview,
                                            linkUrl: linkUrl || '#',
                                            linkLabel: linkLabel || 'Learn More',
                                            isActive: true,
                                            createdAt: 'Now',
                                            updatedAt: 'Now'
                                        });
                                    } else {
                                        showToast('Popup preview shown', 'info');
                                    }
                                }}
                                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-1.5"
                            >
                                <Eye className="w-4 h-4 text-blue-600" />
                                <span>Preview In-Page</span>
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* List of Popups (Matching exact cards from user's image) */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Active & Created Popups ({popups.length})
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            The active popup is shown automatically to students and visitors across the website.
                        </p>
                    </div>

                    {popups.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center space-x-1 self-start sm:self-auto"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete All Popups</span>
                        </button>
                    )}
                </div>

                {popups.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center space-y-2">
                        <Megaphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                            No Popups Created
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            Use the form above to upload an image, enter title and link, then click "Create Popup" to display it on your website.
                        </p>
                    </div>
                ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {popups.map((popup) => (
                        <div
                            key={popup.id}
                            className={`bg-white dark:bg-slate-900 rounded-3xl border ${
                                popup.isActive
                                    ? 'border-blue-500/80 shadow-md ring-2 ring-blue-500/10'
                                    : 'border-slate-200/80 dark:border-slate-800 shadow-sm'
                            } overflow-hidden flex flex-col justify-between transition-all`}
                        >
                            <div>
                                {/* Banner Image Header */}
                                <div className="h-52 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                                    <img
                                        src={popup.imageUrl}
                                        alt={popup.title}
                                        className="w-full h-full object-cover"
                                        onError={(e: any) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80';
                                        }}
                                    />
                                    {popup.isActive && (
                                        <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500 text-white font-bold text-[10px] rounded-full uppercase tracking-wider shadow-md flex items-center space-x-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                            <span>Live On Website</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Details */}
                                <div className="p-5 sm:p-6 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                            {popup.title}
                                        </h4>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                                                popup.isActive
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                            }`}
                                        >
                                            {popup.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                                        {popup.description}
                                    </p>

                                    {popup.linkUrl && (
                                        <a
                                            href={popup.linkUrl}
                                            target={popup.linkUrl.startsWith('http') ? '_blank' : '_self'}
                                            rel="noreferrer"
                                            className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>{popup.linkLabel || 'Learn More'}</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons: Edit, Activate/Deactivate, Delete */}
                            <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => handleEditClick(popup)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleToggleActive(popup.id, popup.isActive)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                                        popup.isActive
                                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200'
                                            : 'bg-[#0F286E] hover:bg-[#154ED0] text-white shadow-sm'
                                    }`}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{popup.isActive ? 'Deactivate' : 'Activate'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(popup.id, popup.title)}
                                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 text-xs font-bold transition ml-auto flex items-center space-x-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
        </div>
    );
};

export default PromoPopupTab;
