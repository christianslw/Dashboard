// ==========================================
// Dashboard & Way Instructions
// ==========================================

function openDashboard(nummer) {
    const standort = standorte.find(s => String(s.nummer) === String(nummer));
    if (!standort) return;
    currentStandort = standort;

    focusMapOnStandort(standort.nummer);
    highlightListItem(nummer);

    const modal = document.getElementById("dashboardModal");

    document.getElementById("dashTitleNum").innerText = standort.nummer;
    document.getElementById("dashTitleName").innerText = standort.name;
    updateDashboardFavoriteButton();

    document.getElementById("trafficAlertBox").classList.add("hidden");

    if (standort.distance) {
        document.getElementById("driveTimeValue").innerText = "Prüfe...";
        document.getElementById("driveDistValue").innerText = `${standort.distance.toFixed(1)} km`;
        fetchRealRouteTimeDashboard(userLat, userLon, standort.lat, standort.lon, standort.distance);
    } else {
        document.getElementById("driveTimeValue").innerText = "--";
        document.getElementById("driveDistValue").innerText = "Start fehlt";
    }

    document.getElementById("windyIframe").src = `https://embed.windy.com/embed.html?type=map&location=coordinates&lat=${standort.lat}&lon=${standort.lon}&zoom=11&overlay=wind&marker=true&metricWind=m/s`;

    document.getElementById("btnTagebuch").href = `${standort.link}?web=1`;
    const ordnerLink = standort.link.includes("/_standortinfo") ? standort.link.split("/_standortinfo")[0] : standort.link;
    document.getElementById("btnOrdner").href = ordnerLink;
    document.getElementById("btnRoute").href = `https://www.google.com/maps/dir/?api=1&destination=${standort.lat},${standort.lon}`;

    fetchWeather(standort.lat, standort.lon);
    updateDWDDetailBox(standort.lat, standort.lon);

    modal.classList.remove("hidden");
    modal.classList.add("modal-enter");
    setTimeout(() => modal.classList.add("modal-enter-active"), 10);

    displayWayInstructions();
}

function closeDashboard() {
    const modal = document.getElementById("dashboardModal");
    modal.classList.remove("modal-enter-active");
    document.getElementById("windyIframe").src = "";
    setTimeout(() => modal.classList.add("hidden"), 200);
}

async function fetchRealRouteTimeDashboard(lat1, lon1, lat2, lon2, fallbackDist) {
    try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
        if (!res.ok) throw new Error("API Limit");

        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
            const durationSec = data.routes[0].duration;
            const routeDistMeter = data.routes[0].distance;

            const mins = Math.round(durationSec / 60);
            document.getElementById("driveTimeValue").innerText = mins < 60 ? `${mins} Min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;

            const avgSpeedKmh = (routeDistMeter / 1000) / (durationSec / 3600);
            if (avgSpeedKmh < 45 && routeDistMeter > 10000) {
                document.getElementById("trafficAlertBox").classList.remove("hidden");
                document.getElementById("trafficAlertText").innerText = "Langsame Routenführung. Möglicherweise Baustellen oder hohes Verkehrsaufkommen.";
            } else if (avgSpeedKmh < 30) {
                document.getElementById("trafficAlertBox").classList.remove("hidden");
                document.getElementById("trafficAlertText").innerText = "Sehr langsame Route. Stadtverkehr oder starker Stau erwartet.";
            }
        }
    } catch (e) {
        document.getElementById("driveTimeValue").innerText = calcDriveTimeFallback(fallbackDist);
    }
}

function copyCoords() {
    if (!currentStandort) return;
    navigator.clipboard.writeText(`${currentStandort.lat}, ${currentStandort.lon}`);
    const btnText = document.querySelector('button[onclick="copyCoords()"] span');
    const oldText = btnText.innerText;
    btnText.innerText = "Kopiert!";
    setTimeout(() => btnText.innerText = oldText, 2000);
}

// ==========================================
// Way Instructions (Route Notes)
// ==========================================

function getWayInstructions(nummer) {
    const stored = localStorage.getItem(`wayInstructions_${nummer}`);
    return stored ? stored : null;
}

function saveWayInstructionsToStorage(nummer, instructions) {
    if (instructions.trim() === '') {
        localStorage.removeItem(`wayInstructions_${nummer}`);
    } else {
        localStorage.setItem(`wayInstructions_${nummer}`, instructions);
    }
}

function displayWayInstructions() {
    if (!currentStandort) return;
    const instructions = getWayInstructions(currentStandort.nummer);
    const display = document.getElementById('wayInstructionsDisplay');
    if (instructions) {
        display.innerText = instructions;
    } else {
        display.innerText = 'Keine Anweisungen';
    }
}

function editWayInstructions() {
    if (!currentStandort) return;
    document.getElementById('wayModalStationNum').innerText = currentStandort.nummer;
    const storedInstructions = getWayInstructions(currentStandort.nummer) || '';
    document.getElementById('wayInstructionsInput').value = storedInstructions;
    document.getElementById('wayInstructionsModal').classList.remove('hidden');
}

function closeWayInstructionsModal() {
    document.getElementById('wayInstructionsModal').classList.add('hidden');
}

function saveWayInstructions() {
    if (!currentStandort) return;
    const instructions = document.getElementById('wayInstructionsInput').value;
    saveWayInstructionsToStorage(currentStandort.nummer, instructions);
    displayWayInstructions();
    closeWayInstructionsModal();
}

function deleteWayInstructions() {
    if (!currentStandort) return;
    if (confirm('Fahrtanweisungen wirklich löschen?')) {
        saveWayInstructionsToStorage(currentStandort.nummer, '');
        displayWayInstructions();
        closeWayInstructionsModal();
    }
}
