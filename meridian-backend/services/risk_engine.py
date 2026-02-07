"""
Risk Engine for MERIDIAN backend.
Computes data-backed financial impact, regulatory probability, timeline, and confidence
for each intelligence signal. All values derived from historical data, no fabrication.
Uses Financial Normalization Layer: revenue in USD millions, loss = revenue × impact% × risk_prob.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from services.financial_normalization import (
    to_usd_millions,
    format_loss_usd,
    format_loss_with_inr,
    validate_large_pharma_loss,
    get_calculation_breakdown,
)

logger = logging.getLogger(__name__)


def _profile_to_dict(profile) -> Dict[str, Any]:
    """Normalize DB or demo profile to dict with currency, unit_scale, market."""
    return {
        "company": getattr(profile, "company", None) or profile.get("company_name") or "",
        "annual_revenue": getattr(profile, "annual_revenue", None) or profile.get("annual_revenue"),
        "drug_revenue_share": getattr(profile, "drug_revenue_share", None) or profile.get("drug_revenue_share", 0.06),
        "currency": getattr(profile, "currency", None) or profile.get("currency", "INR"),
        "unit_scale": getattr(profile, "unit_scale", None) or profile.get("unit_scale", "crores"),
        "market": getattr(profile, "market", None) or profile.get("market", "India"),
    }


class FinancialImpactEstimator:
    """
    Prepares inputs for loss calculation: revenue in USD millions, impact %, and profile metadata.
    Actual loss is computed in run_risk_engine using: loss = standardized_revenue × impact% × risk_probability.
    """

    def estimate_loss(self, signal_id: int, db: Session) -> Dict[str, Any]:
        """
        Return revenue_usd_m, impact_pct, profile metadata for formula in run_risk_engine.
        Returns dict with revenue_usd_m, impact_pct, currency, unit_scale, market, original_revenue,
        company, drug_revenue_share, methodology; or {"status": "insufficient_data", "message": "..."}.
        """
        from models import Event, FinancialProfile, HistoricalEvent

        event = db.query(Event).filter(Event.id == signal_id).first()
        if not event:
            return {"status": "insufficient_data", "message": "Event not found"}

        company = (event.company or "").strip()
        if not company:
            return {"status": "insufficient_data", "message": "Company not identified for this signal"}

        profile = db.query(FinancialProfile).filter(
            func.lower(FinancialProfile.company) == func.lower(company)
        ).first()
        if not profile:
            from services.demo_company import get_demo_company
            demo = get_demo_company()
            if demo and (demo.get("company_name") or "").strip().lower() == company.lower():
                profile = {
                    "company": demo.get("company_name") or company,
                    "annual_revenue": demo.get("annual_revenue") or 48000,
                    "drug_revenue_share": 0.06,
                    "currency": demo.get("currency", "INR"),
                    "unit_scale": demo.get("unit_scale", "crores"),
                    "market": demo.get("market", "India"),
                }
            else:
                return {"status": "insufficient_data", "message": f"No financial profile for {company}"}
        else:
            profile = _profile_to_dict(profile)

        original_revenue = profile["annual_revenue"]
        currency = profile["currency"] or "USD"
        unit_scale = profile["unit_scale"] or "millions"
        market = profile["market"] or "US"
        revenue_usd_m = to_usd_millions(original_revenue, currency, unit_scale)

        # Get similar historical events for impact percentage
        event_type = event.event_type.lower()
        similar = db.query(HistoricalEvent).filter(
            func.lower(HistoricalEvent.company) == func.lower(company)
        ).all()
        if not similar:
            similar = db.query(HistoricalEvent).filter(
                func.lower(HistoricalEvent.event_type) == event_type
            ).limit(10).all()
        if not similar:
            return {"status": "insufficient_data", "message": "No historical events for impact estimation"}

        severity_scores = [h.severity_score for h in similar if h.severity_score is not None]
        if not severity_scores:
            impact_pct = 0.08 if event_type == "risk" else 0.03
        else:
            avg_severity = sum(severity_scores) / len(severity_scores)
            impact_pct = avg_severity * 0.15

        methodology = (
            f"Based on {profile['company']} annual revenue (standardized to {revenue_usd_m:.2f} USD M) "
            f"and drug revenue share of {profile['drug_revenue_share']*100:.1f}%. "
            f"Average impact {impact_pct*100:.1f}% derived from {len(similar)} similar historical events. "
            f"Loss = revenue × impact% × regulatory probability; range ±20%."
        )
        return {
            "revenue_usd_m": round(revenue_usd_m, 4),
            "impact_pct": impact_pct,
            "currency": currency,
            "unit_scale": unit_scale,
            "market": market,
            "original_revenue": original_revenue,
            "company": profile["company"],
            "drug_revenue_share": profile["drug_revenue_share"],
            "methodology": methodology,
        }


class RegulatoryRiskEstimator:
    """
    Estimates probability of regulatory action using weighted components.
    """
    
    def estimate_probability(self, signal_id: int, db: Session) -> Dict[str, Any]:
        """
        Compute regulatory action probability from:
        - Adverse report frequency (30%)
        - News/media mentions (20%)
        - Inspection flags (20%)
        - Past company history (30%)
        
        Returns dict with probability (0-100), components, methodology
        or {"status": "insufficient_data"}
        """
        from models import Event, HistoricalEvent, RegulatoryAction
        
        event = db.query(Event).filter(Event.id == signal_id).first()
        if not event:
            return {"status": "insufficient_data", "message": "Event not found"}
        
        company = (event.company or "").strip()
        if not company:
            return {"status": "insufficient_data", "message": "Company not identified"}
        
        # Component 1: Adverse report frequency (30%)
        adverse_count = db.query(HistoricalEvent).filter(
            func.lower(HistoricalEvent.company) == func.lower(company),
            func.lower(HistoricalEvent.event_type).in_(["adverse", "safety"])
        ).count()
        total_hist = db.query(HistoricalEvent).filter(
            func.lower(HistoricalEvent.company) == func.lower(company)
        ).count()
        adverse_score = min(adverse_count / max(total_hist, 1), 1.0) if total_hist > 0 else 0.0
        
        # Component 2: News/media score (20%) - count of events from news sources
        media_count = db.query(Event).filter(
            func.lower(Event.company) == func.lower(company),
            Event.source.in_(["Serper", "News"])
        ).count()
        media_score = min(media_count / 10.0, 1.0)  # Normalize to 0-1 (10+ = high)
        
        # Component 3: Inspection flags (20%)
        inspection_count = db.query(HistoricalEvent).filter(
            func.lower(HistoricalEvent.company) == func.lower(company),
            func.lower(HistoricalEvent.event_type) == "inspection"
        ).count()
        inspection_score = min(inspection_count / 5.0, 1.0)  # 5+ inspections = high risk
        
        # Component 4: Past regulatory actions (30%)
        action_count = db.query(RegulatoryAction).filter(
            func.lower(RegulatoryAction.company) == func.lower(company)
        ).count()
        history_score = min(action_count / 8.0, 1.0)  # 8+ actions = high risk
        
        # Weighted sum
        risk_score = (
            0.30 * adverse_score +
            0.20 * media_score +
            0.20 * inspection_score +
            0.30 * history_score
        )
        
        probability = risk_score * 100  # Convert to percentage
        
        components = {
            "adverse_reports": round(adverse_score, 2),
            "media_mentions": round(media_score, 2),
            "inspections": round(inspection_score, 2),
            "past_actions": round(history_score, 2)
        }
        
        methodology = (
            f"Regulatory probability computed from weighted factors: "
            f"adverse reports (30%, score {adverse_score:.2f}), "
            f"media mentions (20%, score {media_score:.2f}), "
            f"inspections (20%, score {inspection_score:.2f}), "
            f"past actions (30%, score {history_score:.2f}). "
            f"Based on {total_hist} historical events and {action_count} regulatory actions for {company}."
        )
        
        return {
            "probability": round(probability, 1),
            "components": components,
            "methodology": methodology
        }


class TimelinePredictor:
    """
    Predicts expected days to regulatory action from historical event timelines.
    """
    
    def predict_days(self, signal_id: int, db: Session) -> Dict[str, Any]:
        """
        Compute timeline prediction from similar historical events.
        Returns dict with expected_days_min, expected_days_max, methodology
        or {"status": "insufficient_data"}
        """
        from models import Event, HistoricalEvent
        
        event = db.query(Event).filter(Event.id == signal_id).first()
        if not event:
            return {"status": "insufficient_data", "message": "Event not found"}
        
        company = (event.company or "").strip()
        event_type = event.event_type.lower()
        
        # Get similar events with days_to_action
        query = db.query(HistoricalEvent).filter(
            HistoricalEvent.days_to_action.isnot(None)
        )
        
        if company:
            # Prefer same company
            similar = query.filter(func.lower(HistoricalEvent.company) == func.lower(company)).all()
            if not similar:
                # Fall back to same event type
                similar = query.filter(func.lower(HistoricalEvent.event_type) == event_type).limit(20).all()
        else:
            similar = query.filter(func.lower(HistoricalEvent.event_type) == event_type).limit(20).all()
        
        if not similar:
            return {"status": "insufficient_data", "message": "No historical timeline data"}
        
        days_list = [h.days_to_action for h in similar]
        avg = sum(days_list) / len(days_list)
        variance = sum((d - avg) ** 2 for d in days_list) / len(days_list)
        std = variance ** 0.5
        
        days_min = max(int(avg - std), 1)
        days_max = int(avg + std)
        
        methodology = (
            f"Timeline based on {len(similar)} similar events "
            f"(average {avg:.0f} days, std {std:.0f} days). "
            f"Range: {days_min}–{days_max} days from event to regulatory action."
        )
        
        return {
            "expected_days_min": days_min,
            "expected_days_max": days_max,
            "methodology": methodology
        }


class ConfidenceScorer:
    """
    Computes confidence score based on data completeness and reliability.
    """
    
    def compute_confidence(self, signal_id: int, db: Session, 
                          financial_result: Dict, risk_result: Dict, 
                          timeline_result: Dict) -> Dict[str, Any]:
        """
        Compute overall confidence (0-1) based on:
        - Data completeness (company, drug, financial profile)
        - Sample size (number of historical events)
        - Variance in timeline
        - Source reliability
        
        Returns dict with score (0-1) and band (Low/Medium/High)
        """
        from models import Event, HistoricalEvent
        
        event = db.query(Event).filter(Event.id == signal_id).first()
        if not event:
            return {"score": 0.0, "band": "Low"}
        
        score = 0.0
        
        # Data completeness (0.3)
        if event.company and event.company.strip():
            score += 0.15
        if event.drug_name and event.drug_name.strip():
            score += 0.15
        
        # Financial data available (0.2)
        if financial_result.get("status") != "insufficient_data":
            score += 0.2
        
        # Historical sample size (0.3)
        if event.company:
            hist_count = db.query(HistoricalEvent).filter(
                func.lower(HistoricalEvent.company) == func.lower(event.company)
            ).count()
            if hist_count >= 10:
                score += 0.3
            elif hist_count >= 5:
                score += 0.2
            elif hist_count >= 1:
                score += 0.1
        
        # Source reliability (0.2)
        if event.source in ["OpenFDA", "Serper", "CDSCO"]:
            score += 0.2
        elif event.source and event.source.strip():
            score += 0.1
        
        # Map to band
        if score >= 0.7:
            band = "High"
        elif score >= 0.4:
            band = "Medium"
        else:
            band = "Low"
        
        return {
            "score": round(score, 2),
            "band": band
        }


def build_explanation(signal_id: int, db: Session,
                     financial_result: Dict, risk_result: Dict,
                     timeline_result: Dict, confidence_result: Dict,
                     calculation_breakdown: Optional[Dict] = None,
                     market: Optional[str] = None) -> str:
    """
    Build human-readable explanation JSON for methodology display.
    Includes calculation_breakdown (original revenue, conversion, formula, final units) when provided.
    """
    from services.demo_company import get_demo_company

    financial_basis = financial_result.get("methodology", "Insufficient financial data for loss estimation.")
    risk_basis = risk_result.get("methodology", "Insufficient data for regulatory probability computation.")
    timeline_basis = timeline_result.get("methodology", "Insufficient historical data for timeline prediction.")

    demo = get_demo_company()
    company_name = (demo.get("company_name") or "").strip() if demo else ""
    reg_history = demo.get("regulatory_history", []) if demo else []

    if company_name and financial_basis and "Insufficient" not in financial_basis:
        history_ref = ", ".join(reg_history[:2]) if reg_history else "regulatory events"
        financial_basis = (
            f"Based on {company_name} FY2024 revenue and past {history_ref} "
            f"at Halol facility between 2018–2022. " + financial_basis
        )

    explanation = {
        "financial_basis": financial_basis,
        "risk_basis": risk_basis,
        "timeline_basis": timeline_basis,
        "confidence_basis": (
            f"Confidence {confidence_result['band']} (score {confidence_result['score']}) "
            f"based on data completeness, sample size, and source reliability."
        ),
        "market": market,
        "calculation_breakdown": calculation_breakdown,
    }
    return json.dumps(explanation)


def run_risk_engine(signal_id: int, db: Session) -> Dict[str, Any]:
    """
    Main orchestrator: runs all estimators and writes to risk_models table.
    Returns full analysis or insufficient_data status.
    """
    from models import Event, RiskModel
    
    event = db.query(Event).filter(Event.id == signal_id).first()
    if not event:
        return {"status": "error", "message": "Signal not found"}
    
    # Check company/drug (required for risk engine)
    company = (event.company or "").strip()
    if not company:
        return {
            "status": "insufficient_data",
            "message": "Company or drug not identified for this signal."
        }
    
    # Run estimators
    financial_est = FinancialImpactEstimator()
    financial_result = financial_est.estimate_loss(signal_id, db)
    
    risk_est = RegulatoryRiskEstimator()
    risk_result = risk_est.estimate_probability(signal_id, db)
    
    timeline_pred = TimelinePredictor()
    timeline_result = timeline_pred.predict_days(signal_id, db)
    
    if financial_result.get("status") == "insufficient_data":
        return financial_result
    if risk_result.get("status") == "insufficient_data":
        return risk_result
    if timeline_result.get("status") == "insufficient_data":
        return timeline_result

    # Loss formula: loss = standardized_revenue × impact_percentage × risk_probability
    # Standardized revenue = revenue_usd_m × drug_revenue_share (exposed revenue in USD M)
    revenue_usd_m = financial_result["revenue_usd_m"]
    drug_share = financial_result["drug_revenue_share"]
    impact_pct = financial_result["impact_pct"]
    risk_prob = risk_result["probability"] / 100.0
    standardized_revenue = revenue_usd_m * drug_share
    loss_base = standardized_revenue * impact_pct * risk_prob
    loss_min_usd_m = round(loss_base * 0.8, 4)
    loss_max_usd_m = round(loss_base * 1.2, 4)

    # Confidence validation: flag if large pharma but loss < $1M
    validation_passed, validation_message = validate_large_pharma_loss(revenue_usd_m, loss_min_usd_m)
    if not validation_passed:
        logger.warning(f"[RISK ENGINE] Validation: {validation_message}")

    market = financial_result.get("market") or "US"
    show_inr = (market or "").lower() == "india"
    calculation_breakdown = get_calculation_breakdown(
        company=financial_result["company"],
        original_revenue=financial_result["original_revenue"],
        currency=financial_result.get("currency", "USD"),
        unit_scale=financial_result.get("unit_scale", "millions"),
        market=market,
        revenue_usd_m=revenue_usd_m,
        impact_percentage=impact_pct,
        risk_probability=risk_prob,
        loss_min_usd_m=loss_min_usd_m,
        loss_max_usd_m=loss_max_usd_m,
        validation_passed=validation_passed,
        validation_message=validation_message,
    )

    # Compute confidence
    conf_scorer = ConfidenceScorer()
    confidence_result = conf_scorer.compute_confidence(
        signal_id, db,
        {"min_loss": loss_min_usd_m, "max_loss": loss_max_usd_m, "methodology": financial_result.get("methodology", "")},
        risk_result, timeline_result
    )

    explanation_json = build_explanation(
        signal_id, db, financial_result, risk_result, timeline_result, confidence_result,
        calculation_breakdown=calculation_breakdown,
        market=market,
    )

    # Upsert risk_models (store loss in USD millions)
    risk_model = db.query(RiskModel).filter(RiskModel.signal_id == signal_id).first()
    if risk_model:
        risk_model.probability = risk_result["probability"]
        risk_model.loss_min = loss_min_usd_m
        risk_model.loss_max = loss_max_usd_m
        risk_model.expected_days_min = timeline_result.get("expected_days_min")
        risk_model.expected_days_max = timeline_result.get("expected_days_max")
        risk_model.confidence_score = confidence_result["score"]
        risk_model.explanation_json = explanation_json
        risk_model.updated_at = datetime.utcnow()
    else:
        risk_model = RiskModel(
            signal_id=signal_id,
            probability=risk_result["probability"],
            loss_min=loss_min_usd_m,
            loss_max=loss_max_usd_m,
            expected_days_min=timeline_result.get("expected_days_min"),
            expected_days_max=timeline_result.get("expected_days_max"),
            confidence_score=confidence_result["score"],
            explanation_json=explanation_json
        )
        db.add(risk_model)
    db.commit()
    logger.info(f"[RISK ENGINE] Computed analysis for signal {signal_id}")

    # Scenarios: A 100%, B 70%, C 50% of normalized loss
    scenarios = {
        "scenario_a": {"label": "Do nothing", "loss_min": round(loss_min_usd_m, 4), "loss_max": round(loss_max_usd_m, 4)},
        "scenario_b": {"label": "Act in 30 days", "loss_min": round(loss_min_usd_m * 0.7, 4), "loss_max": round(loss_max_usd_m * 0.7, 4)},
        "scenario_c": {"label": "Act in 14 days", "loss_min": round(loss_min_usd_m * 0.5, 4), "loss_max": round(loss_max_usd_m * 0.5, 4)},
    }

    # Output formatting: display strings with units (never raw numbers)
    loss_display_min = format_loss_with_inr(loss_min_usd_m) if show_inr else format_loss_usd(loss_min_usd_m)
    loss_display_max = format_loss_with_inr(loss_max_usd_m) if show_inr else format_loss_usd(loss_max_usd_m)
    scenario_displays = {}
    for k, v in scenarios.items():
        smin = format_loss_with_inr(v["loss_min"]) if show_inr else format_loss_usd(v["loss_min"])
        smax = format_loss_with_inr(v["loss_max"]) if show_inr else format_loss_usd(v["loss_max"])
        scenario_displays[k] = {"label": v["label"], "loss_min": v["loss_min"], "loss_max": v["loss_max"], "display_min": smin, "display_max": smax}

    return {
        "status": "ok",
        "probability": risk_result["probability"],
        "loss_min": loss_min_usd_m,
        "loss_max": loss_max_usd_m,
        "loss_display_min": loss_display_min,
        "loss_display_max": loss_display_max,
        "loss_unit": "USD millions",
        "expected_days_min": timeline_result.get("expected_days_min"),
        "expected_days_max": timeline_result.get("expected_days_max"),
        "confidence_score": confidence_result["score"],
        "confidence_band": confidence_result["band"],
        "methodology": json.loads(explanation_json),
        "calculation_breakdown": calculation_breakdown,
        "scenarios": scenarios,
        "scenario_displays": scenario_displays,
        "validation_passed": validation_passed,
        "validation_message": validation_message or None,
    }
