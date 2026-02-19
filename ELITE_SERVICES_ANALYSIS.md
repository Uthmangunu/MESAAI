# Elite Services - Custom Employee Implementation Analysis

**Client**: Elite Services (London Cleaning Company)
**Product**: Bespoke Lead-Gen AI Assistant
**Channels**: Facebook Messenger + Instagram DMs
**Pricing Model**: Setup Fee + £80/month (vs. standard £29/month)

---

## 1. ARCHITECTURE REQUIREMENTS

### 1.1 What Makes This "Custom"?

Elite Services needs features beyond the standard Mesa AI receptionist:

| **Feature** | **Standard Receptionist** | **Elite Services Custom** |
|-------------|---------------------------|---------------------------|
| Conversation Flow | Linear Q&A | **5 branching paths** based on service type |
| Lead Scoring | Basic capture | **1-10 scoring algorithm** with HOT tagging (7+) |
| Data Collection | Name, email, phone | **Service-specific fields** (20+ unique fields) |
| Integrations | Basic CRM | **Google Sheets/Airtable** + email notifications |
| Channels | All channels | **Facebook/Instagram only** (specialized) |
| Human Handover | Manual escalation | **Automated routing** based on lead score |

### 1.2 New Database Schema Requirements

We need to extend the current Mesa AI architecture with these new tables:

```sql
-- ─── Custom Employee Types Configuration ────────────────────────────────
CREATE TABLE employee_type_configs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_type_id      UUID NOT NULL REFERENCES employee_types(id),
  config_type           TEXT NOT NULL,  -- 'conversation_flow' | 'lead_scoring' | 'data_fields'
  config_data           JSONB NOT NULL,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Conversation Flows (Branching Logic) ───────────────────────────────
CREATE TABLE conversation_flows (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_type_id      UUID NOT NULL REFERENCES employee_types(id),
  flow_name             TEXT NOT NULL,  -- 'office_cleaning' | 'end_of_tenancy' etc
  flow_definition       JSONB NOT NULL,
  -- Example structure:
  -- {
  --   "trigger": {"service_type": "office_cleaning"},
  --   "steps": [
  --     {"question": "What's the postcode?", "field": "postcode", "validation": "uk_postcode"},
  --     {"question": "Business name?", "field": "business_name"},
  --     ...
  --   ]
  -- }
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Lead Scoring Configuration ─────────────────────────────────────────
CREATE TABLE lead_scoring_rules (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_type_id      UUID NOT NULL REFERENCES employee_types(id),
  rule_name             TEXT NOT NULL,
  conditions            JSONB NOT NULL,
  -- Example: {"service_type": "office_cleaning", "frequency": "daily", "size": ">500m2"}
  score_adjustment      INTEGER NOT NULL,  -- +3, +5, etc.
  priority_threshold    INTEGER DEFAULT 7, -- 7+ = HOT lead
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Enhanced Leads Table (Extended Fields) ─────────────────────────────
ALTER TABLE leads ADD COLUMN service_type TEXT;
ALTER TABLE leads ADD COLUMN service_data JSONB DEFAULT '{}';  -- All service-specific fields
ALTER TABLE leads ADD COLUMN lead_score INTEGER DEFAULT 0;     -- 1-10 score
ALTER TABLE leads ADD COLUMN is_hot BOOLEAN DEFAULT FALSE;     -- Auto-tagged if score >= 7
ALTER TABLE leads ADD COLUMN urgency TEXT;                     -- '48h' | '7days' | '30days' | 'flexible'
ALTER TABLE leads ADD COLUMN source_channel TEXT;              -- 'facebook_messenger' | 'instagram_dm'
ALTER TABLE leads ADD COLUMN conversation_transcript TEXT;     -- Full conversation for review

-- ─── Integration Webhooks ────────────────────────────────────────────────
CREATE TABLE integration_webhooks (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id       UUID NOT NULL REFERENCES organizations(id),
  integration_type      TEXT NOT NULL,  -- 'google_sheets' | 'airtable' | 'email' | 'slack'
  webhook_url           TEXT,
  config                JSONB DEFAULT '{}',  -- API keys, sheet IDs, etc.
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for Performance ─────────────────────────────────────────────
CREATE INDEX idx_leads_score ON leads(lead_score DESC);
CREATE INDEX idx_leads_hot ON leads(is_hot) WHERE is_hot = TRUE;
CREATE INDEX idx_conversation_flows_type ON conversation_flows(employee_type_id);
```

---

## 2. API COSTS BREAKDOWN

### 2.1 Meta Graph API (Facebook/Instagram)

**What we need:**
- Facebook Pages API (for Messenger)
- Instagram Messaging API (for DMs)
- Webhook subscriptions for incoming messages

**Costs:**
- **FREE** for basic messaging (Meta Graph API)
- **Requirements:**
  - Facebook Business Manager account
  - Facebook App with Messenger/Instagram permissions
  - Webhook verification (free)

**Rate Limits:**
- 200 API calls/hour per user
- 4,800 API calls/day per app
- Should be sufficient for Elite Services (estimated <100 conversations/day)

### 2.2 Claude API (Anthropic)

**Current Mesa AI Usage:**
- Claude Haiku: $0.25 per 1M input tokens, $1.25 per 1M output tokens
- Claude Sonnet: $3 per 1M input tokens, $15 per 1M output tokens

**Elite Services Estimated Usage:**

Per conversation:
- Average conversation: 15-20 messages
- Average tokens per message: 150 input, 100 output
- Total per conversation: ~3,000 input tokens, ~2,000 output tokens

**Cost per conversation (using Sonnet for quality):**
- Input: 3,000 tokens × $3/1M = $0.009
- Output: 2,000 tokens × $15/1M = $0.03
- **Total: ~£0.029 per conversation**

**Monthly costs at different volumes:**
- 100 conversations/month: £2.90
- 500 conversations/month: £14.50
- 1,000 conversations/month: £29.00

**Profit margin on £80/month:**
- At 100 convos: £80 - £2.90 = **£77.10 profit (96% margin)**
- At 500 convos: £80 - £14.50 = **£65.50 profit (82% margin)**
- At 1,000 convos: £80 - £29.00 = **£51.00 profit (64% margin)**

### 2.3 Additional API Costs

| **Service** | **Purpose** | **Cost** |
|-------------|-------------|----------|
| Google Sheets API | Lead export | **FREE** (quota: 500 requests/100s) |
| SendGrid Email API | Lead notifications | **FREE** (100 emails/day) |
| Airtable API | Alternative CRM | **FREE** (5 requests/second) |
| Supabase Database | Data storage | **FREE tier** (500MB, 2GB bandwidth) |
| Meta Graph API | FB/IG messaging | **FREE** |

**Total Additional Costs: £0/month** (all free tiers sufficient)

### 2.4 Infrastructure Costs

| **Service** | **Purpose** | **Monthly Cost** |
|-------------|-------------|------------------|
| Railway (Backend) | FastAPI hosting | ~£5-10 |
| Vercel (Frontend) | React dashboard | **FREE** (hobby tier) |
| Supabase | Database + Auth | **FREE** (up to 500MB) |
| **TOTAL** | | **~£5-10/month** |

### 2.5 Total Cost Per Customer

**Elite Services Example:**
- Claude API (500 convos/month): £14.50
- Infrastructure (shared): ~£2 (if we have 5 custom clients)
- **Total COGS: ~£16.50/month**
- **Revenue: £80/month**
- **Profit: £63.50/month (79% margin)**

**Setup fee recommended: £200-500** (one-time for custom flow configuration)

---

## 3. WHAT NEEDS TO BE BUILT

### 3.1 Backend Changes (FastAPI)

#### **New API Endpoints:**

```python
# ─── Custom Employee Type Management ─────────────────────────────────────
POST   /api/employee-types/{id}/flows           # Create conversation flow
GET    /api/employee-types/{id}/flows           # List flows
PUT    /api/employee-types/{id}/flows/{flow_id} # Update flow
DELETE /api/employee-types/{id}/flows/{flow_id} # Delete flow

# ─── Lead Scoring Configuration ──────────────────────────────────────────
POST   /api/employee-types/{id}/scoring-rules   # Add scoring rule
GET    /api/employee-types/{id}/scoring-rules   # List rules
PUT    /api/employee-types/{id}/scoring-rules/{rule_id}
DELETE /api/employee-types/{id}/scoring-rules/{rule_id}

# ─── Enhanced Leads API ──────────────────────────────────────────────────
GET    /api/leads?is_hot=true                   # Filter HOT leads
GET    /api/leads/{id}/transcript               # Get conversation transcript
POST   /api/leads/{id}/export                   # Export to Google Sheets/Airtable

# ─── Integration Webhooks ────────────────────────────────────────────────
POST   /api/integrations/google-sheets          # Connect Google Sheets
POST   /api/integrations/airtable               # Connect Airtable
POST   /api/integrations/test-webhook           # Test integration
```

#### **Modified Core Engine:**

File: `backend/app/core/agent_engine.py`

**Changes needed:**
1. **Branching conversation logic** - Check service type and load appropriate flow
2. **Dynamic field collection** - Collect service-specific data based on flow
3. **Lead scoring calculation** - Score leads 1-10 based on configured rules
4. **HOT lead detection** - Auto-tag and notify when score >= 7
5. **Integration triggers** - Push to Google Sheets/Airtable on lead completion

#### **New Files to Create:**

```
backend/app/core/
  ├── conversation_flow_engine.py  # Handles branching flows
  ├── lead_scoring.py              # Lead scoring algorithm
  └── integrations/
      ├── google_sheets.py         # Google Sheets connector
      ├── airtable.py              # Airtable connector
      └── email_notifications.py   # SendGrid wrapper

backend/app/api/
  ├── conversation_flows.py        # Flow management endpoints
  ├── lead_scoring.py              # Scoring rules endpoints
  └── integrations.py              # Integration endpoints
```

### 3.2 Frontend Changes (React)

#### **New Pages:**

1. **Custom Employee Builder** (`/app/employees/custom/new`)
   - Service type selector (Office, FM, End-of-Tenancy, etc.)
   - Branching flow designer (drag-and-drop question builder)
   - Field configuration (what data to collect per service type)
   - Lead scoring rules builder
   - Preview mode (test the flow)

2. **Lead Management** (`/app/leads`)
   - Table with columns: Name, Service Type, Score, HOT badge, Urgency, Date
   - Filters: HOT only, Service type, Urgency, Date range
   - Conversation transcript modal (click to view full chat)
   - Export button (Google Sheets/Airtable)
   - Email notification settings

3. **Integrations Page** (`/app/integrations`)
   - Google Sheets connector (OAuth flow)
   - Airtable connector (API key input)
   - Email notification setup (SendGrid)
   - Test integration button
   - Webhook logs

#### **Modified Pages:**

- **Agents Page** - Add "Custom Employee" option when creating new agent
- **Dashboard** - Add "HOT Leads" widget showing high-priority leads

---

## 4. FACEBOOK/INSTAGRAM INTEGRATION

### 4.1 Meta Graph API Setup

**What Elite Services needs to provide:**
- Facebook Business Manager account
- Facebook Page (for Messenger)
- Instagram Business Account (linked to Facebook Page)
- Admin access to both

**What we build:**
1. **Facebook App** (in Meta Developer Portal)
   - Request permissions: `pages_messaging`, `instagram_basic`, `instagram_messaging`
   - Set up webhooks for incoming messages

2. **Webhook Endpoint** (`/api/webhooks/meta`)
   - Verify webhook challenge
   - Handle incoming messages
   - Send replies via Graph API

3. **OAuth Flow** (in Mesa AI dashboard)
   - "Connect Facebook" button
   - OAuth redirect to Meta
   - Store page access token in `integrations` table

### 4.2 Message Flow

```
User sends message on FB/IG
  ↓
Meta sends webhook to /api/webhooks/meta
  ↓
Extract: sender_id, message_text, channel (facebook|instagram)
  ↓
Call agent_engine.process_message()
  ↓
Agent determines service type, collects data via branching flow
  ↓
When complete, calculate lead score
  ↓
If HOT (score >= 7), trigger instant notification
  ↓
Export to Google Sheets/Airtable
  ↓
Send reply via Graph API
```

---

## 5. BUILD TIMELINE

### Phase 1: Database & Backend Core (1-2 weeks)
- [ ] Create new database tables (conversation_flows, lead_scoring_rules, etc.)
- [ ] Build conversation flow engine (branching logic)
- [ ] Build lead scoring algorithm
- [ ] Create API endpoints for flow management

### Phase 2: Meta Integration (1 week)
- [ ] Set up Meta Developer App
- [ ] Build webhook handler for FB Messenger
- [ ] Build webhook handler for Instagram DMs
- [ ] Implement Graph API reply sender
- [ ] Build OAuth flow for "Connect Facebook" button

### Phase 3: Data Integrations (1 week)
- [ ] Google Sheets connector (OAuth + API)
- [ ] Airtable connector (API key)
- [ ] Email notification system (SendGrid)
- [ ] Webhook testing interface

### Phase 4: Frontend UI (2 weeks)
- [ ] Custom Employee Builder page (flow designer)
- [ ] Lead Management page (table, filters, export)
- [ ] Integrations page (connect Google Sheets/Airtable)
- [ ] Lead scoring rules UI
- [ ] HOT leads dashboard widget

### Phase 5: Elite Services Configuration (1 week)
- [ ] Create "Elite Services Lead-Gen" employee type
- [ ] Configure 5 service-type flows:
  - Office/Commercial Cleaning
  - Facilities Management Support
  - End-of-Tenancy Clean
  - Airbnb Turnover Clean
  - Deep Clean (One-Off)
- [ ] Set up lead scoring rules (urgency + size + frequency)
- [ ] Configure tone of voice (UK English, friendly, professional)
- [ ] Test all flows end-to-end

### Phase 6: Testing & Deployment (1 week)
- [ ] Test FB Messenger integration
- [ ] Test Instagram DM integration
- [ ] Test lead scoring accuracy
- [ ] Test Google Sheets export
- [ ] Test email notifications
- [ ] Deploy to production
- [ ] Train Elite Services on dashboard

**Total Timeline: 7-8 weeks** (full-time development)

---

## 6. TECHNICAL CHALLENGES

### 6.1 Branching Conversation Flow Engine

**Challenge**: Standard agent_engine.py uses linear Q&A. Elite Services needs 5 different paths.

**Solution**:
1. Create `ConversationFlowEngine` class
2. Store flows as JSON in `conversation_flows` table
3. Track user's position in flow via `conversation_state` (stored in `conversations.metadata`)
4. Example state: `{"current_flow": "office_cleaning", "step": 3, "collected_data": {...}}`
5. On each message, load state, determine next question, update state

**Example flow definition:**
```json
{
  "flow_id": "office_cleaning",
  "steps": [
    {
      "id": "postcode",
      "question": "What's the postcode of the property?",
      "field": "postcode",
      "validation": "uk_postcode",
      "next": "business_name"
    },
    {
      "id": "business_name",
      "question": "What's the business name?",
      "field": "business_name",
      "next": "your_role"
    },
    // ... more steps
  ]
}
```

### 6.2 Lead Scoring Algorithm

**Challenge**: Calculate 1-10 score from multiple factors.

**Solution**:
```python
def calculate_lead_score(lead_data: dict, scoring_rules: list) -> int:
    score = 0

    # Base scores
    if lead_data.get('urgency') == 'within_48h':
        score += 3
    elif lead_data.get('urgency') == 'within_7days':
        score += 2

    # Service-specific scores
    if lead_data.get('service_type') == 'office_cleaning':
        if lead_data.get('size') in ['500-1000m2', '1000+m2']:
            score += 2
        if lead_data.get('frequency') in ['daily', 'several_times_week']:
            score += 2
        if lead_data.get('num_locations', 0) >= 4:
            score += 2

    elif lead_data.get('service_type') == 'airbnb_turnover':
        if lead_data.get('checkouts_per_week', 0) >= 4:
            score += 3

    # Apply custom rules
    for rule in scoring_rules:
        if _matches_conditions(lead_data, rule['conditions']):
            score += rule['score_adjustment']

    return min(score, 10)  # Cap at 10
```

### 6.3 Meta Graph API Rate Limits

**Challenge**: 200 calls/hour per user, 4,800/day per app.

**Solution**:
- Implement rate limiting middleware
- Queue messages if rate limit hit
- Use batch API for multiple replies (max 50/batch)
- Monitor usage via `agent_logs` table

---

## 7. PRICING RECOMMENDATION

### Standard vs. Custom Tiers

| **Tier** | **Price** | **What's Included** |
|----------|-----------|---------------------|
| **Standard Receptionist** | £29/month | Pre-built flows, all channels, basic lead capture |
| **Custom Employee** | **£200 setup + £80/month** | Bespoke flows, advanced scoring, integrations |
| **Enterprise** | Custom quote | Multiple custom employees, dedicated support |

### Elite Services Pricing
- **Setup Fee**: £300 (covers 8-10 hours configuration)
- **Monthly**: £80/month
- **Profit Margin**: 64-79% (depending on volume)

### Upsell Opportunities
- Additional service types: +£50 setup each
- Advanced integrations (Zapier, custom webhooks): +£20/month
- WhatsApp Business API: +£15/month
- Voice calls: +£25/month

---

## 8. RISKS & MITIGATION

| **Risk** | **Impact** | **Mitigation** |
|----------|------------|----------------|
| Meta API changes | High | Use official SDKs, monitor changelog |
| Lead scoring inaccuracy | Medium | A/B test rules, allow manual adjustment |
| Rate limit overages | Medium | Implement queueing, upgrade if needed |
| Complex flow bugs | Medium | Extensive testing, flow preview mode |
| Client setup complexity | Low | Video tutorials, onboarding checklist |

---

## 9. SUCCESS METRICS

**For Elite Services:**
- Lead capture rate: % of conversations that become leads (target: >70%)
- HOT lead accuracy: % of HOT leads that convert (target: >40%)
- Response time: Time from message to reply (target: <30 seconds)
- Customer satisfaction: Measured via follow-up survey (target: 4.5+/5)

**For Mesa AI:**
- Custom employee retention: % of custom clients staying after 6 months (target: >85%)
- Upsell rate: % of custom clients adding features (target: >30%)
- Gross margin: Profit per custom client (target: >70%)

---

## 10. NEXT STEPS

1. **Build Database Schema** - Run SQL migrations for new tables
2. **Build Conversation Flow Engine** - Core branching logic
3. **Set Up Meta Developer App** - Get FB/IG API access
4. **Build Custom Employee Builder UI** - Flow designer
5. **Configure Elite Services Employee** - 5 service flows + scoring
6. **Deploy & Test** - Full end-to-end testing with Elite Services
7. **Launch** - Go live with £300 setup + £80/month pricing

---

**SUMMARY:**
- **Build Time**: 7-8 weeks full-time
- **Setup Cost**: £0 (all APIs free tier)
- **Monthly Infrastructure**: ~£5-10
- **Per-Customer COGS**: £15-30 (depending on volume)
- **Revenue Per Customer**: £80/month (+ £300 setup)
- **Profit Margin**: 64-79%
- **ROI**: Excellent - low cost, high margin, scalable
