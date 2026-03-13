export const config = { path: "/api/verify" };

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { claim } = req.body;
  if (!claim || typeof claim !== "string") return res.status(400).json({ error: "Invalid claim" });

  const GROQ_KEY   = process.env.GROQ_API_KEY;
  const TAVILY_KEY = "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";

  if (!GROQ_KEY) return res.status(500).json({ error: "GROQ_API_KEY not configured" });

  try {
    // STEP 1: Search the web for current info using Tavily
    let webContext = "";
    if (TAVILY_KEY) {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: TAVILY_KEY,
            query: claim,
            max_results: 6,
            search_depth: "advanced",
            include_answer: true,
          }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const results = searchData.results || [];
          webContext = results
            .slice(0, 6)
            .map(r => `SOURCE: ${r.url}\nTITLE: ${r.title}\nCONTENT: ${r.content}`)
            .join("\n\n---\n\n");
          if (searchData.answer) {
            webContext = `WEB SUMMARY: ${searchData.answer}\n\n---\n\n` + webContext;
          }
        }
      } catch (searchErr) {
        console.warn("Tavily search failed:", searchErr.message);
      }
    }

    // STEP 2: Ask Groq to analyse claim using live web results
    const today = new Date().toDateString();
    const SYSTEM_PROMPT = `You are TruthGuard, an elite AI fact-checking agent with access to real-time web search results.

Today's date is ${today}. Use this to assess whether info is current.

CORE RULES:
1. Prioritize the web search results provided — they contain CURRENT, UP-TO-DATE information from today.
2. Only mark TRUE if trusted sources in the search results confirm the claim.
3. Only mark FALSE if trusted sources explicitly contradict it.
4. Mark UNVERIFIED if results are unclear, mixed, or from untrusted sources only.
5. NEVER guess or invent facts. Be strictly evidence-based.
6. For recent events (elections, deaths, sports results, announcements), rely entirely on the web results.

TRUSTED SOURCE TIERS:
- Tier 1: Reuters, Associated Press, BBC
- Tier 2: Bloomberg, The Guardian, NY Times, Washington Post, WSJ
- Tier 3: CNN, NBC News, ABC News, NPR, CBS News
- Official: Government websites (.gov), WHO, UN, CDC

RESPOND ONLY with valid JSON — no markdown, no extra text:
{
  "claim": "rewritten claim as a clear statement",
  "verdict": "TRUE" | "FALSE" | "UNVERIFIED",
  "confidence": "High" | "Medium" | "Low",
  "claim_type": "death" | "event" | "political" | "health" | "quote" | "general",
  "explanation": "2-3 sentence explanation citing specific sources found in the web results",
  "sources": [
    { "name": "Source Name", "tier": "TIER1"|"TIER2"|"TIER3"|"OFFICIAL"|"UNTRUSTED", "relevance": "what this source said about the claim" }
  ],
  "search_queries_used": ["the claim as searched"],
  "breaking_news": true|false
}`;

    const userMessage = webContext
      ? `Verify this claim: "${claim.trim()}"\n\nWEB SEARCH RESULTS (current as of today):\n${webContext}`
      : `Verify this claim: "${claim.trim()}"\n\n(No web search results available — use your training knowledge and be honest about uncertainty.)`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_tokens: 1000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq API error");

    const text = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse AI response");
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("TruthGuard error:", err);
    return res.status(500).json({ error: err.message || "Verification failed" });
  }
}
