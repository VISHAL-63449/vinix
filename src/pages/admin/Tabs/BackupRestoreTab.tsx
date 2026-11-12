import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Database, FolderArchive, FileText, HardDrive, Calendar, Activity,
    Download, RotateCcw, Trash2, Search, RefreshCw, Upload, CheckCircle2,
    AlertCircle, Clock, ShieldCheck, Settings, Users, Sparkles, X, FileSpreadsheet,
    Server, ChevronRight, Check, ArrowDownToLine
} from 'lucide-react';
import {
    BackupItem,
    AutoBackupConfig,
    ActivityLog,
    createSystemBackup,
    restoreFromBackupFile,
    getBackupHistory,
    deleteBackupFromHistory,
    getAutoBackupConfig,
    saveAutoBackupConfig,
    getBackupActivity,
    formatBytes
} from '../../../utils/backupRestore';

interface BackupRestoreTabProps {
    adminName?: string;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const BackupRestoreTab: React.FC<BackupRestoreTabProps> = ({
    adminName = 'Vishal R',
    showToast
}) => {
    // Backups History & Stats State
    const [backups, setBackups] = useState<BackupItem[]>(() => getBackupHistory());
    const [activities, setActivities] = useState<ActivityLog[]>(() => getBackupActivity());
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Database' | 'Students' | 'Full' | 'Files'>('All');
    
    // Auto Backup Config State
    const [autoConfig, setAutoConfig] = useState<AutoBackupConfig>(() => getAutoBackupConfig());

    // Creation Modal & Progress States
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [creatingType, setCreatingType] = useState<'Database' | 'Students' | 'Full' | 'Files' | null>(null);
    const [exportProgressText, setExportProgressText] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    // Upload & Restore States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFile, setUploadedFile] = useState<{ file: File; content: string } | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreProgress, setRestoreProgress] = useState<{ stage: string; percent: number; currentTable?: string; processed?: number; total?: number } | null>(null);

    // Confirmation Modal for Restore
    const [confirmRestoreItem, setConfirmRestoreItem] = useState<BackupItem | null>(null);

    // Refresh Backups
    const refreshBackups = () => {
        setBackups(getBackupHistory());
        setActivities(getBackupActivity());
        showToast('Backup history refreshed', 'info');
    };

    // Calculate Storage & Top Stats
    const totalStorageBytes = useMemo(() => {
        return backups.reduce((sum, b) => sum + (b.sizeBytes || 0), 0);
    }, [backups]);

    const latestBackup = useMemo(() => {
        return backups.length > 0 ? backups[0] : null;
    }, [backups]);

    const largestBackup = useMemo(() => {
        if (backups.length === 0) return null;
        return [...backups].sort((a, b) => b.sizeBytes - a.sizeBytes)[0];
    }, [backups]);

    const oldestBackup = useMemo(() => {
        if (backups.length === 0) return null;
        return backups[backups.length - 1];
    }, [backups]);

    // Filtered Backups
    const filteredBackups = useMemo(() => {
        return backups.filter(b => {
            const matchesType = typeFilter === 'All' || b.type.toLowerCase() === typeFilter.toLowerCase();
            const matchesSearch = searchQuery.trim() === '' ||
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.createdBy.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [backups, typeFilter, searchQuery]);

    // Handle Quick or Modal Backup Creation
    const handleTriggerBackup = async (
        type: 'Database' | 'Students' | 'Full' | 'Files',
        format: 'sql' | 'json' | 'csv' = 'json'
    ) => {
        try {
            setIsExporting(true);
            setCreatingType(type);
            setExportProgressText(`Preparing ${type} export...`);

            const newBackup = await createSystemBackup(type, format, adminName, (msg) => {
                setExportProgressText(msg);
            });

            setBackups(getBackupHistory());
            setActivities(getBackupActivity());
            setCreateModalOpen(false);
            showToast(`Downloaded ${type} backup successfully! (${newBackup.sizeFormatted})`, 'success');
        } catch (err: any) {
            console.error('Backup creation failed:', err);
            showToast(`Backup failed: ${err.message || 'Unknown error'}`, 'error');
        } finally {
            setIsExporting(false);
            setCreatingType(null);
            setExportProgressText('');
        }
    };

    // Handle File Selection for Restore
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setUploadedFile({ file, content });
            showToast(`Selected "${file.name}" (${formatBytes(file.size)})`, 'info');
        };
        reader.onerror = () => {
            showToast('Failed to read file', 'error');
        };
        reader.readAsText(file);
    };

    // Execute Restore from Uploaded File
    const handleExecuteRestore = async () => {
        if (!uploadedFile) return;

        try {
            setIsRestoring(true);
            setRestoreProgress({ stage: 'Reading backup structure...', percent: 5 });

            const result = await restoreFromBackupFile(
                uploadedFile.content,
                uploadedFile.file.name,
                adminName,
                (status) => setRestoreProgress(status)
            );

            setActivities(getBackupActivity());
            showToast(result.message, 'success');
            setUploadedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error('Restore failed:', err);
            showToast(`Restore error: ${err.message || 'Validation failed'}`, 'error');
        } finally {
            setIsRestoring(false);
            setRestoreProgress(null);
        }
    };

    // Delete Backup
    const handleDeleteBackup = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete backup "${name}"?`)) {
            const updated = deleteBackupFromHistory(id);
            setBackups(updated);
            setActivities(getBackupActivity());
            showToast(`Deleted ${name}`, 'info');
        }
    };

    // Save Auto Backup Settings
    const handleSaveAutoConfig = () => {
        saveAutoBackupConfig(autoConfig);
        showToast('Automatic backup configuration saved!', 'success');
    };

    return (
        <div className="space-y-6 pb-12">
            {/* Header: Title, Description & Main Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Backup & Restore
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Manage system backups, restore data, and configure automatic backups
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={() => setCreateModalOpen(true)}
                        disabled={isExporting}
                        className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0F286E] hover:bg-[#154ED0] text-white text-sm font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
                    >
                        <ArrowDownToLine className="w-4 h-4" />
                        <span>{isExporting ? 'Exporting...' : 'Create Backup Now'}</span>
                    </button>
                </div>
            </div>

            {/* Top 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Backups */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            TOTAL BACKUPS
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {backups.length}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {latestBackup ? `Last: ${latestBackup.createdAt}` : 'No backups yet'}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>

                {/* Latest Backup */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            LATEST BACKUP
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate max-w-[170px]" title={latestBackup?.createdAt || 'None'}>
                            {latestBackup ? latestBackup.createdAt : 'Never'}
                        </p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            {latestBackup ? 'Database live & sync ready' : 'Ready to create'}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Calendar className="w-5 h-5" />
                    </div>
                </div>

                {/* Storage Used */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            STORAGE USED
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                            {formatBytes(totalStorageBytes)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {backups.length} backup file{backups.length === 1 ? '' : 's'}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <HardDrive className="w-5 h-5" />
                    </div>
                </div>

                {/* Auto Backup */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                            AUTO BACKUP
                        </p>
                        <div className="flex items-center space-x-1.5 mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${autoConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                {autoConfig.enabled ? 'Active' : 'Disabled'}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {autoConfig.frequency.toLowerCase()} at {autoConfig.backupTime}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Main Content: Two Columns (Left 65% / Right 35%) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols wide on desktop) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Backup Options Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div>
                            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-base">
                                <Download className="w-4 h-4 text-red-600" />
                                <h2>Backup Options</h2>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Choose the type of backup to create and download instantly
                            </p>
                        </div>

                        {/* Export progress banner if active */}
                        {isExporting && (
                            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 flex items-center space-x-3 text-red-700 dark:text-red-300 animate-pulse text-xs font-semibold">
                                <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                                <span>{exportProgressText || 'Exporting database tables...'}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Option 1: Database (SQL Dump) */}
                            <button
                                type="button"
                                disabled={isExporting}
                                onClick={() => handleTriggerBackup('Database', 'sql')}
                                className="group text-left p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-red-500 dark:hover:border-red-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-red-50/30 dark:hover:bg-red-950/20 transition flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 flex items-center justify-center">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition">
                                            Database (SQL)
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Export complete database as SQL for PostgreSQL & VPS
                                        </p>
                                    </div>
                                </div>
                                <span className="mt-4 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center space-x-1">
                                    <span>Download .SQL</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                                </span>
                            </button>

                            {/* Option 2: Students Data (JSON/CSV) */}
                            <button
                                type="button"
                                disabled={isExporting}
                                onClick={() => handleTriggerBackup('Students', 'json')}
                                className="group text-left p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition">
                                            Students Data
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            All 277+ students, enrollments, offers & certificates
                                        </p>
                                    </div>
                                </div>
                                <span className="mt-4 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                                    <span>Download .JSON</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                                </span>
                            </button>

                            {/* Option 3: Full Backup (Portable Package) */}
                            <button
                                type="button"
                                disabled={isExporting}
                                onClick={() => handleTriggerBackup('Full', 'json')}
                                className="group text-left p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                                        <FolderArchive className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition">
                                            Full Backup
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Complete system backup with everything included
                                        </p>
                                    </div>
                                </div>
                                <span className="mt-4 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                                    <span>Download Full</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Backup History Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-red-600" />
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Backup History
                                    </h2>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {filteredBackups.length} backup(s) found
                                </p>
                            </div>

                            {/* Toolbar: Search, Filter & Refresh */}
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search backups..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-red-500 text-slate-700 dark:text-slate-200 w-36 sm:w-48"
                                    />
                                </div>

                                <select
                                    value={typeFilter}
                                    onChange={(e: any) => setTypeFilter(e.target.value)}
                                    className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 font-medium"
                                >
                                    <option value="All">All Types</option>
                                    <option value="Database">Database</option>
                                    <option value="Students">Students</option>
                                    <option value="Full">Full</option>
                                    <option value="Files">Files</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={refreshBackups}
                                    title="Refresh Backup History"
                                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                        <th className="py-3 px-3">Backup Name</th>
                                        <th className="py-3 px-3">TYPE</th>
                                        <th className="py-3 px-3">Size</th>
                                        <th className="py-3 px-3">Date & Time</th>
                                        <th className="py-3 px-3">CREATED BY</th>
                                        <th className="py-3 px-3">STATUS</th>
                                        <th className="py-3 px-3 text-right">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredBackups.length > 0 ? (
                                        filteredBackups.map((bk) => (
                                            <tr key={bk.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                                                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                                                    <div className="flex items-center space-x-2.5">
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                            bk.type === 'Database'
                                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300'
                                                                : bk.type === 'Students'
                                                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300'
                                                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300'
                                                        }`}>
                                                            {bk.type === 'Database' ? <Database className="w-3.5 h-3.5" /> :
                                                             bk.type === 'Students' ? <Users className="w-3.5 h-3.5" /> :
                                                             <FolderArchive className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <span className="truncate max-w-[170px]" title={bk.name}>
                                                            {bk.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                        bk.type === 'Database'
                                                            ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900'
                                                            : bk.type === 'Students'
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                                    }`}>
                                                        {bk.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-300">
                                                    {bk.sizeFormatted}
                                                </td>
                                                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {bk.createdAt}
                                                </td>
                                                <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                                                    {bk.createdBy}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900">
                                                        <Check className="w-2.5 h-2.5" />
                                                        <span>Completed</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="inline-flex items-center space-x-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleTriggerBackup(bk.type, bk.format || 'json')}
                                                            title="Download this backup"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmRestoreItem(bk)}
                                                            title="Restore this backup"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteBackup(bk.id, bk.name)}
                                                            title="Delete backup record"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Database className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                    <p className="font-semibold text-slate-600 dark:text-slate-400">
                                                        No backups found
                                                    </p>
                                                    <p className="text-[11px] max-w-sm">
                                                        Create your first system or student data backup above to secure all records.
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTriggerBackup('Database', 'sql')}
                                                        className="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                                                    >
                                                        Create Initial Database Backup
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (1 Col wide on desktop) */}
                <div className="space-y-6">
                    {/* Storage Overview Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                            <HardDrive className="w-4 h-4 text-purple-600" />
                            <h3>Storage</h3>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Total Storage Used</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{formatBytes(totalStorageBytes)}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Backup Files</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{backups.length}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400">Largest Backup</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{largestBackup?.sizeFormatted || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between py-1">
                                <span className="text-slate-500 dark:text-slate-400">Oldest Backup</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{oldestBackup?.createdAt || '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Restore from Upload Card (VPS / Migration System) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        <div>
                            <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                                <Upload className="w-4 h-4 text-amber-600" />
                                <h3>Restore from Upload</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Upload a backup JSON or SQL file to restore on local or future VPS
                            </p>
                        </div>

                        {/* File Selector */}
                        <div className="space-y-3">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.sql,.csv"
                                onChange={handleFileSelect}
                                className="hidden"
                                id="backup-file-upload"
                            />
                            <label
                                htmlFor="backup-file-upload"
                                className="w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-red-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 transition text-center"
                            >
                                <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                                    {uploadedFile ? uploadedFile.file.name : 'Choose File'}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-0.5">
                                    {uploadedFile ? `${formatBytes(uploadedFile.file.size)} selected` : 'Supports .json, .sql backup files'}
                                </span>
                            </label>

                            {/* Restore Action Button & Progress */}
                            {uploadedFile && (
                                <div className="space-y-2 pt-1">
                                    <button
                                        type="button"
                                        disabled={isRestoring}
                                        onClick={handleExecuteRestore}
                                        className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                                    >
                                        <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                                        <span>{isRestoring ? 'Restoring Records...' : 'Start Restore to Database'}</span>
                                    </button>

                                    {isRestoring && restoreProgress && (
                                        <div className="space-y-1.5 pt-1">
                                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                <span>{restoreProgress.stage}</span>
                                                <span>{restoreProgress.percent}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                                                    style={{ width: `${restoreProgress.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Automatic Backup Configuration */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                            <Settings className="w-4 h-4 text-red-600" />
                            <h3>Automatic Backup</h3>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            {/* Enable Auto Backup Switch */}
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    Enable Auto Backup
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setAutoConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        autoConfig.enabled ? 'bg-[#0F286E]' : 'bg-slate-300 dark:bg-slate-700'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            autoConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            {/* Frequency */}
                            <div>
                                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                                    Frequency
                                </label>
                                <select
                                    value={autoConfig.frequency}
                                    onChange={(e: any) => setAutoConfig(prev => ({ ...prev, frequency: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-200 font-semibold"
                                >
                                    <option value="Hourly">Hourly</option>
                                    <option value="Daily">Daily</option>
                                    <option value="Weekly">Weekly</option>
                                    <option value="Monthly">Monthly</option>
                                </select>
                            </div>

                            {/* Backup Time */}
                            <div>
                                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                                    Backup Time
                                </label>
                                <input
                                    type="time"
                                    value={autoConfig.backupTime}
                                    onChange={(e) => setAutoConfig(prev => ({ ...prev, backupTime: e.target.value }))}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-200 font-semibold"
                                />
                            </div>

                            {/* Retention */}
                            <div>
                                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
                                    Retention (number of backups)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={autoConfig.retentionCount}
                                    onChange={(e) => setAutoConfig(prev => ({ ...prev, retentionCount: parseInt(e.target.value) || 30 }))}
                                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-200 font-semibold"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Oldest backups beyond this count are auto-deleted
                                </p>
                            </div>

                            {/* Save Button */}
                            <button
                                type="button"
                                onClick={handleSaveAutoConfig}
                                className="w-full py-2.5 px-3 rounded-xl bg-[#0F286E] hover:bg-[#154ED0] text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5"
                            >
                                <SaveIcon className="w-3.5 h-3.5" />
                                <span>Save Configuration</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity Log */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-sm">
                            <Activity className="w-4 h-4 text-emerald-600" />
                            <h3>Recent Activity</h3>
                        </div>

                        <div className="space-y-3 text-xs">
                            {activities.slice(0, 5).map((act) => (
                                <div key={act.id} className="flex items-start space-x-2.5">
                                    <div className="mt-0.5">
                                        {act.type === 'create' ? <div className="w-2 h-2 rounded-full bg-red-500" /> :
                                         act.type === 'restore' ? <div className="w-2 h-2 rounded-full bg-amber-500" /> :
                                         act.type === 'delete' ? <div className="w-2 h-2 rounded-full bg-rose-500" /> :
                                         <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                                            {act.action}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                            {act.user} • {act.timestamp}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: "Create Backup Now" Dialog */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center space-x-2.5">
                                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                                    <Download className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Create New Backup
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Select the backup format to download to your device
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Options List */}
                        <div className="space-y-3">
                            {/* Complete Database SQL */}
                            <div
                                onClick={() => handleTriggerBackup('Database', 'sql')}
                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-red-500 hover:bg-red-50/40 dark:hover:bg-red-950/20 cursor-pointer transition flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 flex items-center justify-center">
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            PostgreSQL Database Dump (.SQL)
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Recommended for future VPS (psql command line & pgAdmin)
                                        </p>
                                    </div>
                                </div>
                                <ArrowDownToLine className="w-4 h-4 text-red-600" />
                            </div>

                            {/* Full System Backup JSON */}
                            <div
                                onClick={() => handleTriggerBackup('Full', 'json')}
                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center">
                                        <FolderArchive className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Full System Backup (.JSON)
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            All tables with structure & records, easy to upload anywhere
                                        </p>
                                    </div>
                                </div>
                                <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
                            </div>

                            {/* Students Dataset JSON */}
                            <div
                                onClick={() => handleTriggerBackup('Students', 'json')}
                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 cursor-pointer transition flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            All Students Dataset (.JSON)
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Students profiles, enrollments, certificates & offers
                                        </p>
                                    </div>
                                </div>
                                <ArrowDownToLine className="w-4 h-4 text-amber-600" />
                            </div>

                            {/* Students CSV for Excel */}
                            <div
                                onClick={() => handleTriggerBackup('Students', 'csv')}
                                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 cursor-pointer transition flex items-center justify-between"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                            Students Spreadsheet (.CSV)
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            Open in Microsoft Excel or Google Sheets directly
                                        </p>
                                    </div>
                                </div>
                                <ArrowDownToLine className="w-4 h-4 text-purple-600" />
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setCreateModalOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirmation to Restore an existing item */}
            {confirmRestoreItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
                            <RotateCcw className="w-6 h-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Restore Backup Data?
                            </h3>
                            <p className="text-xs text-slate-500">
                                You are about to restore data from <span className="font-semibold text-slate-700 dark:text-slate-300">{confirmRestoreItem.name}</span>.
                            </p>
                            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/50 dark:border-amber-900/50 text-left mt-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                                <p className="font-semibold">Safe Upsert Mode:</p>
                                <p className="text-[11px] leading-relaxed">
                                    Existing records with identical IDs will be updated; new records will be inserted safely without data loss.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmRestoreItem(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setConfirmRestoreItem(null);
                                    // Trigger quick re-export or restore message
                                    showToast('To restore, please choose the downloaded file in "Restore from Upload"', 'info');
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

function SaveIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
        </svg>
    );
}

export default BackupRestoreTab;
