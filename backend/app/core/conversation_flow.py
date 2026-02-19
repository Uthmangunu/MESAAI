"""
Conversation Flow Engine
Handles branching conversation flows for custom employee types.
"""
import json
from typing import Optional


def load_flow_definition(admin, agent_id: str) -> Optional[dict]:
    """
    Load the conversation flow definition for an agent.
    Returns None if agent has no custom flow.
    """
    # Get agent's employee_type_id
    agent_result = (
        admin.table("agents")
        .select("employee_type_id")
        .eq("id", agent_id)
        .single()
        .execute()
    )

    if not agent_result.data:
        return None

    employee_type_id = agent_result.data["employee_type_id"]

    # Get active flow for this employee type
    flow_result = (
        admin.table("conversation_flows")
        .select("*")
        .eq("employee_type_id", employee_type_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )

    if not flow_result.data:
        return None

    return flow_result.data[0]


def initialize_flow_state(conversation_id: str, flow_definition: Optional[dict]) -> dict:
    """
    Initialize a new conversation flow state.
    """
    if not flow_definition:
        return {}

    return {
        "flow_id": flow_definition["id"],
        "flow_name": flow_definition["flow_name"],
        "current_step": "greeting",
        "collected_data": {},
        "step_history": [],
    }


def get_current_flow_step(flow_state: dict, flow_definition: dict) -> Optional[dict]:
    """
    Get the current step definition from the flow.
    """
    if not flow_state or not flow_definition:
        return None

    current_step_id = flow_state.get("current_step")
    if not current_step_id:
        return None

    # Find step in flow definition
    steps = flow_definition.get("flow_definition", {}).get("steps", [])
    for step in steps:
        if step.get("id") == current_step_id:
            return step

    return None


def determine_next_step(
    user_response: str,
    current_step: dict,
    collected_data: dict,
    flow_definition: dict
) -> str:
    """
    Determine the next step based on current step's branching logic.

    For Elite Services:
    - If current step is "service_selection", branch based on service type
    - Otherwise, follow "next" field
    """
    if not current_step:
        return "greeting"

    # Check if current step has conditional branches
    branches = current_step.get("branches", [])

    if branches:
        # Evaluate branch conditions
        for branch in branches:
            # Simple keyword matching for now
            # In production, use LLM to extract intent
            condition = branch.get("condition", "")
            if condition.lower() in user_response.lower():
                return branch.get("next_step", current_step.get("next", "closing"))

    # No branches or no match, use default next
    next_step = current_step.get("next")

    # If no next step, flow is complete
    if not next_step:
        return "complete"

    return next_step


def extract_data_from_response(
    message: str,
    expected_fields: list[str],
    current_step: dict
) -> dict:
    """
    Extract structured data from user response.

    For now, this is a simple implementation.
    In production, use LLM with structured output or regex patterns.
    """
    extracted = {}

    # Simple extraction based on step type
    step_type = current_step.get("type", "question")

    if step_type == "data_collection":
        field_name = current_step.get("data_field")
        if field_name:
            # Store the entire message as the field value
            # In production, parse based on field type (email, phone, postcode, etc.)
            extracted[field_name] = message.strip()

    return extracted


def update_flow_state(
    admin,
    conversation_id: str,
    new_step: str,
    extracted_data: dict
) -> None:
    """
    Update the conversation flow state in the database.
    """
    # Get current flow state
    conv_result = (
        admin.table("conversations")
        .select("flow_state")
        .eq("id", conversation_id)
        .single()
        .execute()
    )

    if not conv_result.data:
        return

    flow_state = conv_result.data.get("flow_state", {})

    # Update state
    flow_state["current_step"] = new_step

    # Merge collected data
    collected_data = flow_state.get("collected_data", {})
    collected_data.update(extracted_data)
    flow_state["collected_data"] = collected_data

    # Add to history
    step_history = flow_state.get("step_history", [])
    step_history.append(new_step)
    flow_state["step_history"] = step_history

    # Save to database
    admin.table("conversations").update({
        "flow_state": flow_state,
        "flow_type": flow_state.get("flow_name"),
    }).eq("id", conversation_id).execute()


def build_flow_aware_prompt(base_prompt: str, flow_context: dict) -> str:
    """
    Augment system prompt with conversation flow context.
    """
    if not flow_context or not flow_context.get("current_step"):
        return base_prompt

    current_step = flow_context.get("current_step")
    collected_data = flow_context.get("collected_data", {})
    step_definition = flow_context.get("step_definition", {})

    flow_prompt = f"""

## CONVERSATION FLOW CONTEXT

You are currently at step: {current_step}

Current Step Instructions:
{step_definition.get('question', 'Continue the conversation naturally.')}

Data Collected So Far:
{json.dumps(collected_data, indent=2)}

Required Fields for This Step:
{step_definition.get('data_field', 'None')}

Next Step After This:
{step_definition.get('next', 'Complete')}

IMPORTANT:
- Ask the question naturally and conversationally
- Extract the required data from the user's response
- Don't mention you're following a script
- Be helpful and friendly (UK English, professional tone)
"""

    return base_prompt + flow_prompt


def is_flow_complete(flow_state: dict) -> bool:
    """
    Check if the conversation flow is complete.
    """
    return flow_state.get("current_step") == "complete"


def get_collected_flow_data(admin, conversation_id: str) -> dict:
    """
    Get all data collected during the flow.
    """
    conv_result = (
        admin.table("conversations")
        .select("flow_state")
        .eq("id", conversation_id)
        .single()
        .execute()
    )

    if not conv_result.data:
        return {}

    flow_state = conv_result.data.get("flow_state", {})
    return flow_state.get("collected_data", {})
