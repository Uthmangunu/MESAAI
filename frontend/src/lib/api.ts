const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken(): string | null {
    return localStorage.getItem('access_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(error.detail || 'Request failed');
    }

    return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: { id: string; email: string };
}

export interface SignupResponse {
    user_id: string;
    organization_id: string;
    message: string;
}

export interface MeResponse {
    id: string;
    email: string;
    organization_id: string;
    role: string;
    organizations: { id: string; name: string };
}

// ─── Agents ────────────────────────────────────────────────────────────────────

export interface AgentChannel {
    channel: string;
    is_enabled: boolean;
    config: Record<string, unknown>;
}

export interface Agent {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'cancelled' | 'draft';
    custom_system_prompt: string | null;
    voice_config: Record<string, unknown> | null;
    employee_types: { name: string; description: string | null } | null;
    agent_channels: AgentChannel[];
    created_at: string | null;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
    messages_total: number;
    leads_total: number;
    bookings_total: number;
    agents_active: number;
}

// ─── Leads ─────────────────────────────────────────────────────────────────────

export interface Lead {
    id: string;
    organization_id: string;
    agent_id: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    status: string;
    service_type: string | null;
    service_data: Record<string, unknown>;
    lead_score: number;
    is_hot: boolean;
    urgency: string | null;
    source_channel: string | null;
    created_at: string;
    agents?: { name: string };
}

// ─── Conversation Flows ────────────────────────────────────────────────────────

export interface ConversationFlow {
    id: string;
    employee_type_id: string;
    flow_name: string;
    flow_definition: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
}

// ─── Logs ──────────────────────────────────────────────────────────────────────

export interface LogEntry {
    id: string;
    action: string;
    metadata: Record<string, unknown> | null;
    created_at: string;
    agents: { name: string } | null;
}

// ─── Conversations ─────────────────────────────────────────────────────────────

export interface Conversation {
    id: string;
    contact_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    channel: string | null;
    status: string;
    updated_at: string | null;
    agents: { name: string } | null;
}

export interface Message {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string | null;
}

// ─── Employee Types ────────────────────────────────────────────────────────────

export interface EmployeeType {
    id: string;
    name: string;
    description: string | null;
    price_monthly: number;
    capabilities: string[] | null;
    is_active: boolean;
}

// ─── API Client ────────────────────────────────────────────────────────────────

export const api = {
    auth: {
        login: (email: string, password: string) =>
            request<LoginResponse>('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),

        signup: (email: string, password: string, organization_name: string) =>
            request<SignupResponse>('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ email, password, organization_name }),
            }),

        me: () => request<MeResponse>('/api/auth/me'),
    },

    agents: {
        list: () => request<Agent[]>('/api/agents'),

        get: (id: string) => request<Agent>(`/api/agents/${id}`),

        create: (body: { employee_type_id: string; name: string; custom_system_prompt?: string }) =>
            request<Agent>('/api/agents', { method: 'POST', body: JSON.stringify(body) }),

        update: (id: string, body: { name?: string; custom_system_prompt?: string; status?: string }) =>
            request<Agent>(`/api/agents/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

        delete: (id: string) =>
            request<{ message: string }>(`/api/agents/${id}`, { method: 'DELETE' }),

        updateChannel: (id: string, body: { channel: string; is_enabled: boolean }) =>
            request<AgentChannel>(`/api/agents/${id}/channels`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),
    },

    chat: {
        send: (body: {
            agent_id: string;
            channel?: string;
            contact_name?: string;
            contact_phone?: string;
            contact_email?: string;
            message: string;
            conversation_id?: string;
        }) => request<{ reply: string; conversation_id: string }>('/api/chat', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

        listConversations: (params?: { agent_id?: string; channel?: string; status?: string }) => {
            const qs = params
                ? '?' + new URLSearchParams(Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== undefined)
                ) as Record<string, string>).toString()
                : '';
            return request<Conversation[]>(`/api/chat/conversations${qs}`);
        },

        getMessages: (conversationId: string) =>
            request<Message[]>(`/api/chat/conversations/${conversationId}/messages`),
    },

    logs: {
        list: (params?: { agent_id?: string; action?: string; limit?: number }) => {
            const qs = params
                ? '?' + new URLSearchParams(Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
                )).toString()
                : '';
            return request<LogEntry[]>(`/api/logs${qs}`);
        },

        stats: () => request<DashboardStats>('/api/logs/stats'),
    },

    employeeTypes: {
        list: () => request<EmployeeType[]>('/api/employee-types'),
    },

    leads: {
        list: (params?: {
            status?: string;
            agent_id?: string;
            is_hot?: boolean;
            service_type?: string;
            limit?: number;
        }) => {
            const qs = params
                ? '?' + new URLSearchParams(Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
                )).toString()
                : '';
            return request<Lead[]>(`/api/leads${qs}`);
        },

        get: (id: string) => request<Lead>(`/api/leads/${id}`),

        create: (body: {
            agent_id?: string;
            name?: string;
            phone?: string;
            email?: string;
            notes?: string;
        }) => request<Lead>('/api/leads', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

        update: (id: string, body: Partial<Lead>) =>
            request<Lead>(`/api/leads/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),

        delete: (id: string) =>
            request<{ message: string }>(`/api/leads/${id}`, { method: 'DELETE' }),
    },

    flows: {
        list: (employee_type_id?: string) => {
            const qs = employee_type_id ? `?employee_type_id=${employee_type_id}` : '';
            return request<ConversationFlow[]>(`/api/flows${qs}`);
        },

        get: (id: string) => request<ConversationFlow>(`/api/flows/${id}`),

        create: (body: {
            employee_type_id: string;
            flow_name: string;
            flow_definition: Record<string, unknown>;
        }) => request<ConversationFlow>('/api/flows', {
            method: 'POST',
            body: JSON.stringify(body),
        }),

        update: (id: string, body: Partial<ConversationFlow>) =>
            request<ConversationFlow>(`/api/flows/${id}`, {
                method: 'PUT',
                body: JSON.stringify(body),
            }),

        delete: (id: string) =>
            request<{ status: string }>(`/api/flows/${id}`, { method: 'DELETE' }),
    },
};
