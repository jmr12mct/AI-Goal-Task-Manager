---
name: goal-tracker
description: A semantic prompt-driven natural language interpreter to map user voice/text inputs directly to goals, parent-child sub-goals, and priority-scored task databases.
---

# `goal-tracker` Agent Skill

This Agent Skill equips you (the AI Agent) with the precise guidelines, parsing rules, and local tool execution scripts needed to translate unstructured natural language commands into clean relational database mutations for the `goalmanager` application.

---

## 1. System Integration & Executable Scripts

This skill is fully compliant with the `agentskills.io` standard. All executable transaction logic is modularly housed in the `scripts/` folder:

*   **Core Skill Engine:** `.agent/skills/goal-tracker/scripts/local_tools.py`
*   **Database File:** `goalmanager.db` (SQLite at the workspace root)

---

## 2. Semantic Interpretation Guidelines

As the AI agent, you must parse loose user voice transcriptions or quick text statements into exact data fields. Use the mapping tables below to ensure high-accuracy semantic validation.

### A. Prioritization (Urgency & Importance) Mapping Matrix
The Eisenhower Matrix relies on two independent scores: `urgency` (1 to 5) and `importance` (1 to 5).
*   **ASAP / Drop Everything / Urgent & Critical:**
    *   *Examples:* "Do this right now", "Emergency client meeting", "Crucial fix needed ASAP".
    *   *Mapping:* Urgency: `5`, Importance: `5` (Priority Score: 25)
*   **Deep Work / Crucial but Not Hot:**
    *   *Examples:* "Drafting the Q3 marketing strategy", "Start learning React", "Write core database schema".
    *   *Mapping:* Urgency: `2`, Importance: `5` (Priority Score: 10)
*   **Hot but Not Deep (Delegatable/Quick Actions):**
    *   *Examples:* "Send monthly invoice", "Reply to landlord's email", "Book dentist appointment".
    *   *Mapping:* Urgency: `5`, Importance: `2` (Priority Score: 10)
*   **Sometime / Eventually / Low Priority:**
    *   *Examples:* "Clean out the backyard shed sometime", "Read that article eventually".
    *   *Mapping:* Urgency: `1`, Importance: `1` (Priority Score: 1)
*   **Default values:** If the prompt gives no priority context, default both fields to `3` (Priority Score: 9).

### B. Goal Hierarchy Levels
Goals must be structured recursively:
*   **`EPIC` (Top-Level Goal):** A massive, long-term outcome.
    *   *Trigger keywords:* "Objective", "Project", "Goal", "Epic", "Aspirations".
    *   *Example:* "Renovate backyard deck".
*   **`MILESTONE` (Middle-Level Goal):** A major chunk of work under an Epic.
    *   *Trigger keywords:* "Phase", "Milestone", "Checkpoint", "Sub-goal".
    *   *Example:* "Acquire treated framing lumber".
*   **`MICRO` (Actionable Milestone/Sub-Milestone):** A small key result.
    *   *Trigger keywords:* "Sub-phase", "Micro-goal", "Specific objective".
    *   *Example:* "Select lumber dimensions".

---

## 3. Tool Execution Interfaces

When a matching user intent is parsed, execute the corresponding function in `scripts/local_tools.py` via Python:

### A. Creating a Goal
```python
# Signature
add_goal(title: str, parent_id: int = None, level: str = "EPIC", urgency: int = 3, importance: int = 3) -> int
```
*   *Instructions:* If the user says "Add a sub-goal called X to parent goal Y", first query the database to find Y's ID, then call `add_goal` passing that ID as `parent_id` and setting `level="MILESTONE"`.

### B. Creating a Task
```python
# Signature
add_task(title: str, goal_id: int = None, urgency: int = 3, importance: int = 3) -> int
```
*   *Instructions:* Tasks can stand alone (set `goal_id=None`) or link directly to any level of a goal in the hierarchy.

### C. Updating Status (Including Archiving)
```python
# Signature
update_status(item_type: str, item_id: int, new_status: str) -> bool
```
*   *Instructions:* 
    *   `item_type` must be `"TASK"` or `"GOAL"`.
    *   `new_status` must be `"TODO"`, `"IN_PROGRESS"`, `"COMPLETED"`, or `"ARCHIVED"`.
    *   *Recursive soft-delete cascade:* If `item_type="GOAL"` and `new_status="ARCHIVED"`, the script will recursively propagate `status="ARCHIVED"` to all child sub-goals and all linked tasks in a single database transaction.

### D. Reading Dashboard State
```python
# Signature
get_dashboard_state() -> str
```
*   *Instructions:* Runs an optimized serialization routine returning active nested goal trees and standalone tasks (excluding archived items) in clean, structured JSON.
