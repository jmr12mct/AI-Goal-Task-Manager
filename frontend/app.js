/* =====================================================================
 * 🎓 RETRO-FUTURISTIC TACTICAL HUD - CONTROLLER ENGINE
 * =====================================================================
 * Handles dashboard data synchronization, recursive node compilation, 
 * metrics aggregation, custom simulated logs, and offline recovery loops.
 * ===================================================================== */

const API_ENDPOINT = 'http://127.0.0.1:8000/api/dashboard';
let retryCountdownTimer = null;
let retrySecondsLeft = 5;
let isReconnecting = false;

// DOM Selectors
const sysStatusEl = document.getElementById('sys-status');
const syncTimeEl = document.getElementById('sync-time');
const errorOverlayEl = document.getElementById('error-overlay');
const retryTimerEl = document.getElementById('retry-timer');
const reconnectBtn = document.getElementById('reconnect-btn');

const metricGoalsTotalEl = document.getElementById('metric-goals-total');
const metricGoalsCompletedEl = document.getElementById('metric-goals-completed');
const metricTasksActiveEl = document.getElementById('metric-tasks-active');
const metricPriorityAvgEl = document.getElementById('metric-priority-avg');

const standaloneTasksListEl = document.getElementById('standalone-tasks-list');
const goalsTreeContainerEl = document.getElementById('goals-tree-container');

/* =====================================================================
 * SIMULATED TACTICAL AUDIT LOGGER
 * ===================================================================== */
function logTerminal(message, type = 'muted') {
    const logContent = document.getElementById('terminal-log-content');
    if (!logContent) return;
    
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    const timeStr = `${h}:${m}:${s}.${ms}`;
    
    const line = document.createElement('div');
    line.className = `log-line text-${type}`;
    line.innerHTML = `[${timeStr}] ${message}`;
    
    logContent.appendChild(line);
    
    // Auto-scroll to bottom of the terminal feed
    logContent.scrollTop = logContent.scrollHeight;
}

/* =====================================================================
 * SECURE DOM ESCAPING (No Raw Injection Flaws)
 * ===================================================================== */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================================
 * MONOSPACE TIME STAMP FORMATTER
 * ===================================================================== */
function formatDeadline(isoString) {
    if (!isoString) return 'N/A';
    try {
        const d = new Date(isoString);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hr = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day} ${hr}:${min} UTC`;
    } catch (e) {
        return isoString;
    }
}

/* =====================================================================
 * DATA SYNCHRONIZATION ENGINE
 * ===================================================================== */
async function syncDashboardData() {
    if (isReconnecting) return;
    isReconnecting = true;
    
    logTerminal('INITIATING DATALINK HANDSHAKE WITH DECISION CORE...', 'cyan');
    sysStatusEl.textContent = 'CONNECTING...';
    sysStatusEl.className = 'value';
    
    try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
            throw new Error(`CORE RESOLUTION ERROR: HTTP-${response.status}`);
        }
        
        const data = await response.json();
        
        // Datalink restoration cleanup
        errorOverlayEl.classList.add('hidden');
        if (retryCountdownTimer) {
            clearInterval(retryCountdownTimer);
            retryCountdownTimer = null;
        }
        
        logTerminal('DATALINK ESTABLISHED. CORE RESPONSE 200 OK.', 'green');
        
        // Update Sys Status Indicators
        sysStatusEl.textContent = 'ONLINE';
        sysStatusEl.className = 'value status-online';
        
        const now = new Date();
        syncTimeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        // Render Dashboard Sub-systems
        processAndRenderDashboard(data);
        
    } catch (error) {
        console.error(error);
        logTerminal(`DATALINK CORRUPTION: ${error.message}. ENGAGING ALARM OVERLAYS.`, 'red');
        triggerAlarmOverlay();
    } finally {
        isReconnecting = false;
    }
}

/* =====================================================================
 * OFFLINE ALARM & COUNTDOWN LOOP
 * ===================================================================== */
function triggerAlarmOverlay() {
    sysStatusEl.textContent = 'OFFLINE';
    sysStatusEl.className = 'value status-offline';
    errorOverlayEl.classList.remove('hidden');
    
    retrySecondsLeft = 5;
    retryTimerEl.textContent = retrySecondsLeft;
    
    if (retryCountdownTimer) {
        clearInterval(retryCountdownTimer);
    }
    
    retryCountdownTimer = setInterval(() => {
        retrySecondsLeft--;
        retryTimerEl.textContent = retrySecondsLeft;
        logTerminal(`CRITICAL ALARM: DATALINK DOWN. AUTOCONNECT RETRY IN ${retrySecondsLeft}S...`, 'amber');
        
        if (retrySecondsLeft <= 0) {
            clearInterval(retryCountdownTimer);
            retryCountdownTimer = null;
            syncDashboardData();
        }
    }, 1000);
}

// Manual overriding button trigger
reconnectBtn.addEventListener('click', () => {
    logTerminal('MANUAL OVERRIDE DETECTED. FORCING RE-HANDSHAKE.', 'cyan');
    if (retryCountdownTimer) {
        clearInterval(retryCountdownTimer);
        retryCountdownTimer = null;
    }
    syncDashboardData();
});

/* =====================================================================
 * DATA PROCESSOR & RENDER COMPILER
 * ===================================================================== */
function processAndRenderDashboard(data) {
    logTerminal('DECRYPTING GOAL DIRECTIVES TREE & TACTICAL METRICS...', 'cyan');
    
    const goalsTree = data.goals_tree || [];
    const standaloneTasks = data.standalone_tasks || [];
    
    // 1. Flatten the recursive hierarchy for metrics aggregation
    const allGoalsFlat = flattenGoalsTree(goalsTree);
    logTerminal(`SUCCESSFULLY PARSED: ${allGoalsFlat.length} TOTAL GOAL DIRECTIVES.`, 'green');
    
    // Gather all tasks (both standalone and nested deep within hierarchy)
    let allTasks = [...standaloneTasks];
    allGoalsFlat.forEach(goal => {
        if (goal.tasks) {
            allTasks = allTasks.concat(goal.tasks);
        }
    });
    
    // Calculate metric parameters
    const totalGoals = allGoalsFlat.length;
    const completedGoals = allGoalsFlat.filter(g => g.status === 'COMPLETED').length;
    
    // Active tasks: those which are TODO or IN_PROGRESS
    const activeTasks = allTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    
    // Average Task Eisenhower Priority Score
    const sumPriority = allTasks.reduce((sum, t) => sum + (t.priority_score || 0), 0);
    const avgPriority = allTasks.length > 0 ? (sumPriority / allTasks.length).toFixed(1) : '0.0';
    
    // Render Stats to core metrics HUD
    metricGoalsTotalEl.textContent = totalGoals;
    metricGoalsCompletedEl.textContent = completedGoals;
    metricTasksActiveEl.textContent = activeTasks;
    metricPriorityAvgEl.textContent = avgPriority;
    
    logTerminal(`PERFORMANCE AUDIT: Completed Goals: [${completedGoals}/${totalGoals}] | Active Operations Queue: ${activeTasks}.`, 'green');
    logTerminal(`TACTICAL PRIORITY EVALUATION: Calculated Average Priority Score at [${avgPriority}].`, 'cyan');

    // 2. Render Standalone Unassigned Operations
    renderStandaloneTasks(standaloneTasks);

    // 3. Compile and Render Nested Hierarchical Tree
    renderGoalsTree(goalsTree);
}

/* =====================================================================
 * GOALS RECURSIVE FLATTENER HELPERS
 * ===================================================================== */
function flattenGoalsTree(goalsList) {
    let flat = [];
    for (const goal of goalsList) {
        flat.push(goal);
        if (goal.sub_goals && goal.sub_goals.length > 0) {
            flat = flat.concat(flattenGoalsTree(goal.sub_goals));
        }
    }
    return flat;
}

/* =====================================================================
 * RENDERING COMPONENT: STANDALONE TASKS
 * ===================================================================== */
function renderStandaloneTasks(tasks) {
    standaloneTasksListEl.innerHTML = '';
    
    if (tasks.length === 0) {
        standaloneTasksListEl.innerHTML = `
            <div class="log-line text-muted" style="text-align: center; padding: 30px 0;">
                NO STANDALONE OPERATIONS QUEUED.<br>ALL ACTIONS ALIGNED TO TACTICAL DIRECTIVES.
            </div>
        `;
        logTerminal('STANDALONE ENGINE: Standby mode. All tasks mapped inside goals tree.', 'muted');
        return;
    }
    
    // Sorted descending by priority score (pre-sorted backend, but guaranteed here)
    const sortedTasks = [...tasks].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    
    sortedTasks.forEach(task => {
        standaloneTasksListEl.appendChild(compileTaskNode(task));
    });
    
    logTerminal(`STANDALONE ENGINE: Mounted ${tasks.length} unassigned tactical items sorted by urgency matrix.`, 'cyan');
}

/* =====================================================================
 * RENDERING COMPONENT: GOALS TREE
 * ===================================================================== */
function renderGoalsTree(goalsTree) {
    goalsTreeContainerEl.innerHTML = '';
    
    if (goalsTree.length === 0) {
        goalsTreeContainerEl.innerHTML = `
            <div class="log-line text-red" style="text-align: center; padding: 60px 0; font-family: var(--font-mono);">
                [!!! CRITICAL SYSTEM WARNING !!!]<br>
                NO ACTIVE GOAL DATABRICKS RECOVERED FROM COMMAND ARCHIVES.<br>
                PLEASE INITIALIZE AN EPIC DIRECTIVE TO DISPLAY DECISION GRAPHICS.
            </div>
        `;
        logTerminal('DIRECTIVES DATABASE: No top-level active epic nodes located.', 'red');
        return;
    }
    
    // Sort top level goals descending by computed priority score
    const sortedTopLevel = [...goalsTree].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    
    sortedTopLevel.forEach(epicNode => {
        const epicHtml = compileGoalHierarchyNode(epicNode, 0);
        const parser = new DOMParser();
        const doc = parser.parseFromString(epicHtml, 'text/html');
        goalsTreeContainerEl.appendChild(doc.body.firstChild);
    });
    
    logTerminal('DIRECTIVES ENGINE: Successfully generated graphical vector branches.', 'green');
}

/* =====================================================================
 * DOM NODE BUILDERS
 * ===================================================================== */

// Builds a standalone list task item
function compileTaskNode(task) {
    const statusClass = `state-${task.status.toLowerCase()}`;
    let checkboxClass = '';
    
    if (task.status === 'COMPLETED') {
        checkboxClass = 'checked';
    } else if (task.status === 'IN_PROGRESS') {
        checkboxClass = 'in-progress';
    }
    
    const score = task.priority_score || 0;
    let scoreLevel = 'p-low';
    if (score >= 16) scoreLevel = 'p-high';
    else if (score >= 8) scoreLevel = 'p-med';
    
    const deadlineStr = task.deadline_utc ? formatDeadline(task.deadline_utc) : 'N/A';
    
    const itemDiv = document.createElement('div');
    itemDiv.className = `task-item ${statusClass}`;
    itemDiv.style.marginBottom = '6px';
    itemDiv.innerHTML = `
        <div class="task-item-left">
            <div class="task-checkbox ${checkboxClass}"></div>
            <span class="task-title">${escapeHtml(task.title)}</span>
        </div>
        <div class="task-item-right">
            <span class="task-priority-badge ${scoreLevel}">PScore: ${score}</span>
            <span class="task-deadline">${deadlineStr}</span>
        </div>
    `;
    
    return itemDiv;
}

// Recursively compiles goal node HTML containing nested milestones, subgoals and tasks
function compileGoalHierarchyNode(goal, depth = 0) {
    const levelClass = `level-${goal.level.toLowerCase()}`;
    const statusClass = `status-${goal.status.toLowerCase()}`;
    
    // Process child tasks
    const tasks = goal.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let tasksHtml = '';
    if (totalTasks > 0) {
        // Sort tasks descending by score
        const sortedTasks = [...tasks].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
        tasksHtml = `
            <div class="nested-content-divider">ASSOCIATED OPERATIONS [${completedTasks}/${totalTasks}]</div>
            <div class="goal-tasks-list">
                ${sortedTasks.map(t => `
                    <div class="task-item state-${t.status.toLowerCase()}">
                        <div class="task-item-left">
                            <div class="task-checkbox ${t.status === 'COMPLETED' ? 'checked' : (t.status === 'IN_PROGRESS' ? 'in-progress' : '')}"></div>
                            <span class="task-title">${escapeHtml(t.title)}</span>
                        </div>
                        <div class="task-item-right">
                            <span class="task-priority-badge ${(t.priority_score || 0) >= 16 ? 'p-high' : ((t.priority_score || 0) >= 8 ? 'p-med' : 'p-low')}">PS: ${t.priority_score || 0}</span>
                            <span class="task-deadline">${t.deadline_utc ? formatDeadline(t.deadline_utc) : 'N/A'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Evaluate Eisenhower priority levels
    const score = goal.priority_score || (goal.urgency * goal.importance);
    let scoreLevel = 'level-low';
    if (score >= 16) scoreLevel = 'level-high';
    else if (score >= 8) scoreLevel = 'level-medium';
    
    // Process nested child goals recursively
    const subGoals = goal.sub_goals || [];
    let subGoalsHtml = '';
    if (subGoals.length > 0) {
        // Sort subgoals by score descending
        const sortedSubGoals = [...subGoals].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
        subGoalsHtml = `
            <div class="nested-content-divider">NESTED SUB-DIRECTIVES [${subGoals.length}]</div>
            <div class="sub-goals-container">
                ${sortedSubGoals.map(subGoal => compileGoalHierarchyNode(subGoal, depth + 1)).join('')}
            </div>
        `;
    }
    
    const deadlineStr = goal.deadline_utc ? formatDeadline(goal.deadline_utc) : 'N/A';
    const categoryBadge = goal.category ? `<span class="goal-category">${escapeHtml(goal.category)}</span>` : '';
    
    // Dynamic indentation adjustment to align hierarchy beautifully without breaking hud border compositions
    const paddingLeftStyle = depth > 0 ? `style="margin-left: 5px;"` : '';
    
    return `
        <div class="goal-node ${levelClass}" data-id="${goal.id}" ${paddingLeftStyle}>
            <div class="goal-header">
                <div class="goal-meta">
                    <span class="goal-badge">${goal.level}</span>
                    <span class="goal-id">#${goal.id}</span>
                    ${categoryBadge}
                </div>
                <div class="goal-eisenhower">
                    <div class="score-badge">
                        <span class="score-label">PRIORITY</span>
                        <span class="score-num ${scoreLevel}">${score}</span>
                    </div>
                    <span class="status-pill ${statusClass}">${goal.status}</span>
                </div>
            </div>
            
            <div class="goal-body">
                <div class="goal-title-wrapper">
                    <div class="goal-title">${escapeHtml(goal.title)}</div>
                    ${goal.description ? `<div class="goal-description">${escapeHtml(goal.description)}</div>` : ''}
                </div>
                
                <div style="margin-top: 10px;">
                    ${totalTasks > 0 ? `
                    <div class="goal-progress-bar" title="Completion: ${progressPercent}%">
                        <div class="goal-progress-fill" style="width: ${progressPercent}%;"></div>
                    </div>
                    ` : ''}
                    
                    <div class="goal-meta" style="margin-bottom: 6px;">
                        <span class="task-deadline">DEADLINE: ${deadlineStr}</span>
                        <span class="task-deadline">| IMPORTANCE: ${goal.importance} | URGENCY: ${goal.urgency}</span>
                    </div>
                </div>
                
                ${tasksHtml}
                ${subGoalsHtml}
            </div>
        </div>
    `;
}

/* =====================================================================
 * BOOTSTRAP INITIALIZATION
 * ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    logTerminal('DASHBOARD SUBSYSTEM LOADED. INITIALIZING DATA PIPELINES...', 'green');
    
    // Perform initial synchronization
    syncDashboardData();
    
    // Set interval loop to synchronize automatically every 10 seconds for real-time fidelity
    setInterval(() => {
        if (!errorOverlayEl.classList.contains('hidden')) {
            // Skip automated background syncing if the datalink overlay is actively showing/counting down
            return;
        }
        logTerminal('INITIATING BACKGROUND METRICS AUTO-SYNC...', 'muted');
        syncDashboardData();
    }, 10000);
});
