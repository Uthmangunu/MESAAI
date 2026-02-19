"""
Lead Scoring System
Automatically scores leads based on configured rules and conversation data.
"""


async def calculate_lead_score(
    admin,
    employee_type_id: str,
    conversation_data: dict,
    service_type: str = None
) -> int:
    """
    Calculate lead score based on:
    1. Organization's scoring rules
    2. Data completeness
    3. Engagement indicators
    4. Service-specific criteria

    Returns score from 0-10.
    """
    score = 0

    # Load scoring rules for this employee type
    rules_result = (
        admin.table("lead_scoring_rules")
        .select("*")
        .eq("employee_type_id", employee_type_id)
        .execute()
    )

    rules = rules_result.data if rules_result.data else []

    # Apply each rule
    for rule in rules:
        if _matches_conditions(conversation_data, rule["conditions"]):
            score += rule["score_adjustment"]

    # Add base scores for Elite Services
    score += _calculate_elite_services_score(conversation_data, service_type)

    # Cap score at 10
    return min(score, 10)


def _matches_conditions(data: dict, conditions: dict) -> bool:
    """
    Check if conversation data matches rule conditions.
    """
    for key, value in conditions.items():
        # Handle nested keys (e.g., "service_data.size")
        if "." in key:
            parts = key.split(".")
            current_value = data
            for part in parts:
                current_value = current_value.get(part, {})
                if not isinstance(current_value, dict) and part != parts[-1]:
                    break
            data_value = current_value
        else:
            data_value = data.get(key)

        # Exact match
        if isinstance(value, str) and data_value == value:
            continue
        # List contains
        elif isinstance(value, list) and data_value in value:
            continue
        # Comparison operators
        elif isinstance(value, dict):
            if "$gte" in value and data_value and data_value >= value["$gte"]:
                continue
            if "$lte" in value and data_value and data_value <= value["$lte"]:
                continue
            if "$in" in value and data_value in value["$in"]:
                continue
        else:
            return False

    return True


def _calculate_elite_services_score(data: dict, service_type: str = None) -> int:
    """
    Elite Services specific scoring logic.
    """
    score = 0

    # Urgency scoring
    urgency = data.get("urgency", "")
    if urgency == "within_48h":
        score += 3
    elif urgency == "within_7days":
        score += 2
    elif urgency == "within_30days":
        score += 1

    # Service-specific scoring
    service_data = data.get("service_data", {})

    if service_type == "office_cleaning" or service_type == "fm_support":
        # Size scoring
        size = service_data.get("size", "")
        if "1000+" in size or "500-1000" in size:
            score += 2

        # Frequency scoring
        frequency = service_data.get("frequency", "")
        if frequency in ["daily", "several_times_week"]:
            score += 2

        # Multiple locations
        num_locations = service_data.get("num_locations", 0)
        if isinstance(num_locations, str):
            if "4+" in num_locations:
                score += 2
            elif "2-3" in num_locations:
                score += 1
        elif isinstance(num_locations, int) and num_locations >= 4:
            score += 2

    elif service_type == "airbnb":
        # High volume Airbnb
        checkouts = service_data.get("checkouts_per_week", "")
        if "4+" in str(checkouts):
            score += 3
        elif "2-3" in str(checkouts):
            score += 1

    elif service_type == "end_of_tenancy":
        # Large properties
        property_type = service_data.get("property_type", "")
        if "3-bed" in property_type or "house" in property_type:
            score += 1

    # Data completeness bonus
    if data.get("name") and data.get("email") and data.get("phone"):
        score += 1

    return score


def is_hot_lead(score: int, threshold: int = 7) -> bool:
    """
    Determine if a lead is "HOT" based on score.
    Default threshold is 7/10.
    """
    return score >= threshold


async def get_scoring_rules(admin, employee_type_id: str) -> list:
    """
    Get all active scoring rules for an employee type.
    """
    result = (
        admin.table("lead_scoring_rules")
        .select("*")
        .eq("employee_type_id", employee_type_id)
        .execute()
    )

    return result.data if result.data else []


async def create_scoring_rule(
    admin,
    employee_type_id: str,
    rule_name: str,
    conditions: dict,
    score_adjustment: int
) -> dict:
    """
    Create a new scoring rule.
    """
    result = (
        admin.table("lead_scoring_rules")
        .insert({
            "employee_type_id": employee_type_id,
            "rule_name": rule_name,
            "conditions": conditions,
            "score_adjustment": score_adjustment,
        })
        .execute()
    )

    return result.data[0] if result.data else {}


def explain_score(score: int, conversation_data: dict) -> str:
    """
    Generate human-readable explanation of why a lead got this score.
    """
    explanations = []

    urgency = conversation_data.get("urgency", "")
    if urgency == "within_48h":
        explanations.append("Urgent (within 48 hours): +3 points")
    elif urgency == "within_7days":
        explanations.append("Short timeline (within 7 days): +2 points")

    service_data = conversation_data.get("service_data", {})

    size = service_data.get("size", "")
    if "1000+" in size:
        explanations.append("Large property (1000+ m²): +2 points")

    frequency = service_data.get("frequency", "")
    if frequency == "daily":
        explanations.append("High frequency (daily cleaning): +2 points")

    if conversation_data.get("name") and conversation_data.get("email") and conversation_data.get("phone"):
        explanations.append("Complete contact details: +1 point")

    if not explanations:
        return f"Score: {score}/10 (Standard lead)"

    return f"Score: {score}/10\n" + "\n".join(f"- {exp}" for exp in explanations)
