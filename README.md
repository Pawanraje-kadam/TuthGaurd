<div align="center">

```
████████╗██████╗ ██╗   ██╗████████╗██╗  ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║╚══██╔══╝██║  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
   ██║   ██████╔╝██║   ██║   ██║   ███████║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
   ██║   ██╔══██╗██║   ██║   ██║   ██╔══██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
   ██║   ██║  ██║╚██████╔╝   ██║   ██║  ██║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
```

### ⚡ AI-Powered Fact-Checking Agent with Real-Time Web Search

![Live](https://img.shields.io/badge/STATUS-LIVE-00ff9d?style=for-the-badge&labelColor=0d0d0d)
![Groq](https://img.shields.io/badge/AI-GROQ%20%2B%20LLAMA%203.3-7c3aed?style=for-the-badge&labelColor=0d0d0d)
![Tavily](https://img.shields.io/badge/SEARCH-TAVILY-0369a1?style=for-the-badge&labelColor=0d0d0d)
![React](https://img.shields.io/badge/FRONTEND-REACT%20%2B%20VITE-61dafb?style=for-the-badge&labelColor=0d0d0d)
![Netlify](https://img.shields.io/badge/HOSTED-NETLIFY-00c7b7?style=for-the-badge&labelColor=0d0d0d)
![Free](https://img.shields.io/badge/COST-FREE-00ff9d?style=for-the-badge&labelColor=0d0d0d)

**Submit any claim. TruthGuard searches the web in real-time, cross-verifies trusted sources, and delivers a verdict.**

[🌐 Live Demo](https://taupe-souffle-3e5e33.netlify.app) · [📁 Project Files](#-project-structure) · [🚀 How to Deploy](#-deployment)

</div>

---

## 🛡️ What is TruthGuard?

TruthGuard is a full-stack AI fact-checking web app. Unlike regular AI chatbots that guess from outdated training data, TruthGuard **actually searches the internet** before every verification — meaning it can fact-check today's news, recent events, and breaking stories **accurately**.

> **Example:** Ask *"Did India win the cricket World Cup?"* and TruthGuard will search live news, find the answer from Reuters/BBC/AP, and give you a sourced verdict — not a guess.

---

## ✨ Features

- 🔍 **Real-time web search** via Tavily — searches the internet before every fact-check
- 🤖 **Groq AI (Llama 3.3 70B)** — ultra-fast AI analysis of search results
- ⚖️ **3-tier verdict system** — TRUE / FALSE / UNVERIFIED with confidence level
- 📰 **Trusted source tiers** — Reuters, BBC, AP ranked above tabloids and blogs
- ⚡ **Breaking news detection** — flags claims about very recent events
- 📱 **Fully mobile responsive** — works perfectly on phones and tablets
- 🕓 **Verification history** — last 5 checks saved in session
- 🔒 **Secure by design** — API keys never exposed to the browser

---

## ⚙️ How It Works

```
User submits claim
       │
       ▼
┌─────────────────────┐
│   React Frontend    │  ← App.jsx — the UI
│   (Browser)         │
└────────┬────────────┘
         │  POST /api/verify
         ▼
┌─────────────────────┐
│  Netlify Function   │  ← verify.js — the brain (server-side)
│  (Server)           │
└────────┬────────────┘
         │
         ├──► 🔍 Tavily API  →  searches web for current info
         │
         ├──► 🤖 Groq AI     →  analyses results + determines verdict
         │
         ▼
┌─────────────────────┐
│   JSON Response     │  verdict + explanation + sources + confidence
└─────────────────────┘
         │
         ▼
   Displayed to user ✅
```

---

## 🧱 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + Vite | UI, components, state management |
| **Styling** | Inline CSS (monospace/hacker aesthetic) | Dark terminal theme |
| **Backend** | Netlify Serverless Functions | Secure API handler |
| **AI Model** | Groq — Llama 3.3 70B Versatile | Claim analysis & verdict |
| **Web Search** | Tavily API | Real-time internet search |
| **Hosting** | Netlify | Free hosting + auto-deploy from GitHub |
| **Runtime** | Node.js 18+ | Built-in `fetch`, no extra packages |

---

## 📁 Project Structure

```
truthguard/
├── src/
│   ├── App.jsx                 ← Entire React frontend (all components in one file)
│   └── main.jsx                ← React DOM entry point
│
├── netlify/
│   └── functions/
│       └── verify.js           ← 🔑 Backend API — Tavily search + Groq AI
│
├── public/                     ← Static assets
├── index.html                  ← App HTML shell
├── netlify.toml                ← Netlify build config + API redirects
├── vite.config.js              ← Vite bundler config
├── package.json                ← Dependencies (React, Vite)
└── .env.example                ← Example environment variables
```

---

## ⚖️ Verdict System

| Verdict | Meaning | When it's given |
|---------|---------|-----------------|
| ✅ **TRUE** | Confirmed | 2+ trusted Tier 1/2 sources confirm the claim |
| ❌ **FALSE** | Debunked | Trusted sources explicitly contradict the claim |
| ❓ **UNVERIFIED** | Unclear | No trusted source confirms or denies it |

### Confidence Levels

| Level | Bar | Meaning |
|-------|-----|---------|
| 🟢 **High** | 90% | Strong evidence from multiple top-tier sources |
| 🟡 **Medium** | 55% | Some evidence but not fully corroborated |
| 🔴 **Low** | 20% | Weak or conflicting signals |

---

## 📰 Trusted Source Tiers

TruthGuard ranks sources by credibility. Higher tiers carry more weight in the verdict.

```
🟢 TIER 1 — Highest Credibility
   Reuters · Associated Press (AP) · BBC

🔵 TIER 2 — High Credibility  
   Bloomberg · The Guardian · NY Times · Washington Post · WSJ · The Economist

🟣 TIER 3 — Good Credibility
   CNN · NBC News · ABC News · CBS News · NPR · Axios · Politico

🟡 OFFICIAL — Maximum Authority
   .gov websites · WHO · UN · CDC · FDA · European Commission

❌ UNTRUSTED — Ignored
   Random blogs · Unknown websites · Unverified social media posts
```

---

## 🔑 Key Files Explained

### `netlify/functions/verify.js` — The Brain
This is the most critical file. It runs **on Netlify's servers**, not in the browser — so API keys are completely hidden from users. Flow:
1. Receives the claim from the frontend
2. Calls **Tavily API** to search the web for current information
3. Passes search results to **Groq's Llama 3.3** for analysis
4. Returns structured JSON verdict to the frontend

### `src/App.jsx` — The Face
The complete React frontend in a single file. Contains:
- `useIsMobile()` — responsive layout hook
- `VerdictBadge` — TRUE/FALSE/UNVERIFIED display
- `ConfidenceMeter` — animated progress bar
- `SourceChip` — colour-coded source display
- `TypewriterText` — animated claim reveal
- Main `TruthGuard` component — all logic and state

### `netlify.toml` — The Router
Tells Netlify how to build and route requests:
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## 🚀 Deployment

This project is deployed on **Netlify** with **GitHub auto-deploy**.

### How to update the site

1. Go to your GitHub repo
2. Click the file you want to edit
3. Click the **pencil ✏️** icon
4. Make your changes
5. Click **"Commit changes"**
6. Netlify auto-deploys in **~2 minutes** ✅

### Environment / API Keys

Both keys are currently hardcoded in `netlify/functions/verify.js`. To rotate them:

| Key | Where to regenerate |
|-----|-------------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `TAVILY_API_KEY` | [app.tavily.com](https://app.tavily.com) → API Keys |

> ⚠️ Since the repo is **private**, hardcoded keys are reasonably safe. If you ever make it public, regenerate both keys first.

---

## 💰 Cost Breakdown

| Service | Cost | Notes |
|---------|------|-------|
| Netlify Hosting | **FREE** | 100GB bandwidth/month |
| GitHub Repo | **FREE** | Unlimited private repos |
| Groq AI | **FREE** | Generous free tier, extremely fast |
| Tavily Search | **FREE** | 1,000 searches/month |
| Custom Domain | ~$10/year | Optional — Netlify URL is free |
| **Total** | **$0/month** | 🎉 |

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| `GROQ_API_KEY not configured` | Hardcode key directly in `verify.js` — no env vars needed |
| `AGENT ERROR` on site | Groq key may be expired — regenerate at console.groq.com |
| Wrong answers on recent news | Tavily key may be invalid — check app.tavily.com dashboard |
| Build failed on Netlify | Make sure `verify.js` has **no** `import` statements at top |
| Site shows blank page | Netlify → Deploys → click latest build → View logs |
| Changes not appearing | Wait 2 min after committing — Netlify is rebuilding |
| Slow response (5-10 sec) | Normal — Tavily search + Groq AI both need time |

---

## 📸 UI Preview

```
┌─────────────────────────────────────────────────┐
│  [T] TRUTHGUARD          ● WEB SEARCH ON        │
├─────────────────────────────────────────────────┤
│                                                 │
│         Is it TRUE or FALSE?                    │
│   Submit any claim. TruthGuard searches         │
│   the web and cross-verifies evidence.          │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ ● CLAIM INPUT                             │  │
│  │                                           │  │
│  │  Enter a claim to verify...               │  │
│  │                                    VERIFY │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  EXAMPLES:                                      │
│  [Is Elon Musk the richest?] [Did NASA find...] │
│                                                 │
│  ┌─ ✓ TRUE ──────────────────── general ──────┐ │
│  │ VERIFIED CLAIM                              │ │
│  │ "..."                                       │ │
│  │ ANALYSIS                                    │ │
│  │ Based on Reuters and BBC reports...         │ │
│  │ Confidence ████████████████░░░ High         │ │
│  │ SOURCES: ● Reuters  ● BBC  ● AP News        │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 🗺️ Roadmap

- [ ] Add more example claims covering sports, science, politics
- [ ] Multi-language support
- [ ] Share verdict as image/card
- [ ] Claim history saved across sessions
- [ ] Batch verify multiple claims at once

---

<div align="center">

**TRUTHGUARD · POWERED BY GROQ + LLAMA 3.3 · WEB SEARCH ENABLED**

*Because truth matters.*

</div>
