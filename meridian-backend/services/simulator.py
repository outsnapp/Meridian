"""
Demo event simulator for MERIDIAN backend.
Injects realistic pharma intelligence events for hackathon demonstrations.
"""

import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def inject_demo_events(db: Session) -> int:
    """
    Insert hardcoded demo events into the Event table.
    Covers all event types and roles with realistic pharma scenarios.
    
    Args:
        db: Database session
        
    Returns:
        Count of events inserted
    """
    from models import Event
    
    def _demo(title, summary, event_type, matched_role, tags, impact, suggested_action,
              primary_outcome="", what_is_changing="", why_it_matters="", what_to_do_now="",
              decision_urgency="", recommended_next_step="", assumptions="", confidence_level="Medium", **kw):
        return {
            "title": title, "summary": summary, "event_type": event_type, "matched_role": matched_role,
            "tags": tags, "impact": impact, "suggested_action": suggested_action,
            "primary_outcome": primary_outcome or impact,
            "what_is_changing": what_is_changing or summary[:200],
            "why_it_matters": why_it_matters or impact,
            "what_to_do_now": what_to_do_now or suggested_action,
            "decision_urgency": decision_urgency or "Review within 2 weeks",
            "recommended_next_step": recommended_next_step or suggested_action,
            "impact_analysis": impact,
            "confidence_level": confidence_level,
            "assumptions": assumptions or "Based on EMA authorization timelines and historical reference product erosion patterns.",
            **kw,
        }

    # Demo events with full schema
    demo_events = [
        _demo(
            "Competitive Entry: Biosimilar Approval in EU",
            "EMA has granted marketing authorization for X-Bio, impacting market share projections for Q4 across oncology portfolios.",
            "Risk", "Commercial", "biosimilar,EMA,competition,oncology,EU",
            "Potential biosimilar entry may reduce Q4 revenues by 12.4% across EU markets.",
            "Adjust Pricing Model",
            primary_outcome="Protect an estimated $340M in annual EU oncology revenue by securing formulary position before Q3 lock-in windows close.",
            what_is_changing="EMA authorization of X-Bio's biosimilar creates a 6-to-9-month window before meaningful market erosion begins. Historical precedent from prior biosimilar entries in the EU5 shows reference products lose 15-20% volume share within the first 12 months when defensive repricing is delayed past formulary decision cycles.",
            why_it_matters="Delaying action past Q2 risks ceding market share that is structurally difficult to recover once biosimilar substitution becomes the default in national tender processes. Bundling strategies across the oncology portfolio can further insulate against single-product switching pressure.",
            what_to_do_now="Initiate immediate repricing in Germany, France, and Italy. Accelerate value-based agreements that lock in volume commitments from key hospital and specialty pharmacy accounts.",
            decision_urgency="High -- EU formulary lock-in windows close within 90 days; delayed response risks irreversible volume loss in Germany, France, and Italy.",
            recommended_next_step="Convene a cross-functional war room within 5 business days to finalize the EU pricing corridor and competitive response playbook.",
            assumptions="Based on EMA authorization timelines, EU5 biosimilar adoption curves from 2018-2024, and historical reference product erosion patterns in oncology.",
            confidence_level="High",
            timestamp=datetime.utcnow() - timedelta(hours=2),
            source="Simulation",
        ),
        _demo(
            "FDA Grants Breakthrough Therapy Designation",
            "FDA has awarded Breakthrough Therapy designation to our JAK inhibitor candidate for moderate-to-severe atopic dermatitis, accelerating regulatory pathway.",
            "Expansion", "Strategy", "FDA,breakthrough,dermatology,regulatory,approval",
            "Potential 18-24 month acceleration in U.S. market entry, addressing $4.2B dermatology market opportunity.",
            "Fast-track Phase 3 completion and prepare pre-launch commercial infrastructure for Q2 2025 target.",
            decision_urgency="Medium", confidence_level="High",
            timestamp=datetime.utcnow() - timedelta(hours=4),
            source="Simulation",
        ),
        _demo(
            "FDA Safety Alert: Cardiovascular Risk Signal",
            "FDA issued safety communication regarding potential cardiovascular events in patients taking JAK inhibitors, requiring label update and REMS program.",
            "Risk", "Medical", "FDA,safety,adverse-event,JAK-inhibitor,cardiology",
            "Mandatory label revision and Risk Evaluation and Mitigation Strategy (REMS) implementation required within 90 days.",
            "Convene Medical Affairs team to develop prescriber education program and update clinical guidelines.",
            decision_urgency="High", confidence_level="High",
            timestamp=datetime.utcnow() - timedelta(hours=6),
            source="Simulation",
        ),
        _demo(
            "Medicare Part B Reimbursement Enhancement",
            "CMS finalized rule increasing Part B reimbursement rates by 5% for high-efficacy biologics in immunology, effective January 2025.",
            "Expansion", "Finance", "Medicare,CMS,reimbursement,immunology,pricing",
            "Estimated $48-84M incremental margin opportunity across immunology portfolio with improved payer access.",
            "Align portfolio positioning and market access strategy to capitalize on reimbursement advantage.",
            decision_urgency="Medium", confidence_level="Medium",
            timestamp=datetime.utcnow() - timedelta(hours=8),
            source="Simulation",
        ),
        _demo(
            "EMA Initiates Post-Market Safety Review",
            "European Medicines Agency launched routine pharmacovigilance review of biologics class following cumulative adverse event reporting.",
            "Operational", "Medical", "EMA,pharmacovigilance,biologics,safety-review,compliance",
            "Standard 6-month review process requiring submission of cumulative safety data and post-market surveillance reports.",
            "Prepare comprehensive safety dossier and coordinate with EU regulatory affairs for timely submission.",
            decision_urgency="Medium", confidence_level="Medium",
            timestamp=datetime.utcnow() - timedelta(hours=12),
            source="Simulation",
        ),
        _demo(
            "Generic Entry Accelerated via Patent Challenge",
            "U.S. District Court ruled in favor of generic manufacturer in patent infringement case, clearing path for early market entry 18 months ahead of patent expiry.",
            "Risk", "Strategy", "patent,generic,litigation,IP,revenue-risk",
            "Accelerated generic competition threatens $620M annual U.S. revenue base with 70-80% erosion upon entry.",
            "Evaluate authorized generic strategy and explore life-cycle management options including new formulations.",
            decision_urgency="High", confidence_level="High",
            timestamp=datetime.utcnow() - timedelta(hours=16),
            source="Simulation",
        ),
        _demo(
            "NICE Technology Appraisal Consultation Opens",
            "UK NICE published draft guidance for technology appraisal of our oncology product, opening 4-week stakeholder consultation period.",
            "Operational", "Commercial", "NICE,HTA,UK,reimbursement,oncology",
            "Draft guidance recommends restricted use pending additional cost-effectiveness data, impacting UK formulary positioning.",
            "Submit stakeholder response with updated health economic model and real-world evidence by consultation deadline.",
            decision_urgency="Medium", confidence_level="Medium",
            timestamp=datetime.utcnow() - timedelta(hours=20),
            source="Simulation",
        ),
    ]
    
    count = 0
    for event_data in demo_events:
        event = Event(**event_data)
        db.add(event)
        count += 1
    
    try:
        db.commit()
        logger.info(f"[OK] Successfully injected {count} demo events")
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] Database error during simulation: {str(e)}")
        raise
    
    return count
