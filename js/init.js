// ==========================================
// Initialization (runs after all modules loaded)
// ==========================================

window.onload = () => {
    populateThemeSelect();
    const theme = localStorage.getItem('theme') || 'system';
    document.getElementById('themeSelect').value = theme;
    changeTheme(theme);
    loadFavorites();
    loadFilterState();

    initLeafletMap();

    if (standorte.length > 0) {
        standorte.sort((a, b) => String(a.nummer).localeCompare(String(b.nummer)));
        initFilterMenu();
        loadSavedLocation();
    } else {
        document.getElementById("locationStatus").innerHTML = "Fehler: standorte.js fehlt.";
    }

    initTutorialHighlight();
};
