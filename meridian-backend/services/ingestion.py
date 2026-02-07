"""
Data ingestion service for MERIDIAN backend.
Fetches pharma intelligence from external sources (Serper News API, OpenFDA).
"""

import os
import requests
import logging
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def fetch_from_serper(query: str = "pharmaceutical OR pharma OR drug approval OR FDA") -> List[Dict]:
    """
    Fetch recent pharma news from Serper News API.
    
    Args:
        query: Search query string for pharma-related news
        
    Returns:
        List of dictionaries with keys: title, content, url
    """
    api_key = os.getenv("SERPER_API_KEY")
    
    if not api_key or api_key == "your-serper-key-here":
        logger.warning("Serper API key not configured, skipping Serper fetch")
        return []
    
    try:
        url = "https://google.serper.dev/news"
        headers = {
            "X-API-KEY": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "q": query,
            "num": 5  # Request 5; Serper may return more (e.g. 10) depending on API
        }
        
        logger.info(f"Fetching from Serper with query: {query}")
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = []
        
        # Extract news items from response
        news_items = data.get("news", [])
        for item in news_items:
            results.append({
                "title": item.get("title", "Untitled"),
                "content": item.get("snippet", "No content available"),
                "url": item.get("link", "")
            })
        
        logger.info(f"[OK] Fetched {len(results)} items from Serper")
        return results
        
    except requests.exceptions.RequestException as e:
        logger.error(f"[ERROR] Serper API error: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in fetch_from_serper: {str(e)}")
        return []


def fetch_from_openfda() -> List[Dict]:
    """
    Fetch recent drug adverse events from OpenFDA API.
    
    Returns:
        List of dictionaries with keys: title, content, url
    """
    try:
        # Search for recent drug adverse events
        url = "https://api.fda.gov/drug/event.json"
        params = {
            "limit": 5,
            "search": "receivedate:[20240101 TO 20261231]"  # Events from 2024-2026
        }
        
        logger.info("Fetching from OpenFDA drug adverse events")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = []
        
        # Parse FDA adverse event reports
        for idx, event in enumerate(data.get("results", []), 1):
            # Extract patient and drug information
            patient = event.get("patient", {})
            drugs = patient.get("drug", [])
            reactions = patient.get("reaction", [])
            
            # Build title from drug names
            drug_names = [d.get("medicinalproduct", "Unknown drug") for d in drugs[:2]]
            title = f"FDA Adverse Event: {', '.join(drug_names)}"
            
            # Build content from reactions
            reaction_terms = [r.get("reactionmeddrapt", "") for r in reactions[:3]]
            seriousness = event.get("serious", "0")
            
            content = f"Adverse event report involving {', '.join(drug_names)}. "
            content += f"Reactions: {', '.join(reaction_terms)}. "
            content += f"Serious: {'Yes' if seriousness == '1' else 'No'}."
            
            results.append({
                "title": title,
                "content": content,
                "url": f"https://open.fda.gov/apis/drug/event/"
            })
        
        logger.info(f"[OK] Fetched {len(results)} items from OpenFDA")
        return results
        
    except requests.exceptions.RequestException as e:
        logger.error(f"[ERROR] OpenFDA API error: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in fetch_from_openfda: {str(e)}")
        return []


def fetch_one_live() -> Optional[Dict]:
    """
    Fetch a single item from live sources (Serper first, then OpenFDA) for testing.
    Does not persist to DB. Returns dict with title, content, source or None.
    """
    serper_items = fetch_from_serper()
    if serper_items:
        item = serper_items[0]
        item["source"] = "Serper"
        return item
    fda_items = fetch_from_openfda()
    if fda_items:
        item = fda_items[0]
        item["source"] = "OpenFDA"
        return item
    return None


def _is_duplicate_raw(db: Session, source: str, title: str, content: str, url: Optional[str]) -> bool:
    """
    Check if we already have this item to avoid duplicates.
    Serper: dedupe by URL (unique per article). OpenFDA: dedupe by title+source in last 7 days.
    """
    from models import RawSource
    from datetime import timedelta

    if source == "Serper" and url and url.strip():
        existing = db.query(RawSource).filter(
            RawSource.source == "Serper",
            RawSource.url == url.strip()
        ).first()
        return existing is not None

    # OpenFDA and Serper without URL: same title from same source in last 7 days = duplicate
    cutoff = datetime.utcnow() - timedelta(days=7)
    recent = db.query(RawSource).filter(
        RawSource.source == source,
        RawSource.title == title,
        RawSource.fetched_at >= cutoff
    ).first()
    return recent is not None


def ingest_all(db: Session) -> int:
    """
    Fetch data from all sources and save to RawSource table.
    Skips duplicates (same URL for Serper, same title+source recently for others).
    
    Returns:
        Total count of NEW items inserted
    """
    from models import RawSource
    
    total_inserted = 0
    skipped = 0
    
    # Fetch from Serper
    serper_items = fetch_from_serper()
    for item in serper_items:
        if _is_duplicate_raw(db, "Serper", item["title"], item["content"], item.get("url")):
            skipped += 1
            continue
        raw = RawSource(
            source="Serper",
            title=item["title"],
            content=item["content"],
            url=item.get("url"),
            processed=False
        )
        db.add(raw)
        total_inserted += 1
    
    # Fetch from OpenFDA
    fda_items = fetch_from_openfda()
    for item in fda_items:
        if _is_duplicate_raw(db, "OpenFDA", item["title"], item["content"], item.get("url")):
            skipped += 1
            continue
        raw = RawSource(
            source="OpenFDA",
            title=item["title"],
            content=item["content"],
            url=item.get("url"),
            processed=False
        )
        db.add(raw)
        total_inserted += 1
    
    if skipped > 0:
        logger.info(f"[INGEST] Skipped {skipped} duplicate(s)")
    
    # Commit all inserts
    try:
        db.commit()
        logger.info(f"[OK] Successfully ingested {total_inserted} items to database")
    except Exception as e:
        db.rollback()
        logger.error(f"[ERROR] Database error during ingestion: {str(e)}")
        raise
    
    return total_inserted
