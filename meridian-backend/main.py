"""
MERIDIAN Backend - FastAPI Application
Always-on Pharma Market Intelligence System

Main API server with endpoints for data ingestion, processing, and event retrieval.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

# Load environment variables
load_dotenv()

# Import database and models
from database import get_db, init_db
from models import RawSource, Event

# Import services
from services.ingestion import ingest_all, fetch_one_live
from services.llm_engine import process_raw_source, normalize_event_schema, answer_signal_question
from services.precedents import get_precedents

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MERIDIAN Backend",
    description="Always-on Pharma Market Intelligence System API",
    version="1.0.0"
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Initialize database on application startup."""
    logger.info("[STARTUP] Starting MERIDIAN backend...")
    init_db()
    logger.info("[READY] MERIDIAN backend ready")


@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "MERIDIAN Backend",
        "version": "1.0.0"
    }


@app.post("/ingest/live")
def ingest_live(db: Session = Depends(get_db)):
    """
    Fetch data from external sources (Serper + OpenFDA) and save to RawSource table.
    
    Returns:
        Dictionary with count of items ingested
    """
    try:
        logger.info("[INGEST] Starting live data ingestion...")
        count = ingest_all(db)
        return {
            "status": "success",
            "count": count,
            "message": f"Successfully ingested {count} new items (duplicates skipped)"
        }
    except Exception as e:
        logger.error(f"[ERROR] Ingestion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@app.post("/process")
def process_data(db: Session = Depends(get_db)):
    """
    Process unprocessed RawSource records using OpenAI LLM.
    Creates Event records and marks RawSource as processed.
    
    Returns:
        Dictionary with count of items processed
    """
    try:
        logger.info("[PROCESS] Starting LLM processing...")
        
        # Fetch all unprocessed raw sources
        unprocessed = db.query(RawSource).filter(RawSource.processed == False).all()
        
        if not unprocessed:
            return {
                "status": "success",
                "processed": 0,
                "message": "No unprocessed items found"
            }
        
        processed_count = 0
        for raw in unprocessed:
            try:
                # Process with LLM
                event_data = process_raw_source(raw)
                source = (event_data.get("source") or getattr(raw, "source", None) or "").strip()

                # Reject insert if source is missing or invalid (no fallback; discard card)
                if not _is_valid_source(source):
                    logger.warning(f"[PROCESS] Skipping RawSource ID {raw.id}: invalid or empty source")
                    raw.processed = True  # Mark processed so we don't retry indefinitely
                    continue

                # Create Event record (full schema)
                event = Event(
                    title=event_data["title"],
                    summary=event_data["summary"],
                    event_type=event_data["event_type"],
                    matched_role=event_data.get("matched_role", "Strategy"),
                    tags=event_data.get("tags", "pharma,intelligence"),
                    impact=event_data.get("impact_analysis", ""),
                    suggested_action=event_data.get("what_to_do_now", ""),
                    source=source,
                    article_url=getattr(raw, "url", None) or None,
                    fetched_at=raw.fetched_at,
                    primary_outcome=event_data.get("primary_outcome"),
                    what_is_changing=event_data.get("whats_changing", event_data.get("what_is_changing")),
                    why_it_matters=event_data.get("why_it_matters"),
                    what_to_do_now=event_data.get("what_to_do_now"),
                    decision_urgency=event_data.get("decision_urgency"),
                    recommended_next_step=event_data.get("recommended_next_step"),
                    impact_analysis=event_data.get("impact_analysis"),
                    confidence_level=event_data.get("confidence", event_data.get("confidence_level")),
                    assumptions=event_data.get("assumptions"),
                    messaging_instructions=event_data.get("messaging_instructions"),
                    positioning_before=event_data.get("positioning_before"),
                    positioning_after=event_data.get("positioning_after"),
                    agent_action_log=event_data.get("agent_action_log"),
                )
                db.add(event)

                # Mark as processed
                raw.processed = True
                processed_count += 1

            except Exception as e:
                logger.error(f"[ERROR] Failed to process RawSource ID {raw.id}: {str(e)}")
                continue
        
        # Commit all changes
        db.commit()
        
        return {
            "status": "success",
            "processed": processed_count,
            "message": f"Successfully processed {processed_count} items"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] Processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# Invalid/placeholder sources: never return these; reject on insert; cleanup from DB
INVALID_SOURCES = (
    "Simulation",
    "Demo",
    "Not enough verified data yet",
    "Not enough verified data yet.",
    "Insufficient data",
    "Unverified",
    "Pending verification",
    "Unknown source",
    "Unknown",
    "External",
)


def _is_valid_source(source: Optional[str]) -> bool:
    """Require non-empty source not in invalid/placeholder list."""
    if source is None:
        return False
    s = str(source).strip()
    if not s:
        return False
    return s not in INVALID_SOURCES


@app.get("/events")
def get_events(
    role: Optional[str] = Query(None, description="Filter by matched_role (Strategy/Medical/Commercial/Finance)"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    db: Session = Depends(get_db)
):
    """
    Retrieve filtered events from the database.
    
    Query Parameters:
        role: Filter by matched_role (e.g., "Strategy", "Medical", "Commercial")
        tags: Filter by tags (substring match, e.g., "biosimilar")
    
    Returns:
        List of Event objects sorted by timestamp (most recent first)
    """
    try:
        # Only return events with valid, non-empty source (safety net)
        query = db.query(Event).filter(
            Event.source.isnot(None),
            Event.source != "",
            ~Event.source.in_(INVALID_SOURCES),
        )
        
        # Apply role filter
        if role:
            query = query.filter(Event.matched_role == role)
        
        # Apply tags filter (substring match)
        if tags:
            query = query.filter(Event.tags.contains(tags))
        
        # Sort by timestamp descending
        events = query.order_by(Event.timestamp.desc()).all()
        
        # Convert to canonical schema (full fields, no nulls)
        result = [normalize_event_schema(event.to_dict()) for event in events]
        
        logger.info(f"[EVENTS] Retrieved {len(result)} events (role={role}, tags={tags})")
        
        return {
            "status": "success",
            "count": len(result),
            "events": result
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to retrieve events: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retrieval error: {str(e)}")


def _normalize_urgency(raw: Optional[str]) -> str:
    """Map decision_urgency to High, Medium, or Low for aggregation."""
    if not raw or not str(raw).strip():
        return "Low"
    s = str(raw).strip().lower()
    if s.startswith("high"):
        return "High"
    if s.startswith("medium") or s.startswith("moderate"):
        return "Medium"
    if s.startswith("low"):
        return "Low"
    return "Low"


@app.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    """
    Return analytics summary from events in the last 30 days.
    All counts are computed from the Event table; no mock values.
    """
    try:
        cutoff = datetime.utcnow() - timedelta(days=30)
        base = db.query(Event).filter(
            Event.timestamp >= cutoff,
            Event.source.isnot(None),
            Event.source != "",
            ~Event.source.in_(INVALID_SOURCES),
        )

        total_events_30d = base.count()

        by_type = {"Risk": 0, "Expansion": 0, "Operational": 0}
        for row in base.with_entities(Event.event_type, func.count(Event.id)).group_by(Event.event_type).all():
            if row[0] in by_type:
                by_type[row[0]] = row[1]

        by_urgency = {"High": 0, "Medium": 0, "Low": 0}
        urgency_rows = base.with_entities(Event.decision_urgency).all()
        for (raw,) in urgency_rows:
            key = _normalize_urgency(raw)
            by_urgency[key] = by_urgency.get(key, 0) + 1

        by_source = {"OpenFDA": 0, "Serper": 0, "CDSCO": 0}
        for row in base.with_entities(Event.source, func.count(Event.id)).group_by(Event.source).all():
            src = (row[0] or "").strip()
            if src in by_source:
                by_source[src] = row[1]

        by_role = {"Strategy": 0, "Medical": 0, "Commercial": 0}
        for row in base.with_entities(Event.matched_role, func.count(Event.id)).group_by(Event.matched_role).all():
            if row[0] in by_role:
                by_role[row[0]] = row[1]

        return {
            "total_events_30d": total_events_30d,
            "by_type": by_type,
            "by_urgency": by_urgency,
            "by_source": by_source,
            "by_role": by_role,
        }
    except Exception as e:
        logger.error(f"[ERROR] Analytics summary failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


class ChatRequest(BaseModel):
    event_id: int
    question: str
    department: str = "executive"
    messages: Optional[List[dict]] = None  # [{role, content}, ...]


@app.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Answer a user question about a specific intelligence signal.
    Uses the event's full context and OpenAI to generate a tailored response.
    """
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    d = event.to_dict()
    context_parts = [
        f"Title: {d.get('title', '')}",
        f"Summary: {d.get('summary', '')}",
        f"Type: {d.get('event_type', '')} | Role: {d.get('matched_role', '')}",
        f"What's changing: {d.get('what_is_changing', d.get('whats_changing', ''))}",
        f"Why it matters: {d.get('why_it_matters', '')}",
        f"Impact analysis: {d.get('impact_analysis', d.get('impact', ''))}",
        f"Recommended action: {d.get('what_to_do_now', d.get('suggested_action', ''))}",
        f"Primary outcome: {d.get('primary_outcome', '')}",
        f"Decision urgency: {d.get('decision_urgency', '')}",
        f"Assumptions: {d.get('assumptions', '')}",
        f"Source: {d.get('source', '')}",
    ]
    event_context = "\n".join(p for p in context_parts if p.split(":", 1)[-1].strip())

    messages = request.messages or []
    answer = answer_signal_question(
        event_context=event_context,
        question=request.question,
        department=request.department,
        conversation_history=messages[-10:],  # last 10 exchanges for context
    )
    return {"answer": answer}


class PrecedentsRequest(BaseModel):
    event_id: int


@app.post("/precedents")
def precedents(request: PrecedentsRequest, db: Session = Depends(get_db)):
    """
    Fetch similar past events (historical precedent) for a signal.
    Uses Serper + OpenFDA with date filters; LLM only ranks/summarizes retrieved articles.
    """
    event = db.query(Event).filter(Event.id == request.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    d = event.to_dict()
    try:
        result = get_precedents(d)
        return {"status": "success", **result}
    except Exception as e:
        logger.error(f"[ERROR] Precedents failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/test/live-event")
def test_live_event():
    """
    Fetch one live article (Serper or OpenFDA), process with LLM, and return
    full normalized event JSON without persisting to DB.
    """
    try:
        item = fetch_one_live()
        if not item:
            raise HTTPException(status_code=503, detail="No live data available (check Serper/OpenFDA API keys)")
        # Create minimal RawSource-like object
        class RawLike:
            id = 0
            title = item["title"]
            content = item["content"]
            source = item.get("source", "Serper")
            url = item.get("url") or item.get("link")
        raw = RawLike()
        event_data = process_raw_source(raw)
        event_dict = normalize_event_schema(event_data)
        if getattr(raw, "url", None):
            event_dict["article_url"] = raw.url
        return {"status": "success", "event": event_dict}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] test/live-event failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/debug/event-schema")
def debug_event_schema(db: Session = Depends(get_db)):
    """
    Returns the latest event as canonical schema JSON.
    Used to verify completeness of event structure.
    """
    event = db.query(Event).order_by(Event.timestamp.desc()).first()
    if not event:
        return {"status": "ok", "event": None, "message": "No events in database"}
    d = event.to_dict()
    normalized = normalize_event_schema(d)
    normalized["id"] = str(event.id)
    normalized["updated_at"] = event.timestamp.strftime("%Y-%m-%d") if event.timestamp else ""
    return {"status": "ok", "event": normalized}


@app.post("/debug/cleanup-duplicates")
def cleanup_duplicates(db: Session = Depends(get_db)):
    """
    Remove duplicate RawSources and Events from existing data.
    RawSource: keeps one per (source, url) for Serper, one per (source, title) for others.
    Event: keeps one per (title, source), keeping the most recent.
    """
    try:
        raw_deleted = 0
        event_deleted = 0

        # RawSource dedup: group by (source, url or title), delete extras keeping oldest
        raw_all = db.query(RawSource).order_by(RawSource.fetched_at.asc()).all()
        seen_raw = {}  # key -> id to keep
        for r in raw_all:
            if r.source == "Serper" and r.url:
                key = ("Serper", r.url.strip())
            else:
                key = (r.source, r.title)
            if key not in seen_raw:
                seen_raw[key] = r.id
            else:
                db.delete(r)
                raw_deleted += 1

        # Event dedup: group by (title, source), keep most recent, delete others
        event_all = db.query(Event).order_by(Event.timestamp.desc()).all()
        seen_event = {}  # key -> id to keep (most recent)
        for e in event_all:
            key = (e.title.strip(), e.source)
            if key not in seen_event:
                seen_event[key] = e.id
            else:
                db.delete(e)
                event_deleted += 1

        db.commit()
        logger.info(f"[CLEANUP] Removed {raw_deleted} duplicate RawSources, {event_deleted} duplicate Events")
        return {
            "status": "ok",
            "raw_sources_removed": raw_deleted,
            "events_removed": event_deleted,
            "message": f"Removed {raw_deleted} duplicate raw sources and {event_deleted} duplicate events",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] Cleanup failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/debug/cleanup-invalid-sources")
def cleanup_invalid_sources(db: Session = Depends(get_db)):
    """
    Delete events with invalid/placeholder source (Simulation, Demo, unverified, etc.).
    Run to remove junk from database. Adapts to Event table.
    """
    try:
        deleted = db.query(Event).filter(
            or_(
                Event.source.is_(None),
                Event.source == "",
                Event.source.in_(INVALID_SOURCES),
            )
        ).delete(synchronize_session=False)
        db.commit()
        logger.info(f"[CLEANUP] Deleted {deleted} events with invalid source")
        return {
            "status": "ok",
            "events_removed": deleted,
            "message": f"Deleted {deleted} events with invalid or placeholder source",
        }
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] Cleanup invalid sources failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/reset")
def reset_database(db: Session = Depends(get_db)):
    """
    Clear all data from RawSource and Event tables.
    Use for demo reset or testing purposes.
    
    Returns:
        Success status
    """
    try:
        logger.warning("[RESET] Resetting database...")
        
        # Delete all events
        event_count = db.query(Event).delete()
        
        # Delete all raw sources
        raw_count = db.query(RawSource).delete()
        
        db.commit()
        
        logger.info(f"[OK] Deleted {event_count} events and {raw_count} raw sources")
        
        return {
            "status": "ok",
            "message": f"Deleted {event_count} events and {raw_count} raw sources"
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] Reset failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Reset error: {str(e)}")


# Error handler for uncaught exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all error handler to prevent crashes."""
    logger.error(f"[ERROR] Unhandled exception: {str(exc)}")
    return {
        "status": "error",
        "error": str(exc),
        "message": "An unexpected error occurred"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
