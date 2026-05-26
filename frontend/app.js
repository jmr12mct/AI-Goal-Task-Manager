/* =====================================================================
 * 🎓 RETRO-FUTURISTIC TACTICAL HUD - CONTROLLER ENGINE (UX REFINED V2)
 * =====================================================================
 * Handles dashboard data synchronization, recursive node compilation, 
 * metrics aggregation, dynamic Status filters with Ancestral Context 
 * Preservation, collapsing nodes, minimizable terminal, and recovery.
 * ===================================================================== */

const API_ENDPOINT = '/api/dashboard';
let rawDashboardState = null; // Caches raw data for dynamic filtering
let retryCountdownTimer = null;
let retrySecondsLeft = 5;
let isReconnecting = false;

// DOM Selectors
const sysStatusEl = document.getElementById('sys-status');
const syncTimeEl = document.getElementById('sync-time');
const errorOverlayEl = document.getElementById('error-overlay');
const retryTimerEl = document.getElementById('retry-timer');
const reconnectBtn = document.getElementById('reconnect-btn');
const ledgerSyncStateEl = document.getElementById('ledger-sync-state');

const metricGoalsTotalEl = document.getElementById('metric-goals-total');
const metricGoalsCompletedEl = document.getElementById('metric-goals-completed');
const metricTasksActiveEl = document.getElementById('metric-tasks-active');
const metricPriorityAvgEl = document.getElementById('metric-priority-avg');

const standaloneTasksListEl = document.getElementById('standalone-tasks-list');
const goalsTreeContainerEl = document.getElementById('goals-tree-container');

const statusFilterEl = document.getElementById('status-filter');
const terminalPanel = document.getElementById('terminal-panel');
const terminalToggleBtn = document.getElementById('terminal-toggle-btn');

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
    
    // Auto-scroll to bottom if not minimized
    if (!terminalPanel.classList.contains('minimized')) {
        logContent.scrollTop = logContent.scrollHeight;
    }
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
    
    if (ledgerSyncStateEl) {
        ledgerSyncStateEl.textContent = 'SYNCING';
        ledgerSyncStateEl.className = 'meta-val text-amber';
    }
    
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
        
        if (ledgerSyncStateEl) {
            ledgerSyncStateEl.textContent = 'STANDBY';
            ledgerSyncStateEl.className = 'meta-val text-green';
        }
        
        const now = new Date();
        syncTimeEl.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        
        // Cache data and trigger processor
        rawDashboardState = data;
        processAndRenderDashboard();
        
    } catch (error) {
        console.error(error);
        logTerminal(`DATALINK CORRUPTION: ${error.message}. ENGAGING ALARM OVERLAYS.`, 'red');
        if (ledgerSyncStateEl) {
            ledgerSyncStateEl.textContent = 'CORRUPT';
            ledgerSyncStateEl.className = 'meta-val text-red';
        }
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
 * DATA PROCESSOR & RENDER COMPILER (FILTER-SUPPORTED)
 * ===================================================================== */
function processAndRenderDashboard() {
    if (!rawDashboardState) return;
    
    const goalsTree = rawDashboardState.goals_tree || [];
    const standaloneTasks = rawDashboardState.standalone_tasks || [];
    
    // 1. Aggregates metrics from absolute raw state (shows overall operational capacity)
    const allGoalsFlat = flattenGoalsTree(goalsTree);
    
    let allTasks = [...standaloneTasks];
    allGoalsFlat.forEach(goal => {
        if (goal.tasks) {
            allTasks = allTasks.concat(goal.tasks);
        }
    });
    
    const totalGoals = allGoalsFlat.length;
    const completedGoals = allGoalsFlat.filter(g => g.status === 'COMPLETED').length;
    const activeTasks = allTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
    
    const sumPriority = allTasks.reduce((sum, t) => sum + (t.priority_score || 0), 0);
    const avgPriority = allTasks.length > 0 ? (sumPriority / allTasks.length).toFixed(1) : '0.0';
    
    metricGoalsTotalEl.textContent = totalGoals;
    metricGoalsCompletedEl.textContent = completedGoals;
    metricTasksActiveEl.textContent = activeTasks;
    metricPriorityAvgEl.textContent = avgPriority;
    
    logTerminal(`METRICS SYNC: Parsed ${totalGoals} directives, ${activeTasks} active operations.`, 'green');
    
    // 2. Render dynamic contents based on filter criteria
    applyFiltersAndCompileTree();
}

/* =====================================================================
 * DYNAMIC FILTERING & COMPILING ALGORITHM
 * ===================================================================== */
function applyFiltersAndCompileTree() {
    if (!rawDashboardState) return;
    
    const selectedStatus = statusFilterEl ? statusFilterEl.value : 'ALL';
    
    logTerminal(`FILTER ENGINE: Status=[${selectedStatus}] (Ancestral Context Preservation ACTIVE)...`, 'cyan');
    
    // A. Filter Standalone Tasks by status
    let filteredTasks = rawDashboardState.standalone_tasks || [];
    if (selectedStatus === 'ACTIVE') {
        filteredTasks = filteredTasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS');
    } else if (selectedStatus === 'COMPLETED') {
        filteredTasks = filteredTasks.filter(t => t.status === 'COMPLETED');
    } else if (selectedStatus === 'PAUSED') {
        filteredTasks = []; // standalone tasks do not support PAUSED state
    }
    renderStandaloneTasks(filteredTasks);
    
    // B. Build filtered Goals Hierarchy with Ancestral Context Preservation
    const filteredTree = compileFilteredTree(rawDashboardState.goals_tree || [], selectedStatus);
    renderGoalsTree(filteredTree);
    
    logTerminal(`DIRECTIVES: Rendered filtered tree. ${filteredTree.length} base contextual branches drawn.`, 'green');
}

/* =====================================================================
 * ANCESTRAL CONTEXT PRESERVATION FILTER IMPLEMENTATION
 * ===================================================================== */
function checkGoalMatch(goal, selectedStatus) {
    if (selectedStatus === 'ALL') return true;
    
    // a) Goal's own status matches
    if (goal.status === selectedStatus) return true;
    
    // b) Any recursive child goals match
    if (goal.sub_goals && goal.sub_goals.length > 0) {
        for (const sub of goal.sub_goals) {
            if (checkGoalMatch(sub, selectedStatus)) return true;
        }
    }
    
    // c) Any direct tasks match
    if (goal.tasks && goal.tasks.length > 0) {
        for (const task of goal.tasks) {
            if (selectedStatus === 'ACTIVE' && (task.status === 'TODO' || task.status === 'IN_PROGRESS')) {
                return true;
            }
            if (selectedStatus === 'COMPLETED' && task.status === 'COMPLETED') {
                return true;
            }
            if (selectedStatus === 'PAUSED' && task.status === 'PAUSED') {
                return true;
            }
        }
    }
    
    return false;
}

function compileFilteredTree(nodes, selectedStatus) {
    let result = [];
    
    function processNode(node) {
        // Discard node completely if neither it nor its descendants match the filter
        const hasAnyMatch = checkGoalMatch(node, selectedStatus);
        if (!hasAnyMatch) {
            return null;
        }
        
        // Recursively compile child goals
        let filteredSubGoals = [];
        if (node.sub_goals && node.sub_goals.length > 0) {
            for (const sub of node.sub_goals) {
                const compiledSub = processNode(sub);
                if (compiledSub) {
                    filteredSubGoals.push(compiledSub);
                }
            }
        }
        
        // Determine direct match status
        const isDirectMatch = (selectedStatus === 'ALL' || node.status === selectedStatus);
        
        return {
            ...node,
            sub_goals: filteredSubGoals,
            isContextAnchor: !isDirectMatch // If it doesn't match directly, it serves as a contextual ancestor
        };
    }
    
    for (const node of nodes) {
        const compiled = processNode(node);
        if (compiled) {
            result.push(compiled);
        }
    }
    
    return result;
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
                NO STANDALONE OPERATIONS QUEUED.
            </div>
        `;
        return;
    }
    
    const sortedTasks = [...tasks].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    
    sortedTasks.forEach(task => {
        standaloneTasksListEl.appendChild(compileTaskNode(task));
    });
}

/* =====================================================================
 * RENDERING COMPONENT: GOALS TREE
 * ===================================================================== */
function renderGoalsTree(goalsTree) {
    goalsTreeContainerEl.innerHTML = '';
    
    console.log("LOG: renderGoalsTree called with nodes count =", goalsTree.length);
    
    if (goalsTree.length === 0) {
        goalsTreeContainerEl.innerHTML = `
            <div class="log-line text-amber" style="text-align: center; padding: 60px 0; font-family: var(--font-mono);">
                [!!! TACTICAL FEED EMPTY !!!]<br>
                NO SYSTEM DIRECTIVES MATCH THE SELECTED FILTERS.<br>
                ADJUST STATUS PARAMETERS TO RESTORE VISUALS.
            </div>
        `;
        return;
    }
    
    const sortedTopLevel = [...goalsTree].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
    let treeHtml = '';
    sortedTopLevel.forEach(epicNode => {
        try {
            treeHtml += compileGoalHierarchyNode(epicNode, 0);
        } catch (err) {
            console.error("LOG ERROR: Failed to compile epic node:", epicNode, err);
        }
    });
    goalsTreeContainerEl.innerHTML = treeHtml;
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
    const contextAnchorClass = goal.isContextAnchor ? 'context-anchor' : '';
    
    // Process child tasks
    const tasks = goal.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    let tasksHtml = '';
    if (totalTasks > 0) {
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
    
    // Render context anchor badge if this goal is only displayed for ancestral hierarchy context
    const anchorBadge = goal.isContextAnchor ? `<span class="anchor-badge">ANCHOR</span>` : '';
    
    // Collapsible logic removed - all nodes render fully expanded
    const toggleIndicator = '';
    
    const paddingLeftStyle = depth > 0 ? `style="margin-left: 5px;"` : '';
    
    return `
        <div class="goal-node ${levelClass} ${contextAnchorClass}" data-id="${goal.id}" ${paddingLeftStyle}>
            <div class="goal-header">
                <div class="goal-meta">
                    ${toggleIndicator}
                    <span class="goal-badge">${goal.level}</span>
                    <span class="goal-id">#${goal.id}</span>
                    ${categoryBadge}
                    ${anchorBadge}
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
    
    // Register automatic synchronization loop (runs every 10 seconds)
    setInterval(() => {
        if (!errorOverlayEl.classList.contains('hidden')) return; // Skip if offline active countdown screen
        logTerminal('BACKGROUND METRICS AUTO-SYNC RUNNING...', 'muted');
        syncDashboardData();
    }, 10000);

    // 1. REGISTER SELECT DROPDOWN FILTER TRIGGERS
    if (statusFilterEl) {
        statusFilterEl.addEventListener('change', () => {
            applyFiltersAndCompileTree();
        });
    }

    // 2. REGISTER AUDIT TERMINAL MINIMIZE/MAXIMIZE TOGGLE
    if (terminalToggleBtn && terminalPanel) {
        terminalToggleBtn.addEventListener('click', () => {
            terminalPanel.classList.toggle('minimized');
            const isMinimized = terminalPanel.classList.contains('minimized');
            terminalToggleBtn.textContent = isMinimized ? 'MAXIMIZE' : 'MINIMIZE';
            logTerminal(`SYSTEM HUD: Audit feed terminal ${isMinimized ? 'MINIMIZED' : 'MAXIMIZED'}.`, 'cyan');
        });
    }

    // 3. COLLAPSIBLE TREE INTERACTION REMOVED
});
