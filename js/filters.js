// ==========================================
// Filters
// ==========================================

function loadFilterState() {
    try {
        const saved = localStorage.getItem('stationFilterState');
        if (!saved) return;

        const parsed = JSON.parse(saved);
        includedAreaCodes = new Set(Array.isArray(parsed.includedAreaCodes) ? parsed.includedAreaCodes.map(String) : []);
        excludedAreaCodes = new Set(Array.isArray(parsed.excludedAreaCodes) ? parsed.excludedAreaCodes.map(String) : []);
        favoriteFilterMode = ['all', 'only', 'exclude'].includes(parsed.favoriteFilterMode) ? parsed.favoriteFilterMode : 'all';
    } catch {
        includedAreaCodes = new Set();
        excludedAreaCodes = new Set();
        favoriteFilterMode = 'all';
    }
}

function saveFilterState() {
    const payload = {
        includedAreaCodes: Array.from(includedAreaCodes),
        excludedAreaCodes: Array.from(excludedAreaCodes),
        favoriteFilterMode
    };
    localStorage.setItem('stationFilterState', JSON.stringify(payload));
}

function getStandortAreaCode(nummer) {
    const parsed = parseInt(String(nummer), 10);
    if (Number.isNaN(parsed)) return null;
    return String(Math.floor(parsed / 1000) * 1000);
}

function getAreaFilterState(areaCode) {
    if (includedAreaCodes.has(areaCode)) return 'include';
    if (excludedAreaCodes.has(areaCode)) return 'exclude';
    return 'neutral';
}

function getAvailableAreaCodes() {
    const areaCodes = [...new Set(standorte
        .map(s => getStandortAreaCode(s.nummer))
        .filter(code => code && code !== '0' && code !== '0000'))];
    return areaCodes.sort((a, b) => Number(a) - Number(b));
}

function toggleAreaChip(areaCode) {
    const state = getAreaFilterState(areaCode);

    if (state === 'neutral') {
        includedAreaCodes.add(areaCode);
        excludedAreaCodes.delete(areaCode);
    } else if (state === 'include') {
        includedAreaCodes.delete(areaCode);
        excludedAreaCodes.add(areaCode);
    } else {
        excludedAreaCodes.delete(areaCode);
    }

    renderAreaChips();
    updateActiveFilterCount();
    saveFilterState();
    filterStandorte();
}

function renderAreaChips() {
    const container = document.getElementById('areaChipsContainer');
    if (!container) return;

    container.innerHTML = '';
    const codes = getAvailableAreaCodes();
    codes.forEach(code => {
        const state = getAreaFilterState(code);
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.onclick = () => toggleAreaChip(code);

        const baseClass = 'text-xs px-2.5 py-1 rounded-full border transition-colors font-medium';
        if (state === 'include') {
            chip.className = `${baseClass} border-green-500 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
            chip.textContent = `${code} +`;
        } else if (state === 'exclude') {
            chip.className = `${baseClass} border-red-500 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
            chip.textContent = `${code} −`;
        } else {
            chip.className = `${baseClass} border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800`;
            chip.textContent = code;
        }

        container.appendChild(chip);
    });
}

function updateFavoriteModeButton() {
    const button = document.getElementById('favoriteModeButton');
    if (!button) return;

    if (favoriteFilterMode === 'only') {
        button.textContent = 'Favoriten: Nur einbeziehen';
    } else if (favoriteFilterMode === 'exclude') {
        button.textContent = 'Favoriten: Ausschließen';
    } else {
        button.textContent = 'Favoriten: Alle';
    }
}

function cycleFavoriteFilterMode() {
    if (favoriteFilterMode === 'all') {
        favoriteFilterMode = 'only';
    } else if (favoriteFilterMode === 'only') {
        favoriteFilterMode = 'exclude';
    } else {
        favoriteFilterMode = 'all';
    }

    updateFavoriteModeButton();
    updateActiveFilterCount();
    saveFilterState();
    filterStandorte();
}

function updateActiveFilterCount() {
    const badge = document.getElementById('activeFilterCount');
    if (!badge) return;

    const count = includedAreaCodes.size + excludedAreaCodes.size + (favoriteFilterMode === 'all' ? 0 : 1);
    badge.textContent = String(count);
    if (count > 0) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function resetAllFilters() {
    includedAreaCodes.clear();
    excludedAreaCodes.clear();
    favoriteFilterMode = 'all';

    renderAreaChips();
    updateFavoriteModeButton();
    updateActiveFilterCount();
    saveFilterState();
    filterStandorte();
}

function toggleFilterMenu() {
    const panel = document.getElementById('filterMenuPanel');
    if (!panel) return;
    panel.classList.toggle('hidden');
}

function closeFilterMenu() {
    const panel = document.getElementById('filterMenuPanel');
    if (!panel) return;
    panel.classList.add('hidden');
}

function initFilterMenu() {
    renderAreaChips();
    updateFavoriteModeButton();
    updateActiveFilterCount();

    document.addEventListener('click', (event) => {
        const panel = document.getElementById('filterMenuPanel');
        const wrapper = document.getElementById('filterMenuWrapper');
        if (!panel || !wrapper) return;
        if (!panel.classList.contains('hidden') && !wrapper.contains(event.target)) {
            panel.classList.add('hidden');
        }
    });
}

function getFilteredStandorte() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput ? searchInput.value.toLowerCase() : '';

    return standorte.filter(s => {
        const matchesSearch = String(s.nummer).toLowerCase().includes(query) ||
            String(s.name).toLowerCase().includes(query);

        const areaCode = getStandortAreaCode(s.nummer);
        const matchesIncludedAreas = includedAreaCodes.size === 0 || (areaCode && includedAreaCodes.has(areaCode));
        const matchesExcludedAreas = !(areaCode && excludedAreaCodes.has(areaCode));

        const isFav = isFavorite(s.nummer);
        const matchesFavorite = favoriteFilterMode === 'all' ||
            (favoriteFilterMode === 'only' && isFav) ||
            (favoriteFilterMode === 'exclude' && !isFav);

        return matchesSearch && matchesIncludedAreas && matchesExcludedAreas && matchesFavorite;
    });
}
