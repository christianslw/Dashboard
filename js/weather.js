// ==========================================
// DWD Warnings & Weather
// ==========================================

async function fetchDWD(lat, lon) {
    const cacheKey = `${lat.toFixed(1)}_${lon.toFixed(1)}`;
    if (warningsCache[cacheKey] !== undefined) return warningsCache[cacheKey];

    try {
        const res = await fetch(`https://api.brightsky.dev/alerts?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error("DWD Limit");
        const data = await res.json();
        const activeAlerts = data.alerts || [];
        warningsCache[cacheKey] = activeAlerts;
        return activeAlerts;
    } catch (e) {
        warningsCache[cacheKey] = [];
        return [];
    }
}

function getDwdLevelBox(severity) {
    const normalizedSeverity = typeof severity === 'string' ? severity.toLowerCase() : '';
    const baseClass = "rounded-[4px] px-1.5 py-[2px] text-[10px] uppercase font-bold tracking-wide border";
    if (normalizedSeverity === 'minor')
        return `<span class="${baseClass} border-yellow-500 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Stufe 1</span>`;
    if (normalizedSeverity === 'moderate')
        return `<span class="${baseClass} border-orange-500 bg-orange-500/20 text-orange-700 dark:text-orange-400">Stufe 2</span>`;
    if (normalizedSeverity === 'severe')
        return `<span class="${baseClass} border-red-500 bg-red-500/20 text-red-700 dark:text-red-400">Stufe 3</span>`;
    if (normalizedSeverity === 'extreme')
        return `<span class="${baseClass} border-purple-600 bg-purple-600/20 text-purple-700 dark:text-purple-400">Stufe 4</span>`;
    return '';
}

function getDwdSeverityRank(severity) {
    const normalizedSeverity = typeof severity === 'string' ? severity.toLowerCase() : '';

    if (normalizedSeverity === 'extreme') return 4;
    if (normalizedSeverity === 'severe') return 3;
    if (normalizedSeverity === 'moderate') return 2;
    if (normalizedSeverity === 'minor') return 1;
    return 0;
}

function getHighestDwdAlert(alerts) {
    return alerts.reduce((highest, alert) => {
        if (getDwdSeverityRank(alert?.severity) < 1) return highest;
        if (!highest) return alert;
        return getDwdSeverityRank(alert.severity) > getDwdSeverityRank(highest.severity) ? alert : highest;
    }, null);
}

async function checkDWDWarningForList(lat, lon, boxId) {
    try {
        const alerts = await fetchDWD(lat, lon);
        const box = document.getElementById(boxId);
        const highestAlert = getHighestDwdAlert(alerts);

        if (box) {
            box.innerHTML = highestAlert ? getDwdLevelBox(highestAlert.severity) : '';
        }
    } catch (e) {}
}

async function updateDWDDetailBox(lat, lon) {
    const box = document.getElementById("dwdAlertBox");
    const title = document.getElementById("dwdAlertTitle");
    const text = document.getElementById("dwdAlertText");

    box.classList.remove("hidden");
    box.className = "p-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900";
    title.innerText = "Prüfe DWD...";
    text.innerText = "";
    title.className = "text-sm font-semibold text-slate-500";

    const alerts = await fetchDWD(lat, lon);
    const mainAlert = getHighestDwdAlert(alerts);

    if (!mainAlert) {
        title.innerText = "Keine amtlichen Warnungen";
        title.className = "text-sm font-semibold text-green-600 dark:text-green-500";
    } else {
        const isSevere = getDwdSeverityRank(mainAlert.severity) >= 3;
        box.className = `p-3 border-t ${isSevere ? 'bg-red-50/50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50' : 'bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/50'}`;
        title.innerText = mainAlert.headline_de || "Wetterwarnung";
        title.className = `text-sm font-bold ${isSevere ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`;
        text.innerText = mainAlert.description_de || "";
        text.className = `text-xs mt-1 ${isSevere ? 'text-red-600 dark:text-red-300' : 'text-orange-600 dark:text-orange-300'}`;
    }
}

async function fetchWeather(lat, lon) {
    document.getElementById("weatherTemp").innerText = "-- °C";
    document.getElementById("weatherDesc").innerText = "";
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        const code = data.current_weather.weathercode;
        document.getElementById("weatherTemp").innerText = `${data.current_weather.temperature} °C`;

        let wSvg = `<svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
        let wText = "Klar";

        if (code > 0) {
            wSvg = `<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
            wText = "Bewölkt";
        }
        if (code >= 51 && code <= 67) {
            wSvg = `<svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14v2m-4-2v2m8-2v2M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`;
            wText = "Regen";
        }
        if (code >= 95) {
            wSvg = `<svg class="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
            wText = "Gewitter";
        }

        document.getElementById("weatherIcon").innerHTML = wSvg;
        document.getElementById("weatherDesc").innerText = wText;
    } catch (e) {}
}
