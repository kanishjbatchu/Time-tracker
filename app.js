// ChronoFlow Time Tracker & Analytics Engine

// State Management
let state = {
    activities: [],
    logs: [],
    theme: 'dark'
};

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

    // CSV Export (logs only, spreadsheet-friendly)
    const btnExport = document.getElementById('btnExport');
    btnExport.addEventListener('click', exportCSV);

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
}

// Load / Save State functions
function loadState() {
    const savedState = localStorage.getItem('chronoflow_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
            // Ensure necessary arrays exist
            if (!state.activities) state.activities = [];
            if (!state.logs) state.logs = [];
            if (!state.theme) state.theme = 'dark';
            
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
    localStorage.setItem('chronoflow_state', JSON.stringify(state));
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
                <button class="btn-delete-log" onclick="deleteLog('${log.id}')" title="Delete Log">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
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
function exportCSV() {
    if (state.logs.length === 0) {
        showToast('No logs available to export.', 'warning');
        return;
    }

    const headers = ['Activity Name', 'Category', 'Duration (Seconds)', 'Duration (Formatted)', 'Date Completed'];
    const rows = state.logs.map(log => [
        `"${log.activityName.replace(/"/g, '""')}"`,
        log.category,
        log.duration,
        formatDuration(log.duration),
        new Date(log.timestamp).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    triggerDownload(csvContent, 'text/csv;charset=utf-8;', `chronoflow_logs_${dateStamp()}.csv`);

    showToast('CSV exported successfully!', 'success');
}

// Save a full JSON backup of activities, logs and theme — re-importable via "Upload JSON".
function exportJSON() {
    if (state.activities.length === 0 && state.logs.length === 0) {
        showToast('Nothing to save yet — add an activity first.', 'warning');
        return;
    }

    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        activities: state.activities,
        logs: state.logs,
        theme: state.theme
    };

    const json = JSON.stringify(backup, null, 2);
    triggerDownload(json, 'application/json;charset=utf-8;', buildBackupFilename());

    showToast('Backup saved successfully!', 'success');
}

// Build a backup filename from the activity names, e.g. "ui-redesign_exercise_2026-06-16.json".
function buildBackupFilename() {
    const slugs = state.activities
        .map(act => slugify(act.name))
        .filter(Boolean);

    let namePart;
    if (slugs.length === 0) {
        namePart = 'chronoflow-backup';
    } else if (slugs.length <= 3) {
        namePart = slugs.join('_');
    } else {
        namePart = `${slugs.slice(0, 3).join('_')}_and-${slugs.length - 3}-more`;
    }

    return `${namePart}_${dateStamp()}.json`;
}

// Convert an activity name into a safe, lowercase filename fragment.
function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics become hyphens
        .replace(/^-+|-+$/g, '')     // trim leading/trailing hyphens
        .slice(0, 40);               // keep each fragment reasonably short
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

// YYYY-MM-DD stamp for filenames
function dateStamp() {
    return new Date().toISOString().split('T')[0];
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
    if (confirm('Are you absolutely sure you want to clear ALL activities, stopwatches, and historical logged data? This action is irreversible.')) {
        state.activities = [];
        state.logs = [];
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
