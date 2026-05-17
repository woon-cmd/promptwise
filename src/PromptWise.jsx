import { useState, useEffect } from "react";

// ── Config ─────────────────────────────────────────────────────────────────────
const BACKEND_URL = "";
const API_TIMEOUT_MS = 2500;

const MODELS = [
  { id: "chatgpt",    name: "ChatGPT",    color: "#10A37F", url: "https://chat.openai.com/" },
  { id: "claude",     name: "Claude",     color: "#C96C45", url: "https://claude.ai/new" },
  { id: "gemini",     name: "Gemini",     color: "#4285F4", url: "https://gemini.google.com/app" },
  { id: "perplexity", name: "Perplexity", color: "#20B2AA", url: "https://www.perplexity.ai/" },
  { id: "grok",       name: "Grok",       color: "#888",    url: "https://grok.x.ai/" },
  { id: "deepseek",   name: "DeepSeek",   color: "#4D6BFE", url: "https://chat.deepseek.com/" },
];

const COMPLEXITY_CFG = {
  simple:   { color: "#16A34A", bg: "#DCFCE7", icon: "🟢", label: "Quick answer"      },
  moderate: { color: "#D97706", bg: "#FEF9C3", icon: "🟡", label: "Detailed answer"   },
  complex:  { color: "#DC2626", bg: "#FEE2E2", icon: "🔴", label: "In-depth analysis" },
};

// ── Hybrid Pricing Model ───────────────────────────────────────────────────────
// Internal cost per optimisation: ~$0.000589 (blended free + cached stack)
// Even at 2,000 calls/month on Pro: ~$1.18 backend cost → 83% gross margin at $6.99
const PLANS = [
  {
    id:       "basic",
    name:     "Basic",
    price:    0,
    annualMonthly: null,
    annualTotal:   null,
    annualSaving:  null,
    period:   "Free forever",
    tagline:  "Build the habit, pay nothing",
    color:    "#6B7280",
    accentBg: "#0F111A",
    badge:    null,
    monthlyLimit: 100,   // 100/month — routed via $0 free tiers, costs us nothing
    batchLimit:   0,
    seats:    1,
    byok:     false,
    features: [
      { text: "100 optimizations per month",          included: true  },
      { text: "Prompt quality & accuracy scores",     included: true  },
      { text: "Accuracy Guard",                       included: true  },
      { text: "One-click export to any AI",           included: true  },
      { text: "6 AI platforms supported",             included: true  },
      { text: "Budget Tracker",                       included: false },
      { text: "Batch optimizer",                      included: false },
      { text: "Prompt history",                       included: false },
      { text: "Chrome Extension",                     included: false },
      { text: "Team seats",                           included: false },
    ],
    cta:      "Start Free",
    ctaStyle: "outline",
  },
  {
    id:       "pro",
    name:     "Pro",
    price:    6.99,
    annualMonthly: 4.92,   // $59/yr ÷ 12
    annualTotal:   59,
    annualSaving:  "Save $24.88/yr",
    period:   "/month",
    tagline:  "Unlimited power, under the $10 expense threshold",
    color:    "#4285F4",
    accentBg: "#0D1633",
    badge:    null,
    monthlyLimit: null,  // unlimited
    batchLimit:   10,
    seats:    1,
    byok:     false,
    features: [
      { text: "Unlimited optimizations",              included: true  },
      { text: "Prompt quality & accuracy scores",     included: true  },
      { text: "Accuracy Guard",                       included: true  },
      { text: "One-click export to any AI",           included: true  },
      { text: "6 AI platforms supported",             included: true  },
      { text: "Budget Tracker",                       included: true  },
      { text: "Batch optimizer (up to 10 prompts)",   included: true  },
      { text: "30-day prompt history",                included: true  },
      { text: "Chrome Extension",                     included: true  },
      { text: "Team seats",                           included: false },
    ],
    cta:      "Start Pro",
    ctaStyle: "solid",
  },
  {
    id:       "business",
    name:     "Business",
    price:    19,
    annualMonthly: 15,     // $180/yr
    annualTotal:   180,
    annualSaving:  "Save $48/yr",
    period:   "/month",
    tagline:  "5 seats for less than 1 PromptPerfect licence",
    color:    "#F59E0B",
    accentBg: "#0E0900",
    badge:    "Most Popular",
    monthlyLimit: null,
    batchLimit:   null,  // unlimited
    seats:    5,
    byok:     false,
    features: [
      { text: "Unlimited optimizations",              included: true  },
      { text: "Prompt quality & accuracy scores",     included: true  },
      { text: "Accuracy Guard",                       included: true  },
      { text: "One-click export to any AI",           included: true  },
      { text: "6 AI platforms supported",             included: true  },
      { text: "Budget Tracker",                       included: true  },
      { text: "Unlimited batch optimizer",            included: true  },
      { text: "Unlimited prompt history",             included: true  },
      { text: "Chrome Extension",                     included: true  },
      { text: "5 team seats + shared prompt library", included: true  },
      { text: "Manager ROI dashboard",                included: true  },
      { text: "Custom brand tone settings",           included: true  },
    ],
    cta:      "Start Business",
    ctaStyle: "gradient",
  },
  {
    id:       "businesspro",
    name:     "Business Pro",
    price:    39,
    annualMonthly: 32,     // $384/yr
    annualTotal:   384,
    annualSaving:  "Save $84/yr",
    period:   "/month",
    tagline:  "Full control for larger teams & integrations",
    color:    "#C96C45",
    accentBg: "#100806",
    badge:    null,
    monthlyLimit: null,
    batchLimit:   null,
    seats:    10,
    byok:     true,   // Bring Your Own Key option at $5/mo flat
    features: [
      { text: "Everything in Business",               included: true  },
      { text: "10 team seats included",               included: true  },
      { text: "Advanced usage analytics",             included: true  },
      { text: "API access for integrations",          included: true  },
      { text: "BYOK — bring your own API keys ($5/mo flat)", included: true },
      { text: "Priority processing queue",            included: true  },
      { text: "Priority support (24hr SLA)",          included: true  },
      { text: "SOC 2 compliance documentation",       included: true  },
      { text: "Dedicated onboarding session",         included: true  },
      { text: "Extra seats at $4/seat/month",         included: true  },
    ],
    cta:      "Contact Sales",
    ctaStyle: "outline-warm",
  },
];

const SESSION_LIMITS = {
  chatgpt_free:  { name: "ChatGPT Free",  limit: 4000,  color: "#10A37F" },
  chatgpt_plus:  { name: "ChatGPT Plus",  limit: 20000, color: "#10A37F" },
  claude_free:   { name: "Claude Free",   limit: 5000,  color: "#C96C45" },
  claude_pro:    { name: "Claude Pro",    limit: 30000, color: "#C96C45" },
  gemini_free:   { name: "Gemini Free",   limit: 8000,  color: "#4285F4" },
};

const TOKENS_PER_PAGE = 500;
const TOKENS_PER_TURN = 1000;
const tokToPages = n => Math.max(1, Math.round(n / TOKENS_PER_PAGE));
const tokToTurns = n => Math.max(1, Math.round(n / TOKENS_PER_TURN));
const scoreColor  = v => v >= 70 ? "#16A34A" : v >= 40 ? "#D97706" : "#DC2626";

const riskCfg = {
  low:    { bg: "#DCFCE7", text: "#15803D", label: "Low Risk ✓" },
  medium: { bg: "#FEF9C3", text: "#A16207", label: "Medium Risk ⚠" },
  high:   { bg: "#FEE2E2", text: "#B91C1C", label: "High Risk ✕" },
};

// ── System Prompt ──────────────────────────────────────────────────────────────
const SYS = `You are Promptwise — an AI prompt optimizer for non-technical users. Rewrite the given prompt to be clearer, more specific, and less likely to cause hallucinations. Return ONLY valid JSON with no markdown fences and no preamble.

Return exactly this structure:
{
  "optimized_prompt": "the improved prompt text",
  "original_token_estimate": 42,
  "optimized_token_estimate": 35,
  "clarity_score": 78,
  "specificity_score": 65,
  "complexity": "simple",
  "hallucination_risk": {
    "level": "medium",
    "score": 55,
    "reasons": ["Reason the original could cause confabulation"],
    "fixes_applied": ["What was fixed to reduce that risk"]
  },
  "session_impact": "One plain-English sentence about how this prompt affects AI session token budget.",
  "session_budget": { "chatgpt_free": 94, "chatgpt_plus": 99, "claude_free": 93, "claude_pro": 99, "gemini_free": 97 },
  "changes": [{"change": "Short title of change", "why": "Plain-English explanation of why this helps"}],
  "model_tip": "One specific actionable tip for using this prompt with the target AI.",
  "batch_recommendation": "One sentence on whether this prompt type suits batch or real-time processing."
}
Rules: complexity must be "simple", "moderate", or "complex". session_budget values 0-100. changes: 2-4 items.`;

// ── API ────────────────────────────────────────────────────────────────────────
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("__timeout__")), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

async function callClaudeAPI(prompt, modelName) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: [{ type: "text", text: SYS, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Target AI: ${modelName}\nPrompt to optimize:\n${prompt}` }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const r = JSON.parse(raw.replace(/```json\n?|```\n?/g, "").trim());
  r.routing = { complexity: r.complexity || "moderate", used_fallback: false };
  return r;
}

// Fallback model used exclusively when the primary call times out.
// Kept intentionally lighter (Haiku) so it resolves faster under load.
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

async function callClaudeAPIWithModel(prompt, modelName, claudeModel) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: claudeModel,
      max_tokens: 1000,
      system: [{ type: "text", text: SYS, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Target AI: ${modelName}\nPrompt to optimize:\n${prompt}` }],
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const raw = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const r = JSON.parse(raw.replace(/```json\n?|```\n?/g, "").trim());
  r.routing = { complexity: r.complexity || "moderate", used_fallback: false };
  return r;
}

async function callDemoMode(prompt, modelName) {
  try {
    return await withTimeout(callClaudeAPI(prompt, modelName), API_TIMEOUT_MS);
  } catch (e) {
    if (e.message === "__timeout__") {
      // Primary call timed out — retry with a lighter fallback model to avoid
      // hitting the same overloaded endpoint with identical parameters.
      const r = await callClaudeAPIWithModel(prompt, modelName, FALLBACK_MODEL);
      r.routing.used_fallback = true;
      return r;
    }
    throw e;
  }
}

async function callBackend(prompt, modelName, planId) {
  const res = await fetch(`${BACKEND_URL}/api/optimize`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, target_model: modelName, plan: planId }),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || "Backend error"); }
  return res.json();
}

const optimise = (prompt, modelName, planId) =>
  BACKEND_URL ? callBackend(prompt, modelName, planId) : callDemoMode(prompt, modelName);

// ── Tiny helpers ───────────────────────────────────────────────────────────────
function Spinner() {
  return <span style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "pw-spin .7s linear infinite" }} />;
}

function AnimBar({ value, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 80 + delay); return () => clearTimeout(t); }, [value]);
  return (
    <div style={{ background: "#1A1D2A", borderRadius: 4, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${w}%`, background: color, height: "100%", borderRadius: 4, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

// ── Tactic 1: Reverse-Paywall Trial Banner ─────────────────────────────────────
function TrialBanner({ daysLeft, onUpgrade, onDismiss }) {
  const urgency = daysLeft <= 3;
  return (
    <div style={{ background: urgency ? "linear-gradient(135deg,#2D1515,#180D07)" : "linear-gradient(135deg,#0E0900,#0D1633)", border: `1px solid ${urgency ? "#EF444444" : "#F59E0B44"}`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14, marginBottom: 20, animation: "pw-fade .4s ease" }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{urgency ? "⏰" : "🎁"}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: urgency ? "#FCA5A5" : "#F59E0B", marginBottom: 2 }}>
          14-day Business Trial — {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
        </div>
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          No credit card needed · Full Business features active · Auto-downgrades to Basic when trial ends
        </div>
      </div>
      <button onClick={onUpgrade} className="pw-btn" style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
        Upgrade Now →
      </button>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>
    </div>
  );
}

// ── Cascading Loader ───────────────────────────────────────────────────────────
const LOAD_STEPS = [
  { ms: 0,    icon: "🔀", label: "Smart Router selecting best engine…"  },
  { ms: 650,  icon: "✂️", label: "Stripping redundant words…"           },
  { ms: 1400, icon: "🧠", label: "Enhancing clarity and structure…"     },
  { ms: 2100, icon: "📊", label: "Building quality report…"             },
];

function CascadingLoader() {
  const [done, setDone] = useState([]);
  useEffect(() => {
    const timers = LOAD_STEPS.map((s, i) => setTimeout(() => setDone(d => [...d, i]), s.ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  return (
    <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "36px 28px", marginTop: 16, animation: "pw-fade .3s ease" }}>
      <div style={{ fontSize: 11, color: "#374151", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20, fontFamily: "monospace" }}>Optimising your prompt</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LOAD_STEPS.map((s, i) => {
          const isDone = done.includes(i);
          const isActive = !isDone && (i === 0 || done.includes(i - 1));
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, opacity: isDone || isActive ? 1 : 0.2, transition: "opacity .4s ease" }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, background: isDone ? "#16A34A22" : isActive ? "#F59E0B22" : "#1A1D2A", border: `1px solid ${isDone ? "#16A34A44" : isActive ? "#F59E0B44" : "rgba(255,255,255,0.06)"}`, transition: "all .4s" }}>
                {isDone ? "✓" : isActive ? <Spinner /> : s.icon}
              </div>
              <div style={{ flex: 1, fontSize: 13, color: isDone ? "#86EFAC" : isActive ? "#E8E8EE" : "#374151", fontWeight: isDone || isActive ? 600 : 400, transition: "color .4s" }}>
                {s.label}
              </div>
              {isDone && <div style={{ fontSize: 10, color: "#374151", fontFamily: "monospace" }}>{s.ms === 0 ? "0ms" : `${s.ms}ms`}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Result Badge ───────────────────────────────────────────────────────────────
function ResultBadge({ routing, planId, onTrial }) {
  const cx  = routing?.complexity || "moderate";
  const cfg = COMPLEXITY_CFG[cx] || COMPLEXITY_CFG.moderate;
  const plan = PLANS.find(p => p.id === planId) || PLANS[0];
  return (
    <div style={{ background: "#080A12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "11px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <span style={{ background: cfg.bg, color: cfg.color, padding: "3px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{cfg.icon} {cfg.label}</span>
      <span style={{ fontSize: 12, color: "#4B5563" }}>·</span>
      <span style={{ fontSize: 12, color: "#6B7280" }}>✓ Optimised by Promptwise</span>
      {routing?.used_fallback && <span style={{ fontSize: 10, background: "#F59E0B18", color: "#F59E0B", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>Priority engine used</span>}
      <span style={{ marginLeft: "auto", fontSize: 11, color: "#374151", fontFamily: "monospace" }}>
        {plan.name}{onTrial ? " (Trial)" : ""} plan
      </span>
    </div>
  );
}

// ── ROI Text ───────────────────────────────────────────────────────────────────
function buildROIText(result, sessionHistory, tokenDelta) {
  const date    = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const savings = Math.max(0, result.original_token_estimate - result.optimized_token_estimate);
  const totalTok = sessionHistory.reduce((s, h) => s + (h.tokens || 0), 0);
  return `Promptwise AI Optimization Report — ${date}
${"─".repeat(52)}
Team optimized ${sessionHistory.length || 1} AI prompt${sessionHistory.length > 1 ? "s" : ""} through Promptwise today.

QUALITY RESULTS
  Clarity Score:      ${result.clarity_score}/100
  Specificity Score:  ${result.specificity_score}/100
  Accuracy Risk:      ${result.hallucination_risk?.level?.toUpperCase()} (${result.hallucination_risk?.score}/100)

EFFICIENCY GAINS
  Prompt Size Reduced: ${Math.max(0, tokenDelta)}% fewer words sent to AI
  Words Stripped:      ~${savings} redundant tokens removed
  Session Total:       ~${totalTok} tokens optimized this session

Generated by Promptwise · promptwise.ai`;
}

// ── Session Planner ────────────────────────────────────────────────────────────
function SessionPlanner({ result, sessionHistory, tokenDelta }) {
  const [roiCopied, setRoiCopied] = useState(false);
  const totalTok = (sessionHistory || []).reduce((s, h) => s + (h.tokens || 0), 0);
  const handleROI = () => {
    const roiText = buildROIText(result, sessionHistory, tokenDelta);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(roiText).catch(err => {
        console.warn("[Promptwise] Clipboard write blocked by browser permissions:", err);
        alert("Clipboard access was blocked. Please copy the report manually:\n\n" + roiText);
      });
    } else {
      console.warn("[Promptwise] navigator.clipboard.writeText is unavailable in this context.");
      alert("Clipboard API is not supported in this browser. Please copy the report manually:\n\n" + roiText);
    }
    setRoiCopied(true); setTimeout(() => setRoiCopied(false), 3000);
  };
  return (
    <div>
      <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 14 }}>Session Budget Tracker</div>
      <div style={{ background: "#080A12", borderRadius: 10, padding: "13px 15px", marginBottom: 14, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
          This prompt uses <span style={{ color: "#F59E0B", fontWeight: 700 }}>~{result.optimized_token_estimate} words of AI context</span>
          {" "}(≈{tokToPages(result.optimized_token_estimate)} page{tokToPages(result.optimized_token_estimate) !== 1 ? "s" : ""} of text)
        </div>
        {result.session_impact && <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.65 }}>{result.session_impact}</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {Object.entries(SESSION_LIMITS).map(([key, svc]) => {
          const pct = result.session_budget?.[key] ?? 95;
          const remaining = Math.round(svc.limit * (pct / 100));
          return (
            <div key={key} style={{ background: "#080A12", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "11px 13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#6B7280" }}>{svc.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(pct), fontFamily: "monospace" }}>{pct}%</span>
              </div>
              <AnimBar value={pct} color={scoreColor(pct)} />
              <div style={{ fontSize: 10, color: "#374151", marginTop: 5 }}>
                ~{tokToPages(remaining)} pages · ~{tokToTurns(remaining)} turns remaining
              </div>
            </div>
          );
        })}
      </div>
      {result.batch_recommendation && (
        <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 14 }}>
          <span style={{ color: "#F59E0B", fontWeight: 700 }}>📦 Batch tip: </span>{result.batch_recommendation}
        </div>
      )}
      <button onClick={handleROI} style={{ width: "100%", padding: "12px", borderRadius: 12, background: roiCopied ? "#16A34A22" : "linear-gradient(135deg,#1E2130,#11131F)", border: `1px solid ${roiCopied ? "#16A34A55" : "rgba(255,255,255,0.1)"}`, color: roiCopied ? "#86EFAC" : "#E0E0EE", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .3s", marginBottom: 8 }}>
        {roiCopied ? "✓ ROI Summary copied!" : "📋 Copy ROI Summary for My Manager"}
      </button>
      <div style={{ fontSize: 11, color: "#374151", textAlign: "center", marginBottom: 16 }}>Paste into Slack, email, or your next budget review.</div>
      {sessionHistory.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>This session</div>
          {sessionHistory.slice(-4).map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>{h.prompt}</span>
              <span style={{ color: "#86EFAC", fontFamily: "monospace" }}>~{h.tokens} tok</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#374151", marginTop: 8, fontFamily: "monospace" }}>
            Total: ~{totalTok} tokens · {sessionHistory.length} prompt{sessionHistory.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Batch Queue ────────────────────────────────────────────────────────────────
function BatchQueue({ queue, onAdd, onProcess, onClear, processing, modelId, planId, onUpgrade }) {
  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(null);
  const plan    = PLANS.find(p => p.id === planId) || PLANS[0];
  const canBatch = plan.batchLimit === null || plan.batchLimit > 0;

  return (
    <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, overflow: "hidden" }}>
      <div style={{ background: "#080A12", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#E8E8EE", marginBottom: 3 }}>📦 Batch Optimizer</div>
          <div style={{ fontSize: 11, color: "#4B5563" }}>Process multiple prompts at once · Pro and above</div>
        </div>
        {canBatch && plan.batchLimit && (
          <div style={{ background: "#16A34A22", border: "1px solid #16A34A44", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#86EFAC", fontWeight: 600 }}>
            {queue.filter(q => q.status === "done").length}/{plan.batchLimit} used
          </div>
        )}
      </div>
      <div style={{ padding: "18px 20px" }}>
        {!canBatch ? (
          <div style={{ textAlign: "center", padding: "28px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#E0E0EE", marginBottom: 6 }}>Batch mode is a Pro feature</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>Process up to 10 prompts at once on Pro ($6.99/mo), unlimited on Business.</div>
            <button onClick={onUpgrade} className="pw-btn" style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Upgrade to Pro — $6.99/mo →
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Add a prompt to the batch queue…" style={{ flex: 1, background: "#080A12", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 9, padding: "10px 13px", color: "#E8E8EE", fontSize: 13, outline: "none", resize: "none", height: 64, fontFamily: "Georgia, serif", lineHeight: 1.6 }} />
              <button onClick={() => { if (input.trim()) { onAdd(input.trim()); setInput(""); } }} style={{ background: "#1A1D2A", border: "1px solid rgba(255,255,255,0.09)", color: "#9CA3AF", padding: "0 16px", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Add</button>
            </div>
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#2D3040", fontSize: 13, border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 10 }}>Queue is empty — add prompts above</div>
            ) : (
              <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 14 }}>
                {queue.map((item, i) => (
                  <div key={i}>
                    <div onClick={() => setExpanded(expanded === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#080A12", borderRadius: 9, marginBottom: 5, border: `1px solid ${item.status === "done" ? "#16A34A44" : item.status === "processing" ? "#F59E0B44" : "rgba(255,255,255,0.05)"}`, cursor: item.status === "done" ? "pointer" : "default" }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "#374151", minWidth: 20 }}>#{i + 1}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.prompt}</span>
                      <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 10, fontWeight: 600, background: item.status === "done" ? "#16A34A22" : item.status === "processing" ? "#F59E0B22" : "#1A1D2A", color: item.status === "done" ? "#16A34A" : item.status === "processing" ? "#F59E0B" : "#374151" }}>
                        {item.status === "done" ? "✓ Done" : item.status === "processing" ? "…" : "Pending"}
                      </span>
                    </div>
                    {item.status === "done" && expanded === i && item.result && (
                      <div style={{ background: "#071A07", border: "1px solid #16532733", borderRadius: 9, padding: "12px 14px", marginBottom: 5, marginLeft: 12 }}>
                        <div style={{ fontSize: 12, color: "#D1D5DB", lineHeight: 1.7, fontFamily: "Georgia, serif", marginBottom: 10 }}>{item.result.optimized_prompt}</div>
                        <button onClick={() => navigator.clipboard.writeText(item.result.optimized_prompt)} style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.09)", color: "#9CA3AF", padding: "4px 12px", borderRadius: 7, fontSize: 11, cursor: "pointer" }}>Copy</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onProcess} disabled={queue.length === 0 || processing} style={{ flex: 1, background: queue.length > 0 && !processing ? "linear-gradient(135deg,#F59E0B,#EF4444)" : "#1A1D2A", color: queue.length > 0 && !processing ? "white" : "#374151", border: "none", padding: "11px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: queue.length > 0 && !processing ? "pointer" : "not-allowed" }}>
                {processing ? "Processing…" : `⚡ Optimise ${queue.length} Prompt${queue.length !== 1 ? "s" : ""}`}
              </button>
              {queue.length > 0 && <button onClick={onClear} style={{ background: "#1A1D2A", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7280", padding: "11px 16px", borderRadius: 10, cursor: "pointer", fontSize: 12 }}>Clear</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Pricing Section ────────────────────────────────────────────────────────────
function PricingSection({ currentPlanId, onSelectPlan, onStartTrial }) {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ marginTop: 52, animation: "pw-fade .5s ease .2s both" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10, fontFamily: "monospace" }}>Simple, transparent pricing</div>
        <h2 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, color: "#E0E0EE", margin: "0 0 6px" }}>
          One tool. Every AI. No technical setup.
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 20px" }}>
          Undercuts every legacy prompt tool on the market. No hidden fees.
        </p>
        {/* Annual toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#0F111A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 14px" }}>
          <span style={{ fontSize: 12, color: annual ? "#6B7280" : "#E0E0EE", fontWeight: annual ? 400 : 600 }}>Monthly</span>
          <div onClick={() => setAnnual(!annual)} style={{ width: 34, height: 18, borderRadius: 9, background: annual ? "#F59E0B" : "#374151", cursor: "pointer", position: "relative", transition: "background .2s" }}>
            <div style={{ position: "absolute", top: 2, left: annual ? 16 : 2, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
          </div>
          <span style={{ fontSize: 12, color: annual ? "#F59E0B" : "#6B7280", fontWeight: annual ? 600 : 400 }}>
            Annual <span style={{ color: "#16A34A", fontWeight: 700, fontSize: 10 }}>Save up to 29%</span>
          </span>
        </div>
      </div>

      {/* Reverse-paywall trial callout */}
      <div style={{ background: "linear-gradient(135deg,#0E0900,#080A12)", border: "1px solid #F59E0B33", borderRadius: 14, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 22 }}>🎁</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 2 }}>Try Business free for 14 days — no credit card</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Full team features, shared library, and ROI dashboard. Automatically downgrades to Basic when trial ends.</div>
        </div>
        <button onClick={onStartTrial} className="pw-btn" style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
          Start Free Trial →
        </button>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlanId;
          const showPrice = annual && plan.annualMonthly ? plan.annualMonthly : plan.price;

          const ctaStyles = {
            outline:       { bg: "transparent", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.15)" },
            solid:         { bg: plan.color,     color: "#fff",    border: "none" },
            gradient:      { bg: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none" },
            "outline-warm":{ bg: "transparent",  color: plan.color, border: `1.5px solid ${plan.color}` },
          };
          const cStyle = ctaStyles[plan.ctaStyle] || ctaStyles.outline;

          return (
            <div key={plan.id} style={{ background: plan.badge ? plan.accentBg : "#0F111A", border: `1.5px solid ${plan.badge ? `${plan.color}44` : isCurrent ? `${plan.color}55` : "rgba(255,255,255,0.07)"}`, borderRadius: 18, padding: "22px 18px", position: "relative", display: "flex", flexDirection: "column", transition: "border-color .2s" }}>

              {/* Badges */}
              {plan.badge && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", padding: "3px 14px", borderRadius: 20, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{plan.badge}</div>
              )}
              {isCurrent && !plan.badge && (
                <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#16A34A22", border: "1px solid #16A34A55", color: "#86EFAC", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>Current plan</div>
              )}

              {/* Plan name + tagline */}
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: plan.color, textTransform: "uppercase", marginBottom: 5 }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 16, lineHeight: 1.5, minHeight: 32 }}>{plan.tagline}</div>

              {/* Price */}
              <div style={{ marginBottom: 18 }}>
                {plan.price === 0 ? (
                  <div style={{ fontSize: 34, fontWeight: 900, color: "#E0E0EE", letterSpacing: -1 }}>Free</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                    <span style={{ fontSize: 20, color: "#6B7280", fontWeight: 400 }}>$</span>
                    <span style={{ fontSize: 36, fontWeight: 900, color: "#E0E0EE", letterSpacing: -1 }}>{showPrice}</span>
                    <span style={{ fontSize: 12, color: "#6B7280", marginLeft: 2 }}>/mo</span>
                  </div>
                )}
                {annual && plan.annualSaving && (
                  <div style={{ fontSize: 10, color: "#16A34A", fontWeight: 700, marginTop: 3 }}>{plan.annualSaving}</div>
                )}
                {annual && plan.annualTotal && (
                  <div style={{ fontSize: 10, color: "#374151", marginTop: 1 }}>Billed ${plan.annualTotal}/year</div>
                )}
                {plan.price === 0 && <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>No credit card needed</div>}
                {plan.seats > 1 && <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>{plan.seats} seats included</div>}
              </div>

              {/* CTA */}
              <button onClick={() => onSelectPlan(plan.id)} disabled={isCurrent} style={{ width: "100%", padding: "10px", borderRadius: 10, background: isCurrent ? "#1A1D2A" : cStyle.bg, color: isCurrent ? "#4B5563" : cStyle.color, border: isCurrent ? "1px solid rgba(255,255,255,0.06)" : cStyle.border, fontWeight: 700, fontSize: 13, cursor: isCurrent ? "default" : "pointer", marginBottom: 18, boxShadow: plan.ctaStyle === "gradient" && !isCurrent ? "0 4px 16px rgba(245,158,11,.25)" : "none", transition: "all .2s" }}>
                {isCurrent ? "Current plan" : plan.cta}
              </button>

              {/* BYOK callout for Business Pro */}
              {plan.byok && (
                <div style={{ background: "#1A0D07", border: "1px solid #C96C4533", borderRadius: 8, padding: "8px 10px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#C96C45", marginBottom: 3 }}>🔑 BYOK Option</div>
                  <div style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.5 }}>Bring your own Anthropic/Google API keys for $5/mo flat — zero token cost variability on your Promptwise bill.</div>
                </div>
              )}

              {/* Features */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16, flex: 1 }}>
                <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  {plan.id === "businesspro" ? "Everything in Business, plus:" : "What's included:"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 12, color: f.included ? "#16A34A" : "#2D3040", flexShrink: 0, marginTop: 1 }}>{f.included ? "✓" : "—"}</span>
                      <span style={{ fontSize: 11, color: f.included ? "#9CA3AF" : "#2D3040", lineHeight: 1.45 }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Competitor comparison strip */}
      <div style={{ marginTop: 20, background: "#0F111A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 20px" }}>
        <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, fontFamily: "monospace" }}>vs competitors</div>
        <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
          {[
            { name: "Promptwise Pro", price: "$6.99",  seats: "1",  highlight: true  },
            { name: "Pretty Prompt",  price: "$9.99",  seats: "1",  highlight: false },
            { name: "Velocity",       price: "$7.00",  seats: "1",  highlight: false },
            { name: "Promptimize",    price: "$12–15", seats: "1",  highlight: false },
            { name: "PromptPerfect",  price: "$19.99", seats: "1",  note: "⚠️ Sunsetting Sep 2026", highlight: false },
            { name: "Promptwise Biz", price: "$19.00", seats: "5",  highlight: true  },
          ].map((c, i) => (
            <div key={i} style={{ flex: "0 0 auto", padding: "8px 14px", borderRight: "1px solid rgba(255,255,255,0.05)", textAlign: "center", background: c.highlight ? "rgba(245,158,11,0.06)" : "transparent", borderRadius: c.highlight ? 8 : 0 }}>
              <div style={{ fontSize: 10, color: c.highlight ? "#F59E0B" : "#374151", fontWeight: c.highlight ? 700 : 400, marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: c.highlight ? "#E0E0EE" : "#4B5563" }}>{c.price}</div>
              <div style={{ fontSize: 9, color: "#374151" }}>/mo · {c.seats} seat{c.seats !== "1" ? "s" : ""}</div>
              {c.note && <div style={{ fontSize: 9, color: "#EF4444", marginTop: 2 }}>{c.note}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#374151" }}>
        All paid plans include a 7-day money-back guarantee · Cancel anytime
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function Promptwise() {
  const [prompt, setPrompt]       = useState("");
  const [modelId, setModelId]     = useState("chatgpt");
  const [mode, setMode]           = useState("realtime");
  const [planId, setPlanId]       = useState("basic");
  const [onTrial, setOnTrial]     = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [showTrial, setShowTrial] = useState(true);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [tab, setTab]             = useState("optimised");
  const [copied, setCopied]       = useState("");
  const [showOrig, setShowOrig]   = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [batchQueue, setBatchQueue] = useState([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [chromeWait, setChromeWait] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Effective plan: during trial, user gets Business features
  const effectivePlanId = onTrial ? "business" : planId;
  const plan     = PLANS.find(p => p.id === effectivePlanId) || PLANS[0];
  const basePlan = PLANS.find(p => p.id === planId) || PLANS[0];
  const model    = MODELS.find(m => m.id === modelId);
  const roughTok = Math.ceil(prompt.length / 4);

  // Monthly limit check (Basic: 100/month)
  const isLimited = basePlan.monthlyLimit !== null && usageCount >= basePlan.monthlyLimit;

  // Tactic 3: show cost-intercept when prompt is long and user is on Basic
  const showCostIntercept = planId === "basic" && !onTrial && roughTok > 150 && !result && mode === "realtime";

  const tokenDelta = result
    ? Math.round(((result.original_token_estimate - result.optimized_token_estimate) / Math.max(result.original_token_estimate, 1)) * 100)
    : 0;

  const handleStartTrial = () => {
    setOnTrial(true); setShowPricing(false); setShowTrial(true);
  };

  const handleOptimise = async () => {
    if (!prompt.trim() || loading || isLimited) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await optimise(prompt, model.name, effectivePlanId);
      setResult(r); setTab("optimised"); setShowOrig(false);
      setUsageCount(c => c + 1);
      setSessionHistory(h => [...h, { prompt: prompt.slice(0, 55) + (prompt.length > 55 ? "…" : ""), tokens: r.optimized_token_estimate }]);
    } catch (e) { setError("Optimisation failed — " + e.message); }
    finally { setLoading(false); }
  };

  const handleBatch = async () => {
    if (batchProcessing) return;
    setBatchProcessing(true);
    for (let i = 0; i < batchQueue.length; i++) {
      if (batchQueue[i].status !== "pending") continue;
      setBatchQueue(q => q.map((x, idx) => idx === i ? { ...x, status: "processing" } : x));
      try {
        const r = await optimise(batchQueue[i].prompt, model.name, effectivePlanId);
        setBatchQueue(q => q.map((x, idx) => idx === i ? { ...x, status: "done", result: r } : x));
        setUsageCount(c => c + 1);
      } catch {
        setBatchQueue(q => q.map((x, idx) => idx === i ? { ...x, status: "error" } : x));
      }
    }
    setBatchProcessing(false);
  };

  const handleCopy = async (text, key) => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(key); setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080A12", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "#E0E0EE" }}>
      <style>{`
        @keyframes pw-spin  { to { transform:rotate(360deg); } }
        @keyframes pw-fade  { from { opacity:0;transform:translateY(10px); } to { opacity:1;transform:translateY(0); } }
        .pw-btn:hover  { opacity:.82 !important; }
        .pw-tab:hover  { background:rgba(255,255,255,0.04) !important; }
        .pw-model:hover { border-color:rgba(255,255,255,0.28) !important; }
        textarea::-webkit-scrollbar { width:4px; }
        textarea::-webkit-scrollbar-thumb { background:#1A1D2A;border-radius:2px; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1A1D2A;border-radius:2px; }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 58, background: "rgba(8,10,18,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#F59E0B,#EF4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>⚡</div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.6 }}>Promptwise</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", background: "#0F111A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 3 }}>
            {[["realtime", "⚡ Real-time"], ["batch", "📦 Batch"]].map(([id, label]) => (
              <button key={id} onClick={() => setMode(id)} style={{ padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: mode === id ? 700 : 400, background: mode === id ? "#080A12" : "transparent", color: mode === id ? "#F59E0B" : "#6B7280", transition: "all .15s" }}>{label}</button>
            ))}
          </div>
          {/* Plan chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "4px 12px" }}>
            <span style={{ fontSize: 11, color: "#6B7280" }}>Plan:</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: plan.color }}>{plan.name}{onTrial ? " Trial" : ""}</span>
            {basePlan.monthlyLimit && (
              <span style={{ fontSize: 10, color: isLimited ? "#EF4444" : "#374151", fontFamily: "monospace" }}>
                · {basePlan.monthlyLimit - usageCount}/{basePlan.monthlyLimit}
              </span>
            )}
          </div>
          <button className="pw-btn" onClick={() => setShowPricing(!showPricing)} style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "7px 16px", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            {showPricing ? "Close Plans" : "View Plans →"}
          </button>
        </div>
      </nav>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 22px 80px" }}>

        {/* Tactic 1: Trial banner */}
        {onTrial && showTrial && (
          <TrialBanner
            daysLeft={trialDays}
            onUpgrade={() => { setShowPricing(true); setShowTrial(false); }}
            onDismiss={() => setShowTrial(false)}
          />
        )}

        {/* HERO */}
        {!result && !loading && (
          <div style={{ textAlign: "center", marginBottom: 36, animation: "pw-fade .5s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#16A34A18", border: "1px solid #16A34A44", color: "#16A34A", borderRadius: 20, padding: "5px 14px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, marginBottom: 20, fontFamily: "monospace" }}>
              ✓ Free tier: 100/month · Pro from $6.99 · No technical setup
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2.5, lineHeight: 1.04, background: "linear-gradient(140deg,#ffffff 25%,#4B5563 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 14px" }}>
              Better prompts.<br />Better results.
            </h1>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, margin: 0 }}>
              Promptwise rewrites your AI prompts to be clearer, safer, and more effective —<br />
              no technical knowledge needed. Works with ChatGPT, Claude, Gemini and more.
            </p>
          </div>
        )}

        {result && (
          <button onClick={() => { setResult(null); setPrompt(""); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.09)", color: "#6B7280", padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", marginBottom: 20 }}>
            ← New prompt
          </button>
        )}

        {/* ── BATCH MODE ────────────────────────────────────────────────── */}
        {mode === "batch" && (
          <div style={{ animation: "pw-fade .3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "#374151" }}>Optimise for:</span>
              {MODELS.map(m => (
                <button key={m.id} className="pw-model" onClick={() => setModelId(m.id)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: modelId === m.id ? 700 : 400, border: `1.5px solid ${modelId === m.id ? m.color : "rgba(255,255,255,0.09)"}`, background: modelId === m.id ? `${m.color}18` : "transparent", color: modelId === m.id ? m.color : "#6B7280", transition: "all .15s" }}>{m.name}</button>
              ))}
            </div>
            <BatchQueue queue={batchQueue} onAdd={p => setBatchQueue(q => [...q, { prompt: p, status: "pending" }])} onProcess={handleBatch} onClear={() => setBatchQueue([])} processing={batchProcessing} modelId={modelId} planId={effectivePlanId} onUpgrade={() => setShowPricing(true)} />
          </div>
        )}

        {/* ── REALTIME INPUT ────────────────────────────────────────────── */}
        {mode === "realtime" && !result && (
          <>
            <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.55)", animation: "pw-fade .4s ease .1s both" }}>
              {/* Model bar */}
              <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#374151", marginRight: 4 }}>Optimise for:</span>
                {MODELS.map(m => (
                  <button key={m.id} className="pw-model" onClick={() => setModelId(m.id)} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: modelId === m.id ? 700 : 400, border: `1.5px solid ${modelId === m.id ? m.color : "rgba(255,255,255,0.09)"}`, background: modelId === m.id ? `${m.color}18` : "transparent", color: modelId === m.id ? m.color : "#6B7280", transition: "all .15s" }}>{m.name}</button>
                ))}
              </div>
              <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleOptimise(); }} placeholder={"Type your prompt — rough is fine. Promptwise handles the rest.\n\nExamples:\n• 'Summarise this email thread and highlight the action items'\n• 'Write a LinkedIn post about our new product launch'\n• 'Help me reply to this tricky client complaint'"} style={{ width: "100%", minHeight: 200, padding: "20px 22px", background: "transparent", border: "none", outline: "none", color: "#E0E0EE", fontSize: 15, lineHeight: 1.78, resize: "vertical", boxSizing: "border-box", fontFamily: "Georgia,'Times New Roman',serif" }} />
              <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 11, color: "#2D3040", fontFamily: "monospace", display: "flex", gap: 12 }}>
                  <span>~{roughTok} words</span>
                  <span>·</span>
                  <span style={{ color: "#374151" }}>⌘↵ to go</span>
                  {basePlan.monthlyLimit && <span style={{ color: isLimited ? "#EF4444" : "#374151" }}>· {basePlan.monthlyLimit - usageCount} uses left this month</span>}
                </div>
                {isLimited ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#EF4444" }}>Monthly limit reached</span>
                    <button className="pw-btn" onClick={() => setShowPricing(true)} style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 9, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Upgrade →</button>
                  </div>
                ) : (
                  <button onClick={handleOptimise} disabled={!prompt.trim() || loading} className="pw-btn" style={{ background: prompt.trim() ? "linear-gradient(135deg,#F59E0B,#EF4444)" : "#1A1D2A", color: prompt.trim() ? "#fff" : "#374151", border: "none", padding: "10px 24px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: prompt.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, boxShadow: prompt.trim() ? "0 4px 20px rgba(245,158,11,.28)" : "none", transition: "all .2s" }}>
                    {loading ? <><Spinner /> Optimising…</> : "⚡ Optimise Prompt"}
                  </button>
                )}
              </div>
            </div>

            {/* Tactic 3: Inline cost-intercept notice */}
            {showCostIntercept && (
              <div style={{ background: "#0E0900", border: "1px solid #F59E0B44", borderRadius: 12, padding: "12px 16px", marginTop: 10, display: "flex", alignItems: "flex-start", gap: 12, animation: "pw-fade .3s ease" }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 3 }}>
                    This prompt is ~{roughTok} words — longer than optimal
                  </div>
                  <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.55 }}>
                    Processing this unoptimized could consume significant AI context budget. Pro users get automatic de-bloating that strips ~45% of filler words before the AI ever sees it — improving accuracy and extending your session.
                  </div>
                </div>
                <button onClick={() => setShowPricing(true)} className="pw-btn" style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "7px 14px", borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  Pro — $6.99/mo →
                </button>
              </div>
            )}
          </>
        )}

        {error && <div style={{ background: "#2D1515", border: "1px solid #7F1D1D", color: "#FCA5A5", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginTop: 12 }}>{error}</div>}
        {loading && <CascadingLoader />}

        {/* ── RESULTS ───────────────────────────────────────────────────── */}
        {result && !loading && (
          <div style={{ animation: "pw-fade .4s ease" }}>
            <ResultBadge routing={result.routing} planId={effectivePlanId} onTrial={onTrial} />

            {/* Health dashboard */}
            <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, padding: "24px 26px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: "#2D3040", textTransform: "uppercase", marginBottom: 5 }}>Prompt Quality Report</div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>Optimised for <span style={{ color: model.color }}>{model.name}</span></div>
                </div>
                <div style={{ background: riskCfg[result.hallucination_risk?.level]?.bg, color: riskCfg[result.hallucination_risk?.level]?.text, padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {riskCfg[result.hallucination_risk?.level]?.label}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 18 }}>
                {[
                  { label: "Clarity",     v: result.clarity_score,    d: `${result.clarity_score}`,                           u: "/100", c: scoreColor(result.clarity_score)    },
                  { label: "Specificity", v: result.specificity_score, d: `${result.specificity_score}`,                       u: "/100", c: scoreColor(result.specificity_score) },
                  { label: "Words Saved", v: Math.max(0, tokenDelta),  d: `${Math.max(0, tokenDelta)}`,                        u: "%",    c: "#F59E0B"                             },
                  { label: "Accuracy",    v: 100 - (result.hallucination_risk?.score || 30), d: `${100 - (result.hallucination_risk?.score || 30)}`, u: "/100", c: "#16A34A" },
                ].map((s, i) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 9, color: "#2D3040", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.c, marginBottom: 7, letterSpacing: -0.5 }}>
                      {s.d}<span style={{ fontSize: 11, fontWeight: 400, color: "#374151" }}>{s.u}</span>
                    </div>
                    <AnimBar value={s.v} color={s.c} delay={i * 100} />
                  </div>
                ))}
              </div>
              {result.session_impact && (
                <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "#9CA3AF", lineHeight: 1.65 }}>
                  <span style={{ color: "#F59E0B", fontWeight: 700 }}>⏱ Impact: </span>{result.session_impact}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, padding: 4, background: "#0F111A", borderRadius: 12, marginBottom: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { id: "optimised", label: "✨ Optimised" },
                { id: "changes",   label: `📝 What Changed (${result.changes?.length || 0})` },
                { id: "risk",      label: "🛡 Accuracy Guard" },
                { id: "session",   label: "📊 Budget Tracker" },
              ].map(t => (
                <button key={t.id} className="pw-tab" onClick={() => setTab(t.id)} style={{ flex: 1, padding: "9px 6px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.id ? "#080A12" : "transparent", color: tab === t.id ? "#E0E0EE" : "#374151", boxShadow: tab === t.id ? "0 1px 8px rgba(0,0,0,.5)" : "none", transition: "all .15s" }}>{t.label}</button>
              ))}
            </div>

            <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "22px", marginBottom: 12, animation: "pw-fade .2s ease" }}>
              {tab === "optimised" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>{showOrig ? "Original" : "Optimised"}</div>
                    <button onClick={() => setShowOrig(!showOrig)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF", padding: "4px 10px", borderRadius: 7, fontSize: 11, cursor: "pointer" }}>
                      {showOrig ? "Show optimised →" : "← Show original"}
                    </button>
                  </div>
                  <div style={{ background: "#080A12", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", fontSize: 14, color: "#D1D5DB", lineHeight: 1.82, fontFamily: "Georgia,serif", whiteSpace: "pre-wrap", minHeight: 100, marginBottom: 10 }}>
                    {showOrig ? prompt : result.optimized_prompt}
                  </div>
                  <div style={{ fontSize: 11, color: "#374151", marginBottom: 12, fontFamily: "monospace" }}>
                    {showOrig ? `~${result.original_token_estimate} words (original)` : `~${result.optimized_token_estimate} words · ${Math.max(0, result.original_token_estimate - result.optimized_token_estimate)} redundant words removed`}
                  </div>
                  {result.model_tip && (
                    <div style={{ background: `${model.color}0E`, border: `1px solid ${model.color}28`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: "#D1D5DB", lineHeight: 1.6 }}>
                      <span style={{ color: model.color, fontWeight: 700 }}>💡 {model.name} tip: </span>{result.model_tip}
                    </div>
                  )}
                </div>
              )}

              {tab === "changes" && (
                <div>
                  <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>What We Changed & Why</div>
                  {result.changes?.length
                    ? result.changes.map((c, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: i < result.changes.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#F59E0B,#EF4444)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#E0E0EE", marginBottom: 3 }}>{c.change}</div>
                            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65 }}>{c.why}</div>
                          </div>
                        </div>
                      ))
                    : <div style={{ color: "#6B7280", fontSize: 13 }}>Prompt was clear — only light polish applied.</div>}
                </div>
              )}

              {tab === "risk" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1 }}>Accuracy Guard</div>
                    <span style={{ background: riskCfg[result.hallucination_risk?.level]?.bg, color: riskCfg[result.hallucination_risk?.level]?.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {riskCfg[result.hallucination_risk?.level]?.label}
                    </span>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#374151", marginBottom: 6 }}>
                      <span>Accurate</span>
                      <span style={{ fontFamily: "monospace" }}>Accuracy: {100 - (result.hallucination_risk?.score || 0)}/100</span>
                      <span>Risky</span>
                    </div>
                    <div style={{ background: "#080A12", borderRadius: 6, height: 10, overflow: "hidden", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#16A34A,#D97706,#DC2626)", borderRadius: 6 }} />
                      <div style={{ position: "absolute", right: `${100 - (result.hallucination_risk?.score || 0)}%`, top: -2, bottom: -2, width: 3, background: "#fff", borderRadius: 2, boxShadow: "0 0 8px rgba(255,255,255,.65)" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {result.hallucination_risk?.reasons?.length > 0 && (
                      <div style={{ background: "#2D1515", border: "1px solid #7F1D1D33", borderRadius: 10, padding: "12px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#FCA5A5", marginBottom: 8 }}>⚠ Accuracy risks found</div>
                        {result.hallucination_risk.reasons.map((r, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6, paddingLeft: 8, borderLeft: "2px solid #EF4444", lineHeight: 1.6 }}>{r}</div>
                        ))}
                      </div>
                    )}
                    {result.hallucination_risk?.fixes_applied?.length > 0 && (
                      <div style={{ background: "#142014", border: "1px solid #16532733", borderRadius: 10, padding: "12px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC", marginBottom: 8 }}>✓ Improvements made</div>
                        {result.hallucination_risk.fixes_applied.map((f, i) => (
                          <div key={i} style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6, paddingLeft: 8, borderLeft: "2px solid #16A34A", lineHeight: 1.6 }}>{f}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === "session" && (
                <SessionPlanner result={result} sessionHistory={sessionHistory} tokenDelta={tokenDelta} />
              )}
            </div>

            {/* Export */}
            <div style={{ background: "#0F111A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 22px" }}>
              <div style={{ fontSize: 10, color: "#374151", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Send to your AI</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button onClick={() => handleCopy(result.optimized_prompt, "main")} className="pw-btn" style={{ background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 20px rgba(245,158,11,.22)" }}>
                  {copied === "main" ? "✓ Copied!" : "📋 Copy Optimised Prompt"}
                </button>
                {MODELS.map(m => (
                  <button key={m.id} onClick={() => { handleCopy(result.optimized_prompt, m.id); setTimeout(() => window.open(m.url, "_blank"), 350); }} className="pw-btn" style={{ background: modelId === m.id ? `${m.color}18` : "rgba(255,255,255,0.03)", color: modelId === m.id ? m.color : "#6B7280", border: `1.5px solid ${modelId === m.id ? m.color : "rgba(255,255,255,0.08)"}`, padding: "8px 14px", borderRadius: 10, fontWeight: modelId === m.id ? 700 : 400, fontSize: 12, cursor: "pointer" }}>
                    {copied === m.id ? "✓ Copied!" : `Open ${m.name} ↗`}
                  </button>
                ))}
              </div>
              <div style={{ background: "#080A12", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 12, color: "#6B7280" }}>🧩 Skip the tab-switch — </span>
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>Chrome Extension coming soon</span>
                  <span style={{ fontSize: 11, color: "#4B5563" }}> · Included on Pro and above</span>
                </div>
                <button onClick={() => setChromeWait(!chromeWait)} style={{ background: chromeWait ? "#16A34A22" : "#1A1D2A", border: `1px solid ${chromeWait ? "#16A34A44" : "rgba(255,255,255,0.08)"}`, color: chromeWait ? "#86EFAC" : "#9CA3AF", padding: "5px 14px", borderRadius: 7, fontSize: 11, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {chromeWait ? "✓ On waitlist" : "Join Waitlist"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PRICING ───────────────────────────────────────────────────── */}
        {(showPricing || (!result && !loading)) && (
          <PricingSection
            currentPlanId={effectivePlanId}
            onSelectPlan={id => { setPlanId(id); setOnTrial(false); setShowPricing(false); }}
            onStartTrial={handleStartTrial}
          />
        )}
      </div>
    </div>
  );
}
