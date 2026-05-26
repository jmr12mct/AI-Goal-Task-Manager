# 🛠️ Engineering Specification: GOALMANAGER

This document serves as the absolute technical source of truth for **GOALMANAGER**. It defines the backend REST API, database schemas, recursive algorithmic loops, and E2E integration validations.

---

## 🏛️ System Architecture

GOALMANAGER employs a clean, decoupled architecture:
1. **Frontend Dashboard:** A vanilla HTML5, CSS3 (HUD design), and ES6 client served statically.
2. **REST API Bridge (FastAPI):** A lightweight routing layer that maps incoming HTTP requests to database queries and exposes serialization feeds.
3. **Database Engine (SQLModel):** A Python SQLModel ORM mapping class models to local SQLite database files.
4. **Agent Skill Loop (`agentskills.io` standard):** An AI skill block that translates voice/text prompts into database commands (`add_goal()`, `add_task()`, `update_status()`).

---

## 🗄️ Database Schemas (SQLModel)

### 1. Goals (Hierarchical Tree)
Unified table supporting infinite parent-child self-referential relations:
```python
class Goals(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="goals.id", nullable=True)
    goal_level: str = Field(default="EPIC")  # "EPIC" | "MILESTONE" | "MICRO"
    title: str = Field(index=True)
    description: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)
    status: str = Field(default="ACTIVE")    # "ACTIVE" | "COMPLETED" | "PAUSED" | "ARCHIVED"
    importance: int = Field(default=3, ge=1, le=5)
    urgency: int = Field(default=3, ge=1, le=5)
    deadline_utc: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

### 2. Tasks
Actionable child operations linked to a specific goal, or standalone:
```python
class Tasks(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: Optional[int] = Field(default=None, foreign_key="goals.id", nullable=True)
    title: str = Field(index=True)
    status: str = Field(default="TODO")      # "TODO" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED"
    importance: int = Field(default=3, ge=1, le=5)
    urgency: int = Field(default=3, ge=1, le=5)
    priority_score: Optional[int] = Field(default=None, nullable=True) # urgency * importance
    deadline_utc: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

### 3. Core Auxiliary Tables
- **Settings:** Stores local configuration hashes (e.g. key: `timezone`, value: `Europe/London`).
- **AuditLog:** Ledger tracking every parsed intent json, confidence scores, and execution states.
- **PendingConfirmations:** Gateway queue holding proposed mutations awaiting user confirmation.

---

## ⚙️ Core Algorithms

### 1. Depth-First Recursive Soft-Archival Cascade
When a goal is soft-deleted (archived), all linked tasks and nested child sub-goals must be archived recursively to maintain relational state. This is solved via depth-first recursion:
```python
def _archive_goal_recursive(session: Session, goal_id: int):
    # 1. Archive immediate tasks linked to this goal
    tasks = session.exec(select(Tasks).where(Tasks.goal_id == goal_id)).all()
    for task in tasks:
        task.status = "ARCHIVED"
        session.add(task)
    
    # 2. Recursively find child goals and archive them
    sub_goals = session.exec(select(Goals).where(Goals.parent_id == goal_id)).all()
    for sub_goal in sub_goals:
        sub_goal.status = "ARCHIVED"
        session.add(sub_goal)
        _archive_goal_recursive(session, sub_goal.id) # DFS Recurse
```

### 2. Ancestral Context Preservation (Front-End Filter)
When filtering the dashboard by status (e.g., show `COMPLETED` goals only), the system must preserve ancestral context. If a deep Micro-goal matches the filter but its parent Epic is `ACTIVE`, the Epic is drawn as a dashed **Muted Context Anchor** rather than being completely omitted, ensuring the user understands where the objective belongs.

This is implemented inside `frontend/app.js`:
- `checkGoalMatch()` recursively checks if a goal node or any of its children match the criteria.
- `compileFilteredTree()` filters the tree, marking goals that don't match directly but have matching descendants with `isContextAnchor: true`.

---

## 🔒 Security & CORS

To support robust local development where the frontend dashboard might be served from port 8000 and communicate with other components, the FastAPI bridge implements explicit **Cross-Origin Resource Sharing (CORS)** middleware:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Browser caching is strictly disabled for API routing responses using dynamic middleware (`Cache-Control: no-cache`) to ensure dashboard metrics are immediately synchronized upon browser requests.
