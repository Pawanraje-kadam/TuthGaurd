// netlify/functions/verify.js

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const reply = (statusCode, obj) => ({
  statusCode,
  headers: CORS,
  body: JSON.stringify(obj),
});

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return reply(405, { error: "Method not allowed" });

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!GROQ_API_KEY) return reply(500, { error: "GROQ_API_KEY is not set in environment variables" });

  let claim;
  try {
    claim = JSON.parse(event.body || "{}").claim;
  } catch {
    return reply(400, { error: "Invalid JSON body" });
  }
  if (!claim || typeof claim !== "string") return reply(400, { error: "Invalid claim" });

  try {
    // STEP 1: Tavily web search
    let webContext = "";
    if (!TAVILY_API_KEY) {
      console.warn("TAVILY_API_KEY missing, skipping web search");
    } else {
      try {
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${TAVILY_API_KEY}`,
          },
          body: JSON.stringify({
            query: claim,
            max_results: 5,
            search_depth: "basic", // faster, avoids function timeout
            include_answer: true,
          }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const snippets = (searchData.results || [])
            .map(r => `SOURCE: ${r.url}\nTITLE: ${r.title}\nCONTENT: ${r.content}`)
            .join("\n\n---\n\n");
          webContext = searchData.answer
            ? `WEB SUMMARY: ${searchData.answer}\n\n---\n\n${snippets}`
            : snippets;
        } else {
          console.warn("Tavily error:", searchRes.status, await searchRes.text());
        }
      } catch (e) {
        console.warn("Tavily search failed:", e.message);
      }
    }

    // STEP 2: Groq analysis
    const today = new Date().toDateString();
    const SYSTEM_PROMPT = `You are TruthGuard, an elite AI fact-checking agent with real-time web search results.

Today's date is ${today}.

CORE RULES:
1. Use the web search results to fact-check with current, up-to-date information.
2. Only mark TRUE if trusted sources in the results confirm the claim.
3. Only mark FALSE if trusted sources explicitly contradict it.
4. Mark UNVERIFIED if unclear or only untrusted sources found.
5. Never guess or invent facts.

TRUSTED SOURCE TIERS:
- Tier 1: Reuters, Associated Press, BBC
- Tier 2: Bloomberg, The Guardian, NY Times, Washington Post, WSJ
- Tier 3: CNN, NBC News, ABC News, NPR, CBS News
- Official: .gov websites, WHO, UN, CDC

RESPOND ONLY with valid JSON:
{
  "claim": "rewritten claim as a clear statement",
  "verdict": "TRUE" | "FALSE" | "UNVERIFIED",
  "confidence": "High" | "Medium" | "Low",
  "claim_type": "death" | "event" | "political" | "health" | "quote" | "general",
  "explanation": "2-3 sentences citing sources from the web results",
  "sources": [
    { "name": "Source Name", "tier": "TIER1"|"TIER2"|"TIER3"|"OFFICIAL"|"UNTRUSTED", "relevance": "what this source said" }
  ],
  "search_queries_used": ["query used"],
  "breaking_news": true|false
}`;

    const userMessage = webContext
      ? `Verify this claim: "${claim.trim()}"\n\nWEB SEARCH RESULTS:\n${webContext}`
      : `Verify this claim: "${claim.trim()}"\n\n(No web results available. Use training knowledge and flag uncertainty.)`;

const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    max_tokens: 2500,          // room for reasoning + the JSON answer
    reasoning_effort: "low",   // less thinking, faster, fewer cut-off answers
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  }),
});

    const data = await groqRes.json();
    if (!groqRes.ok) {
      throw new Error(`Groq ${groqRes.status}: ${data.error?.message || "API error"}`);
    }

    const text = data.choices?.[0]?.message?.content || "";
    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse AI response");
      parsed = JSON.parse(match[0]);
    }

    return reply(200, parsed);
  } catch (err) {
    console.error("TruthGuard error:", err);
    return reply(500, { error: err.message || "Verification failed" });
  }
};
