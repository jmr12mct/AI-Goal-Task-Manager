import os
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session

# Define path for SQLite database file at the workspace root
DB_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "goalmanager.db"))
sqlite_url = f"sqlite:///{DB_FILE}"

# Disable same_thread check for SQLite to support concurrent web requests/tasks cleanly
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)


class Settings(SQLModel, table=True):
    """
    Stores local configuration parameters (e.g. user timezone).
    """
    key: str = Field(primary_key=True)
    value: str
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class Goals(SQLModel, table=True):
    """
    Unified Goals table supporting infinite nesting via parent_id.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="goals.id", nullable=True)
    goal_level: str = Field(default="EPIC")  # "EPIC" | "MILESTONE" | "MICRO"
    title: str = Field(index=True)
    description: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)
    status: str = Field(default="ACTIVE")    # "ACTIVE" | "COMPLETED" | "PAUSED" | "ARCHIVED"
    importance: int = Field(default=3, ge=1, le=5)  # 1 to 5
    urgency: int = Field(default=3, ge=1, le=5)     # 1 to 5
    deadline_utc: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    tasks: List["Tasks"] = Relationship(back_populates="goal")


class Tasks(SQLModel, table=True):
    """
    Actionable items linked to any goal node, or standalone.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: Optional[int] = Field(default=None, foreign_key="goals.id", nullable=True)
    title: str = Field(index=True)
    status: str = Field(default="TODO")      # "TODO" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED"
    importance: int = Field(default=3, ge=1, le=5)  # 1 to 5
    urgency: int = Field(default=3, ge=1, le=5)     # 1 to 5
    priority_score: Optional[int] = Field(default=None, nullable=True) # urgency * importance
    deadline_utc: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    goal: Optional[Goals] = Relationship(back_populates="tasks")


class AuditLog(SQLModel, table=True):
    """
    Ledger capturing every semantic prompt and execution mutation.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    command_text: str
    parsed_intent_json: str  # Stored as stringified JSON
    confidence_score: float
    execution_status: str  # "EXECUTED" | "PENDING_CONFIRMATION" | "REJECTED" | "UNDONE"
    error_message: Optional[str] = Field(default=None)
    timestamp_utc: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PendingConfirmations(SQLModel, table=True):
    """
    Proposed actions temporarily paused in a gateway queue awaiting user validation.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    audit_log_id: int = Field(foreign_key="auditlog.id")
    proposed_mutations_json: str  # Stored as stringified JSON
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def init_db():
    """
    Bootstraps the database file and creates all tables.
    """
    SQLModel.metadata.create_all(engine)
    
    # Bootstrap default settings if not exists
    with Session(engine) as session:
        tz_setting = session.get(Settings, "timezone")
        if not tz_setting:
            default_tz = Settings(key="timezone", value="Europe/London")
            session.add(default_tz)
            session.commit()


def get_session():
    """
    Yields database sessions cleanly.
    """
    with Session(engine) as session:
        yield session


if __name__ == "__main__":
    print(f"Initializing database at: {DB_FILE}")
    init_db()
    print("Database schema successfully generated!")
