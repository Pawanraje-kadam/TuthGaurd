import { useState, useRef, useEffect } from "react";

const TIERS = {
  TIER1:   { label: "Tier 1",  color: "#00ff9d" },
  TIER2:   { label: "Tier 2",  color: "#00c8ff" },
  TIER3:   { label: "Tier 3",  color: "#a78bfa" },
  OFFICIAL:{ label: "Official",color: "#fbbf24" },
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

function VerdictBadge({ verdict }) {
  const styles = {
    TRUE:       { bg:"#00ff9d22", border:"#00ff9d", text:"#00ff9d", icon:"✓", label:"TRUE" },
    FALSE:      { bg:"#ff3b3b22", border:"#ff3b3b", text:"#ff3b3b", icon:"✗", label:"FALSE" },
    UNVERIFIED: { bg:"#fbbf2422", border:"#fbbf24", text:"#fbbf24", icon:"?", label:"UNVERIFIED" },
  };
  const s = styles[verdict] || styles.UNVERIFIED;
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:"8px",
      background:s.bg, border:`1px solid ${s.border}`, borderRadius:"4px", padding:"8px 18px" }}>
      <span style={{ fontSize:"22px", color:s.text, fontWeight:900 }}>{s.icon}</span>
      <span style={{ fontSize:"18px", fontWeight:800, color:s.text,
        letterSpacing:"0.15em", fontFamily:"monospace" }}>{s.label}</span>
    </div>
  );
}

function ConfidenceMeter({ level }) {
  const map = { High:{pct:90,color:"#00ff9d"}, Medium:{pct:55,color:"#fbbf24"}, Low:{pct:20,color:"#ff3b3b"} };
  const { pct, color } = map[level] || map.Low;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
        <span style={{ fontSize:"11px", color:"#bbb", letterSpacing:"0.1em", textTransform:"uppercase" }}>Confidence</span>
        <span style={{ fontSize:"11px", color, fontWeight:700 }}>{level}</span>
      </div>
      <div style={{ background:"#1a1a1a", borderRadius:"2px", height:"5px", overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", background:color,
          borderRadius:"2px", transition:"width 1s ease", boxShadow:`0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

function SourceChip({ source }) {
  const tierColors = { TIER1:"#00ff9d", TIER2:"#00c8ff", TIER3:"#a78bfa", OFFICIAL:"#fbbf24", UNTRUSTED:"#666" };
  const color = tierColors[source.tier] || "#666";
  return (
    <div style={{ border:`1px solid ${color}44`, background:`${color}0f`,
      borderRadius:"4px", padding:"8px 10px", display:"flex", gap:"8px", alignItems:"flex-start" }}>
      <div style={{ width:"7px", height:"7px", borderRadius:"50%", background:color,
        marginTop:"4px", flexShrink:0, boxShadow:`0 0 6px ${color}` }} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:"12px", fontWeight:700, color:"#e0e0e0", fontFamily:"monospace" }}>{source.name}</div>
        <div style={{ fontSize:"10px", color:"#aaa", marginTop:"2px", wordBreak:"break-word" }}>{source.relevance}</div>
      </div>
      <div style={{ fontSize:"9px", color, fontWeight:700, flexShrink:0, paddingTop:"2px" }}>{source.tier}</div>
    </div>
  );
}

function TypewriterText({ text, speed = 12 }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++; setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setDone(true); }
    }, speed);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}{!done && <span style={{ opacity:0.5, animation:"blink 0.7s infinite" }}>█</span>}</span>;
}

const EXAMPLES = [
  "Is Elon Musk the richest person in the world?",
  "Did NASA confirm water on Mars?",
  "Is the Great Wall of China visible from space?",
  "Did OpenAI release GPT-5?",
];

export default function TruthGuard() {
  const [claim, setClaim]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [phase, setPhase]     = useState("");
  const [history, setHistory] = useState([]);
  const resultRef = useRef(null);
  const isMobile  = useIsMobile();

  const phases = [
    "Initializing TruthGuard...",
    "Parsing claim...",
    "Generating search queries...",
    "Consulting trusted sources...",
    "Cross-verifying evidence...",
    "Rendering verdict...",
  ];

  async function verify() {
    if (!claim.trim() || loading) return;
    setLoading(true); setResult(null); setError(null);

    let pi = 0;
    const phaseInterval = setInterval(() => {
      setPhase(phases[Math.min(pi++, phases.length - 1)]);
    }, 700);

    try {
      // Calls OUR backend - not Groq directly. Key is safe!
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: claim.trim() }),
      });

      const parsed = await response.json();
      if (!response.ok) throw new Error(parsed.error || "Verification failed");

      clearInterval(phaseInterval);
      setResult(parsed);
      setHistory(h => [{ claim:claim.trim(), verdict:parsed.verdict, time:new Date() }, ...h.slice(0,4)]);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch (e) {
      clearInterval(phaseInterval);
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false); setPhase("");
    }
  }

  const accentColor = result
    ? result.verdict==="TRUE" ? "#00ff9d" : result.verdict==="FALSE" ? "#ff3b3b" : "#fbbf24"
    : "#00ff9d";

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#e0e0e0",
      fontFamily:"'Courier New', Courier, monospace", WebkitTextSizeAdjust:"100%", overflowX:"hidden" }}>
      <style>{`
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        * { box-sizing:border-box; }
        textarea:focus { outline:none; }
        button { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid #1a1a1a", padding:isMobile?"12px 16px":"16px 32px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"#08080899", backdropFilter:"blur(10px)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"30px", height:"30px", border:"1px solid #00ff9d",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <span style={{ color:"#00ff9d", fontSize:"15px", fontWeight:900 }}>T</span>
          </div>
          <div>
            <div style={{ fontSize:isMobile?"12px":"14px", fontWeight:900, color:"#fff", letterSpacing:"0.2em" }}>
              TRUTHGUARD
            </div>
            <div style={{ fontSize:"8px", color:"#888", letterSpacing:"0.15em" }}>AI FACT-CHECKING AGENT</div>
          </div>
        </div>
        {!isMobile && (
          <div style={{ display:"flex", gap:"14px", alignItems:"center" }}>
            {Object.entries(TIERS).map(([k,t]) => (
              <div key={k} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:t.color }} />
                <span style={{ fontSize:"9px", color:"#aaa" }}>{t.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth:"860px", margin:"0 auto", padding:isMobile?"24px 14px 48px":"48px 24px 64px" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:isMobile?"24px":"40px" }}>
          <div style={{ fontSize:"9px", color:"#00ff9d", letterSpacing:"0.4em", marginBottom:"10px" }}>
            ▸ MULTI-SOURCE VERIFICATION ENGINE
          </div>
          <h1 style={{ fontSize:isMobile?"24px":"clamp(28px,6vw,52px)", fontWeight:900, color:"#fff",
            letterSpacing:"0.04em", margin:"0 0 10px", lineHeight:1.15 }}>
            Is it TRUE or FALSE?
          </h1>
          <p style={{ fontSize:isMobile?"12px":"13px", color:"#aaa", maxWidth:"420px", margin:"0 auto", lineHeight:1.8 }}>
            Submit any claim. TruthGuard searches trusted sources,
            cross-verifies evidence, and renders a verdict.
          </p>
        </div>

        {/* INPUT */}
        <div style={{ border:"1px solid #222", borderRadius:"8px", overflow:"hidden",
          background:"#0d0d0d", marginBottom:"14px" }}>
          <div style={{ padding:"10px 14px", borderBottom:"1px solid #161616",
            display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ color:"#00ff9d", fontSize:"10px", animation:"pulse 2s infinite" }}>●</span>
            <span style={{ fontSize:"10px", color:"#ccc", letterSpacing:"0.25em" }}>CLAIM INPUT</span>
          </div>
          <textarea value={claim} onChange={e => setClaim(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();verify();} }}
            placeholder="Enter a claim to verify…" rows={isMobile?3:4}
            style={{ width:"100%", background:"transparent", border:"none",
              padding:isMobile?"14px":"16px 18px", fontSize:isMobile?"16px":"14px",
              color:"#ddd", resize:"none", lineHeight:1.7, fontFamily:"'Courier New', monospace" }} />
          <div style={{ padding:"10px 14px", borderTop:"1px solid #161616",
            display:"flex", justifyContent:"space-between", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"10px", color:"#999" }}>
              {isMobile ? "Tap VERIFY to check" : "ENTER to verify · SHIFT+ENTER for newline"}
            </span>
            <button onClick={verify} disabled={loading||!claim.trim()} style={{
              background: loading?"transparent":"#00ff9d",
              border: loading?"1px solid #00ff9d44":"none",
              color: loading?"#00ff9d":"#000",
              padding:isMobile?"12px 28px":"8px 24px", borderRadius:"4px",
              fontSize:"11px", fontWeight:900, cursor:"pointer", letterSpacing:"0.2em",
              fontFamily:"'Courier New', monospace",
              opacity:(!claim.trim()&&!loading)?0.35:1, minWidth:"90px", flexShrink:0 }}>
              {loading ? "ANALYZING…" : "▸ VERIFY"}
            </button>
          </div>
        </div>

        {/* EXAMPLES */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"7px", marginBottom:isMobile?"24px":"36px" }}>
          <span style={{ fontSize:"10px", color:"#999", letterSpacing:"0.1em", paddingTop:"5px", width:"100%" }}>
            EXAMPLES:
          </span>
          {EXAMPLES.map(ex => (
            <button key={ex} onClick={() => setClaim(ex)} style={{
              background:"transparent", border:"1px solid #2a2a2a", color:"#bbb",
              padding:isMobile?"8px 12px":"5px 10px", borderRadius:"4px",
              fontSize:isMobile?"12px":"10px", cursor:"pointer",
              fontFamily:"'Courier New', monospace", lineHeight:1.4, textAlign:"left" }}>
              {ex}
            </button>
          ))}
        </div>

        {/* LOADING */}
        {loading && (
          <div style={{ border:"1px solid #1e1e1e", borderRadius:"8px", background:"#0d0d0d",
            padding:isMobile?"32px 16px":"40px", display:"flex", flexDirection:"column",
            alignItems:"center", gap:"20px", animation:"fadeIn 0.3s ease" }}>
            <div style={{ width:"40px", height:"40px", border:"1px solid #1e1e1e",
              borderTop:"1px solid #00ff9d", borderRadius:"50%", animation:"spin 1s linear infinite" }} />
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"12px", color:"#00ff9d", letterSpacing:"0.15em", marginBottom:"10px" }}>
                {phase}
              </div>
              <div style={{ display:"flex", gap:"6px", justifyContent:"center" }}>
                {phases.map((_,i) => (
                  <div key={i} style={{ width:"5px", height:"5px", borderRadius:"50%",
                    background: phases.indexOf(phase)>=i?"#00ff9d":"#222", transition:"background 0.3s",
                    boxShadow: phases.indexOf(phase)===i?"0 0 6px #00ff9d":"none" }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div style={{ border:"1px solid #ff3b3b44", background:"#ff3b3b0f",
            borderRadius:"8px", padding:"18px", animation:"fadeIn 0.3s ease" }}>
            <div style={{ fontSize:"11px", color:"#ff3b3b", letterSpacing:"0.2em", marginBottom:"6px" }}>⚠ AGENT ERROR</div>
            <div style={{ fontSize:"13px", color:"#ff8080", lineHeight:1.6 }}>{error}</div>
          </div>
        )}

        {/* RESULT */}
        {result && !loading && (
          <div ref={resultRef} style={{ animation:"fadeIn 0.5s ease" }}>
            <div style={{ border:`1px solid ${accentColor}44`, borderRadius:"8px",
              overflow:"hidden", background:"#0d0d0d" }}>

              <div style={{ padding:isMobile?"14px":"20px 26px", borderBottom:"1px solid #151515",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                flexWrap:"wrap", gap:"10px" }}>
                <VerdictBadge verdict={result.verdict} />
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  {result.breaking_news && (
                    <div style={{ background:"#ff3b3b22", border:"1px solid #ff3b3b44",
                      borderRadius:"3px", padding:"4px 8px", fontSize:"9px", color:"#ff3b3b",
                      letterSpacing:"0.2em", animation:"pulse 1.5s infinite" }}>● BREAKING</div>
                  )}
                  <div style={{ background:"#ffffff08", border:"1px solid #ffffff14",
                    borderRadius:"3px", padding:"4px 8px", fontSize:"9px", color:"#bbb",
                    letterSpacing:"0.1em", textTransform:"uppercase" }}>{result.claim_type}</div>
                </div>
              </div>

              <div style={{ padding:isMobile?"14px":"18px 26px", borderBottom:"1px solid #111" }}>
                <div style={{ fontSize:"10px", color:"#999", letterSpacing:"0.25em", marginBottom:"8px" }}>VERIFIED CLAIM</div>
                <div style={{ fontSize:isMobile?"14px":"15px", color:"#eee", lineHeight:1.7 }}>
                  "<TypewriterText text={result.claim} />"
                </div>
              </div>

              <div style={{ padding:isMobile?"14px":"18px 26px", borderBottom:"1px solid #111" }}>
                <div style={{ fontSize:"10px", color:"#999", letterSpacing:"0.25em", marginBottom:"8px" }}>ANALYSIS</div>
                <div style={{ fontSize:"13px", color:"#ccc", lineHeight:1.85 }}>{result.explanation}</div>
              </div>

              <div style={{ padding:isMobile?"14px":"18px 26px", borderBottom:"1px solid #111" }}>
                <ConfidenceMeter level={result.confidence} />
                {result.search_queries_used?.length > 0 && (
                  <div style={{ marginTop:"14px" }}>
                    <div style={{ fontSize:"10px", color:"#999", letterSpacing:"0.2em", marginBottom:"8px" }}>QUERIES RUN</div>
                    {result.search_queries_used.slice(0,3).map((q,i) => (
                      <div key={i} style={{ fontSize:"11px", color:"#bbb", padding:"5px 0",
                        borderBottom:"1px solid #111", lineHeight:1.5 }}>▸ {q}</div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ padding:isMobile?"14px":"18px 26px" }}>
                <div style={{ fontSize:"10px", color:"#999", letterSpacing:"0.2em", marginBottom:"10px" }}>
                  SOURCES CONSULTED ({result.sources?.length || 0})
                </div>
                <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)", gap:"6px" }}>
                  {result.sources?.slice(0,6).map((s,i) => <SourceChip key={i} source={s} />)}
                  {(!result.sources||result.sources.length===0) && (
                    <div style={{ fontSize:"12px", color:"#999" }}>No trusted sources found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {history.length > 0 && (
          <div style={{ marginTop:"36px" }}>
            <div style={{ fontSize:"10px", color:"#999", letterSpacing:"0.3em", marginBottom:"10px" }}>
              RECENT VERIFICATIONS
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {history.map((h,i) => (
                <div key={i} onClick={() => setClaim(h.claim)} style={{
                  display:"flex", alignItems:"center", gap:"10px",
                  padding:isMobile?"12px":"10px 14px", border:"1px solid #1a1a1a",
                  borderRadius:"4px", cursor:"pointer", background:"#0a0a0a" }}>
                  <div style={{ fontSize:"10px", fontWeight:900,
                    color: h.verdict==="TRUE"?"#00ff9d":h.verdict==="FALSE"?"#ff3b3b":"#fbbf24",
                    minWidth:isMobile?"70px":"80px", flexShrink:0 }}>{h.verdict}</div>
                  <div style={{ fontSize:"12px", color:"#bbb", flex:1,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.claim}</div>
                  <div style={{ fontSize:"10px", color:"#999", flexShrink:0 }}>
                    {h.time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop:"52px", borderTop:"1px solid #111", paddingTop:"18px", textAlign:"center" }}>
          <div style={{ fontSize:"9px", color:"#444", letterSpacing:"0.25em" }}>
            TRUTHGUARD · POWERED BY GROQ + LLAMA 3.3 · MULTI-SOURCE VERIFICATION
          </div>
        </div>
      </div>
    </div>
  );
}
