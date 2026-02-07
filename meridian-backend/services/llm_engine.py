"""
LLM processing engine for MERIDIAN backend.
Uses OpenAI to classify raw pharma intelligence into structured events.
Output conforms to canonical EventSchema. Never omit fields.
"""

import os
import json
import logging
from typing import Dict, Any
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Canonical EventSchema fields - mandatory, never omit
EVENT_SCHEMA_FIELDS = [
    "title", "summary", "event_type", "matched_role", "impact_analysis",
    "primary_outcome", "confidence", "whats_changing", "why_it_matters",
    "what_to_do_now", "decision_urgency", "recommended_next_step",
    "assumptions", "source",
    "messaging_instructions", "positioning_before", "positioning_after", "agent_action_log",
]

VALID_EVENT_TYPES = ["Operational", "Expansion", "Risk"]
VALID_ROLES = ["Strategy", "Medical", "Commercial", "Finance"]
VALID_CONFIDENCE = ["High", "Medium", "Low"]


def normalize_event_schema(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate every field. Replace null/missing with defaults.
    Return full canonical schema. Used by process_raw_source and API responses.
    """
    result: Dict[str, Any] = {}

    # Map API/DB field names to canonical schema
    field_map = {
        "whats_changing": ["whats_changing", "what_is_changing"],
        "confidence": ["confidence", "confidence_level"],
    }

    for field in EVENT_SCHEMA_FIELDS:
        keys = field_map.get(field, [field])
        val = None
        for k in keys:
            if k in data and data[k] is not None:
                v = data[k]
                if isinstance(v, str) and v.strip():
                    val = v.strip()
                    break
                if isinstance(v, list) and v:
                    val = ", ".join(str(x).strip() for x in v)
                    break
        if val is None or val == "":
            result[field] = ""
        else:
            result[field] = str(val)

    if result["event_type"] not in VALID_EVENT_TYPES:
        result["event_type"] = "Operational"
    if result.get("matched_role") not in VALID_ROLES:
        result["matched_role"] = "Strategy"
    if result["confidence"] not in VALID_CONFIDENCE:
        result["confidence"] = "Medium"

    # Preserve id and updated_at from input (for API responses)
    if "id" in data:
        result["id"] = data["id"]
    if "updated_at" in data and data["updated_at"]:
        result["updated_at"] = str(data["updated_at"])
    elif "timestamp" in data and data["timestamp"]:
        ts = data["timestamp"]
        if isinstance(ts, str) and len(ts) >= 10:
            result["updated_at"] = ts[:10]
        else:
            result["updated_at"] = ""
    else:
        result["updated_at"] = ""
    if "matched_role" in data:
        result["matched_role"] = str(data["matched_role"]) if data["matched_role"] else ""
    if "fetched_at" in data and data["fetched_at"]:
        result["fetched_at"] = data["fetched_at"]
    else:
        result["fetched_at"] = ""
    # Article URL (link to scraped source)
    if "article_url" in data and data["article_url"] and str(data["article_url"]).strip():
        result["article_url"] = str(data["article_url"]).strip()
    else:
        result["article_url"] = None

    return result


def process_raw_source(raw) -> Dict:
    """
    Process a RawSource record using OpenAI.
    Always outputs full canonical schema. Never omits fields.
    Uses empty string when unknown.
    """
    api_key = os.getenv("OPENAI_API_KEY")

    # Infer matched_role from content for fallback
    content_lower = (raw.content or "").lower()
    if any(k in content_lower for k in ["pricing", "reimbursement", "revenue", "medicare", "cms", "cost"]):
        fallback_role = "Finance"
    elif any(k in content_lower for k in ["safety", "fda", "adverse", "clinical", "label", "rems"]):
        fallback_role = "Medical"
    elif any(k in content_lower for k in ["sales", "market share", "competition", "launch"]):
        fallback_role = "Commercial"
    else:
        fallback_role = "Strategy"

    fallback = {
        "title": (raw.title[:100] if raw.title else "Intelligence Update"),
        "summary": (raw.content[:500] if raw.content else ""),
        "event_type": "Operational",
        "matched_role": fallback_role,
        "impact_analysis": "",
        "primary_outcome": "",
        "confidence": "Medium",
        "whats_changing": (raw.content[:300] if raw.content else ""),
        "why_it_matters": "",
        "what_to_do_now": "Review and validate with internal sources.",
        "decision_urgency": "",
        "recommended_next_step": "Monitor for additional information.",
        "assumptions": "Based on available public information.",
        "source": (raw.source if hasattr(raw, "source") and raw.source and str(raw.source).strip() else ""),
        "messaging_instructions": "Review internal messaging guidelines. Tailor HCP discussion points to this development.",
        "positioning_before": "",
        "positioning_after": "",
        "agent_action_log": "[]",
    }

    if not api_key or api_key == "sk-your-key-here":
        logger.warning("OpenAI API key not configured, using fallback data")
        return normalize_event_schema(fallback)

    try:
        client = OpenAI(api_key=api_key)
        input_text = f"{raw.title}\n\n{raw.content}"
        if len(input_text) > 2000:
            input_text = input_text[:2000] + "..."

        prompt = f"""You are a pharmaceutical market intelligence analyst. Classify the following pharma news/data into a structured executive briefing.

CRITICAL: Output ONLY a valid JSON object. NO markdown, NO code blocks, NO explanations.
You MUST include EVERY field. NEVER omit any field.
Use empty string "" when information cannot be inferred.

Input:
{input_text}

Required JSON schema (copy this structure and fill values):
{{
  "title": "",
  "summary": "",
  "event_type": "Operational" | "Expansion" | "Risk",
  "matched_role": "Strategy" | "Medical" | "Commercial" | "Finance",
  "impact_analysis": "",
  "primary_outcome": "",
  "confidence": "High" | "Medium" | "Low",
  "whats_changing": "",
  "why_it_matters": "",
  "what_to_do_now": "",
  "decision_urgency": "",
  "recommended_next_step": "",
  "assumptions": "",
  "source": "",
  "messaging_instructions": "Bullet-point field-team guidance for doctors, sales, medical reps. What to say, what to avoid, key messages.",
  "positioning_before": "Current/prior market positioning before this event.",
  "positioning_after": "Recommended new positioning post-event.",
  "agent_action_log": "JSON array of suggested actions, e.g. [{{\\"action\\": \\"Update HCP materials\\", \\"role\\": \\"Medical\\"}}]. Or empty [] if none."
}}

Rules:
- event_type: exactly one of Operational, Expansion, Risk
- matched_role: exactly one of Strategy, Medical, Commercial, Finance
  * Strategy: corporate strategy, M&A, portfolio decisions, high-level business
  * Finance: pricing, reimbursement, revenue, cost, Medicare/CMS, margin
  * Commercial: sales, marketing, market share, competition, launch
  * Medical: regulatory, clinical, safety, HTA, adverse events, label/REMS
- confidence: exactly one of High, Medium, Low
- source: data origin, e.g. "Serper" or "OpenFDA"
- Use empty string "" when no reasonable value can be inferred
- Respond with ONLY the JSON object."""

        logger.info(f"Processing RawSource ID {raw.id} with OpenAI")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You output valid JSON only. No markdown. Every field must be present. Never omit fields.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.5,
            max_tokens=2200,
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        result = json.loads(content)
        normalized = normalize_event_schema(result)
        logger.info(f"[OK] Successfully processed RawSource ID {raw.id}")
        return normalized

    except json.JSONDecodeError as e:
        logger.error(f"[ERROR] Failed to parse OpenAI JSON: {str(e)}")
        return normalize_event_schema(fallback)
    except Exception as e:
        logger.error(f"[ERROR] OpenAI processing error: {str(e)}")
        return normalize_event_schema(fallback)


# Alias for backward compatibility
def normalize_event_data(data: Dict[str, Any]) -> Dict[str, Any]:
    return normalize_event_schema(data)


def answer_signal_question(event_context: str, question: str, department: str, conversation_history: list) -> str:
    """
    Use OpenAI to answer any user question about a pharma intelligence signal.
    Uses event context, department perspective, and optional conversation history.
    """
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key or api_key.startswith("sk-your-"):
        return "AI chat requires an OpenAI API key. Add OPENAI_API_KEY to your .env file and restart the backend."

    try:
        client = OpenAI(api_key=api_key)
        system_content = f"""You are a pharmaceutical market intelligence assistant. Answer the user's question about the following signal/news. Be concise but informative. Tailor answers to the {department} perspective when relevant. If the signal doesn't contain enough information to answer fully, say so and suggest what additional data would help.

SIGNAL CONTEXT:
{event_context}"""

        messages = [{"role": "system", "content": system_content}]
        for m in conversation_history:
            messages.append({"role": m["role"], "content": m["content"]})
        messages.append({"role": "user", "content": question})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.5,
            max_tokens=800,
        )
        return response.choices[0].message.content.strip() or "I couldn't generate a response. Please try rephrasing."
    except Exception as e:
        logger.error(f"[ERROR] Chat answer failed: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"
