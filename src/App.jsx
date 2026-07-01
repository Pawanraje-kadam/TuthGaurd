import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const THEME = {
  accent:    "#00FF9D",
  secondary: "#7B2FFF",
  error:     "#FF3B3B",
  warning:   "#F59E0B",
  info:      "#00C8FF",
  bg:        "#020205",
  glass:     "rgba(10,10,20,0.75)",
  fontMain:  "'Space Grotesk', sans-serif",
  fontMono:  "'JetBrains Mono', monospace",
};

const EXAMPLE_CATEGORIES = [
  { label: "🌍 NEWS",    color: "#00C8FF", items: ["Did OpenAI release GPT-5?", "Is Elon Musk the richest person in the world?"] },
  { label: "🔬 SCIENCE", color: "#00FF9D", items: ["Do humans share approximately 60% of their DNA with bananas?"] },
  { label: "🌐 WORLD",   color: "#7B2FFF", items: ["Is India the most populous country in 2024?", "Did Apple release Vision Pro?"] },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 640 : false);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

// ─── QUANTUM BACKGROUND ──────────────────────────────────────────────────────
function QuantumBackground() {
  const canvasRef = useRef(null);
  const mouseRef  = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    mouseRef.current.x = mouseRef.current.targetX = W / 2;
    mouseRef.current.y = mouseRef.current.targetY = H / 2;
    const particles = Array.from({ length: 160 }, () => ({
      x: Math.random() * W, y: Math.random() * H, z: Math.random() * 1000,
      size: 1 + Math.random() * 2,
      color: Math.random() > 0.5 ? THEME.accent : THEME.secondary,
      speed: 0.8 + Math.random() * 1.5,
    }));
    const onMove = (e) => { mouseRef.current.targetX = e.clientX; mouseRef.current.targetY = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive: true });
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize, { passive: true });
    let raf;
    const draw = () => {
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;
      ctx.fillStyle = THEME.bg;
      ctx.fillRect(0, 0, W, H);
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      particles.forEach(p => {
        p.z -= p.speed;
        if (p.z <= 1) p.z = 1000;
        const k = 400 / p.z;
        const px = (p.x - W / 2) * k + W / 2;
        const py = (p.y - H / 2) * k + H / 2;
        const dx = mx - px, dy = my - py;
        const distSq = dx * dx + dy * dy, maxDist = 200;
        let fx = px, fy = py;
        if (distSq < maxDist * maxDist) {
          const d = Math.sqrt(distSq), force = (maxDist - d) / maxDist;
          fx -= (dx / d) * force * 40; fy -= (dy / d) * force * 40;
        }
        ctx.beginPath();
        const r = p.size * k * 0.5;
        ctx.arc(fx, fy, r < 0.1 ? 0.1 : r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(1, 1.2 - p.z / 1000);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ─── PERSPECTIVE WRAPPER ─────────────────────────────────────────────────────
function PerspectiveWrapper({ children }) {
  const ref = useRef(null);
  const ms  = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const raf = useRef(null);
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isMobile) return;
    const tick = () => {
      ms.current.x += (ms.current.tx - ms.current.x) * 0.1;
      ms.current.y += (ms.current.ty - ms.current.y) * 0.1;
      if (ref.current) ref.current.style.transform = `perspective(2000px) rotateY(${ms.current.x * 3}deg) rotateX(${-ms.current.y * 3}deg)`;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [isMobile]);
  const onMove  = (e) => { ms.current.tx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2); ms.current.ty = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2); };
  const onLeave = () => { ms.current.tx = 0; ms.current.ty = 0; };
  return (
    <div onMouseMove={onMove} onMouseLeave={onLeave} style={{ width: "100%", position: "relative" }}>
      <div ref={ref} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>{children}</div>
    </div>
  );
}

// ─── TYPEWRITER ──────────────────────────────────────────────────────────────
function Typewriter({ text, speed = 12 }) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setOut(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => { i++; setOut(text.slice(0, i)); if (i >= text.length) { clearInterval(iv); setDone(true); } }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{out}{!done && <span style={{ color: THEME.accent, animation: "blink 0.7s infinite" }}>█</span>}</span>;
}

// ─── CONFIDENCE METER ────────────────────────────────────────────────────────
function ConfidenceMeter({ level }) {
  const map = { High: { pct: 92, color: THEME.accent }, Medium: { pct: 55, color: THEME.warning }, Low: { pct: 18, color: THEME.error } };
  const { pct, color } = map[level] || map.Low;
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 200); return () => clearTimeout(t); }, [pct]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "12px", color: "#bbb", letterSpacing: "0.2em", fontFamily: THEME.fontMono, fontWeight: 700 }}>CONFIDENCE</span>
        <span style={{ fontSize: "13px", color, fontWeight: 800, fontFamily: THEME.fontMono }}>{level.toUpperCase()}</span>
      </div>
      <div style={{ background: "#0a0a14", borderRadius: "99px", height: "6px", overflow: "hidden", border: "1px solid #1a1a2e" }}>
        <div style={{ width: `${w}%`, height: "100%", borderRadius: "99px", background: `linear-gradient(90deg,${color}88,${color})`, boxShadow: `0 0 10px ${color},0 0 20px ${color}44`, transition: "width 1.4s cubic-bezier(0.25,1,0.5,1)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)", animation: "shimmer 2s linear infinite" }} />
        </div>
      </div>
    </div>
  );
}

// ─── SOURCE CARD ─────────────────────────────────────────────────────────────
function SourceCard({ source, delay }) {
  const colors = { TIER1: THEME.accent, TIER2: THEME.info, TIER3: "#A78BFA", OFFICIAL: THEME.warning, UNTRUSTED: "#333" };
  const color  = colors[source.tier] || "#333";
  if (source.tier === "UNTRUSTED") return null;
  const tierDesc = { TIER1: "Highest credibility (Reuters, AP, BBC)", TIER2: "High credibility (Bloomberg, NYT, Guardian)", TIER3: "Good credibility (CNN, NPR, NBC)", OFFICIAL: "Official source (.gov, WHO, UN, CDC)" };
  return (
    <div style={{ padding: "14px 16px", background: `${color}08`, border: `1px solid ${color}28`, borderRadius: "12px", animation: "floatIn 0.5s ease forwards", animationDelay: `${delay}s`, opacity: 0, transition: "border-color 0.25s,box-shadow 0.25s,transform 0.25s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}66`; e.currentTarget.style.boxShadow = `0 0 18px ${color}18`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}28`; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: source.relevance ? "7px" : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 800, color: "#f0f0f0", fontFamily: THEME.fontMono }}>{source.name}</span>
        </div>
        <span style={{ fontSize: "10px", color, fontWeight: 800, fontFamily: THEME.fontMono, background: `${color}18`, padding: "3px 9px", borderRadius: "99px", cursor: "help", border: `1px solid ${color}33` }} title={tierDesc[source.tier] || source.tier}>{source.tier}</span>
      </div>
      {source.relevance && <div style={{ fontSize: "12px", color: "#bbb", lineHeight: 1.55, paddingLeft: "15px", fontWeight: 500 }}>{source.relevance}</div>}
    </div>
  );
}

// ─── NEURAL SCAN LOADER ──────────────────────────────────────────────────────
function NeuralScanLoader({ phase, phases, progress }) {
  const pct = Math.round(progress * 100);
  return (
    <div style={{ padding: "50px 40px", background: "rgba(5,5,20,0.92)", backdropFilter: "blur(40px)", border: `1px solid ${THEME.accent}33`, borderRadius: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", position: "relative", overflow: "hidden", animation: "slideUp 0.5s cubic-bezier(0.23,1,0.32,1)" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg,transparent,${THEME.accent},transparent)`, animation: "scanLineHUD 3s linear infinite", boxShadow: `0 0 12px ${THEME.accent}` }} />
      <div style={{ position: "relative", width: "90px", height: "90px" }}>
        <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)", width: "100%", height: "100%" }}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#111" strokeWidth="2" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={THEME.accent} strokeWidth="2" strokeDasharray="276" strokeDashoffset={276 - 276 * progress} style={{ transition: "stroke-dashoffset 0.9s ease", filter: `drop-shadow(0 0 6px ${THEME.accent})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 10, border: `1px dashed ${THEME.secondary}44`, borderRadius: "50%", animation: "spin 10s linear infinite" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 800, color: THEME.accent, fontFamily: THEME.fontMono }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: "center", width: "100%" }}>
        <div style={{ fontFamily: THEME.fontMono, color: THEME.accent, fontSize: "13px", letterSpacing: "0.25em", marginBottom: "12px", fontWeight: 700 }}>{phase.toUpperCase()}</div>
        <div style={{ background: "#0a0a14", borderRadius: "99px", height: "4px", overflow: "hidden", border: "1px solid #1a1a2e", marginBottom: "10px" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: "99px", background: `linear-gradient(90deg,${THEME.secondary},${THEME.accent})`, transition: "width 0.9s ease", boxShadow: `0 0 8px ${THEME.accent}` }} />
        </div>
        <div style={{ fontSize: "11px", color: "#555", fontFamily: THEME.fontMono, display: "flex", gap: "3px", justifyContent: "center" }}>
          {Array.from({ length: 36 }).map((_, i) => <span key={i} style={{ color: i / 36 < progress ? THEME.accent : "#222", transition: "color 0.3s", fontWeight: 700 }}>|</span>)}
        </div>
      </div>
    </div>
  );
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function Toast({ message, show }) {
  return (
    <div style={{ position: "fixed", bottom: "32px", left: "50%", background: THEME.accent, color: "#000", padding: "12px 28px", borderRadius: "99px", fontFamily: THEME.fontMono, fontSize: "13px", fontWeight: 800, letterSpacing: "0.1em", zIndex: 9999, boxShadow: `0 8px 32px ${THEME.accent}66`, opacity: show ? 1 : 0, transform: show ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(16px)", transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)", pointerEvents: "none" }}>{message}</div>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────
function HowItWorks({ isMobile }) {
  const steps = [
    { icon: "📝", title: "Submit Claim",     desc: "Type any statement, headline, or rumour you want verified." },
    { icon: "🔍", title: "Live Web Search",  desc: "Tavily searches the internet in real-time for current info." },
    { icon: "🤖", title: "AI Cross-Verify",  desc: "Llama 3.3 reads results from Tier 1 sources and evaluates evidence." },
    { icon: "⚖️", title: "Verdict Rendered", desc: "TRUE, FALSE, or UNVERIFIED — with explanation and sources." },
  ];
  return (
    <div style={{ marginTop: isMobile ? "52px" : "76px", padding: isMobile ? "26px 18px" : "38px 34px", background: "rgba(10,10,20,0.6)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "24px" }}>
      <div style={{ fontSize: "11px", color: "#777", letterSpacing: "0.4em", marginBottom: "26px", fontFamily: THEME.fontMono, fontWeight: 800, textAlign: "center" }}>HOW IT WORKS</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: "20px" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ textAlign: "center", animation: `floatIn 0.5s ${i * 0.1}s ease both`, opacity: 0 }}>
            <div style={{ fontSize: "26px", marginBottom: "10px" }}>{s.icon}</div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "6px", fontFamily: THEME.fontMain }}>{s.title}</div>
            <div style={{ fontSize: "12px", color: "#999", lineHeight: 1.6, fontWeight: 500 }}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "26px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ fontSize: "11px", color: "#666", letterSpacing: "0.3em", marginBottom: "12px", fontFamily: THEME.fontMono, fontWeight: 700, textAlign: "center" }}>TRUSTED SOURCE TIERS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
          {[
            { label: "🟢 TIER 1", desc: "Reuters · AP · BBC",           color: THEME.accent },
            { label: "🔵 TIER 2", desc: "Bloomberg · NYT · Guardian",   color: THEME.info },
            { label: "🟣 TIER 3", desc: "CNN · NPR · NBC",              color: "#A78BFA" },
            { label: "🟡 OFFICIAL", desc: ".gov · WHO · UN · CDC",      color: THEME.warning },
          ].map((t, i) => (
            <div key={i} style={{ background: `${t.color}0a`, border: `1px solid ${t.color}33`, borderRadius: "10px", padding: "8px 14px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: t.color, fontFamily: THEME.fontMono, marginBottom: "2px" }}>{t.label}</div>
              <div style={{ fontSize: "11px", color: "#999", fontWeight: 600 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VERDICT CARD ────────────────────────────────────────────────────────────
function VerdictCard({ result, burst, onReset, onCopy, onShare, onFeedback, feedback, isMobile }) {
  const color = result.verdict === "TRUE" ? THEME.accent : result.verdict === "FALSE" ? THEME.error : THEME.warning;
  const icon  = result.verdict === "TRUE" ? "✓" : result.verdict === "FALSE" ? "✗" : "?";
  return (
    <div style={{ borderRadius: "24px", overflow: "hidden", background: "rgba(5,5,20,0.88)", backdropFilter: "blur(30px)", border: `1px solid ${color}44`, boxShadow: `0 0 60px ${color}0e,0 40px 80px rgba(0,0,0,0.6)`, animation: "revealAnim 0.7s cubic-bezier(0.23,1,0.32,1)", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center,${color}18,transparent 70%)`, opacity: burst ? 1 : 0, transition: "opacity 1.2s ease", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.025) 50%,transparent 60%)", backgroundSize: "200% 100%", animation: "holoshimmer 6s linear infinite", pointerEvents: "none" }} />

      {/* VERDICT HEADER */}
      <div style={{ padding: isMobile ? "20px 18px" : "26px 32px", borderBottom: `1px solid ${color}18`, background: `linear-gradient(135deg,${color}0a,transparent)`, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ width: isMobile ? "44px" : "52px", height: isMobile ? "44px" : "52px", borderRadius: "12px", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "22px" : "26px", fontWeight: 900, color: result.verdict === "FALSE" ? "#fff" : "#000", boxShadow: `0 0 24px ${color}88,0 0 60px ${color}33`, animation: "verdictPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275)", flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: "11px", color: "#999", letterSpacing: "0.2em", fontFamily: THEME.fontMono, marginBottom: "4px", fontWeight: 700 }}>VERDICT</div>
              <div style={{ fontSize: isMobile ? "26px" : "32px", fontWeight: 900, color, textShadow: `0 0 20px ${color}88`, letterSpacing: "0.05em", lineHeight: 1 }}>{result.verdict}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {result.breaking_news && <div style={{ background: `${THEME.error}22`, border: `1px solid ${THEME.error}44`, borderRadius: "99px", padding: "5px 14px", fontSize: "11px", color: THEME.error, letterSpacing: "0.2em", animation: "pulse 1.5s infinite", fontFamily: THEME.fontMono, fontWeight: 800 }}>● BREAKING</div>}
            {result.claim_type && <div style={{ background: "#ffffff0a", border: "1px solid #ffffff18", borderRadius: "99px", padding: "5px 14px", fontSize: "11px", color: "#ddd", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: THEME.fontMono, fontWeight: 700 }}>{result.claim_type}</div>}
          </div>
        </div>
      </div>

      {/* VERIFIED CLAIM */}
      <div style={{ padding: isMobile ? "18px" : "22px 32px", borderBottom: "1px solid #ffffff06", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "12px", color: "#bbb", letterSpacing: "0.2em", marginBottom: "10px", fontFamily: THEME.fontMono, fontWeight: 700 }}>VERIFIED CLAIM</div>
        <div style={{ fontSize: isMobile ? "15px" : "16px", color: "#eeeef8", lineHeight: 1.7, fontFamily: THEME.fontMain, fontWeight: 500 }}>"<Typewriter text={result.claim || ""} />"</div>
      </div>

      {/* ANALYSIS */}
      <div style={{ padding: isMobile ? "18px" : "22px 32px", borderBottom: "1px solid #ffffff06", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "12px", color: "#bbb", letterSpacing: "0.2em", marginBottom: "10px", fontFamily: THEME.fontMono, fontWeight: 700 }}>ANALYSIS</div>
        <p style={{ fontSize: isMobile ? "14px" : "15px", color: "#ccc", lineHeight: 1.8, fontFamily: THEME.fontMain, margin: 0, fontWeight: 500 }}>{result.explanation}</p>
      </div>

      {/* CONFIDENCE + QUERIES */}
      <div style={{ padding: isMobile ? "18px" : "22px 32px", borderBottom: "1px solid #ffffff06", position: "relative", zIndex: 1 }}>
        <ConfidenceMeter level={result.confidence} />
        {result.search_queries_used?.length > 0 && (
          <div style={{ marginTop: "18px" }}>
            <div style={{ fontSize: "12px", color: "#bbb", letterSpacing: "0.2em", marginBottom: "10px", fontFamily: THEME.fontMono, fontWeight: 700 }}>SEARCH QUERIES</div>
            {result.search_queries_used.slice(0, 4).map((q, i) => <div key={i} style={{ fontSize: "12px", color: "#ccc", padding: "6px 0", borderBottom: "1px solid #ffffff04", fontFamily: THEME.fontMono, fontWeight: 500 }}>▸ {q}</div>)}
          </div>
        )}
      </div>

      {/* SOURCES */}
      <div style={{ padding: isMobile ? "18px" : "22px 32px", borderBottom: "1px solid #ffffff06", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: "12px", color: "#bbb", letterSpacing: "0.2em", marginBottom: "14px", fontFamily: THEME.fontMono, fontWeight: 700 }}>
          SOURCES ({result.sources?.filter(s => s.tier !== "UNTRUSTED").length || 0})
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: "8px" }}>
          {result.sources?.filter(s => s.tier !== "UNTRUSTED").slice(0, 6).map((s, i) => <SourceCard key={i} source={s} delay={i * 0.07} />)}
          {(!result.sources || result.sources.filter(s => s.tier !== "UNTRUSTED").length === 0) && <div style={{ fontSize: "13px", color: "#777", fontFamily: THEME.fontMono, fontWeight: 600 }}>NO TRUSTED SOURCES FOUND</div>}
        </div>
      </div>

      {/* FEEDBACK */}
      <div style={{ padding: isMobile ? "16px 18px" : "18px 32px", borderBottom: "1px solid #ffffff06", position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: "#bbb", fontFamily: THEME.fontMono, fontWeight: 700, letterSpacing: "0.1em" }}>WAS THIS HELPFUL?</span>
        <div style={{ display: "flex", gap: "8px" }}>
          {[["👍 Yes", "yes"], ["👎 No", "no"]].map(([label, val]) => (
            <button key={val} onClick={() => onFeedback(val)} style={{ background: feedback === val ? (val === "yes" ? `${THEME.accent}22` : `${THEME.error}22`) : "rgba(255,255,255,0.04)", border: `1px solid ${feedback === val ? (val === "yes" ? THEME.accent : THEME.error) : "rgba(255,255,255,0.1)"}`, color: feedback === val ? (val === "yes" ? THEME.accent : THEME.error) : "#bbb", padding: "7px 16px", borderRadius: "99px", fontSize: "12px", fontWeight: 800, fontFamily: THEME.fontMono, cursor: "pointer", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>
        {feedback && <span style={{ fontSize: "12px", color: THEME.accent, fontFamily: THEME.fontMono, fontWeight: 700 }}>Thanks! ✓</span>}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ padding: isMobile ? "16px 18px" : "20px 32px", position: "relative", zIndex: 1, display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={onCopy} style={{ flex: 1, minWidth: isMobile ? "100%" : "130px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "#ddd", padding: "12px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em", fontFamily: THEME.fontMono, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#ddd"; }}
        >📋 COPY</button>

        <button onClick={onShare} style={{ flex: 1, minWidth: isMobile ? "100%" : "130px", background: `${THEME.secondary}18`, border: `1px solid ${THEME.secondary}44`, color: "#c4b5fd", padding: "12px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em", fontFamily: THEME.fontMono, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}
          onMouseEnter={e => { e.currentTarget.style.background = `${THEME.secondary}30`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${THEME.secondary}18`; }}
        >🔗 SHARE</button>

        <button onClick={onReset} style={{ flex: 2, minWidth: isMobile ? "100%" : "180px", background: THEME.accent, border: "none", color: "#000", padding: "12px 18px", borderRadius: "12px", fontSize: "12px", fontWeight: 900, letterSpacing: "0.15em", fontFamily: THEME.fontMono, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: `0 6px 20px ${THEME.accent}44` }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = `0 8px 28px ${THEME.accent}66`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 6px 20px ${THEME.accent}44`; }}
        >⚡ VERIFY ANOTHER CLAIM</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function TruthGuard() {
  const [claim, setClaim]       = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [phase, setPhase]       = useState("");
  const [progress, setProgress] = useState(0);
  const [history, setHistory]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("tg_history") || "[]").map(h => ({ ...h, time: new Date(h.time) })); }
    catch { return []; }
  });
  const [burst, setBurst]         = useState(false);
  const [entered, setEntered]     = useState(false);
  const [toast, setToast]         = useState({ show: false, message: "" });
  const [feedback, setFeedback]   = useState(null);
  const [charCount, setCharCount] = useState(0);
  const inputRef  = useRef(null);
  const resultRef = useRef(null);
  const isMobile  = useIsMobile();

  useEffect(() => { setTimeout(() => setEntered(true), 100); }, []);

  useEffect(() => {
    try { localStorage.setItem("tg_history", JSON.stringify(history.slice(0, 6).map(h => ({ ...h, time: h.time.toISOString() })))); }
    catch {}
  }, [history]);

  useEffect(() => {
    if (result) document.title = `${result.verdict === "TRUE" ? "✅" : result.verdict === "FALSE" ? "❌" : "❓"} ${result.verdict} — TruthGuard`;
    else document.title = "TruthGuard — AI Fact-Checker";
  }, [result]);

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 2400);
  };

  const phases = ["Synthesizing Neural Path", "Querying Global Archives", "Isolating Signal from Noise", "Validating Cryptographic Sources", "Converging on Truth"];

  const verify = async () => {
    if (!claim.trim() || loading) return;
    setLoading(true); setResult(null); setError(null); setBurst(false); setFeedback(null);
    let pi = 0;
    setPhase(phases[0]); setProgress(0.1);
    const interval = setInterval(() => { pi = Math.min(pi + 1, phases.length - 1); setPhase(phases[pi]); setProgress((pi + 1) / phases.length); }, 1000);
    try {
      const resp   = await fetch("/api/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ claim: claim.trim() }) });
      const parsed = await resp.json();
      if (!resp.ok) throw new Error(parsed.error || "Neural Desync Detected");
      clearInterval(interval); setProgress(1);
      setTimeout(() => {
        setResult(parsed); setBurst(true);
        setHistory(h => [{ claim: claim.trim(), verdict: parsed.verdict, time: new Date() }, ...h.slice(0, 5)]);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
        setTimeout(() => setBurst(false), 1500);
      }, 400);
    } catch (e) {
      clearInterval(interval); setError(e.message);
    } finally { setLoading(false); }
  };

  const handleReset = () => {
    setResult(null); setError(null); setClaim(""); setCharCount(0);
    setTimeout(() => inputRef.current?.focus(), 100);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `🛡️ TRUTHGUARD VERDICT\n\nCLAIM: ${result.claim}\nVERDICT: ${result.verdict}\nCONFIDENCE: ${result.confidence}\n\nANALYSIS:\n${result.explanation}\n\nSOURCES: ${result.sources?.filter(s => s.tier !== "UNTRUSTED").map(s => s.name).join(", ") || "None"}\n\n— Verified by TruthGuard AI`;
    navigator.clipboard.writeText(text).then(() => showToast("✓ Copied to clipboard!")).catch(() => showToast("Copy failed"));
  };

  const handleShare = () => {
    if (!result) return;
    const text = `🛡️ TruthGuard says: "${result.claim}" is ${result.verdict} (${result.confidence} confidence)\n\nVerify claims: ${window.location.href}`;
    if (navigator.share) { navigator.share({ title: "TruthGuard Verdict", text }).catch(() => {}); }
    else { navigator.clipboard.writeText(text).then(() => showToast("✓ Share text copied!")).catch(() => showToast("Share failed")); }
  };

  const handleFeedback = (val) => {
    setFeedback(val);
    showToast(val === "yes" ? "✓ Glad it helped!" : "✓ Thanks — we'll improve!");
  };

  const handleExampleClick = (ex) => {
    setClaim(ex); setCharCount(ex.length);
    inputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const MAX_CHARS = 300;
  const charColor = charCount > MAX_CHARS * 0.9 ? THEME.error : charCount > MAX_CHARS * 0.7 ? THEME.warning : "#666";

  return (
    <div style={{ minHeight: "100vh", background: THEME.bg, color: "#fff", fontFamily: THEME.fontMain, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700;900&family=JetBrains+Mono:wght@400;700;800&display=swap');
        * { box-sizing: border-box; }
        textarea, button { font-family: inherit; }
        textarea:focus { outline: none; }
        textarea::placeholder { color: #252535; }
        button { cursor: pointer; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${THEME.accent}33; border-radius: 99px; }
        @keyframes blink        { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse        { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.88)} }
        @keyframes spin         { to{transform:rotate(360deg)} }
        @keyframes floatingLogo { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
        @keyframes slideUp      { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes staggerIn    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatIn      { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scanLineHUD  { 0%{top:-2px;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes shimmer      { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }
        @keyframes verdictPop   { 0%{transform:scale(0.4);opacity:0} 65%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes revealAnim   { 0%{clip-path:polygon(0 0,100% 0,100% 0,0 0);opacity:0} 100%{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);opacity:1} }
        @keyframes holoshimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes gradBorder   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes examplePop   { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes headerGlow   { 0%,100%{box-shadow:0 1px 0 ${THEME.secondary}22} 50%{box-shadow:0 1px 0 ${THEME.secondary}55} }
      `}</style>

      <QuantumBackground />
      <Toast message={toast.message} show={toast.show} />

      {/* HEADER */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? "13px 16px" : "16px 44px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", background: "rgba(2,2,5,0.88)", animation: "headerGlow 5s ease infinite" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
          <div style={{ width: "38px", height: "38px", border: `2px solid ${THEME.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", fontWeight: 900, color: THEME.accent, animation: "floatingLogo 4s ease-in-out infinite", boxShadow: `0 0 16px ${THEME.accent}44` }}>Σ</div>
          <div>
            <div style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 900, letterSpacing: "0.22em", color: "#fff" }}>TRUTHGUARD</div>
            <div style={{ fontSize: "9px", fontFamily: THEME.fontMono, color: THEME.accent, letterSpacing: "0.35em", fontWeight: 700 }}>NEURAL_ORACLE v2.5</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: `${THEME.info}0a`, border: `1px solid ${THEME.info}33`, borderRadius: "99px", padding: "6px 14px" }}>
          <span style={{ color: THEME.info, fontSize: "10px", animation: "pulse 2s infinite" }}>●</span>
          <span style={{ fontSize: "11px", color: THEME.info, letterSpacing: "0.15em", fontFamily: THEME.fontMono, fontWeight: 700 }}>WEB SEARCH ON</span>
        </div>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "110px 14px 72px" : "148px 24px 100px", position: "relative", zIndex: 1 }}>
        <PerspectiveWrapper>

          {/* HERO */}
          <div style={{ textAlign: "center", marginBottom: isMobile ? "36px" : "60px", opacity: entered ? 1 : 0, transform: entered ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.8s ease,transform 0.8s ease" }}>
            <div style={{ fontSize: "11px", color: THEME.secondary, letterSpacing: "0.4em", marginBottom: "14px", fontFamily: THEME.fontMono, textShadow: `0 0 10px ${THEME.secondary}`, fontWeight: 800 }}>▸ MULTI-SOURCE VERIFICATION ENGINE</div>
            <h1 style={{ fontSize: isMobile ? "36px" : "clamp(42px,8vw,76px)", fontWeight: 900, lineHeight: 0.92, marginBottom: "16px", background: "linear-gradient(to bottom,#fff 0%,#555 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.04em" }}>
              CHALLENGE THE<br />
              <span style={{ color: THEME.accent, WebkitTextFillColor: THEME.accent, textShadow: `0 0 40px ${THEME.accent}44` }}>UNVERIFIED.</span>
            </h1>
            <p style={{ fontSize: isMobile ? "14px" : "16px", color: "#aaa", maxWidth: "520px", margin: "0 auto", lineHeight: 1.8, fontWeight: 500 }}>Real-time web search · Trusted source cross-verification · AI-powered verdict</p>
          </div>

          {/* INPUT */}
          <div style={{ padding: "2px", background: "linear-gradient(135deg,#333 0%,#111 50%,#7B2FFF44 100%)", borderRadius: "28px", marginBottom: "16px", boxShadow: "0 40px 80px rgba(0,0,0,0.7)", animation: "staggerIn 0.8s 0.2s ease both" }}>
            <div style={{ background: "rgba(8,8,18,0.97)", borderRadius: "26px", overflow: "hidden", position: "relative" }}>
              <div style={{ height: "1px", background: `linear-gradient(90deg,transparent,${THEME.accent}66,${THEME.secondary}66,transparent)`, animation: "gradBorder 3s ease-in-out infinite" }} />
              <textarea ref={inputRef} value={claim} onChange={e => { setClaim(e.target.value); setCharCount(e.target.value.length); }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); verify(); } }} placeholder="INPUT DATA STREAM FOR VERIFICATION..." rows={isMobile ? 3 : 4} maxLength={MAX_CHARS}
                style={{ width: "100%", background: "transparent", border: "none", padding: isMobile ? "20px 18px" : "30px 34px", fontSize: isMobile ? "16px" : "18px", color: "#e8e8f2", resize: "none", lineHeight: 1.65, fontFamily: THEME.fontMono, letterSpacing: "-0.01em" }}
              />
              <div style={{ padding: isMobile ? "12px 16px" : "14px 30px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "11px", color: "#555", fontFamily: THEME.fontMono, fontWeight: 600 }}>{isMobile ? "TAP VERIFY" : "ENTER · SHIFT+ENTER for newline"}</span>
                  <span style={{ fontSize: "12px", color: charColor, fontFamily: THEME.fontMono, fontWeight: 800 }}>{charCount}/{MAX_CHARS}</span>
                </div>
                <button onClick={verify} disabled={loading || !claim.trim()} style={{ background: (loading || !claim.trim()) ? "transparent" : THEME.accent, border: (loading || !claim.trim()) ? `1px solid ${THEME.accent}33` : "none", color: (loading || !claim.trim()) ? THEME.accent : "#000", padding: isMobile ? "12px 22px" : "13px 32px", borderRadius: "14px", fontWeight: 900, fontSize: "12px", letterSpacing: "0.18em", fontFamily: THEME.fontMono, opacity: (!claim.trim() && !loading) ? 0.3 : 1, boxShadow: (!loading && claim.trim()) ? `0 8px 24px ${THEME.accent}44` : "none", transition: "all 0.25s ease", minWidth: isMobile ? "90px" : "130px" }}
                  onMouseEnter={e => { if (!loading && claim.trim()) e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >{loading ? "SCANNING..." : "▸ VERIFY"}</button>
              </div>
            </div>
          </div>

          {/* EXAMPLES categorized */}
          <div style={{ marginBottom: isMobile ? "32px" : "52px", animation: "staggerIn 0.8s 0.35s ease both" }}>
            <div style={{ fontSize: "11px", color: "#777", letterSpacing: "0.35em", marginBottom: "14px", fontFamily: THEME.fontMono, fontWeight: 800 }}>EXAMPLE QUERIES:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {EXAMPLE_CATEGORIES.map((cat, ci) => (
                <div key={ci} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "10px", color: cat.color, fontFamily: THEME.fontMono, fontWeight: 800, letterSpacing: "0.18em", minWidth: "70px" }}>{cat.label}</span>
                  {cat.items.map((ex, ei) => (
                    <button key={ex} onClick={() => handleExampleClick(ex)} style={{ background: `${cat.color}0a`, border: `1px solid ${cat.color}28`, color: "#ccc", padding: isMobile ? "8px 13px" : "7px 15px", borderRadius: "99px", fontSize: "12px", fontFamily: THEME.fontMono, fontWeight: 600, transition: "all 0.2s", animation: `examplePop 0.4s ${0.4 + ci * 0.1 + ei * 0.06}s ease both`, opacity: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${cat.color}66`; e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = `${cat.color}18`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${cat.color}28`; e.currentTarget.style.color = "#ccc"; e.currentTarget.style.background = `${cat.color}0a`; }}
                    >{ex}</button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* LOADER */}
          {loading && <NeuralScanLoader phase={phase} phases={phases} progress={progress} />}

          {/* ERROR */}
          {error && (
            <div style={{ padding: "22px 26px", border: `1px solid ${THEME.error}44`, borderRadius: "16px", background: `${THEME.error}0a`, animation: "slideUp 0.4s ease" }}>
              <div style={{ fontSize: "12px", color: THEME.error, letterSpacing: "0.2em", marginBottom: "8px", fontFamily: THEME.fontMono, fontWeight: 800 }}>⚠ SYSTEM ERROR</div>
              <div style={{ fontSize: "14px", color: "#ff9999", lineHeight: 1.6, fontWeight: 500, marginBottom: "14px" }}>{error}</div>
              <button onClick={handleReset} style={{ background: "transparent", border: `1px solid ${THEME.error}44`, color: THEME.error, padding: "8px 18px", borderRadius: "8px", fontSize: "12px", fontWeight: 800, fontFamily: THEME.fontMono, cursor: "pointer" }}>TRY AGAIN</button>
            </div>
          )}

          {/* RESULT */}
          {result && !loading && (
            <div ref={resultRef}>
              <VerdictCard result={result} burst={burst} isMobile={isMobile} onReset={handleReset} onCopy={handleCopy} onShare={handleShare} onFeedback={handleFeedback} feedback={feedback} />
            </div>
          )}

        </PerspectiveWrapper>

        {/* HOW IT WORKS */}
        <HowItWorks isMobile={isMobile} />

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={{ marginTop: isMobile ? "48px" : "72px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#777", letterSpacing: "0.4em", fontFamily: THEME.fontMono, fontWeight: 800 }}>RECENT VERIFICATIONS</div>
              <button onClick={() => { setHistory([]); try { localStorage.removeItem("tg_history"); } catch {} }} style={{ background: "transparent", border: `1px solid ${THEME.error}33`, color: THEME.error, padding: "5px 12px", borderRadius: "99px", fontSize: "10px", fontWeight: 800, fontFamily: THEME.fontMono, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${THEME.error}18`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >CLEAR ALL</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.map((h, i) => {
                const vc = h.verdict === "TRUE" ? THEME.accent : h.verdict === "FALSE" ? THEME.error : THEME.warning;
                return (
                  <div key={i} onClick={() => { setClaim(h.claim); setCharCount(h.claim.length); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => inputRef.current?.focus(), 300); }}
                    style={{ padding: isMobile ? "13px 14px" : "14px 22px", background: "rgba(255,255,255,0.02)", border: `1px solid ${vc}18`, borderRadius: "14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = `${vc}08`; e.currentTarget.style.borderColor = `${vc}44`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor = `${vc}18`; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: 900, color: vc, minWidth: isMobile ? "70px" : "80px", flexShrink: 0, fontFamily: THEME.fontMono, textShadow: `0 0 8px ${vc}66` }}>{h.verdict}</span>
                      <span style={{ fontSize: "13px", color: "#bbb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{h.claim}</span>
                    </div>
                    <span style={{ fontSize: "11px", color: "#666", fontFamily: THEME.fontMono, flexShrink: 0, fontWeight: 600 }}>{h.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ padding: isMobile ? "36px 16px" : "56px 44px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.4em", marginBottom: "14px", fontFamily: THEME.fontMono, fontWeight: 700 }}>DECENTRALIZED TRUTH PROTOCOL © 2045</div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px", fontSize: "11px", color: "#666", fontFamily: THEME.fontMono, fontWeight: 600 }}>
          <span>GROQ + LLAMA 3.3 70B</span>
          <span style={{ color: THEME.accent }}>● WEB SEARCH ENABLED</span>
          <span>MULTI-SOURCE VERIFIED</span>
        </div>
      </footer>
    </div>
  );
}
