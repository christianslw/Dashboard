// ==========================================
// Global State & Configuration
// ==========================================

let standorte = typeof standorteDaten !== 'undefined' ? standorteDaten : [
    {nummer: "8100", name: "Aalen", lat: 48.860833, lon: 10.1375, link: "https://suedwestrundfunk.sharepoint.com/.../8100_2013xxxx_Tagebuch.xlsx"},
    {nummer: "8317", name: "Westheim", lat: 49.041111, lon: 9.744444, link: "https://.../8317_00000000_Tagebuch.xlsx"}
];

let userLat = null, userLon = null, currentStandort = null;
let selectedListItemId = null;
let currentRouteLayer = null;
let currentZufahrtLayer = null;
let leafletMap = null;
let markerClusterGroup = null;
let favoriteStationNumbers = new Set();
let includedAreaCodes = new Set();
let excludedAreaCodes = new Set();
let favoriteFilterMode = 'all';
const warningsCache = {}, routeCache = {};

// ==========================================
// Theme
// ==========================================

// Registry of custom themes from the themes/ folder.
// Each entry: { id: 'css-class-on-html', label: 'Display Name', file: 'themes/filename.css' }
// To add a new theme: create a .css file in themes/, then add an entry here.
const customThemes = [
    { id: 'playful', label: 'Dracula', file: 'themes/dracula.css' },
    // { id: 'nord', label: 'Nord', file: 'themes/nord.css' },
];

/** Remove any previously loaded custom-theme <link> and HTML class */
function _removeCustomTheme() {
    const old = document.getElementById('custom-theme-css');
    if (old) old.remove();
    customThemes.forEach(t => document.documentElement.classList.remove(t.id));
}

/** Load a custom theme's CSS file dynamically */
function _loadCustomThemeCSS(theme) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.id = 'custom-theme-css';
    link.href = theme.file;
    document.head.appendChild(link);
    document.documentElement.classList.add(theme.id);
}

/** Populate the theme <select> dropdown with base + custom themes */
function populateThemeSelect() {
    const sel = document.getElementById('themeSelect');
    if (!sel) return;
    sel.innerHTML = '';

    // Base options
    const baseOptions = [
        { value: 'system', label: 'System-Design' },
        { value: 'light',  label: 'Helles Design' },
        { value: 'dark',   label: 'Dunkles Design (OLED)' },
    ];
    baseOptions.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value;
        opt.textContent = o.label;
        sel.appendChild(opt);
    });

    // Custom themes from the registry
    customThemes.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.label;
        sel.appendChild(opt);
    });
}

function changeTheme(theme) {
    _removeCustomTheme();

    const custom = customThemes.find(t => t.id === theme);
    if (custom) {
        _loadCustomThemeCSS(custom);
        // Dracula-like themes force dark mode context
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    } else if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
}
