Alright Uthman, I've got everything I need. Let me lay out the full picture. No docs, no files — just the strategy straight to you.

---

**THE RECEPTIONIST AI AGENT — "AMARA" (or whatever Nigerian name you pick)**

**What she does:**
- Answers customer enquiries via chat, email, WhatsApp, Telegram
- Handles real-time voice calls (separate voice module)
- Books appointments via Google Calendar/Calendly
- Routes complex messages to the right human
- Collects lead info from new contacts
- Tone adapts per client brand (configurable in settings)
- English only for now

**How she works technically:**

```
VOICE PATH:
Incoming call → Deepgram (speech-to-text, cheap) 
    → FastAPI processes intent 
    → LLM generates response 
    → OpenAI TTS or ElevenLabs (text-to-speech) 
    → Voice back to caller

TEXT PATH:
Message arrives (WhatsApp/Email/Telegram/Web chat) 
    → Webhook hits FastAPI 
    → LLM processes with agent config 
    → Executes action (reply, book, route, collect info) 
    → Logs to Supabase 
    → Dashboard updates
```

**The client gets to choose:** Voice, text, or both. Toggle in settings. Each channel is a module they activate.

---

**PLAN 1: OVERALL TECHNICAL PLAN**

**Stack confirmed:**
- Frontend: React (Vite) → deployed on Vercel
- Backend: FastAPI (Python) → deployed on Railway
- Database + Auth: Supabase
- LLM: Claude API (Haiku for testing, Sonnet for production)
- Voice STT: Deepgram (~$0.0043/min — very cheap)
- Voice TTS: OpenAI TTS ($0.015/1K chars) or ElevenLabs ($5/mo starter)
- Telephony: Twilio (for actual phone calls, ~$0.013/min)
- WhatsApp: Twilio WhatsApp Business API or Meta Cloud API (free tier)
- Email: SendGrid or Resend (free tiers available)
- Telegram: Telegram Bot API (free)
- Booking: Google Calendar API + Calendly API
- Real-time: WebSockets for the live chat widget

**FastAPI Backend Structure:**

```
/api
  /auth          → Supabase auth proxy
  /agents        → CRUD for AI employees
  /agents/{id}/config  → system prompt, tone, tools, channels
  /chat          → text message handler (all channels route here)
  /voice         → voice call handler (Twilio webhook)
  /voice/tts     → text-to-speech endpoint
  /bookings      → calendar integration
  /leads         → lead collection & storage
  /logs          → agent activity logs
  /integrations  → connect WhatsApp, email, Telegram, etc.
  /webhooks      → incoming from Twilio, Telegram, WhatsApp
```

**Supabase Schema:**

```
users           → client accounts
organizations   → client's business info
agents          → AI employees (name, role, system_prompt, voice_config, status)
agent_channels  → which channels each agent is active on
conversations   → threaded message history per contact
messages        → individual messages (text + voice transcripts)
leads           → collected contact info
bookings        → appointment records
agent_logs      → activity feed (what agent did, when, result)
integrations    → API keys, connected accounts per org
```

**Build Order (full build, no MVP shortcuts):**

1. Supabase schema + auth
2. FastAPI core + agent engine (the loop)
3. Text channels — web chat widget first, then WhatsApp, email, Telegram
4. Voice module — Deepgram STT + OpenAI TTS + Twilio telephony
5. Booking integration — Google Calendar + Calendly
6. Lead collection logic
7. Message routing logic
8. React dashboard (runs parallel — see UI plan)
9. Connect everything, test
10. Deploy

**Cost breakdown for testing ($20 budget):**

- Claude Haiku API: ~$2-3 for heavy testing
- Deepgram: free tier covers 12K minutes
- OpenAI TTS: ~$2-3 for testing
- Twilio: ~$1 for a number + a few test calls
- Everything else: free tiers
- Total: well under $20

---

**PLAN 2: MESA AI UI PLAN**

**Brand: Mesa AI Service — mesa.ai**

**Design direction:**
- Dark mode base (deep charcoal/near-black, not pure black)
- Vibrant accents — think electric teal, warm amber, or vivid purple as your primary accent against the dark. One accent colour, used sparingly
- Minimalist, compartmentalised layout — clear boxes/cards for each section
- No clutter. Every element earns its place
- Interactive touches: smooth transitions, subtle hover states, micro-animations on status changes (agent goes active → gentle pulse)

**Dashboard Layout (what the client sees):**

```
┌─────────────────────────────────────────────────┐
│  MESA AI          [Search bar]      [Settings]  │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│ SIDEBAR  │  MAIN AREA                           │
│          │                                      │
│ ○ Home   │  ┌─────────┐ ┌─────────┐            │
│ ○ Agents │  │ AMARA   │ │ TUNDE   │            │
│ ○ Inbox  │  │ Active ●│ │ Paused ○│            │
│ ○ Leads  │  │ 47 msgs │ │ 12 msgs │            │
│ ○ Books  │  └─────────┘ └─────────┘            │
│ ○ Stats  │                                      │
│          │  RECENT ACTIVITY                      │
│          │  ─────────────────                    │
│          │  Amara replied to 3 WhatsApp msgs     │
│          │  Amara booked appointment for 2pm     │
│          │  Tunde collected lead: John Doe        │
│          │                                      │
├──────────┴──────────────────────────────────────┤
│  Mesa AI Service        © 2025                  │
└─────────────────────────────────────────────────┘
```

**Key Pages:**

- **Home** — overview cards for each agent, activity feed, quick stats
- **Agents** — list of AI employees, click to configure (system prompt, tone, channels, voice on/off)
- **Inbox** — unified view of all messages across all channels. Search bar here. Filter by agent, channel, date
- **Leads** — table of collected contacts with status
- **Bookings** — calendar view of appointments booked by agents
- **Stats** — messages handled, response times, bookings made, leads collected

**Interactive elements that keep it interesting:**
- Agent cards have a subtle breathing animation when active
- Channel icons light up based on what's connected
- Real-time message feed (WebSocket) — messages appear live
- Click any agent → slide-out panel with config, no page reload
- Voice calls show a live waveform visualiser when active
- Dark/light toggle (dark default, but give the option)

**What to hand a UI developer:**

Give them: the layout above, the colour direction (dark + one vibrant accent), the page list, and tell them — compartmentalised cards, clean spacing, no decoration for decoration's sake. Reference apps: Linear, Vercel Dashboard, Raycast. That's the energy.

---

That's everything Uthman. Two plans locked. You've got the full technical architecture and the UI direction for Mesa AI. Go to the meeting tomorrow, hear what she needs, come back and tell me — I'll map her specific automations to agents and you start building. Anything you want me to go deeper on right now?
