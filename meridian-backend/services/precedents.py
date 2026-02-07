"""
Historical precedent service for MERIDIAN.
Retrieves similar past events via Serper + OpenFDA, then LLM ranks/summarizes.
STRICT: LLM only summarizes retrieved articles; never invents.
"""

import os
import json
import re
import logging
from typing import List, Dict, Any
from openai import OpenAI

from services.ingestion import fetch_serper_historical, fetch_serper_simple, fetch_openfda_historical

logger = logging.getLogger(__name__)


def extract_search_terms(event: Dict[str, Any]) -> str:
    """
    Extract key terms from event for structured API search.
    No LLM - simple keyword extraction from title, summary, tags.
    """
    parts = []
    title = (event.get("title") or "").lower()
    summary = (event.get("summary") or "").lower()
    tags = (event.get("tags") or "").lower()
    event_type = (event.get("event_type") or "").lower()
    text = f"{title} {summary} {tags} {event_type}"

    # Common pharma entities
    drug_patterns = [
        r"\b(remicade|humira|enbrel|stelara|cosentyx|tremfya|skyrizi|rinvoq|xeljanz|jak\s*inhibitor)\b",
        r"\b(biosimilar|biologic|tnf|il-?\s*17|il-?\s*23)\b",
        r"\b(fda|ema|cms|nice|hta)\b",
        r"\b(adverse\s*event|safety|reimbursement|approval|recall)\b",
    ]
    seen = set()
    for pat in drug_patterns:
        for m in re.finditer(pat, text, re.I):
            w = m.group(1).strip()
            if len(w) > 2 and w not in seen:
                seen.add(w)
                parts.append(w)

    # Fallback: first few significant words from title
    if not parts:
        words = re.findall(r"\b[a-z]{4,}\b", title)
        for w in words[:5]:
            if w not in ("drug", "fda", "new", "the", "and", "for", "with"):
                parts.append(w)
                if len(parts) >= 5:
                    break

    return " ".join(parts[:6]) if parts else "pharmaceutical FDA safety"


def fetch_candidates(event: Dict[str, Any]) -> List[Dict]:
    """Fetch candidate articles from Serper and OpenFDA."""
    query = extract_search_terms(event)
    serper_items = fetch_serper_historical(query, num=10)
    # Fallback: if domain filter returned few results, try simpler query
    if len(serper_items) < 3:
        serper_items = fetch_serper_simple(query, num=10)
    fda_items = fetch_openfda_historical(limit=8)

    candidates = []
    for item in serper_items:
        candidates.append({
            "title": item.get("title", ""),
            "content": item.get("content", ""),
            "url": item.get("url", ""),
            "source": item.get("source", "Serper"),
            "date": item.get("date", ""),
        })
    for item in fda_items:
        candidates.append({
            "title": item.get("title", ""),
            "content": item.get("content", ""),
            "url": item.get("url", ""),
            "source": item.get("source", "OpenFDA"),
            "date": item.get("date", ""),
        })
    return candidates


def llm_rank_and_summarize(
    candidates: List[Dict], current_event_context: str
) -> List[Dict]:
    """
    LLM ONLY ranks and summarizes retrieved articles.
    NEVER invents. Every output must cite a retrieved article.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key.startswith("sk-your-"):
        return []

    if not candidates:
        return []

    articles_text = "\n\n---\n\n".join(
        [
            f"[{i+1}] Title: {c.get('title','')}\nContent: {c.get('content','')}\nSource: {c.get('source','')}\nDate: {c.get('date','')}\nURL: {c.get('url','')}"
            for i, c in enumerate(candidates[:15])
        ]
    )

    prompt = f"""You are a pharma intelligence analyst. Below are RETRIEVED articles from Serper/OpenFDA.

CURRENT SIGNAL (for similarity):
{current_event_context[:800]}

RETRIEVED ARTICLES (numbered):
{articles_text}

TASK: From the retrieved articles ONLY, select up to 3 that are most similar to the current signal. For each:
1. Use ONLY information from that article - DO NOT invent
2. Output JSON array with objects: {{ "index": 1, "title": "exact or shortened title", "year": "YYYY", "what_happened": "1-2 lines from article", "outcome": "1 line consequence", "source": "FDA/Reuters/EMA/OpenFDA" }}
3. "index" = the number [1], [2], etc. of the article you are summarizing
4. If fewer than 3 are relevant, return fewer. If none, return [].
5. NEVER add events not in the retrieved list.

Output ONLY valid JSON array, no markdown."""

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You output valid JSON only. Never invent events. Only summarize retrieved articles.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=800,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        arr = json.loads(content)
        if not isinstance(arr, list):
            return []
        out = []
        for item in arr:
            if isinstance(item, dict) and item.get("title"):
                idx = item.get("index")
                if isinstance(idx, int) and 1 <= idx <= len(candidates):
                    item["url"] = candidates[idx - 1].get("url", "")
                else:
                    item.setdefault("url", "")
                # Remove index from output
                item.pop("index", None)
                out.append(item)
        return out[:3]
    except Exception as e:
        logger.error(f"[ERROR] Precedents LLM: {str(e)}")
        return []


def get_precedents(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main entry: fetch candidates, LLM rank/summarize, return precedents.
    """
    candidates = fetch_candidates(event)
    if len(candidates) < 2:
        return {
            "precedents": [],
            "message": "Limited historical analogs found for this signal.",
        }

    context = f"Title: {event.get('title','')}\nSummary: {event.get('summary','')}\nType: {event.get('event_type','')}"
    precedents = llm_rank_and_summarize(candidates, context)

    if not precedents:
        return {
            "precedents": [],
            "message": "Limited historical analogs found for this signal.",
        }

    return {"precedents": precedents, "message": None}
