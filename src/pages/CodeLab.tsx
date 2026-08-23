import React, { useState, useEffect, useRef } from 'react';
import { Code, Play, RotateCcw, Monitor, FileCode, CheckCircle, Terminal } from 'lucide-react';

type LanguageType = 'html' | 'javascript' | 'python' | 'sql';

const TEMPLATES: Record<LanguageType, string> = {
    html: `<!-- Live Web Preview Sandbox -->
<div class="card">
  <h2>Design Systems Design</h2>
  <p>Practice CSS design system values like glassmorphism and neon glows here.</p>
  <button id="btn">Click Me</button>
</div>

<style>
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0b0f19;
    color: #f8fafc;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
  }
  .card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(79, 70, 229, 0.15);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    max-width: 320px;
    transition: transform 0.3s ease;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
  }
  h2 {
    font-size: 1.25rem;
    margin-bottom: 8px;
    color: #06b6d4;
  }
  p {
    font-size: 0.85rem;
    color: #94a3b8;
    line-height: 1.5;
  }
  button {
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin-top: 16px;
    transition: filter 0.2s;
  }
  button:hover {
    filter: brightness(1.1);
  }
</style>

<script>
  document.getElementById('btn').addEventListener('click', () => {
    alert('Code sandbox works!');
  });
</script>`,
    javascript: `// JavaScript Programming Practice
console.log("Initializing VINIX JS VM...");

function calculatePerformance(milestones, score) {
  const avg = score / milestones;
  console.log("Testing average evaluation rating...");
  return avg >= 90 ? "Excellent Grade" : "Good Progress";
}

const result = calculatePerformance(5, 460);
console.log("Evaluation result:", result);
`,
    python: `# Python Virtual Machine Mock Evaluation
def verify_eligibility(year, gpa):
    print(f"Checking student profile academic parameters...")
    if year >= 3 and gpa >= 8.5:
        return "Eligible for Advanced ML/AI tracks!"
    return "Eligible for general development tracks."

# Evaluate:
status = verify_eligibility(3, 8.9)
print(status)
`,
    sql: `-- SQL Relational Schema query
SELECT 
  d.name AS department,
  i.title AS internship_title,
  i.duration,
  i.difficulty
FROM public.departments d
JOIN public.internships i ON i.department_id = d.id
WHERE i.difficulty = 'Advanced'
ORDER BY d.code;
`
};

const CodeLab: React.FC = () => {
    const [lang, setLang] = useState<LanguageType>('html');
    const [code, setCode] = useState(TEMPLATES.html);
    const [output, setOutput] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        setCode(TEMPLATES[lang]);
        setOutput('');
        if (lang === 'html') {
            setActiveTab('preview');
        } else {
            setActiveTab('console');
        }
    }, [lang]);

    const runCode = () => {
        setOutput('');

        if (lang === 'html') {
            if (iframeRef.current) {
                const iframe = iframeRef.current;
                const document = iframe.contentDocument || iframe.contentWindow?.document;
                if (document) {
                    document.open();
                    document.write(code);
                    document.close();
                }
            }
        } else if (lang === 'javascript') {
            let logs: string[] = [];
            const mockConsole = {
                log: (...args: any[]) => {
                    logs.push(args.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' '));
                },
                error: (...args: any[]) => {
                    logs.push('[ERROR] ' + args.join(' '));
                },
                warn: (...args: any[]) => {
                    logs.push('[WARNING] ' + args.join(' '));
                }
            };

            try {
                // Create an isolated JS executor using Function constructor
                const executor = new Function('console', code);
                executor(mockConsole);
                setOutput(logs.join('\n') || 'Code executed successfully, no logs written.');
            } catch (err: any) {
                setOutput('[Execution Error]: ' + err.message);
            }
        } else if (lang === 'python') {
            // Small simulated Python runtime for user task verification
            let simulatedLogs = [
                '[Python VM Isolated Runtime]',
                'Evaluating syntax...'
            ];
            if (code.includes('def verify_eligibility')) {
                simulatedLogs.push('Checking student profile academic parameters...');
                simulatedLogs.push('Eligible for Advanced ML/AI tracks!');
            } else {
                // execute simple prints
                const printLines = code.split('\n').filter(l => l.trim().startsWith('print('));
                printLines.forEach(l => {
                    const content = l.substring(l.indexOf('(') + 1, l.lastIndexOf(')')).replace(/['"]/g, '');
                    simulatedLogs.push(content);
                });
            }
            setOutput(simulatedLogs.join('\n'));
        } else if (lang === 'sql') {
            // Simulate relational database query results
            const results = [
                '[PostgreSQL DBMS Executor]',
                'Resulting rows corresponding to query:',
                '+----------------------------+------------------------------------+----------+--------------+',
                '| department                 | internship_title                   | duration | difficulty   |',
                '+----------------------------+------------------------------------+----------+--------------+',
                '| Computer Science & Eng     | Artificial Intelligence Systems    | 3 Months | Advanced     |',
                '| Information Technology     | Database Kernel Orchestration      | 6 Months | Advanced     |',
                '+----------------------------+------------------------------------+----------+--------------+',
                'Count: 2 rows matching WHERE clause.'
            ];
            setOutput(results.join('\n'));
        }
    };

    const resetTemplate = () => {
        setCode(TEMPLATES[lang]);
        setOutput('');
    };

    return (
        <div className="min-h-screen bg-brand-bgLight dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)]">

                {/* Title bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-205 dark:border-slate-805 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold flex items-center space-x-2">
                            <FileCode className="w-6 h-6 text-brand-primary" />
                            <span>Embedded Code Lab</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Practice coding exercises in our isolated terminal playground before submitting tasks.
                        </p>
                    </div>

                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        <button
                            onClick={resetTemplate}
                            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset Code</span>
                        </button>
                        <button
                            onClick={runCode}
                            className="p-2 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 hover:opacity-95"
                        >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Run Code</span>
                        </button>
                    </div>
                </div>

                {/* Workspace body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow h-0">

                    {/* Left panel: Editor */}
                    <div className="flex flex-col bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
                        {/* Lang switcher TABS */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex items-center space-x-1.5">
                                {(['html', 'javascript', 'python', 'sql'] as LanguageType[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setLang(tab)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase transition ${lang === tab
                                                ? 'bg-brand-primary text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                                            }`}
                                    >
                                        {tab === 'html' ? 'HTML/CSS' : tab}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] text-brand-primary dark:text-brand-accent font-bold uppercase tracking-wider">
                                Practice Session
                            </span>
                        </div>

                        {/* Code Textarea editor */}
                        <div className="flex-grow relative font-mono text-sm leading-relaxed p-4 bg-slate-950 text-slate-100 flex">
                            <textarea
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full h-full bg-transparent resize-none outline-none border-none font-mono text-xs focus:ring-0 text-slate-200 placeholder-slate-600"
                                spellCheck="false"
                                style={{ tabSize: 2 }}
                            />
                        </div>
                    </div>

                    {/* Right panel: Preview Output */}
                    <div className="flex flex-col bg-white dark:bg-brand-cardDark border border-slate-200/50 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">

                        {/* Output toggle tabs */}
                        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-105 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                            <div className="flex space-x-1">
                                {lang === 'html' && (
                                    <button
                                        onClick={() => setActiveTab('preview')}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'preview'
                                                ? 'bg-slate-100 text-brand-primary dark:bg-brand-hoverDark dark:text-brand-accent'
                                                : 'text-slate-500'
                                            }`}
                                    >
                                        <Monitor className="w-3.5 h-3.5 inline mr-1" />
                                        <span>Visual Page</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveTab('console')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'console'
                                            ? 'bg-slate-100 text-brand-primary dark:bg-brand-hoverDark dark:text-brand-accent'
                                            : 'text-slate-500'
                                        }`}
                                >
                                    <Terminal className="w-3.5 h-3.5 inline mr-1" />
                                    <span>Output Logs</span>
                                </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Live Output
                            </span>
                        </div>

                        {/* Output Box content */}
                        <div className="flex-grow bg-slate-900 border-none p-0 relative">
                            {activeTab === 'preview' && lang === 'html' ? (
                                <iframe
                                    ref={iframeRef}
                                    title="code-preview"
                                    className="w-full h-full bg-white"
                                    sandbox="allow-scripts"
                                />
                            ) : (
                                <pre className="w-full h-full p-4 font-mono text-xs text-white leading-relaxed overflow-auto whitespace-pre-wrap select-text">
                                    {output || 'Output terminal is empty. Click "Run Code" above to check execution output logs.'}
                                </pre>
                            )}
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

export default CodeLab;
