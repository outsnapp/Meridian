"""
Seed script for MERIDIAN risk engine demo data.
Populates historical_events, financial_profiles, and regulatory_actions tables
with 50+ pharma cases for realistic risk analysis.

Run: python seed_historical_data.py
"""

import sys
from datetime import datetime, timedelta
from random import randint, uniform, choice
from database import SessionLocal, init_db
from models import HistoricalEvent, FinancialProfile, RegulatoryAction, Event

# Top 20 pharma companies: revenue in display units (USD millions or INR crores per currency/unit_scale)
COMPANIES = [
    {"name": "Pfizer", "revenue": 58496, "drug_share": 0.12, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Johnson & Johnson", "revenue": 52582, "drug_share": 0.15, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Roche", "revenue": 63285, "drug_share": 0.18, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "Novartis", "revenue": 51626, "drug_share": 0.14, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "Merck", "revenue": 48704, "drug_share": 0.16, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "AbbVie", "revenue": 54318, "drug_share": 0.22, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Sanofi", "revenue": 43544, "drug_share": 0.13, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "GSK", "revenue": 37885, "drug_share": 0.11, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "AstraZeneca", "revenue": 44350, "drug_share": 0.17, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "Bristol Myers Squibb", "revenue": 46385, "drug_share": 0.19, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Eli Lilly", "revenue": 28541, "drug_share": 0.21, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Amgen", "revenue": 26276, "drug_share": 0.24, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Gilead Sciences", "revenue": 27327, "drug_share": 0.20, "currency": "USD", "unit_scale": "millions", "market": "US"},
    {"name": "Takeda", "revenue": 30285, "drug_share": 0.16, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "Bayer", "revenue": 46864, "drug_share": 0.09, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "Boehringer Ingelheim", "revenue": 23266, "drug_share": 0.18, "currency": "USD", "unit_scale": "millions", "market": "EU"},
    {"name": "Lupin", "revenue": 21000, "drug_share": 0.15, "currency": "INR", "unit_scale": "crores", "market": "India"},
    {"name": "Dr Reddy's", "revenue": 18500, "drug_share": 0.12, "currency": "INR", "unit_scale": "crores", "market": "India"},
    {"name": "Sun Pharma", "revenue": 19200, "drug_share": 0.14, "currency": "INR", "unit_scale": "crores", "market": "India"},
    {"name": "Cipla", "revenue": 17800, "drug_share": 0.13, "currency": "INR", "unit_scale": "crores", "market": "India"},
]

# Event types and their typical severity/outcome patterns
EVENT_PATTERNS = {
    "recall": {"severity_range": (0.4, 0.8), "outcomes": ["recall", "warning_letter"], "days_range": (30, 75)},
    "warning": {"severity_range": (0.3, 0.6), "outcomes": ["warning_letter", "fine", "none"], "days_range": (45, 90)},
    "adverse": {"severity_range": (0.5, 0.9), "outcomes": ["warning_letter", "recall", "fine"], "days_range": (60, 120)},
    "inspection": {"severity_range": (0.2, 0.5), "outcomes": ["warning_letter", "none"], "days_range": (90, 180)},
    "ban": {"severity_range": (0.7, 1.0), "outcomes": ["ban", "recall"], "days_range": (120, 240)},
}

DRUG_NAMES = [
    "Aspirin", "Metformin", "Atorvastatin", "Lisinopril", "Levothyroxine",
    "Amlodipine", "Metoprolol", "Omeprazole", "Simvastatin", "Losartan",
    "Azithromycin", "Gabapentin", "Hydrochlorothiazide", "Albuterol", "Sertraline",
    "Montelukast", "Furosemide", "Pantoprazole", "Clopidogrel", "Tamsulosin",
    "Warfarin", "Prednisone", "Amoxicillin", "Ciprofloxacin", "Insulin",
]


def seed_financial_profiles(db):
    """Seed financial_profiles for 20 companies."""
    print("\n[SEED] Creating financial profiles...")
    count = 0
    
    for company_data in COMPANIES:
        existing = db.query(FinancialProfile).filter(
            FinancialProfile.company == company_data["name"]
        ).first()
        
        if not existing:
            profile = FinancialProfile(
                company=company_data["name"],
                annual_revenue=company_data["revenue"],
                drug_revenue_share=company_data["drug_share"],
                currency=company_data.get("currency", "USD"),
                unit_scale=company_data.get("unit_scale", "millions"),
                market=company_data.get("market", "US"),
                last_updated=datetime.utcnow()
            )
            db.add(profile)
            count += 1
    
    db.commit()
    print(f"[OK] Created {count} financial profiles")


def seed_historical_events(db):
    """Seed 50+ historical pharma events with realistic patterns."""
    print("\n[SEED] Creating historical events...")
    count = 0
    
    # Generate events over the past 3 years
    start_date = datetime.utcnow() - timedelta(days=365 * 3)
    
    for i in range(55):  # Create 55 events
        company = choice(COMPANIES)["name"]
        event_type = choice(list(EVENT_PATTERNS.keys()))
        pattern = EVENT_PATTERNS[event_type]
        
        # Random date in the past 3 years
        days_ago = randint(1, 365 * 3)
        event_date = datetime.utcnow() - timedelta(days=days_ago)
        
        # Generate severity, outcome, and timeline based on pattern
        severity = uniform(*pattern["severity_range"])
        outcome = choice(pattern["outcomes"])
        days_to_action = randint(*pattern["days_range"])
        
        drug_name = choice(DRUG_NAMES) if uniform(0, 1) > 0.3 else None
        
        hist_event = HistoricalEvent(
            company=company,
            drug_name=drug_name,
            event_type=event_type,
            event_date=event_date,
            severity_score=severity,
            outcome=outcome,
            days_to_action=days_to_action
        )
        db.add(hist_event)
        count += 1
    
    db.commit()
    print(f"[OK] Created {count} historical events")


def seed_regulatory_actions(db):
    """Seed regulatory actions linked to historical events."""
    print("\n[SEED] Creating regulatory actions...")
    count = 0
    
    # Get all historical events
    historical = db.query(HistoricalEvent).all()
    
    # Create actions for ~60% of historical events
    for hist in historical:
        if uniform(0, 1) < 0.6:  # 60% get regulatory action
            action_type = hist.outcome if hist.outcome else "warning"
            issue_date = hist.event_date + timedelta(days=hist.days_to_action or 60)
            
            reg_action = RegulatoryAction(
                company=hist.company,
                drug=hist.drug_name,
                action_type=action_type,
                issue_date=issue_date,
                related_event_id=hist.id
            )
            db.add(reg_action)
            count += 1
    
    db.commit()
    print(f"[OK] Created {count} regulatory actions")


def update_existing_events(db):
    """Optionally update existing Event records with company/drug_name from seeded data."""
    print("\n[SEED] Updating existing events with company/drug info...")
    count = 0
    
    events = db.query(Event).filter(
        (Event.company.is_(None)) | (Event.company == "")
    ).limit(20).all()
    
    for event in events:
        # Try to match by title keywords
        title_lower = event.title.lower()
        matched_company = None
        
        for company_data in COMPANIES:
            if company_data["name"].lower() in title_lower:
                matched_company = company_data["name"]
                break
        
        if not matched_company:
            # Assign random company for demo
            matched_company = choice(COMPANIES)["name"]
        
        event.company = matched_company
        event.drug_name = choice(DRUG_NAMES) if uniform(0, 1) > 0.5 else None
        count += 1
    
    db.commit()
    print(f"[OK] Updated {count} existing events with company/drug info")


def main():
    """Run all seeding operations."""
    print("=" * 60)
    print("MERIDIAN Risk Engine Data Seeder")
    print("=" * 60)
    
    # Initialize database (ensures tables exist)
    print("\n[INIT] Initializing database...")
    init_db()
    
    db = SessionLocal()
    
    try:
        # Seed in order (financial profiles first, then historical data)
        seed_financial_profiles(db)
        seed_historical_events(db)
        seed_regulatory_actions(db)
        update_existing_events(db)
        
        print("\n" + "=" * 60)
        print("[SUCCESS] Seeding complete!")
        print("=" * 60)
        
        # Print summary
        print("\nDatabase summary:")
        print(f"  Financial profiles: {db.query(FinancialProfile).count()}")
        print(f"  Historical events: {db.query(HistoricalEvent).count()}")
        print(f"  Regulatory actions: {db.query(RegulatoryAction).count()}")
        print(f"  Events with company: {db.query(Event).filter(Event.company.isnot(None), Event.company != '').count()}")
        print("\nRisk engine is now ready for demo!")
        
    except Exception as e:
        print(f"\n[ERROR] Seeding failed: {str(e)}")
        db.rollback()
        return 1
    finally:
        db.close()
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
