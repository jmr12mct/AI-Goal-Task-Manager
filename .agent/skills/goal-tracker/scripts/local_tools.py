import sys
import os
from datetime import datetime, timezone
import json

# =====================================================================
# 🎓 Educational Lesson: Dynamic Sys Path Injection
# =====================================================================
# Python resolves imports by searching the list of directories stored
# in sys.path. Since our Agent Skill runs nested deep inside the folder
# structure (.agent/skills/goal-tracker/scripts/), it wouldn't normally
# be able to find the "backend" module.
# By dynamically calculating the absolute path to the root of our
# workspace and appending it to sys.path, we enable clean import 
# statements, regardless of where the terminal executes the script.
# =====================================================================
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from sqlmodel import Session, select
from backend.app.database import engine, Goals, Tasks, Settings, AuditLog, PendingConfirmations


def add_goal(title: str, parent_id: int = None, level: str = "EPIC", urgency: int = 3, importance: int = 3, category: str = None) -> int:
    """
    Inserts a new Goal node into the hierarchical tree.
    Optionally assigns a life-planning stream/category (e.g. CAREER, FAMILY, FINANCE).
    """
    with Session(engine) as session:
        # Validate parent_id existence if provided
        if parent_id:
            parent = session.get(Goals, parent_id)
            if not parent:
                raise ValueError(f"Parent Goal ID {parent_id} does not exist.")
        
        goal = Goals(
            title=title,
            parent_id=parent_id,
            goal_level=level.upper(),
            urgency=urgency,
            importance=importance,
            category=category.strip() if category else None,
            status="ACTIVE"
        )
        session.add(goal)
        session.commit()
        session.refresh(goal)
        return goal.id


def add_task(title: str, goal_id: int = None, urgency: int = 3, importance: int = 3) -> int:
    """
    Creates an actionable task, optionally linked to any Goal node,
    and autocalculates the Eisenhower priority score.
    """
    with Session(engine) as session:
        # Validate goal_id existence if provided
        if goal_id:
            goal = session.get(Goals, goal_id)
            if not goal:
                raise ValueError(f"Target Goal ID {goal_id} does not exist.")
        
        # Calculate computed priority score: importance * urgency (1 to 25)
        priority_score = urgency * importance
        
        task = Tasks(
            title=title,
            goal_id=goal_id,
            urgency=urgency,
            importance=importance,
            priority_score=priority_score,
            status="TODO"
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        return task.id


def _archive_goal_recursive(session: Session, goal_id: int):
    """
    🎓 Educational Lesson: The Depth-First Recursive Cascade
    To soft-delete an entire tree structures in SQL, we use Recursion.
    For the target goal_id, we:
    1. Find all immediate child tasks and mark them ARCHIVED.
    2. Find all child goals, mark them ARCHIVED, and recursively trigger
       this same function on each child (traversing down to the deepest leaf).
    """
    # 1. Archive immediate tasks linked to this goal
    tasks = session.exec(select(Tasks).where(Tasks.goal_id == goal_id)).all()
    for task in tasks:
        task.status = "ARCHIVED"
        task.updated_at = datetime.now(timezone.utc)
        session.add(task)
    
    # 2. Find and archive child sub-goals recursively
    sub_goals = session.exec(select(Goals).where(Goals.parent_id == goal_id)).all()
    for sub_goal in sub_goals:
        sub_goal.status = "ARCHIVED"
        sub_goal.updated_at = datetime.now(timezone.utc)
        session.add(sub_goal)
        # Recurse down
        _archive_goal_recursive(session, sub_goal.id)


def update_status(item_type: str, item_id: int, new_status: str) -> bool:
    """
    Updates status for a Goal or Task. Triggers soft-archive cascades on Goal archivals.
    """
    new_status = new_status.upper()
    item_type = item_type.upper()
    
    with Session(engine) as session:
        if item_type == "TASK":
            task = session.get(Tasks, item_id)
            if not task:
                raise ValueError(f"Task with ID {item_id} not found.")
            task.status = new_status
            task.updated_at = datetime.now(timezone.utc)
            session.add(task)
            session.commit()
            return True
            
        elif item_type == "GOAL":
            goal = session.get(Goals, item_id)
            if not goal:
                raise ValueError(f"Goal with ID {item_id} not found.")
            
            goal.status = new_status
            goal.updated_at = datetime.now(timezone.utc)
            session.add(goal)
            
            # Cascade soft-deletion recursively if status is ARCHIVED
            if new_status == "ARCHIVED":
                _archive_goal_recursive(session, item_id)
                
            session.commit()
            return True
        else:
            raise ValueError("Invalid item_type. Must be 'TASK' or 'GOAL'.")


def get_dashboard_state() -> str:
    """
    Builds and serializes a fully nested tree representing Epics containing 
    Milestones containing Micro-goals, along with their respective tasks.
    Used by the read-only dashboard to render visual timelines and progress.
    """
    with Session(engine) as session:
        # Get all settings
        settings_rows = session.exec(select(Settings)).all()
        settings = {s.key: s.value for s in settings_rows}

        # Query all active goals and tasks (exclude archived from active dashboard view)
        active_goals = session.exec(select(Goals).where(Goals.status != "ARCHIVED")).all()
        active_tasks = session.exec(select(Tasks).where(Tasks.status != "ARCHIVED")).all()

        # Build goal lookup and nest them
        goals_by_id = {}
        top_level_goals = []

        for goal in active_goals:
            goal_dict = {
                "id": goal.id,
                "parent_id": goal.parent_id,
                "level": goal.goal_level,
                "title": goal.title,
                "description": goal.description,
                "category": goal.category,
                "status": goal.status,
                "priority_score": goal.importance * goal.urgency,
                "urgency": goal.urgency,
                "importance": goal.importance,
                "deadline_utc": goal.deadline_utc.isoformat() if goal.deadline_utc else None,
                "sub_goals": [],
                "tasks": []
            }
            goals_by_id[goal.id] = goal_dict
            
        # Wire up parent-child goal hierarchy
        for g_id, g_dict in goals_by_id.items():
            parent_id = g_dict["parent_id"]
            if parent_id and parent_id in goals_by_id:
                goals_by_id[parent_id]["sub_goals"].append(g_dict)
            else:
                top_level_goals.append(g_dict)

        # Wire up tasks to their respective goals
        standalone_tasks = []
        for task in active_tasks:
            task_dict = {
                "id": task.id,
                "goal_id": task.goal_id,
                "title": task.title,
                "status": task.status,
                "urgency": task.urgency,
                "importance": task.importance,
                "priority_score": task.priority_score,
                "deadline_utc": task.deadline_utc.isoformat() if task.deadline_utc else None
            }
            if task.goal_id and task.goal_id in goals_by_id:
                goals_by_id[task.goal_id]["tasks"].append(task_dict)
            else:
                standalone_tasks.append(task_dict)

        # Sort tasks by computed priority score descending
        for g_dict in goals_by_id.values():
            g_dict["tasks"].sort(key=lambda t: t["priority_score"] or 0, reverse=True)
        standalone_tasks.sort(key=lambda t: t["priority_score"] or 0, reverse=True)

        # Collect all unique, non-empty categories/streams assigned to active goals
        categories_set = {g.category.strip() for g in active_goals if g.category and g.category.strip()}
        available_streams = sorted(list(categories_set))

        dashboard_data = {
            "settings": settings,
            "goals_tree": top_level_goals,
            "standalone_tasks": standalone_tasks,
            "available_streams": available_streams,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
        return json.dumps(dashboard_data, indent=2)


if __name__ == "__main__":
    # Small test sequence to prove operations
    print("Testing local_tools operations...")
    try:
        epic_id = add_goal("Renovate backyard deck", level="EPIC", urgency=4, importance=5)
        milestone_id = add_goal("Acquire treated framing lumber", parent_id=epic_id, level="MILESTONE", urgency=4, importance=4)
        
        task1 = add_task("Order lumber from lumberyard", goal_id=milestone_id, urgency=4, importance=5)
        task2 = add_task("Rent delivery flatbed truck", goal_id=milestone_id, urgency=2, importance=3)
        
        print(f"Goal Tree initialized. Epic ID: {epic_id}, Milestone ID: {milestone_id}")
        print(f"Tasks added. Task 1 ID: {task1} (Score: 20), Task 2 ID: {task2} (Score: 6)")
        
        # Test serialization
        state = get_dashboard_state()
        print("\nSerialized Dashboard State (Truncated Preview):")
        print("\n".join(state.split("\n")[:25]))
        
        # Test soft-archiving cascade
        print("\nArchiving Epic (Recursive Cascade Check)...")
        update_status("GOAL", epic_id, "ARCHIVED")
        
        # Verify state reflects archival
        post_archive_state = json.loads(get_dashboard_state())
        print(f"Active top level goals count (expected 0): {len(post_archive_state['goals_tree'])}")
        print(f"Active standalone tasks count: {len(post_archive_state['standalone_tasks'])}")
        
        print("\nlocal_tools verification test completed successfully!")
    except Exception as e:
        print(f"Error during execution: {e}")
