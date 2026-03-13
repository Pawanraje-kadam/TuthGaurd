// netlify/functions/verify.js
// Netlify Serverless Function — Groq key is safe here, never exposed to users

export default async (req, context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let claim;
  try {
    const body = await req.json();
    claim = body.claim;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!claim || typeof claim !== "string") {
    return new Response(JSON.stringify({ error: "Invalid claim" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Best FREE Groq model: llama-3.3-70b-versatile
  // 70B parameters · 128k context · 14,400 free requests/day · ~2s response
  const GROQ_API_KEY = "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";
  const MODEL = "llama-3.3-70b-versatile";

  const SYSTEM_PROMPT = `You are TruthGuard, an elite AI fact-checking agent. Your mission: verify whether a claim is TRUE, FALSE, or UNVERIFIED.

CORE RULES:
1. Never trust a single source — require cross-verification.
2. Only rely on trusted, credible sources: Reuters, BBC, AP News, Bloomberg, The Guardian, NYT, official government websites (.gov), WHO, UN.
3. Ignore random blogs, unknown websites, and unverified social media.
4. If no trusted source confirms the claim, mark it UNVERIFIED.
5. Never guess or invent facts — be strictly evidence-based.
6. For deaths, major events, or breaking news, require major news confirmation.

TRUSTED SOURCE TIERS:
- Tier 1 (Highest): Reuters, Associated Press, BBC
- Tier 2 (High): Bloomberg, The Guardian, NY Times, Washington Post, WSJ
- Tier 3 (Good): CNN, NBC News, ABC News, NPR, CBS News
- Official: Government websites, WHO, UN, CDC

RESPONSE FORMAT — respond ONLY with valid JSON, no markdown fences:
{
  "claim": "rewritten claim as a clear statement",
  "verdict": "TRUE" | "FALSE" | "UNVERIFIED",
  "confidence": "High" | "Medium" | "Low",
  "claim_type": "death" | "event" | "political" | "health" | "quote" | "general",
  "explanation": "2-3 sentence evidence-based explanation",
  "sources": [
    { "name": "Source Name", "tier": "TIER1"|"TIER2"|"TIER3"|"OFFICIAL"|"UNTRUSTED", "relevance": "brief note" }
  ],
  "search_queries_used": ["query1", "query2"],
  "breaking_news": true|false
}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Verify this claim: "${claim.trim()}"` },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    const text = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("Could not parse AI response");
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("TruthGuard error:", err);
    return new Response(JSON.stringify({ error: err.message || "Verification failed" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};

export const config = {
  path: "/api/verify",
};
