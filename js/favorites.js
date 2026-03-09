// ==========================================
// Favorites
// ==========================================

function loadFavorites() {
    try {
        const saved = localStorage.getItem('favoriteStations');
        if (!saved) {
            favoriteStationNumbers = new Set();
            return;
        }
        const parsed = JSON.parse(saved);
        favoriteStationNumbers = new Set(Array.isArray(parsed) ? parsed.map(n => String(n)) : []);
    } catch {
        favoriteStationNumbers = new Set();
    }
}

function saveFavorites() {
    localStorage.setItem('favoriteStations', JSON.stringify(Array.from(favoriteStationNumbers)));
}

function isFavorite(nummer) {
    return favoriteStationNumbers.has(String(nummer));
}

function toggleFavorite(nummer, event) {
    if (event) {
        event.stopPropagation();
    }

    const key = String(nummer);
    if (favoriteStationNumbers.has(key)) {
        favoriteStationNumbers.delete(key);
    } else {
        favoriteStationNumbers.add(key);
    }

    saveFavorites();
    filterStandorte();

    if (currentStandort && String(currentStandort.nummer) === key) {
        updateDashboardFavoriteButton();
    }
}

function toggleCurrentDashboardFavorite(event) {
    if (!currentStandort) return;
    toggleFavorite(currentStandort.nummer, event);
}

function updateDashboardFavoriteButton() {
    const btn = document.getElementById('dashFavoriteBtn');
    if (!btn || !currentStandort) return;

    if (isFavorite(currentStandort.nummer)) {
        btn.className = 'ml-2 transition-colors text-amber-500 hover:text-amber-600';
    } else {
        btn.className = 'ml-2 transition-colors text-slate-300 dark:text-zinc-600 hover:text-amber-500';
    }
}
