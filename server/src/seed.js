import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.certificate.deleteMany();
  await prisma.offerLetter.deleteMany();
  await prisma.project.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPasswordHash = await bcrypt.hash('vis@2007', 10);
  const studentPasswordHash = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Vishal R',
      email: 'vishal@vinix.com',
      password: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.create({
    data: {
      name: 'Vishal R',
      email: 'student@vinix.com',
      password: studentPasswordHash,
      role: 'STUDENT',
      skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
    },
  });

  console.log('Users created:', { admin: admin.email, student: student.email });

  // Create Courses & Internship domains
  const baseCourses = [
    // Programming
    {
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
      assignments: [
        { id: 'py_assign_1', title: 'Basic Calculator', desc: 'Create a CLI calculator that handles +, -, *, / with input validation.' }
      ],
      quizzes: [
        { question: 'What is the syntax for a list in Python?', options: ['[]', '{}', '()', '<>'], answer: '[]' }
      ]
    },
    {
      title: 'Java Development Foundations',
      category: 'Programming',
      description: 'Master Java basics, object-oriented concepts, and multithreading.',
      duration: '10 Weeks',
      type: 'COURSE',
      skills: ['Java', 'OOP', 'JDK'],
      lessons: [
        { title: 'Setting up Java JDK & IDE', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '12 mins' }
      ]
    },
    // Web Development
    {
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
      assignments: [
        { id: 'react_assign_1', title: 'Todo App with LocalStorage', desc: 'Build a Todo application with filter features and persistent storage.' }
      ],
      quizzes: [
        { question: 'Which hook is used for side-effects in React?', options: ['useState', 'useRef', 'useEffect', 'useMemo'], answer: 'useEffect' }
      ]
    },
    // AI & Data
    {
      title: 'Introduction to Machine Learning',
      category: 'AI & Data',
      description: 'Learn Regression, Classification, Clustering, and build models using Scikit-Learn.',
      duration: '12 Weeks',
      type: 'COURSE',
      skills: ['Python', 'Scikit-Learn', 'Maths'],
      lessons: [
        { title: 'ML Overview', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' }
      ]
    }
  ];

  const domainsList = [
    { code: 'FS', name: 'Full Stack Development', category: 'Programming', skills: ['Node.js', 'Express', 'React', 'Database'], projects: ['Internship Management Portal', 'E-Commerce Platform', 'Job Portal', 'Hospital Management System'] },
    { code: 'PY', name: 'Python Development', category: 'Programming', skills: ['Python', 'Django', 'Flask', 'OOP'], projects: ['Expense Tracker', 'Library Management System', 'Billing System', 'Inventory Management System'] },
    { code: 'JV', name: 'Java Development', category: 'Programming', skills: ['Java', 'Spring Boot', 'OOP', 'JDBC'], projects: ['Banking Management System', 'Hospital Management System', 'Employee Payroll System', 'Online Examination System'] },
    { code: 'ME', name: 'MERN Stack Development', category: 'Web Development', skills: ['MongoDB', 'Express', 'React', 'Node.js'], projects: ['E-Commerce Platform', 'Social Media App', 'Job Portal', 'Online Learning Platform'] },
    { code: 'MA', name: 'MEAN Stack Development', category: 'Web Development', skills: ['MongoDB', 'Express', 'Angular', 'Node.js'], projects: ['Event Management System', 'Healthcare Portal', 'Employee Management System', 'Food Delivery Platform'] },
    { code: 'AI', name: 'AI & Machine Learning', category: 'AI & Data', skills: ['Python', 'TensorFlow', 'scikit-learn', 'PyTorch'], projects: ['Student Performance Prediction', 'Resume Screening System', 'Recommendation Engine', 'Fraud Detection System'] },
    { code: 'DS', name: 'Data Science', category: 'AI & Data', skills: ['Python', 'Pandas', 'NumPy', 'Data Visualization'], projects: ['Customer Churn Prediction', 'Sales Forecasting', 'Customer Segmentation', 'Stock Market Analysis'] },
    { code: 'UX', name: 'UI/UX Designer', category: 'Design', skills: ['Figma', 'Wireframing', 'Prototyping', 'User Research'], projects: ['E-Learning App Design', 'Banking App Design', 'Food Delivery App Design', 'Travel App Design'] },
    { code: 'CS', name: 'Cyber Security', category: 'Network & Security', skills: ['Penetration Testing', 'Network Security', 'Cryptography'], projects: ['Network Intrusion Detection', 'Phishing Detection', 'Secure File Sharing', 'Security Monitoring Dashboard'] },
    { code: 'WD', name: 'Web Development', category: 'Web Development', skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'], projects: ['Event Management Website', 'Online Booking System', 'College Portal', 'E-Commerce Website'] },
    { code: 'FE', name: 'Frontend Development', category: 'Web Development', skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind'], projects: ['Portfolio Website', 'E-Commerce UI', 'Admin Dashboard', 'Social Media Interface'] },
    { code: 'BE', name: 'Backend Development', category: 'Web Development', skills: ['Node.js', 'Express', 'databases', 'REST APIs'], projects: ['Employee Management API', 'E-Commerce API', 'Authentication Service', 'Payment Management API'] },
    { code: 'RE', name: 'React Development', category: 'Web Development', skills: ['React', 'Redux', 'Hooks', 'Vite'], projects: ['Task Management Dashboard', 'E-Commerce App', 'Admin Dashboard', 'Real-Time Chat App'] },
    { code: 'ND', name: 'Node.js Development', category: 'Web Development', skills: ['Node.js', 'Express', 'REST APIs', 'NPM'], projects: ['Food Ordering API', 'Chat Application Backend', 'REST API Platform', 'Booking Management System'] },
    { code: 'PH', name: 'PHP Development', category: 'Web Development', skills: ['PHP', 'MySQL', 'OOP', 'Laravel'], projects: ['College Management System', 'Hospital Management System', 'Online Shopping System', 'Library Management System'] },
    { code: 'DJ', name: 'Django Development', category: 'Programming', skills: ['Python', 'Django', 'REST API'], projects: ['Online Examination System', 'Blog Platform', 'Learning Management System', 'Job Portal'] },
    { code: 'AN', name: 'Android Development', category: 'Mobile App Development', skills: ['Kotlin', 'Android Studio', 'Jetpack Compose'], projects: ['Attendance App', 'Expense Tracker', 'Fitness App', 'Student Management App'] },
    { code: 'FL', name: 'Flutter Development', category: 'Mobile App Development', skills: ['Dart', 'Flutter', 'Cross-platform'], projects: ['Food Delivery App', 'Travel Booking App', 'Shopping App', 'Event Booking App'] },
    { code: 'DA', name: 'Data Analytics', category: 'AI & Data', skills: ['Excel', 'BI Tools', 'SQL', 'Data Analytics'], projects: ['Sales Dashboard', 'HR Analytics Dashboard', 'Marketing Analytics', 'Customer Behavior Analysis'] },
    { code: 'DL', name: 'Deep Learning', category: 'AI & Data', skills: ['Neural Networks', 'Keras', 'PyTorch', 'CNN'], projects: ['Image Classification', 'Face Recognition', 'Object Detection', 'Handwritten Digit Recognition'] },
    { code: 'CV', name: 'Computer Vision', category: 'AI & Data', skills: ['OpenCV', 'Image Processing', 'CNN', 'YOLO'], projects: ['Face Recognition Attendance', 'Object Detection', 'Number Plate Recognition', 'Document Scanner'] },
    { code: 'NLP', name: 'Natural Language Processing', category: 'AI & Data', skills: ['NLP', 'BERT', 'NLTK', 'Transformers'], projects: ['AI Chatbot', 'Sentiment Analysis', 'Resume Analyzer', 'Text Summarization System'] },
    { code: 'CC', name: 'Cloud Computing', category: 'Cloud & DevOps', skills: ['Cloud Services', 'Virtualization', 'Infrastructure'], projects: ['Cloud File Storage', 'Cloud-Based LMS', 'Cloud Backup System', 'Cloud Task Management'] },
    { code: 'DV', name: 'DevOps', category: 'Cloud & DevOps', skills: ['CI/CD', 'Docker', 'Kubernetes', 'GitHub Actions'], projects: ['CI/CD Pipeline', 'Automated Deployment System', 'Dockerized Web Application', 'DevOps Monitoring Dashboard'] },
    { code: 'AW', name: 'AWS Cloud Development', category: 'Cloud & DevOps', skills: ['AWS Services', 'Serverless', 'IAM', 'S3'], projects: ['AWS Web Application', 'Cloud File Storage', 'Serverless API', 'AWS-Based E-Commerce Platform'] },
    { code: 'BC', name: 'Blockchain Development', category: 'Web3', skills: ['Solidity', 'Smart Contracts', 'Web3.js', 'Ethereum'], projects: ['Certificate Verification', 'Digital Voting', 'Supply Chain Tracking', 'Digital Identity System'] },
    { code: 'IO', name: 'IoT Development', category: 'Hardware', skills: ['Raspberry Pi', 'Arduino', 'Sensors', 'Microcontrollers'], projects: ['Smart Home Automation', 'Smart Agriculture', 'Smart Parking', 'Smart Energy Monitoring'] },
    { code: 'ES', name: 'Embedded Systems', category: 'Hardware', skills: ['C/C++', 'Microcontrollers', 'Embedded C', 'RTOS'], projects: ['Temperature Monitoring', 'Smart Security System', 'Automatic Street Light', 'Smart Irrigation'] },
    { code: 'QA', name: 'Software Testing & QA', category: 'Programming', skills: ['Manual Testing', 'Selenium', 'Automation', 'Jest'], projects: ['Automated Testing Framework', 'E-Commerce Test Suite', 'API Testing System', 'Performance Testing Platform'] },
    { code: 'DM', name: 'Digital Marketing', category: 'Marketing', skills: ['SEO', 'SEM', 'Social Media', 'Content Strategy'], projects: ['Marketing Analytics Dashboard', 'SEO Tracker', 'Social Media Campaign Manager', 'Email Campaign System'] },
    { code: 'GD', name: 'Graphic Design', category: 'Design', skills: ['Photoshop', 'Illustrator', 'Branding', 'Typography'], projects: ['Brand Identity', 'Social Media Design System', 'Marketing Campaign Design', 'Corporate Branding'] },
    { code: 'PM', name: 'Project Management', category: 'Management', skills: ['Agile', 'Scrum', 'Trello', 'Jira'], projects: ['Project Tracking System', 'Team Collaboration Platform', 'Task Management Dashboard', 'Resource Management System'] },
    { code: 'DB', name: 'Database Management', category: 'Programming', skills: ['SQL', 'NoSQL', 'Database Tuning', 'Scaling'], projects: ['Inventory Database System', 'Hospital Database', 'Student Database', 'Employee Database'] },
    { code: 'SQL', name: 'SQL Development', category: 'Programming', skills: ['SQL', 'Queries', 'Stored Procedures', 'Views'], projects: ['Sales Reporting System', 'Banking Database', 'Customer Analytics Database', 'Business Intelligence Database'] },
    { code: 'UI', name: 'UI Design', category: 'Design', skills: ['Figma', 'UI Design', 'Designing'], projects: ['Banking App Interface', 'E-Commerce Interface', 'Dashboard Design', 'Healthcare App Interface'] },
    { code: 'UXD', name: 'UX Design', category: 'Design', skills: ['Figma', 'UX Research', 'Information Architecture'], projects: ['E-Commerce UX', 'Banking UX', 'Healthcare UX', 'Learning Platform UX'] }
  ];

  const derivedInternships = domainsList.map(domain => ({
    title: `${domain.name} Internship`,
    category: domain.category,
    description: `Task-based virtual internship where you build clean ${domain.name} applications and projects.`,
    duration: '3 Months',
    type: 'INTERNSHIP',
    skills: domain.skills,
    lessons: [
      { title: 'Project 1 Overview & Setup', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '10 mins' },
      { title: 'Connecting Frontend to Backend', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '15 mins' },
      { title: 'Task Submission Instructions', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: '8 mins' }
    ],
    assignments: domain.projects.map((projTitle, idx) => ({
      id: `${domain.code.toLowerCase()}_intern_task_${idx + 1}`,
      title: projTitle,
      desc: `Design and implement the ${projTitle} for this internship domain program.`
    }))
  }));

  const coursesToCreate = [...baseCourses, ...derivedInternships];

  const dbCourses = [];
  for (const courseData of coursesToCreate) {
    const c = await prisma.course.create({ data: courseData });
    dbCourses.push(c);
  }
  console.log(`Created ${dbCourses.length} courses/internships.`);

  // Find some specific courses for enrollments
  const webIntern = dbCourses.find(c => c.title === 'Web Development Internship');
  const pyIntern = dbCourses.find(c => c.title === 'Python Development Internship');
  const reactCourse = dbCourses.find(c => c.title === 'React.js Core Concepts');

  // Enrollments
  if (webIntern) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: webIntern.id,
        progress: 100, // Completed all requirements for internship tasks
        status: 'COMPLETED',
      },
    });

    // Offer Letter
    await prisma.offerLetter.create({
      data: {
        offerLetterId: 'VINIX-OFFER-2026-1757',
        studentId: student.id,
        internshipId: webIntern?.id || null,
        studentName: student.name,
        studentEmail: student.email,
        internshipTitle: 'Web Development Internship',
        internshipDomain: 'web-development',
        startDate: new Date('2026-07-21'),
        endDate: new Date('2026-10-21'),
        duration: '3 Months',
        mentorName: 'Amit Sharma',
        issueDate: new Date('2026-07-21'),
        status: 'ACCEPTED',
        verificationToken: 'vinix-offer-verify-token-student-1',
        pdfUrl: '/uploads/offer-letters/VINIX-OFFER-2026-1757.pdf'
      },
    });

    // Approved Project
    await prisma.project.create({
      data: {
        studentId: student.id,
        title: 'Full Stack Development Tasks Submission',
        description: 'Completed tasks: 1. CSS/HTML Portfolio, 2. React E-Commerce Storefront UI, 3. JWT Express REST Server with tests.',
        githubLink: 'https://github.com/vishal9932/vinix-web-internship',
        status: 'APPROVED',
        feedback: 'Outstanding work! Code is highly structured, and styling matches requirements perfectly.',
        submittedAt: new Date('2026-08-01'),
      },
    });

    // Certificate
    await prisma.certificate.create({
      data: {
        studentId: student.id,
        courseName: 'Web Development Internship',
        certificateNumber: 'VINIX-WEB-2026-0001',
        issueDate: new Date('2026-08-04'),
        verificationURL: 'http://localhost:5173/verify/VINIX-WEB-2026-0001',
      },
    });
  }

  if (pyIntern) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: pyIntern.id,
        progress: 33, // 1 of 3 tasks done
        status: 'ENROLLED',
      },
    });

    // Submitting a pending project
    await prisma.project.create({
      data: {
        studentId: student.id,
        title: 'Web Scraping Bot - Task 1',
        description: 'Python script to scrape product prices using BeautifulSoup4. Results exported as CSV format.',
        githubLink: 'https://github.com/vishal9932/python-web-scraper',
        status: 'PENDING',
        submittedAt: new Date('2026-08-05'),
      },
    });
  }

  if (reactCourse) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: reactCourse.id,
        progress: 60,
        status: 'ENROLLED',
      },
    });
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
