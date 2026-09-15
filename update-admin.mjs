import fs from 'fs';
const path = 'src/pages/AdminPortal.tsx';
let content = fs.readFileSync(path, 'utf8');

const layoutStartIndex = content.indexOf(`    return (
        <div className="min-h-screen`);

const overviewEndIndex = content.indexOf(`                        </div>
                    )}

                    {activeTab === 'applications' && (`);

if (layoutStartIndex === -1 || overviewEndIndex === -1) {
    console.error("Markers not found! start="+layoutStartIndex+" end="+overviewEndIndex);
    process.exit(1);
}

const newLayoutChunk = `    return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-all duration-300">
            <ToastContainer toasts={toasts} dismiss={dismiss} />

            {/* Sidebar navigation */}
            <aside className="w-full md:w-[260px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 select-none overflow-y-auto hidden md:flex">
                <div className="space-y-8">
                    <div className="flex items-center space-x-3 px-2 pb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-900 text-white font-black flex items-center justify-center text-sm shadow">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-sm tracking-tight block text-slate-900 dark:text-white">SkyrovixAdmin</span>
                        </div>
                    </div>

                    <div className="space-y-1 text-left">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-4">MAIN</p>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={\`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition \${activeTab === 'overview' ? 'bg-[#154ED0] text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('applications')}
                            className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition \${activeTab === 'applications' ? 'bg-[#154ED0] text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                        >
                            <div className="flex items-center space-x-3">
                                <FolderOpen className="w-4 h-4" />
                                <span>Internship Applications</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={\`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition \${activeTab === 'submissions' ? 'bg-[#154ED0] text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                        >
                            <div className="flex items-center space-x-3">
                                <CheckSquare className="w-4 h-4" />
                                <span>Task Submissions</span>
                            </div>
                        </button>
                        <button
                            onClick={() => {}}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Project Submissions</span>
                        </button>
                        <button
                            onClick={() => {}}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Verification Queue</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={\`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition \${activeTab === 'students' || activeTab === 'student-detail' ? 'bg-[#154ED0] text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                        >
                            <GraduationCap className="w-4 h-4" />
                            <span>Students</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('certificates')}
                            className={\`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition \${activeTab === 'certificates' ? 'bg-[#154ED0] text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                        >
                            <Award className="w-4 h-4" />
                            <span>Certificates</span>
                        </button>
                        <button
                            onClick={() => {}}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>Payments & Invoices</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('domains')}
                            className={\`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition \${activeTab === 'domains' ? 'bg-[#154ED0] text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}\`}
                        >
                            <Layers className="w-4 h-4" />
                            <span>Internship Domains</span>
                        </button>
                        <button
                            onClick={() => {}}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Manage Tasks</span>
                        </button>

                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">MARKETING</p>
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 transition"><ArrowRight className="w-4 h-4" /><span>Promotions</span></button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 transition"><ArrowRight className="w-4 h-4" /><span>Promo Popup</span></button>
                        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 transition"><ArrowRight className="w-4 h-4" /><span>Email Logs</span></button>

                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-6">ANALYTICS</p>
                        <button
                           className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        >
                            <ArrowRight className="w-4 h-4" /> {/* Logout substitute */}
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content display */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">

                {/* Top bar header */}
                <header className="h-16 bg-white/70 backdrop-blur-md dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between select-none sticky top-0 z-10">
                    <div className="flex items-center space-x-4 flex-1">
                        <div className="relative max-w-md w-full hidden md:block">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            </span>
                            <input 
                                type="text"
                                placeholder="Search students, applications, ?K"
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                        </div>
                        <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">DB Live Sync Active</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition rounded-full">
                            <Moon className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 transition rounded-full relative">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="flex items-center space-x-3 cursor-pointer pl-2">
                            <div className="w-8 h-8 rounded-full bg-[#154ED0] text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-blue-50">
                                {profile?.full_name?.charAt(0).toUpperCase() || 'H'}
                            </div>
                            <div className="hidden sm:block text-left text-xs leading-none">
                                <span className="font-bold text-slate-900 block capitalize">{profile?.full_name || 'Hariharan'}</span>
                                <span className="font-medium text-slate-500">Super Admin</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                        </div>
                    </div>
                </header>

                <main className="flex-grow p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto">

                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fade-in-up">

                            {/* Welcome Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                                        <span>Welcome back, {profile?.full_name?.split(' ')[0] || 'Hariharan'}!</span>
                                        <span className="text-3xl" role="img" aria-label="wave">??</span>
                                    </h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Here's what's happening with your internship platform today.
                                    </p>
                                </div>
                                <div className="flex items-center border border-slate-200 bg-white rounded-xl px-4 py-2 shadow-sm text-sm text-slate-600 font-medium">
                                    <CalendarDays className="w-4 h-4 mr-2 opacity-70" />
                                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            {/* Stats card grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500">Total Students</span>
                                            <h3 className="text-3xl font-extrabold mt-2 text-slate-900">{enrollments.length}</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <Users className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center space-x-2 text-xs font-bold">
                                        <span className="text-emerald-500 flex items-center"><svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>+12.5%</span>
                                        <span className="text-slate-400 font-medium">vs last month</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500">Applications</span>
                                            <h3 className="text-3xl font-extrabold mt-2 text-slate-900">{enrollments.length}</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#154ED0] flex items-center justify-center">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs font-bold text-[#154ED0]">
                                        {pendingApps.length} Pending Review
                                    </div>
                                </div>

                                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500">Active Internships</span>
                                            <h3 className="text-3xl font-extrabold mt-2 text-slate-900">{totalEnrolls}</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center space-x-2 text-xs font-bold">
                                        <span className="text-emerald-500 flex items-center"><svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>+8.2%</span>
                                        <span className="text-slate-400 font-medium">vs last month</span>
                                    </div>
                                </div>

                                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-xs font-semibold text-slate-500">Certificates Issued</span>
                                            <h3 className="text-3xl font-extrabold mt-2 text-slate-900">{certificates.length}</h3>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                            <Award className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs font-bold text-amber-500">
                                        This month
                                    </div>
                                </div>
                            </div>

                            {/* Middle section: Recent Submissions + Quick Actions */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                                {/* Recent Task Submissions Table */}
                                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg text-slate-900">Recent Task Submissions</h3>
                                        <button onClick={() => setActiveTab('submissions')} className="px-4 py-1.5 bg-blue-50 text-[#154ED0] text-xs font-bold rounded-full hover:bg-blue-100 transition">View All</button>
                                    </div>
                                    <div className="overflow-x-auto flex-1">
                                        <table className="w-full text-sm text-left">
                                            <thead>
                                                <tr className="text-xs text-slate-400 font-semibold border-b border-slate-100">
                                                    <th className="pb-3 font-medium">Student</th>
                                                    <th className="pb-3 font-medium">Task</th>
                                                    <th className="pb-3 font-medium">Domain</th>
                                                    <th className="pb-3 font-medium hidden sm:table-cell">Submitted On</th>
                                                    <th className="pb-3 font-medium text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {submissions.slice(0, 5).map(sub => {
                                                    const subDate = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown';
                                                    const initials = sub.profiles?.full_name?.charAt(0).toUpperCase() || 'S';
                                                    return (
                                                        <tr key={sub.id} className="hover:bg-slate-50">
                                                            <td className="py-4 pr-4">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#154ED0] font-bold flex items-center justify-center text-xs">
                                                                        {initials}
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-semibold text-slate-900 block text-sm">{sub.profiles?.full_name || 'N/A'}</span>
                                                                        <span className="text-[10px] text-slate-400">{sub.profiles?.email || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 pr-4">
                                                                <span className="font-medium text-[#154ED0] text-xs sm:text-sm cursor-pointer hover:underline">Task {sub.internship_tasks?.task_number}: {sub.internship_tasks?.title}</span>
                                                            </td>
                                                            <td className="py-4 pr-4 text-slate-500 text-xs sm:text-sm capitalize whitespace-nowrap">
                                                                {enrollments.find(e => e.user_id === sub.user_id)?.internships?.category || 'Development'}
                                                            </td>
                                                            <td className="py-4 pr-4 text-slate-500 text-xs whitespace-nowrap hidden sm:table-cell">
                                                                {subDate}
                                                            </td>
                                                            <td className="py-4 text-center">
                                                                <span className={\`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold \${
                                                                    sub.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                                                                    sub.status === 'submitted' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'
                                                                }\`}>
                                                                    {sub.status === 'approved' ? 'Approved' : sub.status === 'submitted' ? 'Pending' : 'Changes'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                {submissions.length === 0 && (
                                                    <tr><td colSpan={5} className="py-12 text-center text-slate-400 text-sm">No recent submissions found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                                    <h3 className="font-bold text-lg text-slate-900 mb-6 flex items-center">
                                        <Sparkles className="w-5 h-5 text-blue-400 mr-2" />
                                        Quick Actions
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <Megaphone className="w-5 h-5 text-blue-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Add Announcement</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <Mail className="w-5 h-5 text-purple-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Send Email</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <Layers className="w-5 h-5 text-indigo-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Add Promo / Popup</span>
                                        </button>
                                        <button onClick={() => setActiveTab('domains')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <PlusCircle className="w-5 h-5 text-emerald-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Add New Domain</span>
                                        </button>
                                        <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <CreditCard className="w-5 h-5 text-pink-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Create Coupon</span>
                                        </button>
                                        <button onClick={() => setActiveTab('students')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition">
                                            <FolderOpen className="w-5 h-5 text-amber-500 mb-2" />
                                            <span className="text-[10px] font-semibold text-slate-600 text-center">Export Students</span>
                                        </button>
                                    </div>
                                    <button className="mt-6 w-full py-2.5 bg-[#154ED0] text-white font-semibold text-xs rounded-xl shadow-sm flex justify-center items-center">
                                        Explore All Features <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Section: Charts / Overviews */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 text-left pb-8">
                                {/* Admissions Overview Chart-like UI */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-1">
                                    <h3 className="font-bold text-lg text-slate-900 mb-6">Application Status Overview</h3>
                                    <div className="flex flex-col items-center justify-center gap-6">
                                        <div className="relative w-40 h-40">
                                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                                <path
                                                  className="fill-none stroke-slate-100"
                                                  strokeWidth="3.8"
                                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                {enrollments.length > 0 && (
                                                <path
                                                  className="fill-none stroke-emerald-500"
                                                  strokeWidth="3.8"
                                                  strokeDasharray={\`\${((totalEnrolls) / enrollments.length) * 100}, 100\`}
                                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                )}
                                                {enrollments.length > 0 && pendingApps.length > 0 && (
                                                <path
                                                  className="fill-none stroke-amber-500"
                                                  strokeWidth="3.8"
                                                  strokeDasharray={\`\${(pendingApps.length / enrollments.length) * 100}, 100\`}
                                                  strokeDashoffset={\`-\${((totalEnrolls) / enrollments.length) * 100}\`}
                                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                />
                                                )}
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                                <span className="text-3xl font-extrabold text-slate-900 leading-none">{enrollments.length}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total</span>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-3">
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>Pending Review</div>
                                                <div className="text-slate-900">{pendingApps.length} <span className="text-slate-400 ml-1">({enrollments.length > 0 ? Math.round((pendingApps.length/enrollments.length)*100) : 0}%)</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>Shortlisted</div>
                                                <div className="text-slate-900">{pendingSubCount} <span className="text-slate-400 ml-1">({enrollments.length > 0 ? Math.round((pendingSubCount/enrollments.length)*100) : 0}%)</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>Accepted</div>
                                                <div className="text-slate-900">{totalEnrolls} <span className="text-slate-400 ml-1">({enrollments.length > 0 ? Math.round((totalEnrolls/enrollments.length)*100) : 0}%)</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>Rejected</div>
                                                <div className="text-slate-900">0 <span className="text-slate-400 ml-1">(0%)</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Domains / Activity feed */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-1 xl:col-span-1">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg text-slate-900">Top Domains</h3>
                                        <span className="text-[10px] font-bold text-slate-500 px-2.5 py-1 bg-slate-50 rounded-full">This Month</span>
                                    </div>
                                    <div className="space-y-6">
                                        {Object.entries(
                                            enrollments.reduce((acc, e) => {
                                                const title = e.internships?.category || e.internships?.title || 'Other';
                                                acc[title] = (acc[title] || 0) + 1;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        )
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 5)
                                        .map(([domain, count], idx) => {
                                            const maxCount = Math.max(1, enrollments.length);
                                            const percentage = Math.min(100, Math.max(10, (count / maxCount) * 100));
                                            return (
                                            <div key={idx}>
                                                <div className="flex justify-between items-center mb-1 text-xs font-bold text-slate-700">
                                                    <span>{domain}</span>
                                                    <span className="text-slate-900">{count}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-[#154ED0] h-full rounded-full" style={{ width: \`\${percentage}%\` }}></div>
                                                </div>
                                            </div>
                                        )})}
                                        {enrollments.length === 0 && (
                                            <div className="text-sm text-slate-400 py-6 text-center">No domain stats available yet.</div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Platform Summary (Right-most col in reference) */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm col-span-1 xl:col-span-1 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-900 mb-6">Platform Summary</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-3">
                                                <div className="flex items-center"><div className="w-5 h-5 rounded flex items-center justify-center text-emerald-500 bg-emerald-50 mr-3">?</div>Total Revenue</div>
                                                <div className="font-bold text-slate-900">?400 <span className="text-[9px] text-emerald-500 ml-1 bg-emerald-50 px-1 py-0.5 rounded">+15.4%</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-3">
                                                <div className="flex items-center"><CreditCard className="w-4 h-4 text-amber-500 mr-3" />Pending Payments</div>
                                                <div className="font-bold text-slate-900">?0 <span className="text-[9px] text-amber-500 ml-1 bg-amber-50 px-1 py-0.5 rounded">0</span></div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-50 pb-3">
                                                <div className="flex items-center"><CreditCard className="w-4 h-4 text-blue-500 mr-3" />Active Coupons</div>
                                                <div className="font-bold text-slate-900">{certificates.length}</div>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                                                <div className="flex items-center"><Mail className="w-4 h-4 text-purple-500 mr-3" />Email Credits Left</div>
                                                <div className="font-bold text-slate-900">2,450 <span className="text-[9px] text-emerald-600 ml-1 bg-emerald-50 px-1 py-0.5 rounded">Enough</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
`;

content = content.replace(content.substring(layoutStartIndex, overviewEndIndex), newLayoutChunk);

// Add missing imported icons matching exact case
const requiredIcons = ['ArrowRight', 'CreditCard', 'Settings', 'Megaphone', 'Mail', 'CalendarDays', 'FolderOpen', 'CheckSquare'];
for (const icon of requiredIcons) {
    if (!content.includes(icon)) {
        content = content.replace('Award,', `Award, ${icon},`);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully replaced the UI block!");
