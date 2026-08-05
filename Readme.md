# Build prompt — Beesz founder-onboarding prototype

Paste everything below into your coding agent (Claude Code, Cursor, etc.) as one message.

---

## Role

You are building a working prototype of a conversational onboarding flow for **Beesz**, a "founder OS" platform. This needs to be good enough to demo live to stakeholders/investors — real LLM calls, real (if lightweight) data capture, no fake hardcoded chat script. Treat this as a real feature build, not a mockup.

## What Beesz is

Beesz is an all-in-one operating system for founders — it runs sourcing, sales tracking, ad management, customer support, and CRM follow-up through a set of AI agents ("worker bees"), so a solo founder can run a company like they have a full team. Founders on the platform span many industries (fashion/D2C, spiritual/puja goods, SaaS, food, beauty, and more), each slotted into a category with tailored workflows.

The brand metaphor: founders are the best worker bees; Beesz gives them a hive of AI agents to work alongside. This should show up in tone (warm, a little cheeky, never corporate) and in visual language (honeycomb motifs), but never in a way that makes the product feel like a gimmick over substance.

## What we're building

A first-login onboarding **chat experience**, replacing a signup form. Goals, in order:

1. Get the founder talking in their own words about what they're building.
2. Reflect back an accurate, specific read of their business (industry, likely competitors/comparable playbook, typical bottlenecks) — sourced from a **real web search**, not a hardcoded guess — so it feels genuinely observant, not templated.
3. Let them correct/refine that read — capture what makes them different.
4. Pitch the relevant Beesz agents for their situation specifically (not a generic feature list).
5. Ask 2–3 industry-tuned follow-up questions that produce real product-config data (their sourcing model, current sales channel, current tooling).
6. Prompt them to connect their store/CRM/data source.
7. End by summarizing the founder's profile back to them and handing off into the main app (a stub dashboard route is fine).

## Non-negotiable: this must be LLM-driven, not scripted

Do **not** hardcode the conversation as a fixed script with keyword-matching, like a quick static demo would. Instead:

- The conversation is driven by a system-prompted agent with **tool calling**. The model decides what to say next within a defined stage structure (below), not a rigid line-by-line script.
- Provide a clean abstraction so the LLM provider is swappable — a single `callModel(messages, tools)` function/service that I can point at Anthropic, OpenAI, or others via env var (`LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`). Don't hardcode one vendor's SDK into the UI layer.
- Any API key usage must go through a lightweight backend/serverless route, never exposed client-side.

## Conversation stages (guide the model, don't rigidly script it)

Encode these as a stage machine the agent tracks (e.g. in a `stage` field returned alongside each response, or via a `advance_stage` tool call), so the UI (hive progress meter, described below) always knows where it is:

1. `opening` — "what are you building?" (free text)
2. `mirror` — reflect their business back, referencing real competitors/comparable businesses pulled from a live search, in a specific and slightly provocative way ("sounds like the usual [X] playbook — sourcing, a Shopify/Instagram store, running ads"). Offer a way to agree or push back.
3. `differentiate` — if they push back, capture their stated differentiator verbatim into their profile.
4. `pitch` — recommend 2–4 specific Beesz agents (sourcing/sales/ads/support/etc.) tailored to what they said, not a static list.
5. `discovery` — 2–3 targeted follow-up questions specific to their industry and stated situation (sourcing model, current channel, current tools/CRM).
6. `connect` — prompt to connect a data source (store/CRM). For the prototype, a mocked OAuth-style button is fine — no real integration needed.
7. `complete` — summarize captured profile, show completion state, hand off.

## Required tools/functions for the agent

Give the model real tool access (Anthropic tool-use / OpenAI function-calling format):

- `search_web(query)` — real web search, used in the `mirror` stage to find actual comparable businesses/competitors for whatever the founder described. This is the part that must not be faked — the "wow, it actually looked this up" moment is the core of the pitch.
- `classify_industry(text)` — returns a structured category + confidence from the model's own reasoning (not a keyword dictionary).
- `save_founder_profile(fields)` — persists structured fields as they're captured: `industry`, `raw_description`, `differentiator`, `sourcing_model`, `current_channel`, `current_tools`, `wants_to_connect_data` (bool).
- `advance_stage(stage_name)` — moves the conversation state machine forward.

For the prototype, persistence can be as simple as a JSON file, SQLite, or an in-memory store keyed by session — just make it real enough that the captured profile can be inspected/demoed afterward (e.g. a `/debug/profile` view), since a stakeholder will want to see "here's the structured data this produced."

## System prompt for the onboarding agent (use as a starting point, refine as needed)

```
You are the onboarding voice of Beesz, a founder operating system. Your job in this
conversation is to get a new founder talking about their business, reflect back an
accurate and specific read of their situation (using real web search — never invent
competitor names), let them correct you, and capture structured data about their
business as you go.

Tone: warm, direct, a little playful, never corporate, never sycophantic. Short
sentences. You're impressed by specifics, not by hype.

Rules:
- Never invent facts about competitors or the market — always use the search tool
  before making a comparative claim.
- Always call save_founder_profile as soon as you learn a new fact, don't wait
  until the end.
- Keep each message short — this is a chat, not an essay.
- Follow the stage order (opening -> mirror -> differentiate -> pitch -> discovery
  -> connect -> complete) but let the founder's answers shape specifics within
  each stage.
- If the founder's business doesn't fit a category cleanly, say so honestly
  rather than forcing a fit.
```

## UI / design requirements

Carry over the visual language from the earlier static prototype (attach it as a reference if available, or use this spec):

- Dark warm palette: bg `#15130E`, surface `#1E1A13`, honey `#F2A93B`, deep honey `#C97D1F`, text `#F3EDE1`, muted `#8F8570`, growth-green accent `#6FCF97` used sparingly at completion only.
- Fraunces (serif, display/bot voice) + Inter (body/chat) + JetBrains Mono (data labels/tags).
- Signature element: a small honeycomb in the header that fills in cell-by-cell as each stage completes — literal progress, not a generic bar.
- Typing indicator, smooth message rise-in, choice-chip buttons for binary/multi-choice moments, free-text input otherwise.
- Fully responsive down to mobile width.

## Tech stack (adjust if you have a preference, otherwise default to this)

- Frontend: React + Vite (or Next.js if you want the backend route in the same app), Tailwind for utility styling with the above design tokens as CSS variables.
- Backend: a minimal Node/Express (or Next.js API routes) layer that owns the LLM key, exposes `/api/chat` (streams model responses + tool calls) and `/api/profile/:sessionId` (for the debug view).
- Storage: SQLite or lowdb/JSON file — whatever is fastest to stand up; this is a prototype, not production infra.

## Deliverables

1. Working app, runnable with `npm install && npm run dev`, with a clear `.env.example` showing which vars to set (`LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, optional search API key).
2. A short README explaining how to plug in an LLM provider and a search provider.
3. A `/debug/profile/:sessionId` view (or similar) showing the structured JSON captured during onboarding — this is what proves to stakeholders that the conversation produces real usable data, not just a nice chat transcript.
4. Graceful fallback behavior if the model or search call fails mid-conversation (never a raw error dumped in the chat).

## Acceptance criteria

- A founder can describe any kind of business in free text and get back a competitor/comparable-business reflection that is actually sourced from a live search, not invented.
- The founder can disagree with the reflection and have their stated differentiator show up verbatim in the saved profile.
- The hive progress indicator visibly advances in sync with real stage transitions from the model, not a fixed timer.
- The final saved profile JSON contains: industry, raw description, differentiator, sourcing model, current channel, current tools, and whether they opted to connect a data source.
- The whole flow completes in under 90 seconds of a stakeholder's time when demoed live.