import React, { useState, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast, ToastContainer } from '../components/Toast';
import {
    LayoutDashboard, Users, BookOpen, UserCheck, FileText, Settings,
    Search, Filter, Plus, Printer, Eye, Edit3, Save, ChevronLeft,
    Calendar, CheckCircle, Clock, AlertCircle, Briefcase, GraduationCap
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Types
interface Student {
    student_id: string;
    user_id: string;
    name: string;
    register_number: string;
    roll_number: string;
    department: string;
    year: string;
    semester: string;
    section: string;
    academic_year: string;
    email: string;
    phone: string;
}

interface Counsellor {
    counsellor_id: string;
    user_id: string;
    name: string;
    email: string;
    department: string;
}

interface CounsellingRecord {
    counselling_id: string;
    student_id: string;
    counsellor_id: string;
    session_number: number;
    counselling_date: string;
    counselling_type: string;
    academic_performance: string;
    attendance_status: string;
    student_concern: string;
    discussion: string;
    advice: string;
    action_plan: string;
    follow_up_required: boolean;
    follow_up_date: string;
    status: string;
    created_at: string;

    // Joined standard fields
    mz_students?: Student;
    mz_counsellors?: Counsellor;
}

const CCBookPortal: React.FC = () => {
    const { user, profile } = useAuth();
    const { toasts, showToast, dismiss } = useToast();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'ccbook' | 'mentors' | 'reports' | 'settings' | 'student-profile'>('dashboard');
    const [loading, setLoading] = useState(true);

    const [students, setStudents] = useState<Student[]>([]);
    const [counsellors, setCounsellors] = useState<Counsellor[]>([]);
    const [records, setRecords] = useState<CounsellingRecord[]>([]);

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modals & Panels
    const [showNewRecordForm, setShowNewRecordForm] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [activeStudent, setActiveStudent] = useState<Student | null>(null);

    // Form inputs
    const [formRecord, setFormRecord] = useState<Partial<CounsellingRecord>>({
        counselling_type: 'Academic',
        academic_performance: '',
        attendance_status: '',
        student_concern: '',
        discussion: '',
        advice: '',
        action_plan: '',
        follow_up_required: false,
        follow_up_date: '',
        status: 'Completed'
    });

    const [selectedStudentId, setSelectedStudentId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // NOTE: Replace with supabaseAdmin / supabase logic referencing mz_ tables
            // For now, load dummy data if table is missing or fetch fails, to ensure UI is presentable.
            const { data: stdData, error: stdErr } = await supabaseAdmin.from('mz_students').select('*').order('name');
            const { data: cnsData, error: cnsErr } = await supabaseAdmin.from('mz_counsellors').select('*');
            const { data: recData, error: recErr } = await supabaseAdmin.from('mz_counselling_records').select(`
                *,
                mz_students(*),
                mz_counsellors(*)
            `).order('counselling_date', { ascending: false });

            // If tables don't exist yet, it might error out, so catch and fallback to empty arrays to prevent crash
            if (stdData) setStudents(stdData);
            if (cnsData) setCounsellors(cnsData);
            if (recData) setRecords(recData);

        } catch (error) {
            console.error('Data pull error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Assume we find current counsellor ID from profile
            const cns = counsellors.find(c => c.user_id === user?.id) || counsellors[0];
            const cnsId = cns?.counsellor_id;

            if (!selectedStudentId || !cnsId) {
                showToast("Select a student and ensure counsellor exists.", "error"); return;
            }

            const payload = {
                student_id: selectedStudentId,
                counsellor_id: cnsId,
                counselling_type: formRecord.counselling_type,
                academic_performance: formRecord.academic_performance,
                attendance_status: formRecord.attendance_status,
                student_concern: formRecord.student_concern,
                discussion: formRecord.discussion,
                advice: formRecord.advice,
                action_plan: formRecord.action_plan,
                follow_up_required: formRecord.follow_up_required,
                follow_up_date: formRecord.follow_up_required ? formRecord.follow_up_date : null,
                status: formRecord.status
            };

            if (editingRecordId) {
                const { error } = await supabaseAdmin.from('mz_counselling_records').update(payload).eq('counselling_id', editingRecordId);
                if (error) throw error;
                showToast("Counselling session updated successfully", "success");
            } else {
                const sessionCount = records.filter(r => r.student_id === selectedStudentId).length + 1;
                const { error } = await supabaseAdmin.from('mz_counselling_records').insert({ ...payload, session_number: sessionCount, counselling_date: new Date().toISOString() });
                if (error) throw error;
                showToast("Counselling session recorded successfully", "success");
            }

            setShowNewRecordForm(false);
            setEditingRecordId(null);
            loadData();
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handlePrintCCBook = async (student: Student) => {
        const printElement = document.getElementById('print-cc-book');
        if (!printElement) return;

        printElement.classList.add('block');
        printElement.classList.remove('hidden');

        try {
            const canvas = await html2canvas(printElement, { scale: 2 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const widthRatio = pageWidth / canvas.width;
            const imgHeight = canvas.height * widthRatio;

            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
            pdf.save(`CC_Book_${student.register_number}.pdf`);
        } catch (err: any) {
            showToast("Print failed", "error");
        } finally {
            printElement.classList.add('hidden');
            printElement.classList.remove('block');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    const filteredRecords = records.filter(r => {
        const matchesName = r.mz_students?.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.mz_students?.register_number.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDept = filterDept ? r.mz_students?.department === filterDept : true;
        const matchesYear = filterYear ? r.mz_students?.year === filterYear : true;
        const matchesStatus = filterStatus ? r.status === filterStatus : true;
        return matchesName && matchesDept && matchesYear && matchesStatus;
    });

    const renderDashboard = () => (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800">Student Counselling / CC Book</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { title: 'Total Students', value: students.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { title: 'Students Counselled', value: new Set(records.map(r => r.student_id)).size, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { title: 'Pending Counselling', value: students.length - new Set(records.map(r => r.student_id)).size, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { title: 'Follow-ups Due', value: records.filter(r => r.follow_up_required).length, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { title: "This Month's", value: records.filter(r => new Date(r.counselling_date).getMonth() === new Date().getMonth()).length, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">{stat.title}</p>
                            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderCounsellingForm = () => (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {editingRecordId ? <Edit3 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                    {editingRecordId ? 'Edit Counselling Record' : 'New Counselling Record'}
                </h3>
                <button onClick={() => { setShowNewRecordForm(false); setEditingRecordId(null); }} className="text-slate-400 hover:text-slate-600">
                    Close
                </button>
            </div>

            <form onSubmit={handleSaveRecord} className="space-y-6">
                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">1. Student Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Select Student</label>
                            <select
                                required
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Choose Student --</option>
                                {students.map(s => (
                                    <option key={s.student_id} value={s.student_id}>{s.name} ({s.register_number})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Counselling Type</label>
                            <select
                                value={formRecord.counselling_type}
                                onChange={(e) => setFormRecord({ ...formRecord, counselling_type: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option>Academic</option>
                                <option>Career</option>
                                <option>Personal</option>
                                <option>Disciplinary</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">2. Assessment & Discussion</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Academic Performance</label>
                            <input type="text" value={formRecord.academic_performance} onChange={e => setFormRecord({ ...formRecord, academic_performance: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Needs improvement in Math" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Attendance Status</label>
                            <input type="text" value={formRecord.attendance_status} onChange={e => setFormRecord({ ...formRecord, attendance_status: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="e.g. 75%" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Student Concern</label>
                            <textarea value={formRecord.student_concern} onChange={e => setFormRecord({ ...formRecord, student_concern: e.target.value })} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="What issues did the student raise?"></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Discussion / Counselling Notes</label>
                            <textarea required value={formRecord.discussion} onChange={e => setFormRecord({ ...formRecord, discussion: e.target.value })} rows={3} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Detail the counselling session..."></textarea>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Mentor / Counsellor Advice & Action Plan</label>
                            <textarea required value={formRecord.action_plan} onChange={e => setFormRecord({ ...formRecord, action_plan: e.target.value })} rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Steps to be taken..."></textarea>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4">3. Follow-up</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="follow" checked={formRecord.follow_up_required} onChange={e => setFormRecord({ ...formRecord, follow_up_required: e.target.checked })} className="w-4 h-4 rounded border-slate-300" />
                            <label htmlFor="follow" className="text-sm font-bold text-slate-700">Follow-up Required?</label>
                        </div>
                        {formRecord.follow_up_required && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Follow-up Date</label>
                                <input type="date" value={formRecord.follow_up_date} onChange={e => setFormRecord({ ...formRecord, follow_up_date: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                            <select value={formRecord.status} onChange={e => setFormRecord({ ...formRecord, status: e.target.value })} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm">
                                <option>Completed</option>
                                <option>In Progress</option>
                                <option>Pending Follow-up</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Record
                    </button>
                </div>
            </form>
        </div>
    );

    const renderCCBook = () => {
        if (showNewRecordForm) return renderCounsellingForm();

        return (
            <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" /> CC Book Registry
                    </h2>
                    <button onClick={() => {
                        setFormRecord({
                            counselling_type: 'Academic',
                            academic_performance: '',
                            attendance_status: '',
                            student_concern: '',
                            discussion: '',
                            advice: '',
                            action_plan: '',
                            follow_up_required: false,
                            follow_up_date: '',
                            status: 'Completed'
                        });
                        setSelectedStudentId('');
                        setEditingRecordId(null);
                        setShowNewRecordForm(true);
                    }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm text-sm">
                        <Plus className="w-4 h-4" /> Add Record
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input type="text" placeholder="Search student or register number..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">
                        <option value="">All Depts</option>
                        <option>CSE</option> <option>IT</option> <option>ECE</option> <option>EEE</option> <option>MECH</option>
                    </select>
                    <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">
                        <option value="">All Years</option>
                        <option>1st Year</option> <option>2nd Year</option> <option>3rd Year</option> <option>4th Year</option>
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl text-sm">
                        <option value="">All Status</option>
                        <option>Completed</option> <option>Pending Follow-up</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-white border text-left border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Date</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Student</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Dept/Yr</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Session</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider">Status</th>
                                    <th className="px-4 py-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.map(r => (
                                    <tr key={r.counselling_id} className="hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 text-slate-600">{new Date(r.counselling_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-bold text-slate-800">{r.mz_students?.name}</p>
                                            <p className="text-xs text-slate-500">{r.mz_students?.register_number}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-slate-800 font-medium">{r.mz_students?.department}</p>
                                            <p className="text-xs text-slate-500">{r.mz_students?.year}</p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 font-bold"># {r.session_number}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${r.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => { setActiveStudent(r.mz_students!); setActiveTab('student-profile') }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Profile">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => {
                                                    setEditingRecordId(r.counselling_id);
                                                    setFormRecord({
                                                        counselling_type: r.counselling_type,
                                                        academic_performance: r.academic_performance,
                                                        attendance_status: r.attendance_status,
                                                        student_concern: r.student_concern,
                                                        discussion: r.discussion,
                                                        advice: r.advice,
                                                        action_plan: r.action_plan,
                                                        follow_up_required: r.follow_up_required,
                                                        follow_up_date: r.follow_up_date ? new Date(r.follow_up_date).toISOString().split('T')[0] : '',
                                                        status: r.status
                                                    });
                                                    setSelectedStudentId(r.student_id);
                                                    setShowNewRecordForm(true);
                                                }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit Record">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handlePrintCCBook(r.mz_students!)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Print CC Book">
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">No counselling records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const renderStudentProfile = () => {
        if (!activeStudent) return null;
        const studentRecords = records.filter(r => r.student_id === activeStudent.student_id).sort((a, b) => a.session_number - b.session_number);

        return (
            <div className="space-y-6 animate-fadeIn">
                <button onClick={() => setActiveTab('ccbook')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-bold">
                    <ChevronLeft className="w-4 h-4" /> Back to Records
                </button>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 text-2xl font-black">
                        {activeStudent.name.charAt(0)}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Name</p><p className="font-bold text-slate-800">{activeStudent.name}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Register No</p><p className="font-bold text-slate-800">{activeStudent.register_number}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Dept & Year</p><p className="font-bold text-slate-800">{activeStudent.department} / {activeStudent.year}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Email</p><p className="font-bold text-slate-800">{activeStudent.email}</p></div>
                        <div><p className="text-xs text-slate-500 uppercase font-bold">Phone</p><p className="font-bold text-slate-800">{activeStudent.phone || 'N/A'}</p></div>
                    </div>
                </div>

                <h3 className="text-lg font-black text-slate-800 border-b border-slate-200 pb-2">Counselling History</h3>

                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {studentRecords.map(r => (
                        <div key={r.counselling_id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active text-left">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-50 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold z-10">
                                {r.session_number}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-slate-800">{new Date(r.counselling_date).toLocaleDateString()}</span>
                                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{r.counselling_type}</span>
                                </div>
                                <div className="space-y-2 mt-3">
                                    {r.student_concern && <div><p className="text-xs font-bold text-slate-500">Concern</p><p className="text-sm text-slate-700">{r.student_concern}</p></div>}
                                    {r.discussion && <div><p className="text-xs font-bold text-slate-500">Discussion</p><p className="text-sm text-slate-700">{r.discussion}</p></div>}
                                    {r.action_plan && <div><p className="text-xs font-bold text-slate-500">Action Plan / Advice</p><p className="text-sm text-slate-700">{r.action_plan}</p></div>}
                                    {r.follow_up_required && <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 rounded p-1"><Clock className="w-3 h-3" /> Follow-up on {new Date(r.follow_up_date).toLocaleDateString()}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                    {studentRecords.length === 0 && <p className="text-center text-slate-500 relative z-10 bg-slate-50 py-4">No counselling history found.</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row relative">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 p-4 flex flex-col select-none no-print">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-sm tracking-tight leading-none text-slate-900">Mount Zion</h1>
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-tight">CC Book System</p>
                    </div>
                </div>

                <nav className="space-y-1 text-left">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'students', label: 'Students', icon: GraduationCap },
                        { id: 'ccbook', label: 'Counselling / CC Book', icon: BookOpen },
                        { id: 'mentors', label: 'Mentors', icon: Users },
                        { id: 'reports', label: 'Reports', icon: FileText },
                        { id: 'settings', label: 'Settings', icon: Settings },
                    ].map(item => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id as any); if (item.id !== 'student-profile') setActiveStudent(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}>
                            <item.icon className="w-4 h-4" /> {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full no-print">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'ccbook' && renderCCBook()}
                {activeTab === 'student-profile' && renderStudentProfile()}
                {(['students', 'mentors', 'reports', 'settings'].includes(activeTab)) && (
                    <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                        <Settings className="w-12 h-12 mb-4 opacity-20" />
                        <h2 className="text-xl font-bold mb-2">Module Under Verification</h2>
                        <p className="text-sm">This module ({activeTab}) is being configured for the new session.</p>
                    </div>
                )}
            </main>

            {/* Hidden Print Container for CC Book Format */}
            <div id="print-cc-book" className="hidden bg-white w-full max-w-[210mm] mx-auto min-h-[297mm] p-[20mm] print-format font-sans text-black shadow-lg">
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-black uppercase tracking-widest">Mount Zion College</h1>
                    <h2 className="text-lg font-bold mt-1">STUDENT COUNSELLING / CC BOOK</h2>
                </div>

                {activeStudent && (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                            <p><strong>Student Name:</strong> {activeStudent.name}</p>
                            <p><strong>Register Number:</strong> {activeStudent.register_number}</p>
                            <p><strong>Department:</strong> {activeStudent.department}</p>
                            <p><strong>Year / Sem:</strong> {activeStudent.year} / {activeStudent.semester}</p>
                            <p><strong>Academic Year:</strong> {activeStudent.academic_year}</p>
                            <p><strong>Email ID:</strong> {activeStudent.email}</p>
                        </div>

                        <div className="space-y-6">
                            {records.filter(r => r.student_id === activeStudent.student_id).sort((a, b) => a.session_number - b.session_number).map(r => (
                                <div key={r.counselling_id} className="border border-black p-4 text-sm break-inside-avoid">
                                    <h3 className="font-black text-base mb-2 border-b border-black pb-1">Session {r.session_number}</h3>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <p><strong>Date:</strong> {new Date(r.counselling_date).toLocaleDateString()}</p>
                                        <p><strong>Type:</strong> {r.counselling_type}</p>
                                        <p><strong>Mentor:</strong> {r.mz_counsellors?.name || 'Assigned Mentor'}</p>
                                        <p><strong>Status:</strong> {r.status}</p>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <p><strong>Discussion:</strong> {r.discussion}</p>
                                        <p><strong>Action Plan:</strong> {r.action_plan}</p>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <div className="text-center w-32 border-t border-black pt-1">Student Signature</div>
                                        <div className="text-center w-32 border-t border-black pt-1">Mentor Signature</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center text-sm font-bold">
                            * This is a confidential document generated from the Mount Zion CC Book Portal *
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CCBookPortal;
