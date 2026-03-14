<div align="center">
A multi-agent AI productivity system that plans your goals, tracks your tasks, and reflects on your performance — all powered by free Groq AI.
</div>

Dashboard
Overview of your goals, tasks, completion rate, and urgent items at a glance.

Planning Agent — Generate a Task Plan
Type a high-level goal and the AI breaks it down into prioritized, deadline-driven tasks.

My Tasks — Execution Agent
View all tasks grouped by priority. Start, complete, or delete tasks with one click.

Reflection Agent
AI analyses your productivity patterns and gives you a score, strengths, improvements, and suggestions.

Memory Module
Full history of all your goals, past reflections, and task statistics in one place.

🧠 What Is AgentPM?
AgentPM is a goal-oriented personal productivity agent built as part of the CIS 600 — Applied Agentic AI Systems course project at Syracuse University.
It implements a multi-agent architecture inspired by real agentic AI research:
ResearchApplied InReAct (Yao et al., 2023)Planning agent reasoning loopGenerative Agents (Park et al., 2023)Long-term memory & personalizationReflexion (Shinn et al., 2023)Self-reflection and plan improvement
Unlike a simple chatbot, AgentPM runs a continuous Plan → Execute → Reflect cycle that adapts to your behavior over time.

✨ Features

🎯 Planning Agent — Converts any high-level goal into structured tasks with priorities, deadlines, and tips
✅ Execution Agent — Track task progress through Pending → In Progress → Completed states
🔍 Reflection Agent — Analyses your task history and generates a productivity score, strengths, areas to improve, and personalized suggestions
🧠 Memory Module — Stores all goals and reflection history; past reflections automatically improve future plans
🗑️ Delete Tasks — Remove any task along with its full goal history
📊 Dashboard — Real-time stats including completion rate, progress bar, and urgent task alerts
🔔 Toast Notifications — Instant feedback on every action
🌙 Dark UI — Clean, modern dark purple interface


🏗️ Architecture
┌─────────────────────────────────────────────┐
│                  React Frontend              │
│  Dashboard | Planning | Tasks | Reflection  │
│              Memory | Sidebar Nav            │
└────────────────────┬────────────────────────┘
                     │ /api/chat
┌────────────────────▼────────────────────────┐
│           Express Backend (server.js)        │
│         Forwards requests to Groq API        │
│          Keeps API key secret & safe         │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│         Groq API — Llama 3.3 70B            │
│   Planning Agent  |  Reflection Agent        │
└─────────────────────────────────────────────┘

🛠️ Tech Stack
LayerTechnologyFrontendReact 18, inline CSSBackendNode.js, ExpressAI ModelLlama 3.3 70B via Groq API (Free)Agent FrameworkCustom prompt-based multi-agent systemMemoryReact state (in-session)Auth ProxyExpress middleware

🚀 Getting Started
Prerequisites

Node.js (v18+) → https://nodejs.org
A free Groq API key → https://console.groq.com

Installation
1. Clone the repository
bashgit clone https://github.com/Ompatil04/AgentPM.git
cd AgentPM
2. Install dependencies
bashnpm install
3. Create your .env file in the root folder
GROQ_API_KEY=gsk_your_key_here
4. Run the app
bashnpm run dev
Open your browser at → http://localhost:3000

📂 Project Structure
AgentPM/
├── public/
│   └── index.html
├── src/
│   ├── App.js          ← All React components + agent logic
│   └── index.js        ← React entry point
├── .env                ← Your Groq API key (not pushed to GitHub)
├── .gitignore
├── server.js           ← Express backend proxy to Groq
├── package.json
└── README.md

🔄 How the Agent Cycle Works
1. User types a goal
        ↓
2. Planning Agent (Groq AI)
   → Breaks goal into tasks with priority + deadline + tips
        ↓
3. User works through tasks
   → Marks them Start / Done / Delete
        ↓
4. Reflection Agent (Groq AI)
   → Reads all task history
   → Outputs score, strengths, improvements, suggestions
        ↓
5. Memory stores reflection
   → Next plan automatically uses past insights ✅

🤝 Team
NameNetIDAtharva Chavanatchavan@syr.eduVed Rautvuraut@syr.eduSwayam Badheswbadhe@syr.eduOm Patilopatil@syr.edu
Course: CIS 600 — Applied Agentic AI Systems
University: Syracuse University

📚 References

Yao et al. (2023). ReAct: Synergizing Reasoning and Acting in Language Models. ICLR.
Park et al. (2023). Generative Agents: Interactive Simulacra of Human Behavior. CHI.
Shinn et al. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. NeurIPS.
Liu et al. (2024). Long-Term Memory for Large Language Models. arXiv.


<div align="center">
Built with ❤️ by <strong>OM</strong> · Syracuse University · Powered by Groq + Llama 3.3
</div>
