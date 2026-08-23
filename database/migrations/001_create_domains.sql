-- Migration: Create Domains Table & Seed Data
CREATE TABLE IF NOT EXISTS public.domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    image TEXT,
    skills TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can select active domains" ON public.domains 
    FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage domains" ON public.domains 
    FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed 20 domains automatically
INSERT INTO public.domains (name, slug, description, icon, image, skills, is_active) VALUES
('Web Development', 'web-development', 'Build interactive and modern websites using foundational frontend and backend tools.', 'Code', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express'], true),
('Full Stack Development', 'full-stack-development', 'Master both client-side and server-side engineering to build entire applications from scratch.', 'Layers', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600', ARRAY['React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Tailwind CSS'], true),
('Frontend Development', 'frontend-development', 'Architect beautiful user-facing interfaces with state management, animations, and high performance.', 'LayoutDashboard', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=600', ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS'], true),
('Backend Development', 'backend-development', 'Engineer scalable server logic, REST APIs, microservices, and database connections.', 'Cpu', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=600', ARRAY['Node.js', 'Express', 'Python', 'SQL', 'MongoDB', 'API Design'], true),
('Mobile App Development', 'mobile-app-development', 'Design, build, and publish native or cross-platform iOS and Android mobile software.', 'Smartphone', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=600', ARRAY['React Native', 'Flutter', 'iOS Development', 'Android Development', 'Firebase'], true),
('Data Science', 'data-science', 'Analyze complex datasets, generate predictive models, and visualize statistical insights.', 'LineChart', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600', ARRAY['Python', 'Pandas', 'NumPy', 'Matplotlib', 'SQL', 'Statistics', 'Machine Learning'], true),
('Artificial Intelligence', 'artificial-intelligence', 'Implement advanced algorithms including Neural Networks, NLP, and Computer Vision solutions.', 'Sparkles', 'https://images.unsplash.com/photo-1677442136019-21780efad99a?q=80&w=600', ARRAY['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Deep Learning', 'Computer Vision'], true),
('Machine Learning', 'machine-learning', 'Train algorithms to automatically analyze patterns and construct forecasting engines.', 'Brain', 'https://images.unsplash.com/photo-1527474305487-b87b222841cc?q=80&w=600', ARRAY['Python', 'Scikit-Learn', 'TensorFlow', 'Keras', 'Predictive Modeling'], true),
('Cyber Security', 'cyber-security', 'Protect critical server networks, analyze system vulnerabilities, and implement cryptography rules.', 'Shield', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600', ARRAY['Networking', 'Linux', 'Ethical Hacking', 'Security', 'OWASP', 'Penetration Testing'], true),
('Cloud Computing', 'cloud-computing', 'Deploy systems to highly resilient virtual architectures on dominant provider infrastructures.', 'Cloud', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=600', ARRAY['AWS', 'Azure', 'GCP', 'Docker', 'Cloud Architecture'], true),
('DevOps', 'devops', 'Integrate development pipelines and automation routines via CI/CD pipelines and orchestrators.', 'Settings', 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=600', ARRAY['Git', 'Docker', 'CI/CD', 'Kubernetes', 'Linux', 'Ansible', 'Terraform'], true),
('UI/UX Design', 'ui-ux-design', 'Conduct user research, design wireframes, and craft clickable interaction prototypes.', 'Palette', 'https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=600', ARRAY['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'], true),
('Internet of Things (IoT)', 'iot', 'Write programs for microcontrollers and integrate physical sensors with cloud triggers.', 'Workflow', 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600', ARRAY['Arduino', 'Raspberry Pi', 'Embedded C', 'Sensors', 'MQTT'], true),
('Blockchain', 'blockchain', 'Author ledger smart contracts and architect decentralized software products (dApps).', 'Database', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600', ARRAY['Solidity', 'Ethereum', 'Smart Contracts', 'Cryptography', 'Web3'], true),
('Software Testing', 'software-testing', 'Automate execution runs, draft detailed test plans, and assure production grade releases.', 'CheckSquare', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600', ARRAY['Manual Testing', 'Selenium', 'Jest', 'Automation', 'QA Engineering'], true),
('Java Development', 'java-development', 'Construct robust enterprise platforms using Java structures and Spring context abstractions.', 'Coffee', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=600', ARRAY['Java', 'Spring Boot', 'Hibernate', 'Maven', 'OOP', 'SQL'], true),
('Python Development', 'python-development', 'Build flexible automation routines, scrape websites, and deploy clean modern APIs.', 'Glasses', 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600', ARRAY['Python', 'Django', 'Flask', 'OOP', 'Scraping', 'Data Analysis'], true),
('C/C++ Development', 'c-cpp-development', 'Develop low-level device components, game engines, and performance critical binaries.', 'Terminal', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=600', ARRAY['C', 'C++', 'Data Structures', 'Algorithms', 'Memory Management'], true),
('Database Management', 'database-management', 'Tune index latency, normalize table parameters, and oversee secure store instances.', 'FileSpreadsheet', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600', ARRAY['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Database Tuning', 'Normalization'], true),
('Digital Marketing', 'digital-marketing', 'Engage web analytics platforms, oversee online metrics, and configure SEO assets.', 'Megaphone', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600', ARRAY['SEO', 'Content Marketing', 'Social Media', 'Google Analytics', 'SEM'], true)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    image = EXCLUDED.image,
    skills = EXCLUDED.skills,
    is_active = EXCLUDED.is_active;
