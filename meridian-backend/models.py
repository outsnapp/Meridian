"""
SQLAlchemy ORM models for MERIDIAN backend.
Defines RawSource (ingested data) and Event (processed intelligence) tables.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from datetime import datetime
from database import Base


class RawSource(Base):
    """
    Raw ingested data from external sources (Serper, OpenFDA, etc.)
    before AI processing.
    """
    __tablename__ = "raw_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)  # "Serper" | "OpenFDA" | "Simulation"
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
        }
