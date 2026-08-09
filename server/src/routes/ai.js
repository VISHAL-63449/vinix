import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const KNOWLEDGE_BASE = {
    hooks: {
        explanation: `React Hooks are functions that let you "hook into" React state and lifecycle features from function components. The most common hooks are:
1. **useState**: Declares a state variable that you can update directly.
2. **useEffect**: Performs side-effects, such as data fetching, subscriptions, or manual DOM updates.
3. **useContext**: Subscribes to React context to access global/shared data without prop-drilling.
4. **useRef**: References a value that's not needed for rendering (like DOM nodes or persistent variables).`,
        codeExample: `import React, { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  }, [count]); // Only re-run the effect if count changes

  return (
    <div className="p-4 bg-slate-800 rounded-lg text-white">
      <p>You clicked {count} times</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-700 rounded transition"
      >
        Click me
      </button>
    </div>
  );
}`,
        quiz: {
            question: "Which of the following is true about React Hooks?",
            options: [
                "They can only be called from inside class components.",
                "They should only be called at the top level of your function components (not inside loops or conditions).",
                "They can be called conditionally.",
                "They replace React state entirely."
            ],
            answer: "They should only be called at the top level of your function components (not inside loops or conditions)."
        },
        practiceTask: "Create a custom hook called 'useWindowSize' that returns the current window width and height. Use it to conditionally render mobile and desktop layouts in a React component."
    },

    python: {
        explanation: `Python is a high-level, interpreted programming language known for its readability and simplicity. Key features:
- **Clean Syntax**: Uses indentation to define code blocks rather than curly braces.
- **Dynamic Typing**: No need to declare variable types explicitly.
- **Object-Oriented**: Supports standard OOP concepts (classes, inheritance, polymorphism).
- **Batteries Included**: Comes with a large standard library for modules, math, parsing, and web utilities.`,
        codeExample: `# Simple Python class and list comprehension example

class Student:
    def __init__(self, name, score):
        self.name = name
        self.score = score

students = [
    Student("Alice", 85),
    Student("Bob", 92),
    Student("Charlie", 78)
]

# List comprehension to filter top students
top_students = [s.name for s in students if s.score >= 80]
print(f"Top students: {top_students}") # Output: ['Alice', 'Bob']`,
        quiz: {
            question: "Which list comprehension yields only even numbers from range(1, 6)?",
            options: [
                "[x if x % 2 == 0 for x in range(1, 6)]",
                "[x for x in range(1, 6) if x % 2 == 0]",
                "[x for x in range(1, 6) even]",
                "[x for x % 2 == 0 in range(1, 6)]"
            ],
            answer: "[x for x in range(1, 6) if x % 2 == 0]"
        },
        practiceTask: "Write a Python script that reads a text file, counts the frequency of each word, and outputs the top 5 most common words sorted in descending order."
    },

    javascript: {
        explanation: `JavaScript is the runtime programming language of the web. Modern JavaScript (ES6+) introduced:
- **Arrow Functions**: Compact notation for functions: \`(arg) => { ... }\`.
- **Promises & Async/Await**: Cleaner syntax for handling async network actions and timers.
- **Destructuring**: Direct syntax to dissect arrays or objects into local variables.
- **Modules**: Standard ESM inputs and outputs using \`import\` and \`export\`.`,
        codeExample: `// Fetching data using async/await with error handling

async function fetchUserData(userId) {
  try {
    const response = await fetch(\`https://api.example.com/users/\${userId}\`);
    if (!response.ok) {
      throw new Error('Network issues encountered!');
    }
    const { name, email, roles } = await response.json();
    return { name, email, isAdmin: roles.includes('admin') };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}`,
        quiz: {
            question: "What is the difference between '==' and '===' in JavaScript?",
            options: [
                "'==' compares values only; '===' compares both value and type.",
                "'===' is only used for strings, '==' is for numbers.",
                "'==' is faster, but '===' is safer.",
                "There is no difference."
            ],
            answer: "'==' compares values only; '===' compares both value and type."
        },
        practiceTask: "Implement a debounce function in JS that delays the execution of a search handler until 300ms have elapsed since the user last typed."
    }
};

router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required.' });
        }

        const cleanPrompt = prompt.toLowerCase();

        // Find matching topic
        let topic = 'hooks'; // default
        if (cleanPrompt.includes('hook') || cleanPrompt.includes('react')) {
            topic = 'hooks';
        } else if (cleanPrompt.includes('python') || cleanPrompt.includes('django') || cleanPrompt.includes('class')) {
            topic = 'python';
        } else if (cleanPrompt.includes('js') || cleanPrompt.includes('javascript') || cleanPrompt.includes('promise') || cleanPrompt.includes('async')) {
            topic = 'javascript';
        } else {
            // Dynamic fallback compilation
            return res.json({
                explanation: `Here is an AI-guided overview to address your interest in "${prompt}":
- **Core Concept**: Understanding this area is vital for professional web and application development.
- **Best Practices**: Implement modular structure, optimize computational cycles, and keep user experience clean.
- **AI Recommendation**: Check our relevant course pages or internships for extensive task practices.`,
                codeExample: `// AI-Generated sample matching your prompt: "${prompt}"

function handleTopicDemo() {
  console.log("Analyzing concepts for: ${prompt}");
  // Dynamic mock demo code
  const status = "Ready";
  return {
    status,
    timestamp: new Date().toLocaleDateString(),
    context: "${prompt}"
  };
}

handleTopicDemo();`,
                quiz: {
                    question: `Which of the following describes the core goal of studying "${prompt}" in development?`,
                    options: [
                        "To gain industrial knowledge and improve project scalability.",
                        "To increase rendering speeds without code changes.",
                        "To replace server-side logic setup entirely.",
                        "To use older frameworks compatibility tools."
                    ],
                    answer: "To gain industrial knowledge and improve project scalability."
                },
                practiceTask: `Create a simple sandbox application incorporating "${prompt}" principles, then write a short test ensuring the input is validated and handled correctly.`
            });
        }

        res.json(KNOWLEDGE_BASE[topic]);
    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ message: 'AI Mentor failed to generate response.' });
    }
});

export default router;
