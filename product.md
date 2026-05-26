# 🎯 Product Specification: GOALMANAGER

This document serves as the absolute product source of truth for the **GOALMANAGER** platform. It outlines the visual intent, target audience, core features, and user interaction mechanics.

---

## 💡 Product Vision & Core Philosophy

**GOALMANAGER** is designed as a minimalist, keyboard/voice-first **Decision Matrix** system. 

Instead of traditional task managers loaded with forms, nested popups, sliders, and tedious drop-downs, GOALMANAGER embraces **Zero manual creation forms**. The system operates on a direct, prompt-driven command loop where natural language inputs are parsed by an agent and instantly translated into structured database records.

---

## 👥 Target Audience & Personas

- **The Tactical Planner:** Users who want high-density visual feedback (a HUD) of their priorities without clicking through multiple screens.
- **The Voice/Text Operator:** Users who prefer to brain-dump goals and tasks in conversational English and let the system categorize and link them automatically.
- **Developers & Tech Professionals:** Users who appreciate high-tech, terminal-inspired design and open standards (e.g. `agentskills.io`).

---

## ⚡ Core Product Features

### 1. Natural Language Command Loop (The Datalink)
- Users interact using a conversational console.
- An AI goal-tracker agent parses the input into structured actions:
  - Adding a Goal (Epic, Milestone, Micro-goal).
  - Adding a Task (linked to a Goal or standalone).
  - Archiving/deleting an item.
  - Pausing, resuming, or completing an action.

### 2. Infinite Goal Nesting Hierarchy
- Directives are organized hierarchically:
  - **Epics:** High-level strategic themes (e.g., "Phase 1: The Personal Utility Loop").
  - **Milestones:** Core mid-level deliverables (e.g., "Sub-Goal 1: Establish the Local Data Loop").
  - **Micro-goals:** Fine-grained operational objectives.
- There is no hardcoded limit to nesting depth.

### 3. Automatic Eisenhower Prioritization
- All tasks and goals have two simple attributes: **Importance** (1-5) and **Urgency** (1-5).
- The system automatically calculates a **Priority Score** (`importance * urgency`) ranging from **1 to 25**.
- This score is used to float critical standalone tasks and directives to the top of their respective visual panels.

### 4. Soft-Archive Cascades
- To protect relational integrity, archiving a goal (e.g., Epic) recursively triggers a soft-archive cascade.
- All child milestones, micro-goals, and associated tasks are marked as `ARCHIVED` in a single transactional cascade.

### 5. UTC/Timezone Security
- Dates and deadlines are normalized to **UTC** to prevent timezone-shifting errors, while display outputs are formatted relative to the user's localized timezone setting (e.g. `Europe/London`).

---

## 🖥️ The Visual Command Dashboard (Tactical HUD)

The user interface is modeled after a **Retro-Futuristic Tactical HUD** command deck:
- **Core Metrics:** High-density summary cards showing Total Goals, Completed Goals, Active Tasks, and Average Task Priority.
- **Unassigned Operations:** A dedicated priority-sorted queue for standalone tasks.
- **Hierarchical Goals Decision Tree:** A scrollable, nested visualization showing the complete active tree (Epics, Milestones, Micro-goals, and associated operations).
- **Tactical Audit Feed:** A live terminal logger capturing background synchronization heartbeats and execution ledger status.
