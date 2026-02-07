"""
Database configuration and session management for MERIDIAN backend.
Uses SQLAlchemy 2.0 with SQLite for persistent storage.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# SQLite database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./meridian.db"

# Create SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},  # Needed for SQLite
    echo=False  # Set to True for SQL query logging during development
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db() -> Session:
    """
    Dependency function to get database session.
    Yields a session and ensures it's closed after use.
    
    Usage in FastAPI:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database by creating all tables.
    Runs migrations for new columns. Called on application startup.
    """
    from models import RawSource, Event  # Import here to avoid circular imports
    Base.metadata.create_all(bind=engine)
    migrate_db()
    print("[OK] Database initialized successfully")


def migrate_db():
    """
    Add new columns to events table if they don't exist.
    Safe for SQLite; skips if columns already present.
    """
    from sqlalchemy import text
    new_columns = [
        ("primary_outcome", "TEXT"),
        ("what_is_changing", "TEXT"),
        ("why_it_matters", "TEXT"),
        ("what_to_do_now", "TEXT"),
        ("decision_urgency", "TEXT"),
        ("recommended_next_step", "TEXT"),
        ("impact_analysis", "TEXT"),
        ("confidence_level", "VARCHAR(20)"),
        ("assumptions", "TEXT"),
        ("fetched_at", "DATETIME"),
        ("messaging_instructions", "TEXT"),
        ("positioning_before", "TEXT"),
        ("positioning_after", "TEXT"),
        ("agent_action_log", "TEXT"),
        ("article_url", "TEXT"),
    ]
    with engine.connect() as conn:
        for col_name, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE events ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"[MIGRATE] Added column events.{col_name}")
            except Exception as e:
                if "duplicate column" in str(e).lower():
                    pass  # Already exists
                else:
                    print(f"[MIGRATE] Column {col_name}: {e}")
