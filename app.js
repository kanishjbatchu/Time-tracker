// ChronoFlow Time Tracker & Analytics Engine

// State Management
let state = {
    activities: [],
    logs: [],
    alarms: [],
    theme: 'dark', // 'dark' | 'light' | 'auto' (auto follows the background's brightness — see computeEffectiveTheme)
    accentColor: 'violet',
    specialTheme: 'default',
    customBackgroundImage: null, // data URL of a user-uploaded PNG/JPG, resized/compressed on upload
    customBackgroundIsDark: null, // sampled average brightness of the uploaded photo, for 'auto' theme mode
    headerButtonOrder: [],  // [id, ...] — saved swap order of header buttons from Edit Mode
    dashboardCardOrder: [], // [{id, pane}] — saved swap order of dashboard cards from Edit Mode
    riddle: null          // { date: 'YYYY-MM-DD', solved: boolean } — today's Riddle of the Day progress
};

// Accent color presets — each overrides --primary / --primary-glow / --primary-gradient
// via inline styles on <body>, so a chosen accent looks the same in dark or light theme.
// Only meaningful while specialTheme === 'default'; a named Theme Type below replaces
// the whole palette instead.
const ACCENTS = {
    violet:  { name: 'Violet',  primary: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.25)', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)' },
    cyan:    { name: 'Cyan',    primary: '#06b6d4', glow: 'rgba(6, 182, 212, 0.25)',  gradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' },
    emerald: { name: 'Emerald', primary: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
    rose:    { name: 'Rose',    primary: '#f43f5e', glow: 'rgba(244, 63, 94, 0.25)',  gradient: 'linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)' },
    amber:   { name: 'Amber',   primary: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
    blue:    { name: 'Blue',    primary: '#3b82f6', glow: 'rgba(59, 130, 246, 0.25)', gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }
};

// Named "Background Type" presets — each is a full festive palette (primary +
// secondary + background glow tint) applied on top of whichever base Dark/Light
// mode is active, plus a `painting`: a layered CSS gradient "scene" rendered
// full-viewport behind the app (see applyThemeBackground). Picking one overrides
// the plain Accent Color choice; picking 'default' restores it.
const THEME_TYPES = {
    default: { name: 'Default', painting: 'none' },
    birthday: {
        name: 'Birthday',
        primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.28)', gradient: 'linear-gradient(135deg, #ec4899 0%, #facc15 100%)',
        secondary: '#8b5cf6', secondaryGlow: 'rgba(139, 92, 246, 0.28)', secondaryGradient: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
        bgGlow1: 'rgba(236, 72, 153, 0.18)', bgGlow2: 'rgba(250, 204, 21, 0.15)', bgGlow3: 'rgba(139, 92, 246, 0.12)',
        painting: 'radial-gradient(circle at 20% 20%, rgba(250, 204, 21, 0.30) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.30) 0%, transparent 45%), linear-gradient(160deg, #2a1130 0%, #1a0f2e 55%, #0f0a1f 100%)'
    },
    halloween: {
        name: 'Halloween',
        primary: '#f97316', glow: 'rgba(249, 115, 22, 0.28)', gradient: 'linear-gradient(135deg, #f97316 0%, #7c3aed 100%)',
        secondary: '#7c3aed', secondaryGlow: 'rgba(124, 58, 237, 0.28)', secondaryGradient: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
        bgGlow1: 'rgba(249, 115, 22, 0.16)', bgGlow2: 'rgba(124, 58, 237, 0.16)', bgGlow3: 'rgba(16, 185, 129, 0.06)',
        painting: 'radial-gradient(circle at 85% 12%, rgba(255, 237, 160, 0.35) 0%, transparent 20%), radial-gradient(circle at 15% 85%, rgba(249, 115, 22, 0.22) 0%, transparent 45%), linear-gradient(180deg, #150a24 0%, #1c1030 50%, #0a0612 100%)'
    },
    winter: {
        name: 'Winter',
        primary: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.28)', gradient: 'linear-gradient(135deg, #0ea5e9 0%, #a5f3fc 100%)',
        secondary: '#6366f1', secondaryGlow: 'rgba(99, 102, 241, 0.28)', secondaryGradient: 'linear-gradient(135deg, #6366f1 0%, #38bdf8 100%)',
        bgGlow1: 'rgba(14, 165, 233, 0.16)', bgGlow2: 'rgba(99, 102, 241, 0.14)', bgGlow3: 'rgba(165, 243, 252, 0.1)',
        painting: 'radial-gradient(circle at 80% 15%, rgba(255, 255, 255, 0.3) 0%, transparent 30%), linear-gradient(180deg, #0c1a2e 0%, #16324f 45%, #0b1220 100%)'
    },
    school: {
        name: 'School',
        primary: '#2563eb', glow: 'rgba(37, 99, 235, 0.28)', gradient: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
        secondary: '#dc2626', secondaryGlow: 'rgba(220, 38, 38, 0.28)', secondaryGradient: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
        bgGlow1: 'rgba(37, 99, 235, 0.16)', bgGlow2: 'rgba(220, 38, 38, 0.12)', bgGlow3: 'rgba(245, 158, 11, 0.08)',
        painting: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.2) 0%, transparent 40%), radial-gradient(circle at 85% 85%, rgba(220, 38, 38, 0.15) 0%, transparent 35%), linear-gradient(180deg, #0b1e3d 0%, #142a52 50%, #0a1730 100%)'
    },
    summer: {
        name: 'Summer',
        primary: '#fb923c', glow: 'rgba(251, 146, 60, 0.28)', gradient: 'linear-gradient(135deg, #fb923c 0%, #facc15 100%)',
        secondary: '#14b8a6', secondaryGlow: 'rgba(20, 184, 166, 0.28)', secondaryGradient: 'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
        bgGlow1: 'rgba(251, 146, 60, 0.16)', bgGlow2: 'rgba(20, 184, 166, 0.16)', bgGlow3: 'rgba(250, 204, 21, 0.1)',
        painting: 'radial-gradient(circle at 50% 18%, rgba(250, 204, 21, 0.4) 0%, transparent 28%), linear-gradient(180deg, #ff9f68 0%, #fb7a5c 25%, #14375a 70%, #0a1f33 100%)'
    },
    space: {
        name: 'Space',
        primary: '#6366f1', glow: 'rgba(99, 102, 241, 0.28)', gradient: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
        secondary: '#22d3ee', secondaryGlow: 'rgba(34, 211, 238, 0.28)', secondaryGradient: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)',
        bgGlow1: 'rgba(99, 102, 241, 0.18)', bgGlow2: 'rgba(34, 211, 238, 0.12)', bgGlow3: 'rgba(236, 72, 153, 0.1)',
        painting: 'radial-gradient(circle at 70% 20%, rgba(236, 72, 153, 0.28) 0%, transparent 35%), radial-gradient(circle at 25% 70%, rgba(34, 211, 238, 0.22) 0%, transparent 40%), linear-gradient(180deg, #0a0a1f 0%, #150a2e 50%, #05040d 100%)'
    },
    // --- Season-based ---
    spring: {
        name: 'Spring',
        primary: '#22c55e', glow: 'rgba(34, 197, 94, 0.28)', gradient: 'linear-gradient(135deg, #22c55e 0%, #facc15 100%)',
        secondary: '#f472b6', secondaryGlow: 'rgba(244, 114, 182, 0.28)', secondaryGradient: 'linear-gradient(135deg, #f472b6 0%, #fb7185 100%)',
        bgGlow1: 'rgba(34, 197, 94, 0.16)', bgGlow2: 'rgba(244, 114, 182, 0.14)', bgGlow3: 'rgba(250, 204, 21, 0.08)',
        painting: 'radial-gradient(circle at 50% 10%, rgba(250, 204, 21, 0.3) 0%, transparent 30%), linear-gradient(180deg, #143d24 0%, #1e5c33 45%, #0d2417 100%)'
    },
    autumn: {
        name: 'Autumn',
        primary: '#d97706', glow: 'rgba(217, 119, 6, 0.28)', gradient: 'linear-gradient(135deg, #d97706 0%, #b91c1c 100%)',
        secondary: '#92400e', secondaryGlow: 'rgba(146, 64, 14, 0.28)', secondaryGradient: 'linear-gradient(135deg, #92400e 0%, #78350f 100%)',
        bgGlow1: 'rgba(217, 119, 6, 0.16)', bgGlow2: 'rgba(146, 64, 14, 0.14)', bgGlow3: 'rgba(185, 28, 28, 0.08)',
        painting: 'radial-gradient(circle at 30% 15%, rgba(251, 191, 36, 0.32) 0%, transparent 35%), linear-gradient(180deg, #4a2c0f 0%, #7a3b12 35%, #2c1608 100%)'
    },
    // --- Subject-based ---
    math: {
        name: 'Math',
        primary: '#4f46e5', glow: 'rgba(79, 70, 229, 0.28)', gradient: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
        secondary: '#f59e0b', secondaryGlow: 'rgba(245, 158, 11, 0.28)', secondaryGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        bgGlow1: 'rgba(79, 70, 229, 0.16)', bgGlow2: 'rgba(245, 158, 11, 0.12)', bgGlow3: 'rgba(6, 182, 212, 0.08)',
        painting: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.15) 0%, transparent 60%), linear-gradient(160deg, #0d3b2e 0%, #0a2b21 100%)'
    },
    science: {
        name: 'Science',
        primary: '#0d9488', glow: 'rgba(13, 148, 136, 0.28)', gradient: 'linear-gradient(135deg, #0d9488 0%, #22d3ee 100%)',
        secondary: '#a855f7', secondaryGlow: 'rgba(168, 85, 247, 0.28)', secondaryGradient: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
        bgGlow1: 'rgba(13, 148, 136, 0.16)', bgGlow2: 'rgba(168, 85, 247, 0.14)', bgGlow3: 'rgba(34, 211, 238, 0.08)',
        painting: 'radial-gradient(circle at 75% 20%, rgba(168, 85, 247, 0.28) 0%, transparent 35%), radial-gradient(circle at 25% 80%, rgba(13, 148, 136, 0.24) 0%, transparent 40%), linear-gradient(180deg, #05201d 0%, #0a1a2e 100%)'
    },
    art: {
        name: 'Art',
        primary: '#d946ef', glow: 'rgba(217, 70, 239, 0.28)', gradient: 'linear-gradient(135deg, #d946ef 0%, #f59e0b 100%)',
        secondary: '#06b6d4', secondaryGlow: 'rgba(6, 182, 212, 0.28)', secondaryGradient: 'linear-gradient(135deg, #06b6d4 0%, #22c55e 100%)',
        bgGlow1: 'rgba(217, 70, 239, 0.16)', bgGlow2: 'rgba(6, 182, 212, 0.14)', bgGlow3: 'rgba(245, 158, 11, 0.1)',
        painting: 'radial-gradient(circle at 20% 30%, rgba(217, 70, 239, 0.32) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(245, 158, 11, 0.28) 0%, transparent 40%), radial-gradient(circle at 50% 90%, rgba(6, 182, 212, 0.22) 0%, transparent 45%), linear-gradient(160deg, #1a0a24 0%, #0d0a1f 100%)'
    },
    music: {
        name: 'Music',
        primary: '#a855f7', glow: 'rgba(168, 85, 247, 0.28)', gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
        secondary: '#f59e0b', secondaryGlow: 'rgba(245, 158, 11, 0.28)', secondaryGradient: 'linear-gradient(135deg, #f59e0b 0%, #a855f7 100%)',
        bgGlow1: 'rgba(168, 85, 247, 0.18)', bgGlow2: 'rgba(236, 72, 153, 0.14)', bgGlow3: 'rgba(245, 158, 11, 0.08)',
        painting: 'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.32) 0%, transparent 35%), radial-gradient(circle at 70% 30%, rgba(245, 158, 11, 0.22) 0%, transparent 35%), linear-gradient(180deg, #1a0a24 0%, #0d0a1a 100%)'
    }
};

// --- Timer (countdown) state — session-only, not persisted ---
let timer = {
    configuredSeconds: 300, // last-set duration in seconds
    remainingSeconds: 300,  // remaining while paused
    endTime: null,          // wall-clock ms when it hits 0 (while running)
    isRunning: false,       // actively counting down
    active: false,          // a countdown session exists (running or paused)
    label: '',
    ringtone: 'classic'
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
    initThemeType();
    applyDashboardCardOrder();
    applyHeaderButtonOrder();
    initHeaderButtonDragging();
    initDashboardCardDragging();
    initRiddle();
    populateRingtoneOptions();
    setDefaultAlarmDateTime();
    prepareRingtones(); // render ringtone WAVs up front so alarms can ring instantly
    startTicker();
    startAlarmWorker(); // keep alarms firing while the tab is in the background
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

    // Edit Mode: swap dashboard/tracker cards, drag header buttons freely
    const btnToggleEditMode = document.getElementById('btnToggleEditMode');
    if (btnToggleEditMode) btnToggleEditMode.addEventListener('click', toggleEditMode);
    blockClicksDuringEditMode(document.querySelector('.dashboard-grid'));
    blockClicksDuringEditMode(document.querySelector('.header-actions'), '#btnToggleEditMode');

    // Riddle of the Day: answer form + collapse toggle
    const riddleForm = document.getElementById('riddleForm');
    if (riddleForm) riddleForm.addEventListener('submit', submitRiddleAnswer);
    const riddleHeader = document.getElementById('riddleHeader');
    if (riddleHeader) riddleHeader.addEventListener('click', toggleRiddleCollapsed);

    // Settings: header button opens the settings modal; the X button and
    // clicking the dimmed backdrop both close it.
    const btnToggleSettings = document.getElementById('btnToggleSettings');
    if (btnToggleSettings) btnToggleSettings.addEventListener('click', toggleSettingsPanel);

    const settingsClose = document.getElementById('settingsClose');
    if (settingsClose) settingsClose.addEventListener('click', closeSettingsPanel);

    const settingsOverlay = document.getElementById('settingsOverlay');
    if (settingsOverlay) {
        settingsOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'settingsOverlay') closeSettingsPanel(); // click backdrop to close
        });
    }

    // Settings: upload / remove a custom background photo
    const btnUploadBackground = document.getElementById('btnUploadBackground');
    const backgroundUploadInput = document.getElementById('backgroundUploadInput');
    if (btnUploadBackground && backgroundUploadInput) {
        btnUploadBackground.addEventListener('click', () => backgroundUploadInput.click());
        backgroundUploadInput.addEventListener('change', handleBackgroundUpload);
    }
    const btnRemoveBackground = document.getElementById('btnRemoveBackground');
    if (btnRemoveBackground) btnRemoveBackground.addEventListener('click', removeCustomBackground);

    // Alarm: header button toggles the alarm customization panel
    const btnToggleAlarm = document.getElementById('btnToggleAlarm');
    if (btnToggleAlarm) btnToggleAlarm.addEventListener('click', toggleAlarmPanel);

    // Timer: header button toggles the timer panel
    const btnToggleTimer = document.getElementById('btnToggleTimer');
    if (btnToggleTimer) btnToggleTimer.addEventListener('click', toggleTimerPanel);

    // Timer: setup + running controls
    document.getElementById('btnTimerStart').addEventListener('click', startTimer);
    document.getElementById('btnTimerPauseResume').addEventListener('click', toggleTimerPause);
    document.getElementById('btnTimerReset').addEventListener('click', () => { resetTimer(); showToast('Timer reset', 'info'); });
    document.getElementById('btnTimerStop').addEventListener('click', dismissTimer);
    document.getElementById('btnTimerPreview').addEventListener('click', () => previewRingtone('timerRingtone', 'btnTimerPreview'));
    document.querySelectorAll('.timer-preset').forEach((btn) => {
        btn.addEventListener('click', () => applyTimerPreset(parseInt(btn.dataset.seconds, 10) || 0));
    });

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
    document.getElementById('btnPreviewRingtone').addEventListener('click', () => previewRingtone('alarmRingtone', 'btnPreviewRingtone'));

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
        if (e.key !== 'Escape') return;
        const modal = document.getElementById('editModal');
        if (modal.classList.contains('active')) closeEditModal();
        const settingsOverlay = document.getElementById('settingsOverlay');
        if (settingsOverlay && settingsOverlay.classList.contains('active')) closeSettingsPanel();
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
            if (state.theme !== 'dark' && state.theme !== 'light' && state.theme !== 'auto') state.theme = 'dark';
            if (!state.accentColor || !ACCENTS[state.accentColor]) state.accentColor = 'violet';
            if (!state.customBackgroundImage) state.customBackgroundImage = null;
            const specialThemeValid = state.specialTheme === 'custom'
                ? !!state.customBackgroundImage
                : !!THEME_TYPES[state.specialTheme];
            if (!specialThemeValid) state.specialTheme = 'default';
            if (!Array.isArray(state.headerButtonOrder)) state.headerButtonOrder = [];
            if (!Array.isArray(state.dashboardCardOrder)) state.dashboardCardOrder = [];
            delete state.notes; // drop any leftover data from the removed notepad
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

// Theme handling — state.theme is the user's PREFERENCE ('dark' | 'light' |
// 'auto'); computeEffectiveTheme() resolves that to the actual 'dark' | 'light'
// applied to <body>, following the current background's brightness when 'auto'.

// Perceived luminance (0-255) of a #rrggbb hex color.
function hexLuminance(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Estimate whether a built-in painting (a CSS gradient string) reads as dark,
// by averaging the luminance of its solid hex color stops. Cheap and needs no
// canvas — the paintings are all night-scene style gradients, so this is a
// reliable enough proxy for "dark vs. bright" without hardcoding a flag per
// theme that could drift out of sync if a painting's colors ever change.
function computePaintingIsDark(painting) {
    if (!painting || painting === 'none') return true; // no painting — fall back to dark
    const hexes = painting.match(/#[0-9a-fA-F]{6}/g);
    if (!hexes || hexes.length === 0) return true;
    const avg = hexes.reduce((sum, h) => sum + hexLuminance(h), 0) / hexes.length;
    return avg < 140;
}

// Is the currently active background (a painting, or the uploaded photo) dark?
function getBackgroundIsDark() {
    if (state.specialTheme === 'custom' && state.customBackgroundImage) {
        return state.customBackgroundIsDark !== false; // default to dark if unsampled
    }
    const t = THEME_TYPES[state.specialTheme];
    return computePaintingIsDark(t ? t.painting : 'none');
}

// Resolve the user's theme preference to an actual 'dark' | 'light'.
function computeEffectiveTheme() {
    if (state.theme === 'auto') return getBackgroundIsDark() ? 'dark' : 'light';
    return state.theme;
}

function initTheme() {
    const body = document.body;
    if (computeEffectiveTheme() === 'light') {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    } else {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
    }

    const darkBtn = document.getElementById('themeOptionDark');
    const autoBtn = document.getElementById('themeOptionAuto');
    const lightBtn = document.getElementById('themeOptionLight');
    if (darkBtn) darkBtn.classList.toggle('active', state.theme === 'dark');
    if (autoBtn) autoBtn.classList.toggle('active', state.theme === 'auto');
    if (lightBtn) lightBtn.classList.toggle('active', state.theme === 'light');

    lucide.createIcons();
}

// Set the theme preference (used by the Dark/Auto/Light buttons in Settings).
function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light' && theme !== 'auto') return;
    if (state.theme === theme) return;
    state.theme = theme;
    saveState();
    initTheme();
    const label = theme === 'auto' ? "auto (matching your background's brightness)" : theme;
    showToast(`Switched to ${label} theme`, 'info');
}

// --- Settings modal (theme + theme type + accent color) ---
function toggleSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    if (overlay.classList.contains('active')) {
        closeSettingsPanel();
    } else {
        openSettingsPanel();
    }
}

function openSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay');
    const btn = document.getElementById('btnToggleSettings');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (btn) btn.classList.add('active');
}

function closeSettingsPanel() {
    const overlay = document.getElementById('settingsOverlay');
    const btn = document.getElementById('btnToggleSettings');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    if (btn) btn.classList.remove('active');
}

// Apply an accent color by overriding the CSS custom properties on <body> —
// inline styles win over both the :root defaults and the .light-theme class,
// so one accent definition works in either theme.
function applyAccentColor(key) {
    if (!ACCENTS[key]) key = 'violet';
    const acc = ACCENTS[key];
    const body = document.body;
    body.style.setProperty('--primary', acc.primary);
    body.style.setProperty('--primary-glow', acc.glow);
    body.style.setProperty('--primary-gradient', acc.gradient);
    state.accentColor = key;
}

// Picking a plain accent color always drops back to the "Default" theme type —
// a named theme (Birthday, etc.) owns the whole palette, so the two don't mix.
function setAccentColor(key) {
    if (!ACCENTS[key]) return;
    state.accentColor = key;
    applySpecialTheme('default');
    saveState();
    renderThemeTypeButtons();
    renderAccentSwatches();
    showToast(`Accent color set to ${ACCENTS[key].name}`, 'info');
}

function renderAccentSwatches() {
    const grid = document.getElementById('accentSwatchGrid');
    if (!grid) return;
    grid.classList.toggle('disabled', state.specialTheme !== 'default');
    grid.innerHTML = '';
    Object.keys(ACCENTS).forEach(key => {
        const acc = ACCENTS[key];
        const isActive = key === state.accentColor && state.specialTheme === 'default';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `accent-swatch${isActive ? ' active' : ''}`;
        btn.style.background = acc.gradient;
        btn.title = acc.name;
        btn.setAttribute('aria-label', `${acc.name} accent color`);
        btn.onclick = () => setAccentColor(key);
        if (isActive) {
            btn.innerHTML = '<i data-lucide="check"></i>';
        }
        grid.appendChild(btn);
    });
    lucide.createIcons();
}

// --- Theme Type (named full-palette presets — see THEME_TYPES above for the full list) ---
const THEME_TYPE_ICONS = {
    default: 'palette', birthday: 'cake', halloween: 'ghost', winter: 'snowflake',
    school: 'graduation-cap', summer: 'sun', space: 'rocket',
    spring: 'flower-2', autumn: 'leaf',
    math: 'calculator', science: 'flask-conical', art: 'paintbrush', music: 'music'
};

// Apply a Background Type's full palette (primary/secondary/background glow) on
// <body>. 'default' clears those overrides and falls back to the plain Accent
// Color instead. 'custom' (an uploaded photo) behaves like 'default' for the
// palette — we don't know good matching colors for an arbitrary photo — but
// still gets its own background painting (the photo itself).
function applySpecialTheme(key) {
    const isCustom = key === 'custom' && !!state.customBackgroundImage;
    if (!isCustom && !THEME_TYPES[key]) key = 'default';
    const body = document.body;

    if (key === 'default' || isCustom) {
        body.style.removeProperty('--secondary');
        body.style.removeProperty('--secondary-glow');
        body.style.removeProperty('--secondary-gradient');
        body.style.removeProperty('--bg-glow-1');
        body.style.removeProperty('--bg-glow-2');
        body.style.removeProperty('--bg-glow-3');
        applyAccentColor(state.accentColor);
    } else {
        const t = THEME_TYPES[key];
        body.style.setProperty('--primary', t.primary);
        body.style.setProperty('--primary-glow', t.glow);
        body.style.setProperty('--primary-gradient', t.gradient);
        body.style.setProperty('--secondary', t.secondary);
        body.style.setProperty('--secondary-glow', t.secondaryGlow);
        body.style.setProperty('--secondary-gradient', t.secondaryGradient);
        body.style.setProperty('--bg-glow-1', t.bgGlow1);
        body.style.setProperty('--bg-glow-2', t.bgGlow2);
        body.style.setProperty('--bg-glow-3', t.bgGlow3);
    }

    state.specialTheme = isCustom ? 'custom' : key;
    applyThemeBackground(state.specialTheme);
    renderThemeDecorations(isCustom ? 'default' : key); // no floating decor over a personal photo
    initTheme(); // re-resolve dark/light if the theme preference is 'auto'
}

// Paint the full-viewport #themeBackground layer: a built-in gradient "scene"
// for named types, the uploaded photo (cover-fit) for 'custom', or nothing for
// 'default'.
function applyThemeBackground(key) {
    const layer = document.getElementById('themeBackground');
    if (!layer) return;

    if (key === 'custom' && state.customBackgroundImage) {
        layer.style.backgroundImage = `url(${state.customBackgroundImage})`;
        layer.style.backgroundSize = 'cover';
        layer.style.backgroundPosition = 'center';
    } else {
        const t = THEME_TYPES[key];
        layer.style.backgroundImage = (t && t.painting) ? t.painting : 'none';
        layer.style.backgroundSize = '';
        layer.style.backgroundPosition = '';
    }
}

function setSpecialTheme(key) {
    if (key !== 'custom' && !THEME_TYPES[key]) return;
    if (key === 'custom' && !state.customBackgroundImage) return;
    applySpecialTheme(key);
    saveState();
    renderThemeTypeButtons();
    renderAccentSwatches();
    const name = key === 'custom' ? 'Custom' : THEME_TYPES[key].name;
    showToast(`Background set to ${name}`, 'info');
}

function initThemeType() {
    applySpecialTheme(state.specialTheme);
    renderThemeTypeButtons();
    renderAccentSwatches();
}

function renderThemeTypeButtons() {
    const grid = document.getElementById('themeTypeGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.keys(THEME_TYPES).forEach(key => {
        const t = THEME_TYPES[key];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `theme-type-btn${key === state.specialTheme ? ' active' : ''}`;
        btn.innerHTML = `<i data-lucide="${THEME_TYPE_ICONS[key] || 'sparkles'}"></i><span>${t.name}</span>`;
        btn.onclick = () => setSpecialTheme(key);
        grid.appendChild(btn);
    });

    // "Custom" only appears once a photo has been uploaded.
    if (state.customBackgroundImage) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `theme-type-btn${state.specialTheme === 'custom' ? ' active' : ''}`;
        const thumb = document.createElement('span');
        thumb.className = 'theme-type-thumb';
        thumb.style.backgroundImage = `url(${state.customBackgroundImage})`;
        btn.appendChild(thumb);
        const label = document.createElement('span');
        label.textContent = 'Custom';
        btn.appendChild(label);
        btn.onclick = () => setSpecialTheme('custom');
        grid.appendChild(btn);
    }

    lucide.createIcons();

    const removeBtn = document.getElementById('btnRemoveBackground');
    if (removeBtn) removeBtn.style.display = state.customBackgroundImage ? 'flex' : 'none';
}

// --- Custom background photo (upload / remove) ---
// Uploaded photos are downscaled and re-encoded as JPEG on a canvas before
// being stored as a data URL — a straight-from-camera photo can be many MB,
// which would blow past localStorage's ~5-10MB quota; capping the longest
// edge and compressing keeps a saved backup + the persisted state small.
const CUSTOM_BG_MAX_DIMENSION = 1600;
const CUSTOM_BG_JPEG_QUALITY = 0.82;

// Sample a source canvas down to a tiny thumbnail and average its perceived
// luminance, to classify the uploaded photo as dark or bright for 'auto' theme
// mode. The thumbnail is only used for this measurement, never stored.
function sampleCanvasIsDark(sourceCanvas) {
    const SAMPLE = 24;
    const thumb = document.createElement('canvas');
    thumb.width = SAMPLE;
    thumb.height = SAMPLE;
    const ctx = thumb.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0, SAMPLE, SAMPLE);
    const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return (total / (data.length / 4)) < 140;
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    event.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        showToast('Please choose a PNG or JPG image.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            try {
                const scale = Math.min(1, CUSTOM_BG_MAX_DIMENSION / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                state.customBackgroundIsDark = sampleCanvasIsDark(canvas);
                state.customBackgroundImage = canvas.toDataURL('image/jpeg', CUSTOM_BG_JPEG_QUALITY);
                setSpecialTheme('custom');
            } catch (err) {
                console.error('Failed to process background image.', err);
                showToast('Could not process that image.', 'error');
            }
        };
        img.onerror = () => showToast('Could not read that image file.', 'error');
        img.src = e.target.result;
    };
    reader.onerror = () => showToast('Could not read that image file.', 'error');
    reader.readAsDataURL(file);
}

function removeCustomBackground() {
    if (!state.customBackgroundImage) return;
    if (!confirm('Remove your custom background photo?')) return;

    const wasActive = state.specialTheme === 'custom';
    state.customBackgroundImage = null;
    state.customBackgroundIsDark = null;
    if (wasActive) {
        applySpecialTheme('default');
    }
    saveState();
    renderThemeTypeButtons();
    renderAccentSwatches();
    showToast('Custom background removed', 'info');
}

// --- Theme decorations (ambient, click-through) ---
// One builder per Theme Type; each returns an array of DOM elements to drop
// into #themeDecorations. Purely cosmetic — the container has pointer-events:
// none, so nothing here ever blocks a click.
const THEME_DECORATION_BUILDERS = {
    default: () => [],
    birthday: buildBirthdayDecorations,
    halloween: buildHalloweenDecorations,
    winter: buildWinterDecorations,
    school: buildSchoolDecorations,
    summer: buildSummerDecorations,
    space: buildSpaceDecorations,
    spring: buildSpringDecorations,
    autumn: buildAutumnDecorations,
    math: buildMathDecorations,
    science: buildScienceDecorations,
    art: buildArtDecorations,
    music: buildMusicDecorations
};

function renderThemeDecorations(key) {
    const container = document.getElementById('themeDecorations');
    if (!container) return;
    container.innerHTML = '';
    const build = THEME_DECORATION_BUILDERS[key] || THEME_DECORATION_BUILDERS.default;
    build().forEach(el => container.appendChild(el));
}

function randRange(min, max) {
    return min + Math.random() * (max - min);
}

// A plain emoji/text decoration, positioned + timed via CSS custom properties
// so the shared keyframes (deco-rise, deco-fall-sway, ...) can read them.
function makeDeco(className, content, vars) {
    const el = document.createElement('span');
    el.className = `deco-item ${className}`;
    el.textContent = content;
    el.setAttribute('aria-hidden', 'true');
    Object.keys(vars || {}).forEach(k => el.style.setProperty(k, vars[k]));
    return el;
}

function buildBirthdayDecorations() {
    const items = [];

    // Rising balloons — hue-rotate gives each one a different color from one emoji.
    const balloonHues = [0, 45, 90, 160, 200, 260, 300, 330];
    for (let i = 0; i < 8; i++) {
        items.push(makeDeco('deco-balloon', '🎈', {
            '--x': randRange(2, 92) + 'vw',
            '--size': randRange(28, 46) + 'px',
            '--duration': randRange(16, 26) + 's',
            '--delay': -randRange(0, 24) + 's', // negative delay: already mid-flight on load
            '--drift': randRange(-40, 40) + 'px',
            '--hue': balloonHues[i % balloonHues.length] + 'deg'
        }));
    }

    // Falling, tumbling confetti squares.
    const confettiColors = ['#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899'];
    for (let i = 0; i < 18; i++) {
        const el = makeDeco('deco-confetti', '', {
            '--x': randRange(0, 100) + 'vw',
            '--size': randRange(6, 11) + 'px',
            '--duration': randRange(6, 12) + 's',
            '--delay': -randRange(0, 12) + 's',
            '--drift': randRange(-60, 60) + 'px'
        });
        el.style.background = confettiColors[i % confettiColors.length];
        items.push(el);
    }

    return items;
}

function buildHalloweenDecorations() {
    const items = [];

    // Static cobwebs tucked into the top corners.
    items.push(makeDeco('deco-cobweb', '🕸️', { '--size': randRange(90, 120) + 'px' }));
    items.push(makeDeco('deco-cobweb deco-cobweb-right', '🕸️', { '--size': randRange(90, 120) + 'px' }));

    // Bats winging across the screen at different heights/speeds.
    for (let i = 0; i < 6; i++) {
        items.push(makeDeco('deco-bat', '🦇', {
            '--y': randRange(5, 70) + 'vh',
            '--size': randRange(18, 28) + 'px',
            '--duration': randRange(10, 18) + 's',
            '--delay': -randRange(0, 18) + 's',
            '--bob': randRange(-40, 40) + 'px'
        }));
    }

    // Ghosts and pumpkins bobbing gently in place.
    for (let i = 0; i < 4; i++) {
        items.push(makeDeco('deco-bob', '👻', {
            '--x': randRange(5, 90) + 'vw',
            '--y': randRange(8, 75) + 'vh',
            '--size': randRange(24, 34) + 'px',
            '--duration': randRange(4, 7) + 's',
            '--delay': -randRange(0, 6) + 's',
            '--drift': randRange(-20, 20) + 'px',
            '--op': randRange(0.45, 0.7)
        }));
    }
    for (let i = 0; i < 3; i++) {
        items.push(makeDeco('deco-bob', '🎃', {
            '--x': randRange(5, 90) + 'vw',
            '--y': randRange(60, 90) + 'vh',
            '--size': randRange(26, 36) + 'px',
            '--duration': randRange(4, 7) + 's',
            '--delay': -randRange(0, 6) + 's',
            '--drift': randRange(-15, 15) + 'px',
            '--op': randRange(0.55, 0.8)
        }));
    }

    return items;
}

function buildWinterDecorations() {
    const items = [];
    const flakes = ['❄', '❅', '❆'];
    for (let i = 0; i < 26; i++) {
        items.push(makeDeco('deco-snowflake', flakes[i % flakes.length], {
            '--x': randRange(0, 100) + 'vw',
            '--size': randRange(8, 22) + 'px',
            '--duration': randRange(8, 18) + 's',
            '--delay': -randRange(0, 18) + 's',
            '--drift': randRange(-30, 30) + 'px',
            '--op': randRange(0.35, 0.9)
        }));
    }
    return items;
}

function buildSchoolDecorations() {
    // A gently bobbing mix of classroom supplies scattered around the page.
    return makeBobCluster([
        { emoji: '📚', count: 3, size: [26, 36] },
        { emoji: '✏️', count: 3, size: [22, 30] },
        { emoji: '🍎', count: 3, size: [20, 28] },
        { emoji: '📐', count: 2, size: [22, 30] },
        { emoji: '⭐', count: 2, size: [16, 22] },
        { emoji: '🎒', count: 2, size: [26, 34] }
    ]);
}

function buildSummerDecorations() {
    const items = [];

    // Rising bubbles (like balloons, but plain and translucent — no hue tint).
    for (let i = 0; i < 10; i++) {
        items.push(makeDeco('deco-bubble', '🫧', {
            '--x': randRange(2, 92) + 'vw',
            '--size': randRange(16, 30) + 'px',
            '--duration': randRange(12, 20) + 's',
            '--delay': -randRange(0, 18) + 's',
            '--drift': randRange(-30, 30) + 'px'
        }));
    }

    // Seagulls gliding across the sky.
    for (let i = 0; i < 4; i++) {
        items.push(makeDeco('deco-flyover', '🕊️', {
            '--y': randRange(4, 40) + 'vh',
            '--size': randRange(16, 24) + 'px',
            '--duration': randRange(12, 20) + 's',
            '--delay': -randRange(0, 18) + 's',
            '--bob': randRange(-20, 20) + 'px'
        }));
    }

    // Sun, palm trees, beach ball, ice cream bobbing gently in place.
    items.push(...makeBobCluster([
        { emoji: '☀️', count: 1, size: [40, 48] },
        { emoji: '🌴', count: 3, size: [30, 40] },
        { emoji: '🏖️', count: 2, size: [26, 34] },
        { emoji: '🍦', count: 2, size: [22, 28] }
    ]));

    return items;
}

function buildSpaceDecorations() {
    const items = [];

    // A twinkling star field — small, static, just pulsing opacity/scale.
    for (let i = 0; i < 22; i++) {
        items.push(makeDeco('deco-twinkle', i % 4 === 0 ? '✨' : '⭐', {
            '--x': randRange(0, 100) + 'vw',
            '--y': randRange(0, 100) + 'vh',
            '--size': randRange(6, 14) + 'px',
            '--duration': randRange(2, 5) + 's',
            '--delay': -randRange(0, 5) + 's'
        }));
    }

    // Rockets and UFOs flying across.
    for (let i = 0; i < 3; i++) {
        items.push(makeDeco('deco-flyover', i % 2 === 0 ? '🚀' : '🛸', {
            '--y': randRange(5, 70) + 'vh',
            '--size': randRange(20, 30) + 'px',
            '--duration': randRange(10, 18) + 's',
            '--delay': -randRange(0, 16) + 's',
            '--bob': randRange(-30, 30) + 'px'
        }));
    }

    // Planets, an astronaut, and a comet bobbing/drifting in place.
    items.push(...makeBobCluster([
        { emoji: '🪐', count: 2, size: [30, 42] },
        { emoji: '👨‍🚀', count: 1, size: [28, 34] },
        { emoji: '☄️', count: 1, size: [24, 30] }
    ]));

    return items;
}

// Helper: several bobbing-in-place items of different emoji, counts, and size ranges.
function makeBobCluster(specs) {
    const items = [];
    specs.forEach(({ emoji, count, size }) => {
        for (let i = 0; i < count; i++) {
            items.push(makeDeco('deco-bob', emoji, {
                '--x': randRange(3, 92) + 'vw',
                '--y': randRange(6, 88) + 'vh',
                '--size': randRange(size[0], size[1]) + 'px',
                '--duration': randRange(4, 7) + 's',
                '--delay': -randRange(0, 6) + 's',
                '--drift': randRange(-20, 20) + 'px',
                '--op': randRange(0.5, 0.8)
            }));
        }
    });
    return items;
}

function buildSpringDecorations() {
    const items = [];

    // Butterflies flitting across the screen.
    for (let i = 0; i < 4; i++) {
        items.push(makeDeco('deco-flyover', '🦋', {
            '--y': randRange(5, 65) + 'vh',
            '--size': randRange(16, 24) + 'px',
            '--duration': randRange(11, 18) + 's',
            '--delay': -randRange(0, 16) + 's',
            '--bob': randRange(-35, 35) + 'px'
        }));
    }

    // Falling flower petals, gently swaying down.
    const petals = ['🌸', '🌺'];
    for (let i = 0; i < 14; i++) {
        items.push(makeDeco('deco-fall-item', petals[i % petals.length], {
            '--x': randRange(0, 100) + 'vw',
            '--size': randRange(10, 18) + 'px',
            '--duration': randRange(9, 16) + 's',
            '--delay': -randRange(0, 16) + 's',
            '--drift': randRange(-30, 30) + 'px',
            '--op': randRange(0.6, 0.95)
        }));
    }

    // Blooms and a bee bobbing in place.
    items.push(...makeBobCluster([
        { emoji: '🌷', count: 3, size: [22, 30] },
        { emoji: '🌼', count: 2, size: [20, 28] },
        { emoji: '🐝', count: 2, size: [16, 22] }
    ]));

    return items;
}

function buildAutumnDecorations() {
    const items = [];

    // Falling leaves, tumbling as they drift down.
    const leaves = ['🍁', '🍂', '🍃'];
    for (let i = 0; i < 16; i++) {
        items.push(makeDeco('deco-tumble-item', leaves[i % leaves.length], {
            '--x': randRange(0, 100) + 'vw',
            '--size': randRange(14, 24) + 'px',
            '--duration': randRange(7, 13) + 's',
            '--delay': -randRange(0, 13) + 's',
            '--drift': randRange(-45, 45) + 'px',
            '--op': randRange(0.65, 0.95)
        }));
    }

    // Acorns, a mushroom, and a hedgehog bobbing in the underbrush.
    items.push(...makeBobCluster([
        { emoji: '🌰', count: 3, size: [18, 24] },
        { emoji: '🍄', count: 3, size: [20, 28] },
        { emoji: '🦔', count: 1, size: [26, 32] }
    ]));

    return items;
}

function buildMathDecorations() {
    const items = [];

    // Falling numbers and symbols, drifting gently down. Plain text (unlike
    // emoji) renders in the CSS text color, so set one explicitly for contrast.
    const falling = ['1', '2', 'π', '∑', '7', '∞', '9', '+'];
    for (let i = 0; i < 8; i++) {
        const el = makeDeco('deco-fall-item', falling[i % falling.length], {
            '--x': randRange(0, 100) + 'vw',
            '--size': randRange(14, 22) + 'px',
            '--duration': randRange(10, 17) + 's',
            '--delay': -randRange(0, 17) + 's',
            '--drift': randRange(-25, 25) + 'px',
            '--op': randRange(0.4, 0.7)
        });
        el.style.color = '#fff';
        el.style.fontWeight = '700';
        items.push(el);
    }

    // Operators, tools, and symbols bobbing around the page.
    items.push(...makeBobCluster([
        { emoji: '➕', count: 2, size: [20, 26] },
        { emoji: '➖', count: 2, size: [20, 26] },
        { emoji: '✖️', count: 2, size: [20, 26] },
        { emoji: '🔢', count: 3, size: [22, 30] },
        { emoji: '📐', count: 2, size: [22, 30] },
        { emoji: '📏', count: 2, size: [22, 30] },
        { emoji: '🧮', count: 2, size: [24, 32] }
    ]));

    return items;
}

function buildScienceDecorations() {
    const items = [];

    // Bubbles rising, as if from a bubbling flask.
    for (let i = 0; i < 8; i++) {
        items.push(makeDeco('deco-bubble', '🫧', {
            '--x': randRange(2, 92) + 'vw',
            '--size': randRange(14, 26) + 'px',
            '--duration': randRange(10, 18) + 's',
            '--delay': -randRange(0, 16) + 's',
            '--drift': randRange(-25, 25) + 'px'
        }));
    }

    // Lab equipment and specimens bobbing around the page.
    items.push(...makeBobCluster([
        { emoji: '🧪', count: 3, size: [22, 30] },
        { emoji: '⚗️', count: 2, size: [24, 32] },
        { emoji: '🔬', count: 2, size: [24, 32] },
        { emoji: '🧬', count: 3, size: [22, 30] },
        { emoji: '⚛️', count: 2, size: [20, 28] },
        { emoji: '🔭', count: 2, size: [24, 32] }
    ]));

    return items;
}

function buildArtDecorations() {
    const items = [];

    // Tumbling, colorful paint-splatter squares (reuses the confetti animation).
    const paintColors = ['#d946ef', '#f59e0b', '#06b6d4', '#22c55e', '#f43f5e', '#a855f7'];
    for (let i = 0; i < 16; i++) {
        const el = makeDeco('deco-confetti', '', {
            '--x': randRange(0, 100) + 'vw',
            '--size': randRange(7, 12) + 'px',
            '--duration': randRange(6, 12) + 's',
            '--delay': -randRange(0, 12) + 's',
            '--drift': randRange(-60, 60) + 'px'
        });
        el.style.background = paintColors[i % paintColors.length];
        el.style.borderRadius = '50%'; // paint droplets read better round than square
        items.push(el);
    }

    // Palette, brush, rainbow, sparkles, and a framed picture bobbing in place.
    items.push(...makeBobCluster([
        { emoji: '🎨', count: 2, size: [26, 34] },
        { emoji: '🖌️', count: 2, size: [22, 28] },
        { emoji: '🌈', count: 2, size: [26, 34] },
        { emoji: '✨', count: 2, size: [16, 22] },
        { emoji: '🖼️', count: 2, size: [22, 30] }
    ]));

    return items;
}

function buildMusicDecorations() {
    const items = [];

    // Notes rising up, as if drifting off an instrument.
    const notes = ['🎵', '🎶'];
    for (let i = 0; i < 8; i++) {
        items.push(makeDeco('deco-bubble', notes[i % notes.length], {
            '--x': randRange(2, 92) + 'vw',
            '--size': randRange(18, 30) + 'px',
            '--duration': randRange(12, 20) + 's',
            '--delay': -randRange(0, 18) + 's',
            '--drift': randRange(-30, 30) + 'px'
        }));
    }

    // Instruments and headphones bobbing around the page.
    items.push(...makeBobCluster([
        { emoji: '🎸', count: 2, size: [24, 32] },
        { emoji: '🎹', count: 2, size: [24, 32] },
        { emoji: '🎺', count: 2, size: [22, 30] },
        { emoji: '🥁', count: 2, size: [22, 30] },
        { emoji: '🎧', count: 2, size: [22, 30] }
    ]));

    return items;
}

// =======================================================================
// EDIT MODE
// - Dashboard cards (Create Activity, Alarm, Timer, Analytics, Session Log)
//   and tracker cards (individual activities) SWAP places with whatever
//   card they're dropped onto.
// - Header buttons still drag freely within their zone, clamped so
//   #btnToggleEditMode is always the leftmost element.
// =======================================================================

function toggleEditMode() {
    const active = !document.body.classList.contains('edit-mode-active');
    document.body.classList.toggle('edit-mode-active', active);
    const btn = document.getElementById('btnToggleEditMode');
    if (btn) btn.classList.toggle('active', active);
    showToast(active ? 'Edit mode on — drag cards and buttons to rearrange' : 'Edit mode off', 'info');
}

// Swallow clicks inside `container` while edit mode is active, in a capturing
// listener so it runs before any inner button's own click handler — otherwise
// dropping a drag (a pointerdown+pointerup with little movement) can also fire
// a native click, e.g. starting a stopwatch or exporting JSON by accident.
// `allowSelector`, if given, lets clicks through for matching targets (used so
// the Edit Mode button itself can still be clicked to turn editing back off).
function blockClicksDuringEditMode(container, allowSelector) {
    if (!container) return;
    container.addEventListener('click', (e) => {
        if (!document.body.classList.contains('edit-mode-active')) return;
        if (allowSelector && e.target.closest(allowSelector)) return;
        e.stopPropagation();
        e.preventDefault();
    }, true);
}

// Header buttons: swap with whatever button they're dropped onto, exactly
// like dashboard/tracker cards. #btnToggleEditMode has no .swap-btn class, so
// it's never a valid drag source or drop target — it just always stays put.
function initHeaderButtonDragging() {
    document.querySelectorAll('.header-actions .swap-btn').forEach(btn => {
        makeSwappable(btn, '.swap-btn', (draggedEl, targetEl) => {
            swapElements(draggedEl, targetEl);
            saveHeaderButtonOrder();
        });
    });
}

function saveHeaderButtonOrder() {
    const buttons = document.querySelectorAll('.header-actions .swap-btn');
    state.headerButtonOrder = Array.from(buttons).map(el => el.id);
    saveState();
}

// Re-apply a saved header button order on load — appendChild on an existing
// node relocates it, so processing ids in saved order rebuilds the sequence.
// #btnToggleEditMode and the hidden #importFile input are never touched, so
// they stay exactly where they started (Edit Mode leftmost).
function applyHeaderButtonOrder() {
    if (!state.headerButtonOrder || !state.headerButtonOrder.length) return;
    const container = document.querySelector('.header-actions');
    if (!container) return;
    state.headerButtonOrder.forEach(id => {
        const el = document.getElementById(id);
        if (el) container.appendChild(el);
    });
}

// Make `el` swap-draggable: dragging it onto another element matching
// `groupSelector` (via onSwap(draggedEl, targetEl)) exchanges their places.
// Used for dashboard cards and tracker cards — unlike header buttons, these
// don't support free positioning, only swapping with another card.
function makeSwappable(el, groupSelector, onSwap) {
    if (!el) return;

    el.addEventListener('pointerdown', (e) => {
        if (!document.body.classList.contains('edit-mode-active')) return;
        if (e.button !== 0) return;
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        let dragging = false;
        let target = null;

        function onMove(ev) {
            if (!dragging) {
                // Small threshold so a plain click doesn't count as a drag.
                if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) return;
                dragging = true;
                el.classList.add('dragging-swap');
            }

            el.style.transform = `translate(${ev.clientX - startX}px, ${ev.clientY - startY}px)`;

            // Hide `el` from hit-testing so elementFromPoint can see what's underneath it.
            el.style.pointerEvents = 'none';
            const under = document.elementFromPoint(ev.clientX, ev.clientY);
            el.style.pointerEvents = '';

            const candidateEl = under ? under.closest(groupSelector) : null;
            const candidate = (candidateEl && candidateEl !== el) ? candidateEl : null;

            if (target && target !== candidate) target.classList.remove('swap-target');
            if (candidate) candidate.classList.add('swap-target');
            target = candidate;
        }

        function onUp() {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
            el.style.transform = '';
            el.classList.remove('dragging-swap');
            if (target) {
                target.classList.remove('swap-target');
                onSwap(el, target);
            }
        }

        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });
}

// Swap two arbitrary DOM nodes' positions, regardless of whether they share a
// parent or are adjacent siblings.
function swapElements(a, b) {
    if (!a || !b || a === b) return;
    const placeholder = document.createComment('swap-placeholder');
    a.parentNode.insertBefore(placeholder, a);
    b.parentNode.insertBefore(a, b);
    placeholder.parentNode.insertBefore(b, placeholder);
    placeholder.remove();
}

// Dashboard cards (Create Activity, Alarm, Timer, Analytics, Session Log):
// swap DOM position with whatever card they're dropped onto, and persist the
// resulting order (which pane each card ends up in, and in what sequence).
function initDashboardCardDragging() {
    document.querySelectorAll('.dashboard-card').forEach(card => {
        makeSwappable(card, '.dashboard-card', (draggedEl, targetEl) => {
            swapElements(draggedEl, targetEl);
            saveDashboardCardOrder();
        });
    });
}

function saveDashboardCardOrder() {
    const cards = document.querySelectorAll('.left-pane .dashboard-card, .right-pane .dashboard-card');
    state.dashboardCardOrder = Array.from(cards).map(el => ({
        id: el.id,
        pane: el.closest('.left-pane') ? 'left' : 'right'
    }));
    saveState();
}

// Re-apply a saved dashboard card order on load, by re-appending each card
// (in saved order) into its recorded pane — appendChild on an existing node
// relocates it, so processing entries in order rebuilds the exact sequence.
function applyDashboardCardOrder() {
    if (!state.dashboardCardOrder || !state.dashboardCardOrder.length) return;
    const leftPane = document.querySelector('.left-pane');
    const rightPane = document.querySelector('.right-pane');
    state.dashboardCardOrder.forEach(({ id, pane }) => {
        const el = document.getElementById(id);
        const container = pane === 'left' ? leftPane : rightPane;
        if (el && container) container.appendChild(el);
    });
}

// Tracker (activity) cards: swap with whatever card they're dropped onto by
// exchanging their positions in state.activities. Called once per card each
// time renderActivities() (re)builds the grid.
function initCardDragging(act) {
    const el = document.getElementById(`card-${act.id}`);
    if (!el) return;
    makeSwappable(el, '.activity-card', (draggedEl, targetEl) => {
        swapActivityOrder(draggedEl.id.replace('card-', ''), targetEl.id.replace('card-', ''));
    });
}

function swapActivityOrder(idA, idB) {
    if (idA === idB) return;
    const idxA = state.activities.findIndex(a => a.id === idA);
    const idxB = state.activities.findIndex(a => a.id === idB);
    if (idxA === -1 || idxB === -1) return;
    const tmp = state.activities[idxA];
    state.activities[idxA] = state.activities[idxB];
    state.activities[idxB] = tmp;
    saveState();
    renderActivities();
}

// =======================================================================
// RIDDLE OF THE DAY — a new riddle each calendar day (deterministic, so
// everyone sees the same one), answer checked case-insensitively.
// =======================================================================

const RIDDLES = [
    { q: "What has keys but can't open locks?", a: ['a piano', 'piano'] },
    { q: 'What has a face and two hands but no arms or legs?', a: ['a clock', 'clock'] },
    { q: 'What has to be broken before you can use it?', a: ['an egg', 'egg'] },
    { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?', a: ['an echo', 'echo'] },
    { q: 'The more you take, the more you leave behind. What am I?', a: ['footsteps', 'footprints'] },
    { q: 'What month of the year has 28 days?', a: ['all of them', 'all months', 'every month', 'all'] },
    { q: "What has one eye but can't see?", a: ['a needle', 'needle'] },
    { q: 'What can travel around the world while staying in a corner?', a: ['a stamp', 'stamp'] },
    { q: 'What gets wetter as it dries?', a: ['a towel', 'towel'] },
    { q: "What has many teeth but can't bite?", a: ['a comb', 'comb'] },
    { q: 'What has a neck but no head?', a: ['a bottle', 'bottle'] },
    { q: 'What goes up but never comes down?', a: ['your age', 'age'] },
    { q: "What has hands but can't clap?", a: ['a clock', 'clock'] },
    { q: 'What is full of holes but still holds water?', a: ['a sponge', 'sponge'] },
    { q: 'What can you catch but not throw?', a: ['a cold', 'cold'] },
    { q: 'What has a bottom at the top?', a: ['your legs', 'legs'] },
    { q: 'What runs but never walks, has a mouth but never talks?', a: ['a river', 'river'] },
    { q: 'What invention lets you look right through a wall?', a: ['a window', 'window'] },
    { q: "What has legs but doesn't walk?", a: ['a table', 'table', 'a chair', 'chair'] },
    { q: 'What can fill a room but takes up no space?', a: ['light'] },
    { q: 'What comes once in a minute, twice in a moment, but never in a thousand years?', a: ['the letter m', 'letter m', 'm'] },
    { q: 'What has an eye but cannot see, and a bed but never sleeps?', a: ['a river', 'river'] },
    { q: 'What kind of room has no doors or windows?', a: ['a mushroom', 'mushroom'] },
    { q: 'What begins with T, ends with T, and has T in it?', a: ['a teapot', 'teapot'] },
    { q: 'What can you break without touching it?', a: ['a promise'] },
    { q: 'What has a head, a tail, is brown, and has no legs?', a: ['a penny', 'penny', 'a coin', 'coin'] },
    { q: 'What is easy to get into but hard to get out of?', a: ['trouble'] },
    { q: "What is always in front of you but can't be seen?", a: ['the future', 'future'] },
    { q: 'What has one head, one foot, and four legs?', a: ['a bed', 'bed'] },
    { q: 'What is so fragile that saying its name breaks it?', a: ['silence'] },
    { q: 'What can you keep after giving it to someone?', a: ['your word', 'word'] },
    { q: 'What has words but never speaks?', a: ['a book', 'book'] },

    // --- Objects & everyday things ---
    { q: "What has a thumb and four fingers but isn't alive?", a: ['a glove', 'glove'] },
    { q: 'What has a ring but no finger, and rings without ever calling itself?', a: ['a telephone', 'telephone', 'a phone', 'phone'] },
    { q: "What has teeth but can't eat, and helps you cut through wood?", a: ['a saw', 'saw'] },
    { q: 'What has a spine but no bones, and pages instead of ribs?', a: ['a book', 'book'] },
    { q: 'What has many keys, opens no doors, and is used every day to write?', a: ['a keyboard', 'keyboard'] },
    { q: 'What kind of coat is always wet when you put it on?', a: ['a coat of paint', 'coat of paint', 'paint'] },
    { q: 'What is black when clean and white when dirty?', a: ['a chalkboard', 'chalkboard', 'a blackboard', 'blackboard'] },
    { q: 'What has four wheels and flies, but is never seen soaring through the sky?', a: ['a garbage truck', 'garbage truck'] },
    { q: "What goes up and down all day but never actually moves from its spot?", a: ['stairs', 'a staircase'] },
    { q: 'What has a heart that never beats, hiding at the center of a vegetable?', a: ['an artichoke', 'artichoke'] },
    { q: 'What can you hold for a long time without ever touching it with your hands?', a: ['your breath', 'breath'] },
    { q: 'What starts completely empty but is always full of letters by the end of the week?', a: ['a mailbox', 'mailbox'] },
    { q: "What has a ring, but not on a finger, and wakes you up in the morning?", a: ['an alarm clock', 'alarm clock'] },
    { q: 'What kind of band is worn around your wrist but never plays a note of music?', a: ['a rubber band', 'rubber band'] },
    { q: "What kind of dog never barks, and you might put mustard on it?", a: ['a hot dog', 'hot dog'] },
    { q: "What kind of cup can't hold any water at all, but you can eat it after a party?", a: ['a cupcake', 'cupcake'] },
    { q: 'What kind of nut has no shell but is covered in glaze or sprinkles?', a: ['a doughnut', 'doughnut', 'a donut', 'donut'] },
    { q: 'What has one horn, four legs, and delivers milk instead of making music?', a: ['a milk truck', 'milk truck'] },
    { q: 'What runs all the way around a yard but never takes a single step?', a: ['a fence', 'fence'] },
    { q: 'What word starts with an E, ends with an E, but usually only has one letter inside it?', a: ['an envelope', 'envelope'] },
    { q: 'What word is spelled incorrectly in absolutely every dictionary?', a: ['wrong', 'the word wrong'] },
    { q: 'What five-letter word becomes shorter the moment you add two more letters to it?', a: ['short'] },
    { q: 'What word reads exactly the same upside down and backward?', a: ['swims'] },
    { q: 'What has cities but no houses, forests but no trees, and rivers but no water?', a: ['a map', 'map'] },
    { q: 'What always points north, no matter which way you turn it?', a: ['a compass', 'compass'] },
    { q: 'What kind of table has no legs to stand on at all?', a: ['a timetable', 'timetable'] },
    { q: 'What has a lock but no door, and keeps all your secrets safe in writing?', a: ['a diary', 'diary', 'a journal', 'journal'] },
    { q: 'What can be cracked, made, told, and played, all without ever being a physical object?', a: ['a joke', 'joke'] },
    { q: 'What has an army of pieces but no real weapons, and battles are fought on a checkered board?', a: ['chess', 'a chess set'] },
    { q: 'What kind of "ship" has no captain, never touches water, but can carry two people for years?', a: ['a relationship', 'relationship'] },
    { q: 'What falls all the time but is never hurt when it lands?', a: ['rain'] },
    { q: 'What falls every single day but never actually breaks?', a: ['night', 'nightfall'] },
    { q: 'What goes up in the air the moment rain starts coming down?', a: ['an umbrella', 'umbrella'] },
    { q: 'What is always coming but somehow never actually arrives?', a: ['tomorrow'] },
    { q: "What letter can you find in the middle of March and April, but not at the start or end of either?", a: ['the letter r', 'letter r', 'r'] },
    { q: 'What walks on four legs in the morning, two legs in the afternoon, and three legs in the evening?', a: ['a human', 'human', 'a person', 'person', 'man'] },
    { q: 'What can you look through, walk through the frame of, but never actually walk through the door of?', a: ['a keyhole', 'keyhole'] },
    { q: 'What season do you get when you jump on a trampoline?', a: ['spring', 'springtime'] },
    { q: "What kind of tree grows in nearly every family, but you could never plant it in the ground?", a: ['a family tree', 'family tree'] },
    { q: 'What travels constantly from the past into the future but never once stops moving?', a: ['time'] },
    { q: "What kind of shower doesn't need a single drop of water, and falls from outer space?", a: ['a meteor shower', 'meteor shower'] },
    { q: 'What alphabet is made entirely of dots and dashes?', a: ['morse code', 'morse'] },
    { q: 'What can you make, but never see, hear, or touch, yet everyone hopes will come true?', a: ['a wish', 'wish'] },
    { q: 'What kind of storm never produces a single drop of rain?', a: ['a brainstorm', 'brainstorm'] },
    { q: 'What animal is always found standing at a baseball game?', a: ['a bat', 'bat'] },
    { q: 'What do you call a bear that has lost all of its teeth?', a: ['a gummy bear', 'gummy bear'] },
    { q: 'What has a tongue but can never say a single word?', a: ['a shoe', 'shoe'] },
    { q: 'What animal always sleeps with its shoes on?', a: ['a horse', 'horse'] },
    { q: 'What kind of dog keeps the best time, staying alert all night long?', a: ['a watchdog', 'watchdog'] },
    { q: 'What insect can spell out an entire word using just one letter?', a: ['a bee', 'bee'] },
    { q: 'What grows ears every summer but can never hear a single word?', a: ['corn'] },
    { q: 'What bird can lift the heaviest loads on a construction site?', a: ['a crane', 'crane'] },
    { q: 'What kind of "key" has fur, a tail, and loves to eat bananas?', a: ['a monkey', 'monkey'] },
    { q: 'What has a bill but never once has to pay it?', a: ['a duck', 'duck'] },
    { q: 'What has a comb on its head but never uses it to comb anything?', a: ['a rooster', 'rooster'] },
    { q: "A father's son who is not your brother — who could this be?", a: ['you', 'me', 'yourself'] },
    { q: 'What can you give away to someone else and still keep for yourself?', a: ['a smile', 'smile'] },
    { q: 'What has eyes but cannot see, and grows quietly underground?', a: ['a potato', 'potato'] },
    { q: 'What fruit is never found without its matching partner, sharing half its name with the word "two"?', a: ['a pear', 'pear'] },
    { q: 'What goes into the water bright red, and comes out completely black?', a: ['a hot iron', 'hot iron', 'iron'] },
    { q: 'What kind of nut sounds exactly like a sneeze?', a: ['a cashew', 'cashew'] },
    { q: 'What has a wick, slowly melts as it works, and is often lit for a bit of light?', a: ['a candle', 'candle'] },
    { q: 'What kind of "table" can you actually sit down and eat?', a: ['a vegetable', 'vegetable'] },
    { q: 'What kind of dough do you play with, never bake, and definitely never eat?', a: ['play-doh', 'playdough', 'play dough'] },
    { q: 'What has a skin but no flesh, no bones, and no blood at all?', a: ['a banana', 'banana'] },
    { q: 'What has rings all over its body but is not jewelry, and can reveal its age if you count them?', a: ['a tree', 'tree'] },
    { q: 'What vegetable is orange and sounds just like a talking bird?', a: ['a carrot', 'carrot'] },
    { q: 'What kind of "egg" is a vegetable you would never crack into a pan?', a: ['an eggplant', 'eggplant'] },
    { q: 'What part of your body has the most rhythm, hidden deep inside your ear?', a: ['an eardrum', 'eardrum'] },
    { q: 'What gets bigger and bigger the more you take away from it?', a: ['a hole', 'hole'] },
    { q: 'What has a screen, a keyboard, and a mouse, but never blinks and never runs anywhere?', a: ['a computer', 'computer'] },
    { q: 'What has lots of buttons but no buttonholes, and controls your entire television?', a: ['a remote control', 'remote control', 'a remote', 'remote'] },
    { q: 'What rings all day long, lives in your pocket, but has no fingers of its own?', a: ['a phone', 'phone', 'a cell phone', 'cell phone'] },
    { q: 'What can you scroll through for hours without ever touching an actual scroll?', a: ['a phone', 'phone', 'social media'] },
    { q: "What kind of ball can never be thrown, kicked, or bounced, yet you use it to see?", a: ['an eyeball', 'eyeball'] },
    { q: 'What sport are waiters naturally talented at, simply because of what they do all day?', a: ['tennis'] },
    { q: 'What race includes absolutely everyone, yet nobody ever truly wins it?', a: ['the human race', 'human race'] },
    { q: 'What field has a diamond right in the middle of it, yet grows no crops at all?', a: ['a baseball field', 'baseball field'] },
    { q: 'What has strings, a neck, and a body, yet has never once been alive?', a: ['a guitar', 'guitar'] },
    { q: 'What can you see straight through, yet it still keeps the wind and rain outside?', a: ['glass'] },
    { q: 'What is black and white, and gets read all over every single morning?', a: ['a newspaper', 'newspaper'] },
    { q: 'What can spread through an entire room in seconds, without anyone lifting a finger, after a good joke?', a: ['laughter'] },
    { q: 'What shape has no beginning, no end, and no corners at all?', a: ['a circle', 'circle'] },
    { q: 'What takes years to build, only seconds to break, and is nearly impossible to fully repair?', a: ['trust'] },
    { q: 'What kind of worker spends the whole day underground, digging for valuable resources?', a: ['a miner', 'miner'] },
    { q: 'What kind of artist uses a needle full of ink instead of a paintbrush?', a: ['a tattoo artist', 'tattoo artist'] },
    { q: 'What kind of worker gets paid to break buildings apart on purpose?', a: ['a demolition worker', 'demolition worker'] },
    { q: 'What has craters all over it, yet has never been in a single battle?', a: ['the moon', 'moon'] },
    { q: 'What planet is famous for the beautiful rings that circle all the way around it?', a: ['saturn'] },
    { q: 'What has a spine and many pages, and can weigh down your backpack all school year long?', a: ['a textbook', 'textbook'] },
    { q: 'What test does absolutely everything in life eventually have to pass, without ever opening a book?', a: ['the test of time', 'test of time'] },
    { q: 'What can be given away completely, over and over, without ever once running out?', a: ['love'] },
    { q: 'What grows the more it is shared, but does nothing at all sitting quietly alone in your head?', a: ['knowledge'] },
    { q: 'What word has the longest distance between its first and last letters, because there is a "mile" in between them?', a: ['smiles'] },
    { q: 'What starts with the letter P, ends with the letter E, and yet somehow contains thousands and thousands of letters?', a: ['a post office', 'post office'] },
    { q: 'What five-letter word sounds exactly the same even after you take away its last four letters?', a: ['queue'] },
    { q: 'What letter is waiting for you at the very end of every single rainbow?', a: ['the letter w', 'letter w', 'w'] },
    { q: "If you have one, you want to share it. The moment you share it, you no longer really have it. What is it?", a: ['a secret', 'secret'] },
    { q: 'The more you have of it, the less you are able to see. What is it?', a: ['darkness'] },
    { q: 'What can be cut again and again, over and over, without ever actually getting any smaller?', a: ['a deck of cards', 'deck of cards', 'cards'] },
    { q: 'What can be broken, yet breaking it is often something worth celebrating?', a: ['a record', 'record'] },
    { q: 'What natural "coat" only ever forms on your car windows during freezing weather?', a: ['frost'] },
    { q: 'What has a face and hands, yet no eyes or arms, and is usually strapped to your wrist?', a: ['a watch', 'watch'] },
    { q: 'What can be driven, yet has no wheels and no engine at all, and is struck with a hammer?', a: ['a nail', 'nail'] },
    { q: 'What gets "measured" at the end of every school term, yet weighs absolutely nothing?', a: ['your grades', 'grades'] },
    { q: 'What has spinning blades but is never once used for cooking?', a: ['a fan', 'fan'] },
    { q: 'What kind of "house" can a small, slow creature carry around on its very own back?', a: ['a shell', 'shell'] },
    { q: 'What kind of "ladder" do people spend their whole career climbing, without ever using their feet?', a: ['the career ladder', 'career ladder'] },
    { q: 'What kitchen tool is covered in tiny holes, yet is perfect for draining pasta without losing a single noodle?', a: ['a colander', 'colander', 'a strainer', 'strainer'] },
    { q: 'What can be popped for fun at a party, is not a food, and is made of thin stretchy rubber and air?', a: ['a balloon', 'balloon'] },
    { q: 'What single word can mean both a season of the year and the bouncy part inside an old mattress?', a: ['spring'] },
    { q: 'What has a spout shaped like a beak, and whistles loudly the moment the water is ready?', a: ['a kettle', 'kettle'] },
    { q: 'What object shows your own reflection back at you, yet feels cold to the touch and can shatter?', a: ['a mirror', 'mirror'] },
    { q: 'What can you "draw" without ever needing a pencil, paper, or any artistic skill whatsoever?', a: ['a breath', 'breath'] },
    { q: "What has a dial and a needle, yet no phone number, and tells you exactly how hot or cold it is?", a: ['a thermometer', 'thermometer'] },
    { q: 'What device can clean an entire floor of dust and crumbs without you ever having to push it?', a: ['a robot vacuum', 'robot vacuum'] },
    { q: "What kind of 'glass' measures time falling through sand, instead of ever being used to drink from?", a: ['an hourglass', 'hourglass'] },
    { q: 'What device can capture a single moment forever, with nothing more than a click and a flash?', a: ['a camera', 'camera'] },
    { q: 'What has a lens, is not a pair of glasses, and lets you see planets far away in the night sky?', a: ['a telescope', 'telescope'] },
    { q: "What tool makes tiny things look much bigger, without ever actually changing their real size?", a: ['a magnifying glass', 'magnifying glass'] },
    { q: 'What has a sharp blade, is worn on your feet, and lets you glide smoothly across ice?', a: ['an ice skate', 'ice skate', 'ice skates'] },
    { q: 'What sport uses a feathered shuttlecock instead of a ball, hit back and forth with rackets?', a: ['badminton'] },
    { q: 'What classic board game involves buying up streets and possibly landing yourself in jail?', a: ['monopoly'] },
    { q: 'What has a shell you must crack open, yet no living creature ever crawls out of it?', a: ['a peanut', 'peanut', 'a nut', 'nut'] },
    { q: 'What must be twisted off before you can take your very first sip of a fizzy soda?', a: ['a bottle cap', 'bottle cap'] },
    { q: 'What animal has a long trunk, giant ears, and is famous for never forgetting anything?', a: ['an elephant', 'elephant'] },
    { q: 'What animal hops everywhere, carries its babies in a pouch, and calls Australia home?', a: ['a kangaroo', 'kangaroo'] },
    { q: "What animal can change the color of its skin to hide perfectly from predators?", a: ['a chameleon', 'chameleon'] },
    { q: 'What has black and white stripes just like a zebra, but is painted flat on a city street?', a: ['a crosswalk', 'crosswalk'] },
    { q: 'What insect lives inside a hive, makes something sweet, and can only sting a person once?', a: ['a bee', 'bee'] },
    { q: 'What creature has eight long legs and spins delicate webs, but is not an octopus?', a: ['a spider', 'spider'] },
    { q: "What bird can't fly a single inch, but is an excellent swimmer in icy waters?", a: ['a penguin', 'penguin'] },
    { q: 'What desert animal can go a very long time without water, thanks to the hump on its back?', a: ['a camel', 'camel'] },
    { q: "What African animal has a distinctive laugh, even though it isn't actually happy?", a: ['a hyena', 'hyena'] },
    { q: 'What animal is famously called the "king of the jungle," even though it mostly lives on the grasslands?', a: ['a lion', 'lion'] },
    { q: 'What European country is famous for being shaped almost exactly like a tall boot?', a: ['italy'] },
    { q: 'What is the largest ocean on the entire planet?', a: ['the pacific ocean', 'pacific ocean', 'the pacific', 'pacific'] },
    { q: 'What is the tallest mountain in the entire world, found in the Himalayas?', a: ['mount everest', 'everest'] },
    { q: 'What is the smallest independent country in the entire world?', a: ['vatican city', 'the vatican', 'vatican'] },
    { q: 'What spooky holiday do people carve faces into pumpkins for?', a: ['halloween'] },
    { q: 'What holiday in the United States centers around a big turkey dinner and giving thanks?', a: ['thanksgiving'] },
    { q: "What American holiday is celebrated with fireworks every year on the fourth of July?", a: ['independence day', 'the fourth of july', 'fourth of july', 'july 4th'] },
    { q: 'What winter holiday features a decorated tree covered in lights and ornaments?', a: ['christmas'] },
    { q: "What holiday do people celebrate at the stroke of midnight, welcoming a brand new year?", a: ["new year's eve", 'new years eve'] },
    { q: 'What state of matter has no fixed shape and no fixed volume of its own?', a: ['a gas', 'gas'] },
    { q: 'What invisible force is constantly pulling every object down toward the Earth?', a: ['gravity'] },
    { q: 'What life-giving gas makes up about twenty-one percent of the air we breathe?', a: ['oxygen'] },
    { q: 'What is the scientific name for a caterpillar transforming into a butterfly?', a: ['metamorphosis'] },
    { q: 'What comes in pairs, protects your feet all day, and gets taken off right before bed?', a: ['shoes'] },
    { q: 'What kind of "jacket" can a book wear, that a person would never put on?', a: ['a dust jacket', 'dust jacket', 'a book cover', 'book cover'] },
    { q: 'What word contains twenty-six letters but is made up of only three syllables?', a: ['the alphabet', 'alphabet'] },
    { q: 'I am a word of letters three; add two more and fewer there will be. What word am I?', a: ['few'] },
    { q: 'What single letter marks both the end of everything, and the very last letter of the word "everything" itself?', a: ['the letter g', 'letter g', 'g'] },
    { q: "What flows constantly from a faucet, can be still or rushing, and is essential to every living thing?", a: ['water'] },
    { q: 'What comes out weekly or monthly, packed with glossy pages and advertisements, but is not a book?', a: ['a magazine', 'magazine'] },
    { q: 'What is the only number whose name has the exact same number of letters as its value?', a: ['four', '4'] },
    { q: 'What number is exactly one third of one thousand two hundred?', a: ['four hundred', '400'] },
    { q: 'What number, when doubled, gives you eighteen?', a: ['nine', '9'] },
    { q: "You have two coins that add up to thirty cents, and one of them is not a nickel. What are the two coins?", a: ['a quarter and a nickel', 'quarter and a nickel', 'a nickel and a quarter'] },
    { q: 'What do you get when you add up every number from one to ten?', a: ['fifty-five', '55'] },
    { q: 'What number comes exactly one after one hundred?', a: ['one hundred one', '101'] },
    { q: 'What number is exactly half of one hundred?', a: ['fifty', '50'] },
    { q: 'How many sides does a hexagon have?', a: ['six', '6'] },
    { q: 'How many legs does a spider have?', a: ['eight', '8'] },
    { q: 'How many continents are there on planet Earth?', a: ['seven', '7'] },
    { q: 'How many distinct colors are traditionally counted in a rainbow?', a: ['seven', '7'] },
    { q: 'How many strings does a standard guitar have?', a: ['six', '6'] },
    { q: 'How many players from each team are on the field at once during a soccer match?', a: ['eleven', '11'] },
    { q: 'How many hearts does an octopus have pumping inside it?', a: ['three', '3'] },
    { q: 'How many minutes are there in one full day?', a: ['1440', 'fourteen forty', 'one thousand four hundred forty'] },
    { q: 'How many degrees are there in a perfect right angle?', a: ['ninety', '90'] },
    { q: 'What is the freezing point of water, measured in Fahrenheit?', a: ['thirty-two', '32'] },
    { q: 'What planet is famously nicknamed the "Red Planet"?', a: ['mars'] },
    { q: 'What is the largest planet in our entire solar system?', a: ['jupiter'] },
    { q: 'What is the closest planet to the sun?', a: ['mercury'] },
    { q: 'What galaxy do Earth and our entire solar system call home?', a: ['the milky way', 'milky way'] },
    { q: 'What do bees collect from flowers before turning it into honey?', a: ['nectar'] },
    { q: 'What is the hardest naturally occurring substance found on Earth?', a: ['diamond'] },
    { q: 'What organ in your body is responsible for pumping blood everywhere it needs to go?', a: ['the heart', 'heart'] },
    { q: 'What is the largest single organ in the entire human body?', a: ['the skin', 'skin'] },
    { q: 'What is the name of the process plants use to turn sunlight into food?', a: ['photosynthesis'] },
    { q: 'What tiny structure at the center of an atom holds its protons and neutrons?', a: ['the nucleus', 'nucleus'] },
    { q: "What structure inside a cell is famously nicknamed the 'powerhouse of the cell' in every biology class?", a: ['the mitochondria', 'mitochondria'] },
    { q: 'What icy continent is famously home to enormous colonies of penguins?', a: ['antarctica'] },
    { q: "What is the largest hot desert in the entire world?", a: ['the sahara', 'sahara', 'the sahara desert', 'sahara desert'] },
    { q: 'What is the tallest animal in the entire world, with an incredibly long neck?', a: ['a giraffe', 'giraffe'] },
    { q: 'What is the fastest land animal in the entire world, capable of incredible bursts of speed?', a: ['a cheetah', 'cheetah'] },
    { q: 'What is the largest mammal on planet Earth, living deep in the ocean?', a: ['a blue whale', 'blue whale', 'a whale', 'whale'] },
    { q: 'What is the only mammal in the world truly capable of powered flight?', a: ['a bat', 'bat'] },
    { q: 'What green fruit is mashed up to make guacamole?', a: ['an avocado', 'avocado'] },
    { q: 'What Italian dish is made of flat baked dough topped with sauce and melted cheese?', a: ['pizza'] },
    { q: 'What frozen dessert is often scooped into a crunchy cone on a hot summer day?', a: ['ice cream'] },
    { q: 'What hot drink is made by brewing roasted beans in hot water, usually first thing in the morning?', a: ['coffee'] },
    { q: 'What yellow fruit is a favorite snack of monkeys everywhere?', a: ['a banana', 'banana'] },
    { q: "What red fruit is traditionally given to a teacher, and is said to keep the doctor away?", a: ['an apple', 'apple'] },
    { q: 'What creamy spread is made almost entirely from crushed, roasted peanuts?', a: ['peanut butter'] },
    { q: 'What white liquid comes from cows and is often poured straight over cereal?', a: ['milk'] },
    { q: 'What kind of professional rushes toward danger to put out burning buildings?', a: ['a firefighter', 'firefighter'] },
    { q: 'What kind of professional is trained to fly passenger airplanes?', a: ['a pilot', 'pilot'] },
    { q: 'What kind of professional takes care of sick and injured animals?', a: ['a veterinarian', 'veterinarian', 'a vet', 'vet'] },
    { q: 'What kind of professional is responsible for enforcing the law and catching criminals?', a: ['a police officer', 'police officer'] },
    { q: 'What kind of professional bakes fresh bread and pastries for a living?', a: ['a baker', 'baker'] },
    { q: 'What do you "break" with a total stranger to start a friendly conversation?', a: ['the ice'] },
    { q: 'What are you told to let lie, instead of stirring up trouble from the past?', a: ['sleeping dogs', 'dogs'] },
    { q: 'What does the early bird famously catch, according to the old saying?', a: ['the worm', 'worm'] },
    { q: 'What do you accidentally "spill" when you let a secret slip out?', a: ['the beans', 'beans'] },
    { q: 'What do you "hit" when you head off to bed and fall asleep quickly?', a: ['the hay', 'hay', 'the sack', 'sack'] },
    { q: 'What has a little cap that pops off, yet the object underneath never had a head at all?', a: ['a pen', 'pen'] },
    { q: "What kind of 'coat' does a bear wear every single day of its life, and can never take off?", a: ['fur'] },
    { q: 'What is famously said to "fly" even though it has absolutely no wings?', a: ['time'] },
    { q: 'What has numbers you spin to open a safe, yet never once tells you what time it is?', a: ['a combination lock', 'combination lock'] },
    { q: 'What handheld device lights up the dark and usually runs on batteries?', a: ['a flashlight', 'flashlight'] },
    { q: 'What has soft bristles, is not alive, and cleans your teeth twice a day?', a: ['a toothbrush', 'toothbrush'] },
    { q: 'What white stick is used to write on a chalkboard, made from compressed calcium?', a: ['chalk'] },
    { q: 'What small bent piece of metal holds loose sheets of paper together without any glue?', a: ['a paperclip', 'paperclip', 'a paper clip', 'paper clip'] },
    { q: 'What sticky material comes on a roll and can join two pieces of paper together instantly?', a: ['tape'] },
    { q: 'What tool tells you exactly how heavy something is when you step on it?', a: ['a scale', 'scale'] },
    { q: 'What holds your pants up over your shoulders, without needing a belt at all?', a: ['suspenders'] },
    { q: 'What hard shell protects your head while riding a bike or motorcycle?', a: ['a helmet', 'helmet'] },
    { q: "What dark lenses protect your eyes from the sun's bright glare?", a: ['sunglasses'] },
    { q: 'What warm hand covering keeps all four fingers together instead of separated?', a: ['mittens'] },
    { q: 'What metal object, with unique grooves, is used to unlock a door?', a: ['a key', 'key'] },
    { q: 'What can carry a whole stack of books on your back on the walk to school?', a: ['a backpack', 'backpack'] },
    { q: 'What small pink or white tool removes pencil marks from paper?', a: ['an eraser', 'eraser'] },
    { q: 'What small device is used to keep a pencil sharp and ready to write?', a: ['a pencil sharpener', 'pencil sharpener'] },
    { q: 'What rooftop instrument spins to show you which way the wind is blowing?', a: ['a weather vane', 'weather vane'] },
    { q: 'What glowing object lights up a room the instant electricity flows through its filament?', a: ['a light bulb', 'light bulb', 'a lightbulb', 'lightbulb'] },
    { q: 'What can you flip to instantly turn a dark room bright again?', a: ['a light switch', 'light switch'] },
    { q: 'What appliance keeps your food cold so it does not spoil?', a: ['a refrigerator', 'refrigerator', 'a fridge', 'fridge'] },
    { q: 'What kitchen appliance heats up leftovers in just a couple of minutes using invisible waves?', a: ['a microwave', 'microwave'] },
    { q: 'What appliance scrubs and rinses your dirty dishes so you never have to do it by hand?', a: ['a dishwasher', 'dishwasher'] },
    { q: 'What machine spins your wet clothes around and around until they are dry?', a: ['a dryer', 'dryer'] },
    { q: 'What machine washes your dirty clothes using water, soap, and a good spin cycle?', a: ['a washing machine', 'washing machine'] },
    { q: 'What long-handled tool with bristles is used to sweep a floor clean?', a: ['a broom', 'broom'] },
    { q: 'What household machine sucks up dust and crumbs from your carpet?', a: ['a vacuum', 'vacuum', 'a vacuum cleaner', 'vacuum cleaner'] },
    { q: 'What tool has absorbent strings and is used to clean up spills from a floor?', a: ['a mop', 'mop'] },
    { q: 'What container holds your garbage until it finally gets taken out?', a: ['a trash can', 'trash can', 'a garbage can', 'garbage can'] },
    { q: 'What small hole in a front door lets you see exactly who is standing outside?', a: ['a peephole', 'peephole'] },
    { q: 'What device rings loudly the moment someone presses the button by your front door?', a: ['a doorbell', 'doorbell'] },
    { q: 'What loud device warns your whole house if it senses smoke in the air?', a: ['a smoke detector', 'smoke detector', 'a smoke alarm', 'smoke alarm'] },
    { q: 'What large door at the front of a house opens automatically to let a car inside?', a: ['a garage door', 'garage door'] },
    { q: 'What machine is pushed across a yard to keep the grass neatly trimmed?', a: ['a lawnmower', 'lawnmower', 'a lawn mower', 'lawn mower'] },
    { q: 'What tool has a long handle and a flat metal blade, perfect for digging holes in the ground?', a: ['a shovel', 'shovel'] },
    { q: 'What tool has two handles and two sharp blades, used to cut paper or fabric?', a: ['scissors', 'a pair of scissors'] }
];

function getTodayDateString() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getDayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
}

function getTodaysRiddle() {
    return RIDDLES[getDayOfYear(new Date()) % RIDDLES.length];
}

// Lowercase, trim, collapse whitespace, and drop a leading article / trailing
// punctuation so "Echo", "echo.", and "an echo" are all treated the same.
function normalizeRiddleAnswer(str) {
    return str.trim().toLowerCase()
        .replace(/[.!?]+$/, '')
        .replace(/\s+/g, ' ')
        .replace(/^(a|an|the)\s+/, '');
}

function checkRiddleAnswer(userAnswer, riddle) {
    const normalizedUser = normalizeRiddleAnswer(userAnswer);
    return riddle.a.some(accepted => normalizeRiddleAnswer(accepted) === normalizedUser);
}

function initRiddle() {
    const today = getTodayDateString();
    if (!state.riddle || state.riddle.date !== today) {
        state.riddle = { date: today, solved: false };
        saveState();
    }
    renderRiddle();
}

function renderRiddle() {
    const riddle = getTodaysRiddle();
    const qEl = document.getElementById('riddleQuestion');
    const inputEl = document.getElementById('riddleAnswerInput');
    const feedbackEl = document.getElementById('riddleFeedback');
    const submitBtn = document.querySelector('#riddleForm button');
    if (!qEl || !inputEl || !feedbackEl) return;

    qEl.textContent = riddle.q;

    const solved = state.riddle && state.riddle.solved;
    inputEl.disabled = !!solved;
    if (submitBtn) submitBtn.disabled = !!solved;

    if (solved) {
        inputEl.value = riddle.a[0];
        feedbackEl.textContent = 'Solved! Come back tomorrow for a new riddle.';
        feedbackEl.className = 'riddle-feedback correct';
    } else {
        inputEl.value = '';
        feedbackEl.textContent = '';
        feedbackEl.className = 'riddle-feedback';
    }
}

function submitRiddleAnswer(e) {
    e.preventDefault();
    if (!state.riddle || state.riddle.solved) return;

    const inputEl = document.getElementById('riddleAnswerInput');
    const feedbackEl = document.getElementById('riddleFeedback');
    const value = inputEl.value;
    if (!value.trim()) return;

    if (checkRiddleAnswer(value, getTodaysRiddle())) {
        state.riddle.solved = true;
        saveState();
        feedbackEl.textContent = 'Correct! 🎉';
        feedbackEl.className = 'riddle-feedback correct';
        inputEl.disabled = true;
        const submitBtn = document.querySelector('#riddleForm button');
        if (submitBtn) submitBtn.disabled = true;
        showToast('Riddle solved! 🧩', 'success');
    } else {
        feedbackEl.textContent = 'Not quite — try again!';
        feedbackEl.className = 'riddle-feedback incorrect';
    }
}

function toggleRiddleCollapsed() {
    const widget = document.getElementById('riddleWidget');
    if (widget) widget.classList.toggle('collapsed');
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

// A dedicated Web Worker pings once a second on its own thread to run the alarm
// check. Because it isn't the page's main thread, it keeps firing while the tab is
// backgrounded and isn't delayed by main-thread work — so alarms still go off on a
// different tab. The worker only signals; the actual check (with a wall-clock
// comparison) runs here on the main thread. checkAlarms() is idempotent, so the
// overlap with the main ticker never double-rings.
let alarmWorker = null;

function startAlarmWorker() {
    if (alarmWorker || typeof Worker === 'undefined') return;
    try {
        const workerSrc =
            'var t=null;' +
            'onmessage=function(e){' +
            'if(e.data==="start"){if(!t){t=setInterval(function(){postMessage("tick");},1000);}}' +
            'else if(e.data==="stop"){if(t){clearInterval(t);t=null;}}' +
            '};';
        const url = URL.createObjectURL(new Blob([workerSrc], { type: 'application/javascript' }));
        alarmWorker = new Worker(url);
        alarmWorker.onmessage = function () {
            checkAlarms();
            updateAlarmCountdowns();
            checkTimer();
        };
        alarmWorker.postMessage('start');
    } catch (e) {
        alarmWorker = null; // no worker — the main-thread ticker still handles alarms
    }
}

// Global Ticker to update UI dynamically for active stopwatches
function startTicker() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
        // Fire any alarms / the timer that are due, then refresh their readouts
        checkAlarms();
        updateAlarmCountdowns();
        checkTimer();
        updateTimerDisplay();

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
    renderTimer();
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
        initCardDragging(act);
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

    // Populate center total as hrs:min:sec
    totalHoursEl.textContent = formatDuration(totalDuration);

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
        
        // Add legend item — show the actual tracked time as hrs:min:sec
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${cat.color}"></span>
            <span style="font-weight: 500;">${cat.name}</span>
            <span class="legend-percent">${percentage.toFixed(0)}% (${formatDuration(cat.duration)})</span>
        `;
        legendEl.appendChild(legendItem);
        
        // Accumulate offset (since chart starts at -90deg, stroke offsets align backwards)
        accumulatedAngle -= segmentLength;
    });
}

// Data Actions utilities
// Save a full JSON backup of activities, logs and theme — re-importable via "Upload JSON".
function exportJSON() {
    if (state.activities.length === 0 && state.logs.length === 0) {
        showToast('Nothing to save yet — add an activity first.', 'warning');
        return;
    }

    // Alarms and the timer are session-only and intentionally not backed up.
    const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        activities: state.activities,
        logs: state.logs,
        theme: state.theme,
        accentColor: state.accentColor,
        specialTheme: state.specialTheme,
        customBackgroundImage: state.customBackgroundImage,
        customBackgroundIsDark: state.customBackgroundIsDark
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
                if (importedData.theme === 'dark' || importedData.theme === 'light' || importedData.theme === 'auto') {
                    state.theme = importedData.theme;
                }
                if (importedData.accentColor && ACCENTS[importedData.accentColor]) state.accentColor = importedData.accentColor;
                if (importedData.customBackgroundImage) state.customBackgroundImage = importedData.customBackgroundImage;
                if (typeof importedData.customBackgroundIsDark === 'boolean') state.customBackgroundIsDark = importedData.customBackgroundIsDark;
                if (importedData.specialTheme === 'custom') {
                    state.specialTheme = state.customBackgroundImage ? 'custom' : 'default';
                } else if (importedData.specialTheme && THEME_TYPES[importedData.specialTheme]) {
                    state.specialTheme = importedData.specialTheme;
                }

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
                applySpecialTheme(state.specialTheme);
                renderThemeTypeButtons();
                renderAccentSwatches();
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
        ringingQueue = [];
        stopRingtone();
        hideRingingOverlay();
        hideTimerOverlay();
        stopAlarmAttention();
        resetTimer();
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

// --- Ringtone engine ---
// The ringtone plays through a single <audio> element (not Web Audio oscillators),
// because a media element keeps playing when the tab is in the background — a
// setTimeout/oscillator loop gets throttled and goes silent. Each synthesized
// ringtone is rendered once to an in-memory WAV (one loop cycle) and the <audio>
// element loops it, so it rings continuously like a real alarm clock.
let previewTimeout = null;        // auto-stop timer for ringtone previews
let ringtoneWavUrls = {};         // ringtone key -> blob URL (one WAV loop cycle)
let ringtonesPreparing = null;    // Promise while WAVs are being generated
let silentWavUrl = null;          // tiny silent clip used to prime the element

function getAlarmAudioEl() {
    return document.getElementById('alarmAudio');
}

// Called on the first user gesture: build the ringtone WAVs and "prime" the audio
// element (a gesture-initiated play) so it is allowed to play later — including
// while the tab is inactive.
function unlockAudio() {
    prepareRingtones();
    primeAlarmAudio();
}

function primeAlarmAudio() {
    const audio = getAlarmAudioEl();
    if (!audio || audio.dataset.primed === '1') return;
    // If the ringtone is already sounding, it's obviously unlocked — don't touch it.
    if (audio.loop && !audio.paused) { audio.dataset.primed = '1'; return; }
    const url = getSilentWavUrl();
    if (!url) return;
    audio.dataset.primed = '1'; // a gesture occurred — the element is now unlocked
    try {
        // Play a short SILENT clip (non-looping) so it plays out on its own in
        // ~0.15s. No async pause, so it never interrupts a ringtone that a preview
        // or alarm starts right after this in the same gesture.
        audio.src = url;
        audio.loop = false;
        audio.muted = false;
        audio.volume = 1;
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
    } catch (e) { /* ignore */ }
}

// Render every ringtone to a looping WAV (offline, no gesture needed). Idempotent.
function prepareRingtones() {
    if (ringtonesPreparing) return ringtonesPreparing;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) { ringtonesPreparing = Promise.resolve(); return ringtonesPreparing; }
    const jobs = Object.keys(RINGTONES).map(key =>
        renderRingtoneToUrl(RINGTONES[key], OAC)
            .then(url => { ringtoneWavUrls[key] = url; })
            .catch(() => {})
    );
    ringtonesPreparing = Promise.all(jobs);
    return ringtonesPreparing;
}

function renderRingtoneToUrl(def, OAC) {
    const sampleRate = 44100;
    const cycleLen = def.notes.reduce((s, n) => s + n.d, 0);
    const frames = Math.max(1, Math.ceil(cycleLen * sampleRate));
    const offline = new OAC(1, frames, sampleRate);
    const master = offline.createGain();
    master.gain.value = 0.7;
    master.connect(offline.destination);

    let t = 0;
    def.notes.forEach(note => {
        if (note.f > 0) {
            const osc = offline.createOscillator();
            const g = offline.createGain();
            osc.type = def.type;
            osc.frequency.value = note.f;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(1, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + note.d);
            osc.connect(g);
            g.connect(master);
            osc.start(t);
            osc.stop(t + note.d);
        }
        t += note.d;
    });

    return offline.startRendering().then(buf =>
        URL.createObjectURL(new Blob([audioBufferToWav(buf)], { type: 'audio/wav' }))
    );
}

// A short silent WAV used only to unlock the audio element during a user gesture.
function getSilentWavUrl() {
    if (silentWavUrl) return silentWavUrl;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return '';
    const sr = 44100;
    const frames = Math.ceil(0.15 * sr);
    const octx = new OAC(1, frames, sr);
    const buf = octx.createBuffer(1, frames, sr); // all zeros = silence
    silentWavUrl = URL.createObjectURL(new Blob([audioBufferToWav(buf)], { type: 'audio/wav' }));
    return silentWavUrl;
}

// Encode an AudioBuffer as a 16-bit PCM WAV (ArrayBuffer).
function audioBufferToWav(buffer) {
    const numCh = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const blockAlign = numCh * 2;
    const dataSize = numFrames * blockAlign;
    const ab = new ArrayBuffer(44 + dataSize);
    const view = new DataView(ab);
    let offset = 0;
    const wstr = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i)); };
    const u32 = (v) => { view.setUint32(offset, v, true); offset += 4; };
    const u16 = (v) => { view.setUint16(offset, v, true); offset += 2; };
    wstr('RIFF'); u32(36 + dataSize); wstr('WAVE');
    wstr('fmt '); u32(16); u16(1); u16(numCh); u32(sampleRate);
    u32(sampleRate * blockAlign); u16(blockAlign); u16(16);
    wstr('data'); u32(dataSize);
    const chans = [];
    for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
    for (let i = 0; i < numFrames; i++) {
        for (let c = 0; c < numCh; c++) {
            let s = Math.max(-1, Math.min(1, chans[c][i]));
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(offset, s, true); offset += 2;
        }
    }
    return ab;
}

// Start looping the chosen ringtone through the <audio> element.
function playRingtone(key) {
    if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
    const audio = getAlarmAudioEl();
    if (!audio) return;

    const startWith = (url) => {
        if (!url) return;
        try {
            audio.src = url;
            audio.loop = true;
            audio.muted = false;
            audio.volume = 0.7;
            audio.currentTime = 0;
            const p = audio.play();
            if (p && p.catch) p.catch(() => {});
        } catch (e) { /* ignore */ }
    };

    if (ringtoneWavUrls[key]) {
        startWith(ringtoneWavUrls[key]);
    } else {
        // WAVs not generated yet — build them, then play
        prepareRingtones().then(() =>
            startWith(ringtoneWavUrls[key] || ringtoneWavUrls[Object.keys(RINGTONES)[0]])
        );
    }
}

function stopRingtone() {
    const audio = getAlarmAudioEl();
    if (!audio) return;
    try {
        audio.pause();
        audio.loop = false;
        audio.currentTime = 0;
    } catch (e) { /* ignore */ }
}

// Is the ringtone currently sounding?
function isRingtonePlaying() {
    const audio = getAlarmAudioEl();
    return !!(audio && audio.loop && !audio.paused);
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
        if (el.id === 'alarmAudio') return; // never pause our own ringtone
        if (!el.paused) {
            try { el.pause(); } catch (e) {}
        }
    });
    if (stopPreview) {
        stopRingtone();
        resetPreview();
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

// --- Ringtone preview (shared by the alarm and timer ringtone pickers) ---
let activePreviewBtnId = null;

function previewRingtone(selectId, btnId) {
    // If a preview is already playing, treat the click as "stop".
    if (previewTimeout) {
        stopRingtone();
        resetPreview();
        return;
    }
    if (ringingQueue.length > 0) return; // don't fight a live alarm

    const sel = document.getElementById(selectId);
    if (!sel) return;
    unlockAudio();
    playRingtone(sel.value);
    activePreviewBtnId = btnId;
    setPreviewIcon(btnId, true);
    previewTimeout = setTimeout(() => {
        stopRingtone();
        resetPreview();
    }, 3500);
}

// Clear the preview timer and restore the active preview button's icon.
function resetPreview() {
    if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
    if (activePreviewBtnId) {
        setPreviewIcon(activePreviewBtnId, false);
        activePreviewBtnId = null;
    }
}

function setPreviewIcon(btnId, playing) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.innerHTML = `<i data-lucide="${playing ? 'square' : 'play'}"></i>`;
    btn.title = playing ? 'Stop preview' : 'Preview ringtone';
    lucide.createIcons();
}

function populateRingtoneOptions() {
    ['alarmRingtone', 'timerRingtone'].forEach((id) => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '';
        Object.keys(RINGTONES).forEach((key, i) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = RINGTONES[key].name;
            if (i === 0) opt.selected = true;
            sel.appendChild(opt);
        });
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
// TIMER (countdown)
// - Toggled from the header "Timer" button (hidden by default).
// - Fully customizable: duration (H/M/S), quick presets, label, ringtone.
// - When it reaches zero it rings AND stops every running stopwatch.
// - Session-only (not persisted). Driven by the same ticker + Web Worker as
//   the alarm, so it also fires while the tab is in the background.
// =======================================================================

function toggleTimerPanel() {
    const card = document.getElementById('timerCard');
    const btn = document.getElementById('btnToggleTimer');
    if (!card) return;

    const willShow = card.classList.contains('timer-hidden');
    card.classList.toggle('timer-hidden', !willShow);
    if (btn) btn.classList.toggle('active', willShow);

    if (willShow) {
        renderTimer();
        unlockAudio(); // gesture — prime audio so the timer can ring in a background tab
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Read the H / M / S setup inputs into a total number of seconds.
function readTimerSetupSeconds() {
    const h = Math.max(0, parseInt(document.getElementById('timerHours').value, 10) || 0);
    const m = Math.max(0, parseInt(document.getElementById('timerMinutes').value, 10) || 0);
    const s = Math.max(0, parseInt(document.getElementById('timerSeconds').value, 10) || 0);
    return h * 3600 + m * 60 + s;
}

function applyTimerPreset(seconds) {
    document.getElementById('timerHours').value = Math.floor(seconds / 3600);
    document.getElementById('timerMinutes').value = Math.floor((seconds % 3600) / 60);
    document.getElementById('timerSeconds').value = seconds % 60;
}

function startTimer() {
    const total = readTimerSetupSeconds();
    if (total <= 0) {
        showToast('Set a duration greater than zero.', 'warning');
        return;
    }
    timer.label = document.getElementById('timerLabel').value.trim();
    timer.ringtone = document.getElementById('timerRingtone').value || 'classic';
    timer.configuredSeconds = total;
    timer.remainingSeconds = total;
    timer.endTime = Date.now() + total * 1000;
    timer.isRunning = true;
    timer.active = true;
    unlockAudio(); // gesture — prime audio for background ringing
    renderTimer();
    showToast(`Timer started for ${formatTimerTime(total)}`, 'success');
}

function toggleTimerPause() {
    if (!timer.active) return;
    if (timer.isRunning) {
        timer.remainingSeconds = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
        timer.isRunning = false;
        timer.endTime = null;
    } else {
        timer.isRunning = true;
        timer.endTime = Date.now() + timer.remainingSeconds * 1000;
    }
    renderTimer();
}

function resetTimer() {
    timer.isRunning = false;
    timer.active = false;
    timer.endTime = null;
    timer.remainingSeconds = timer.configuredSeconds;
    renderTimer();
}

// Runs every tick (main thread + worker). Fires the timer when it reaches zero.
function checkTimer() {
    if (timer.active && timer.isRunning && timer.endTime && Date.now() >= timer.endTime) {
        fireTimer();
    }
}

function fireTimer() {
    timer.isRunning = false;
    timer.active = false;
    timer.endTime = null;
    timer.remainingSeconds = 0;

    // Requirement: when the timer rings, stop every running stopwatch.
    const pausedCount = pauseAllRunningStopwatches();
    resetPreview(); // stop any ringtone preview
    renderActivities();
    renderTimer();  // fall back to the setup view underneath the overlay

    playRingtone(timer.ringtone);
    showTimerOverlay(pausedCount);
    startAlarmAttention(); // flash the tab title + buzz (shared with the alarm)
}

function dismissTimer() {
    stopRingtone();
    stopAlarmAttention();
    hideTimerOverlay();
}

function showTimerOverlay(pausedCount) {
    const overlay = document.getElementById('timerRingOverlay');
    if (!overlay) return;
    document.getElementById('timerRingLabel').textContent =
        (timer.label && timer.label.trim()) ? timer.label : "Time's up!";
    document.getElementById('timerRingTime').textContent = 'Finished at ' + formatClockTime(Date.now());
    document.getElementById('timerRingExtra').textContent =
        pausedCount > 0 ? `Stopped ${pausedCount} running stopwatch${pausedCount > 1 ? 'es' : ''}` : '';
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    lucide.createIcons();
}

function hideTimerOverlay() {
    const overlay = document.getElementById('timerRingOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

// Full render: switches between the setup and running views + button/icon states.
function renderTimer() {
    const setup = document.getElementById('timerSetup');
    const running = document.getElementById('timerRunning');
    if (!setup || !running) return;

    if (timer.active) {
        setup.style.display = 'none';
        running.style.display = 'block';

        const remaining = timer.isRunning
            ? Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000))
            : timer.remainingSeconds;
        document.getElementById('timerDisplay').textContent = formatTimerTime(remaining);
        document.getElementById('timerLabelDisplay').textContent = timer.label || '';

        const endsAt = document.getElementById('timerEndsAt');
        if (endsAt) {
            endsAt.textContent = timer.isRunning ? 'Ends at ' + formatClockTime(timer.endTime) : 'Paused';
        }

        const bar = document.getElementById('timerProgressBar');
        if (bar && timer.configuredSeconds > 0) {
            bar.style.width = Math.max(0, Math.min(100, (remaining / timer.configuredSeconds) * 100)) + '%';
        }

        const btn = document.getElementById('btnTimerPauseResume');
        if (btn) {
            btn.innerHTML = timer.isRunning
                ? '<i data-lucide="pause"></i><span>Pause</span>'
                : '<i data-lucide="play"></i><span>Resume</span>';
        }
    } else {
        setup.style.display = 'block';
        running.style.display = 'none';
    }
    lucide.createIcons();
}

// Lightweight per-second update of just the countdown text + progress bar.
function updateTimerDisplay() {
    if (!timer.active || !timer.isRunning || !timer.endTime) return;
    const remaining = Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
    const disp = document.getElementById('timerDisplay');
    if (disp) disp.textContent = formatTimerTime(remaining);
    const bar = document.getElementById('timerProgressBar');
    if (bar && timer.configuredSeconds > 0) {
        bar.style.width = Math.max(0, Math.min(100, (remaining / timer.configuredSeconds) * 100)) + '%';
    }
}

function formatTimerTime(totalSeconds) {
    totalSeconds = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
