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
    
    # Sample article URLs for demo (simulated sources)
    _urls = [
        "https://www.reuters.com/business/healthcare-pharmaceuticals/ema-biosimilar-authorization",
        "https://www.fda.gov/news-events/fda-newsroom/fda-grants-breakthrough-therapy",
        "https://www.fda.gov/safety/medwatch-safety-alerts/cardiovascular-risk-jak-inhibitors",
        "https://www.cms.gov/newsroom/medicare-part-b-reimbursement-2025",
        "https://www.ema.europa.eu/en/news/pharmacovigilance-review-biologics",
        "https://www.reuters.com/legal/patent-litigation-generic-entry",
        "https://www.nice.org.uk/guidance/technology-appraisal-consultation",
    ]

    def _demo(title, summary, event_type, matched_role, tags, impact, suggested_action,
              primary_outcome="", what_is_changing="", why_it_matters="", what_to_do_now="",
              decision_urgency="", recommended_next_step="", assumptions="", confidence_level="Medium",
              messaging_instructions="", positioning_before="", positioning_after="", agent_action_log="[]",
              article_url=None, **kw):
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
            "messaging_instructions": messaging_instructions,
            "positioning_before": positioning_before,
            "positioning_after": positioning_after,
            "agent_action_log": agent_action_log,
            "article_url": article_url,
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
            messaging_instructions="• Lead with formulary lock-in urgency—emphasize 90-day window. • Do not promise price concessions beyond approved corridor. • Medical reps: highlight oncology portfolio differentiation; Sales: focus on Germany, France, Italy account plans. • Avoid discussing competitor by name in HCP materials.",
            positioning_before="Reference product pricing; standard oncology portfolio messaging.",
            positioning_after="Defensive value positioning; formulary commitment and volume guarantees.",
            agent_action_log='[{"action":"Update EU account playbooks","role":"Commercial","timestamp":"—"},{"action":"Revise HCP objection handlers","role":"Medical","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=2),
            source="Simulation",
            article_url=_urls[0],
        ),
        _demo(
            "FDA Grants Breakthrough Therapy Designation",
            "FDA has awarded Breakthrough Therapy designation to our JAK inhibitor candidate for moderate-to-severe atopic dermatitis, accelerating regulatory pathway.",
            "Expansion", "Strategy", "FDA,breakthrough,dermatology,regulatory,approval",
            "Potential 18-24 month acceleration in U.S. market entry, addressing $4.2B dermatology market opportunity.",
            "Fast-track Phase 3 completion and prepare pre-launch commercial infrastructure for Q2 2025 target.",
            decision_urgency="Medium", confidence_level="High",
            messaging_instructions="• Emphasize Breakthrough designation and accelerated pathway. • Lead with differentiation in atopic dermatitis; do not overstate timelines. • Medical: prepare efficacy/safety summary for advisory boards. • Sales: coordinate with market access on launch sequencing.",
            positioning_before="Pipeline candidate; standard dermatology development messaging.",
            positioning_after="Breakthrough-designated asset; accelerated U.S. entry narrative.",
            agent_action_log='[{"action":"Draft launch readiness checklist","role":"Commercial","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=4),
            source="Simulation",
            article_url=_urls[1],
        ),
        _demo(
            "FDA Safety Alert: Cardiovascular Risk Signal",
            "FDA issued safety communication regarding potential cardiovascular events in patients taking JAK inhibitors, requiring label update and REMS program.",
            "Risk", "Medical", "FDA,safety,adverse-event,JAK-inhibitor,cardiology",
            "Mandatory label revision and Risk Evaluation and Mitigation Strategy (REMS) implementation required within 90 days.",
            "Convene Medical Affairs team to develop prescriber education program and update clinical guidelines.",
            decision_urgency="High", confidence_level="High",
            messaging_instructions="• Do not downplay cardiovascular risk; lead with transparency. • Medical reps: distribute prescriber education; ensure REMS compliance. • Pause promotional claims until label updated. • HCP materials: use FDA-approved safety language only.",
            positioning_before="Standard JAK inhibitor safety profile; cardiovascular monitoring as per label.",
            positioning_after="Enhanced monitoring messaging; REMS-compliant safety narrative.",
            agent_action_log='[{"action":"Develop prescriber education program","role":"Medical","timestamp":"—"},{"action":"Update promotional materials for label","role":"Compliance","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=6),
            source="Simulation",
            article_url=_urls[2],
        ),
        _demo(
            "Medicare Part B Reimbursement Enhancement",
            "CMS finalized rule increasing Part B reimbursement rates by 5% for high-efficacy biologics in immunology, effective January 2025.",
            "Expansion", "Finance", "Medicare,CMS,reimbursement,immunology,pricing",
            "Estimated $48-84M incremental margin opportunity across immunology portfolio with improved payer access.",
            "Align portfolio positioning and market access strategy to capitalize on reimbursement advantage.",
            decision_urgency="Medium", confidence_level="Medium",
            messaging_instructions="• Lead with reimbursement advantage for high-efficacy biologics. • Field teams: use CMS final rule in formulary discussions. • Finance/Market Access: align on pricing corridor. • Do not overstate margin uplift; use conservative estimates.",
            positioning_before="Standard immunology reimbursement narrative.",
            positioning_after="CMS-recognized efficacy premium; improved payer access.",
            agent_action_log='[{"action":"Update reimbursement calculators","role":"Market Access","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=8),
            source="Simulation",
            article_url=_urls[3],
        ),
        _demo(
            "EMA Initiates Post-Market Safety Review",
            "European Medicines Agency launched routine pharmacovigilance review of biologics class following cumulative adverse event reporting.",
            "Operational", "Medical", "EMA,pharmacovigilance,biologics,safety-review,compliance",
            "Standard 6-month review process requiring submission of cumulative safety data and post-market surveillance reports.",
            "Prepare comprehensive safety dossier and coordinate with EU regulatory affairs for timely submission.",
            decision_urgency="Medium", confidence_level="Medium",
            messaging_instructions="• Prepare cumulative safety dossier; coordinate with EU regulatory. • Medical: ensure pharmacovigilance data is current. • Do not speculate on review outcome. • Use standard compliance language in all communications.",
            positioning_before="Routine pharmacovigilance; established safety profile.",
            positioning_after="Active safety review; data-driven compliance narrative.",
            agent_action_log='[{"action":"Submit safety dossier to EMA","role":"Regulatory","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=12),
            source="Simulation",
            article_url=_urls[4],
        ),
        _demo(
            "Generic Entry Accelerated via Patent Challenge",
            "U.S. District Court ruled in favor of generic manufacturer in patent infringement case, clearing path for early market entry 18 months ahead of patent expiry.",
            "Risk", "Strategy", "patent,generic,litigation,IP,revenue-risk",
            "Accelerated generic competition threatens $620M annual U.S. revenue base with 70-80% erosion upon entry.",
            "Evaluate authorized generic strategy and explore life-cycle management options including new formulations.",
            decision_urgency="High", confidence_level="High",
            messaging_instructions="• Prepare for accelerated generic erosion; update account plans. • Do not discuss litigation; focus on value and lifecycle strategy. • Sales: prioritize high-value accounts; Medical: support authorized generic discussions if applicable.",
            positioning_before="Patent-protected; exclusivity narrative.",
            positioning_after="Lifecycle management; value retention and authorized generic options.",
            agent_action_log='[{"action":"Evaluate authorized generic strategy","role":"Strategy","timestamp":"—"},{"action":"Revise revenue forecasts","role":"Finance","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=16),
            source="Simulation",
            article_url=_urls[5],
        ),
        _demo(
            "NICE Technology Appraisal Consultation Opens",
            "UK NICE published draft guidance for technology appraisal of our oncology product, opening 4-week stakeholder consultation period.",
            "Operational", "Commercial", "NICE,HTA,UK,reimbursement,oncology",
            "Draft guidance recommends restricted use pending additional cost-effectiveness data, impacting UK formulary positioning.",
            "Submit stakeholder response with updated health economic model and real-world evidence by consultation deadline.",
            decision_urgency="Medium", confidence_level="Medium",
            messaging_instructions="• Submit stakeholder response with updated health economic model. • Lead with real-world evidence; address cost-effectiveness concerns. • Do not criticize NICE process. • Market Access: coordinate with UK team on submission timeline.",
            positioning_before="Standard UK formulary positioning.",
            positioning_after="Evidence-enhanced value narrative; NICE consultation response.",
            agent_action_log='[{"action":"Submit NICE stakeholder response","role":"Market Access","timestamp":"—"}]',
            timestamp=datetime.utcnow() - timedelta(hours=20),
            source="Simulation",
            article_url=_urls[6],
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
