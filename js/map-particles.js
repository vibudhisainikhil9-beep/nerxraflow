/**
 * NEXRAFLOW AI - Live Vehicle Traffic Particle Simulation Layer
 * Renders heterogeneous mixed traffic (2W, Auto, Car, Bus) moving smoothly
 * along the Hyderabad arterial corridor and multiple busy arterial routes
 * on a high-performance Canvas overlay (100% Offline, Zero External API).
 */

class TrafficParticleLayer {
    constructor(map) {
        this.map = map;
        this.canvas = null;
        this.ctx = null;
        this.animId = null;
        this.enabled = true;
        this.particles = [];
        this.maxParticles = 180; // Multi-route dense city traffic

        this.allRoutes = [];
        this.corridorPoints = [];
        this.bypassPoints = [];
        this.ambulanceProgress = 0;

        this._initCanvas();
        this._prepareTrajectories();
        this._generateParticles();
        this._startAnimation();
    }

    _initCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'scada-particles-canvas';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '450';

        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(this.canvas);

        this._resizeCanvas();
        this.ctx = this.canvas.getContext('2d');

        this.map.on('move', () => this._resizeCanvas());
        this.map.on('zoom', () => this._resizeCanvas());
        this.map.on('resize', () => this._resizeCanvas());
    }

    _resizeCanvas() {
        const size = this.map.getSize();
        this.canvas.width = size.x;
        this.canvas.height = size.y;
    }

    _buildDistances(coords) {
        const dists = [0];
        let total = 0;
        if (!coords || coords.length < 2) return { dists: [0], total: 1 };
        for (let i = 0; i < coords.length - 1; i++) {
            const p1 = coords[i];
            const p2 = coords[i + 1];
            const dLat = (p2[0] - p1[0]) * 111139;
            const dLng = (p2[1] - p1[1]) * 106000;
            const d = Math.hypot(dLat, dLng);
            total += d;
            dists.push(total);
        }
        return { dists, total: Math.max(1, total) };
    }

    _prepareTrajectories() {
        const h = window.HYDERABAD_CORRIDOR;
        this.corridorPoints = h.primaryCorridor || [];
        this.bypassPoints = h.bypassCorridor || [];
        
        this.corridorMeta = this._buildDistances(this.corridorPoints);
        this.bypassMeta = this._buildDistances(this.bypassPoints);

        this.allRoutes = [
            { id: 'primary', name: 'Primary Corridor', path: this.corridorPoints, meta: this.corridorMeta, speedFactor: 1.0, weight: 35 },
            { id: 'bypass', name: 'Cable Bridge Bypass', path: this.bypassPoints, meta: this.bypassMeta, speedFactor: 1.1, weight: 15 }
        ];

        if (h.busyRoutes && Array.isArray(h.busyRoutes)) {
            h.busyRoutes.forEach(r => {
                let speedFactor = 1.0;
                if (r.id === 'route_madhapur') speedFactor = 0.65; // Heavy bumper-to-bumper
                else if (r.id === 'route_financial_district') speedFactor = 1.25; // Express
                else if (r.id === 'route_kphb_inbound') speedFactor = 0.55; // Peak choke
                else if (r.id === 'route_kondapur') speedFactor = 0.85;
                else if (r.id === 'route_old_mumbai') speedFactor = 0.75;

                const meta = this._buildDistances(r.path);
                this.allRoutes.push({
                    id: r.id,
                    name: r.name,
                    path: r.path,
                    meta: meta,
                    speedFactor: speedFactor,
                    weight: 20
                });
            });
        }
    }

    _generateParticles() {
        this.particles = [];
        if (!this.allRoutes || this.allRoutes.length === 0) return;

        // Vehicle Types per IRC:106 composition (45% 2W, 18% Auto, 25% Car, 12% Bus)
        for (let i = 0; i < this.maxParticles; i++) {
            // Assign to routes proportionally
            const route = this.allRoutes[i % this.allRoutes.length];
            const rand = Math.random();
            let type = 'car';
            let color = '#ffffff';
            let radius = 2.4;

            if (rand < 0.45) {
                type = '2w';
                color = '#38bdf8'; // Cyan dot
                radius = 1.5;
            } else if (rand < 0.63) {
                type = 'auto';
                color = '#fbbf24'; // Amber dot
                radius = 2.0;
            } else if (rand < 0.88) {
                type = 'car';
                color = '#f8fafc'; // White dot
                radius = 2.5;
            } else {
                type = 'bus';
                color = '#f87171'; // Red TSRTC Bus
                radius = 3.2;
            }

            this.particles.push({
                type,
                color,
                radius,
                progress: Math.random(),
                speedMultiplier: (0.85 + Math.random() * 0.3) * (route.speedFactor || 1.0),
                routeId: route.id,
                path: route.path,
                meta: route.meta,
                isBypass: (route.id === 'bypass')
            });
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        return this.enabled;
    }

    _startAnimation() {
        const animate = () => {
            if (this.enabled) {
                this._renderFrame();
            }
            this.animId = requestAnimationFrame(animate);
        };
        this.animId = requestAnimationFrame(animate);
    }

    _renderFrame() {
        if (!this.ctx || !this.map) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const currentScenario = window.scadaApp?.currentScenario || 'nominal';
        const corridorSpeed = window.scadaApp?.state?.speedKmh || 45;
        const isBypassActive = window.scadaApp?.state?.bypassActive || false;

        // Base progress velocity scaled by real-time speed (45 km/h -> ~0.0012 progress per frame)
        const baseVel = Math.max(0.0002, (corridorSpeed / 50) * 0.0012);

        // Render Normal/Bypass/Multi-Route Vehicle Particles
        this.particles.forEach(p => {
            // Divert 35% of primary corridor vehicles to bypass if bypass is active
            if (isBypassActive && p.routeId === 'primary' && !p.isBypass && p.progress > 0.35 && Math.random() < 0.35) {
                p.isBypass = true;
                p.path = this.bypassPoints;
                p.meta = this.bypassMeta;
                p.progress = 0;
            }

            const path = p.path;
            if (!path || path.length < 2) return;

            // Scenario bottleneck slowing on primary route
            let speed = (baseVel * 10000 / ((p.meta && p.meta.total) || 10000)) * p.speedMultiplier;
            if (p.routeId === 'primary' && !p.isBypass) {
                if (currentScenario === 'tsrtcBreakdown') {
                    if (p.progress > 0.30 && p.progress < 0.44) {
                        speed *= 0.22; // Incline bottleneck queue crawl
                    }
                } else if (currentScenario === 'monsoonFlood') {
                    if (p.progress > 0.65 && p.progress < 0.78) {
                        speed *= 0.18; // Underpass hydroplaning crawl
                    }
                } else if (currentScenario === 'flyoverCollision') {
                    if (p.progress > 0.08 && p.progress < 0.22) {
                        speed *= 0.15; // Cyber towers flyover pileup
                    }
                }
            }

            p.progress += speed;
            if (p.progress >= 1.0) {
                p.progress = 0;
                if (p.isBypass && p.routeId === 'primary') {
                    p.isBypass = false;
                    p.path = this.corridorPoints;
                    p.meta = this.corridorMeta;
                }
            }

            // Interpolate position along LatLng segments (Precision Road-Snapped)
            const pos = this._getPointAtProgress(path, p.progress, p.meta);
            if (!pos) return;

            const pt = this.map.latLngToContainerPoint(pos);

            // Draw glowing vehicle particle
            this.ctx.save();
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 4;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // If Emergency Ambulance Corridor is active, draw the flashing fast ambulance
        if (currentScenario === 'ambulanceCorridor') {
            this.ambulanceProgress = (this.ambulanceProgress + 0.0028) % 1.0;
            const pos = this._getPointAtProgress(this.corridorPoints, this.ambulanceProgress, this.corridorMeta);
            if (pos) {
                const pt = this.map.latLngToContainerPoint(pos);
                this.ctx.save();
                // Flashing emergency pulse ring
                const pulse = (Date.now() % 600) / 600;
                this.ctx.strokeStyle = `rgba(16, 185, 129, ${1 - pulse})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, 6 + pulse * 14, 0, Math.PI * 2);
                this.ctx.stroke();

                // Ambulance body
                this.ctx.fillStyle = '#ffffff';
                this.ctx.shadowColor = '#10b981';
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
                this.ctx.fill();

                // Red Cross / Siren center
                this.ctx.fillStyle = '#ef4444';
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }
    }

    _getPointAtProgress(coords, progress, meta) {
        if (!coords || coords.length === 0) return null;
        if (coords.length === 1) return L.latLng(coords[0]);

        if (meta && meta.dists && meta.total > 0) {
            const totalDist = meta.total;
            const targetDist = (((progress % 1.0) + 1.0) % 1.0) * totalDist;
            const dists = meta.dists;

            let low = 0, high = dists.length - 1;
            while (low <= high) {
                const mid = (low + high) >> 1;
                if (dists[mid] <= targetDist) {
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }
            const idx = Math.max(0, Math.min(coords.length - 2, high));
            const segStartDist = dists[idx];
            const segLen = (dists[idx + 1] - segStartDist) || 0.0001;
            const t = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLen));

            const p1 = coords[idx];
            const p2 = coords[idx + 1];
            const lat = p1[0] + (p2[0] - p1[0]) * t;
            const lng = p1[1] + (p2[1] - p1[1]) * t;
            return L.latLng(lat, lng);
        }

        const totalSegments = coords.length - 1;
        const scaledProgress = progress * totalSegments;
        const segmentIndex = Math.floor(scaledProgress);
        const segmentProgress = scaledProgress - segmentIndex;

        if (segmentIndex >= totalSegments) {
            return L.latLng(coords[totalSegments]);
        }

        const p1 = coords[segmentIndex];
        const p2 = coords[segmentIndex + 1];

        const lat = p1[0] + (p2[0] - p1[0]) * segmentProgress;
        const lng = p1[1] + (p2[1] - p1[1]) * segmentProgress;

        return L.latLng(lat, lng);
    }
}

window.TrafficParticleLayer = TrafficParticleLayer;
