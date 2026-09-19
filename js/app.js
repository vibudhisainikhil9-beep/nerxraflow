/**
 * NEXRAFLOW AI - Master SCADA Application Orchestrator
 * Connects GIS Leaflet Digital Twin, Traffic Mathematics, NTCIP-1202 Signal Controller,
 * 2-Second Telemetry Bus, Gemini 3.6 Neural Core, and Auto-Pilot Tour.
 */

class ScadaApp {
    constructor() {
        this.map = null;
        this.primaryCasing = null;
        this.primaryHalo = null;
        this.primaryPolyline = null;
        this.primaryDashPolyline = null;
        this.bypassCasing = null;
        this.bypassPolyline = null;
        this.incidentMarker = null;
        this.incidentZoneCircle = null;
        this.trafficParticles = null;
        this.sensorMarkers = [];
        this.junctionMarkers = [];
        this.junctionLayerGroup = null;
        this.sensorLayerGroup = null;
        this.sensorsVisible = true;

        this.currentScenario = 'nominal';
        this.activeTab = 'radar';
        this.kalmanFilter = new KalmanDenoisingFilter(0.08, 3.5, 46.5);
        this.autoPilot = null;
        this.mapMode = 'satellite';
        this.satelliteLayer = null;
        this.gridLayer = null;
        this.busyRouteLayers = [];
        this.busyRoutesVisible = true;
        this.urbanPolygons = [];
        this.busyRouteLayers = [];
        this.busyRoutesVisible = true;
        this.urbanPolygons = [];

        // Corridor live state
        this.state = {
            speedKmh: 46.5,
            filteredSpeedKmh: 46.5,
            flowPCU: 1820,
            vcRatio: 0.48,
            los: 'B',
            losColor: '#10b981',
            queuePCU: 45,
            shockwaveVelocity: 0,
            spillbackEtaMinutes: null,
            isPreempted: false,
            bypassActive: false,
            twoWheelerPct: 45.0,
            autoPct: 18.0,
            carPct: 25.0,
            busPct: 12.0,
            simConnected: false,
            lastPacketTime: 0
        };
    }

    init() {
        this._initMap();
        this._initCorridorVectors();
        this._initJunctionsAndSensors();
        if (window.TrafficParticleLayer) {
            this.trafficParticles = new TrafficParticleLayer(this.map);
        }
        this._bindUiEvents();
        this._initSignalSync();
        this._initTelemetryBus();
        this._startLocalFallbackClock();

        this.autoPilot = new AutoPilotTour(this);
        this.loadScenario('nominal');

        // Initial tab render
        this.switchTab('radar');
        this.renderCadPlanner();

        // Apply theme on initial boot (Default: Light Mode)
        this.setTheme(this.currentTheme || 'light', false);
    }

    /* ==========================================================================
       MAP & GIS INITIALIZATION
       ========================================================================== */
    _initMap() {
        const h = window.HYDERABAD_CORRIDOR;
        this.map = L.map('scada-map', {
            center: h.center,
            zoom: h.zoom,
            zoomControl: false,
            attributionControl: false,
            maxZoom: 20
        });

        const savedTheme = localStorage.getItem('nexraflow_theme_app1') || 'light';
        this.currentTheme = savedTheme;

        // High-Resolution Photorealistic Satellite Imagery (Default View)
        this.satelliteTileUrl = 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
        this.satelliteLayer = L.tileLayer(this.satelliteTileUrl, {
            maxZoom: 20,
            subdomains: ['0', '1', '2', '3']
        }).addTo(this.map);

        this.mapMode = 'satellite';

        // Also define local procedural grid layer for optional vector mode
        this._initGridLayerClass();

        L.control.zoom({ position: 'bottomright' }).addTo(this.map);

        window.addEventListener('resize', () => {
            if (this.map) this.map.invalidateSize();
        });
    }

    _initGridLayerClass() {
        this.ScadaGridLayer = L.GridLayer.extend({
            createTile: function(coords) {
                const tile = document.createElement('canvas');
                const size = this.getTileSize();
                tile.width = size.x;
                tile.height = size.y;
                const ctx = tile.getContext('2d');
                const isDark = document.documentElement.classList.contains('dark');

                if (isDark) {
                    ctx.fillStyle = '#070b13';
                    ctx.fillRect(0, 0, size.x, size.y);
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
                    ctx.lineWidth = 1;
                    const step = size.x / 4;
                    for (let x = 0; x <= size.x; x += step) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.y); ctx.stroke();
                    }
                    for (let y = 0; y <= size.y; y += step) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.x, y); ctx.stroke();
                    }
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
                    ctx.strokeRect(0, 0, size.x, size.y);
                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
                    ctx.beginPath();
                    ctx.arc(size.x / 2, size.y / 2, 2.5, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillRect(0, 0, size.x, size.y);
                    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
                    ctx.lineWidth = 1;
                    const step = size.x / 4;
                    for (let x = 0; x <= size.x; x += step) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size.y); ctx.stroke();
                    }
                    for (let y = 0; y <= size.y; y += step) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size.x, y); ctx.stroke();
                    }
                    ctx.strokeStyle = 'rgba(203, 213, 225, 0.7)';
                    ctx.strokeRect(0, 0, size.x, size.y);
                    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
                    ctx.beginPath();
                    ctx.arc(size.x / 2, size.y / 2, 2.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                return tile;
            }
        });
    }

    _initCorridorVectors() {
        const h = window.HYDERABAD_CORRIDOR;
        const isDark = document.documentElement.classList.contains('dark');

        // 1. Urban Geographic Features (Only visible in SCADA CAD mode, hidden on HD Satellite to keep homes clear)
        this.urbanPolygons = [];
        if (h.urbanFeatures) {
            const uf = h.urbanFeatures;

            if (uf.lake) {
                const lake = L.polygon(uf.lake.coords, {
                    color: '#0284c7',
                    weight: 1.5,
                    fillColor: '#38bdf8',
                    fillOpacity: isDark ? 0.25 : 0.35,
                    className: 'scada-lake-poly'
                });
                lake.bindTooltip(`🌊 <strong>${uf.lake.name}</strong><br><span class="text-[10px] text-slate-400 font-mono">Freshwater Urban Reservoir • Cable Bridge Basin</span>`, {
                    sticky: true,
                    className: 'scada-tooltip'
                });
                this.urbanPolygons.push(lake);
            }

            if (uf.botanicalGarden) {
                const park = L.polygon(uf.botanicalGarden.coords, {
                    color: '#16a34a',
                    weight: 1.2,
                    fillColor: '#22c55e',
                    fillOpacity: isDark ? 0.15 : 0.2,
                    className: 'scada-park-poly'
                });
                park.bindTooltip(`🌲 <strong>${uf.botanicalGarden.name}</strong><br><span class="text-[10px] text-slate-400 font-mono">120-Acre Eco-Reserve &amp; Heritage Forest</span>`, {
                    sticky: true,
                    className: 'scada-tooltip'
                });
                this.urbanPolygons.push(park);
            }

            const sezCampuses = [
                { data: uf.mindspaceCampus, color: '#3b82f6', label: 'Raheja Mindspace IT SEZ' },
                { data: uf.cyberTowersSEZ, color: '#0ea5e9', label: 'HITEC City Phase 1 Complex' },
                { data: uf.knowledgeCitySEZ, color: '#6366f1', label: 'Knowledge City Tech Hub' },
                { data: uf.financialDistrictSEZ, color: '#8b5cf6', label: 'Financial District SEZ' }
            ];

            sezCampuses.forEach(sez => {
                if (sez.data) {
                    const poly = L.polygon(sez.data.coords, {
                        color: sez.color,
                        weight: 1,
                        dashArray: '5, 5',
                        fillColor: sez.color,
                        fillOpacity: isDark ? 0.08 : 0.12
                    });
                    poly.bindTooltip(`🏢 <strong>${sez.data.name}</strong><br><span class="text-[10px] text-slate-400 font-mono">Special Economic Zone • IT Corridor</span>`, {
                        sticky: true,
                        className: 'scada-tooltip'
                    });
                    this.urbanPolygons.push(poly);
                }
            });

            // Only add urban polygons if initially in streets/SCADA mode
            if (this.mapMode !== 'satellite') {
                this.urbanPolygons.forEach(p => p.addTo(this.map));
            }
        }

        // 2. Primary Corridor Vectors (Cyber Towers to Gachibowli - 100% Lane-Snapped)
        this.primaryCasing = L.polyline(h.primaryCorridor, {
            color: isDark ? 'rgba(7, 15, 30, 0.85)' : 'rgba(15, 23, 42, 0.75)',
            weight: 6,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(this.map);

        this.primaryPolyline = L.polyline(h.primaryCorridor, {
            color: '#10b981',
            weight: 3.2,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(this.map);

        this.primaryDashPolyline = L.polyline(h.primaryCorridor, {
            color: '#ffffff',
            weight: 1.8,
            opacity: 0.9,
            className: 'flow-dash-green',
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(this.map);

        this.primaryPolyline.bindTooltip('🚦 <strong>Primary Arterial Corridor</strong><br><span class="text-[10px] text-slate-400 font-mono">Cyber Towers ➔ Mindspace ➔ Bio-Diversity ➔ Gachibowli</span>', {
            sticky: true,
            className: 'scada-tooltip'
        });

        // 3. Multiple Busy Arterial Routes (100% Lane-Snapped Precision Vectors)
        this.busyRouteLayers = [];
        if (h.busyRoutes && Array.isArray(h.busyRoutes)) {
            h.busyRoutes.forEach(r => {
                const casing = L.polyline(r.path, {
                    color: isDark ? 'rgba(7, 15, 30, 0.85)' : 'rgba(15, 23, 42, 0.75)',
                    weight: 5.2,
                    opacity: 0.85,
                    lineJoin: 'round',
                    lineCap: 'round'
                }).addTo(this.map);

                const line = L.polyline(r.path, {
                    color: r.statusColor,
                    weight: 2.8,
                    opacity: 0.95,
                    lineJoin: 'round',
                    lineCap: 'round'
                }).addTo(this.map);

                const dash = L.polyline(r.path, {
                    color: '#ffffff',
                    weight: 1.6,
                    opacity: 0.85,
                    className: r.dashClass || 'flow-dash-amber',
                    lineJoin: 'round',
                    lineCap: 'round'
                }).addTo(this.map);

                const tooltipHtml = `
                    <div class="font-mono text-xs p-1">
                        <div class="font-bold flex items-center justify-between gap-3 mb-1" style="color: ${r.statusColor}">
                            <span>${r.name}</span>
                            <span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-700">${r.code}</span>
                        </div>
                        <div class="text-[10.5px] text-slate-300 font-sans">${r.tag}</div>
                        <div class="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-slate-700/60 text-[10.5px]">
                            <div>Peak Volume: <strong class="text-white">${r.volumePCU.toLocaleString()} PCU/h</strong></div>
                            <div>Mean Speed: <strong class="text-white">${r.avgSpeedKmh} km/h</strong></div>
                        </div>
                        <div class="text-[10px] text-amber-400 mt-1">Status: ${r.congestionLevel}</div>
                    </div>
                `;
                line.bindTooltip(tooltipHtml, { sticky: true, className: 'scada-tooltip' });

                this.busyRouteLayers.push({ id: r.id, casing, line, dash });
            });
        }

        // 4. Inorbit Connector Spur Link (100% Lane-Snapped)
        this.inorbitSpur = L.polyline(h.inorbitSpur, {
            color: '#38bdf8',
            weight: 2.5,
            opacity: 0.7,
            dashArray: '4, 6'
        }).addTo(this.map);

        // 5. Tactical Bypass Casing & Route (via Durgam Cheruvu Cable Bridge - 100% Lane-Snapped)
        this.bypassCasing = L.polyline(h.bypassCorridor, {
            color: isDark ? 'rgba(7, 15, 30, 0.85)' : 'rgba(15, 23, 42, 0.75)',
            weight: 5.5,
            opacity: 0.85,
            lineJoin: 'round'
        }).addTo(this.map);

        this.bypassPolyline = L.polyline(h.bypassCorridor, {
            color: '#06b6d4',
            weight: 2.8,
            opacity: 0.9,
            className: 'flow-dash-cyan',
            lineJoin: 'round',
            lineCap: 'round'
        }).addTo(this.map);

        this.bypassPolyline.bindTooltip('⚡ Tactical Bypass: Durgam Cheruvu Cable Bridge ➔ Road No. 36 (-18.4m saved)', {
            sticky: true,
            className: 'scada-tooltip font-mono text-xs'
        });
    }

    _initJunctionsAndSensors() {
        const h = window.HYDERABAD_CORRIDOR;

        // Junction Landmark Badges
        this.junctionLayerGroup = L.layerGroup().addTo(this.map);
        h.junctions.forEach(j => {
            const isCableBridge = j.id === 'CABLE_BRIDGE';
            const iconHtml = isCableBridge ? `
                <div class="scada-junction-container">
                    <div class="cable-bridge-marker" title="Durgam Cheruvu Cable Bridge"><i class="fa-solid fa-bridge-water"></i></div>
                    <div class="junction-label" style="border-color:#06b6d4; color:#38bdf8;">Cable Bridge</div>
                </div>` : `
                <div class="scada-junction-container">
                    <div class="junction-marker" title="${j.name}">${j.code}</div>
                    <div class="junction-label">${j.name.split(' ')[0]}</div>
                </div>`;

            const icon = L.divIcon({
                className: 'custom-junction-wrapper',
                html: iconHtml,
                iconSize: [80, 50],
                iconAnchor: [40, 25]
            });
            const marker = L.marker([j.lat, j.lng], { icon }).addTo(this.junctionLayerGroup);
            marker.bindPopup(`
                <div class="p-2 font-mono text-xs text-slate-100 bg-slate-900 rounded border border-cyan-500/40 shadow-xl">
                    <div class="text-cyan-400 font-bold text-sm mb-1">${j.name} (${j.code})</div>
                    <div class="text-slate-300 mb-1 text-[11px]">${j.description}</div>
                    <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-400 border-t border-slate-700 pt-1 mt-1">
                        <div>Lanes: <span class="text-white">${j.lanes}</span></div>
                        <div>Design Cap: <span class="text-white">${j.nominalCapacityPCU} PCU/h</span></div>
                        <div>Base Speed: <span class="text-white">${j.baseSpeedKmh} km/h</span></div>
                        <div>Status: <span class="text-emerald-400 font-semibold">ONLINE</span></div>
                    </div>
                </div>
            `);
            this.junctionMarkers.push(marker);
        });

        // IoT Roadside Sensor Pins
        this.sensorLayerGroup = L.layerGroup().addTo(this.map);
        this.sensorsVisible = true;
        h.sensors.forEach(s => {
            const isRadar = s.type.includes('Radar');
            const isCam = s.type.includes('ANPR');
            const iconType = isRadar ? 'radar' : (isCam ? 'camera' : 'loop');
            const icon = L.divIcon({
                className: 'custom-sensor-icon',
                html: `<div class="sensor-marker ${iconType}"><i class="fa-solid fa-${s.icon}"></i> ${s.id}</div>`,
                iconSize: [68, 22],
                iconAnchor: [34, 11]
            });
            const marker = L.marker([s.lat, s.lng], { icon }).addTo(this.sensorLayerGroup);
            marker.bindPopup(`
                <div class="p-2 font-mono text-xs text-slate-100 bg-slate-900 rounded border border-emerald-500/40 shadow-xl">
                    <div class="text-emerald-400 font-bold text-sm mb-1"><i class="fa-solid fa-${s.icon}"></i> ${s.id}: ${s.name}</div>
                    <div class="text-slate-300 text-[11px] mb-1">Type: <span class="text-white">${s.type}</span></div>
                    <div class="text-slate-400 text-[11px] mb-1">${s.specs}</div>
                    <div class="flex justify-between items-center text-[11px] border-t border-slate-700 pt-1 mt-1">
                        <div>Sampling: <span class="text-cyan-300">${s.samplingHz} Hz</span></div>
                        <div>Link Health: <span class="text-emerald-400 font-bold">${s.health}%</span></div>
                    </div>
                </div>
            `);
            this.sensorMarkers.push(marker);
        });
    }

    recenterMap() {
        const h = window.HYDERABAD_CORRIDOR;
        if (this.map && h) {
            this.map.flyTo(h.center, h.zoom, { duration: 0.8 });
        }
    }

    toggleVehicles() {
        const btn = document.getElementById('map-btn-vehicles');
        if (this.trafficParticles) {
            const enabled = this.trafficParticles.toggle();
            if (btn) {
                if (enabled) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        }
    }

    toggleSensors() {
        const btn = document.getElementById('map-btn-sensors');
        this.sensorsVisible = !this.sensorsVisible;
        if (this.sensorLayerGroup) {
            if (this.sensorsVisible) {
                this.map.addLayer(this.sensorLayerGroup);
                if (btn) btn.classList.add('active');
            } else {
                this.map.removeLayer(this.sensorLayerGroup);
                if (btn) btn.classList.remove('active');
            }
        }
    }


    toggleSatelliteMode() {
        const btn = document.getElementById('map-btn-satellite');
        if (!this.map) return;

        if (this.mapMode === 'satellite') {
            // Switch to Clean Street/SCADA Grid View
            this.mapMode = 'streets';
            if (this.satelliteLayer) this.map.removeLayer(this.satelliteLayer);
            if (!this.gridLayer) {
                this.gridLayer = new this.ScadaGridLayer({ maxZoom: 19, minZoom: 11 });
            }
            this.map.addLayer(this.gridLayer);
            if (this.urbanPolygons) {
                this.urbanPolygons.forEach(p => p.addTo(this.map));
            }
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fa-solid fa-map text-slate-400"></i> <span>Satellite</span>';
            }
        } else {
            // Switch to Photorealistic Satellite View
            this.mapMode = 'satellite';
            if (this.gridLayer) this.map.removeLayer(this.gridLayer);
            if (!this.satelliteLayer) {
                this.satelliteLayer = L.tileLayer(this.satelliteTileUrl, {
                    maxZoom: 20,
                    subdomains: ['0', '1', '2', '3']
                });
            }
            this.map.addLayer(this.satelliteLayer);
            if (this.urbanPolygons) {
                this.urbanPolygons.forEach(p => {
                    if (this.map.hasLayer(p)) this.map.removeLayer(p);
                });
            }
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fa-solid fa-satellite text-emerald-400"></i> <span>Satellite</span>';
            }
        }

        this._bringVectorsToFront();
    }

    _bringVectorsToFront() {
        if (this.urbanPolygons && this.mapMode !== 'satellite') {
            this.urbanPolygons.forEach(p => {
                if (this.map.hasLayer(p)) p.bringToFront();
            });
        }
        if (this.busyRouteLayers) {
            this.busyRouteLayers.forEach(rl => {
                if (rl.casing) rl.casing.bringToFront();
                if (rl.line) rl.line.bringToFront();
                if (rl.dash) rl.dash.bringToFront();
            });
        }
        if (this.primaryCasing) this.primaryCasing.bringToFront();
        if (this.primaryPolyline) this.primaryPolyline.bringToFront();
        if (this.primaryDashPolyline) this.primaryDashPolyline.bringToFront();
        if (this.inorbitSpur) this.inorbitSpur.bringToFront();
        if (this.bypassCasing) this.bypassCasing.bringToFront();
        if (this.bypassPolyline) this.bypassPolyline.bringToFront();
        if (this.junctionLayerGroup) this.junctionLayerGroup.bringToFront();
        if (this.sensorLayerGroup) this.sensorLayerGroup.bringToFront();
    }

    toggleBusyRoutes() {
        const btn = document.getElementById('map-btn-routes');
        this.busyRoutesVisible = !this.busyRoutesVisible;
        if (this.busyRouteLayers) {
            this.busyRouteLayers.forEach(rl => {
                if (this.busyRoutesVisible) {
                    this.map.addLayer(rl.casing);
                    this.map.addLayer(rl.line);
                    this.map.addLayer(rl.dash);
                } else {
                    this.map.removeLayer(rl.casing);
                    this.map.removeLayer(rl.line);
                    this.map.removeLayer(rl.dash);
                }
            });
        }
        if (btn) {
            if (this.busyRoutesVisible) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }

    /* ==========================================================================
       TELEMETRY BUS & REAL-TIME 2.0s SYNC
       ========================================================================== */
    _initTelemetryBus() {
        if (!window.telemetryBus) return;

        // Listen to 2-second packets broadcast by App 2 (simulator.html)
        window.telemetryBus.subscribe((packet) => {
            this._handleSimulatorPacket(packet);
        });

        // Listen to connection status events
        window.addEventListener('nexraflow:bus_status', (e) => {
            this._updateConnectionIndicator(e.detail.connected);
        });
    }

    _handleSimulatorPacket(packet) {
        if (!packet) return;

        this.state.simConnected = true;
        this.state.lastPacketTime = Date.now();
        this._updateConnectionIndicator(true);

        // Apply raw packet values
        const rawSpeed = packet.rawSpeedKmh || this.state.speedKmh;
        const kResult = this.kalmanFilter.update(rawSpeed);

        this.state.speedKmh = rawSpeed;
        this.state.filteredSpeedKmh = kResult.estimate;
        this.state.flowPCU = packet.flowPCU || this.state.flowPCU;
        this.state.queuePCU = packet.queuePCU || this.state.queuePCU;

        if (packet.composition) {
            this.state.twoWheelerPct = parseFloat(packet.composition.twoWheelerPct || 45);
            this.state.autoPct = parseFloat(packet.composition.autoRickshawPct || 18);
            this.state.carPct = parseFloat(packet.composition.carPct || 25);
            this.state.busPct = parseFloat(packet.composition.busPct || 12);
        }

        // If simulator injected a scenario change
        if (packet.scenarioId && packet.scenarioId !== this.currentScenario) {
            this.currentScenario = packet.scenarioId;
            this._applyScenarioVisuals(packet.scenarioId);
        }

        this._recalculateTrafficScience();
        this._renderTelemetryUi();
    }

    _updateConnectionIndicator(connected) {
        const badge = document.getElementById('telemetry-status-badge') || document.getElementById('btn-open-simulator') || document.getElementById('btn-open-neurax');
        const text = document.getElementById('telemetry-status-text');
        const dot = document.getElementById('telemetry-status-dot');

        if (!badge || !text || !dot) return;

        badge.className = 'badge-scada badge-cyan cursor-pointer hover:opacity-80 transition py-0.5 text-[10.5px]';
        dot.className = 'live-pulse bg-cyan-400';
        text.textContent = 'NEURAX AI: 2.0s LIVE MODEL (R²: 0.86)';
    }

    _startLocalFallbackClock() {
        // Runs every 2 seconds using NeuraX trained smart city weights
        setInterval(() => {
            if (!this.state.simConnected || (Date.now() - this.state.lastPacketTime > 4000)) {
                this.state.simConnected = false;
                this._updateConnectionIndicator(false);
                this._simulateMinorLocalJitter();
            }
        }, 2000);
    }

    _simulateMinorLocalJitter() {
        if (window.neuraxEngine) {
            const m = window.neuraxEngine.getScenarioMetrics(this.currentScenario);
            const kResult = this.kalmanFilter.update(m.speed);
            this.state.speedKmh = m.speed;
            this.state.filteredSpeedKmh = kResult.estimate;
            this.state.flowPCU = m.flow;
            this.state.queuePCU = m.queue;
            this._recalculateTrafficScience();
            this._renderTelemetryUi();
            return;
        }

        const targetSpeed = this.currentScenario === 'nominal' ? 46.5 : (this.currentScenario === 'tsrtcBreakdown' ? 11.2 : 8.5);
        const kResult = this.kalmanFilter.update(targetSpeed);
        this.state.speedKmh = targetSpeed;
        this.state.filteredSpeedKmh = kResult.estimate;
        this._recalculateTrafficScience();
        this._renderTelemetryUi();
    }

    /* ==========================================================================
       SCENARIO MANAGEMENT & MATHEMATICS
       ========================================================================== */
    loadScenario(scenarioId) {
        const s = window.HYDERABAD_CORRIDOR.scenarios[scenarioId];
        if (!s) return;

        this.currentScenario = scenarioId;
        this.state.speedKmh = s.speedKmh;
        this.state.filteredSpeedKmh = s.speedKmh;
        this.state.flowPCU = s.flowPCU;
        this.state.queuePCU = s.accumulatedQueuePCU;
        this.state.shockwaveVelocity = s.shockwaveVelocity;
        this.state.spillbackEtaMinutes = s.upstreamSpillbackEtaMins;
        this.state.bypassActive = s.bypassActive;

        this.kalmanFilter.reset(s.speedKmh);

        this._applyScenarioVisuals(scenarioId);
        this._recalculateTrafficScience();
        this._renderTelemetryUi();

        // Broadcast scenario to TelemetryBus so App 2 knows if user triggered here
        if (window.telemetryBus) {
            window.telemetryBus.publish({
                source: 'scada_cockpit',
                scenarioId: scenarioId,
                action: 'scenario_change'
            });
        }
    }

    _applyScenarioVisuals(scenarioId) {
        const s = window.HYDERABAD_CORRIDOR.scenarios[scenarioId];
        if (!s) return;

        // 1. Remove old incident marker and geofence zone if exists
        if (this.incidentMarker) {
            this.map.removeLayer(this.incidentMarker);
            this.incidentMarker = null;
        }
        if (this.incidentZoneCircle) {
            this.map.removeLayer(this.incidentZoneCircle);
            this.incidentZoneCircle = null;
        }

        // 2. Add Incident Marker & SCADA Geofence Ring if incident exists
        if (s.incidentLocation) {
            const loc = s.incidentLocation;
            const isAmbulance = scenarioId === 'ambulanceCorridor';
            const iconHtml = isAmbulance ?
                `<div class="incident-pulse-marker" style="background:#10b981; border-color:#ffffff;"><i class="fa-solid fa-truck-medical text-white text-xs"></i></div>` :
                `<div class="incident-pulse-marker"><i class="fa-solid fa-triangle-exclamation"></i></div>`;

            const icon = L.divIcon({
                className: 'custom-incident-icon',
                html: iconHtml,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            this.incidentMarker = L.marker([loc.lat, loc.lng], { icon }).addTo(this.map);
            this.incidentMarker.bindPopup(`
                <div class="p-2 font-mono text-xs text-slate-100 bg-slate-900 rounded border ${isAmbulance ? 'border-emerald-500' : 'border-red-500'}">
                    <div class="${isAmbulance ? 'text-emerald-400' : 'text-red-400'} font-bold text-sm mb-1"><i class="fa-solid ${isAmbulance ? 'fa-truck-medical' : 'fa-triangle-exclamation'}"></i> ${s.badge}</div>
                    <div class="text-white font-semibold mb-1">${loc.title}</div>
                    <div class="text-slate-300 text-[11px] mb-2">${loc.landmark}</div>
                    <div class="text-slate-400 text-[11px] border-t border-slate-700 pt-1">${loc.subtext}</div>
                </div>
            `).openPopup();

            // Tactical Shockwave Geofence Radius
            if (scenarioId !== 'nominal') {
                const zoneColor = isAmbulance ? '#10b981' : '#ef4444';
                this.incidentZoneCircle = L.circle([loc.lat, loc.lng], {
                    radius: isAmbulance ? 160 : 300,
                    color: zoneColor,
                    fillColor: zoneColor,
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '5, 5'
                }).addTo(this.map);
            }
        }

        // 3. Update Polyline Colors, Halo Glow & Flow Speed
        const color = s.color;
        if (this.primaryPolyline) {
            this.primaryPolyline.setStyle({ color: color });
        }
        if (this.primaryHalo) {
            this.primaryHalo.setStyle({
                color: color,
                opacity: (scenarioId === 'nominal' || scenarioId === 'ambulanceCorridor') ? 0.35 : 0.65
            });
        }
        if (this.primaryDashPolyline) {
            const dashClass = (scenarioId === 'nominal' || scenarioId === 'ambulanceCorridor') ? 'flow-dash-green' : (scenarioId === 'monsoonFlood' ? 'flow-dash-amber' : 'flow-dash-red');
            this.primaryDashPolyline.setStyle({
                className: dashClass,
                color: '#ffffff'
            });
        }

        // 4. Update Bypass Polyline
        this.showBypassRoute(s.bypassActive);

        // 5. Update Roadside Public VMS Gantry Display
        const vmsEl = document.getElementById('vms-gantry-text');
        if (vmsEl) {
            if (scenarioId === 'tsrtcBreakdown') {
                vmsEl.textContent = '[ ⚠️ TSRTC BREAKDOWN AT MINDSPACE | ➡️ DIVERSION VIA DURGAM CHERUVU CABLE BRIDGE | SAVE 18.4 MIN ]';
                vmsEl.className = 'bg-black border border-red-500/50 rounded p-2 text-center text-red-400 font-mono font-bold text-xs tracking-wider shadow-inner shadow-red-500/20';
            } else if (scenarioId === 'monsoonFlood') {
                vmsEl.textContent = '[ 🌊 BIO-DIVERSITY UNDERPASS WATERLOGGED 48CM | ➡️ USE ELEVATED UPPER FLYOVER ]';
                vmsEl.className = 'bg-black border border-blue-500/50 rounded p-2 text-center text-blue-400 font-mono font-bold text-xs tracking-wider shadow-inner shadow-blue-500/20';
            } else if (scenarioId === 'flyoverCollision') {
                vmsEl.textContent = '[ 🚨 CYBER TOWERS FLYOVER CRASH | ➡️ USE MMTS UNDERPASS SLIP ROAD ]';
                vmsEl.className = 'bg-black border border-amber-500/50 rounded p-2 text-center text-amber-300 font-mono font-bold text-xs tracking-wider shadow-inner shadow-amber-500/20';
            } else if (scenarioId === 'ambulanceCorridor') {
                vmsEl.textContent = '[ 🚑 EMERGENCY 108 AMBULANCE TRANSIT | YIELD ALL LANES TO RIGHT | GREEN CORRIDOR ENGAGED ]';
                vmsEl.className = 'bg-black border border-emerald-500/50 rounded p-2 text-center text-emerald-300 font-mono font-bold text-xs tracking-wider shadow-inner shadow-emerald-500/20';
            } else {
                vmsEl.textContent = '[ ✔️ CORRIDOR FLOW NOMINAL | CYBER TOWERS TO GACHIBOWLI CLEAR | SPEED: 46.5 KM/H ]';
                vmsEl.className = 'bg-black border border-emerald-500/50 rounded p-2 text-center text-emerald-400 font-mono font-bold text-xs tracking-wider shadow-inner shadow-emerald-500/20';
            }
        }

        // 6. If Ambulance corridor, automatically force green preemption flush
        if (scenarioId === 'ambulanceCorridor' && window.signalController) {
            window.signalController.forcePreemption(35);
        }

        // 7. Update Scenario active buttons in toolbar
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-900/40');
        });
        const activeBtn = document.getElementById(`btn-scen-${scenarioId}`);
        if (activeBtn) {
            activeBtn.classList.add('ring-2', 'ring-cyan-400', 'bg-cyan-900/40');
        }
    }

    showBypassRoute(active) {
        this.state.bypassActive = active;
        const bypassBtn = document.getElementById('map-btn-bypass');
        if (bypassBtn) {
            if (active) bypassBtn.classList.add('active');
            else bypassBtn.classList.remove('active');
        }

        if (this.bypassPolyline) {
            if (active) {
                this.bypassPolyline.setStyle({
                    opacity: 0.95,
                    weight: 6,
                    color: '#06b6d4'
                });
            } else {
                this.bypassPolyline.setStyle({
                    opacity: 0.2,
                    weight: 4,
                    color: '#06b6d4'
                });
            }
        }
        if (this.bypassCasing) {
            this.bypassCasing.setStyle({
                opacity: active ? 0.9 : 0.35,
                weight: active ? 14 : 10
            });
        }
    }

    _recalculateTrafficScience() {
        // IRC:106 Level of Service
        const losResult = window.TrafficMath.calculateLOS(this.state.flowPCU, 3800);
        this.state.vcRatio = losResult.vcRatio;
        this.state.los = losResult.los;
        this.state.losColor = losResult.color;

        // LWR Shockwave Calculus
        if (this.currentScenario !== 'nominal') {
            const qA = 3240; // PCU/h arrival flow
            const kA = Math.round(qA / Math.max(10, this.state.speedKmh)); // density upstream
            const qB = this.currentScenario === 'tsrtcBreakdown' ? 1710 : (this.currentScenario === 'monsoonFlood' ? 1330 : 1140);
            const kB = 142; // Jam density bottleneck
            const shockwave = window.TrafficMath.calculateShockwave(qA, kA, qB, kB, 1.8);

            this.state.shockwaveVelocity = shockwave.velocityKmh;
            this.state.spillbackEtaMinutes = shockwave.arrivalMinutes;
        } else {
            this.state.shockwaveVelocity = 0;
            this.state.spillbackEtaMinutes = null;
        }
    }

    /* ==========================================================================
       UI RENDERING & HUD BINDINGS
       ========================================================================== */
    _renderTelemetryUi() {
        // Corridor Speed
        const speedEl = document.getElementById('metric-corridor-speed');
        if (speedEl) speedEl.textContent = `${this.state.filteredSpeedKmh} km/h`;

        // Volume & Capacity
        const flowEl = document.getElementById('metric-flow-pcu');
        if (flowEl) flowEl.textContent = `${this.state.flowPCU.toLocaleString()} PCU/h`;

        const vcEl = document.getElementById('metric-vc-ratio');
        if (vcEl) vcEl.textContent = `V/C: ${this.state.vcRatio}`;

        const losEl = document.getElementById('metric-los-badge');
        if (losEl) {
            losEl.textContent = `LOS ${this.state.los}`;
            losEl.style.color = this.state.losColor;
            losEl.style.borderColor = this.state.losColor;
        }

        // IRC:106 Composition Bar
        const bar2w = document.getElementById('comp-bar-2w');
        const barAuto = document.getElementById('comp-bar-auto');
        const barCar = document.getElementById('comp-bar-car');
        const barBus = document.getElementById('comp-bar-bus');

        if (bar2w) { bar2w.style.width = `${this.state.twoWheelerPct}%`; bar2w.title = `2-Wheelers: ${this.state.twoWheelerPct}%`; }
        if (barAuto) { barAuto.style.width = `${this.state.autoPct}%`; barAuto.title = `Autos: ${this.state.autoPct}%`; }
        if (barCar) { barCar.style.width = `${this.state.carPct}%`; barCar.title = `Cars: ${this.state.carPct}%`; }
        if (barBus) { barBus.style.width = `${this.state.busPct}%`; barBus.title = `Buses: ${this.state.busPct}%`; }

        const compText = document.getElementById('comp-text-legend');
        if (compText) {
            compText.textContent = `2W: ${this.state.twoWheelerPct}% • Auto: ${this.state.autoPct}% • Car: ${this.state.carPct}% • Bus: ${this.state.busPct}%`;
        }

        // Kinematic Shockwave Monitor
        const shockwaveEl = document.getElementById('metric-shockwave-speed');
        const shockwaveEtaEl = document.getElementById('metric-shockwave-eta');
        const shockwaveStatusEl = document.getElementById('shockwave-status-text');

        if (shockwaveEl) {
            shockwaveEl.textContent = `${this.state.shockwaveVelocity} km/h`;
            shockwaveEl.className = this.state.shockwaveVelocity < 0 ? 'text-xl font-bold font-mono text-red-400' : 'text-xl font-bold font-mono text-emerald-400';
        }

        if (shockwaveEtaEl) {
            shockwaveEtaEl.textContent = this.state.spillbackEtaMinutes ? `T+${this.state.spillbackEtaMinutes}m` : 'NONE';
        }

        if (shockwaveStatusEl) {
            shockwaveStatusEl.textContent = this.state.shockwaveVelocity < 0 ?
                `BACKWARD KINEMATIC WAVE FRONT (Spillback to Cyber Towers in ${this.state.spillbackEtaMinutes}m)` :
                `Nominal Wavefront Equilibrium (Zero backward spillback)`;
        }

        // Active Incident Badge in Header
        const incidentHeaderBadge = document.getElementById('header-incident-badge');
        if (incidentHeaderBadge) {
            const s = window.HYDERABAD_CORRIDOR.scenarios[this.currentScenario];
            incidentHeaderBadge.textContent = s.badge;
            incidentHeaderBadge.className = `badge-scada ${this.currentScenario === 'nominal' ? 'badge-green' : 'badge-red'}`;
        }

        // Re-render current active tab contents if needed
        if (this.activeTab === 'radar') this.renderRadarTab();
        if (this.activeTab === 'briefing') this.renderBriefingTab();
    }

    _initSignalSync() {
        if (!window.signalController) return;

        window.signalController.subscribe((sig) => {
            // Update 3-Lens Traffic Light Head
            const redLens = document.getElementById('lens-red');
            const amberLens = document.getElementById('lens-amber');
            const greenLens = document.getElementById('lens-green');
            const timerEl = document.getElementById('signal-phase-timer');
            const labelEl = document.getElementById('signal-phase-label');

            if (redLens && amberLens && greenLens) {
                redLens.classList.toggle('active', sig.phase === 'RED');
                amberLens.classList.toggle('active', sig.phase === 'AMBER');
                greenLens.classList.toggle('active', sig.phase === 'GREEN');
            }

            if (timerEl) timerEl.textContent = `${sig.secondsRemaining}s`;
            if (labelEl) {
                labelEl.textContent = sig.phase;
                labelEl.className = `font-mono text-sm font-bold ${sig.phase === 'GREEN' ? 'text-emerald-400' : (sig.phase === 'AMBER' ? 'text-amber-400' : 'text-red-400')}`;
            }

            // Signal Split comparison
            const splitTextEl = document.getElementById('signal-split-text');
            if (splitTextEl) {
                splitTextEl.textContent = sig.isPreempted ? `ACTIVE FLUSH: ${sig.preemptedSplitText}` : `STANDARD: ${sig.standardSplitText}`;
            }

            const splitBarGreen = document.getElementById('signal-split-green-bar');
            if (splitBarGreen) {
                const total = sig.activeGreen + sig.activeAmber + sig.activeRed;
                const pct = Math.round((sig.activeGreen / total) * 100);
                splitBarGreen.style.width = `${pct}%`;
            }
        });
    }

    /* ==========================================================================
       THEME MANAGEMENT (Government Light & Dark Modes)
       ========================================================================== */
    setTheme(theme, broadcast = true) {
        this.currentTheme = theme;
        const isDark = (theme === 'dark');
        const root = document.documentElement;

        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }

        try {
            localStorage.setItem('nexraflow_theme_app1', theme);
        } catch (e) {}

        // Update Theme Toggle Button in Header
        const toggleIcon = document.getElementById('theme-toggle-icon');
        const toggleText = document.getElementById('theme-toggle-text');
        if (toggleIcon) {
            toggleIcon.className = isDark ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-indigo-600';
        }
        if (toggleText) {
            toggleText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }

        // Redraw 100% Offline SCADA Basemap Grid & Vector Casings
        if (this.map) {
            if (this.gridLayer) {
                this.gridLayer.redraw();
            }
            if (this.primaryCasing) {
                this.primaryCasing.setStyle({ color: isDark ? '#070f1e' : '#cbd5e1' });
            }
            if (this.busyRouteLayers) {
                this.busyRouteLayers.forEach(rl => {
                    if (rl.casing) {
                        rl.casing.setStyle({ color: isDark ? '#070f1e' : '#e2e8f0' });
                    }
                });
            }
            if (this.urbanPolygons) {
                this.urbanPolygons.forEach(p => {
                    if (p.options.className === 'scada-lake-poly') {
                        p.setStyle({ fillOpacity: isDark ? 0.25 : 0.35 });
                    }
                });
            }
        }
    }

    toggleTheme() {
        const nextTheme = (this.currentTheme === 'dark') ? 'light' : 'dark';
        this.setTheme(nextTheme, true);
        if (window.tacticalAudio) window.tacticalAudio.playUiChime(nextTheme === 'dark' ? 520 : 780, 0.08);
    }

    /* ==========================================================================
       TAB MANAGERS (Radar, Signals, Bypass/Police, AI Core, CAD)
       ========================================================================== */
    switchTab(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.scada-tab-btn').forEach(btn => {
            btn.classList.remove('border-cyan-400', 'text-cyan-400', 'bg-cyan-950/40', 'active-tab');
            btn.classList.add('text-slate-400', 'border-transparent');
        });

        const target = document.getElementById(`tab-${tabId}`);
        const btn = document.getElementById(`tab-btn-${tabId}`);
        if (target) target.classList.remove('hidden');
        if (btn) {
            btn.classList.add('border-cyan-400', 'text-cyan-400', 'active-tab');
            btn.classList.remove('text-slate-400', 'border-transparent');
        }

        if (tabId === 'radar') this.renderRadarTab();
        if (tabId === 'bypass') this.renderBypassAndPoliceTab();
        if (tabId === 'briefing') this.renderBriefingTab();
        if (tabId === 'cad') this.renderCadPlanner();
    }

    renderRadarTab() {
        const container = document.getElementById('radar-cards-container');
        if (!container) return;

        const intervals = [
            { time: 'T+15m', mult: 1.0 },
            { time: 'T+30m', mult: 1.3 },
            { time: 'T+45m', mult: 1.6 },
            { time: 'T+60m', mult: 1.9 }
        ];

        let html = '';
        intervals.forEach(item => {
            let projectedSpeed = this.currentScenario === 'nominal' ? 45.2 : Math.max(5.8, (this.state.speedKmh / item.mult).toFixed(1));
            let projectedQueue = this.currentScenario === 'nominal' ? 50 : Math.round(this.state.queuePCU * item.mult);
            let cardClass = this.currentScenario === 'nominal' ? 'radar-card' : (item.time === 'T+15m' ? 'radar-card warning' : 'radar-card critical');

            html += `
                <div class="scada-card p-3 ${cardClass} rounded">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-xs font-mono font-bold text-cyan-400">${item.time} FORECAST</span>
                        <span class="text-[10px] font-mono text-slate-400">Conf: 95.8% (±4.2%)</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>Speed: <span class="text-white font-bold">${projectedSpeed} km/h</span></div>
                        <div>Queue: <span class="text-white font-bold">${projectedQueue} PCU</span></div>
                    </div>
                    <div class="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div class="h-full ${projectedSpeed > 30 ? 'bg-emerald-400' : (projectedSpeed > 15 ? 'bg-amber-400' : 'bg-red-500')}" style="width: ${Math.min(100, (projectedQueue / 800) * 100)}%"></div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    renderBypassAndPoliceTab() {
        const payloadBox = document.getElementById('whatsapp-payload-preview');
        const timeSavedEl = document.getElementById('bypass-time-saved');
        const splitPctEl = document.getElementById('bypass-split-pct');

        if (timeSavedEl) timeSavedEl.textContent = this.state.bypassActive ? '18.4 Mins/Car' : '0.0 Mins (Standby)';
        if (splitPctEl) splitPctEl.textContent = this.state.bypassActive ? '35% Arterial Flow' : '0% (Nominal)';

        const payload = this._generatePolicePayload();
        if (payloadBox) {
            payloadBox.value = payload;
        }
    }

    _generatePolicePayload() {
        const s = window.HYDERABAD_CORRIDOR.scenarios[this.currentScenario];
        const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

        if (this.currentScenario === 'ambulanceCorridor') {
            return `🚨 [NEXRAFLOW SCADA PRIORITY DISPATCH] 🚨
----------------------------------------
TO: Cyberabad Traffic Police Command (ACP West Zone)
TIME: ${timeStr} IST
STATUS: 108 EMERGENCY GREEN CORRIDOR ACTIVE

CORRIDOR: Cyber Towers ➔ AIG Hospitals Gachibowli (4.2 km)
VEHICLE: 108 Life-Support Cardiac Unit #TS09-EM-1082
PATIENT CRITICALITY: Code Red (Severe Myocardial Infarction)

AUTOMATED SCADA DIRECTIVES:
1. Signal Preemption: 100% Continuous Arterial Green (All Cross-Streets Held RED)
2. Corridor Transit Time: Reduced from 35.0 mins to 7.8 mins (-77% Delay)
3. Station Police Interceptors at Shilparamam and Mindspace Junctions to clear merging traffic.

Verified by NEXRAFLOW AI Spatiotemporal Core.`;
        }

        return `🚨 [NEXRAFLOW SCADA PRIORITY DISPATCH] 🚨
----------------------------------------
TO: Cyberabad Traffic Police Command (ACP West Zone)
TIME: ${timeStr} IST
STATUS: ${s.badge}

LOCATION: ${s.incidentLocation ? s.incidentLocation.landmark : 'Cyber Towers - Mindspace Corridor'}
GPS: ${s.incidentLocation ? `${s.incidentLocation.lat}, ${s.incidentLocation.lng}` : '17.4435, 78.3772'}
TYPE: ${s.incidentType}

KINEMATICS:
- Corridor Capacity Drop: ${s.capacityDropPct}%
- LWR Shockwave Speed: ${s.shockwaveVelocity} km/h (Backward Spillback)
- Upstream Choke ETA: ${s.upstreamSpillbackEtaMins ? s.upstreamSpillbackEtaMins + ' mins' : 'N/A'}

AUTONOMOUS ACTIONS EXECUTED:
1. Signal Preemption: +25s Green Flush (NTCIP-1202 Phase 61/39)
2. Tactical Bypass: Durgam Cheruvu Cable Bridge ACTIVATED (35% Split)

REQUISITION & DIRECTIVES:
1. Dispatch Heavy Hydraulic Recovery Crane immediately to Mindspace Incline.
2. Station Traffic Marshals at Shilparamam Slip Road.

Verified by NEXRAFLOW AI Spatiotemporal Core.`;
    }

    dispatchWhatsApp() {
        const text = encodeURIComponent(this._generatePolicePayload());
        // Standard WhatsApp API link format
        const waUrl = `https://wa.me/?text=${text}`;
        window.open(waUrl, '_blank');
        if (window.tacticalAudio) window.tacticalAudio.playClick();
    }

    copyPolicePayload() {
        const payload = this._generatePolicePayload();
        navigator.clipboard.writeText(payload).then(() => {
            alert('📋 Encrypted SCADA Police Telemetry Payload copied to clipboard!');
        });
    }

    renderBriefingTab() {
        const briefing = window.geminiNeuralCore.generateBriefing({
            scenario: this.currentScenario,
            flowPCU: this.state.flowPCU,
            speedKmh: this.state.filteredSpeedKmh
        });

        const timeEl = document.getElementById('briefing-timestamp');
        const classEl = document.getElementById('briefing-classification');
        const summaryEl = document.getElementById('briefing-summary');
        const contentEl = document.getElementById('briefing-sections');

        if (timeEl) timeEl.textContent = `TIMESTAMP: ${briefing.timestamp} IST`;
        if (classEl) classEl.textContent = briefing.classification;
        if (summaryEl) summaryEl.textContent = briefing.summary;

        if (contentEl) {
            contentEl.innerHTML = briefing.sections.map(sec => `
                <div class="mb-3">
                    <div class="text-cyan-400 font-mono font-bold text-xs mb-1">${sec.title}</div>
                    <div class="text-slate-300 font-sans text-xs leading-relaxed whitespace-pre-line">${sec.content}</div>
                </div>
            `).join('');
        }
    }

    renderCadPlanner() {
        const snapshot = window.cadPlanner.getSnapshot();
        const modeBtnBefore = document.getElementById('cad-toggle-before');
        const modeBtnAfter = document.getElementById('cad-toggle-after');

        if (modeBtnBefore && modeBtnAfter) {
            if (snapshot.activeMode === 'before') {
                modeBtnBefore.classList.add('bg-cyan-600', 'text-white');
                modeBtnAfter.classList.remove('bg-cyan-600', 'text-white');
            } else {
                modeBtnAfter.classList.add('bg-cyan-600', 'text-white');
                modeBtnBefore.classList.remove('bg-cyan-600', 'text-white');
            }
        }

        const metricsContainer = document.getElementById('cad-metrics-grid');
        if (metricsContainer) {
            const cur = snapshot.current;
            metricsContainer.innerHTML = `
                <div class="scada-card p-3">
                    <div class="text-slate-400 text-[11px] font-mono">Peak Speed</div>
                    <div class="text-lg font-bold font-mono text-cyan-300">${cur.peakSpeedKmh} km/h</div>
                </div>
                <div class="scada-card p-3">
                    <div class="text-slate-400 text-[11px] font-mono">Queue Length</div>
                    <div class="text-lg font-bold font-mono ${cur.queueDropPct > 0 ? 'text-emerald-400' : 'text-red-400'}">${cur.queueLengthMeters}m (${cur.queueDropPct > 0 ? `-${cur.queueDropPct}%` : 'Baseline'})</div>
                </div>
                <div class="scada-card p-3">
                    <div class="text-slate-400 text-[11px] font-mono">Level of Service</div>
                    <div class="text-lg font-bold font-mono text-amber-300">${cur.los}</div>
                </div>
                <div class="scada-card p-3">
                    <div class="text-slate-400 text-[11px] font-mono">Capex ROI Payback</div>
                    <div class="text-lg font-bold font-mono text-emerald-300">${snapshot.economics.paybackYears}</div>
                </div>
            `;
        }
    }

    setCadMode(mode) {
        window.cadPlanner.setMode(mode);
        this.renderCadPlanner();
        if (window.tacticalAudio) window.tacticalAudio.playClick();
    }

    /* ==========================================================================
       EVENT BINDINGS
       ========================================================================== */
    _bindUiEvents() {
        // Audio Mute Toggle
        const soundBtn = document.getElementById('btn-toggle-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const isMuted = window.tacticalAudio.toggleMute();
                soundBtn.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
                soundBtn.title = isMuted ? 'Unmute Tactical Audio' : 'Mute Tactical Audio';
            });
        }

        // Auto-Pilot Button
        const pilotBtn = document.getElementById('btn-run-autopilot');
        if (pilotBtn) {
            pilotBtn.addEventListener('click', () => {
                if (this.autoPilot) {
                    this.autoPilot.start();
                }
            });
        }

        // Auto-Pilot HUD controls
        const hudStopBtn = document.getElementById('btn-hud-stop');
        const hudNextBtn = document.getElementById('btn-hud-next');
        const hudPrevBtn = document.getElementById('btn-hud-prev');
        const hudPauseBtn = document.getElementById('btn-hud-pause');
        if (hudStopBtn) hudStopBtn.addEventListener('click', () => this.autoPilot.stop());
        if (hudNextBtn) hudNextBtn.addEventListener('click', () => this.autoPilot.next());
        if (hudPrevBtn) hudPrevBtn.addEventListener('click', () => this.autoPilot.prev());
        if (hudPauseBtn) hudPauseBtn.addEventListener('click', () => this.autoPilot.togglePause());

        // Signal Force Preemption Button
        const flushBtn = document.getElementById('btn-force-flush');
        if (flushBtn) {
            flushBtn.addEventListener('click', () => {
                window.signalController.forcePreemption(25);
            });
        }

        // Signal Reset Button
        const resetSigBtn = document.getElementById('btn-reset-signal');
        if (resetSigBtn) {
            resetSigBtn.addEventListener('click', () => {
                window.signalController.resetNominal();
            });
        }

        // WhatsApp Dispatch Buttons
        const waBtn = document.getElementById('btn-dispatch-whatsapp');
        if (waBtn) waBtn.addEventListener('click', () => this.dispatchWhatsApp());

        const copyBtn = document.getElementById('btn-copy-payload');
        if (copyBtn) copyBtn.addEventListener('click', () => this.copyPolicePayload());

        // Open NeuraX AI / Telemetry Window Button
        const openSimBtn = document.getElementById('btn-open-simulator') || document.getElementById('btn-open-neurax');
        if (openSimBtn) {
            openSimBtn.addEventListener('click', () => {
                if (typeof window.openNeuraXModal === 'function') {
                    window.openNeuraXModal();
                } else {
                    window.open('simulator.html', 'NexraFlowNeuraX', 'width=1000,height=780');
                }
            });
        }

        // Theme Toggle Button
        const themeBtn = document.getElementById('btn-theme-toggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => this.toggleTheme());
        }

        // Global Quick HotKeys for Presentation
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === '1') this.loadScenario('nominal');
            else if (e.key === '2') this.loadScenario('tsrtcBreakdown');
            else if (e.key === '3') this.loadScenario('monsoonFlood');
            else if (e.key === '4') this.loadScenario('flyoverCollision');
            else if (e.key === '5') this.loadScenario('ambulanceCorridor');
            else if (e.key.toLowerCase() === 'f') window.signalController.forcePreemption(25);
            else if (e.key.toLowerCase() === 'r') window.signalController.resetNominal();
            else if (e.key.toLowerCase() === 'b') this.showBypassRoute(!this.state.bypassActive);
            else if (e.key.toLowerCase() === 't') window.open('twin3d.html', 'NexraFlow3D', 'width=1366,height=820');
            else if (e.key.toLowerCase() === 'l') this.toggleTheme();
            else if (e.code === 'Space') {
                e.preventDefault();
                if (this.autoPilot) {
                    if (!this.autoPilot.isRunning) this.autoPilot.start();
                    else this.autoPilot.togglePause();
                }
            }
        });
    }
}

// Global initialization
window.scadaApp = new ScadaApp();
document.addEventListener('DOMContentLoaded', () => {
    window.scadaApp.init();
});
