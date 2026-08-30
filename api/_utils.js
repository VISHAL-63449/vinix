import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const supabaseUrl = 'https://ioppccrnbuqgcynmjpaa.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcHBjY3JuYnVxZ2N5bm1qcGFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMyNjUyNywiZXhwIjoyMTAyOTAyNTI3fQ.dC2HhQgzBrE5uF4uKqbtU9rPL_4vfyKKhujWIZgxBb0';

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// Robust function to get base64 image representation
export async function getImageBase64(fileName, req) {
    // 1. Try local filesystem options first
    const pathsToSearch = [
        path.join(process.cwd(), 'public', fileName),
        path.join(process.cwd(), 'dist', fileName),
        path.join(process.cwd(), fileName),
        path.join(process.cwd(), '..', 'public', fileName),
        path.join(process.cwd(), 'vinix', 'public', fileName)
    ];

    for (const p of pathsToSearch) {
        try {
            if (fs.existsSync(p)) {
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                const buffer = fs.readFileSync(p);
                return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`Local file read failed for ${p}:`, e.message);
        }
    }

    // 2. Try fetching from URL/Origin if request context is provided
    if (req) {
        try {
            const host = req.headers.host || 'localhost:5173';
            const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
            const origin = req.headers.origin || `${protocol}://${host}`;
            const fileUrl = new URL(fileName, origin).toString();

            console.log(`Attempting to fetch image asset via HTTP fallback: ${fileUrl}`);
            const response = await fetch(fileUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const mimeType = ext === 'jpg' ? 'jpeg' : ext;
                return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
            }
        } catch (e) {
            console.warn(`HTTP fetch fallback failed for ${fileName}:`, e.message);
        }
    }

    // 3. Last resort: Try fetching from standard production base URL
    try {
        const fallBackUrl = `https://www.vinix.online/${fileName}`;
        const response = await fetch(fallBackUrl);
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = path.extname(fileName).replace('.', '').toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : ext;
            return `data:image/${mimeType};base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.warn(`Production CDN fetch failed for ${fileName}:`, e.message);
    }

    return null;
}

// Ensure Supabase Storage bucket exists
export async function ensureBucketExists() {
    try {
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
        if (listError) throw listError;

        const exists = buckets.some(b => b.name === 'documents');
        if (!exists) {
            console.log('Documents bucket not found. Creating bucket...');
            const { error: createError } = await supabaseAdmin.storage.createBucket('documents', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['application/pdf']
            });
            if (createError) {
                console.error('Failed to create documents bucket:', createError.message);
            } else {
                console.log('Documents bucket created successfully.');
            }
        }
    } catch (e) {
        console.error('Error ensuring bucket exists:', e.message);
    }
}

// Mailer Helper
export async function sendEmail({ email, name, subject, body, pdfBuffer, pdfName }) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'VINIX Academic Council <academic@vinix.online>';

    if (!host || !user || !pass) {
        console.log(`[MAIL MOCK] Mail configured to mock mode. Logging payload:`);
        console.log(` - To: ${name} <${email}>`);
        console.log(` - Subject: ${subject}`);
        console.log(` - Attachment: ${pdfName} (${pdfBuffer.length} bytes)`);
        console.log(`-----------------------------------------`);
        console.log(body);
        console.log(`-----------------------------------------`);
        return { mock: true, recipient: email };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    const info = await transporter.sendMail({
        from,
        to: email,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
        attachments: [
            {
                filename: pdfName,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    });

    console.log(`[MAIL SUCCESS] Email sent to ${email}. MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
}

// === DOMAIN DEFINITIONS (mirrors Internships.tsx DOMAINS array) ===
export const DOMAINS = {
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

export async function getOrCreateInternship(domainId, duration) {
    const targetDuration = duration || '1 Month';

    // Normalize domainId
    let normalizedDomainId = String(domainId || '').toLowerCase().trim();
    if (normalizedDomainId === 'uiux') normalizedDomainId = 'uiux';

    // Fallback to 'fullstack' if empty
    if (!normalizedDomainId) {
        normalizedDomainId = 'fullstack';
    }

    const domain = DOMAINS[normalizedDomainId] || {
        label: domainId,
        title: domainId,
        description: `Virtual Internship under ${domainId} track.`,
        tasks: {
            '1 Month': ['Task 1', 'Task 2', 'Task 3', 'Task 4'],
            '2 Months': ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5', 'Task 6', 'Task 7', 'Task 8'],
            '3 Months': ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 5', 'Task 6', 'Task 7', 'Task 8', 'Task 9', 'Task 10']
        }
    };

    // First search in internships table
    const { data: existing } = await supabaseAdmin
        .from('internships')
        .select('id, title, category, duration');

    const match = (existing || []).find(i =>
        (i.category?.toLowerCase() === domain.label.toLowerCase() ||
            i.title?.toLowerCase() === domain.title.toLowerCase() ||
            i.title?.toLowerCase().includes(domain.title.toLowerCase()) ||
            domain.title.toLowerCase().includes(i.title?.toLowerCase() || '')) &&
        i.duration === targetDuration
    );

    if (match) {
        console.log(`[UTILS] Found existing internship: ${match.id} (${match.title} - ${match.duration})`);
        return match;
    }

    console.log(`[UTILS] No match found. Creating internship track for: ${domain.title} (${targetDuration})`);

    // Fetch domains to link domain_id
    const { data: dbDomains } = await supabaseAdmin
        .from('domains')
        .select('id, name, slug');

    const matchedDomainDb = (dbDomains || []).find(d =>
        d.slug === normalizedDomainId ||
        d.name.toLowerCase() === domain.label.toLowerCase() ||
        d.name.toLowerCase() === domain.title.toLowerCase()
    );

    const generatedSlug = `${normalizedDomainId}-${targetDuration.toLowerCase().replace(/\s+/g, '-')}`;

    const { data: newIntern, error } = await supabaseAdmin
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

    if (error) {
        console.error(`[UTILS] Error creating internship:`, error.message);
        throw error;
    }

    const taskNames = domain.tasks[targetDuration] || domain.tasks['1 Month'] || ['Task 2', 'Task 3', 'Task 4', 'Task 5'];
    const taskRows = [
        { internship_id: newIntern.id, task_number: 1, title: 'LinkedIn Offer Post Requirement', description: 'Share your internship selection announcement on LinkedIn to unlock tasks.' },
        ...taskNames.map((title, idx) => ({
            internship_id: newIntern.id,
            task_number: idx + 2,
            title,
            description: `Complete the ${domain.label} task: ${title}`
        }))
    ];
    await supabaseAdmin.from('internship_tasks').insert(taskRows);
    console.log(`[UTILS] Created and seeded tasks for new internship: ${newIntern.id}`);
    return newIntern;
}
