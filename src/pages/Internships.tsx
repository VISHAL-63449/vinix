import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { createClient } from '@supabase/supabase-js';

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';
const supabaseAdmin = createClient('https://ioppccrnbuqgcynmjpaa.supabase.co', serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});
import { useAuth } from '../contexts/AuthContext';
import {
    ChevronDown, MapPin, Mail, Lock, ArrowRight,
    Star, CheckCircle2, Clock
} from 'lucide-react';

/* ─────────────────────── Domain & Task Data ─────────────────────── */
interface DomainData {
    id: string;
    code: string;
    label: string;
    title: string;
    bg: string;
    description: string;
    tasks: {
        '1 Month': string[];
        '2 Months': string[];
        '3 Months': string[];
    };
}

const DOMAINS: DomainData[] = [
    {
        id: 'fullstack', code: 'FS',
        label: 'Full Stack Development',
        title: 'Full Stack Development',
        bg: '#0fa471',
        description: 'Build web apps with React, Express, and databases.',
        tasks: {
            '1 Month': [
                'Modular Structure and Validation Implementation',
                'Performance Optimization & Code Refactoring',
                'Security Auditing & Penetration Tests',
                'CI/CD Pipeline Setup & Verification',
                'Final Production Deployment & Capstone Submission',
            ],
            '2 Months': [
                'Modular Structure and Validation Implementation',
                'Performance Optimization & Code Refactoring',
                'Security Auditing & Penetration Tests',
                'CI/CD Pipeline Setup & Verification',
                'Final Production Deployment & Capstone Submission',
                'API Gateway Integration & Microservices Configuration',
                'Advanced Database Query Tuning & Caching Orchestration',
                'End-to-End Testing with Cypress & Automated Coverage Reporting',
            ],
            '3 Months': [
                'Modular Structure and Validation Implementation',
                'Performance Optimization & Code Refactoring',
                'Security Auditing & Penetration Tests',
                'CI/CD Pipeline Setup & Verification',
                'Final Production Deployment & Capstone Submission',
                'API Gateway Integration & Microservices Configuration',
                'Advanced Database Query Tuning & Caching Orchestration',
                'End-to-End Testing with Cypress & Automated Coverage Reporting',
                'Multi-Tenant RBAC & Advanced Security Guardrails',
                'Distributed Logging, Observability & Analytics Dashboards',
            ],
        },
    },
    {
        id: 'python', code: 'PY',
        label: 'Python Development',
        title: 'Python Development',
        bg: '#2563eb',
        description: 'Build automation scripts, data pipelines, and REST APIs with Python.',
        tasks: {
            '1 Month': [
                'Create a Calculator',
                'Create a Number Guessing Game',
                'Create a To-Do List',
                'Create a Student Management System',
            ],
            '2 Months': [
                'Create a Calculator',
                'Create a Number Guessing Game',
                'Create a To-Do List',
                'Create a File Management Program',
                'Create a Student Management System',
                'Connect Python with SQLite',
                'Create a Python REST API',
                'Create a Python Application',
            ],
            '3 Months': [
                'Create a Calculator',
                'Create a Number Guessing Game',
                'Create a To-Do List',
                'Create a File Management Program',
                'Create a Student Management System',
                'Create a Database Application',
                'Create a REST API',
                'Create a Flask Web Application',
                'Create a Python Automation Project',
                'Create a Complete Python Project',
            ],
        },
    },
    {
        id: 'java', code: 'JV',
        label: 'Java Development',
        title: 'Java Development',
        bg: '#ea580c',
        description: 'Master OOP, collections, Spring Boot basics and backend systems.',
        tasks: {
            '1 Month': [
                'Create a Calculator',
                'Create a Student Grade Calculator',
                'Create a Bank Account System',
                'Create a Java Mini Project',
            ],
            '2 Months': [
                'Create a Calculator',
                'Create a Student Grade Calculator',
                'Create a Bank Account System',
                'Create a Library Management System',
                'Connect Java with Database',
                'Create a JDBC Application',
                'Create a Spring Boot CRUD Application',
                'Create a Java Application',
            ],
            '3 Months': [
                'Create a Calculator',
                'Create a Student Grade Calculator',
                'Create a Bank Account System',
                'Create a Library Management System',
                'Connect Java with Database',
                'Create a JDBC Application',
                'Create a REST API',
                'Create a Spring Boot Application',
                'Create a Java Web Application',
                'Create a Complete Java Project',
            ],
        },
    },
    {
        id: 'aiml', code: 'AI',
        label: 'Artificial Intelligence & Machine Learning',
        title: 'AI & Machine Learning',
        bg: '#7c3aed',
        description: 'Build neural networks, train ML models, and deploy AI pipelines.',
        tasks: {
            '1 Month': [
                'Analyze a Dataset',
                'Clean a Dataset',
                'Create a Prediction Model',
                'Create an ML Mini Project',
            ],
            '2 Months': [
                'Analyze a Dataset',
                'Clean a Dataset',
                'Create Data Visualizations',
                'Build a Regression Model',
                'Build a Classification Model',
                'Create a Prediction System',
                'Evaluate an ML Model',
                'Create an ML Application',
            ],
            '3 Months': [
                'Analyze a Dataset',
                'Clean a Dataset',
                'Create Data Visualizations',
                'Perform Exploratory Data Analysis',
                'Build a Regression Model',
                'Build a Classification Model',
                'Build a Clustering Model',
                'Compare ML Models',
                'Deploy an ML Model',
                'Create an AI/ML Application',
            ],
        },
    },
    {
        id: 'datascience', code: 'DS',
        label: 'Data Science',
        title: 'Data Science',
        bg: '#0891b2',
        description: 'Analyse data, build ML models, and visualise insights.',
        tasks: {
            '1 Month': [
                'Analyze a Dataset',
                'Clean a Dataset',
                'Create a Data Visualization',
                'Create a Data Analysis Project',
            ],
            '2 Months': [
                'Analyze a Dataset',
                'Clean a Dataset',
                'Use NumPy for Data Analysis',
                'Use Pandas for Data Analysis',
                'Create Data Visualizations',
                'Perform Exploratory Data Analysis',
                'Create a Data Dashboard',
                'Create a Data Science Project',
            ],
            '3 Months': [
                'Analyze a Dataset',
                'Clean a Dataset',
                'Use NumPy for Data Analysis',
                'Use Pandas for Data Analysis',
                'Perform Exploratory Data Analysis',
                'Create Data Visualizations',
                'Perform Statistical Analysis',
                'Create a Data Dashboard',
                'Analyze a Real-World Dataset',
                'Create a Complete Data Science Project',
            ],
        },
    },
    {
        id: 'dataanalytics', code: 'DA',
        label: 'Data Analytics',
        title: 'Data Analytics',
        bg: '#0f766e',
        description: 'Turn raw business data into actionable insights and dashboards.',
        tasks: {
            '1 Month': [
                'Collect a Dataset',
                'Clean the Dataset',
                'Analyze the Data',
                'Create a Data Dashboard',
            ],
            '2 Months': [
                'Collect a Dataset',
                'Clean the Dataset',
                'Transform the Data',
                'Analyze the Data',
                'Create Charts & Graphs',
                'Create a Business Dashboard',
                'Generate Business Insights',
                'Create a Data Analytics Project',
            ],
            '3 Months': [
                'Collect a Dataset',
                'Clean the Dataset',
                'Transform the Data',
                'Analyze the Data',
                'Create Charts & Graphs',
                'Create a Business Dashboard',
                'Perform Sales Analysis',
                'Perform Customer Analysis',
                'Generate Business Insights',
                'Create a Complete Analytics Project',
            ],
        },
    },
    {
        id: 'uiux', code: 'UX',
        label: 'UI/UX Design',
        title: 'UI/UX Design',
        bg: '#db2777',
        description: 'Design stunning interfaces, wireframes, and interactive prototypes.',
        tasks: {
            '1 Month': [
                'Create a User Persona',
                'Create a Website Wireframe',
                'Design a Website UI',
                'Create a Mobile App Prototype',
            ],
            '2 Months': [
                'Create a User Persona',
                'Create a User Journey',
                'Create a Website Wireframe',
                'Design a Landing Page',
                'Design a Mobile App',
                'Create a Design System',
                'Create an Interactive Prototype',
                'Create a UI/UX Case Study',
            ],
            '3 Months': [
                'Create a User Persona',
                'Create a User Journey',
                'Create a Website Wireframe',
                'Design a Landing Page',
                'Design a Mobile App',
                'Create a Design System',
                'Design a Dashboard',
                'Create an Interactive Prototype',
                'Perform Usability Testing',
                'Create a Complete UI/UX Case Study',
            ],
        },
    },
    {
        id: 'cloud', code: 'CC',
        label: 'Cloud Computing',
        title: 'Cloud Computing',
        bg: '#1d4ed8',
        description: 'Deploy scalable applications on AWS, GCP, or Azure.',
        tasks: {
            '1 Month': [
                'Create a Cloud Storage',
                'Create a Virtual Machine',
                'Deploy a Website',
                'Deploy a Cloud Application',
            ],
            '2 Months': [
                'Create Cloud Storage',
                'Create a Virtual Machine',
                'Create a Cloud Database',
                'Configure Cloud Networking',
                'Deploy a Website',
                'Deploy a Web Application',
                'Configure Cloud Monitoring',
                'Create a Cloud Project',
            ],
            '3 Months': [
                'Create Cloud Storage',
                'Create a Virtual Machine',
                'Create a Cloud Database',
                'Configure Cloud Networking',
                'Deploy a Website',
                'Deploy a Web Application',
                'Create a Serverless Application',
                'Configure Cloud Security',
                'Monitor Cloud Resources',
                'Create a Complete Cloud Project',
            ],
        },
    },
    {
        id: 'cybersecurity', code: 'CS',
        label: 'Cybersecurity',
        title: 'Cybersecurity',
        bg: '#dc2626',
        description: 'Identify vulnerabilities, harden systems, and build secure applications.',
        tasks: {
            '1 Month': [
                'Create a Secure Login System',
                'Perform Password Security Testing',
                'Perform Web Security Testing',
                'Create a Security Assessment Report',
            ],
            '2 Months': [
                'Create a Secure Login System',
                'Configure Network Security',
                'Configure Linux Security',
                'Implement Access Control',
                'Test Web Application Security',
                'Secure a Database',
                'Monitor Security Events',
                'Create a Security Assessment Project',
            ],
            '3 Months': [
                'Create a Secure Login System',
                'Configure Network Security',
                'Configure Linux Security',
                'Implement Access Control',
                'Test Web Application Security',
                'Secure a Database',
                'Perform Security Testing',
                'Perform Vulnerability Assessment',
                'Monitor Security Events',
                'Create a Cybersecurity Project',
            ],
        },
    },
    {
        id: 'mobile', code: 'MA',
        label: 'Mobile App Development',
        title: 'Mobile App Development',
        bg: '#7c3aed',
        description: 'Build cross-platform mobile apps with Flutter or React Native.',
        tasks: {
            '1 Month': [
                'Create a Mobile Login Screen',
                'Create a Mobile Registration Screen',
                'Create a To-Do List App',
                'Create a Mobile Mini Project',
            ],
            '2 Months': [
                'Create a Mobile Login Screen',
                'Create a Mobile Registration Screen',
                'Create a To-Do List App',
                'Add Local Data Storage',
                'Connect App with REST API',
                'Add User Authentication',
                'Add App Notifications',
                'Create a Mobile Application',
            ],
            '3 Months': [
                'Create a Mobile Login Screen',
                'Create a Mobile Registration Screen',
                'Create a To-Do List App',
                'Add Local Data Storage',
                'Connect App with REST API',
                'Add User Authentication',
                'Add App Notifications',
                'Add Payment Integration',
                'Test & Optimize the App',
                'Create a Complete Mobile Application',
            ],
        },
    },
    {
        id: 'devops', code: 'DO',
        label: 'DevOps',
        title: 'DevOps',
        bg: '#374151',
        description: 'Automate CI/CD pipelines, containerize apps, and manage cloud deployments.',
        tasks: {
            '1 Month': [
                'Create a GitHub Repository',
                'Create a Docker Container',
                'Create a CI/CD Pipeline',
                'Deploy an Application',
            ],
            '2 Months': [
                'Create a GitHub Repository',
                'Create Git Branches',
                'Create a Docker Container',
                'Create a Docker Compose Application',
                'Create a CI/CD Pipeline',
                'Deploy an Application',
                'Monitor an Application',
                'Create a DevOps Project',
            ],
            '3 Months': [
                'Create a GitHub Repository',
                'Create Git Branches',
                'Create a Docker Container',
                'Create a Docker Compose Application',
                'Create a CI/CD Pipeline',
                'Deploy an Application',
                'Configure Cloud Deployment',
                'Configure Application Monitoring',
                'Automate the Deployment Process',
                'Create a Complete DevOps Project',
            ],
        },
    },
    {
        id: 'sql', code: 'DB',
        label: 'SQL & Database Development',
        title: 'SQL & Database Development',
        bg: '#b45309',
        description: 'Design relational schemas, write complex queries, and connect databases to apps.',
        tasks: {
            '1 Month': [
                'Create a Student Database',
                'Create Database Tables',
                'Write SQL Queries',
                'Create a Database Project',
            ],
            '2 Months': [
                'Create a Student Database',
                'Create Database Tables',
                'Insert & Update Data',
                'Write SQL Queries',
                'Use SQL Joins',
                'Create Views & Procedures',
                'Connect Database with Application',
                'Create a Database Project',
            ],
            '3 Months': [
                'Create a Student Database',
                'Create Database Tables',
                'Insert & Update Data',
                'Write SQL Queries',
                'Use SQL Joins',
                'Create Views & Procedures',
                'Create Database Relationships',
                'Connect Database with Application',
                'Optimize Database Queries',
                'Create a Complete Database Project',
            ],
        },
    },
    {
        id: 'genai', code: 'GA',
        label: 'Generative AI',
        title: 'Generative AI',
        bg: '#6d28d9',
        description: 'Build AI chatbots, RAG apps, and LLM-powered tools.',
        tasks: {
            '1 Month': [
                'Create a Prompt Library',
                'Create an AI Chatbot',
                'Connect an AI API',
                'Create a Generative AI Mini Project',
            ],
            '2 Months': [
                'Create a Prompt Library',
                'Create an AI Chatbot',
                'Connect an AI API',
                'Create an AI Text Generator',
                'Create an AI Document Assistant',
                'Add AI Function Calling',
                'Create a RAG Application',
                'Create a Generative AI Application',
            ],
            '3 Months': [
                'Create a Prompt Library',
                'Create an AI Chatbot',
                'Connect an AI API',
                'Create an AI Text Generator',
                'Create an AI Document Assistant',
                'Create a RAG Application',
                'Add AI Function Calling',
                'Create an AI Voice Assistant',
                'Deploy an AI Application',
                'Create a Complete Generative AI Project',
            ],
        },
    },
    {
        id: 'blockchain', code: 'BC',
        label: 'Blockchain Development',
        title: 'Blockchain Development',
        bg: '#0369a1',
        description: 'Build smart contracts, DApps, and Web3 integrations.',
        tasks: {
            '1 Month': [
                'Create a Blockchain Wallet',
                'Create a Simple Smart Contract',
                'Create a Token Contract',
                'Create a Blockchain Mini Project',
            ],
            '2 Months': [
                'Create a Blockchain Wallet',
                'Create a Simple Smart Contract',
                'Create a Token Contract',
                'Create a Smart Contract Application',
                'Connect a Web3 Application',
                'Create a Blockchain Transaction App',
                'Create a Decentralized Application',
                'Create a Blockchain Project',
            ],
            '3 Months': [
                'Create a Blockchain Wallet',
                'Create a Simple Smart Contract',
                'Create a Token Contract',
                'Create a Smart Contract Application',
                'Connect a Web3 Application',
                'Create a Blockchain Transaction App',
                'Create a Decentralized Application',
                'Create a Decentralized Marketplace',
                'Deploy a Smart Contract',
                'Create a Complete Blockchain Project',
            ],
        },
    },
    {
        id: 'qa', code: 'QA',
        label: 'Software Testing & QA',
        title: 'Software Testing & QA',
        bg: '#0f766e',
        description: 'Write test cases, perform manual & automated testing, and ensure quality.',
        tasks: {
            '1 Month': [
                'Create Test Cases',
                'Test a Login Page',
                'Test a Web Application',
                'Create a Testing Report',
            ],
            '2 Months': [
                'Create Test Cases',
                'Test a Login Page',
                'Test a Registration Page',
                'Test a Web Application',
                'Perform API Testing',
                'Perform Database Testing',
                'Create Automated Tests',
                'Create a QA Testing Project',
            ],
            '3 Months': [
                'Create Test Cases',
                'Test a Login Page',
                'Test a Registration Page',
                'Test a Web Application',
                'Perform API Testing',
                'Perform Database Testing',
                'Create Automated Tests',
                'Perform Performance Testing',
                'Create a Bug Tracking Report',
                'Create a Complete QA Project',
            ],
        },
    },
    {
        id: 'iot', code: 'IoT',
        label: 'IoT & Embedded Systems',
        title: 'IoT & Embedded Systems',
        bg: '#065f46',
        description: 'Connect sensors, control hardware, and send data to the cloud.',
        tasks: {
            '1 Month': [
                'Create an LED Control System',
                'Connect a Temperature Sensor',
                'Create an IoT Monitoring System',
                'Create an IoT Mini Project',
            ],
            '2 Months': [
                'Create an LED Control System',
                'Connect a Temperature Sensor',
                'Connect a Motion Sensor',
                'Create a Smart Light System',
                'Send Sensor Data to Cloud',
                'Create an IoT Dashboard',
                'Add Remote Device Control',
                'Create an IoT Project',
            ],
            '3 Months': [
                'Create an LED Control System',
                'Connect a Temperature Sensor',
                'Connect a Motion Sensor',
                'Create a Smart Light System',
                'Connect Sensors to the Internet',
                'Send Sensor Data to Cloud',
                'Create an IoT Dashboard',
                'Add Remote Device Control',
                'Create a Real-Time Monitoring System',
                'Create a Complete IoT Project',
            ],
        },
    },
];

const DURATIONS: { label: '1 Month' | '2 Months' | '3 Months'; sublabel: string }[] = [
    { label: '1 Month', sublabel: 'perfect for a quick start' },
    { label: '2 Months', sublabel: 'more depth and practice' },
    { label: '3 Months', sublabel: 'build a solid portfolio' },
];

const INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli', 'Daman & Diu',
    'Delhi', 'Lakshadweep', 'Puducherry', 'Ladakh', 'Jammu & Kashmir',
];

/* ─────────────────────── Component ─────────────────────── */
const Internships: React.FC = () => {
    const { user, profile } = useAuth();
    const navigate = useNavigate();

    const [selectedDomainId, setSelectedDomainId] = useState('fullstack');
    const [durationIdx, setDurationIdx] = useState(0);

    const [form, setForm] = useState({
        fullName: '', phone: '', email: '', password: '',
        college: '', yearOfStudy: '', courseBranch: '',
        country: 'TN India', state: '', district: '', city: '', pin: '',
        promo: '',
    });
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && profile) {
            setForm(f => ({
                ...f,
                fullName: profile.full_name || '',
                email: user.email || '',
                phone: (profile as any).phone || '',
            }));
        }
    }, [user, profile]);

    const activeDomain = DOMAINS.find(d => d.id === selectedDomainId) || DOMAINS[0];
    const activeDuration = DURATIONS[durationIdx];
    const curriculum = activeDomain.tasks[activeDuration.label];

    const upd = (key: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
            setForm(f => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            let uid = user?.id;
            if (!uid) {
                const { data: a, error: ae } = await supabase.auth.signUp({
                    email: form.email,
                    password: form.password,
                    options: { data: { name: form.fullName, role: 'student', college: form.college } },
                });
                if (ae) throw ae;
                uid = a.user?.id;

                // Set session if signed up successfully
                if (a.session) {
                    await supabase.auth.setSession(a.session);
                } else {
                    await supabase.auth.signInWithPassword({
                        email: form.email,
                        password: form.password
                    });
                }
            }
            if (!uid) throw new Error('Authentication failed.');

            // 1. Host user profile
            const { error: profErr } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: uid,
                    email: form.email,
                    full_name: form.fullName,
                    name: form.fullName,
                    role: 'student',
                    college: form.college
                });
            if (profErr) throw profErr;

            // 2. Host student profile details
            try {
                const { error: studProfErr } = await supabaseAdmin
                    .from('student_profiles')
                    .upsert({
                        id: uid,
                        college: form.college
                    });
                if (studProfErr) throw studProfErr;
            } catch (e) {
                console.warn('Ignored student_profiles upsert:', e);
            }

            // 3. Find matching active internship from database
            const { data: dbInters, error: dbIntersErr } = await supabaseAdmin
                .from('internships')
                .select('id, title, category, duration');
            if (dbIntersErr) throw dbIntersErr;

            // Match ONLY by the selected domain's category/title — never fall back to first DB record
            let matchedIntern = (dbInters || []).find(i =>
                (i.category && i.category.toLowerCase() === activeDomain.label.toLowerCase()) ||
                (i.title && i.title.toLowerCase() === activeDomain.title.toLowerCase())
            );

            let internshipId = matchedIntern?.id;
            let internshipTitle = matchedIntern?.title || activeDomain.title;

            // If no matching internship found for this domain, create one with correct domain tasks
            if (!internshipId) {
                const { data: newDbIntern, error: newDbInternErr } = await supabaseAdmin
                    .from('internships')
                    .insert({
                        title: activeDomain.title,
                        category: activeDomain.label,
                        description: activeDomain.description,
                        duration: activeDuration.label,
                        status: 'active'
                    })
                    .select()
                    .single();
                if (newDbInternErr) throw newDbInternErr;

                if (newDbIntern) {
                    internshipId = newDbIntern.id;
                    internshipTitle = newDbIntern.title;

                    // Seed tasks using the actual domain-specific task names
                    const domainTaskNames = curriculum; // tasks for selected duration
                    const defaultTasks: any[] = [
                        {
                            internship_id: internshipId,
                            task_number: 1,
                            title: 'LinkedIn Offer Post Requirement',
                            description: 'Share your internship selection announcement on LinkedIn to unlock tasks.'
                        },
                        ...domainTaskNames.map((taskTitle, idx) => ({
                            internship_id: internshipId,
                            task_number: idx + 2,
                            title: taskTitle,
                            description: `Complete the ${activeDomain.label} task: ${taskTitle}`
                        }))
                    ];
                    const { error: rErr } = await supabaseAdmin.from('internship_tasks').insert(defaultTasks);
                    if (rErr) throw rErr;
                }
            }

            // 4. Update/Insert Internship applications with approved status
            try {
                const { error: appErr } = await supabaseAdmin.from('internship_applications').insert({
                    student_id: uid,
                    internship_id: internshipId,
                    student_name: form.fullName,
                    email: form.email,
                    phone: form.phone,
                    college: form.college,
                    year_of_study: form.yearOfStudy,
                    course_branch: form.courseBranch,
                    country: form.country,
                    state: form.state,
                    district: form.district,
                    city: form.city,
                    pin_code: form.pin,
                    domain: activeDomain.id,
                    duration: activeDuration.label,
                    promo_code: form.promo || null,
                    status: 'approved',
                });
                if (appErr && appErr.code !== '42703' && appErr.code !== 'PGRST205' && appErr.code !== '42P01') {
                    throw appErr;
                }
            } catch (e) {
                console.warn('Bypassing missing internship_applications table:', e);
            }

            // 5. Establish Active Student Enrollments
            if (internshipId) {
                // Check if already enrolled in this internship
                const { data: existingEnroll } = await supabaseAdmin
                    .from('enrollments')
                    .select('id')
                    .eq('student_id', uid)
                    .eq('internship_id', internshipId)
                    .maybeSingle();

                if (!existingEnroll) {
                    const { error: enrollErr } = await supabaseAdmin
                        .from('enrollments')
                        .insert({
                            student_id: uid,
                            user_id: uid,
                            internship_id: internshipId,
                            status: 'active',
                            progress: 0
                        });
                    if (enrollErr && enrollErr.code !== '23505') throw enrollErr;
                }

                // Check if already enrolled in internship_enrollments
                const { data: existingInternEnroll } = await supabaseAdmin
                    .from('internship_enrollments')
                    .select('id')
                    .eq('student_id', uid)
                    .eq('internship_id', internshipId)
                    .maybeSingle();

                if (!existingInternEnroll) {
                    const { error: internEnrollErr } = await supabaseAdmin
                        .from('internship_enrollments')
                        .insert({
                            student_id: uid,
                            user_id: uid,
                            internship_id: internshipId,
                            status: 'active',
                            progress: 0
                        });
                    if (internEnrollErr && internEnrollErr.code !== '23505') throw internEnrollErr;
                }

                // 6. Generate and insert Offer Letter record if not already created
                const { data: existingOffer } = await supabaseAdmin
                    .from('offer_letters')
                    .select('id')
                    .eq('student_id', uid)
                    .eq('internship_id', internshipId)
                    .maybeSingle();

                if (!existingOffer) {
                    const offerLetterId = `VINIX-OFFER-${Math.floor(1000 + Math.random() * 9000)}`;
                    const verificationToken = `tok_offer_${Math.floor(100000 + Math.random() * 900000)}`;

                    const { error: offerErr } = await supabaseAdmin
                        .from('offer_letters')
                        .insert({
                            user_id: uid,
                            student_id: uid,
                            offer_letter_id: offerLetterId,
                            student_name: form.fullName,
                            student_email: form.email,
                            internship_title: internshipTitle,
                            internship_id: internshipId,
                            duration: activeDuration.label,
                            status: 'ACCEPTED',
                            verification_token: verificationToken,
                            issue_date: new Date().toISOString()
                        });
                    if (offerErr && offerErr.code !== '23505') throw offerErr;
                }

                // 7. Seed matching Milestone tasks progress records if not already seeded
                const { data: dbTasks, error: tasksErr } = await supabaseAdmin
                    .from('internship_tasks')
                    .select('id, task_number')
                    .eq('internship_id', internshipId);
                if (tasksErr) throw tasksErr;

                if (dbTasks && dbTasks.length > 0) {
                    const { data: existingProgress } = await supabaseAdmin
                        .from('task_progress')
                        .select('task_id')
                        .eq('student_id', uid)
                        .eq('internship_id', internshipId);

                    const existingTaskIds = new Set((existingProgress || []).map(p => p.task_id));

                    const progressInserts = dbTasks
                        .filter(t => !existingTaskIds.has(t.id))
                        .map(t => ({
                            user_id: uid,
                            student_id: uid,
                            internship_id: internshipId,
                            task_id: t.id,
                            status: t.task_number === 1 ? 'not_submitted' : 'locked',
                            github_url: null,
                            linkedin_url: null,
                            student_note: null,
                            admin_feedback: null,
                            submitted_at: null,
                            reviewed_at: null
                        }));

                    if (progressInserts.length > 0) {
                        const { error: progressErr } = await supabaseAdmin
                            .from('task_progress')
                            .insert(progressInserts);
                        if (progressErr && progressErr.code !== '23505') throw progressErr;
                    }
                }
            }

            setSuccess(true);
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#eef2ff] dark:bg-brand-bgDark">

            {/* MSME badge */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-slate-800 dark:text-slate-205 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-amber-505 text-amber-505" />
                    MSME REGISTERED PLATFORM
                </span>
            </div>

            {/* Two-column layout */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">

                {/* ══════ LEFT PANEL ══════ */}
                <div className="space-y-7">

                    {/* Hero */}
                    <div>
                        <h1 className="text-4xl sm:text-[44px] font-extrabold text-slate-900 dark:text-white leading-[1.15] tracking-tight">
                            Start Your Virtual<br />
                            <span className="text-brand-primary">Internship</span>
                        </h1>
                        <p className="mt-4 text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[340px]">
                            Join task-based remote internships designed to build real portfolio skills.
                            Earn offer letters, digital ID cards, and QR-verified certificates.
                        </p>
                    </div>

                    {/* Domain card — updates on domain + duration change */}
                    <div className="rounded-2xl p-5 text-white shadow-xl transition-all duration-300"
                        style={{ backgroundColor: activeDomain.bg }}>

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center font-extrabold text-[14px] flex-shrink-0" style={{ color: activeDomain.bg }}>
                                {activeDomain.code}
                            </div>
                            <div>
                                <p className="font-extrabold text-[16px] leading-tight text-white">{activeDomain.title}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mt-0.5">
                                    Selected Internship Stream
                                </p>
                            </div>
                        </div>

                        <p className="text-[13px] opacity-80 mb-4 leading-relaxed text-white/90">{activeDomain.description}</p>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Syllabus</p>
                                <p className="font-extrabold text-[15px]">{curriculum.length} Projects</p>
                            </div>
                            <div className="bg-white/15 border border-white/20 rounded-xl p-3 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Credential Status</p>
                                <p className="font-extrabold text-[15px]">QR Verified</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mb-2">
                                Syllabus Projects Curriculum:
                            </p>
                            <ul className="space-y-1.5">
                                {curriculum.map((item, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[12.5px] font-semibold opacity-95">
                                        <span className="font-bold select-none">.</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Internship Inclusions */}
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                            Internship Inclusions
                        </p>
                        <ul className="space-y-3">
                            {[
                                { bold: 'Offer Letter:', rest: 'Dispatched to email instantly upon registration.' },
                                { bold: 'Student ID Card:', rest: 'Issued digitally in your dashboard immediately.' },
                                { bold: 'Verified Certificates:', rest: 'QR-linked and searchable credentials portal.' },
                            ].map(({ bold, rest }) => (
                                <li key={bold} className="flex items-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-snug">
                                        <span className="font-bold">{bold}</span> {rest}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* ══════ RIGHT PANEL ══════ */}
                <div className="bg-white dark:bg-brand-cardDark rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-lg p-6 sm:p-8">

                    {success ? (
                        <div className="py-16 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Application Submitted!</h2>
                            <p className="text-sm text-slate-500">Redirecting to your dashboard…</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {/* Domain selector */}
                            <Field label="Select Internship Domain" required>
                                <div className="relative">
                                    <select value={selectedDomainId} onChange={e => setSelectedDomainId(e.target.value)} className={sel}>
                                        {DOMAINS.map(d => (
                                            <option key={d.id} value={d.id}>
                                                {d.label} Internship ({activeDuration.label})
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                                </div>
                            </Field>

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl font-semibold flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Full Name + Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Full Name" required>
                                    <input type="text" required value={form.fullName} onChange={upd('fullName')} placeholder="Enter your full name" className={inp} />
                                </Field>
                                <Field label="Phone Number" required>
                                    <input type="tel" required value={form.phone} onChange={upd('phone')} placeholder="Enter mobile number" className={inp} />
                                </Field>
                            </div>

                            {/* Email + Password */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Email Address" required>
                                    <input type="email" required value={form.email} onChange={upd('email')} placeholder="Enter email address" className={inp} />
                                </Field>
                                <Field label="Account Password" required>
                                    <input type="password" value={form.password} onChange={upd('password')} placeholder="Set secure password" className={inp} />
                                </Field>
                            </div>

                            {/* College + Year */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="College / University Name" required>
                                    <input type="text" required value={form.college} onChange={upd('college')} placeholder="Enter institution name" className={inp} />
                                </Field>
                                <Field label="Year of Study" required>
                                    <input type="text" required value={form.yearOfStudy} onChange={upd('yearOfStudy')} placeholder="e.g. 3rd Year" className={inp} />
                                </Field>
                            </div>

                            {/* Course + Photo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Course / Branch" required>
                                    <input type="text" required value={form.courseBranch} onChange={upd('courseBranch')} placeholder="e.g. B.Tech CSE" className={inp} />
                                </Field>
                                <Field label="Profile Photo" optional>
                                    <div className="flex items-stretch border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-[#f8fafc] dark:bg-slate-950 h-[46px]">
                                        <span className="flex-1 px-4 py-3 text-[14px] text-slate-400 font-semibold truncate flex items-center leading-none">
                                            {profilePhoto ? profilePhoto.name : 'No file chosen'}
                                        </span>
                                        <label className="cursor-pointer bg-[#0f172a] hover:bg-slate-800 text-white text-[13px] font-bold px-5 py-3 transition whitespace-nowrap flex items-center justify-center select-none leading-none">
                                            Choose File
                                            <input type="file" accept="image/*" className="hidden"
                                                onChange={e => setProfilePhoto(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </Field>
                            </div>

                            {/* Location */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                        Location Details
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <Field label="Country" required>
                                        <div className="relative">
                                            <select value={form.country} onChange={upd('country')} className={sel}>
                                                <option>TN India</option>
                                                <option>India</option>
                                                <option>Other</option>
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                                        </div>
                                    </Field>
                                    <Field label="State / Union Territory" required>
                                        <div className="relative">
                                            <select required value={form.state} onChange={upd('state')} className={sel}>
                                                <option value="">Select State / UT</option>
                                                {INDIA_STATES.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400" />
                                        </div>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Field label="District" required>
                                        <input type="text" required value={form.district} onChange={upd('district')} placeholder="Select District" className={inp} />
                                    </Field>
                                    <Field label="City / Town" required>
                                        <input type="text" required value={form.city} onChange={upd('city')} placeholder="Enter your City / Town" className={inp} />
                                    </Field>
                                    <Field label="PIN Code" required>
                                        <input type="text" required value={form.pin} onChange={upd('pin')} placeholder="6 Digit PIN Code" maxLength={6} className={inp} />
                                    </Field>
                                </div>
                            </div>

                            {/* Duration — 3 options only */}
                            <div>
                                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                    Internship Duration <span className="text-rose-500">*</span>
                                </p>
                                <div className="grid grid-cols-3 gap-3">
                                    {DURATIONS.map((d, i) => (
                                        <button key={d.label} type="button" onClick={() => setDurationIdx(i)}
                                            className={[
                                                'text-left p-3 rounded-xl border-2 transition-all duration-150',
                                                durationIdx === i
                                                    ? 'border-brand-primary bg-blue-50 dark:bg-blue-950/20'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-300',
                                            ].join(' ')}>
                                            <p className={`font-extrabold text-sm ${durationIdx === i ? 'text-brand-primary' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {d.label}
                                            </p>
                                            <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                                                {activeDomain.tasks[d.label].length} tasks — {d.sublabel}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Promo */}
                            <div>
                                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Promo / Coupon Code <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                                </p>
                                <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                    <input type="text" value={form.promo} onChange={upd('promo')}
                                        placeholder="Enter coupon code (try FREE)"
                                        className="flex-1 px-4 py-3 bg-white dark:bg-slate-950 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none" />
                                    <button type="button"
                                        className="px-5 text-[13px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition">
                                        Apply
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={submitting}
                                className="w-full py-4 rounded-xl font-extrabold text-sm text-white shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]"
                                style={{ background: 'linear-gradient(90deg, #1a237e 0%, #283593 100%)' }}>
                                {submitting ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Submitting Application...
                                    </>
                                ) : (
                                    <>Apply &amp; Launch Internship <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

/* ── Shared styles ── */
const inp = 'w-full px-4 py-3 bg-[#f8fafc] hover:bg-white focus:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-950 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition';
const sel = 'w-full pl-4 pr-10 py-3 bg-[#f8fafc] hover:bg-white focus:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-950 dark:focus:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[14px] font-semibold text-slate-800 dark:text-slate-100 appearance-none outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition';

const Field: React.FC<{ label: string; required?: boolean; optional?: boolean; children: React.ReactNode }> =
    ({ label, required, optional, children }) => (
        <div>
            <label className="block text-[13.5px] font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
                {optional && <span className="text-slate-400 font-medium text-xs ml-1">(Optional)</span>}
            </label>
            {children}
        </div>
    );

export default Internships;
