import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, FALLBACK_INTERNSHIPS } from '../utils/supabase';
import {
    CheckCircle2, Sparkles, MapPin, ChevronRight
} from 'lucide-react';


const stateDistrictsMap: Record<string, string[]> = {
    'Punjab': ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'SAS Nagar (Mohali)', 'Sangrur', 'SBS Nagar', 'Sri Muktsar Sahib', 'Tarn Taran'],
    'Chandigarh': ['Chandigarh'],
    'Delhi': ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
    'Haryana': ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
    'Himachal Pradesh': ['Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'],
    'Uttar Pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Faizabad', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar (Noida)', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri', 'Kushinagar', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'RaeBareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'],
    'Rajasthan': ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'],
    'Gujarat': ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'],
    'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
    'Karnataka': ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'],
    'Tamil Nadu': ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
    'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'],
    'West Bengal': ['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'],
    'Bihar': ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supanl', 'Vaishali', 'West Champaran'],
    'Madhya Pradesh': ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', ' Umaria', 'Vidisha']
};

interface Course {
    id: string;
    title: string;
    category: string;
    description: string;
    duration: string;
    type: 'COURSE' | 'INTERNSHIP';
    assignments?: Array<{ id: string; title: string; desc: string }>;
}

export const Internship: React.FC = () => {
    const { user, register } = useAuth();
    const navigate = useNavigate();

    // Form Fields
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedDomainId, setSelectedDomainId] = useState('');
    const [fullName, setFullName] = useState(user?.name || '');
    const [phone, setPhone] = useState('');
    // New registration fields for guest visitors
    const [email, setEmail] = useState(user?.email || '');
    const [password, setPassword] = useState('');

    const [college, setCollege] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');
    const [courseBranch, setCourseBranch] = useState('');
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [country, setCountry] = useState('India');
    const [stateName, setStateName] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [pinCode, setPinCode] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('1 Month');
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState(false);
    const [loading, setLoading] = useState(false);

    // Sync logged-in user details if user state loads later
    useEffect(() => {
        if (user) {
            setFullName(user.name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    // Automatically set default/first district name when state is selected
    useEffect(() => {
        if (stateName && stateDistrictsMap[stateName]) {
            const list = stateDistrictsMap[stateName];
            if (list.length > 0) {
                setDistrict(list[0]);
            }
        } else {
            setDistrict('');
        }
    }, [stateName]);

    // Fetch internship courses from database
    useEffect(() => {
        const fetchCourses = async () => {
            const mappedFallback: Course[] = FALLBACK_INTERNSHIPS.map(i => ({
                id: i.id,
                title: i.title,
                category: i.domain,
                description: i.description || '',
                duration: i.duration || '3 Months',
                type: 'INTERNSHIP'
            }));

            try {
                const { data, error } = await supabase
                    .from('internships')
                    .select('*')
                    .eq('status', 'published');

                if (error) throw error;

                const internships: Course[] = (data || []).map(i => ({
                    id: i.id,
                    title: i.title,
                    category: i.domain,
                    description: i.description || '',
                    duration: i.duration || '3 Months',
                    type: 'INTERNSHIP'
                }));

                const finalCourses = internships.length > 0 ? internships : mappedFallback;
                setCourses(finalCourses);

                // Read from query param if present
                const params = new URLSearchParams(window.location.search);
                const queryCourseId = params.get('courseId');

                if (queryCourseId && finalCourses.some((c: { id: string }) => c.id === queryCourseId)) {
                    setSelectedDomainId(queryCourseId);
                } else if (finalCourses.length > 0) {
                    setSelectedDomainId(finalCourses[0].id);
                }
            } catch (err) {
                console.error('[Internship] Failed to fetch domains, using static fallbacks:', err);
                setCourses(mappedFallback);

                // Read from query param if present
                const params = new URLSearchParams(window.location.search);
                const queryCourseId = params.get('courseId');

                if (queryCourseId && mappedFallback.some((c: { id: string }) => c.id === queryCourseId)) {
                    setSelectedDomainId(queryCourseId);
                } else if (mappedFallback.length > 0) {
                    setSelectedDomainId(mappedFallback[0].id);
                }
            }
        };
        fetchCourses();
    }, []);

    const selectedDomain = courses.find(c => c.id === selectedDomainId);

    const getDomainCode = (title: string) => {
        const cleanTitle = title.replace(/\s*(developer|development|engineer|architect|designer)\s*/i, '').replace(/\s*internship\s*/i, '').trim();
        if (cleanTitle.toLowerCase().includes('full stack')) return 'FS';
        if (cleanTitle.toLowerCase().includes('python')) return 'PY';
        if (cleanTitle.toLowerCase().includes('java')) return 'JV';
        if (cleanTitle.toLowerCase().includes('mern')) return 'ME';
        if (cleanTitle.toLowerCase().includes('mean')) return 'MA';
        if (cleanTitle.toLowerCase().includes('machine learning') || cleanTitle.toLowerCase().includes('ai &')) return 'AI';
        if (cleanTitle.toLowerCase().includes('data science')) return 'DS';
        if (cleanTitle.toLowerCase().includes('uiux') || cleanTitle.toLowerCase().includes('ui/ux')) return 'UX';
        if (cleanTitle.toLowerCase().includes('cyber')) return 'CS';
        if (cleanTitle.toLowerCase().includes('frontend')) return 'FE';
        if (cleanTitle.toLowerCase().includes('backend')) return 'BE';
        if (cleanTitle.toLowerCase().includes('react')) return 'RE';
        if (cleanTitle.toLowerCase().includes('node')) return 'ND';
        if (cleanTitle.toLowerCase().includes('php')) return 'PH';
        if (cleanTitle.toLowerCase().includes('django')) return 'DJ';
        if (cleanTitle.toLowerCase().includes('android')) return 'AN';
        if (cleanTitle.toLowerCase().includes('flutter')) return 'FL';
        if (cleanTitle.toLowerCase().includes('data analytics')) return 'DA';
        if (cleanTitle.toLowerCase().includes('deep learning')) return 'DL';
        if (cleanTitle.toLowerCase().includes('computer vision')) return 'CV';
        if (cleanTitle.toLowerCase().includes('natural language')) return 'NL';
        if (cleanTitle.toLowerCase().includes('cloud')) return 'CC';
        if (cleanTitle.toLowerCase().includes('devops')) return 'DV';
        if (cleanTitle.toLowerCase().includes('aws')) return 'AW';
        if (cleanTitle.toLowerCase().includes('blockchain')) return 'BC';
        if (cleanTitle.toLowerCase().includes('iot')) return 'IO';
        if (cleanTitle.toLowerCase().includes('embedded')) return 'ES';
        if (cleanTitle.toLowerCase().includes('testing') || cleanTitle.toLowerCase().includes('qa')) return 'QA';
        if (cleanTitle.toLowerCase().includes('digital marketing')) return 'DM';
        if (cleanTitle.toLowerCase().includes('graphic design')) return 'GD';
        if (cleanTitle.toLowerCase().includes('project management')) return 'PM';
        if (cleanTitle.toLowerCase().includes('database')) return 'DB';
        if (cleanTitle.toLowerCase().includes('sql')) return 'SQL';
        if (cleanTitle.toLowerCase().includes('ui design')) return 'UI';
        if (cleanTitle.toLowerCase().includes('ux design')) return 'UXD';
        if (cleanTitle.toLowerCase().includes('web development')) return 'WD';
        return cleanTitle.substring(0, 2).toUpperCase();
    };

    const getDurationTaskCount = (dur: string) => {
        if (dur.includes('1')) return 5;
        if (dur.includes('2')) return 8;
        if (dur.includes('3')) return 10;
        if (dur.includes('6')) return 12;
        return 5;
    };

    const getSyllabusList = (course: Course, dur: string) => {
        const baseAssignments = course.assignments || [];
        const titles = baseAssignments.map(as => as.title);

        // Fill up to target count
        const targetCount = getDurationTaskCount(dur);
        const genericTasks = [
            "Modular Structure and Validation Implementation",
            "Performance Optimization & Code Refactoring",
            "Security Auditing & Penetration Tests",
            "CI/CD Pipeline Setup & Verification",
            "Final Production Deployment & Capstone Submission",
            "Documentation & API Reference Manual",
            "System Monitoring & Analytics Integration",
            "Load Testing & Scaling Audit Validation"
        ];

        while (titles.length < targetCount) {
            const nextGeneric = genericTasks[(titles.length - baseAssignments.length) % genericTasks.length];
            titles.push(nextGeneric);
        }

        // If it's more than target, truncate
        return titles.slice(0, targetCount);
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDomainId) {
            alert('Please select an internship domain.');
            return;
        }

        setLoading(true);
        console.log("[handleApply] Starting internship application process for domain:", selectedDomainId);
        try {
            // 1. If user is guest/not logged in, register account first
            if (!user) {
                if (!email || !password) {
                    alert('Please enter your email address and set a password to register.');
                    setLoading(false);
                    return;
                }
                console.log("[handleApply] User is not logged in. Registering guest account first...");
                await register(fullName, email, password, 'STUDENT');
            }

            // 2. Fetch authenticated Supabase user ID and details
            console.log("[handleApply] Fetching authenticated Supabase user...");
            const sessionRes = await supabase.auth.getUser();
            const sbUser = sessionRes.data?.user;

            let sbUserId = '';
            let sbUserEmail = '';
            let sbUsername = '';

            if (sbUser) {
                sbUserId = sbUser.id;
                sbUserEmail = sbUser.email || '';
                sbUsername = sbUser.user_metadata?.name || fullName || sbUserEmail.split('@')[0];
            } else if (user) {
                sbUserId = user.id;
                sbUserEmail = user.email;
                sbUsername = user.name || fullName || sbUserEmail.split('@')[0];
            }

            if (!sbUserId) {
                throw new Error("Unable to retrieve authenticated session from Supabase. Please sign up or log in again.");
            }

            // Validate the user ID is a real Supabase UUID (not a mock/local ID)
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidPattern.test(sbUserId)) {
                throw new Error("Your session is using a local-only account. Please log out and sign up again using your email to get full cross-device access.");
            }

            console.log(`[handleApply] Authenticated Supabase User ID: ${sbUserId}, Email: ${sbUserEmail}`);

            // 3. Prevent duplicate applications by checking if mapping already exists in database
            console.log("[handleApply] Checking for existing application record in database...");
            const { data: existingApps, error: checkError } = await supabase
                .from('internship_applications')
                .select('*')
                .eq('user_id', sbUserId)
                .eq('internship_id', selectedDomainId);

            if (checkError) {
                console.warn("[handleApply] Supabase check query error (proceeding with caution):", checkError);
            } else if (existingApps && existingApps.length > 0) {
                console.log("[handleApply] Existing application found. Redirecting to dashboard.");
                alert('You have already applied and enrolled in this internship domain. Check your dashboard!');
                navigate('/dashboard');
                setLoading(false);
                return;
            }

            // 4. Save application data to Supabase database (with constraint checks)
            const durationMonths = selectedDuration.includes('1') ? 1 : selectedDuration.includes('2') ? 2 : selectedDuration.includes('6') ? 6 : 3;
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);

            const appData = {
                user_id: sbUserId,
                internship_id: selectedDomainId,
                status: 'active',
                student_name: sbUsername,
                email: sbUserEmail,
                phone: phone || '',
                college: college || '',
                domain: selectedDomain?.category || 'Virtual Internship',
                internship_name: selectedDomain?.title || 'Developer Internship',
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                certificate_status: 'pending',
                offer_letter_status: 'pending',
                progress: 0,
                mentor_id: null
            };

            console.log("[handleApply] Inserting application to public.internship_applications:", appData);
            const { error: insertError } = await supabase
                .from('internship_applications')
                .insert([appData]);

            if (insertError) {
                if (insertError.code === '23505' || insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
                    console.log("[handleApply] Unique constraint triggered. Record already exists.");
                    alert('You have already registered for this virtual internship.');
                    navigate('/dashboard');
                    setLoading(false);
                    return;
                }
                console.error("[handleApply] Database application insertion failed:", insertError);
                throw new Error(`Database registration failed: ${insertError.message}`);
            }

            // Provision enrollment in internship_enrollments
            const { data: enrolledRecord, error: enrollErr } = await supabase
                .from('internship_enrollments')
                .insert({
                    user_id: sbUserId,
                    internship_id: selectedDomainId,
                    status: 'active',
                    application_status: 'active'
                })
                .select()
                .single();

            if (enrollErr) {
                console.warn('[handleApply] Warning inserting enrollment:', enrollErr);
            }

            // Generate offer letter record
            const offerLetterNumber = `VINIX-OFFER-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await supabase
                .from('offer_letters')
                .insert({
                    enrollment_id: enrolledRecord?.id,
                    user_id: sbUserId,
                    offer_letter_id: offerLetterNumber,
                    student_name: sbUsername,
                    student_email: sbUserEmail,
                    internship_title: selectedDomain?.title || 'Developer Internship',
                    duration: selectedDuration,
                    status: 'GENERATED'
                });

            // Seed task progress
            const { data: tasks } = await supabase
                .from('internship_tasks')
                .select('*')
                .eq('internship_id', selectedDomainId)
                .order('task_number', { ascending: true });

            if (tasks && tasks.length > 0) {
                const progressToInsert = tasks.map(t => ({
                    user_id: sbUserId,
                    internship_id: selectedDomainId,
                    task_id: t.id,
                    status: t.task_number === 1 ? 'approved' : t.task_number === 2 ? 'available' : 'locked'
                }));
                await supabase
                    .from('task_progress')
                    .insert(progressToInsert);
            }

            alert('Successfully applied! Your virtual internship workspace and offer letter have been generated.');
            navigate('/dashboard');
        } catch (error: any) {
            console.error("[handleApply] Fatal error in application submission flow:", error);
            alert(error.message || 'Failed to register internship.');
        } finally {
            setLoading(false);
        }
    };


    const handlePromoApply = (e: React.MouseEvent) => {
        e.preventDefault();
        if (promoCode.trim().toUpperCase() === 'FREE') {
            setPromoApplied(true);
            alert('Promo Code Applied Successfully: ₹0 Admin Processing Charge!');
        } else {
            alert('Invalid coupon code. Try code "FREE".');
        }
    };

    // Indian States lists matching form
    const indianStates = [
        'Punjab', 'Chandigarh', 'Delhi', 'Haryana', 'Himachal Pradesh',
        'Uttar Pradesh', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Karnataka',
        'Tamil Nadu', 'Telangana', 'West Bengal', 'Bihar', 'Madhya Pradesh'
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-transparent dark:from-slate-900/10 dark:via-slate-950 dark:to-transparent py-12 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* LEFT SIDE: INCLUSIONS & DETAILS */}
                    <div className="lg:col-span-5 space-y-8 sticky top-24">

                        <div className="space-y-4">
                            <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 text-[10px] uppercase font-bold text-slate-800 bg-white shadow-sm border border-slate-100 rounded-full dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350">
                                <Sparkles size={11} className="text-amber-500" />
                                <span>MSME Registered Platform</span>
                            </span>

                            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                                Start Your Virtual <br />
                                <span className="text-blue-600 dark:text-blue-400">Internship</span>
                            </h1>

                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                Join task-based remote internships designed to build real portfolio skills. Earn offer letters, digital ID cards, and QR-verified certificates.
                            </p>
                        </div>

                        {/* DYNAMIC SELECTED STREAM PREVIEW CONTAINER */}
                        {selectedDomain ? (
                            <div className="p-6 bg-emerald-600 dark:bg-emerald-700 rounded-3xl text-white space-y-4 shadow-xl border border-emerald-500/20 relative overflow-hidden">
                                {/* Back glow decoration */}
                                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>

                                <div className="flex items-center space-x-4 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-white text-emerald-700 flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                                        {getDomainCode(selectedDomain.title)}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-lg leading-tight tracking-tight">
                                            {selectedDomain.title.replace(/\s*\(\d+\s*months?\)/gi, '').replace(/\s*internship\s*/i, '').trim()}
                                        </h3>
                                        <span className="text-[9px] tracking-widest uppercase opacity-90 font-extrabold mt-0.5 block">
                                            Selected Internship Stream
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs font-medium leading-relaxed opacity-95 relative z-10">
                                    {selectedDomain.description}
                                </p>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 relative z-10">
                                    <div className="py-2.5 px-3 bg-white/10 rounded-2xl text-center backdrop-blur-md">
                                        <span className="text-[9px] uppercase tracking-wider block opacity-75 font-bold">Syllabus</span>
                                        <span className="text-xs font-extrabold block mt-0.5">
                                            {getDurationTaskCount(selectedDuration)} Projects
                                        </span>
                                    </div>
                                    <div className="py-2.5 px-3 bg-white/10 rounded-2xl text-center backdrop-blur-md">
                                        <span className="text-[9px] uppercase tracking-wider block opacity-75 font-bold">Credential Status</span>
                                        <span className="text-xs font-extrabold block mt-0.5">QR Verified</span>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-3 border-t border-white/10 relative z-10">
                                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-75 block">Syllabus Projects Curriculum:</span>
                                    <ul className="text-[11px] space-y-1.5 pl-1.5 font-medium leading-tight">
                                        {getSyllabusList(selectedDomain, selectedDuration).map((title: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-emerald-250 mt-0.5">•</span>
                                                <span>{title}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 bg-blue-50/30 border border-blue-100 dark:bg-slate-900/40 dark:border-slate-800 rounded-3xl flex flex-col items-center text-center space-y-3">
                                <div className="w-12 h-12 bg-amber-50/40 text-amber-500 rounded-2xl flex items-center justify-center dark:bg-amber-950/20">
                                    <Sparkles size={24} />
                                </div>
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex-shrink-0">Select an Internship Domain</h4>
                                <p className="text-xs text-slate-450 dark:text-slate-500">
                                    Choose your preferred stream on the right to preview task scope, curriculum workloads, and verified certificates.
                                </p>
                            </div>
                        )}

                        {/* Inclusions Check list */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internship Inclusions</h4>
                            <div className="space-y-3">

                                <div className="flex items-start space-x-3 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                                    <div>
                                        <p className="text-xs font-bold"><span className="text-slate-900 dark:text-white font-extrabold">Offer Letter:</span> Dispatched to email instantly upon registration.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                                    <div>
                                        <p className="text-xs font-bold"><span className="text-slate-900 dark:text-white font-extrabold">Student ID Card:</span> Issued digitally in your dashboard immediately.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 text-slate-700 dark:text-slate-300">
                                    <CheckCircle2 className="text-emerald-500 mt-0.5 flex-shrink-0" size={16} />
                                    <div>
                                        <p className="text-xs font-bold"><span className="text-slate-900 dark:text-white font-extrabold">Verified Certificates:</span> QR-linked and searchable credentials portal.</p>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* RIGHT SIDE: REGISTRATION FORM */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-805 shadow-xl space-y-6">
                        <form onSubmit={handleApply} className="space-y-5">

                            {/* Domain Select Dropdown */}
                            <div>
                                <label className="text-xs font-extrabold text-slate-880 dark:text-slate-200 block mb-1.5">
                                    Select Internship Domain *
                                </label>
                                <select
                                    required
                                    value={selectedDomainId}
                                    onChange={(e) => setSelectedDomainId(e.target.value)}
                                    className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-750 dark:text-slate-250 cursor-pointer"
                                >
                                    <option value="">Choose a learning stream...</option>
                                    {courses.map((c) => {
                                        const cleanTitle = c.title.replace(/\s*\(\d+\s*months?\)/gi, '').replace(/\s*internship/i, '').trim();
                                        return (
                                            <option key={c.id} value={c.id}>
                                                {cleanTitle} Internship ({selectedDuration})
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Full Name & Phone Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter mobile number"
                                        className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Email Address & Password (Only rendered if visitor is NOT authenticated guest) */}
                            {!user && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter email address"
                                            className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Account Password *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Set secure password"
                                            className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* College & Year */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">College / University Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={college}
                                        onChange={(e) => setCollege(e.target.value)}
                                        placeholder="Enter institution name"
                                        className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-550 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Year of Study *</label>
                                    <input
                                        type="text"
                                        required
                                        value={yearOfStudy}
                                        onChange={(e) => setYearOfStudy(e.target.value)}
                                        placeholder="e.g. 3rd Year"
                                        className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Course Branch & Photo upload */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Course / Branch *</label>
                                    <input
                                        type="text"
                                        required
                                        value={courseBranch}
                                        onChange={(e) => setCourseBranch(e.target.value)}
                                        placeholder="e.g. B.Tech CSE"
                                        className="w-full p-3 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 text-slate-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold text-slate-850 dark:text-slate-200 block mb-1.5">Profile Photo (Optional)</label>
                                    <div className="relative w-full p-2.5 border border-slate-200 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs cursor-pointer">
                                        <span className="text-slate-400 font-semibold">{profilePhoto ? profilePhoto.name : 'No file chosen'}</span>
                                        <label className="px-3 py-1 bg-slate-950 text-white rounded font-bold hover:bg-black cursor-pointer dark:bg-slate-850 dark:hover:bg-slate-800 transition">
                                            Choose File
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => e.target.files && setProfilePhoto(e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Location Details Grouping */}
                            <div className="pt-2">
                                <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-850 dark:text-slate-200 mb-3 uppercase tracking-wider">
                                    <MapPin size={14} className="text-pink-600" />
                                    <span>Location Details</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450 block mb-1">Country *</label>
                                        <select
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            className="w-full p-2.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs"
                                        >
                                            <option value="India">🇮🇳 India</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-450 block mb-1">State / Union Territory *</label>
                                        <select
                                            required
                                            value={stateName}
                                            onChange={(e) => setStateName(e.target.value)}
                                            className="w-full p-2.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold"
                                        >
                                            <option value="">Select State / UT</option>
                                            {indianStates.map((st) => (
                                                <option key={st} value={st}>{st}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-505 block mb-1">District *</label>
                                        {stateName && stateDistrictsMap[stateName] ? (
                                            <select
                                                required
                                                value={district}
                                                onChange={(e) => setDistrict(e.target.value)}
                                                className="w-full p-2.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold"
                                            >
                                                <option value="">Select District</option>
                                                {stateDistrictsMap[stateName].map((dist) => (
                                                    <option key={dist} value={dist}>{dist}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                required
                                                value={district}
                                                onChange={(e) => setDistrict(e.target.value)}
                                                placeholder="Select District"
                                                className="w-full p-2.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-505 block mb-1">City / Town *</label>
                                        <input
                                            type="text"
                                            required
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="Enter your City / Town"
                                            className="w-full p-2.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-505 block mb-1">PIN Code *</label>
                                        <input
                                            type="text"
                                            required
                                            pattern="[0-9]{6}"
                                            value={pinCode}
                                            onChange={(e) => setPinCode(e.target.value)}
                                            placeholder="6 Digit PIN Code"
                                            className="w-full p-2.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* DURATION SELECTOR CARDS - MATCHING IMAGE 2 */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-extrabold text-slate-850 dark:text-slate-205 block">
                                    Select Internship Duration *
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    {[
                                        { label: '1 Month', tasks: '5 tasks — perfect for a quick start' },
                                        { label: '2 Months', tasks: '8 tasks — more depth and practice' },
                                        { label: '3 Months', tasks: '10 tasks — build a solid portfolio' },
                                        { label: '6 Months', tasks: '12 tasks — master the domain' }
                                    ].map((dur) => (
                                        <button
                                            key={dur.label}
                                            type="button"
                                            onClick={() => setSelectedDuration(dur.label)}
                                            className={`p-3 rounded-2xl border text-left transition select-none flex flex-col justify-between h-[86px] ${selectedDuration === dur.label
                                                ? 'border-emerald-600 bg-emerald-50/20 text-emerald-700 dark:border-emerald-500'
                                                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950'
                                                }`}
                                        >
                                            <span className="text-xs font-extrabold block">{dur.label}</span>
                                            <span className="text-[9px] text-slate-400 font-semibold block leading-tight">{dur.tasks}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Promo Coupon Code */}
                            <div className="space-y-1.5 pt-2">
                                <label className="text-xs font-extrabold text-slate-850 dark:text-slate-205 block">Promo / Coupon Code (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder="Enter coupon code (try FREE)"
                                        className="flex-1 p-3 border border-slate-250 bg-slate-50 dark:bg-slate-950 dark:border-slate-855 rounded-xl text-xs text-slate-800 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={handlePromoApply}
                                        className="px-6 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:bg-slate-805 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        Apply
                                    </button>
                                </div>
                                {promoApplied && (
                                    <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">✓ Coupon active — ₹0 program enrollment launched!</p>
                                )}
                            </div>

                            {/* Launch Internship Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-4 flex items-center justify-center space-x-1.5 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl hover:from-blue-950 hover:to-indigo-955 font-bold transition shadow-lg text-sm active:scale-95 transform duration-150"
                            >
                                <span>{loading ? 'Launching Internship...' : 'Apply & Launch Internship'}</span>
                                <ChevronRight size={16} />
                            </button>

                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Internship;
