"""
Demo company profile for MERIDIAN Company-Based Demo Mode.
Sun Pharma reference case for judge demos. No placeholder or fake language.
"""

import os
from typing import Dict, Any, Optional

SUN_PHARMA_PROFILE = {
    "company_name": "Sun Pharma",
    "hq": "India",
    "markets": ["US", "India", "EU"],
    "annual_revenue": 48000,  # in Cr INR (approx)
    "currency": "INR",
    "unit_scale": "crores",
    "market": "India",
    "key_products": ["Oncology", "Generics", "Cardiology"],
    "regulatory_history": ["FDA Warning Letters", "Plant Inspections"],
}

DEMO_COMPANY_ID = "SUN_PHARMA"


def _is_demo_mode() -> bool:
    v = os.getenv("DEMO_MODE", "").strip().lower()
    return v in ("true", "1", "yes")


def _get_demo_company_id() -> Optional[str]:
    v = os.getenv("DEMO_COMPANY", "").strip().upper().replace("-", "_")
    return v if v else None


def get_demo_company() -> Optional[Dict[str, Any]]:
    """
    Return the active demo company profile when DEMO_MODE=true and DEMO_COMPANY is set.
    Otherwise return None.
    """
    if not _is_demo_mode():
        return None
    company_id = _get_demo_company_id()
    if company_id == DEMO_COMPANY_ID:
        return dict(SUN_PHARMA_PROFILE)
    return None


def is_demo_mode() -> bool:
    """True when DEMO_MODE env is enabled."""
    return _is_demo_mode()


def get_demo_company_id() -> Optional[str]:
    """Current DEMO_COMPANY value (e.g. SUN_PHARMA) or None."""
    return _get_demo_company_id()
