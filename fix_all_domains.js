import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://ioppccrnbuqgcynmjpaa.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0',
    { auth: { persistSession: false, autoRefreshToken: false } }
);

// === DOMAIN DEFINITIONS (mirrors Internships.tsx DOMAINS array) ===
const DOMAINS = {
    fullstack: {
        label: 'Full Stack Development', title: 'Full Stack Development',
        description: 'Build web apps with React, Express, and databases.',
        tasks: {
            '1 Month': [
                'Personal Portfolio Website',
                'Responsive E-Commerce Website',
                'Student Management System',
                'REST API Based To-Do Application'
            ],
            '2 Months': [
                'Personal Portfolio Website',
                'E-Commerce Product Catalog',
                'To-Do Task Management App',
                'Student Management System',
                'Online Quiz Application',
                'Blog Management System',
                'Employee Management System',
                'Full Stack Event Booking System'
            ],
            '3 Months': [
                'Advanced Personal Portfolio',
                'E-Commerce Website',
                'Student Management System',
                'Online Quiz & Examination System',
                'Blog & Content Management System',
                'Employee Management System',
                'Job Portal Website',
                'Online Food Ordering System',
                'Project Management Dashboard',
                'Complete Full Stack Internship Management Platform'
            ]
        }
    },
    python: {
        label: 'Python Development', title: 'Python Development',
        description: 'Build automation scripts, data pipelines, and REST APIs with Python.',
        tasks: {
            '1 Month': ['Create a Calculator', 'Create a Number Guessing Game', 'Create a To-Do List', 'Create a Student Management System'],
            '2 Months': ['Create a Calculator', 'Create a Number Guessing Game', 'Create a To-Do List', 'Create a File Management Program', 'Create a Student Management System', 'Connect Python with SQLite', 'Create a Python REST API', 'Create a Python Application'],
            '3 Months': ['Create a Calculator', 'Create a Number Guessing Game', 'Create a To-Do List', 'Create a File Management Program', 'Create a Student Management System', 'Create a Database Application', 'Create a REST API', 'Create a Flask Web Application', 'Create a Python Automation Project', 'Create a Complete Python Project'],
        }
    },
    java: {
        label: 'Java Development', title: 'Java Development',
        description: 'Master OOP, collections, Spring Boot basics and backend systems.',
        tasks: {
            '1 Month': ['Create a Calculator', 'Create a Student Grade Calculator', 'Create a Bank Account System', 'Create a Java Mini Project'],
            '2 Months': ['Create a Calculator', 'Create a Student Grade Calculator', 'Create a Bank Account System', 'Create a Library Management System', 'Connect Java with Database', 'Create a JDBC Application', 'Create a Spring Boot CRUD Application', 'Create a Java Application'],
            '3 Months': ['Create a Calculator', 'Create a Student Grade Calculator', 'Create a Bank Account System', 'Create a Library Management System', 'Connect Java with Database', 'Create a JDBC Application', 'Create a REST API', 'Create a Spring Boot Application', 'Create a Java Web Application', 'Create a Complete Java Project'],
        }
    },
    aiml: {
        label: 'Artificial Intelligence & Machine Learning', title: 'AI & Machine Learning',
        description: 'Build neural networks, train ML models, and deploy AI pipelines.',
        tasks: {
            '1 Month': ['Analyze a Dataset', 'Clean a Dataset', 'Create a Prediction Model', 'Create an ML Mini Project'],
            '2 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Create Data Visualizations', 'Build a Regression Model', 'Build a Classification Model', 'Create a Prediction System', 'Evaluate an ML Model', 'Create an ML Application'],
            '3 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Create Data Visualizations', 'Perform Exploratory Data Analysis', 'Build a Regression Model', 'Build a Classification Model', 'Build a Clustering Model', 'Compare ML Models', 'Deploy an ML Model', 'Create an AI/ML Application'],
        }
    },
    datascience: {
        label: 'Data Science', title: 'Data Science',
        description: 'Analyse data, build ML models, and visualise insights.',
        tasks: {
            '1 Month': ['Analyze a Dataset', 'Clean a Dataset', 'Create a Data Visualization', 'Create a Data Analysis Project'],
            '2 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Use NumPy for Data Analysis', 'Use Pandas for Data Analysis', 'Create Data Visualizations', 'Perform Exploratory Data Analysis', 'Create a Data Dashboard', 'Create a Data Science Project'],
            '3 Months': ['Analyze a Dataset', 'Clean a Dataset', 'Use NumPy for Data Analysis', 'Use Pandas for Data Analysis', 'Perform Exploratory Data Analysis', 'Create Data Visualizations', 'Perform Statistical Analysis', 'Create a Data Dashboard', 'Analyze a Real-World Dataset', 'Create a Complete Data Science Project'],
        }
    },
    dataanalytics: {
        label: 'Data Analytics', title: 'Data Analytics',
        description: 'Turn raw business data into actionable insights and dashboards.',
        tasks: {
            '1 Month': ['Collect a Dataset', 'Clean the Dataset', 'Analyze the Data', 'Create a Data Dashboard'],
            '2 Months': ['Collect a Dataset', 'Clean the Dataset', 'Transform the Data', 'Analyze the Data', 'Create Charts & Graphs', 'Create a Business Dashboard', 'Generate Business Insights', 'Create a Data Analytics Project'],
            '3 Months': ['Collect a Dataset', 'Clean the Dataset', 'Transform the Data', 'Analyze the Data', 'Create Charts & Graphs', 'Create a Business Dashboard', 'Perform Sales Analysis', 'Perform Customer Analysis', 'Generate Business Insights', 'Create a Complete Analytics Project'],
        }
    },
    uiux: {
        label: 'UI/UX Design', title: 'UI/UX Design',
        description: 'Design stunning interfaces, wireframes, and interactive prototypes.',
        tasks: {
            '1 Month': ['Create a User Persona', 'Create a Website Wireframe', 'Design a Website UI', 'Create a Mobile App Prototype'],
            '2 Months': ['Create a User Persona', 'Create a User Journey', 'Create a Website Wireframe', 'Design a Landing Page', 'Design a Mobile App', 'Create a Design System', 'Create an Interactive Prototype', 'Create a UI/UX Case Study'],
            '3 Months': ['Create a User Persona', 'Create a User Journey', 'Create a Website Wireframe', 'Design a Landing Page', 'Design a Mobile App', 'Create a Design System', 'Design a Dashboard', 'Create an Interactive Prototype', 'Perform Usability Testing', 'Create a Complete UI/UX Case Study'],
        }
    },
    cloud: {
        label: 'Cloud Computing', title: 'Cloud Computing',
        description: 'Deploy scalable applications on AWS, GCP, or Azure.',
        tasks: {
            '1 Month': ['Create a Cloud Storage', 'Create a Virtual Machine', 'Deploy a Website', 'Deploy a Cloud Application'],
            '2 Months': ['Create Cloud Storage', 'Create a Virtual Machine', 'Create a Cloud Database', 'Configure Cloud Networking', 'Deploy a Website', 'Deploy a Web Application', 'Configure Cloud Monitoring', 'Create a Cloud Project'],
            '3 Months': ['Create Cloud Storage', 'Create a Virtual Machine', 'Create a Cloud Database', 'Configure Cloud Networking', 'Deploy a Website', 'Deploy a Web Application', 'Create a Serverless Application', 'Configure Cloud Security', 'Monitor Cloud Resources', 'Create a Complete Cloud Project'],
        }
    },
    cybersecurity: {
        label: 'Cybersecurity', title: 'Cybersecurity',
        description: 'Identify vulnerabilities, harden systems, and build secure applications.',
        tasks: {
            '1 Month': ['Create a Secure Login System', 'Perform Password Security Testing', 'Perform Web Security Testing', 'Create a Security Assessment Report'],
            '2 Months': ['Create a Secure Login System', 'Configure Network Security', 'Configure Linux Security', 'Implement Access Control', 'Test Web Application Security', 'Secure a Database', 'Monitor Security Events', 'Create a Security Assessment Project'],
            '3 Months': ['Create a Secure Login System', 'Configure Network Security', 'Configure Linux Security', 'Implement Access Control', 'Test Web Application Security', 'Secure a Database', 'Perform Security Testing', 'Perform Vulnerability Assessment', 'Monitor Security Events', 'Create a Cybersecurity Project'],
        }
    },
    mobile: {
        label: 'Mobile App Development', title: 'Mobile App Development',
        description: 'Build cross-platform mobile apps with Flutter or React Native.',
        tasks: {
            '1 Month': ['Create a Mobile Login Screen', 'Create a Mobile Registration Screen', 'Create a To-Do List App', 'Create a Mobile Mini Project'],
            '2 Months': ['Create a Mobile Login Screen', 'Create a Mobile Registration Screen', 'Create a To-Do List App', 'Add Local Data Storage', 'Connect App with REST API', 'Add User Authentication', 'Add App Notifications', 'Create a Mobile Application'],
            '3 Months': ['Create a Mobile Login Screen', 'Create a Mobile Registration Screen', 'Create a To-Do List App', 'Add Local Data Storage', 'Connect App with REST API', 'Add User Authentication', 'Add App Notifications', 'Add Payment Integration', 'Test & Optimize the App', 'Create a Complete Mobile Application'],
        }
    },
    devops: {
        label: 'DevOps', title: 'DevOps',
        description: 'Automate CI/CD pipelines, containerize apps, and manage cloud deployments.',
        tasks: {
            '1 Month': ['Create a GitHub Repository', 'Create a Docker Container', 'Create a CI/CD Pipeline', 'Deploy an Application'],
            '2 Months': ['Create a GitHub Repository', 'Create Git Branches', 'Create a Docker Container', 'Create a Docker Compose Application', 'Create a CI/CD Pipeline', 'Deploy an Application', 'Monitor an Application', 'Create a DevOps Project'],
            '3 Months': ['Create a GitHub Repository', 'Create Git Branches', 'Create a Docker Container', 'Create a Docker Compose Application', 'Create a CI/CD Pipeline', 'Deploy an Application', 'Configure Cloud Deployment', 'Configure Application Monitoring', 'Automate the Deployment Process', 'Create a Complete DevOps Project'],
        }
    },
    sql: {
        label: 'SQL & Database Development', title: 'SQL & Database Development',
        description: 'Design relational schemas, write complex queries, and connect databases to apps.',
        tasks: {
            '1 Month': ['Create a Student Database', 'Create Database Tables', 'Write SQL Queries', 'Create a Database Project'],
            '2 Months': ['Create a Student Database', 'Create Database Tables', 'Insert & Update Data', 'Write SQL Queries', 'Use SQL Joins', 'Create Views & Procedures', 'Connect Database with Application', 'Create a Database Project'],
            '3 Months': ['Create a Student Database', 'Create Database Tables', 'Insert & Update Data', 'Write SQL Queries', 'Use SQL Joins', 'Create Views & Procedures', 'Create Database Relationships', 'Connect Database with Application', 'Optimize Database Queries', 'Create a Complete Database Project'],
        }
    },
    genai: {
        label: 'Generative AI', title: 'Generative AI',
        description: 'Build AI chatbots, RAG apps, and LLM-powered tools.',
        tasks: {
            '1 Month': ['Create a Prompt Library', 'Create an AI Chatbot', 'Connect an AI API', 'Create a Generative AI Mini Project'],
            '2 Months': ['Create a Prompt Library', 'Create an AI Chatbot', 'Connect an AI API', 'Create an AI Text Generator', 'Create an AI Document Assistant', 'Add AI Function Calling', 'Create a RAG Application', 'Create a Generative AI Application'],
            '3 Months': ['Create a Prompt Library', 'Create an AI Chatbot', 'Connect an AI API', 'Create an AI Text Generator', 'Create an AI Document Assistant', 'Create a RAG Application', 'Add AI Function Calling', 'Create an AI Voice Assistant', 'Deploy an AI Application', 'Create a Complete Generative AI Project'],
        }
    },
    blockchain: {
        label: 'Blockchain Development', title: 'Blockchain Development',
        description: 'Build smart contracts, DApps, and Web3 integrations.',
        tasks: {
            '1 Month': ['Create a Blockchain Wallet', 'Create a Simple Smart Contract', 'Create a Token Contract', 'Create a Blockchain Mini Project'],
            '2 Months': ['Create a Blockchain Wallet', 'Create a Simple Smart Contract', 'Create a Token Contract', 'Create a Smart Contract Application', 'Connect a Web3 Application', 'Create a Blockchain Transaction App', 'Create a Decentralized Application', 'Create a Blockchain Project'],
            '3 Months': ['Create a Blockchain Wallet', 'Create a Simple Smart Contract', 'Create a Token Contract', 'Create a Smart Contract Application', 'Connect a Web3 Application', 'Create a Blockchain Transaction App', 'Create a Decentralized Application', 'Create a Decentralized Marketplace', 'Deploy a Smart Contract', 'Create a Complete Blockchain Project'],
        }
    },
    qa: {
        label: 'Software Testing & QA', title: 'Software Testing & QA',
        description: 'Write test cases, perform manual & automated testing, and ensure quality.',
        tasks: {
            '1 Month': ['Create Test Cases', 'Test a Login Page', 'Test a Web Application', 'Create a Testing Report'],
            '2 Months': ['Create Test Cases', 'Test a Login Page', 'Test a Registration Page', 'Test a Web Application', 'Perform API Testing', 'Perform Database Testing', 'Create Automated Tests', 'Create a QA Testing Project'],
            '3 Months': ['Create Test Cases', 'Test a Login Page', 'Test a Registration Page', 'Test a Web Application', 'Perform API Testing', 'Perform Database Testing', 'Create Automated Tests', 'Perform Performance Testing', 'Create a Bug Tracking Report', 'Create a Complete QA Project'],
        }
    },
    iot: {
        label: 'IoT & Embedded Systems', title: 'IoT & Embedded Systems',
        description: 'Connect sensors, control hardware, and send data to the cloud.',
        tasks: {
            '1 Month': ['Create an LED Control System', 'Connect a Temperature Sensor', 'Create an IoT Monitoring System', 'Create an IoT Mini Project'],
            '2 Months': ['Create an LED Control System', 'Connect a Temperature Sensor', 'Connect a Motion Sensor', 'Create a Smart Light System', 'Send Sensor Data to Cloud', 'Create an IoT Dashboard', 'Add Remote Device Control', 'Create an IoT Project'],
            '3 Months': ['Create an LED Control System', 'Connect a Temperature Sensor', 'Connect a Motion Sensor', 'Create a Smart Light System', 'Connect Sensors to the Internet', 'Send Sensor Data to Cloud', 'Create an IoT Dashboard', 'Add Remote Device Control', 'Create a Real-Time Monitoring System', 'Create a Complete IoT Project'],
        }
    },
};

async function getOrCreateInternship(domainId, duration) {
    const domain = DOMAINS[domainId];
    if (!domain) throw new Error(`Unknown domain: ${domainId}`);

    const targetDuration = duration || '1 Month';

    const { data: existing } = await supabase
        .from('internships')
        .select('id, title, category, duration');

    const match = (existing || []).find(i =>
        (i.category?.toLowerCase() === domain.label.toLowerCase() ||
            i.title?.toLowerCase() === domain.title.toLowerCase()) &&
        i.duration === targetDuration
    );

    if (match) {
        console.log(`  ✓ Found internship for "${domain.title}" (${targetDuration}): ${match.id}`);
        return match;
    }

    console.log(`  + Creating internship for "${domain.title}" (${targetDuration})...`);

    // Fetch domains to link domain_id
    const { data: dbDomains } = await supabase
        .from('domains')
        .select('id, name, slug');

    const matchedDomainDb = (dbDomains || []).find(d =>
        d.slug === domainId ||
        d.name.toLowerCase() === domain.label.toLowerCase() ||
        d.name.toLowerCase() === domain.title.toLowerCase()
    );

    const generatedSlug = `${domainId}-${targetDuration.toLowerCase().replace(/\s+/g, '-')}`;

    const { data: newIntern, error } = await supabase
        .from('internships')
        .insert({
            title: domain.title,
            category: domain.label,
            description: domain.description,
            duration: targetDuration,
            status: 'active',
            domain_id: matchedDomainDb?.id || null,
            slug: generatedSlug
        })
        .select().single();

    if (error) throw error;

    const taskNames = domain.tasks[targetDuration] || domain.tasks['1 Month'];
    const taskRows = [
        { internship_id: newIntern.id, task_number: 1, title: 'LinkedIn Offer Post Requirement', description: 'Share your internship selection announcement on LinkedIn to unlock tasks.' },
        ...taskNames.map((title, idx) => ({ internship_id: newIntern.id, task_number: idx + 2, title, description: `Complete the ${domain.label} task: ${title}` }))
    ];
    await supabase.from('internship_tasks').insert(taskRows);
    console.log(`  ✓ Created + seeded ${taskRows.length} tasks for "${domain.title}" (${targetDuration})`);
    return newIntern;
}

async function fixStudent(uid, studentName, domainId, duration) {
    console.log(`\n--- Fixing: ${studentName} (uid: ${uid.substring(0, 8)}...) ---`);
    const domain = DOMAINS[domainId];
    if (!domain) { console.log(`  ✗ Unknown domain "${domainId}" — skipping`); return; }

    const internship = await getOrCreateInternship(domainId, duration);

    // Update internship_applications
    const { error: e0 } = await supabase.from('internship_applications').update({ internship_id: internship.id }).eq('student_id', uid);
    if (e0) console.log('  ✗ internship_applications update failed:', e0.message);
    else console.log(`  ✓ internship_applications → "${domain.title}"`);

    // Update internship_enrollments
    const { error: e1 } = await supabase.from('internship_enrollments').update({ internship_id: internship.id }).eq('user_id', uid);
    if (e1) console.log('  ✗ internship_enrollments update failed:', e1.message);
    else console.log(`  ✓ internship_enrollments → "${domain.title}"`);

    // Update enrollments
    const { error: e2 } = await supabase.from('enrollments').update({ internship_id: internship.id }).eq('user_id', uid);
    if (e2) console.log('  ~ enrollments (may not exist):', e2.message);
    else console.log(`  ✓ enrollments → "${domain.title}"`);

    // Update offer letters
    const { error: e3 } = await supabase.from('offer_letters').update({ internship_id: internship.id, internship_title: domain.title }).eq('user_id', uid);
    if (e3) console.log('  ✗ offer_letters update failed:', e3.message);
    else console.log(`  ✓ offer_letters → "${domain.title}"`);

    // Clear old task_progress and reseed
    const { error: e4 } = await supabase.from('task_progress').delete().eq('user_id', uid);
    if (e4) console.log('  ✗ task_progress clear failed:', e4.message);
    else console.log('  ✓ Cleared old task_progress');

    const { data: tasks } = await supabase.from('internship_tasks').select('id, task_number').eq('internship_id', internship.id).order('task_number');
    if (tasks && tasks.length > 0) {
        const newProgress = tasks.map(t => ({
            user_id: uid, student_id: uid, internship_id: internship.id, task_id: t.id,
            status: t.task_number === 1 ? 'not_submitted' : 'locked',
            github_url: null, linkedin_url: null, student_note: null, admin_feedback: null,
        }));
        const { error: e5 } = await supabase.from('task_progress').insert(newProgress);
        if (e5) console.log('  ✗ task_progress seed failed:', e5.message);
        else console.log(`  ✓ Seeded ${newProgress.length} tasks for "${domain.title}"`);
    } else {
        console.log('  ✗ No tasks found — check internship_tasks table');
    }
}

async function fixAll() {
    console.log('=== VINIX — Fix All Student Domains ===\n');

    const { data: apps, error } = await supabase
        .from('internship_applications')
        .select('student_id, student_name, domain, duration')
        .not('domain', 'is', null);

    if (error) { console.error('Failed to fetch applications:', error.message); return; }

    console.log(`Found ${(apps || []).length} applications with domain data:`);
    for (const a of (apps || [])) {
        console.log(`  ${a.student_name}: domain=${a.domain}, duration=${a.duration}`);
    }

    for (const app of (apps || [])) {
        if (!DOMAINS[app.domain]) {
            console.log(`\n  SKIP — unknown domain "${app.domain}" for ${app.student_name}`);
            continue;
        }
        await fixStudent(app.student_id, app.student_name, app.domain, app.duration || '1 Month');
    }

    console.log('\n=== All Fixes Complete! ===');
    console.log('All students now point to their correct domain internship and have correct tasks.');
}

fixAll().catch(console.error);
