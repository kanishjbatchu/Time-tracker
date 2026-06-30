// ChronoFlow Time Tracker & Analytics Engine

// State Management
let state = {
    activities: [],
    logs: [],
    alarms: [],
    notes: [],
    theme: 'dark'
};

// Which note the notepad is currently showing
let currentNoteIndex = 0;

// Category Color Mapping
const CATEGORY_COLORS = {
    'Work': '#f59e0b',
    'Learning': '#10b981',
    'Health & Fitness': '#ef4444',
    'Design': '#a855f7',
    'Chores': '#3b82f6',
    'Leisure': '#ec4899',
    'Other': '#6b7280'
};

// Global Tick Timer reference
let tickInterval = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupEventListeners();
    initTheme();
    populateRingtoneOptions();
    setDefaultAlarmDateTime();
    startTicker();
    renderAll();
    showToast('Welcome to ChronoFlow!', 'info');
});

// Setup Event Listeners
function setupEventListeners() {
    // Add Activity Form
    const addForm = document.getElementById('addActivityForm');
    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('activityName');
        const categorySelect = document.getElementById('activityCategory');
        
        addActivity(nameInput.value.trim(), categorySelect.value);
        
        nameInput.value = '';
        categorySelect.value = '';
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', toggleTheme);

    // JSON Save (full backup) + Upload (restore)
    const btnSave = document.getElementById('btnSave');
    btnSave.addEventListener('click', exportJSON);

    const btnImport = document.getElementById('btnImport');
    const importFile = document.getElementById('importFile');
    btnImport.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleJSONImport);

    // Clear All State
    const btnClear = document.getElementById('btnClear');
    btnClear.addEventListener('click', clearAllData);

    // Reset Logs Only
    const btnClearLogs = document.getElementById('btnClearLogs');
    btnClearLogs.addEventListener('click', resetLogsOnly);

    // Alarm: header button toggles the alarm customization panel
    const btnToggleAlarm = document.getElementById('btnToggleAlarm');
    if (btnToggleAlarm) btnToggleAlarm.addEventListener('click', toggleAlarmPanel);

    // Notepad: header button toggles the notepad panel
    const btnToggleNotepad = document.getElementById('btnToggleNotepad');
    if (btnToggleNotepad) btnToggleNotepad.addEventListener('click', toggleNotepadPanel);

    // Notepad: navigation, editing and note management
    document.getElementById('notePrev').addEventListener('click', showNotePrev);
    document.getElementById('noteNext').addEventListener('click', showNoteNext);
    document.getElementById('noteNew').addEventListener('click', addNote);
    document.getElementById('noteDelete').addEventListener('click', deleteCurrentNote);
    document.getElementById('noteTitle').addEventListener('input', onNoteInput);
    document.getElementById('noteContent').addEventListener('input', onNoteInput);

    // Alarm: set new alarm
    const alarmForm = document.getElementById('addAlarmForm');
    alarmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const label = document.getElementById('alarmLabel').value.trim();
        const dateVal = document.getElementById('alarmDate').value;
        const timeVal = document.getElementById('alarmTime').value;
        const ringtone = document.getElementById('alarmRingtone').value;

        if (addAlarm(label, dateVal, timeVal, ringtone)) {
            document.getElementById('alarmLabel').value = '';
            setDefaultAlarmDateTime();
        }
    });

    // Alarm: preview the selected ringtone
    document.getElementById('btnPreviewRingtone').addEventListener('click', previewRingtone);

    // Alarm: ringing overlay controls
    document.getElementById('btnStopAlarm').addEventListener('click', dismissCurrentAlarm);
    document.getElementById('btnSnooze').addEventListener('click', snoozeCurrentAlarm);

    // Edit modal (customize stopwatch / edit session)
    document.getElementById('editSave').addEventListener('click', saveEdit);
    document.getElementById('editCancel').addEventListener('click', closeEditModal);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal(); // click backdrop to close
    });
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('editModal');
        if (e.key === 'Escape' && modal.classList.contains('active')) closeEditModal();
    });

    // Unlock the Web Audio context on the first user gesture so alarms can play later
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
}

// Load / Save State functions
function loadState() {
    let savedState = null;
    try {
        savedState = localStorage.getItem('chronoflow_state');
    } catch (e) {
        // localStorage can be blocked (e.g. an inline/opaque-origin preview or
        // private mode). Run without persistence rather than crashing.
        console.warn('localStorage unavailable — running without saved data.', e);
    }
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            // Ensure necessary arrays exist
            if (!state.activities) state.activities = [];
            if (!state.logs) state.logs = [];
            if (!state.notes) state.notes = [];
            if (!state.theme) state.theme = 'dark';
            // Alarms are session-only: they are created via the "Set Alarm" button
            // and never restored from storage, so none "load" on page load.
            state.alarms = [];
            
            // Adjust activities loading: if they were running when saved, convert relative running time
            state.activities.forEach(act => {
                if (act.isRunning && act.startTime) {
                    // Calculate elapsed seconds while app was closed and resume tracker
                    const offlineSeconds = Math.floor((Date.now() - act.startTime) / 1000);
                    act.timeElapsed = (act.accumulatedBeforeRun || 0) + offlineSeconds;
                    act.startTime = Date.now(); // reset start timestamp to now
                }
            });
        } catch (e) {
            console.error('Failed to parse local storage state, initializing empty state.', e);
        }
    }
}

function saveState() {
    try {
        // Persist everything EXCEPT alarms — alarms are session-only and must not
        // be reloaded when the website loads.
        const { alarms, ...persist } = state;
        localStorage.setItem('chronoflow_state', JSON.stringify(persist));
    } catch (e) {
        // Storage unavailable/full — keep working in-memory for this session.
    }
}

// Theme handling
function initTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#themeToggle i');
    if (state.theme === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    initTheme();
    showToast(`Switched to ${state.theme} theme`, 'info');
}

// Activity logic
function addActivity(name, category) {
    // Avoid exact duplicate running names for UX clarity
    if (state.activities.some(act => act.name.toLowerCase() === name.toLowerCase())) {
        showToast('An activity with this name already exists!', 'warning');
        return;
    }

    const newActivity = {
        id: 'act_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        name: name,
        category: category,
        timeElapsed: 0,
        totalAccumulated: 0,
        isRunning: false,
        startTime: null,
        accumulatedBeforeRun: 0
    };

    state.activities.push(newActivity);
    saveState();
    renderActivities();
    showToast(`Created activity "${name}"`, 'success');
}

function deleteActivity(id) {
    const index = state.activities.findIndex(act => act.id === id);
    if (index !== -1) {
        const name = state.activities[index].name;
        state.activities.splice(index, 1);
        saveState();
        renderActivities();
        renderCharts();
        showToast(`Deleted activity "${name}"`, 'warning');
    }
}

function toggleStopwatch(id) {
    const act = state.activities.find(a => a.id === id);
    if (!act) return;

    if (act.isRunning) {
        // Pause stopwatch
        act.isRunning = false;
        act.timeElapsed = act.accumulatedBeforeRun + Math.floor((Date.now() - act.startTime) / 1000);
        act.accumulatedBeforeRun = act.timeElapsed;
        act.startTime = null;
        showToast(`Paused "${act.name}"`, 'info');
    } else {
        // Start stopwatch
        act.isRunning = true;
        act.startTime = Date.now();
        act.accumulatedBeforeRun = act.timeElapsed;
        showToast(`Started "${act.name}"`, 'success');
    }

    saveState();
    renderActivities();
}

function resetStopwatch(id) {
    const act = state.activities.find(a => a.id === id);
    if (!act) return;

    act.isRunning = false;
    act.startTime = null;
    act.timeElapsed = 0;
    act.accumulatedBeforeRun = 0;

    saveState();
    renderActivities();
    showToast(`Reset stopwatch for "${act.name}"`, 'info');
}

function logStopwatch(id) {
    const act = state.activities.find(a => a.id === id);
    if (!act) return;

    // Calculate current seconds
    let currentSessionSec = act.timeElapsed;
    if (act.isRunning && act.startTime) {
        currentSessionSec = act.accumulatedBeforeRun + Math.floor((Date.now() - act.startTime) / 1000);
    }

    if (currentSessionSec <= 0) {
        showToast('Cannot log a session with zero time!', 'warning');
        return;
    }

    // Log to records
    const newLog = {
        id: 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        activityId: act.id,
        activityName: act.name,
        category: act.category,
        duration: currentSessionSec,
        timestamp: new Date().toISOString()
    };

    state.logs.unshift(newLog); // Put latest logs at top

    // Update accumulated total inside the activity
    act.totalAccumulated += currentSessionSec;

    // Reset current timer
    act.isRunning = false;
    act.startTime = null;
    act.timeElapsed = 0;
    act.accumulatedBeforeRun = 0;

    saveState();
    renderAll();
    showToast(`Logged ${formatDuration(currentSessionSec)} to "${act.name}"`, 'success');
}

function deleteLog(logId) {
    const index = state.logs.findIndex(log => log.id === logId);
    if (index !== -1) {
        const log = state.logs[index];
        // Deduct from activity total accumulated if activity still exists
        const act = state.activities.find(a => a.id === log.activityId);
        if (act) {
            act.totalAccumulated = Math.max(0, act.totalAccumulated - log.duration);
        }

        state.logs.splice(index, 1);
        saveState();
        renderAll();
        showToast('Session log deleted', 'warning');
    }
}

// =======================================================================
// CUSTOMIZE / EDIT TIME
// - Adjust a live stopwatch's elapsed time (e.g. you forgot to start it).
// - Fix a logged session recorded with the wrong duration or on the wrong
//   DAY by editing its time and its completion date.
// =======================================================================

// What's currently being edited: { type: 'stopwatch' | 'log', id }
let editTarget = null;

// Set a stopwatch's elapsed time directly. Keeps it running from the new value
// if it was running when edited.
function setStopwatchTime(id, totalSeconds) {
    const act = state.activities.find(a => a.id === id);
    if (!act) return;
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    act.timeElapsed = totalSeconds;
    act.accumulatedBeforeRun = totalSeconds;
    act.startTime = act.isRunning ? Date.now() : null;
    saveState();
    renderActivities();
}

// Update a logged session's duration and/or completion date. Adjusts the owning
// activity's running total so the analytics stay correct.
function editLog(logId, newDurationSec, newTimestampISO) {
    const log = state.logs.find(l => l.id === logId);
    if (!log) return;
    const oldDuration = log.duration;
    log.duration = Math.max(1, Math.floor(newDurationSec));
    log.timestamp = newTimestampISO;

    const act = state.activities.find(a => a.id === log.activityId);
    if (act) {
        act.totalAccumulated = Math.max(0, act.totalAccumulated - oldDuration + log.duration);
    }

    // Keep the log newest-first after a date change
    state.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    saveState();
    renderAll();
}

// --- Edit modal control ---
function openEditStopwatch(id) {
    const act = state.activities.find(a => a.id === id);
    if (!act) return;

    let currentSec = act.timeElapsed;
    if (act.isRunning && act.startTime) {
        currentSec = act.accumulatedBeforeRun + Math.floor((Date.now() - act.startTime) / 1000);
    }

    editTarget = { type: 'stopwatch', id: id };
    document.getElementById('editModalTitle').textContent = 'Customize Stopwatch';
    document.getElementById('editModalSubtitle').textContent = act.name;
    fillEditTimeInputs(currentSec);
    document.getElementById('editDateGroup').style.display = 'none';
    showEditModal();
}

function openEditLog(logId) {
    const log = state.logs.find(l => l.id === logId);
    if (!log) return;

    editTarget = { type: 'log', id: logId };
    document.getElementById('editModalTitle').textContent = 'Edit Session';
    document.getElementById('editModalSubtitle').textContent = `${log.activityName} · ${log.category}`;
    fillEditTimeInputs(log.duration);
    document.getElementById('editDate').value = toDatetimeLocalValue(new Date(log.timestamp));
    document.getElementById('editDateGroup').style.display = 'flex';
    showEditModal();
}

function fillEditTimeInputs(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    document.getElementById('editHours').value = Math.floor(totalSeconds / 3600);
    document.getElementById('editMinutes').value = Math.floor((totalSeconds % 3600) / 60);
    document.getElementById('editSeconds').value = totalSeconds % 60;
}

function readEditTimeInputs() {
    const h = Math.max(0, parseInt(document.getElementById('editHours').value, 10) || 0);
    const m = Math.max(0, parseInt(document.getElementById('editMinutes').value, 10) || 0);
    const s = Math.max(0, parseInt(document.getElementById('editSeconds').value, 10) || 0);
    return h * 3600 + m * 60 + s;
}

function saveEdit() {
    if (!editTarget) return;
    const totalSeconds = readEditTimeInputs();

    if (editTarget.type === 'stopwatch') {
        setStopwatchTime(editTarget.id, totalSeconds);
        showToast('Stopwatch time updated', 'success');
    } else if (editTarget.type === 'log') {
        if (totalSeconds <= 0) {
            showToast('Duration must be greater than zero.', 'warning');
            return;
        }
        const dateVal = document.getElementById('editDate').value;
        const ts = dateVal ? new Date(dateVal).getTime() : NaN;
        if (isNaN(ts)) {
            showToast('Please choose a valid date and time.', 'warning');
            return;
        }
        editLog(editTarget.id, totalSeconds, new Date(ts).toISOString());
        showToast('Session updated', 'success');
    }

    closeEditModal();
}

function showEditModal() {
    const overlay = document.getElementById('editModal');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    lucide.createIcons();
}

function closeEditModal() {
    const overlay = document.getElementById('editModal');
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    editTarget = null;
}

// Date -> value for <input type="datetime-local"> (local time, minute precision)
function toDatetimeLocalValue(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Formatting helpers
function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Global Ticker to update UI dynamically for active stopwatches
function startTicker() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
        // Fire any alarms whose time has arrived, then refresh their countdowns
        checkAlarms();
        updateAlarmCountdowns();

        let activeCounts = 0;
        let totalLiveTodaySec = 0;

        // Render current stopwatch values in the DOM without rebuilding whole cards
        state.activities.forEach(act => {
            let currentSec = act.timeElapsed;
            if (act.isRunning && act.startTime) {
                activeCounts++;
                currentSec = act.accumulatedBeforeRun + Math.floor((Date.now() - act.startTime) / 1000);
            }

            // Update individual card readouts
            const readoutEl = document.getElementById(`readout-${act.id}`);
            if (readoutEl) {
                readoutEl.textContent = formatDuration(currentSec);
            }
        });

        // Sum live total including currently running seconds
        const historicalTotal = state.logs.reduce((acc, log) => acc + log.duration, 0);
        let activeTimersTotal = 0;
        state.activities.forEach(act => {
            if (act.isRunning && act.startTime) {
                activeTimersTotal += Math.floor((Date.now() - act.startTime) / 1000);
            }
        });

        const totalTrackedText = document.getElementById('totalTimeTracked');
        if (totalTrackedText) {
            totalTrackedText.textContent = formatDuration(historicalTotal + activeTimersTotal);
        }

        const runningCountText = document.getElementById('runningCount');
        if (runningCountText) {
            runningCountText.textContent = activeCounts;
        }
    }, 1000);
}

// Render dynamic elements
function renderAll() {
    renderActivities();
    renderLogs();
    renderCharts();
    renderAlarms();
    renderNotepad();
}

function renderActivities() {
    const grid = document.getElementById('activitiesGrid');
    const emptyState = document.getElementById('emptyState');
    const badge = document.getElementById('trackerCountBadge');

    // Filter out cards that are dynamically deleted
    const cardElements = grid.querySelectorAll('.activity-card');
    cardElements.forEach(el => el.remove());

    badge.textContent = `${state.activities.length} ${state.activities.length === 1 ? 'Activity' : 'Activities'}`;

    if (state.activities.length === 0) {
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    state.activities.forEach(act => {
        const card = document.createElement('div');
        card.className = `activity-card glass-panel ${act.isRunning ? 'running' : ''}`;
        card.id = `card-${act.id}`;
        card.style.setProperty('--category-color', CATEGORY_COLORS[act.category] || '#6b7280');
        card.style.setProperty('--category-color-glow', (CATEGORY_COLORS[act.category] || '#6b7280') + '40');

        let currentSec = act.timeElapsed;
        if (act.isRunning && act.startTime) {
            currentSec = act.accumulatedBeforeRun + Math.floor((Date.now() - act.startTime) / 1000);
        }

        card.innerHTML = `
            <div class="activity-card-header">
                <div class="activity-title-group">
                    <span class="category-tag" style="--category-color: ${CATEGORY_COLORS[act.category]}">
                        <span class="legend-color" style="background-color: ${CATEGORY_COLORS[act.category]}; width: 8px; height: 8px;"></span>
                        ${act.category}
                    </span>
                    <h3 class="activity-title" title="${act.name}">${act.name}</h3>
                </div>
                <button class="btn-delete-activity" onclick="deleteActivity('${act.id}')" title="Delete Activity">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
            
            <div class="timer-readout" id="readout-${act.id}">${formatDuration(currentSec)}</div>
            
            <div class="activity-accumulated">
                <span>Total Accumulated:</span>
                <span class="activity-accumulated-value">${formatDuration(act.totalAccumulated)}</span>
            </div>

            <div class="stopwatch-controls">
                <button class="btn-control btn-play-pause" onclick="toggleStopwatch('${act.id}')" title="${act.isRunning ? 'Pause' : 'Start'}">
                    <i data-lucide="${act.isRunning ? 'pause' : 'play'}" style="width: 16px; height: 16px;"></i>
                    <span>${act.isRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button class="btn-control btn-edit-timer" onclick="openEditStopwatch('${act.id}')" title="Customize stopwatch time">
                    <i data-lucide="pencil" style="width: 16px; height: 16px;"></i>
                </button>
                <button class="btn-control btn-reset-timer" onclick="resetStopwatch('${act.id}')" title="Reset Timer">
                    <i data-lucide="rotate-ccw" style="width: 16px; height: 16px;"></i>
                </button>
                <button class="btn-control btn-log-timer" onclick="logStopwatch('${act.id}')" title="Log Session">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    lucide.createIcons();
}

function renderLogs() {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';

    if (state.logs.length === 0) {
        tbody.innerHTML = `
            <tr id="noLogsRow">
                <td colspan="5" class="no-logs">No logged sessions yet. Keep trackers running and log your durations!</td>
            </tr>
        `;
        return;
    }

    state.logs.forEach(log => {
        const row = document.createElement('tr');
        const catColor = CATEGORY_COLORS[log.category] || '#6b7280';
        row.innerHTML = `
            <td style="font-weight: 600;">${escapeHTML(log.activityName)}</td>
            <td>
                <span class="log-category-badge" style="background-color: ${catColor}15; color: ${catColor}; border: 1px solid ${catColor}30;">
                    ${log.category}
                </span>
            </td>
            <td style="font-variant-numeric: tabular-nums; font-weight: 500;">${formatDuration(log.duration)}</td>
            <td style="color: var(--text-muted); font-size: 0.85rem;">${formatDate(log.timestamp)}</td>
            <td>
                <div class="log-actions">
                    <button class="btn-edit-log" onclick="openEditLog('${log.id}')" title="Edit duration & date">
                        <i data-lucide="pencil" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button class="btn-delete-log" onclick="deleteLog('${log.id}')" title="Delete Log">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    lucide.createIcons();
}

function renderCharts() {
    const totalHoursEl = document.getElementById('chartTotalHours');
    const legendEl = document.getElementById('chartLegend');
    const segmentsG = document.getElementById('chartSegments');
    
    // Clear segments
    segmentsG.innerHTML = '';
    legendEl.innerHTML = '';

    // Calculate logs per category
    const categoryTotals = {};
    Object.keys(CATEGORY_COLORS).forEach(cat => {
        categoryTotals[cat] = 0;
    });

    let totalDuration = 0;
    state.logs.forEach(log => {
        if (categoryTotals[log.category] !== undefined) {
            categoryTotals[log.category] += log.duration;
            totalDuration += log.duration;
        }
    });

    // Populate total hours text
    const totalHours = (totalDuration / 3600).toFixed(1);
    totalHoursEl.textContent = `${totalHours}h`;

    if (totalDuration === 0) {
        // Empty state chart segment (gray ring)
        const emptySlice = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        emptySlice.setAttribute('class', 'chart-slice');
        emptySlice.setAttribute('cx', '100');
        emptySlice.setAttribute('cy', '100');
        emptySlice.setAttribute('r', '70');
        emptySlice.setAttribute('stroke', 'var(--border-glass)');
        
        // Full circle calculation for r=70 (Circumference = 2 * PI * 70 = 439.82)
        emptySlice.setAttribute('stroke-dasharray', '439.82');
        emptySlice.setAttribute('stroke-dashoffset', '0');
        segmentsG.appendChild(emptySlice);

        // Simple default legend
        legendEl.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-size: 0.8rem;">No tracking data available</div>';
        return;
    }

    // Sort categories by tracked duration
    const sortedCategories = Object.keys(categoryTotals)
        .map(cat => ({ name: cat, duration: categoryTotals[cat], color: CATEGORY_COLORS[cat] }))
        .filter(cat => cat.duration > 0)
        .sort((a, b) => b.duration - a.duration);

    const circumference = 2 * Math.PI * 70; // 439.82
    let accumulatedAngle = 0;

    sortedCategories.forEach(cat => {
        const percentage = (cat.duration / totalDuration) * 100;
        const segmentLength = (percentage / 100) * circumference;
        const strokeOffset = circumference - segmentLength + accumulatedAngle;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        path.setAttribute('class', 'chart-slice');
        path.setAttribute('cx', '100');
        path.setAttribute('cy', '100');
        path.setAttribute('r', '70');
        path.setAttribute('stroke', cat.color);
        path.setAttribute('stroke-dasharray', `${segmentLength} ${circumference - segmentLength}`);
        path.setAttribute('stroke-dashoffset', strokeOffset);
        
        segmentsG.appendChild(path);
        
        // Add legend item
        const hours = (cat.duration / 3600).toFixed(2);
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${cat.color}"></span>
            <span style="font-weight: 500;">${cat.name}</span>
            <span class="legend-percent">${percentage.toFixed(0)}% (${hours}h)</span>
        `;
        legendEl.appendChild(legendItem);
        
        // Accumulate offset (since chart starts at -90deg, stroke offsets align backwards)
        accumulatedAngle -= segmentLength;
    });
}

// Data Actions utilities
// Save a full JSON backup of activities, logs and theme — re-importable via "Upload JSON".
function exportJSON() {
    if (state.activities.length === 0 && state.logs.length === 0 && state.notes.length === 0) {
        showToast('Nothing to save yet — add an activity first.', 'warning');
        return;
    }

    // Alarms are session-only and intentionally not included in backups.
    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        activities: state.activities,
        logs: state.logs,
        notes: state.notes,
        theme: state.theme
    };

    const json = JSON.stringify(backup, null, 2);
    triggerDownload(json, 'application/json;charset=utf-8;', `chronoflow_backup_${fileTimestamp()}.json`);

    showToast('Backup saved successfully!', 'success');
}

// Local date-time stamp for filenames, e.g. "2026-06-17_14-30-05".
function fileTimestamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `${date}_${time}`;
}

// Shared file-download helper
function triggerDownload(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function handleJSONImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate data shape
            if (Array.isArray(importedData.activities) && Array.isArray(importedData.logs)) {
                state.activities = importedData.activities;
                state.logs = importedData.logs;
                state.notes = Array.isArray(importedData.notes) ? importedData.notes : [];
                currentNoteIndex = 0;
                if (importedData.theme) state.theme = importedData.theme;

                // If a timer was running when the backup was saved, fold the
                // elapsed offline time into its total and restart the clock now.
                state.activities.forEach(act => {
                    if (act.isRunning && act.startTime) {
                        const offlineSeconds = Math.floor((Date.now() - act.startTime) / 1000);
                        act.timeElapsed = (act.accumulatedBeforeRun || 0) + offlineSeconds;
                        act.accumulatedBeforeRun = act.timeElapsed;
                        act.startTime = Date.now();
                    }
                });

                saveState();
                initTheme();
                renderAll();
                showToast('Data uploaded successfully!', 'success');
            } else {
                showToast('Invalid backup file structure.', 'error');
            }
        } catch (err) {
            showToast('Failed to parse JSON file.', 'error');
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function clearAllData() {
    if (confirm('Are you absolutely sure you want to clear ALL activities, stopwatches, alarms, and historical logged data? This action is irreversible.')) {
        state.activities = [];
        state.logs = [];
        state.alarms = [];
        state.notes = [];
        currentNoteIndex = 0;
        ringingQueue = [];
        stopRingtone();
        hideRingingOverlay();
        saveState();
        renderAll();
        showToast('All app data has been reset.', 'warning');
    }
}

function resetLogsOnly() {
    if (confirm('Are you sure you want to clear your session history logs? Active stopwatches will not be affected.')) {
        state.logs = [];
        // Optional: clear accumulated stats on activities too
        state.activities.forEach(act => {
            act.totalAccumulated = 0;
        });
        saveState();
        renderAll();
        showToast('Logged sessions cleared successfully.', 'info');
    }
}

// Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
        <i class="toast-icon" data-lucide="${iconName}"></i>
        <div class="toast-message">${escapeHTML(message)}</div>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    // Remove toast after 4s
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Helper to escape HTML tags for safety
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

/* =======================================================================
   ALARM FEATURE
   - Set an alarm with a ringtone, time and date.
   - When it fires: mute other sounds, pause running stopwatches, ring.
   - Ringtones are synthesized with the Web Audio API so the app needs no
     audio files and works fully offline.
   ======================================================================= */

// --- Ringtone definitions (synthesized) ---
// Each ringtone is a looping sequence of notes. f = frequency in Hz (0 = rest),
// d = duration in seconds. `type` is the oscillator waveform.
const RINGTONES = {
    classic: {
        name: 'Classic Beep',
        type: 'square',
        notes: [ {f: 880, d: 0.15}, {f: 0, d: 0.1}, {f: 880, d: 0.15}, {f: 0, d: 0.55} ]
    },
    chime: {
        name: 'Gentle Chime',
        type: 'sine',
        notes: [ {f: 523.25, d: 0.22}, {f: 659.25, d: 0.22}, {f: 783.99, d: 0.35}, {f: 0, d: 0.7} ]
    },
    digital: {
        name: 'Digital Alarm',
        type: 'square',
        notes: [ {f: 1046.5, d: 0.08}, {f: 0, d: 0.06}, {f: 1046.5, d: 0.08}, {f: 0, d: 0.06}, {f: 1046.5, d: 0.08}, {f: 0, d: 0.45} ]
    },
    pulse: {
        name: 'Deep Pulse',
        type: 'sawtooth',
        notes: [ {f: 196, d: 0.4}, {f: 0, d: 0.22} ]
    },
    arcade: {
        name: 'Arcade Tune',
        type: 'triangle',
        notes: [ {f: 659.25, d: 0.12}, {f: 783.99, d: 0.12}, {f: 1046.5, d: 0.18}, {f: 783.99, d: 0.12}, {f: 1046.5, d: 0.28}, {f: 0, d: 0.45} ]
    }
};

// --- Web Audio engine ---
let audioCtx = null;
let ringtonePlayer = null;   // { stop() } for whatever is currently sounding
let previewTimeout = null;   // auto-stop timer for ringtone previews

function getAudioContext() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
    }
    return audioCtx;
}

// Resume the audio context from a user gesture (browsers block audio otherwise).
function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
    }
}

// Start looping a ringtone. Any sound already playing is stopped first.
function playRingtone(key) {
    if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
    stopRingtone();

    const def = RINGTONES[key] || RINGTONES.classic;
    const ctx = getAudioContext();
    if (!ctx) return; // Web Audio unavailable — alarm still pops the overlay
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    // Gentle fade-in so it doesn't pop
    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.06);

    let stopped = false;
    let loopTimer = null;

    function scheduleCycle() {
        if (stopped) return;
        let t = ctx.currentTime;
        let cycleLength = 0;

        def.notes.forEach(note => {
            if (note.f > 0) {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = def.type;
                osc.frequency.value = note.f;
                // Per-note envelope (quick attack, decay to silence)
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(1, t + 0.012);
                g.gain.exponentialRampToValueAtTime(0.0001, t + note.d);
                osc.connect(g);
                g.connect(master);
                osc.start(t);
                osc.stop(t + note.d + 0.03);
            }
            t += note.d;
            cycleLength += note.d;
        });

        loopTimer = setTimeout(scheduleCycle, Math.max(50, cycleLength * 1000));
    }

    scheduleCycle();

    ringtonePlayer = {
        stop() {
            stopped = true;
            if (loopTimer) clearTimeout(loopTimer);
            try {
                master.gain.cancelScheduledValues(ctx.currentTime);
                master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
                master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
            } catch (e) { /* ignore */ }
            setTimeout(() => { try { master.disconnect(); } catch (e) {} }, 200);
        }
    };
}

function stopRingtone() {
    if (ringtonePlayer) {
        ringtonePlayer.stop();
        ringtonePlayer = null;
    }
}

// When the alarm fires, stop ChronoFlow's OWN sounds so the chosen ringtone plays
// cleanly: pause any media element on this page and (when no alarm is already
// sounding) stop a ringtone preview. The ringtone is started afterwards by
// startRinging()/playRingtone(). When an alarm is ALREADY ringing we must not stop
// it, so the caller passes stopPreview = false.
//
// Note: this only affects ChronoFlow's own audio — a web page cannot mute other
// apps or browser tabs.
function muteOtherSounds(stopPreview) {
    document.querySelectorAll('audio, video').forEach(el => {
        if (!el.paused) {
            try { el.pause(); } catch (e) {}
        }
    });
    if (stopPreview) {
        if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
        stopRingtone();
        setPreviewIcon(false);
    }
}

// --- Make the ringing noticeable ---
// A web page cannot mute other apps or other browser tabs (browser security), so
// we don't try — we just grab attention: flash the browser-tab title and buzz the
// device on mobile. Idempotent — safe to call for each alarm.
let alarmTitleTimer = null;
let savedDocTitle = null;

function startAlarmAttention() {
    if (alarmTitleTimer) return;
    if (savedDocTitle === null) savedDocTitle = document.title;
    let on = true;
    document.title = '⏰ Alarm!'; // change immediately, then flash
    alarmTitleTimer = setInterval(() => {
        on = !on;
        document.title = on ? '⏰ Alarm!' : (savedDocTitle || 'ChronoFlow');
    }, 800);
    if (navigator.vibrate) {
        try { navigator.vibrate([400, 200, 400, 200, 400]); } catch (e) {}
    }
}

function stopAlarmAttention() {
    if (alarmTitleTimer) {
        clearInterval(alarmTitleTimer);
        alarmTitleTimer = null;
    }
    if (savedDocTitle !== null) {
        document.title = savedDocTitle;
        savedDocTitle = null;
    }
    if (navigator.vibrate) {
        try { navigator.vibrate(0); } catch (e) {}
    }
}

// --- Ringtone preview ---
function previewRingtone() {
    // If a preview is already playing, treat the click as "stop".
    if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
        stopRingtone();
        setPreviewIcon(false);
        return;
    }
    if (ringingQueue.length > 0) return; // don't fight a live alarm

    const key = document.getElementById('alarmRingtone').value;
    unlockAudio();
    playRingtone(key);
    setPreviewIcon(true);
    previewTimeout = setTimeout(() => {
        stopRingtone();
        previewTimeout = null;
        setPreviewIcon(false);
    }, 3500);
}

function setPreviewIcon(playing) {
    const btn = document.getElementById('btnPreviewRingtone');
    if (!btn) return;
    btn.innerHTML = `<i data-lucide="${playing ? 'square' : 'play'}"></i>`;
    btn.title = playing ? 'Stop preview' : 'Preview ringtone';
    lucide.createIcons();
}

function populateRingtoneOptions() {
    const sel = document.getElementById('alarmRingtone');
    if (!sel) return;
    sel.innerHTML = '';
    Object.keys(RINGTONES).forEach((key, i) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = RINGTONES[key].name;
        if (i === 0) opt.selected = true;
        sel.appendChild(opt);
    });
}

// --- Alarm panel toggle ---
// The customization UI is hidden on load; the header "Alarm" button reveals it
// next to "Create New Activity". No alarms are shown until the user opens it.
function toggleAlarmPanel() {
    const card = document.getElementById('alarmCard');
    const btn = document.getElementById('btnToggleAlarm');
    if (!card) return;

    const willShow = card.classList.contains('alarm-hidden');
    card.classList.toggle('alarm-hidden', !willShow);
    if (btn) btn.classList.toggle('active', willShow);

    if (willShow) {
        setDefaultAlarmDateTime();   // refresh the default date/time on open
        unlockAudio();               // this click is a user gesture — prime audio
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const label = document.getElementById('alarmLabel');
        if (label) setTimeout(() => { try { label.focus(); } catch (e) {} }, 250);
    }
}

// --- Alarm CRUD ---
function setDefaultAlarmDateTime() {
    const dateEl = document.getElementById('alarmDate');
    const timeEl = document.getElementById('alarmTime');
    if (!dateEl || !timeEl) return;

    const pad = (n) => String(n).padStart(2, '0');
    const next = new Date(Date.now() + 5 * 60 * 1000); // default 5 minutes from now
    dateEl.value = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
    timeEl.value = `${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

function addAlarm(label, dateVal, timeVal, ringtone) {
    if (!dateVal || !timeVal) {
        showToast('Please choose both a date and a time for the alarm.', 'warning');
        return false;
    }

    const time = new Date(`${dateVal}T${timeVal}`).getTime();
    if (isNaN(time)) {
        showToast('That date and time are not valid.', 'error');
        return false;
    }
    if (time <= Date.now()) {
        showToast('Please pick a time in the future.', 'warning');
        return false;
    }

    const alarm = {
        id: 'alarm_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        label: label || '',
        ringtone: RINGTONES[ringtone] ? ringtone : 'classic',
        time: time,
        enabled: true,
        triggered: false,
        missed: false
    };

    state.alarms.push(alarm);
    state.alarms.sort((a, b) => a.time - b.time);
    saveState();
    renderAlarms();
    unlockAudio(); // this submit is a user gesture — prime audio for when it fires

    const when = `${formatClockTime(time)} · ${formatAlarmDate(time)}`;
    showToast(`Alarm set for ${when}`, 'success');
    return true;
}

function deleteAlarm(id) {
    const idx = state.alarms.findIndex(a => a.id === id);
    if (idx === -1) return;

    state.alarms.splice(idx, 1);

    // If this alarm is currently ringing or queued, remove it from the queue too.
    const qIdx = ringingQueue.findIndex(e => e.id === id);
    if (qIdx === 0) {
        dismissCurrentAlarm();
    } else if (qIdx > 0) {
        ringingQueue.splice(qIdx, 1);
        renderRingingOverlay();
    }

    saveState();
    renderAlarms();
    showToast('Alarm removed', 'warning');
}

function toggleAlarmEnabled(id) {
    const al = state.alarms.find(a => a.id === id);
    if (!al) return;

    if (!al.enabled) {
        // Re-enabling: only valid if the alarm time is still in the future,
        // otherwise it would fire instantly.
        if (al.time <= Date.now()) {
            showToast('That alarm time has already passed — set a new alarm instead.', 'warning');
            return;
        }
        al.enabled = true;
        al.triggered = false;
        al.missed = false;
    } else {
        al.enabled = false;
    }

    saveState();
    renderAlarms();
}

// --- Alarm firing ---
function checkAlarms() {
    const now = Date.now();
    state.alarms.forEach(al => {
        if (al.enabled && !al.triggered && al.time <= now) {
            triggerAlarm(al);
        }
    });
}

function triggerAlarm(al) {
    al.triggered = true;
    al.enabled = false;

    // Requirement: pause running stopwatches, mute other sounds, then ring.
    const pausedCount = pauseAllRunningStopwatches();
    // If another alarm is already sounding, leave it playing and just queue this
    // one — its ringtone plays once the current alarm is dismissed or snoozed.
    const alreadyRinging = ringingQueue.length > 0;
    muteOtherSounds(!alreadyRinging);

    saveState();
    renderActivities();
    renderAlarms();

    enqueueRinging(al.id, pausedCount);
}

// Pause every running stopwatch (mirrors the pause branch of toggleStopwatch).
// Returns how many were actually paused.
function pauseAllRunningStopwatches() {
    let paused = 0;
    state.activities.forEach(act => {
        if (act.isRunning && act.startTime) {
            act.isRunning = false;
            act.timeElapsed = act.accumulatedBeforeRun + Math.floor((Date.now() - act.startTime) / 1000);
            act.accumulatedBeforeRun = act.timeElapsed;
            act.startTime = null;
            paused++;
        }
    });
    return paused;
}

// --- Ringing overlay (supports a queue if several fire at once) ---
let ringingQueue = []; // array of { id, pausedCount }

function enqueueRinging(id, pausedCount) {
    ringingQueue.push({ id: id, pausedCount: pausedCount || 0 });
    if (ringingQueue.length === 1) {
        startRinging();
    } else {
        renderRingingOverlay(); // update the "N more waiting" line
    }
}

function startRinging() {
    if (ringingQueue.length === 0) {
        hideRingingOverlay();
        return;
    }
    const entry = ringingQueue[0];
    const al = state.alarms.find(a => a.id === entry.id);
    if (!al) {
        ringingQueue.shift();
        startRinging();
        return;
    }
    playRingtone(al.ringtone);
    showRingingOverlay();
    startAlarmAttention();
}

function showRingingOverlay() {
    const overlay = document.getElementById('alarmRingOverlay');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    renderRingingOverlay();
}

function renderRingingOverlay() {
    if (ringingQueue.length === 0) return;
    const entry = ringingQueue[0];
    const al = state.alarms.find(a => a.id === entry.id);
    if (!al) return;

    const labelText = (al.label && al.label.trim()) ? al.label : 'Alarm';
    document.getElementById('ringLabel').textContent = labelText;
    document.getElementById('ringTime').textContent = `${formatClockTime(al.time)} · ${formatAlarmDate(al.time)}`;

    const extras = [];
    if (entry.pausedCount > 0) {
        extras.push(`Paused ${entry.pausedCount} running stopwatch${entry.pausedCount > 1 ? 'es' : ''}`);
    }
    const waiting = ringingQueue.length - 1;
    if (waiting > 0) {
        extras.push(`${waiting} more alarm${waiting > 1 ? 's' : ''} waiting`);
    }
    document.getElementById('ringExtra').textContent = extras.join(' · ');

    lucide.createIcons();
}

function hideRingingOverlay() {
    const overlay = document.getElementById('alarmRingOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    stopAlarmAttention();
}

function dismissCurrentAlarm() {
    stopRingtone();
    ringingQueue.shift();
    if (ringingQueue.length > 0) {
        startRinging();
    } else {
        hideRingingOverlay();
    }
}

function snoozeCurrentAlarm() {
    if (ringingQueue.length === 0) return;
    const entry = ringingQueue[0];
    const al = state.alarms.find(a => a.id === entry.id);
    if (al) {
        al.time = Date.now() + 5 * 60 * 1000;
        al.triggered = false;
        al.enabled = true;
        al.missed = false;
        saveState();
        renderAlarms();
        const labelText = (al.label && al.label.trim()) ? al.label : 'Alarm';
        showToast(`Snoozed "${labelText}" for 5 minutes`, 'info');
    }
    dismissCurrentAlarm();
}

// --- Alarm rendering ---
function renderAlarms() {
    const list = document.getElementById('alarmList');
    if (!list) return;
    list.innerHTML = '';

    if (state.alarms.length === 0) {
        list.innerHTML = `<div class="alarm-empty">No alarms set. Pick a time, date, and ringtone above.</div>`;
        return;
    }

    const sorted = [...state.alarms].sort((a, b) => a.time - b.time);
    sorted.forEach(al => {
        const rt = RINGTONES[al.ringtone] || RINGTONES.classic;
        const labelText = (al.label && al.label.trim()) ? al.label : 'Alarm';

        const item = document.createElement('div');
        item.className = `alarm-item ${al.enabled ? '' : 'disabled'}`;
        item.innerHTML = `
            <div class="alarm-item-time-block">
                <span class="alarm-item-time">${formatClockTime(al.time)}</span>
                <span class="alarm-item-date">${formatAlarmDate(al.time)}</span>
            </div>
            <div class="alarm-item-main">
                <span class="alarm-item-label" title="${escapeHTML(labelText)}">${escapeHTML(labelText)}</span>
                <span class="alarm-item-ringtone">
                    <i data-lucide="music-2" style="width: 12px; height: 12px;"></i>
                    ${rt.name}
                </span>
            </div>
            <div class="alarm-item-right">
                <span class="alarm-countdown" id="alarm-countdown-${al.id}">${alarmStatusText(al)}</span>
                <div class="alarm-item-actions">
                    <button class="alarm-toggle-btn" onclick="toggleAlarmEnabled('${al.id}')" title="${al.enabled ? 'Disable alarm' : 'Enable alarm'}">
                        <i data-lucide="${al.enabled ? 'bell' : 'bell-off'}" style="width: 16px; height: 16px;"></i>
                    </button>
                    <button class="alarm-delete-btn" onclick="deleteAlarm('${al.id}')" title="Delete alarm">
                        <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                    </button>
                </div>
            </div>
        `;
        list.appendChild(item);
    });

    lucide.createIcons();
}

// Lightweight per-second update of just the countdown text (no DOM rebuild).
function updateAlarmCountdowns() {
    state.alarms.forEach(al => {
        const el = document.getElementById(`alarm-countdown-${al.id}`);
        if (el) el.textContent = alarmStatusText(al);
    });
}

function alarmStatusText(al) {
    if (al.missed) return 'Missed';
    if (al.triggered) return 'Done';
    if (!al.enabled) return 'Off';
    const diff = al.time - Date.now();
    if (diff <= 0) return 'Ringing…';
    return 'in ' + formatCountdown(diff);
}

// --- Alarm formatting helpers ---
function formatClockTime(ts) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatAlarmDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatCountdown(ms) {
    let s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600); s -= h * 3600;
    const m = Math.floor(s / 60); s -= m * 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// =======================================================================
// NOTEPAD
// - Toggled from the header "Notepad" button (hidden by default), shown
//   below the Analytics Dashboard.
// - Shows one note at a time. With more than one note, Prev/Next appear at
//   the top to move between notes. Notes persist with your saved data.
// =======================================================================

function toggleNotepadPanel() {
    const card = document.getElementById('notepadCard');
    const btn = document.getElementById('btnToggleNotepad');
    if (!card) return;

    const willShow = card.classList.contains('notepad-hidden');
    card.classList.toggle('notepad-hidden', !willShow);
    if (btn) btn.classList.toggle('active', willShow);

    if (willShow) {
        renderNotepad();
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { try { document.getElementById('noteContent').focus(); } catch (e) {} }, 250);
    }
}

// Render the current note + Prev/Next navigation. Avoids clobbering a field the
// user is actively typing in.
function renderNotepad() {
    const card = document.getElementById('notepadCard');
    if (!card) return;

    if (state.notes.length === 0) currentNoteIndex = 0;
    else currentNoteIndex = Math.min(Math.max(0, currentNoteIndex), state.notes.length - 1);

    const note = state.notes[currentNoteIndex] || null;
    // Safe to always set values: renderNotepad() is never called mid-keystroke
    // (typing updates note data via onNoteInput without re-rendering).
    document.getElementById('noteTitle').value = note ? (note.title || '') : '';
    document.getElementById('noteContent').value = note ? (note.content || '') : '';

    // Prev/Next show only when there's more than one note
    const nav = document.getElementById('notepadNav');
    nav.style.display = state.notes.length > 1 ? 'flex' : 'none';
    if (state.notes.length > 1) {
        document.getElementById('notePosition').textContent = `Note ${currentNoteIndex + 1} of ${state.notes.length}`;
        document.getElementById('notePrev').disabled = currentNoteIndex === 0;
        document.getElementById('noteNext').disabled = currentNoteIndex === state.notes.length - 1;
    }

    document.getElementById('noteDelete').disabled = state.notes.length === 0;
    updateNoteSavedLabel();
    lucide.createIcons();
}

function showNotePrev() {
    if (currentNoteIndex > 0) {
        currentNoteIndex--;
        renderNotepad();
    }
}

function showNoteNext() {
    if (currentNoteIndex < state.notes.length - 1) {
        currentNoteIndex++;
        renderNotepad();
    }
}

// Auto-save the current note as the user types. Creates the first note on the
// first keystroke if the notepad is empty.
function onNoteInput() {
    if (state.notes.length === 0) {
        state.notes.push(createBlankNote());
        currentNoteIndex = 0;
        document.getElementById('noteDelete').disabled = false;
    }
    const note = state.notes[currentNoteIndex];
    note.title = document.getElementById('noteTitle').value;
    note.content = document.getElementById('noteContent').value;
    note.updatedAt = Date.now();
    saveState();
    updateNoteSavedLabel();
}

function addNote() {
    state.notes.push(createBlankNote());
    currentNoteIndex = state.notes.length - 1;
    saveState();
    renderNotepad();
    try { document.getElementById('noteTitle').focus(); } catch (e) {}
    showToast('New note added', 'success');
}

function deleteCurrentNote() {
    if (state.notes.length === 0) return;
    state.notes.splice(currentNoteIndex, 1);
    if (currentNoteIndex >= state.notes.length) {
        currentNoteIndex = Math.max(0, state.notes.length - 1);
    }
    saveState();
    renderNotepad();
    showToast('Note deleted', 'warning');
}

function createBlankNote() {
    return {
        id: 'note_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: '',
        content: '',
        updatedAt: Date.now()
    };
}

function updateNoteSavedLabel() {
    const el = document.getElementById('noteSaved');
    if (!el) return;
    el.textContent = state.notes.length === 0 ? '' : 'Saved';
}
