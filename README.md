# 🎯 goalmanager

A minimalist, voice/text-driven personal goal and task management system built with Python, SQLModel, and SQLite. Decoupled following the `agentskills.io` open standard.

---

## 🚀 Key Features

*   **Semantic Command Processing:** Zero manual creation forms or complex sliders. Inputs are parsed by an AI command interpreter into strict relational database writes.
*   **Infinite Goal Nesting:** Self-referential database hierarchy supporting nested objectives (Epic $\rightarrow$ Milestone $\rightarrow$ Micro-goal).
*   **Eisenhower Prioritization:** Autocalculated priority matrices (`urgency * importance` score from 1 to 25) to float critical items to the top of your visual dashboard.
*   **Soft-Archive Cascades:** Deleting a master goal recursively archives all sub-goals and micro-tasks safely, enabling instant "Undo" restorations.
*   **UTC/Timezone Security:** All timestamps are normalized to UTC based on your IANA local timezone setting to prevent late-night date drift.

---

## 📂 Repository Layout

```text
AI-Goal-Task-Manager/
├── .agent/
│   └── skills/
│       └── goal-tracker/           # Custom agentskills.io compliant skill
│           ├── SKILL.md            # Natural language prompt guidelines
│           └── scripts/
│               └── local_tools.py  # Python database CRUD operations
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── database.py             # SQLite database SQLModel definitions
│   │   └── main.py                 # FastAPI REST API bridge
│   ├── .venv/                      # Python isolated virtual environment
│   └── requirements.txt            # Package dependencies list
│
├── frontend/                       # Visual retro-futuristic HUD dashboard
│   ├── index.html                  # HTML HUD container
│   ├── styles.css                  # Custom cyber HUD stylesheet
│   └── app.js                      # Controller engine & dynamic filters
│
├── goalmanager.db                  # Local SQLite database file (gitignored)
└── .gitignore                      # Git exclusion rules
```

---

## 🛠️ Installation & Setup (WSL2 Ubuntu)

Ensure your WSL environment is equipped with `python3` and `python3-venv`.

1.  **Clone the Repository:**
    ```bash
    git clone git@github.com:jmr12mct/AI-Goal-Task-Manager.git
    cd AI-Goal-Task-Manager
    ```

2.  **Create and Activate the Virtual Environment:**
    ```bash
    python3 -m venv backend/.venv
    source backend/.venv/bin/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

4.  **Initialize the Database:**
    ```bash
    python3 backend/app/database.py
    ```
    This creates `goalmanager.db` in your root folder and initializes all table schemas.

5.  **Run the Visual Dashboard:**
    ```bash
    uvicorn backend.app.main:app --reload
    ```
    Open `http://127.0.0.1:8000` in your web browser to access the retro-futuristic HUD decision matrix console.

---

## 🧪 Running Integration Verification Tests

We maintain an E2E testing suite in the scratch directory to verify database actions without polluting your clean primary database.

To run the verification checks:
```bash
python3 -c "import sys; sys.path.append('.'); import _agent.skills.goal-tracker.scripts.local_tools" # Verification test command
```
*(Alternatively, run the test script dynamically using the local path.)*

---

## 🔒 License

Personal Proprietary Workspace.
