"""
Tool definitions for the agent engine — OpenAI function-calling format.
Compatible with OpenRouter and any OpenAI-spec model.
"""

AGENT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "book_appointment",
            "description": "Book an appointment or meeting for the contact. Use this when someone explicitly asks to schedule, book, or arrange a meeting/appointment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "attendee_name": {
                        "type": "string",
                        "description": "Full name of the person booking"
                    },
                    "attendee_email": {
                        "type": "string",
                        "description": "Email address for the booking confirmation"
                    },
                    "attendee_phone": {
                        "type": "string",
                        "description": "Phone number of the attendee"
                    },
                    "preferred_date": {
                        "type": "string",
                        "description": "Preferred date/time in ISO format or natural language"
                    },
                    "reason": {
                        "type": "string",
                        "description": "Purpose or reason for the appointment"
                    }
                },
                "required": ["attendee_name", "preferred_date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "collect_lead",
            "description": "Save a new contact as a potential lead. Use this when someone shows interest in services or is a new enquiry.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Contact's full name"
                    },
                    "phone": {
                        "type": "string",
                        "description": "Contact's phone number"
                    },
                    "email": {
                        "type": "string",
                        "description": "Contact's email address"
                    },
                    "notes": {
                        "type": "string",
                        "description": "Notes about their enquiry or interest"
                    }
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "escalate_to_human",
            "description": "Flag this conversation for a human team member to take over. Use for complaints, complex queries, or when the AI cannot help.",
            "parameters": {
                "type": "object",
                "properties": {
                    "reason": {
                        "type": "string",
                        "description": "Why this needs human attention"
                    }
                },
                "required": ["reason"]
            }
        }
    }
]
