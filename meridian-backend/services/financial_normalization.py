"""
Financial Normalization Layer for MERIDIAN.
Converts all revenue to base USD millions for internal calculation.
Provides output formatting (USD M/B, INR Cr) and validation for enterprise-grade outputs.
"""

import os
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)

# 1 INR = 1/EXCHANGE_RATE USD. So 1 crore INR = 1e7/EXCHANGE_RATE USD = 1e7/EXCHANGE_RATE/1e6 USD millions.
INR_PER_USD = float(os.getenv("INR_PER_USD", "83.0"))
CRORE_TO_USD_MILLIONS = (1e7 / INR_PER_USD) / 1e6  # ~0.1205 per crore


def to_usd_millions(value: float, currency: str, unit_scale: str) -> float:
    """
    Convert revenue to USD millions (internal standard).
    - INR crores: value * (10^7/INR_PER_USD) / 10^6
    - USD billions: value * 1000
    - USD millions: value
    - USD thousands: value / 1000
    - EUR millions: approximate * 1.08 (optional; default treat as USD if not INR)
    """
    if value is None or value <= 0:
        return 0.0
    cur = (currency or "USD").upper()
    scale = (unit_scale or "millions").lower()
    if cur == "INR" and scale == "crores":
        return value * CRORE_TO_USD_MILLIONS
    if cur == "USD":
        if scale == "billions":
            return value * 1000.0
        if scale == "millions":
            return float(value)
        if scale == "thousands":
            return value / 1000.0
        if scale == "crores":
            # USD crores not standard; treat as millions
            return float(value)
    if cur == "EUR":
        # Approximate EUR to USD (e.g. 1.08)
        eur_to_usd = float(os.getenv("EUR_TO_USD", "1.08"))
        if scale == "billions":
            return value * 1000.0 * eur_to_usd
        if scale == "millions":
            return value * eur_to_usd
        if scale == "thousands":
            return (value / 1000.0) * eur_to_usd
    # Default: assume millions
    return float(value)


def format_loss_usd(loss_usd_m: float) -> str:
    """Format loss in USD with appropriate scale: $180M, $1.2B, $500K."""
    if loss_usd_m is None or loss_usd_m < 0:
        return "$0"
    if loss_usd_m >= 1000:
        return f"${loss_usd_m / 1000:.1f}B"
    if loss_usd_m >= 1:
        return f"${loss_usd_m:.0f}M"
    if loss_usd_m >= 0.001:
        return f"${loss_usd_m * 1000:.0f}K"
    return f"${loss_usd_m:.2f}M"


def usd_millions_to_inr_crores(usd_m: float) -> float:
    """Convert USD millions to INR crores for display."""
    if usd_m is None or usd_m <= 0:
        return 0.0
    # 1 USD million = 1e6 USD = 1e6 * INR_PER_USD INR = 1e6 * INR_PER_USD / 1e7 crores
    return usd_m * 1e6 * INR_PER_USD / 1e7


def format_loss_with_inr(loss_usd_m: float) -> str:
    """Format as '$180M (₹1,500 Cr)' for India context."""
    usd_str = format_loss_usd(loss_usd_m)
    inr_cr = usd_millions_to_inr_crores(loss_usd_m)
    if inr_cr >= 0.01:
        inr_str = f"₹{inr_cr:,.0f} Cr" if inr_cr >= 1 else f"₹{inr_cr:.2f} Cr"
        return f"{usd_str} ({inr_str})"
    return usd_str


def validate_large_pharma_loss(revenue_usd_m: float, loss_min_usd_m: float) -> Tuple[bool, str]:
    """
    If company revenue is large (e.g. > $1B) and loss < $1M, flag as unrealistic.
    Returns (valid, message).
    """
    if revenue_usd_m is None or revenue_usd_m < 0:
        return True, ""
    if loss_min_usd_m is None or loss_min_usd_m < 0:
        return True, ""
    LARGE_PHARMA_THRESHOLD_USD_M = 1000  # $1B
    MIN_EXPECTED_LOSS_USD_M = 1.0  # $1M
    if revenue_usd_m >= LARGE_PHARMA_THRESHOLD_USD_M and loss_min_usd_m < MIN_EXPECTED_LOSS_USD_M:
        return False, (
            f"Validation flag: Revenue is ${revenue_usd_m:.0f}M (large pharma) but estimated loss is below $1M. "
            "Result may be unrealistic; consider data quality or impact assumptions."
        )
    return True, ""


def get_calculation_breakdown(
    company: str,
    original_revenue: float,
    currency: str,
    unit_scale: str,
    market: str,
    revenue_usd_m: float,
    impact_percentage: float,
    risk_probability: float,
    loss_min_usd_m: float,
    loss_max_usd_m: float,
    validation_passed: bool,
    validation_message: str,
) -> Dict[str, Any]:
    """
    Build breakdown for "How This Was Calculated": original revenue, conversion, formula, final units.
    """
    cur = (currency or "USD").upper()
    scale = (unit_scale or "millions").lower()
    rev_label = f"{original_revenue:,.0f}" if original_revenue >= 1 else f"{original_revenue}"
    if cur == "INR" and scale == "crores":
        original_rev_text = f"Original revenue: ₹{rev_label} Cr ({company})"
        conversion_text = (
            f"Conversion: ₹1 Cr = ${CRORE_TO_USD_MILLIONS:.4f} M USD (1 USD = {INR_PER_USD:.0f} INR). "
            f"→ {revenue_usd_m:.2f} USD millions."
        )
    else:
        original_rev_text = f"Original revenue: {cur} {rev_label} ({scale}) ({company})"
        conversion_text = f"Standardized to USD millions: {revenue_usd_m:.2f} M USD."
    formula_text = (
        f"Formula: loss = standardized_revenue × impact_percentage × risk_probability. "
        f"Impact = {impact_percentage*100:.1f}%, probability = {risk_probability*100:.1f}%. "
        f"Base loss = {revenue_usd_m:.2f} × {impact_percentage:.3f} × {risk_probability:.2f} = "
        f"{revenue_usd_m * impact_percentage * risk_probability:.2f} USD M (range ±20%)."
    )
    final_units_text = (
        f"Final loss range: {loss_min_usd_m:.2f}–{loss_max_usd_m:.2f} USD millions. "
        f"Display: {format_loss_usd(loss_min_usd_m)} – {format_loss_usd(loss_max_usd_m)}"
    )
    if market and market.lower() == "india":
        final_units_text += f" (India: also shown in ₹ Crore)."
    return {
        "original_revenue": original_rev_text,
        "conversion": conversion_text,
        "formula": formula_text,
        "final_units": final_units_text,
        "validation_passed": validation_passed,
        "validation_message": validation_message or None,
    }
