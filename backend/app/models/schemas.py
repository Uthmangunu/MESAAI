from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any
from datetime import datetime
import uuid


# ─── Auth ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    organization_name: str = Field(min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ─── Organization ─────────────────────────────────────────────────────────────

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None


class OrganizationOut(BaseModel):
    id: str
    name: str
    stripe_customer_id: Optional[str] = None
    created_at: Optional[datetime] = None


# ─── Employee Types ───────────────────────────────────────────────────────────

class EmployeeTypeOut(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price_monthly: int  # pence
    capabilities: Optional[list[str]] = None
    is_active: bool


# ─── Agents ───────────────────────────────────────────────────────────────────

class AgentCreate(BaseModel):
    employee_type_id: str
    name: str
    custom_system_prompt: Optional[str] = None
    voice_config: Optional[dict[str, Any]] = None


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    custom_system_prompt: Optional[str] = None
    voice_config: Optional[dict[str, Any]] = None
    status: Optional[str] = None


class AgentChannelUpdate(BaseModel):
    channel: str
    is_enabled: bool
    config: Optional[dict[str, Any]] = None


class AgentOut(BaseModel):
    id: str
    organization_id: str
    employee_type_id: str
    name: str
    custom_system_prompt: Optional[str] = None
    voice_config: Optional[dict[str, Any]] = None
    status: str
    stripe_subscription_id: Optional[str] = None
    created_at: Optional[datetime] = None


# ─── Conversations & Messages ─────────────────────────────────────────────────

class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    channel: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: Optional[datetime] = None


class ConversationOut(BaseModel):
    id: str
    agent_id: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    contact_name: Optional[str] = None
    channel: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Leads ────────────────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    agent_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class LeadOut(BaseModel):
    id: str
    organization_id: str
    agent_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


# ─── Bookings ─────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    agent_id: str
    conversation_id: Optional[str] = None
    scheduled_at: datetime
    attendee_name: str
    attendee_email: Optional[str] = None
    attendee_phone: Optional[str] = None


class BookingOut(BaseModel):
    id: str
    organization_id: str
    agent_id: str
    conversation_id: Optional[str] = None
    calendar_event_id: Optional[str] = None
    calendly_event_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    attendee_name: Optional[str] = None
    attendee_email: Optional[str] = None
    attendee_phone: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None


# ─── Billing ──────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    employee_type_id: str
    agent_name: str
    success_url: str
    cancel_url: str


class PortalRequest(BaseModel):
    return_url: str


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    agent_id: str
    channel: str = Field(default="web", max_length=20)
    contact_phone: Optional[str] = Field(default=None, max_length=20)
    contact_email: Optional[str] = None
    contact_name: Optional[str] = Field(default=None, max_length=100)
    message: str = Field(min_length=1, max_length=4000)  # ~1 page of text max
    conversation_id: Optional[str] = None
