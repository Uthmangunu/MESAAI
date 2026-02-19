-- Mesa AI — Supabase Schema
-- Run this in the Supabase SQL editor on a fresh project.
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Organizations (tenants) ────────────────────────────────────────────────
CREATE TABLE organizations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Users ──────────────────────────────────────────────────────────────────
-- Note: id must match the Supabase auth.users id
CREATE TABLE users (
  id                UUID PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  organization_id   UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AI Employee Types (product catalog) ────────────────────────────────────
CREATE TABLE employee_types (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT NOT NULL,          -- 'receptionist', 'sales_rep'
  description         TEXT,
  base_system_prompt  TEXT,
  price_monthly       INTEGER NOT NULL,       -- in pence (GBP)
  stripe_price_id     TEXT,
  capabilities        JSONB DEFAULT '[]',     -- ['voice','whatsapp','email','booking']
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: AI Receptionist
INSERT INTO employee_types (name, description, base_system_prompt, price_monthly, capabilities)
VALUES (
  'receptionist',
  'A professional AI receptionist that handles enquiries, books appointments, and collects leads.',
  'You are a professional AI receptionist. Handle all inbound enquiries warmly and efficiently.',
  0, -- price_monthly set to 0 until Stripe price is configured
  '["voice", "whatsapp", "instagram", "email", "telegram", "booking"]'
);

-- ─── Agents (AI employee instances per org) ──────────────────────────────────
CREATE TABLE agents (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_type_id        UUID NOT NULL REFERENCES employee_types(id),
  name                    TEXT NOT NULL,
  custom_system_prompt    TEXT,
  voice_config            JSONB DEFAULT '{}',
  status                  TEXT NOT NULL DEFAULT 'active', -- active | paused | cancelled
  stripe_subscription_id  TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agent Channels ──────────────────────────────────────────────────────────
CREATE TABLE agent_channels (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL,       -- whatsapp | voice | email | telegram | web
  is_enabled  BOOLEAN DEFAULT FALSE,
  config      JSONB DEFAULT '{}',  -- phone numbers, webhook urls, etc.
  UNIQUE(agent_id, channel)
);

-- ─── Conversations ───────────────────────────────────────────────────────────
CREATE TABLE conversations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  contact_phone   TEXT,
  contact_email   TEXT,
  contact_name    TEXT,
  channel         TEXT,           -- whatsapp | voice | email | telegram | web
  status          TEXT DEFAULT 'open',  -- open | escalated | closed
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Messages ────────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role              TEXT NOT NULL,   -- user | assistant
  content           TEXT,
  channel           TEXT,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id          UUID REFERENCES agents(id),
  name              TEXT,
  phone             TEXT,
  email             TEXT,
  notes             TEXT,
  status            TEXT DEFAULT 'new',  -- new | contacted | qualified | converted
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Bookings ────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id            UUID NOT NULL REFERENCES agents(id),
  conversation_id     UUID REFERENCES conversations(id),
  calendar_event_id   TEXT,    -- Google Calendar event ID
  calendly_event_id   TEXT,    -- Calendly event ID
  scheduled_at        TIMESTAMPTZ,
  attendee_name       TEXT,
  attendee_email      TEXT,
  attendee_phone      TEXT,
  status              TEXT DEFAULT 'confirmed',  -- pending | confirmed | cancelled
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Agent Activity Logs ─────────────────────────────────────────────────────
CREATE TABLE agent_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  action      TEXT,   -- replied | booked | collected_lead | escalated | routed
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Organization Integrations ───────────────────────────────────────────────
CREATE TABLE integrations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,  -- google_calendar | calendly | whatsapp | instagram | email
  credentials       JSONB DEFAULT '{}',
  is_connected      BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, type)
);

-- ─── Knowledge Base ──────────────────────────────────────────────────────────
-- Two scopes: organization-wide (agent_id IS NULL) or agent-specific (agent_id set)
CREATE TABLE knowledge_base (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id          UUID REFERENCES agents(id) ON DELETE CASCADE,  -- NULL = org-wide
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  category          TEXT,  -- faq | services | pricing | policies | other
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_channels   ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base   ENABLE ROW LEVEL SECURITY;
-- Note: All DB access from the backend uses the service role key which bypasses RLS.
-- RLS policies are here as a safety net for direct Supabase client access.

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_bookings_org ON bookings(organization_id);
CREATE INDEX idx_agent_logs_agent ON agent_logs(agent_id);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at DESC);
CREATE INDEX idx_knowledge_base_org ON knowledge_base(organization_id);
CREATE INDEX idx_knowledge_base_agent ON knowledge_base(agent_id);
