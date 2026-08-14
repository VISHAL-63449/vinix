import axios, { AxiosAdapter } from 'axios';

// Create a real instance without the custom adapter to make actual HTTP requests
const realHttp = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Configure realHttp interceptor
realHttp.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('vionix_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Define Mock Data Initializer
const initMockDB = () => {
    // Repair/ensure admin credentials exist even if mock database was initialized previously
    const existingUsersStr = localStorage.getItem('vionix_mock_users');
    if (existingUsersStr) {
        try {
            const users = JSON.parse(existingUsersStr);
            const hasVishal = users.some((u: { email: string }) => u.email.toLowerCase() === 'vishal@vinix.com');
            const hasVishai = users.some((u: { email: string }) => u.email.toLowerCase() === 'vishai@vinix.com');
            let updated = false;
            if (!hasVishal) {
                users.push({ id: 'mock-user-admin-2', name: 'Vishal R', email: 'vishal@vinix.com', password: 'vis@2007', role: 'ADMIN', skills: [] });
                updated = true;
            }
            if (!hasVishai) {
                users.push({ id: 'mock-user-admin-3', name: 'Vishal R', email: 'vishai@vinix.com', password: 'vis@2007', role: 'ADMIN', skills: [] });
                updated = true;
            }
            if (updated) {
                localStorage.setItem('vionix_mock_users', JSON.stringify(users));
            }
        } catch (e) {
            console.debug('Failed to parse mock users:', e);
        }
    }

    if (localStorage.getItem('vionix_mock_initialized') === 'true') {
        return;
    }

    const defaultUsers = [
        { id: 'mock-user-student-1', name: 'Vishal R', email: 'student@vinix.com', password: 'student123', role: 'STUDENT', skills: ['React', 'JavaScript', 'HTML5', 'CSS3'] },
        { id: 'mock-user-student-2', name: 'Vishal R', email: 'student@vionix.com', password: 'student123', role: 'STUDENT', skills: ['React', 'JavaScript', 'HTML5', 'CSS3'] },
        { id: 'mock-user-admin-1', name: 'Vishal R', email: 'admin@vionix.com', password: 'admin123', role: 'ADMIN', skills: [] },
        { id: 'mock-user-admin-2', name: 'Vishal R', email: 'vishal@vinix.com', password: 'vis@2007', role: 'ADMIN', skills: [] }
    ];
    localStorage.setItem('vionix_mock_users', JSON.stringify(defaultUsers));

    const REAL_COURSE_UUIDS: { [key: string]: string } = {
        'mock-course-py': 'f5c82880-0b87-4927-b401-14b7199bb7a7',
        'mock-course-java': 'd43656b9-af1b-4643-8fb4-14e4d8d5a480',
        'mock-course-react': '34377e6b-2108-4866-ab8d-c3232f1484c9',
        'mock-course-ml': '06b27150-dd09-42d4-8f59-a28311fab263',
        'mock-course-fs': '95d1c0e2-d14b-4c24-bda9-5b7fdb5b92d9',
        'mock-course-py_intern': '59760c89-c3c5-4b94-9302-2a6527f53ee7',
        'mock-course-jv': '86a8d353-846b-4b9d-9287-283f9e5f6577',
        'mock-course-me': 'f2984958-b57c-445a-bb7f-bc838ebadd1f',
        'mock-course-ma': '14a448de-6a84-4f20-b762-7f39cc7d4d51',
        'mock-course-ai': 'fbbf3fe6-a698-4886-bc5d-9f48cc14f725',
        'mock-course-ds': 'e785a0a0-017d-4acc-b9c8-3d52776c4fb0',
        'mock-course-ux': '5f586279-16d1-4d7e-8dba-b70bce4e2734',
        'mock-course-cs': '6ee274d7-b3a6-475c-8c8b-127c35448963',
        'mock-course-wd': 'ba74cea8-305b-4eeb-a3f1-b0ed1a6de32e',
        'mock-course-fe': '664885f8-66b7-4563-af6f-4b15054044f7',
        'mock-course-be': 'e553b2b9-04ec-4deb-a908-178013c46dda'
    };

    const baseCourses = [
        {
            id: REAL_COURSE_UUIDS['mock-course-py'],
            title: 'Python Programming Masterclass',
            category: 'Programming',
            description: 'Learn Python from scratch, including OOP, data structures, and scripting.',
            duration: '8 Weeks',
            type: 'COURSE',
            skills: ['Python', 'Data Structures', 'OOP'],
            lessons: [
                { title: 'Introduction to Python & Installation', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10 mins' },
                { title: 'Variables and Data Types', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' },
                { title: 'Control Flow and Loops', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '20 mins' },
                { title: 'Functions & Modules', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '25 mins' }
            ],
            assignments: [{ id: 'py_assign_1', title: 'Basic Calculator', desc: 'Create a CLI calculator that handles +, -, *, / with input validation.' }],
            quizzes: [{ question: 'What is the syntax for a list in Python?', options: ['[]', '{}', '()', '<>'], answer: '[]' }]
        },
        {
            id: REAL_COURSE_UUIDS['mock-course-java'],
            title: 'Java Development Foundations',
            category: 'Programming',
            description: 'Master Java basics, object-oriented concepts, and multithreading.',
            duration: '10 Weeks',
            type: 'COURSE',
            skills: ['Java', 'OOP', 'JDK'],
            lessons: [{ title: 'Setting up Java JDK & IDE', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '12 mins' }],
            assignments: [],
            quizzes: []
        },
        {
            id: REAL_COURSE_UUIDS['mock-course-react'],
            title: 'React.js Core Concepts',
            category: 'Web Development',
            description: 'Deep dive into JSX, State, Props, Hooks, and API integrations in React.',
            duration: '6 Weeks',
            type: 'COURSE',
            skills: ['React', 'JavaScript', 'Hooks', 'Vite'],
            lessons: [
                { title: 'What is React?', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '8 mins' },
                { title: 'State and Props explained', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '18 mins' },
                { title: 'Handling Hooks (useState, useEffect)', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '22 mins' }
            ],
            assignments: [{ id: 'react_assign_1', title: 'Todo App with LocalStorage', desc: 'Build a Todo application with filter features and persistent storage.' }],
            quizzes: [{ question: 'Which hook is used for side-effects in React?', options: ['useState', 'useRef', 'useEffect', 'useMemo'], answer: 'useEffect' }]
        },
        {
            id: REAL_COURSE_UUIDS['mock-course-ml'],
            title: 'Introduction to Machine Learning',
            category: 'AI & Data',
            description: 'Learn Regression, Classification, Clustering, and build models using Scikit-Learn.',
            duration: '12 Weeks',
            type: 'COURSE',
            skills: ['Python', 'Scikit-Learn', 'Maths'],
            lessons: [{ title: 'ML Overview', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' }],
            assignments: [],
            quizzes: []
        }
    ];

    const domainsRaw = [
        ['FS', 'Full Stack Development', 'Programming', 'Node.js,Express,React,Database', 'Internship Management Portal,E-Commerce Platform,Job Portal,Hospital Management System'],
        ['PY', 'Python Development', 'Programming', 'Python,Django,Flask,OOP', 'Expense Tracker,Library Management System,Billing System,Inventory Management System'],
        ['JV', 'Java Development', 'Programming', 'Java,Spring Boot,OOP,JDBC', 'Banking Management System,Hospital Management System,Employee Payroll System,Online Examination System'],
        ['ME', 'MERN Stack Development', 'Web Development', 'MongoDB,Express,React,Node.js', 'E-Commerce Platform,Social Media App,Job Portal,Online Learning Platform'],
        ['MA', 'MEAN Stack Development', 'Web Development', 'MongoDB,Express,Angular,Node.js', 'Event Management System,Healthcare Portal,Employee Management System,Food Delivery Platform'],
        ['AI', 'AI & Machine Learning', 'AI & Data', 'Python,TensorFlow,scikit-learn,PyTorch', 'Student Performance Prediction,Resume Screening System,Recommendation Engine,Fraud Detection System'],
        ['DS', 'Data Science', 'AI & Data', 'Python,Pandas,NumPy,Data Visualization', 'Customer Churn Prediction,Sales Forecasting,Customer Segmentation,Stock Market Analysis'],
        ['UX', 'UI/UX Designer', 'Design', 'Figma,Wireframing,Prototyping,User Research', 'E-Learning App Design,Banking App Design,Food Delivery App Design,Travel App Design'],
        ['CS', 'Cyber Security', 'Network & Security', 'Penetration Testing,Network Security,Cryptography', 'Network Intrusion Detection,Phishing Detection,Secure File Sharing,Security Monitoring Dashboard'],
        ['WD', 'Web Development', 'Web Development', 'HTML,CSS,JavaScript,Responsive Design', 'Event Management Website,Online Booking System,College Portal,E-Commerce Website'],
        ['FE', 'Frontend Development', 'Web Development', 'HTML,CSS,JavaScript,React,Tailwind', 'Portfolio Website,E-Commerce UI,Admin Dashboard,Social Media Interface'],
        ['BE', 'Backend Development', 'Web Development', 'Node.js,Express,databases,REST APIs', 'Employee Management API,E-Commerce API,Authentication Service,Payment Management API'],
        ['RE', 'React Development', 'Web Development', 'React,Redux,Hooks,Vite', 'Task Management Dashboard,E-Commerce App,Admin Dashboard,Real-Time Chat App'],
        ['ND', 'Node.js Development', 'Web Development', 'Node.js,Express,REST APIs,NPM', 'Food Ordering API,Chat Application Backend,REST API Platform,Booking Management System'],
        ['PH', 'PHP Development', 'Web Development', 'PHP,MySQL,OOP,Laravel', 'College Management System,Hospital Management System,Online Shopping System,Library Management System'],
        ['DJ', 'Django Development', 'Programming', 'Python,Django,REST API', 'Online Examination System,Blog Platform,Learning Management System,Job Portal'],
        ['AN', 'Android Development', 'Mobile App Development', 'Kotlin,Android Studio,Jetpack Compose', 'Attendance App,Expense Tracker,Fitness App,Student Management App'],
        ['FL', 'Flutter Development', 'Mobile App Development', 'Dart,Flutter,Cross-platform', 'Food Delivery App,Travel Booking App,Shopping App,Event Booking App'],
        ['DA', 'Data Analytics', 'AI & Data', 'Excel,BI Tools,SQL,Data Analytics', 'Sales Dashboard,HR Analytics Dashboard,Marketing Analytics,Customer Behavior Analysis'],
        ['DL', 'Deep Learning', 'AI & Data', 'Neural Networks,Keras,PyTorch,CNN', 'Image Classification,Face Recognition,Object Detection,Handwritten Digit Recognition'],
        ['CV', 'Computer Vision', 'AI & Data', 'OpenCV,Image Processing,CNN,YOLO', 'Face Recognition Attendance,Object Detection,Number Plate Recognition,Document Scanner'],
        ['NL', 'Natural Language Processing', 'AI & Data', 'NLP,BERT,NLTK,Transformers', 'AI Chatbot,Sentiment Analysis,Resume Analyzer,Text Summarization System'],
        ['CC', 'Cloud Computing', 'Cloud & DevOps', 'Cloud Services,Virtualization,Infrastructure', 'Cloud File Storage,Cloud-Based LMS,Cloud Backup System,Cloud Task Management'],
        ['DV', 'DevOps', 'Cloud & DevOps', 'CI/CD,Docker,Kubernetes,GitHub Actions', 'CI/CD Pipeline,Automated Deployment System,Dockerized Web Application,DevOps Monitoring Dashboard'],
        ['AW', 'AWS Cloud Development', 'Cloud & DevOps', 'AWS Services,Serverless,IAM,S3', 'AWS-Based E-Commerce Platform,Cloud File Storage,Serverless API,AWS-Based E-Commerce Platform'],
        ['BC', 'Blockchain Development', 'Web3', 'Solidity,Smart Contracts,Web3.js,Ethereum', 'Certificate Verification,Digital Voting,Supply Chain Tracking,Digital Identity System'],
        ['IO', 'IoT Development', 'Hardware', 'Raspberry Pi,Arduino,Sensors,Microcontrollers', 'Smart Home Automation,Smart Agriculture,Smart Parking,Smart Energy Monitoring'],
        ['ES', 'Embedded Systems', 'Hardware', 'C/C++,Microcontrollers,Embedded C,RTOS', 'Temperature Monitoring,Smart Security System,Automatic Street Light,Smart Irrigation'],
        ['QA', 'Software Testing & QA', 'Programming', 'Manual Testing,Selenium,Automation,Jest', 'Automated Testing Framework,E-Commerce Test Suite,API Testing System,Performance Testing Platform'],
        ['DM', 'Digital Marketing', 'Marketing', 'SEO,SEM,Social Media,Content Strategy', 'Marketing Analytics Dashboard,SEO Tracker,Social Media Campaign Manager,Email Campaign System'],
        ['GD', 'Graphic Design', 'Design', 'Photoshop,Illustrator,Branding,Typography', 'Brand Identity,Social Media Design System,Marketing Campaign Design,Corporate Branding'],
        ['PM', 'Project Management', 'Management', 'Agile,Scrum,Trello,Jira', 'Project Tracking System,Team Collaboration Platform,Task Management Dashboard,Resource Management System'],
        ['PM', 'Database Management', 'Programming', 'SQL,NoSQL,Database Tuning,Scaling', 'Inventory Database System,Hospital Database,Student Database,Employee Database'],
        ['SQL', 'SQL Development', 'Programming', 'SQL,Queries,Stored Procedures,Views', 'Sales Reporting System,Banking Database,Customer Analytics Database,Business Intelligence Database'],
        ['UI', 'UI Design', 'Design', 'Figma,UI Design,Designing', 'Banking App Interface,E-Commerce Interface,Dashboard Design,Healthcare App Interface'],
        ['UXD', 'UX Design', 'Design', 'Figma,UX Research,Information Architecture', 'E-Commerce UX,Banking UX,Healthcare UX,Learning Platform UX']
    ];

    const derivedInternships = domainsRaw.map((row) => {
        const [code, name, category, skillsCsv, projectsCsv] = row;
        const skills = skillsCsv.split(',');
        const projects = projectsCsv.split(',');
        const baseId = `mock-course-${code.toLowerCase()}`;
        const realId = REAL_COURSE_UUIDS[baseId] || REAL_COURSE_UUIDS[baseId + '_intern'] || baseId;

        return {
            id: realId,
            title: `${name} Internship`,
            category: category,
            description: `Task-based virtual internship where you build clean ${name} applications and projects.`,
            duration: '3 Months',
            type: 'INTERNSHIP',
            skills: skills,
            lessons: [
                { title: 'Project 1 Overview & Setup', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10 mins' },
                { title: 'Connecting Frontend to Backend', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' },
                { title: 'Task Submission Instructions', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '8 mins' }
            ],
            assignments: projects.map((projTitle, idx) => ({
                id: `${code.toLowerCase()}_intern_task_${idx + 1}`,
                title: projTitle,
                desc: `Design and implement the ${projTitle} for this internship domain program.`
            })),
            quizzes: []
        };
    });

    const allCourses = [...baseCourses, ...derivedInternships];
    localStorage.setItem('vionix_mock_courses', JSON.stringify(allCourses));

    const webCourse = allCourses.find(c => c.title === 'Web Development Internship');
    const pyCourse = allCourses.find(c => c.title === 'Python Development Internship');
    const reactCourse = allCourses.find(c => c.title === 'React.js Core Concepts');

    const defaultEnrollments = [];
    if (webCourse) {
        defaultEnrollments.push(
            { id: 'mock-enroll-web-1', userId: 'mock-user-student-1', courseId: webCourse.id, progress: 100, status: 'COMPLETED', joinedAt: '2026-07-21T12:00:00.000Z' },
            { id: 'mock-enroll-web-2', userId: 'mock-user-student-2', courseId: webCourse.id, progress: 100, status: 'COMPLETED', joinedAt: '2026-07-21T12:00:00.000Z' }
        );
    }
    if (pyCourse) {
        defaultEnrollments.push(
            { id: 'mock-enroll-py-1', userId: 'mock-user-student-1', courseId: pyCourse.id, progress: 33, status: 'ENROLLED', joinedAt: '2026-08-01T12:00:00.000Z' },
            { id: 'mock-enroll-py-2', userId: 'mock-user-student-2', courseId: pyCourse.id, progress: 33, status: 'ENROLLED', joinedAt: '2026-08-01T12:00:00.000Z' }
        );
    }
    if (reactCourse) {
        defaultEnrollments.push(
            { id: 'mock-enroll-react-1', userId: 'mock-user-student-1', courseId: reactCourse.id, progress: 60, status: 'ENROLLED', joinedAt: '2026-08-02T12:00:00.000Z' },
            { id: 'mock-enroll-react-2', userId: 'mock-user-student-2', courseId: reactCourse.id, progress: 60, status: 'ENROLLED', joinedAt: '2026-08-02T12:00:00.000Z' }
        );
    }
    localStorage.setItem('vionix_mock_enrollments', JSON.stringify(defaultEnrollments));

    const defaultOfferLetters = [];
    if (webCourse) {
        const o1 = {
            id: 'mock-offer-1',
            offerLetterId: 'VINIX-OFFER-2026-1757',
            studentId: 'mock-user-student-1',
            internshipId: webCourse.id,
            studentName: 'Vishal R',
            studentEmail: 'student@vinix.com',
            internshipTitle: 'Web Development Internship',
            internshipDomain: 'web-development',
            startDate: '2026-07-21T12:00:00.000Z',
            endDate: '2026-10-21T12:00:00.000Z',
            duration: '3 Months',
            mentorName: 'Amit Sharma',
            issueDate: '2026-07-21T12:00:00.000Z',
            status: 'ACCEPTED',
            verificationToken: 'vinix-offer-verify-token-student-1',
            pdfUrl: '/uploads/offer-letters/VINIX-OFFER-2026-1757.pdf',
            createdAt: '2026-07-21T12:00:00.000Z',
            updatedAt: '2026-07-21T12:00:00.000Z'
        };
        const o2 = { ...o1, id: 'mock-offer-2', studentId: 'mock-user-student-2', studentEmail: 'student@vionix.com' };
        defaultOfferLetters.push(o1, o2);
    }
    localStorage.setItem('vionix_mock_offer_letters', JSON.stringify(defaultOfferLetters));

    const defaultProjects = [
        { id: 'mock-proj-1', studentId: 'mock-user-student-1', title: 'Full Stack Development Tasks Submission', description: 'Completed tasks: 1. CSS/HTML Portfolio, 2. React E-Commerce Storefront UI, 3. JWT Express REST Server with tests.', githubLink: 'https://github.com/vishal9932/vinix-web-internship', status: 'APPROVED', feedback: 'Outstanding work! Code is highly structured, and styling matches requirements perfectly.', submittedAt: '2026-08-01T12:00:00.000Z' },
        { id: 'mock-proj-2', studentId: 'mock-user-student-2', title: 'Full Stack Development Tasks Submission', description: 'Completed tasks: 1. CSS/HTML Portfolio, 2. React E-Commerce Storefront UI, 3. JWT Express REST Server with tests.', githubLink: 'https://github.com/vishal9932/vinix-web-internship', status: 'APPROVED', feedback: 'Outstanding work! Code is highly structured, and styling matches requirements perfectly.', submittedAt: '2026-08-01T12:00:00.000Z' },
        { id: 'mock-proj-3', studentId: 'mock-user-student-1', title: 'Web Scraping Bot - Task 1', description: 'Python script to scrape product prices using BeautifulSoup4. Results exported as CSV format.', githubLink: 'https://github.com/vishal9932/python-web-scraper', status: 'PENDING', submittedAt: '2026-08-05T12:00:00.000Z' },
        { id: 'mock-proj-4', studentId: 'mock-user-student-2', title: 'Web Scraping Bot - Task 1', description: 'Python script to scrape product prices using BeautifulSoup4. Results exported as CSV format.', githubLink: 'https://github.com/vishal9932/python-web-scraper', status: 'PENDING', submittedAt: '2026-08-05T12:00:00.000Z' }
    ];
    localStorage.setItem('vionix_mock_projects', JSON.stringify(defaultProjects));

    const defaultCertificates = [
        { id: 'mock-cert-1', studentId: 'mock-user-student-1', courseName: 'Web Development Internship', certificateNumber: 'VINIX-WEB-2026-0001', issueDate: '2026-08-04T12:00:00.000Z', verificationURL: 'http://localhost:5173/verify/VINIX-WEB-2026-0001' },
        { id: 'mock-cert-2', studentId: 'mock-user-student-2', courseName: 'Web Development Internship', certificateNumber: 'VINIX-WEB-2026-0001', issueDate: '2026-08-04T12:00:00.000Z', verificationURL: 'http://localhost:5173/verify/VINIX-WEB-2026-0001' }
    ];
    localStorage.setItem('vionix_mock_certificates', JSON.stringify(defaultCertificates));

    const defaultEmailLogs = [
        { id: 'mock-log-1', emailTo: 'aravind@gmail.com', studentName: 'Aravind S', documentType: 'OFFER_LETTER', status: 'SENT', subject: 'Your Vinix Internship Offer Letter', referenceId: 'VINIX-OFFER-2026-1001', sentAt: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: 'mock-log-2', emailTo: 'student@vinix.com', studentName: 'Vishal R', documentType: 'CERTIFICATE', status: 'SENT', subject: 'Your Vinix Internship Certificate', referenceId: 'VINIX-WEB-2026-0001', sentAt: new Date(Date.now() - 7200000).toISOString(), createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: 'mock-log-3', emailTo: 'aditya@gmail.com', studentName: 'Aditya Kumar', documentType: 'OFFER_LETTER', status: 'SENT', subject: 'Your Vinix Internship Offer Letter', referenceId: 'VINIX-OFFER-2026-1002', sentAt: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() }
    ];
    localStorage.setItem('vionix_mock_email_logs', JSON.stringify(defaultEmailLogs));

    localStorage.setItem('vionix_mock_initialized', 'true');
};

const calculateAndUpdateMockProgress = (userId: string, courseId: string) => {
    const enrollments = JSON.parse(localStorage.getItem('vionix_mock_enrollments') || '[]');
    const courses = JSON.parse(localStorage.getItem('vionix_mock_courses') || '[]');
    const projects = JSON.parse(localStorage.getItem('vionix_mock_projects') || '[]');

    const enrollment = enrollments.find((e: { userId: string; courseId: string }) => e.userId === userId && e.courseId === courseId);
    if (!enrollment) return;

    const course = courses.find((c: { id: string; title: string; assignments?: { title: string }[] }) => c.id === courseId);
    if (!course) return;

    const assignments = course.assignments || [];
    const totalAssignments = assignments.length;
    let submittedCount = 0;

    const studentProjects = projects.filter((p: { studentId: string; title: string }) => p.studentId === userId);

    if (totalAssignments > 0) {
        assignments.forEach((as: { title: string }) => {
            const hasProj = studentProjects.some((p: { title: string }) =>
                p.title.toLowerCase().includes(as.title.toLowerCase()) ||
                as.title.toLowerCase().includes(p.title.toLowerCase())
            );
            if (hasProj) submittedCount++;
        });
    }

    const hasLinkedIn = !!enrollment.linkedinUrl;

    let newProgress = 0;
    if (totalAssignments > 0) {
        newProgress = (hasLinkedIn ? 20 : 0) + Math.round((submittedCount / totalAssignments) * 80);
    } else {
        newProgress = hasLinkedIn ? 100 : 0;
    }

    newProgress = Math.min(100, Math.max(0, newProgress));
    enrollment.progress = newProgress;
    enrollment.status = newProgress === 100 ? 'COMPLETED' : 'ongoing';

    // Generate mock certificate if progress reaches 100%
    if (newProgress === 100) {
        enrollment.status = 'COMPLETED';
        const certificates = JSON.parse(localStorage.getItem('vionix_mock_certificates') || '[]');
        const courseName = course.title || 'Virtual Internship';
        const cleanName = courseName.toLowerCase().includes('python') ? 'PY' : 'WEB';
        const certificateNumber = `VINIX-${cleanName}-2026-${String(10000 + certificates.length + 1).substring(1)}`;

        if (!certificates.some((c: { studentId: string; courseName: string }) => c.studentId === userId && c.courseName === courseName)) {
            certificates.push({
                id: `mock-cert-${Date.now()}`,
                studentId: userId,
                courseName,
                certificateNumber,
                issueDate: new Date().toISOString(),
                verificationURL: `${window.location.origin}/verify/${certificateNumber}`
            });
            localStorage.setItem('vionix_mock_certificates', JSON.stringify(certificates));
        }
    }

    localStorage.setItem('vionix_mock_enrollments', JSON.stringify(enrollments));
};

// Fulfill request locally simulating Express server endpoints
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleMockRequest = async (config: { url?: string; method?: string; data?: unknown; headers?: Record<string, unknown> }): Promise<any> => {
    initMockDB();

    const getStore = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
    const setStore = (key: string, val: unknown) => localStorage.setItem(key, JSON.stringify(val));

    let path = config.url || '';
    if (path.startsWith('http://localhost:5000/api')) {
        path = path.replace('http://localhost:5000/api', '');
    } else if (path.startsWith('/api')) {
        path = path.replace('/api', '');
    }

    const method = (config.method || 'get').toLowerCase();

    // Parse current user from JWT token
    const authHeader = config.headers?.Authorization || config.headers?.authorization || '';
    let currentUserId = '';
    const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '').trim() : '';
    if (token) {
        if (token.startsWith('mock_token_')) {
            currentUserId = token.replace('mock_token_', '');
        } else {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserId = payload.id;
            } catch (e) {
                console.debug('Failed to parse JWT payload:', e);
            }
        }
    }
    if (!currentUserId) {
        const storedToken = localStorage.getItem('vionix_token') || '';
        if (storedToken.startsWith('mock_token_')) {
            currentUserId = storedToken.replace('mock_token_', '');
        }
    }

    const users = getStore('vionix_mock_users');
    const courses = getStore('vionix_mock_courses');
    const enrollments = getStore('vionix_mock_enrollments');
    const offerLetters = getStore('vionix_mock_offer_letters');
    const projects = getStore('vionix_mock_projects');
    const certificates = getStore('vionix_mock_certificates');
    const emailLogs = getStore('vionix_mock_email_logs');

    const currentUser = users.find((u: { id: string }) => u.id === currentUserId);

    let parsedData: Record<string, unknown> = {};
    if (config.data) {
        try {
            parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        } catch (e) {
            console.debug('Failed to parse config data:', e);
        }
    }

    const returnJSON = (data: unknown, status = 200) => {
        return Promise.resolve({
            data,
            status,
            statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
            headers: {},
            config
        });
    };

    const returnError = (message: string, status = 400) => {
        return Promise.reject({
            response: {
                data: { message },
                status,
                headers: {},
                config
            },
            message
        });
    };

    // Routing endpoints simulation
    // 1. Authentication routes
    if (path === '/auth/login' && method === 'post') {
        const email = parsedData.email as string;
        const password = parsedData.password as string;
        const user = users.find((u: { email: string }) => u.email.toLowerCase() === (email || '').toLowerCase());
        if (!user || (user as Record<string, unknown>).password !== password) {
            return returnError('Invalid email or password.', 401);
        }
        return returnJSON({
            token: `mock_token_${(user as Record<string, unknown>).id}`,
            user: { id: (user as Record<string, unknown>).id, name: (user as Record<string, unknown>).name, email: (user as Record<string, unknown>).email, role: (user as Record<string, unknown>).role, skills: (user as Record<string, unknown>).skills || [] }
        });
    }

    if (path === '/auth/register' && method === 'post') {
        const name = parsedData.name as string;
        const email = parsedData.email as string;
        const password = parsedData.password as string;
        const role = parsedData.role as string;
        if (!name || !email || !password) {
            return returnError('Name, email and password are required.', 400);
        }
        if (users.some((u: { email: string }) => u.email.toLowerCase() === email.toLowerCase())) {
            return returnError('User with this email already exists.', 400);
        }
        const newUser = {
            id: `mock-user-${Date.now()}`,
            name,
            email,
            password,
            role: role === 'ADMIN' ? 'ADMIN' : 'STUDENT',
            skills: []
        };
        users.push(newUser);
        setStore('vionix_mock_users', users);
        return returnJSON({
            token: `mock_token_${newUser.id}`,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, skills: [] }
        }, 201);
    }

    if (path === '/auth/me' && method === 'get') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        return returnJSON({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            skills: currentUser.skills || [],
            createdAt: new Date().toISOString()
        });
    }

    if (path === '/auth/profile' && method === 'put') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const { name, skills } = parsedData;
        currentUser.name = name || currentUser.name;
        currentUser.skills = skills || currentUser.skills;
        setStore('vionix_mock_users', users);
        return returnJSON({
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            skills: currentUser.skills
        });
    }

    // 2. Courses routes
    if (path === '/courses' && method === 'get') {
        return returnJSON(courses);
    }

    if (path === '/courses' && method === 'post') {
        const newCourse = { ...parsedData, id: `mock-course-${Date.now()}` };
        courses.push(newCourse);
        setStore('vionix_mock_courses', courses);
        return returnJSON(newCourse, 201);
    }

    if (path.startsWith('/courses/') && method === 'put') {
        const id = path.replace('/courses/', '');
        const index = courses.findIndex((c: { id: string }) => c.id === id);
        if (index === -1) return returnError('Course not found.', 404);
        courses[index] = { ...courses[index], ...parsedData };
        setStore('vionix_mock_courses', courses);
        return returnJSON(courses[index]);
    }

    if (path.startsWith('/courses/') && method === 'delete') {
        const id = path.replace('/courses/', '');
        const filtered = courses.filter((c: { id: string }) => c.id !== id);
        setStore('vionix_mock_courses', filtered);
        return returnJSON({ message: 'Course deleted.' });
    }

    // 3. Enrollments routes
    if (path === '/enrollments/my' && method === 'get') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const myEnrollments = enrollments
            .filter((e: { userId: string }) => e.userId === currentUserId)
            .map((e: { courseId: string }) => {
                const c = courses.find((course: { id: string }) => course.id === e.courseId);
                return { ...e, course: c };
            });
        return returnJSON(myEnrollments);
    }

    if (path === '/enrollments/admin/all' && method === 'get') {
        const allEnroll = enrollments.map((e: { userId: string; courseId: string }) => {
            const u = users.find((user: { id: string }) => user.id === e.userId);
            const c = courses.find((course: { id: string }) => course.id === e.courseId);
            return {
                ...e,
                user: u ? { name: (u as Record<string, unknown>).name, email: (u as Record<string, unknown>).email } : null,
                course: c ? { title: (c as Record<string, unknown>).title } : null
            };
        });
        return returnJSON(allEnroll);
    }

    if (path === '/enrollments/enroll' && method === 'post') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const courseId = parsedData.courseId as string;
        const duration = parsedData.duration as string;
        const phone = parsedData.phone as string;
        const college = parsedData.college as string;
        const course = courses.find((c: { id: string }) => c.id === courseId);
        if (!course) return returnError('Course/Internship not found.', 404);

        let enrollment = enrollments.find((e: { userId: string; courseId: string }) => e.userId === currentUserId && e.courseId === courseId);
        if (!enrollment) {
            enrollment = {
                id: `mock-enroll-${Date.now()}`,
                userId: currentUserId,
                courseId: course.id,
                progress: 0,
                status: 'ongoing',
                joinedAt: new Date().toISOString()
            };
            enrollments.push(enrollment);
            setStore('vionix_mock_enrollments', enrollments);

            // Automatically generate offer letter for internships
            if (course.type === 'INTERNSHIP') {
                const idTag = String(1000 + offerLetters.length + 1);
                const offerLetterId = `VINIX-OFFER-2026-${idTag}`;
                const newLetter = {
                    id: `mock-letter-${Date.now()}`,
                    offerLetterId,
                    studentId: currentUserId,
                    internshipId: course.id,
                    studentName: currentUser.name,
                    studentEmail: currentUser.email,
                    studentPhone: phone || 'N/A',
                    studentCollege: college || 'N/A',
                    internshipTitle: course.title,
                    internshipDomain: course.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    startDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                    duration: duration || '3 Months',
                    mentorName: 'Amit Sharma',
                    issueDate: new Date().toISOString(),
                    status: 'ACCEPTED',
                    pdfUrl: `/uploads/offer-letters/${offerLetterId}.pdf`,
                    verificationToken: `mock-verify-${Date.now()}`,
                    createdAt: new Date().toISOString()
                };
                offerLetters.push(newLetter);
                setStore('vionix_mock_offer_letters', offerLetters);
            }
        }
        return returnJSON(enrollment, 201);
    }

    if (path === '/enrollments/progress' && method === 'put') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const courseId = parsedData.courseId as string;
        const progress = parsedData.progress as number;
        const enrollment = enrollments.find((e: { userId: string; courseId: string }) => e.userId === currentUserId && e.courseId === courseId);
        if (!enrollment) return returnError('Enrollment not found.', 404);

        (enrollment as Record<string, unknown>).progress = progress;
        if (progress === 100) {
            (enrollment as Record<string, unknown>).status = 'COMPLETED';

            // Generate mock certificate
            const course = courses.find((c: { id: string; title: string }) => c.id === courseId);
            const courseName = course ? course.title : 'Virtual Internship';
            const cleanName = courseName.toLowerCase().includes('python') ? 'PY' : 'WEB';
            const certificateNumber = `VINIX-${cleanName}-2026-${String(10000 + certificates.length + 1).substring(1)}`;

            if (!certificates.some((c: { studentId: string; courseName: string }) => c.studentId === currentUserId && c.courseName === courseName)) {
                certificates.push({
                    id: `mock-cert-${Date.now()}`,
                    studentId: currentUserId,
                    courseName,
                    certificateNumber,
                    issueDate: new Date().toISOString(),
                    verificationURL: `${window.location.origin}/verify/${certificateNumber}`
                });
                setStore('vionix_mock_certificates', certificates);
            }
        }
        setStore('vionix_mock_enrollments', enrollments);
        return returnJSON(enrollment);
    }

    if (path === '/enrollments/linkedin' && method === 'put') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const courseId = parsedData.courseId as string;
        const linkedinUrl = parsedData.linkedinUrl as string;
        const enrollment = enrollments.find((e: { userId: string; courseId: string }) => e.userId === currentUserId && e.courseId === courseId);
        if (!enrollment) return returnError('Enrollment not found.', 404);

        (enrollment as Record<string, unknown>).linkedinUrl = linkedinUrl;
        setStore('vionix_mock_enrollments', enrollments);

        // Calculate and update progress
        calculateAndUpdateMockProgress(currentUserId, courseId);

        // Fetch updated enrollment
        const updatedEnrollments = getStore('vionix_mock_enrollments');
        const updated = updatedEnrollments.find((e: { userId: string; courseId: string }) => e.userId === currentUserId && e.courseId === courseId);
        const c = courses.find((course: { id: string }) => course.id === courseId);
        return returnJSON({ ...updated, course: c });
    }

    if (path.startsWith('/enrollments/admin/') && method === 'delete') {
        const id = path.replace('/enrollments/admin/', '');
        const filtered = enrollments.filter((e: { id: string }) => e.id !== id);
        setStore('vionix_mock_enrollments', filtered);
        return returnJSON({ message: 'Enrollment deleted successfully.' });
    }

    // 4. Projects/Submissions routes
    if (path === '/projects' && method === 'get') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        if (currentUser.role === 'ADMIN') {
            const mappedProjects = projects.map((p: { studentId: string }) => {
                const u = users.find((user: { id: string }) => user.id === p.studentId);
                return {
                    ...p,
                    student: u ? { name: (u as Record<string, unknown>).name, email: (u as Record<string, unknown>).email } : null
                };
            });
            return returnJSON(mappedProjects);
        } else {
            const myProjects = projects.filter((p: { studentId: string }) => p.studentId === currentUserId);
            return returnJSON(myProjects);
        }
    }

    if (path === '/projects/submit' && method === 'post') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const title = parsedData.title as string;
        const description = parsedData.description as string;
        const githubLink = parsedData.githubLink as string;
        const newProj = {
            id: `mock-proj-${Date.now()}`,
            studentId: currentUserId,
            title,
            description,
            githubLink,
            status: 'PENDING',
            submittedAt: new Date().toISOString()
        };
        projects.push(newProj);
        setStore('vionix_mock_projects', projects);

        // Find matching enrollments to update progress
        const myEnrollments = enrollments.filter((e: { userId: string; courseId: string; }) => e.userId === currentUserId);
        for (const enroll of myEnrollments) {
            const course = courses.find((c: { id: string; assignments?: { title: string }[] }) => c.id === enroll.courseId);
            const assignments = course ? (course.assignments || []) : [];
            const isMatch = assignments.some((as: { title: string }) =>
                as.title.toLowerCase().includes(title.toLowerCase()) ||
                title.toLowerCase().includes(as.title.toLowerCase())
            );
            if (isMatch) {
                // Call progress updater (defer slightly so that mock DB state is fully flushed if asynchronous, though setStore is sync)
                calculateAndUpdateMockProgress(currentUserId, enroll.courseId);
            }
        }

        return returnJSON(newProj, 201);
    }

    if (path.startsWith('/projects/review/') && method === 'put') {
        if (!currentUser || currentUser.role !== 'ADMIN') return returnError('Admin role required.', 403);
        const id = path.replace('/projects/review/', '');
        const proj = projects.find((p: { id: string }) => p.id === id);
        if (!proj) return returnError('Project submission not found.', 404);

        const { status, feedback } = parsedData;
        (proj as Record<string, unknown>).status = status;
        (proj as Record<string, unknown>).feedback = feedback;
        setStore('vionix_mock_projects', projects);
        return returnJSON(proj);
    }

    // 5. Certificates routes
    if (path === '/certificates/my' && method === 'get') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const myCertificates = certificates.filter((c: { studentId: string }) => c.studentId === currentUserId);
        return returnJSON(myCertificates);
    }

    if (path === '/certificates' && method === 'get') {
        if (!currentUser || currentUser.role !== 'ADMIN') return returnError('Admin role required.', 403);
        const mappedCerts = certificates.map((c: { studentId: string }) => {
            const u = users.find((user: { id: string }) => user.id === c.studentId);
            return {
                ...c,
                student: u ? { name: (u as Record<string, unknown>).name } : null
            };
        });
        return returnJSON(mappedCerts);
    }

    if (path.startsWith('/certificates/verify/') && method === 'get') {
        const certNo = path.replace('/certificates/verify/', '');
        const cert = certificates.find((c: { certificateNumber: string }) => c.certificateNumber === certNo);
        if (!cert) return returnError('Certificate number not found.', 404);

        const certObj = cert as Record<string, unknown>;
        const u = users.find((user: { id: string }) => user.id === certObj.studentId);
        return returnJSON({
            verified: true,
            certificateNumber: certObj.certificateNumber,
            studentName: u ? (u as Record<string, unknown>).name : 'Unknown Graduate',
            courseName: certObj.courseName,
            issueDate: certObj.issueDate,
            organization: 'Vinix Technologies',
            status: 'VERIFIED'
        });
    }

    // 6. Offer Letters routes
    if (path === '/offer-letters' && method === 'get') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const myLetters = offerLetters.filter((o: { studentId: string }) => o.studentId === currentUserId);
        return returnJSON(myLetters);
    }

    if (path.startsWith('/offer-letters/verify/') && method === 'get') {
        const verifyToken = path.replace('/offer-letters/verify/', '');
        const letter = offerLetters.find((o: { verificationToken?: string; offerLetterId?: string }) => o.verificationToken === verifyToken || o.offerLetterId === verifyToken);
        if (!letter) return returnError('Invalid offer letter verification token.', 404);

        return returnJSON({
            verified: true,
            offerLetterId: (letter as Record<string, unknown>).offerLetterId,
            studentName: (letter as Record<string, unknown>).studentName,
            internshipTitle: (letter as Record<string, unknown>).internshipTitle,
            duration: (letter as Record<string, unknown>).duration,
            issueDate: (letter as Record<string, unknown>).issueDate,
            status: (letter as Record<string, unknown>).status,
            verificationResult: '✓ Offer Letter Verified'
        });
    }

    if (path.startsWith('/offer-letters/') && path.endsWith('/accept') && method === 'post') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const id = path.replace('/offer-letters/', '').replace('/accept', '');
        const letter = offerLetters.find((o: { id: string }) => o.id === id);
        if (!letter) return returnError('Offer letter not found.', 404);
        (letter as Record<string, unknown>).status = 'ACCEPTED';
        setStore('vionix_mock_offer_letters', offerLetters);
        return returnJSON(letter);
    }

    if (path.startsWith('/offer-letters/') && path.endsWith('/decline') && method === 'post') {
        if (!currentUser) return returnError('Not authenticated.', 401);
        const id = path.replace('/offer-letters/', '').replace('/decline', '');
        const letter = offerLetters.find((o: { id: string }) => o.id === id);
        if (!letter) return returnError('Offer letter not found.', 404);
        (letter as Record<string, unknown>).status = 'DECLINED';
        setStore('vionix_mock_offer_letters', offerLetters);
        return returnJSON(letter);
    }

    if (path === '/admin/offer-letters' && method === 'get') {
        if (!currentUser || currentUser.role !== 'ADMIN') return returnError('Admin role required.', 403);
        return returnJSON(offerLetters);
    }

    if (path === '/admin/email-logs' && method === 'get') {
        if (!currentUser || currentUser.role !== 'ADMIN') return returnError('Admin role required.', 403);
        return returnJSON(emailLogs);
    }

    return returnError('Endpoint mock route not implemented.', 404);
};

// Create primary API client
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Register Axios custom fallback adapter
const customAdapter: AxiosAdapter = async (config) => {
    try {
        const realConfig = { ...config, adapter: undefined };
        const response = await realHttp.request(realConfig);
        return response;
    } catch (error) {
        const err = error as Record<string, unknown>;
        // If it's a network error/refused connection, fall back to mock processing
        const isNetworkError = err?.message === 'Network Error' || err?.code === 'ERR_NETWORK' || !err?.response;
        if (isNetworkError) {
            console.warn('Backend server connection failed. Redirecting to local Mock database in client mode.');
            return handleMockRequest(config);
        }
        throw error;
    }
};

api.defaults.adapter = customAdapter;

// Interceptor to inject JWT token on request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('vionix_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
