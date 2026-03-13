// netlify/functions/verify.js

const GROQ_KEY   = "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";
const TAVILY_KEY = "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";

exports.handler = async function (event, context) {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let claim;
  try {
    const body = JSON.parse(event.body || "{}");
    claim = body.claim;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  if (!claim || typeof claim !== "string") {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid claim" }) };
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    // STEP 1: Web search with Tavily for real-time info
    let webContext = "";
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
        const snippets = results
          .slice(0, 6)
          .map(r => `SOURCE: ${r.url}\nTITLE: ${r.title}\nCONTENT: ${r.content}`)
          .join("\n\n---\n\n");
        webContext = searchData.answer
          ? `WEB SUMMARY: ${searchData.answer}\n\n---\n\n${snippets}`
          : snippets;
      }
    } catch (searchErr) {
      console.warn("Tavily search failed:", searchErr.message);
    }

    // STEP 2: Groq LLM analysis with web context
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

RESPOND ONLY with valid JSON, no markdown fences:
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
      : `Verify this claim: "${claim.trim()}"\n\n(No web results available — use training knowledge and flag uncertainty.)`;

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    const data = await groqRes.json();
    if (!groqRes.ok) throw new Error(data.error?.message || "Groq API error");

    const text = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse AI response");
    }

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    console.error("TruthGuard error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Verification failed" }),
    };
  }
};
