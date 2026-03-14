import { useState, useCallback } from "react";

// ─── GROQ API HELPER ──────────────────────────────────────────────────────────

async function apiCall(systemPrompt, userPrompt) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const text = data.text || "";
  const clean = text.replace(/```json[\s\S]*?```/g, (m) =>
    m.replace(/```json|```/g, "")
  ).replace(/```/g, "").trim();

  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  return JSON.parse(clean.slice(start, end + 1));
}

// ─── PLANNING AGENT ───────────────────────────────────────────────────────────

async function runPlanningAgent(goal, memoryHints) {
  return apiCall(
    `You are a Planning Agent in a productivity system.
You break user goals into clear, actionable tasks with deadlines, priorities, and tips.
You MUST respond with ONLY a valid JSON object. No explanation. No markdown. No backticks. Raw JSON only.`,
    `Goal: "${goal}"
${memoryHints ? `Memory hints from past reflections: ${memoryHints}` : ""}

Return ONLY this JSON (no other text):
{
  "planSummary": "one sentence summary of the plan",
  "tasks": [
    {
      "description": "specific actionable task",
      "priority": "high",
      "deadline": "Day 1",
      "estimatedMinutes": 45,
      "tip": "a helpful productivity tip for this task"
    },
    {
      "description": "another task",
      "priority": "medium",
      "deadline": "Day 2",
      "estimatedMinutes": 30,
      "tip": "another tip"
    }
  ]
}`
  );
}

// ─── REFLECTION AGENT ─────────────────────────────────────────────────────────

async function runReflectionAgent(tasks, prevReflections) {
  const taskLines = tasks
    .map((t) => `- [${t.status.toUpperCase()}] ${t.description} (Priority: ${t.priority})`)
    .join("\n");
  const prevContext = prevReflections
    .slice(-2)
    .map((r) => r.analysis)
    .join(" | ");

  return apiCall(
    `You are a Reflection Agent that analyses productivity patterns and gives actionable feedback.
You MUST respond with ONLY a valid JSON object. No explanation. No markdown. No backticks. Raw JSON only.`,
    `Task history:
${taskLines}
${prevContext ? `\nPrevious analysis context: ${prevContext}` : ""}

Return ONLY this JSON (no other text):
{
  "productivityScore": 72,
  "analysis": "2-3 sentence analysis of productivity patterns",
  "strengths": ["strength one", "strength two"],
  "improvements": ["improvement area one", "improvement area two"],
  "suggestions": ["suggestion one", "suggestion two", "suggestion three"],
  "motivationalMessage": "an encouraging and personalized message"
}`
  );
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#10b981" };
const PRIORITY_BG    = {
  high:   "rgba(239,68,68,.12)",
  medium: "rgba(245,158,11,.12)",
  low:    "rgba(16,185,129,.12)",
};

const NAV = [
  { id: "dashboard",  icon: "📊", label: "Dashboard"  },
  { id: "planning",   icon: "🎯", label: "New Goal"   },
  { id: "tasks",      icon: "✅", label: "My Tasks"   },
  { id: "reflection", icon: "🔍", label: "Reflection" },
  { id: "memory",     icon: "🧠", label: "Memory"     },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#16213e", borderRadius: 14, padding: 24, border: "1px solid #2d2d4e", ...style }}>
      {children}
    </div>
  );
}

function Pill({ color, bg, children }) {
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: bg, color, letterSpacing: 0.5 }}>
      {children}
    </span>
  );
}

function Toast({ msg, type }) {
  return (
    <div style={{
      position: "fixed", top: 24, right: 24, zIndex: 9999,
      padding: "12px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14,
      background: type === "error" ? "#ef4444" : "#10b981",
      color: "#fff", boxShadow: "0 6px 24px rgba(0,0,0,.4)",
      animation: "pop .25s ease",
    }}>
      {msg}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff",
      borderRadius: "50%", animation: "spin .7s linear infinite",
    }} />
  );
}

function EmptyState({ icon, title, body, action }) {
  return (
    <Card style={{ textAlign: "center", padding: "64px 32px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>{body}</p>
      {action}
    </Card>
  );
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────

function btnStyle(variant) {
  const base = {
    padding: "11px 20px", borderRadius: 9, border: "none", cursor: "pointer",
    fontWeight: 700, fontSize: 14, width: "100%",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  };
  return variant === "gradient"
    ? { ...base, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff" }
    : { ...base, background: "#2d2d4e", color: "#e2e8f0" };
}

function tabStyle(active) {
  return {
    padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 600,
    background: active ? "#6366f1" : "#2d2d4e",
    color: active ? "#fff" : "#9ca3af",
    transition: "all .2s",
  };
}

function smBtn(bg) {
  return {
    padding: "6px 12px", borderRadius: 7, border: "none",
    background: bg, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700,
  };
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard({ goals, tasks, reflections, setView }) {
  const done   = tasks.filter((t) => t.status === "completed").length;
  const total  = tasks.length;
  const rate   = total > 0 ? Math.round((done / total) * 100) : 0;
  const urgent = tasks.filter((t) => t.priority === "high" && t.status !== "completed").length;

  const stats = [
    { label: "Goals Set",    val: goals.length, icon: "🎯", color: "#a78bfa" },
    { label: "Total Tasks",  val: total,         icon: "📋", color: "#60a5fa" },
    { label: "Completed",    val: done,          icon: "✅", color: "#34d399" },
    { label: "Completion %", val: `${rate}%`,    icon: "📈", color: "#fbbf24" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
      <p style={{ color: "#6b7280", marginBottom: 28 }}>Your AI-powered productivity overview</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {stats.map((s) => (
          <Card key={s.label} style={{ padding: 18 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontWeight: 600 }}>Overall Progress</span>
          <span style={{ color: "#6366f1", fontWeight: 800 }}>{rate}%</span>
        </div>
        <div style={{ background: "#0f0f1a", borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${rate}%`, borderRadius: 99, background: "linear-gradient(90deg,#6366f1,#10b981)", transition: "width .6s ease" }} />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>⚡ Quick Actions</h3>
          <button onClick={() => setView("planning")} style={btnStyle("gradient")}>🎯 Set New Goal</button>
          <button onClick={() => setView("tasks")}    style={{ ...btnStyle("ghost"), marginTop: 8 }}>📋 View Tasks</button>
        </Card>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🔥 Status</h3>
          {urgent > 0
            ? <p style={{ color: "#ef4444", fontWeight: 600 }}>{urgent} high-priority task{urgent > 1 ? "s" : ""} pending!</p>
            : <p style={{ color: "#10b981", fontWeight: 600 }}>No urgent tasks right now 🎉</p>}
          {reflections.length > 0 && (
            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 10 }}>
              Last reflection: {new Date(reflections[reflections.length - 1].timestamp).toLocaleDateString()}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── PLANNING ─────────────────────────────────────────────────────────────────

function Planning({ goals, tasks, goalInput, setGoalInput, onPlan, loading, reflections, setView, setActiveGoal }) {
  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🎯 Planning Agent</h1>
      <p style={{ color: "#6b7280", marginBottom: 28 }}>Describe your goal — the AI will build a task plan for you</p>

      <Card style={{ maxWidth: 680, marginBottom: 32 }}>
        <label style={{ display: "block", fontWeight: 700, marginBottom: 10, color: "#c4b5fd" }}>
          What do you want to achieve?
        </label>
        <textarea
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="e.g. Prepare for my ML exam next week, or build a consistent fitness routine…"
          rows={4}
          style={{
            width: "100%", borderRadius: 10, padding: 14, fontSize: 14,
            background: "#0f0f1a", border: "1px solid #2d2d4e", color: "#e2e8f0",
            resize: "vertical", outline: "none", boxSizing: "border-box",
            lineHeight: 1.6, fontFamily: "inherit",
          }}
        />
        {reflections.length > 0 && (
          <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, fontSize: 13, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", color: "#a78bfa" }}>
            🧠 Using insights from {reflections.length} past reflection{reflections.length > 1 ? "s" : ""} to improve this plan
          </div>
        )}
        <button onClick={onPlan} disabled={loading || !goalInput.trim()}
          style={{ ...btnStyle("gradient"), marginTop: 16, opacity: !goalInput.trim() || loading ? 0.5 : 1 }}>
          {loading ? <><Spinner /> &nbsp;Planning…</> : "🚀 Generate Plan"}
        </button>
      </Card>

      {goals.length > 0 && (
        <>
          <h3 style={{ fontWeight: 700, marginBottom: 14, color: "#9ca3af" }}>📚 Past Goals</h3>
          {goals.map((g) => {
            const gtasks = tasks.filter((t) => t.goalId === g.id);
            const gdone  = gtasks.filter((t) => t.status === "completed").length;
            return (
              <Card key={g.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{g.text}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    {new Date(g.createdAt).toLocaleDateString()} · {gdone}/{gtasks.length} tasks done
                  </div>
                </div>
                <button onClick={() => { setActiveGoal(g); setView("tasks"); }} style={tabStyle(false)}>
                  View Tasks →
                </button>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

function Tasks({ goals, tasks, activeGoal, setActiveGoal, onStatus, onDelete, setView }) {
  const filtered = activeGoal ? tasks.filter((t) => t.goalId === activeGoal.id) : tasks;

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>✅ Execution Agent</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>Track and update your task progress</p>

      {goals.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveGoal(null)} style={tabStyle(!activeGoal)}>All</button>
          {goals.map((g) => (
            <button key={g.id} onClick={() => setActiveGoal(g)} style={tabStyle(activeGoal?.id === g.id)}>
              {g.text.slice(0, 22)}{g.text.length > 22 ? "…" : ""}
            </button>
          ))}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon="🎯" title="No tasks yet" body="Set a goal and the planning agent will create tasks for you."
          action={<button onClick={() => setView("planning")} style={btnStyle("gradient")}>Set a Goal</button>}
        />
      ) : (
        ["high", "medium", "low"].map((priority) => {
          const group = filtered.filter((t) => t.priority === priority);
          if (!group.length) return null;
          return (
            <div key={priority} style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ color: PRIORITY_COLOR[priority], fontSize: 18 }}>●</span>
                <span style={{ fontWeight: 700, textTransform: "capitalize", color: PRIORITY_COLOR[priority] }}>{priority} Priority</span>
                <span style={{ color: "#6b7280", fontSize: 13 }}>({group.length})</span>
              </div>
              {group.map((task) => (
                <TaskCard key={task.id} task={task} onStatus={onStatus} onDelete={onDelete} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}

function TaskCard({ task, onStatus, onDelete }) {
  const done       = task.status === "completed";
  const inProgress = task.status === "in-progress";

  return (
    <div style={{
      background: "#16213e",
      border: `1px solid ${done ? "#10b98144" : "#2d2d4e"}`,
      borderRadius: 12, padding: 18, marginBottom: 10,
      opacity: done ? 0.72 : 1, transition: "all .2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6, textDecoration: done ? "line-through" : "none", color: done ? "#6b7280" : "#e2e8f0" }}>
            {task.description}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#6b7280" }}>
            <span>⏱ {task.estimatedMinutes} min</span>
            <span>📅 {task.deadline}</span>
            <Pill color={PRIORITY_COLOR[task.priority]} bg={PRIORITY_BG[task.priority]}>
              {task.priority.toUpperCase()}
            </Pill>
          </div>
          {task.tip && (
            <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 8 }}>💡 {task.tip}</div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "flex-start" }}>
          {done ? (
            <span style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(16,185,129,.2)", color: "#10b981", fontSize: 12, fontWeight: 700 }}>
              ✅ Done
            </span>
          ) : (
            <>
              {!inProgress && (
                <button onClick={() => onStatus(task.id, "in-progress")} style={smBtn("#3b82f6")}>▶ Start</button>
              )}
              {inProgress && (
                <span style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(245,158,11,.2)", color: "#f59e0b", fontSize: 12, fontWeight: 700 }}>
                  ⏳ Active
                </span>
              )}
              <button onClick={() => onStatus(task.id, "completed")} style={smBtn("#059669")}>✓ Done</button>
            </>
          )}

          {/* Delete button — always visible */}
          <button
            onClick={() => {
              if (window.confirm("Delete this task? If it's the last task for its goal, the goal history will also be removed."))
                onDelete(task.id);
            }}
            style={{
              ...smBtn("transparent"),
              background: "rgba(239,68,68,.15)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,.3)",
            }}
            title="Delete task"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REFLECTION ───────────────────────────────────────────────────────────────

function Reflection({ reflection, loading, tasks, onReflect }) {
  if (!reflection) {
    return (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🔍 Reflection Agent</h1>
        <p style={{ color: "#6b7280", marginBottom: 28 }}>AI analysis of your productivity patterns</p>
        <EmptyState icon="🔍" title="No reflection yet" body="Complete some tasks, then run a reflection to get AI insights."
          action={
            <button onClick={onReflect} disabled={tasks.length === 0 || loading}
              style={{ ...btnStyle("gradient"), opacity: tasks.length === 0 ? 0.5 : 1 }}>
              {loading ? <><Spinner /> &nbsp;Analyzing…</> : "🔍 Run Reflection"}
            </button>
          }
        />
      </div>
    );
  }

  const score      = reflection.productivityScore ?? 0;
  const scoreColor = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🔍 Reflection Agent</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>AI analysis of your productivity patterns</p>

      <Card style={{ background: "linear-gradient(135deg,#16213e,#1a1a2e)", display: "flex", alignItems: "center", gap: 28, marginBottom: 18 }}>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: scoreColor }}>{score}</div>
          <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>SCORE /100</div>
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "#c4b5fd", marginBottom: 6 }}>Agent Message</div>
          <p style={{ color: "#d1d5db", lineHeight: 1.7, fontSize: 14 }}>{reflection.motivationalMessage}</p>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 10, color: "#c4b5fd" }}>📊 Analysis</h3>
        <p style={{ color: "#d1d5db", lineHeight: 1.75, fontSize: 14 }}>{reflection.analysis}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 12, color: "#10b981" }}>💪 Strengths</h3>
          {reflection.strengths?.map((s, i) => (
            <div key={i} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 8, background: "rgba(16,185,129,.1)", color: "#34d399", fontSize: 13 }}>✓ {s}</div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 12, color: "#f59e0b" }}>🔧 Improvements</h3>
          {reflection.improvements?.map((s, i) => (
            <div key={i} style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 8, background: "rgba(245,158,11,.1)", color: "#fbbf24", fontSize: 13 }}>⚡ {s}</div>
          ))}
        </Card>
      </div>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: 12, color: "#6366f1" }}>💡 Agent Suggestions</h3>
        {reflection.suggestions?.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", borderRadius: 8, marginBottom: 8, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)" }}>
            <span style={{ color: "#6366f1", fontWeight: 800, minWidth: 20 }}>{i + 1}.</span>
            <span style={{ color: "#d1d5db", fontSize: 14 }}>{s}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MEMORY ───────────────────────────────────────────────────────────────────

function Memory({ goals, tasks, reflections, setCurrentReflection, setView }) {
  const taskStats = [
    { label: "Pending",       count: tasks.filter((t) => t.status === "pending").length,     color: "#6b7280" },
    { label: "In Progress",   count: tasks.filter((t) => t.status === "in-progress").length, color: "#3b82f6" },
    { label: "Completed",     count: tasks.filter((t) => t.status === "completed").length,   color: "#10b981" },
    { label: "High Priority", count: tasks.filter((t) => t.priority === "high").length,      color: "#ef4444" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🧠 Memory Module</h1>
      <p style={{ color: "#6b7280", marginBottom: 28 }}>Everything your agent remembers about you</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 14, color: "#c4b5fd" }}>🎯 Goals History</h3>
          {goals.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 14 }}>No goals yet.</p>
            : goals.map((g) => {
                const gt = tasks.filter((t) => t.goalId === g.id);
                const gd = gt.filter((t) => t.status === "completed").length;
                return (
                  <div key={g.id} style={{ padding: 12, borderRadius: 8, marginBottom: 8, background: "#0f0f1a", border: "1px solid #2d2d4e" }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{g.text}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                      {new Date(g.createdAt).toLocaleDateString()} · {gd}/{gt.length} done
                    </div>
                  </div>
                );
              })
          }
        </Card>

        <Card>
          <h3 style={{ fontWeight: 700, marginBottom: 14, color: "#c4b5fd" }}>🔍 Reflection History</h3>
          {reflections.length === 0
            ? <p style={{ color: "#6b7280", fontSize: 14 }}>No reflections yet.</p>
            : [...reflections].reverse().map((r) => (
                <div key={r.id}
                  onClick={() => { setCurrentReflection(r); setView("reflection"); }}
                  style={{ padding: 12, borderRadius: 8, marginBottom: 8, background: "#0f0f1a", border: "1px solid #2d2d4e", cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Score: {r.productivityScore}/100</span>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{new Date(r.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>{r.analysis?.slice(0, 90)}…</div>
                </div>
              ))
          }
        </Card>
      </div>

      <Card>
        <h3 style={{ fontWeight: 700, marginBottom: 14, color: "#c4b5fd" }}>📊 Task Statistics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {taskStats.map((s) => (
            <div key={s.label} style={{ background: "#0f0f1a", borderRadius: 10, padding: 16, textAlign: "center", border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view,              setView]              = useState("dashboard");
  const [goals,             setGoals]             = useState([]);
  const [tasks,             setTasks]             = useState([]);
  const [reflections,       setReflections]       = useState([]);
  const [goalInput,         setGoalInput]         = useState("");
  const [activeGoal,        setActiveGoal]        = useState(null);
  const [currentReflection, setCurrentReflection] = useState(null);
  const [loadPlan,          setLoadPlan]          = useState(false);
  const [loadReflect,       setLoadReflect]       = useState(false);
  const [toast,             setToast]             = useState(null);

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Delete task + auto-clean goal if no tasks remain ──
  const handleDelete = (id) => {
    const task      = tasks.find((t) => t.id === id);
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    if (task) {
      const goalTasksLeft = remaining.filter((t) => t.goalId === task.goalId);
      if (goalTasksLeft.length === 0) {
        setGoals((p) => p.filter((g) => g.id !== task.goalId));
        if (activeGoal?.id === task.goalId) setActiveGoal(null);
      }
    }
    notify("🗑️ Task deleted!");
  };

  // ── Update task status ──
  const handleStatus = (id, status) => {
    setTasks((p) =>
      p.map((t) =>
        t.id === id
          ? { ...t, status, completedAt: status === "completed" ? new Date().toISOString() : null }
          : t
      )
    );
    if (status === "completed") notify("🎉 Task completed!");
  };

  // ── Planning Agent ──
  const handlePlan = async () => {
    if (!goalInput.trim()) return;
    setLoadPlan(true);
    try {
      const hints  = reflections.slice(-2).map((r) => r.analysis).join(". ");
      const result = await runPlanningAgent(goalInput, hints || null);
      const newGoal = {
        id: Date.now(),
        text: goalInput,
        createdAt: new Date().toISOString(),
        summary: result.planSummary,
      };
      const newTasks = (result.tasks || []).map((t, i) => ({
        id: Date.now() + i + 1,
        goalId: newGoal.id,
        description: t.description,
        priority: t.priority || "medium",
        deadline: t.deadline || "TBD",
        estimatedMinutes: t.estimatedMinutes || 30,
        tip: t.tip || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        completedAt: null,
      }));
      setGoals((p) => [...p, newGoal]);
      setTasks((p) => [...p, ...newTasks]);
      setActiveGoal(newGoal);
      setGoalInput("");
      setView("tasks");
      notify(`✅ Plan created — ${newTasks.length} tasks added!`);
    } catch (err) {
      console.error(err);
      notify("❌ Planning failed. Check terminal for errors.", "error");
    } finally {
      setLoadPlan(false);
    }
  };

  // ── Reflection Agent ──
  const handleReflect = async () => {
    if (!tasks.length) return;
    setLoadReflect(true);
    try {
      const result = await runReflectionAgent(tasks, reflections);
      const newRef = { id: Date.now(), timestamp: new Date().toISOString(), ...result };
      setReflections((p) => [...p, newRef]);
      setCurrentReflection(newRef);
      setView("reflection");
      notify("🔍 Reflection complete!");
    } catch (err) {
      console.error(err);
      notify("❌ Reflection failed. Check terminal for errors.", "error");
    } finally {
      setLoadReflect(false);
    }
  };

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f0f1a; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pop  {
          from { opacity: 0; transform: scale(.88) translateY(-8px); }
          to   { opacity: 1; transform: scale(1)   translateY(0);    }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f0f1a; }
        ::-webkit-scrollbar-thumb { background: #2d2d4e; border-radius: 99px; }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={{ display: "flex", height: "100vh", background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* ── Sidebar ── */}
        <aside style={{ width: 220, background: "#13132b", borderRight: "1px solid #2d2d4e", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #2d2d4e" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#818cf8", letterSpacing: "-0.5px" }}>🤖 AgentPM</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>AI Productivity Agent</div>
          </div>

          <nav style={{ flex: 1, paddingTop: 10 }}>
            {NAV.map((n) => {
              const active = view === n.id;
              return (
                <button key={n.id} onClick={() => setView(n.id)} style={{
                  width: "100%", textAlign: "left", padding: "11px 20px",
                  background: active ? "rgba(99,102,241,.15)" : "transparent",
                  border: "none", borderLeft: `3px solid ${active ? "#6366f1" : "transparent"}`,
                  color: active ? "#818cf8" : "#6b7280",
                  cursor: "pointer", fontSize: 13.5, fontWeight: active ? 700 : 400,
                  display: "flex", alignItems: "center", gap: 10, transition: "all .15s",
                }}>
                  <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
                </button>
              );
            })}
          </nav>

          <div style={{ padding: 16, borderTop: "1px solid #2d2d4e" }}>
            <button onClick={handleReflect} disabled={loadReflect || !tasks.length} style={{
              width: "100%", padding: "11px", borderRadius: 9,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none", color: "#fff",
              cursor: tasks.length ? "pointer" : "not-allowed",
              opacity: tasks.length ? 1 : 0.45,
              fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loadReflect ? <><Spinner /> Analyzing…</> : "🔍 Run Reflection"}
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
          {view === "dashboard"  && <Dashboard  goals={goals} tasks={tasks} reflections={reflections} setView={setView} />}
          {view === "planning"   && <Planning   goals={goals} tasks={tasks} goalInput={goalInput} setGoalInput={setGoalInput} onPlan={handlePlan} loading={loadPlan} reflections={reflections} setView={setView} setActiveGoal={setActiveGoal} />}
          {view === "tasks"      && <Tasks      goals={goals} tasks={tasks} activeGoal={activeGoal} setActiveGoal={setActiveGoal} onStatus={handleStatus} onDelete={handleDelete} setView={setView} />}
          {view === "reflection" && <Reflection reflection={currentReflection} loading={loadReflect} tasks={tasks} onReflect={handleReflect} />}
          {view === "memory"     && <Memory     goals={goals} tasks={tasks} reflections={reflections} setCurrentReflection={setCurrentReflection} setView={setView} />}
        </main>
      </div>
    </>
  );
}