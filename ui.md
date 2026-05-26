# 🎨 UI/UX Design Specification: GOALMANAGER

This document establishes the official visual design system, styling guidelines, typography, and responsive layout standards for the **GOALMANAGER** Tactical HUD Dashboard.

---

## 🌌 Aesthetics & Theme: Retro-Futuristic Cyber HUD

The visual identity of GOALMANAGER is a **Cybernetic Command Console HUD**. It combines high-tech futuristic structures with retro-futuristic CRT monitor overlays to create an atmospheric, high-productivity environment.

### Core Visual Principles:
1. **High-Contrast Dark Mode:** Obsidian black backgrounds combined with vibrant glowing accents.
2. **Glassmorphism:** High-blur panels (`backdrop-filter`) creating depth over a background matrix grid.
3. **Micro-animations & Glows:** Soft text glows and subtle pulsing indicators for active and in-progress tasks.
4. **CRT Atmosphere:** A subtle horizontal scanning-line texture across the viewport.

---

## 🎨 Color Palette & Design Tokens

Harmony is achieved through tailored colors with glowing properties rather than generic primary colors.

| Token | HSL / Hex Value | Visual Purpose | Glow Behavior |
| :--- | :--- | :--- | :--- |
| `--bg-dark` | `#05070c` | Master viewport body background | None |
| `--bg-panel` | `rgba(12, 18, 28, 0.85)` | Semi-transparent dashboard cards | Backdrop blur (8px) |
| `--cyan` | `#00f3ff` | Primary tactical text, Epic borders, badges | `0 0 12px rgba(0,243,255,0.4)` |
| `--green` | `#00ff66` | Completion state, Milestone borders, online status | `0 0 12px rgba(0,255,102,0.4)` |
| `--amber` | `#ffaa00` | In-progress state, Micro-goals, warnings | `0 0 12px rgba(255,170,0,0.4)` |
| `--red` | `#ff3366` | Critical priority elements, offline alerts | `0 0 12px rgba(255,51,102,0.5)` |
| `--muted-blue` | `#3d5066` | Standby states, grid dividers, scrollbars | None |

---

## 📐 Typography

Fonts are strictly loaded from Google Fonts to maintain the cybernetic console aesthetic.

- **Headers & Metrics (`--font-mono`):** `Share Tech Mono`, monospace.
  - Used for numbers, statuses, labels, metadata, and terminal log feeds.
  - Gives a raw, machine-readable look.
- **Body & Content (`--font-sans`):** `Outfit`, sans-serif.
  - Used for goal/task titles, descriptions, and paragraphs.
  - Ensures clean readability for textual data.

---

## 📦 Panel Grid & Layout Architecture

The screen space is divided into a three-pane grid structure configured for modern high-resolution displays:

```text
+-----------------------------------------------------------------------------+
| [SYS_OP Tag]           GOALMANAGER // DECISION MATRIX         [DATALINK]    |
+-----------------------------------------------------------------------------+
| +----------------------------------+ +------------------------------------+ |
| |          CORE METRICS            | |                                    | |
| | [Total] [Done] [Tasks] [AvgPri]  | |  HIERARCHICAL GOALS DECISION TREE  | |
| +----------------------------------+ |                                    | |
| |                                  | |  - Epic #1 [Roadmap] (Priority 25)  | |
| |      UNASSIGNED OPERATIONS       | |    - Milestone #2 [Database]       | |
| |      (Standalone Tasks)          | |      - Task 1 (PS: 25)             | |
| |                                  | |      - Task 2 (PS: 20)             | |
| |                                  | |                                    | |
| +----------------------------------+ +------------------------------------+ |
| +-------------------------------------------------------------------------+ |
| | >_ TACTICAL AUDIT FEED (Terminal Log)                                   | |
| +-------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------+
```

### 1. Left Column: Metrics & Standalone Queue
- **Core Metrics (Flex Grid):** Two-column stat grid showing four digital indicators.
- **Unassigned Operations (Block Scroll):** A container scrolling standalone tasks vertically.

### 2. Right Column: The Hierarchical Goal Tree (`tree-scroll-container`)
- **Scroll Behavior:** Must use a standard block layout with `overflow-y: auto` to prevent flex items from collapsing (`flex-shrink`).
- **Nesting Spacing:** Indented recursively using border-left guides to visualize parent-child relationships cleanly.

### 3. Footer: Audit Terminal (`hud-footer`)
- Integrates a maximize/minimize toggle. Minimized state collapses the panel to exactly `45px` high to preserve screen real estate.

---

## 📱 Responsiveness

Responsive design is managed via media queries:
- **Large Screens (>1024px):** Fixed viewport height (`height: 100vh`) with locked, scrolling interior panels.
- **Mobile & Small Screens (<1024px):** Grid collapses into a single-column layout, and body overflow is unlocked (`height: auto`) to support standard finger scrolling.
