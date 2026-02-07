"""
SQLAlchemy ORM models for MERIDIAN backend.
Defines RawSource (ingested data) and Event (processed intelligence) tables.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, ForeignKey
from datetime import datetime
from database import Base


class RawSource(Base):
    """
    Raw ingested data from external sources (Serper, OpenFDA, etc.)
    before AI processing.
    """
    __tablename__ = "raw_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)  # "Serper" | "OpenFDA" | "CDSCO" | etc.
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    url = Column(String, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed = Column(Boolean, default=False, nullable=False, index=True)
    
    def __repr__(self):
        return f"<RawSource(id={self.id}, source={self.source}, processed={self.processed})>"


class Event(Base):
    """
    Processed intelligence events ready for frontend consumption.
    Contains AI-classified pharma market intelligence.
    """
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    event_type = Column(String, nullable=False, index=True)  # "Operational" | "Expansion" | "Risk"
    matched_role = Column(String, nullable=False, index=True)  # "Strategy" | "Medical" | "Commercial"
    tags = Column(String, nullable=False)  # CSV string: "biosimilar,EMA,pricing"
    impact = Column(Text, nullable=True)  # Legacy; prefer impact_analysis
    suggested_action = Column(Text, nullable=True)  # Legacy; prefer what_to_do_now
    source = Column(String, nullable=False)  # Origin of the data
    article_url = Column(String, nullable=True)  # Link to scraped article (Serper/OpenFDA)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    # Extended schema fields
    primary_outcome = Column(Text, nullable=True)
    what_is_changing = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    what_to_do_now = Column(Text, nullable=True)
    decision_urgency = Column(Text, nullable=True)
    recommended_next_step = Column(Text, nullable=True)
    impact_analysis = Column(Text, nullable=True)
    confidence_level = Column(String, nullable=True)  # "High" | "Medium" | "Low"
    assumptions = Column(Text, nullable=True)
    fetched_at = Column(DateTime, nullable=True)  # When the raw news was ingested
    # Messaging & Marketing Brief
    messaging_instructions = Column(Text, nullable=True)  # Field-team guidance for doctors/sales/medical
    positioning_before = Column(Text, nullable=True)  # Prior positioning
    positioning_after = Column(Text, nullable=True)  # Recommended new positioning
    agent_action_log = Column(Text, nullable=True)  # Optional JSON: [{action, timestamp, agent}]
    # Risk engine fields
    company = Column(String, nullable=True)  # Company name (extracted from content for risk analysis)
    drug_name = Column(String, nullable=True)  # Drug/product name (extracted from content for risk analysis)

    def __repr__(self):
        return f"<Event(id={self.id}, type={self.event_type}, role={self.matched_role})>"
    
    def to_dict(self):
        """Convert Event to dictionary for JSON serialization. Uses empty string for null."""
        def _str(v):
            return "" if v is None else str(v)
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "event_type": self.event_type,
            "matched_role": self.matched_role,
            "tags": self.tags,
            "impact": _str(self.impact or self.impact_analysis),
            "suggested_action": _str(self.suggested_action or self.what_to_do_now),
            "source": self.source,
            "article_url": _str(self.article_url),
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "updated_at": self.timestamp.strftime("%Y-%m-%d") if self.timestamp else "",
            "primary_outcome": _str(self.primary_outcome),
            "what_is_changing": _str(self.what_is_changing),
            "why_it_matters": _str(self.why_it_matters),
            "what_to_do_now": _str(self.what_to_do_now),
            "decision_urgency": _str(self.decision_urgency),
            "recommended_next_step": _str(self.recommended_next_step),
            "impact_analysis": _str(self.impact_analysis or self.impact),
            "confidence_level": _str(self.confidence_level),
            "assumptions": _str(self.assumptions),
            "whats_changing": _str(self.what_is_changing),
            "confidence": _str(self.confidence_level),
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
            "messaging_instructions": _str(self.messaging_instructions),
            "positioning_before": _str(self.positioning_before),
            "positioning_after": _str(self.positioning_after),
            "agent_action_log": _str(self.agent_action_log),
            "company": _str(self.company),
            "drug_name": _str(self.drug_name),
        }


class HistoricalEvent(Base):
    """
    Historical pharma events for risk engine training data.
    Used to compute impact percentages and timelines from past cases.
    """
    __tablename__ = "historical_events"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False, index=True)
    drug_name = Column(String, nullable=True)
    event_type = Column(String, nullable=False, index=True)  # recall, warning, adverse, inspection, ban
    event_date = Column(DateTime, nullable=False)
    severity_score = Column(Float, nullable=True)  # 0–1 scale
    outcome = Column(String, nullable=True)  # warning_letter, recall, fine, none
    days_to_action = Column(Integer, nullable=True)  # Days from event to regulatory action
    
    def __repr__(self):
        return f"<HistoricalEvent(id={self.id}, company={self.company}, type={self.event_type})>"


class FinancialProfile(Base):
    """
    Financial data for pharma companies.
    Used by risk engine to compute loss estimates.
    All revenue stored in display form; normalized to USD millions internally for loss calculation.
    """
    __tablename__ = "financial_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False, unique=True, index=True)
    annual_revenue = Column(Float, nullable=False)  # In original units (see currency + unit_scale)
    drug_revenue_share = Column(Float, nullable=False)  # 0–1 (e.g. 0.15 = 15% of revenue from this drug category)
    currency = Column(String(10), nullable=True)  # USD, INR, EUR
    unit_scale = Column(String(20), nullable=True)  # thousands, millions, crores, billions
    market = Column(String(20), nullable=True)  # US, India, EU
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<FinancialProfile(company={self.company}, revenue={self.annual_revenue})>"


class RegulatoryAction(Base):
    """
    Regulatory actions taken against companies.
    Used to compute regulatory probability scores.
    """
    __tablename__ = "regulatory_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False, index=True)
    drug = Column(String, nullable=True)
    action_type = Column(String, nullable=False)  # warning, recall, fine, ban, etc.
    issue_date = Column(DateTime, nullable=False)
    related_event_id = Column(Integer, ForeignKey("historical_events.id"), nullable=True)
    
    def __repr__(self):
        return f"<RegulatoryAction(company={self.company}, type={self.action_type})>"


class RiskModel(Base):
    """
    Computed risk analysis for each signal (event).
    Contains financial impact, probability, timeline, and explanation.
    """
    __tablename__ = "risk_models"
    
    id = Column(Integer, primary_key=True, index=True)
    signal_id = Column(Integer, ForeignKey("events.id"), nullable=False, unique=True, index=True)
    probability = Column(Float, nullable=False)  # 0–100 (regulatory action probability %)
    loss_min = Column(Float, nullable=False)  # Minimum estimated financial loss
    loss_max = Column(Float, nullable=False)  # Maximum estimated financial loss
    expected_days_min = Column(Integer, nullable=True)  # Timeline prediction (lower bound)
    expected_days_max = Column(Integer, nullable=True)  # Timeline prediction (upper bound)
    confidence_score = Column(Float, nullable=False)  # 0–1 confidence in the analysis
    explanation_json = Column(Text, nullable=False)  # JSON with methodology details
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<RiskModel(signal_id={self.signal_id}, probability={self.probability})>"


class PredictionTracking(Base):
    """
    Past predictions vs actual outcomes for credibility (e.g. predicted 82 days, actual 79 days).
    """
    __tablename__ = "prediction_tracking"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, nullable=False)
    event_description = Column(String, nullable=False)
    prediction_date = Column(DateTime, nullable=False)
    predicted_days_min = Column(Integer, nullable=False)
    predicted_days_max = Column(Integer, nullable=False)
    actual_days = Column(Integer, nullable=True)
    actual_outcome = Column(String, nullable=True)
    outcome_date = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<PredictionTracking({self.event_description[:30]})>"
