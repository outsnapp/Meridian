"""
Context engine for MERIDIAN. Enriches signal/event data with company context
when demo mode is enabled (e.g. Sun Pharma profile, revenue, markets, regulatory history).
"""

from typing import Dict, Any

from services.demo_company import get_demo_company, is_demo_mode


def inject_company_context(signal_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    If DEMO_MODE=true, attach company profile (revenue, markets, key_products,
    regulatory_history) to the signal so UI can show company context.
    Returns enriched signal; does not mutate input.
    """
    if not is_demo_mode():
        return signal_data

    profile = get_demo_company()
    if not profile:
        return signal_data

    enriched = dict(signal_data)
    enriched["company_context"] = {
        "company_name": profile.get("company_name"),
        "hq": profile.get("hq"),
        "markets": profile.get("markets", []),
        "exposure": " | ".join(profile.get("markets", [])),
        "key_products": profile.get("key_products", []),
        "product_line": " / ".join(profile.get("key_products", [])),
        "annual_revenue": profile.get("annual_revenue"),
        "regulatory_history": profile.get("regulatory_history", []),
    }
    return enriched
