// ==========================================
// Leaflet Map & Clustering
// ==========================================

function initLeafletMap() {
    leafletMap = L.map('mainMap').setView([48.6, 9.2], 7);

    const isDarkMode = !document.documentElement.classList.contains('light');
    const isPlayfulTheme = document.documentElement.classList.contains('playful');
    const useDarkMap = isDarkMode || isPlayfulTheme;

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    });

    const cartoDBPositronLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${useDarkMap ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`, {
        attribution: '© CartoDB © OpenStreetMap contributors',
        maxZoom: 19
    });

    const openTopoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap',
        maxZoom: 17,
        className: 'no-filter'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri, DigitalGlobe, Earthstar Geographics',
        maxZoom: 19,
        className: 'no-filter'
    });

    if (useDarkMap) {
        cartoDBPositronLayer.addTo(leafletMap);
    } else {
        osmLayer.addTo(leafletMap);
    }

    const hybridLayer = L.layerGroup([
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19,
            className: 'no-filter'
        }),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19,
            className: 'no-filter'
        }),
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19,
            className: 'no-filter'
        })
    ]);

    const baseLayers = {
        'OpenStreetMap': osmLayer,
        'CartoDB Positron': cartoDBPositronLayer,
        'OpenTopoMap': openTopoMapLayer,
        'Satellitenbild': satelliteLayer,
        'Hybrid (Satellit+Straßen)': hybridLayer
    };

    L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(leafletMap);
}

function updateMapMarkers(liste) {
    if (markerClusterGroup) {
        leafletMap.removeLayer(markerClusterGroup);
    }

    const colors = {
        1: '#8b5cf6',
        2: '#10b981',
        3: '#f59e0b',
        4: '#ef4444',
        5: '#ec4899',
        6: '#06b6d4',
        8: '#6366f1',
        9: '#eab308'
    };

    markerClusterGroup = L.markerClusterGroup({
        maxClusterRadius: 40,
        disableClusteringAtZoom: 12,
        iconCreateFunction: function (cluster) {
            const count = cluster.getChildCount();
            const childMarkers = cluster.getAllChildMarkers();

            const prefixCounts = {};
            childMarkers.forEach(m => {
                const prefix = m.options.prefix;
                prefixCounts[prefix] = (prefixCounts[prefix] || 0) + 1;
            });

            const dominantPrefix = Object.keys(prefixCounts).reduce((a, b) =>
                prefixCounts[a] > prefixCounts[b] ? a : b
            );
            const clusterColor = colors[dominantPrefix] || '#3b82f6';

            return L.divIcon({
                html: `<div style="background-color: ${clusterColor}; color: white; font-weight: bold; font-size: 12px; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
                className: 'custom-cluster-icon',
                iconSize: [32, 32]
            });
        }
    });

    liste.forEach(s => {
        if (!s.lat || !s.lon) return;
        const prefix = Math.floor(s.nummer / 1000);
        const markerColor = colors[prefix] || '#3b82f6';
        const isFav = isFavorite(s.nummer);

        const isMainStation = parseInt(s.nummer) % 1000 === 0;
        const markerSize = isMainStation ? 24 : 14;
        const iconSize = isMainStation ? [24, 24] : [14, 14];
        const anchorOffset = isMainStation ? 12 : 7;
        const starSize = isMainStation ? 28 : 20;

        const smallMarker = isFav
            ? L.divIcon({
                html: `<div style="width:${starSize}px;height:${starSize}px;display:flex;align-items:center;justify-content:center;color:${markerColor};font-size:${starSize}px;line-height:1;text-shadow:-1px -1px 0 #fff,1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff,0 2px 4px rgba(0,0,0,0.3);">★</div>`,
                className: 'custom-small-marker',
                iconSize: [starSize, starSize],
                iconAnchor: [Math.round(starSize / 2), Math.round(starSize / 2)]
            })
            : L.divIcon({
                html: `<div style="width: ${markerSize}px; height: ${markerSize}px; background-color: ${markerColor}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); box-sizing: border-box;"></div>`,
                className: 'custom-small-marker',
                iconSize: iconSize,
                iconAnchor: [anchorOffset, anchorOffset]
            });

        const marker = L.marker([s.lat, s.lon], { icon: smallMarker, prefix: prefix });
        marker.bindTooltip(`<b>${s.nummer}</b> ${s.name}${isFav ? ' ★' : ''}`, { direction: 'top', offset: [0, -10] });
        marker.on('click', (e) => {
            if (e.originalEvent.shiftKey) {
                openTagebuch(s.nummer);
            } else if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
                openRouteNavigation(s.nummer);
            } else {
                selectFromList(s.nummer);
            }
        });
        markerClusterGroup.addLayer(marker);
    });

    leafletMap.addLayer(markerClusterGroup);

    if (liste.length > 0) {
        if (liste.length === 1 && liste[0].zufahrt && liste[0].zufahrt.length > 0) {
            const routeLatLngs = liste[0].zufahrt.map(coord => [coord[1], coord[0]]);

            currentZufahrtLayer = L.polyline(routeLatLngs, {
                color: '#ef4444',
                weight: 5,
                dashArray: '10, 10',
                opacity: 0.9,
                lineCap: 'round'
            }).addTo(leafletMap);

            const bounds = currentZufahrtLayer.getBounds();
            bounds.extend([liste[0].lat, liste[0].lon]);
            leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 20, animate: true });
        } else {
            leafletMap.fitBounds(markerClusterGroup.getBounds(), { padding: [30, 30], maxZoom: 12, animate: true });
        }
    }
}

function focusMapOnStandort(nummer) {
    const standort = standorte.find(s => String(s.nummer) === String(nummer));
    if (!standort || !standort.lat || !standort.lon || !leafletMap) return;

    if (currentZufahrtLayer) {
        leafletMap.removeLayer(currentZufahrtLayer);
        currentZufahrtLayer = null;
    }

    if (standort.zufahrt && standort.zufahrt.length > 0) {
        const routeLatLngs = standort.zufahrt.map(coord => [coord[1], coord[0]]);
        currentZufahrtLayer = L.polyline(routeLatLngs, {
            color: '#ef4444',
            weight: 5,
            dashArray: '10, 10',
            opacity: 0.9,
            lineCap: 'round'
        }).addTo(leafletMap);

        const bounds = currentZufahrtLayer.getBounds();
        bounds.extend([standort.lat, standort.lon]);
        leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 17, animate: true });
    } else {
        leafletMap.setView([standort.lat, standort.lon], 13, { animate: true });
    }
}
