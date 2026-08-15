import { createClient } from '@supabase/supabase-js';

// Supabase configuration client with fallback credentials for static hosting
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmwqcglpzgehchxlnbte.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtd3FjZ2xwemdlaGNoeGxuYnRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMzQxNTEsImV4cCI6MjEwMTgxMDE1MX0.PuFB4pyxIYyOJibtnx9KTqEfsWNORtii1Vdsb3PbEjw';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.info('Using fallback Supabase credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FallbackInternship {
    id: string;
    title: string;
    domain: string;
    description: string;
    duration: string;
    status: string;
}

export const FALLBACK_INTERNSHIPS: FallbackInternship[] = [
    { id: '95d1c0e2-d14b-4c24-bda9-5b7fdb5b92d9', title: 'Full Stack Development', domain: 'fullstack', description: 'Build web apps with React, Express, and databases.', duration: '3 Months', status: 'published' },
    { id: '664885f8-66b7-4563-af6f-4b15054044f7', title: 'Frontend Development', domain: 'frontend', description: 'Construct responsive web interfaces with HTML, CSS, JavaScript, React.', duration: '3 Months', status: 'published' },
    { id: 'e553b2b9-04ec-4deb-a908-178013c46dda', title: 'Backend Development', domain: 'backend', description: 'Design scalable server-side systems, APIs and databases.', duration: '3 Months', status: 'published' },
    { id: 'fbbf3fe6-a698-4886-bc5d-9f48cc14f725', title: 'AI & Machine Learning', domain: 'aiml', description: 'Build models and inspect intelligence applications.', duration: '3 Months', status: 'published' },
    { id: 'e785a0a0-017d-4acc-b9c8-3d52776c4fb0', title: 'Data Science', domain: 'datascience', description: 'Process, visualize, analyze real-world datasets.', duration: '3 Months', status: 'published' },
    { id: '5f586279-16d1-4d7e-8dba-b70bce4e2734', title: 'UI/UX Design', domain: 'uiux', description: 'Design modern user interfaces with Figma wireframing.', duration: '3 Months', status: 'published' },
    { id: '59760c89-c3c5-4b94-9302-2a6527f53ee7', title: 'Python Development', domain: 'python', description: 'Develop clean Python applications, Django backend systems.', duration: '3 Months', status: 'published' },
    { id: '86a8d353-846b-4b9d-9287-283f9e5f6577', title: 'Java Development', domain: 'java', description: 'Build robust object-oriented systems with Java Spring Boot.', duration: '3 Months', status: 'published' },
    { id: '6ee274d7-b3a6-475c-8c8b-127c35448963', title: 'Cyber Security', domain: 'cybersecurity', description: 'Analyze networks, implement cryptography and conduct penetrations.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448960', title: 'Digital Marketing', domain: 'digitalmarketing', description: 'Optimize SEO, run campaigns, analyze marketing funnels.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448961', title: 'C Programming', domain: 'cprogramming', description: 'Write systems-level utilities in C.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448962', title: 'C++ Programming', domain: 'cppprogramming', description: 'Build algorithms on high performance C++ frameworks.', duration: '3 Months', status: 'published' },
    { id: 'ba74cea8-305b-4eeb-a3f1-b0ed1a6de32e', title: 'Web Development', domain: 'webdevelopment', description: 'Standard web pages via HTML/CSS/JavaScript.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448964', title: 'Data Analytics', domain: 'dataanalytics', description: 'Clean and format data to uncover business trends.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448965', title: 'Machine Learning', domain: 'machinelearning', description: 'Train regression and classification intelligence pipelines.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448966', title: 'Deep Learning', domain: 'deeplearning', description: 'Deploy neural networks.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448967', title: 'Generative AI', domain: 'generativeai', description: 'LLM orchestration, prompt templates and agent frameworks.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448968', title: 'Prompt Engineering', domain: 'promptengineering', description: 'Advanced prompting techniques, dynamic prompt routing.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448969', title: 'Cloud Computing', domain: 'cloudcomputing', description: 'Deploy microservices into AWS infrastructure.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448970', title: 'Ethical Hacking', domain: 'ethicalhacking', description: 'Conduct mock system penetration testing and audits.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448971', title: 'Android Development', domain: 'androiddevelopment', description: 'Build mobile layout pages with Android Studio SDK.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448972', title: 'Flutter Development', domain: 'flutterdevelopment', description: 'Deploy cross platform applications.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448973', title: 'React Native', domain: 'reactnative', description: 'Build JSX cross platform applications.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448974', title: 'Graphic Design', domain: 'graphicdesign', description: 'Assemble branding assets and layouts.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448975', title: 'Motion Graphics', domain: 'motiongraphics', description: 'Animate assets and typography.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448976', title: 'Video Editing', domain: 'videoediting', description: 'Color correcting, clip trimming and audio layering.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448977', title: 'Animation', domain: 'animation', description: 'Create 2D vector animations.', duration: '3 Months', status: 'published' },
    { id: 'fc6b7e28-3e4e-4f5a-8b6b-127c35448978', title: '3D Design', domain: 'threeddesign', description: 'Assemble 3D meshes and rendering.', duration: '3 Months', status: 'published' }
];

