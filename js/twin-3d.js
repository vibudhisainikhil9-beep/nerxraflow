/**
 * NEXRAFLOW AI - 3D Smart City WebGL Digital Twin Engine (Ultra-Sharp Pro SCADA Edition)
 * Built with Three.js (Procedural SCADA Aesthetics, 60 FPS, Zero External Model Dependencies)
 * Features: Raycaster Click-to-Inspect, 3D Streetlights, Holographic Wireframe Mode,
 * Tactical Web Audio, and 2-Second TelemetryBus Real-Time Synchronization.
 */

class NexraFlow3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('NexraFlow3D container #' + containerId + ' not found in document.');
            return;
        }
        this.width = this.container.clientWidth || window.innerWidth || 800;
        this.height = this.container.clientHeight || window.innerHeight || 600;

        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = (typeof THREE !== 'undefined' && THREE.Clock) ? new THREE.Clock() : null;

        // Raycasting & Inspection
        this.raycaster = (typeof THREE !== 'undefined' && THREE.Raycaster) ? new THREE.Raycaster() : null;
        this.mouse = (typeof THREE !== 'undefined' && THREE.Vector2) ? new THREE.Vector2() : null;
        this.selectedObject = null;

        // Scene objects
        this.vehicles = [];
        this.signals = [];
        this.buildings = [];
        this.streetlights = [];
        this.flyoverMesh = null;
        this.flyoverCurve = null;
        this.cyberTowers = null;
        this.waterPlane = null;
        this.rainSystem = null;
        this.incidentGroup = (typeof THREE !== 'undefined' && THREE.Group) ? new THREE.Group() : null;
        this.ambulance = null;
        this.smokeParticles = [];

        // Camera tweening & presentation tour
        this.isTweeningCam = false;
        this.camStartPos = null;
        this.camEndPos = null;
        this.camStartLookAt = null;
        this.camEndLookAt = null;
        this.camTweenTime = 0;
        this.camTweenDuration = 1.2;
        this.tourActive = false;
        this.tourIndex = 0;
        this.tourTimer = 0;
        this.tourStops = [];

        // Visual modes
        this.isWireframeHolo = false;
        this.cameraMode = 'aerial';
        this.autoRotate = false;
        this.audioMuted = false;

        // Live Corridor Telemetry
        this.scenarioId = 'nominal';
        this.corridorSpeed = 46.5;
        this.flowPCU = 1820;
        this.signalPhase = 'GREEN';
        this.isEmergencyAllRed = false;
        // Theme & Lighting Modes (Default: Dark Mode)
        this.currentTheme = localStorage.getItem('nexraflow_theme_app3') || 'dark';
        this.ambientLight = null;
        this.dirLight = null;
        this.fillLight = null;
        this.ground = null;
        this.gridHelper = null;

        this.buildingBeacons = [];
        this._initEngine();
        if (!this.renderer || !this.scene) {
            console.warn('Renderer or scene could not be initialized.');
            return;
        }

        this._initAudio();
        this._buildEnvironment();
        this._buildRoadwaysAndFlyover();
        this._buildStreetlights();
        this._buildCyberTowersLandmark();
        this._buildSkyscrapers();
        this._buildTrafficSignals();
        this._initVehicles();
        this._initWeatherEffects();
        this._initRaycaster();
        this._initTelemetrySync();
        this.setTheme(this.currentTheme, false);
        this._animate();
    }

    /* ==========================================================================
       1. ULTRA-SHARP THREE.JS ENGINE
       ========================================================================== */
    _initEngine() {
        if (typeof THREE === 'undefined') {
            console.error('Three.js library is not loaded');
            this._showWebGLErrorNotice('Three.js library not detected');
            return;
        }

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x040812);
        this.scene.fog = new THREE.FogExp2(0x040812, 0.0015);

        const aspect = (this.width && this.height) ? (this.width / this.height) : (window.innerWidth / window.innerHeight);
        this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 3500);
        this.camera.position.set(0, 180, 260);

        // High-DPI Razor-Sharp WebGL Renderer with graceful fallback
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: 'high-performance',
                stencil: false,
                depth: true
            });
        } catch (e1) {
            console.warn('High-performance WebGL context failed, trying default WebGLRenderer:', e1);
            try {
                this.renderer = new THREE.WebGLRenderer({ antialias: false });
            } catch (e2) {
                console.error('WebGL is unsupported on this system:', e2);
                this._showWebGLErrorNotice(e2.message);
                return;
            }
        }

        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if (THREE.ACESFilmicToneMapping) this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.3;
        if (THREE.sRGBEncoding) this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.container.appendChild(this.renderer.domElement);

        if (typeof THREE.OrbitControls === 'function') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.06;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
            this.controls.minDistance = 15;
            this.controls.maxDistance = 750;
            this.controls.target.set(0, 15, 0);
        } else {
            console.warn('THREE.OrbitControls not found, using static camera controller fallback.');
            this.controls = {
                target: new THREE.Vector3(0, 15, 0),
                update: () => {},
                enableDamping: false,
                autoRotate: false,
                autoRotateSpeed: 0
            };
        }

        // Crisp SCADA Lighting (Configured for Dynamic Day/Night Mode)
        this.ambientLight = new THREE.AmbientLight(0x1a2942, 1.5);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
        this.dirLight.position.set(120, 260, 100);
        this.scene.add(this.dirLight);

        this.fillLight = new THREE.DirectionalLight(0x818cf8, 0.7);
        this.fillLight.position.set(-140, 160, -120);
        this.scene.add(this.fillLight);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    _showWebGLErrorNotice(reason) {
        if (!this.container) return;
        this.container.innerHTML = `
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(15,23,42,0.94);border:1px solid rgba(239,68,68,0.4);border-radius:12px;padding:28px 36px;color:#f8fafc;font-family:Inter,sans-serif;text-align:center;max-width:500px;box-shadow:0 8px 32px rgba(0,0,0,0.6);backdrop-filter:blur(16px);z-index:9999;">
                <div style="font-size:36px;color:#f87171;margin-bottom:12px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div style="font-size:16px;font-weight:600;margin-bottom:8px;">3D WebGL Acceleration Notice</div>
                <div style="font-size:13px;color:#cbd5e1;line-height:1.6;margin-bottom:18px;">
                    Hardware Acceleration or WebGL is currently unavailable in this browser window (${reason || 'Context not acquired'}).
                </div>
                <div style="display:flex;gap:10px;justify-content:center;">
                    <button onclick="location.reload()" style="background:#1d4ed8;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
                        Reload
                    </button>
                    <a href="index.html" style="background:rgba(255,255,255,0.08);color:#cbd5e1;border:1px solid rgba(255,255,255,0.15);padding:8px 18px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;">
                        Open 2D Cockpit
                    </a>
                </div>
            </div>
        `;
    }

    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    }

    /* ==========================================================================
       2. TACTICAL WEB AUDIO SYNTHESIZER
       ========================================================================== */
    _initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    playUiPing(freq = 880, duration = 0.08) {
        if (this.audioMuted || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.audioCtx.currentTime + duration);

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    playSirenChime() {
        if (this.audioMuted || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.linearRampToValueAtTime(950, now + 0.25);
        osc.frequency.linearRampToValueAtTime(650, now + 0.5);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + 0.55);
    }

    /* ==========================================================================
       3. ENVIRONMENT & TERRAIN
       ========================================================================== */
    _buildEnvironment() {
        const groundGeo = new THREE.PlaneGeometry(1400, 1400);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x08111f,
            roughness: 0.92,
            metalness: 0.08,
            envMapIntensity: 0.3
        });
        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.15;
        this.scene.add(this.ground);

        // Sidewalk / Park strips
        const parkMat = new THREE.MeshStandardMaterial({ color: 0x0a1a0f, roughness: 0.95 });
        const parkLeft = new THREE.Mesh(new THREE.PlaneGeometry(180, 900), parkMat);
        parkLeft.rotation.x = -Math.PI / 2;
        parkLeft.position.set(-110, 0.05, 0);
        this.scene.add(parkLeft);
        const parkRight = new THREE.Mesh(new THREE.PlaneGeometry(180, 900), parkMat);
        parkRight.rotation.x = -Math.PI / 2;
        parkRight.position.set(110, 0.05, 0);
        this.scene.add(parkRight);

        // Ground Reference Grid
        this.gridHelper = new THREE.GridHelper(1200, 120, 0x0891b2, 0x082f49);
        this.gridHelper.position.y = 0;
        this.scene.add(this.gridHelper);

        // Stars
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1200;
        const starPos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount * 3; i += 3) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1) * 0.45; // upper hemisphere only
            const r = 800;
            starPos[i]   = r * Math.sin(phi) * Math.cos(theta);
            starPos[i+1] = Math.abs(r * Math.cos(phi)) + 80; // above horizon only
            starPos[i+2] = r * Math.sin(phi) * Math.sin(theta);
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        this.starField = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0.85 }));
        this.scene.add(this.starField);

        // City ambient ground glow
        const glowLeft = new THREE.PointLight(0x0284c7, 0.8, 180);
        glowLeft.position.set(-90, 5, 0);
        this.scene.add(glowLeft);
        const glowRight = new THREE.PointLight(0x0ea5e9, 0.8, 180);
        glowRight.position.set(90, 5, 0);
        this.scene.add(glowRight);
        const glowFar = new THREE.PointLight(0x818cf8, 0.5, 220);
        glowFar.position.set(-90, 20, -280);
        this.scene.add(glowFar);

        this.scene.add(this.incidentGroup);
    }


    /* ==========================================================================
       4. ROAD NETWORK, FLYOVER & BYPASS
       ========================================================================== */
    _buildRoadwaysAndFlyover() {
        const roadGroup = new THREE.Group();

        // 6-Lane Surface Arterial Highway
        const mainRoadGeo = new THREE.PlaneGeometry(40, 840);
        const mainRoadMat = new THREE.MeshStandardMaterial({
            color: 0x0e1726,
            roughness: 0.6,
            metalness: 0.25
        });
        const mainRoad = new THREE.Mesh(mainRoadGeo, mainRoadMat);
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.set(0, 0.1, 0);
        roadGroup.add(mainRoad);

        // Curbs with sharp neon borders
        const curbMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
        const leftCurb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 840), curbMat);
        leftCurb.position.set(-20.4, 0.25, 0);
        roadGroup.add(leftCurb);

        const rightCurb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 840), curbMat);
        rightCurb.position.set(20.4, 0.25, 0);
        roadGroup.add(rightCurb);

        // White dashed lane divider lines (4 clearly defined corridor lanes)
        const dashMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
        [-9.0, 9.0].forEach(laneX => {
            for (let z = -400; z <= 400; z += 12) {
                const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 5.5), dashMat);
                dash.rotation.x = -Math.PI / 2;
                dash.position.set(laneX, 0.2, z);
                roadGroup.add(dash);
            }
        });

        // Center double amber line
        const centerLine = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 840), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.set(0, 0.21, 0);
        roadGroup.add(centerLine);

        // Pedestrian Zebra Crossings ahead of signal gantries
        [-195, -45, 145].forEach(crossZ => {
            for (let x = -19; x <= 19; x += 2.2) {
                if (Math.abs(x) < 1.0) continue;
                const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 4.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
                stripe.rotation.x = -Math.PI / 2;
                stripe.position.set(x, 0.22, crossZ);
                roadGroup.add(stripe);
            }
        });

        // Elevated Flyover
        const flyoverGroup = new THREE.Group();
        const flyoverWidth = 20;

        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.5, -130),
            new THREE.Vector3(0, 10, -65),
            new THREE.Vector3(0, 18, 0),
            new THREE.Vector3(0, 10, 65),
            new THREE.Vector3(0, 0.5, 130)
        ]);

        const deckShape = new THREE.Shape();
        deckShape.moveTo(-flyoverWidth / 2, 0);
        deckShape.lineTo(flyoverWidth / 2, 0);
        deckShape.lineTo(flyoverWidth / 2 - 0.6, -2.2);
        deckShape.lineTo(-flyoverWidth / 2 + 0.6, -2.2);
        deckShape.closePath();

        const extrudeSettings = { steps: 50, extrudePath: curve, bevelEnabled: false };
        const deckGeo = new THREE.ExtrudeGeometry(deckShape, extrudeSettings);
        const deckMat = new THREE.MeshStandardMaterial({ color: 0x111e33, roughness: 0.5, metalness: 0.4 });
        this.flyoverMesh = new THREE.Mesh(deckGeo, deckMat);
        this.flyoverMesh.name = 'Mindspace Elevated Flyover Viaduct';
        flyoverGroup.add(this.flyoverMesh);

        // Glowing Guardrails
        const railCurveLeft = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-flyoverWidth / 2, 1.2, -130),
            new THREE.Vector3(-flyoverWidth / 2, 11.2, -65),
            new THREE.Vector3(-flyoverWidth / 2, 19.2, 0),
            new THREE.Vector3(-flyoverWidth / 2, 11.2, 65),
            new THREE.Vector3(-flyoverWidth / 2, 1.2, 130)
        ]);
        const leftRail = new THREE.Mesh(new THREE.TubeGeometry(railCurveLeft, 35, 0.35, 8, false), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
        flyoverGroup.add(leftRail);

        const railCurveRight = new THREE.CatmullRomCurve3([
            new THREE.Vector3(flyoverWidth / 2, 1.2, -130),
            new THREE.Vector3(flyoverWidth / 2, 11.2, -65),
            new THREE.Vector3(flyoverWidth / 2, 19.2, 0),
            new THREE.Vector3(flyoverWidth / 2, 11.2, 65),
            new THREE.Vector3(flyoverWidth / 2, 1.2, 130)
        ]);
        const rightRail = new THREE.Mesh(new THREE.TubeGeometry(railCurveRight, 35, 0.35, 8, false), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
        flyoverGroup.add(rightRail);

        // Pillars
        const pillarGeo = new THREE.CylinderGeometry(1.8, 1.8, 18, 16);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

        const p1 = new THREE.Mesh(pillarGeo, pillarMat);
        p1.position.set(0, 7.5, -45);
        p1.scale.set(1, 13 / 18, 1);
        flyoverGroup.add(p1);

        const p2 = new THREE.Mesh(pillarGeo, pillarMat);
        p2.position.set(0, 9, 0);
        flyoverGroup.add(p2);

        const p3 = new THREE.Mesh(pillarGeo, pillarMat);
        p3.position.set(0, 7.5, 45);
        p3.scale.set(1, 13 / 18, 1);
        flyoverGroup.add(p3);

        this.flyoverCurve = curve;
        roadGroup.add(flyoverGroup);

        // Durgam Cheruvu Bypass Link
        const bypassCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(20, 0.2, -50),
            new THREE.Vector3(65, 4, -10),
            new THREE.Vector3(125, 8, 40),
            new THREE.Vector3(185, 2, 130)
        ]);
        const bypassMesh = new THREE.Mesh(
            new THREE.TubeGeometry(bypassCurve, 35, 4.5, 6, false),
            new THREE.MeshStandardMaterial({ color: 0x083344, roughness: 0.6, metalness: 0.3 })
        );
        bypassMesh.scale.set(1, 0.05, 1);
        roadGroup.add(bypassMesh);

        // Wet road reflection strip (centre)
        const wetMat = new THREE.MeshStandardMaterial({ color: 0x0e2038, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.4 });
        const wetRoad = new THREE.Mesh(new THREE.PlaneGeometry(38, 840), wetMat);
        wetRoad.rotation.x = -Math.PI / 2;
        wetRoad.position.set(0, 0.12, 0);
        this.scene.add(wetRoad);
        this.wetRoad = wetRoad;

        // Cable Bridge Pylons
        const cableBridgeTower = new THREE.Group();
        const pylonGeo = new THREE.CylinderGeometry(0.9, 2.0, 48, 8);
        const pylonMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x083344 });
        const pylon1 = new THREE.Mesh(pylonGeo, pylonMat);
        pylon1.position.set(125, 21, 36);
        pylon1.rotation.z = -0.15;
        cableBridgeTower.add(pylon1);

        const pylon2 = new THREE.Mesh(pylonGeo, pylonMat);
        pylon2.position.set(125, 21, 44);
        pylon2.rotation.z = 0.15;
        cableBridgeTower.add(pylon2);

        const cableMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.7, transparent: true });
        for (let i = -3; i <= 3; i++) {
            const cableGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(125, 38, 40),
                new THREE.Vector3(125 + i * 15, 8, 40)
            ]);
            cableBridgeTower.add(new THREE.Line(cableGeo, cableMat));
        }
        roadGroup.add(cableBridgeTower);

        this.scene.add(roadGroup);
    }

    /* ==========================================================================
       5. 3D STREETLIGHTS & ASPHALT ILLUMINATION
       ========================================================================== */
    _buildStreetlights() {
        const streetGroup = new THREE.Group();
        const poleGeo = new THREE.CylinderGeometry(0.25, 0.3, 14, 8);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        for (let z = -380; z <= 380; z += 55) {
            // Left Pole
            const leftPole = new THREE.Mesh(poleGeo, poleMat);
            leftPole.position.set(-22, 7, z);
            streetGroup.add(leftPole);

            const lampLeft = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), lampMat);
            lampLeft.position.set(-20, 13.8, z);
            streetGroup.add(lampLeft);

            // Right Pole
            const rightPole = new THREE.Mesh(poleGeo, poleMat);
            rightPole.position.set(22, 7, z);
            streetGroup.add(rightPole);

            const lampRight = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), lampMat);
            lampRight.position.set(20, 13.8, z);
            streetGroup.add(lampRight);
        }

        this.scene.add(streetGroup);
    }

    /* ==========================================================================
       6. CYBER TOWERS PROCEDURAL LANDMARK
       ========================================================================== */
    _buildCyberTowersLandmark() {
        const ctGroup = new THREE.Group();
        ctGroup.position.set(-85, 0, -230);
        ctGroup.name = 'Cyber Towers (J-01 Iconic Landmark)';

        const baseGeo = new THREE.CylinderGeometry(28, 30, 8, 32);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 4;
        ctGroup.add(base);

        const coreGeo = new THREE.CylinderGeometry(24, 26, 90, 32);
        const coreMat = new THREE.MeshStandardMaterial({ color: 0x0a192f, roughness: 0.3, metalness: 0.7 });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = 49;
        ctGroup.add(core);

        const bandMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        for (let y = 15; y < 90; y += 8) {
            const band = new THREE.Mesh(new THREE.CylinderGeometry(24.2, 24.2, 1.2, 32), bandMat);
            band.position.y = y;
            ctGroup.add(band);
        }

        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.8 })
        );
        dome.position.y = 94;
        ctGroup.add(dome);

        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 30, 8), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        antenna.position.y = 94 + 15;
        ctGroup.add(antenna);

        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        this.ctBeacon = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 16), beaconMat);
        this.ctBeacon.position.y = 108;
        ctGroup.add(this.ctBeacon);

        const plate = new THREE.Mesh(new THREE.BoxGeometry(44, 6, 2), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
        plate.position.set(0, 18, 27);
        ctGroup.add(plate);

        // 4 secondary towers around the main cylinder
        const secTowerPositions = [{x:36,z:0},{x:-36,z:0},{x:0,z:36},{x:0,z:-36}];
        secTowerPositions.forEach(tp => {
            const sec = new THREE.Mesh(new THREE.CylinderGeometry(10, 12, 60, 16),
                new THREE.MeshStandardMaterial({color:0x0a192f, roughness:0.4, metalness:0.6}));
            sec.position.set(tp.x, 30, tp.z);
            ctGroup.add(sec);
            const secBand = new THREE.Mesh(new THREE.CylinderGeometry(10.2, 10.2, 1.0, 16),
                new THREE.MeshBasicMaterial({color:0x0284c7}));
            secBand.position.set(tp.x, 50, tp.z);
            ctGroup.add(secBand);
        });

        this.cyberTowers = ctGroup;
        this.scene.add(ctGroup);
    }


    /* ==========================================================================
       7. CYBERABAD SKYSCRAPERS & WIREFRAME MODE
       ========================================================================== */
    _buildSkyscrapers() {
        this.buildingGroup = new THREE.Group();
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e3a5f });

        const BUILDINGS_LEFT = [
            {x:-55,z:-320,h:160,w:28,d:28},{x:-80,z:-260,h:90,w:22,d:22},{x:-45,z:-200,h:120,w:24,d:24},
            {x:-70,z:-140,h:75,w:20,d:20},{x:-55,z:-80,h:100,w:26,d:26},{x:-80,z:-20,h:55,w:18,d:18},
            {x:-50,z:40,h:80,w:22,d:22},{x:-75,z:100,h:140,w:28,d:28},{x:-55,z:160,h:65,w:20,d:20},
            {x:-80,z:220,h:110,w:24,d:24},{x:-55,z:280,h:90,w:22,d:22},{x:-75,z:340,h:130,w:26,d:26},
            {x:-120,z:-300,h:180,w:32,d:32},{x:-110,z:-150,h:95,w:24,d:24},{x:-130,z:50,h:150,w:30,d:30},
            {x:-115,z:250,h:85,w:22,d:22}
        ];
        const BUILDINGS_RIGHT = [
            {x:55,z:-320,h:140,w:26,d:26},{x:80,z:-260,h:85,w:22,d:22},{x:55,z:-200,h:110,w:24,d:24},
            {x:75,z:-140,h:70,w:20,d:20},{x:55,z:-80,h:95,w:24,d:24},{x:80,z:-20,h:60,w:18,d:18},
            {x:55,z:40,h:75,w:22,d:22},{x:78,z:100,h:125,w:28,d:28},{x:55,z:160,h:60,w:20,d:20},
            {x:80,z:220,h:105,w:24,d:24},{x:55,z:280,h:85,w:22,d:22},{x:78,z:340,h:120,w:26,d:26},
            {x:120,z:-290,h:175,w:32,d:32},{x:115,z:-120,h:90,w:24,d:24},{x:125,z:80,h:145,w:30,d:30},
            {x:118,z:270,h:80,w:22,d:22}
        ];

        const allBuildings = BUILDINGS_LEFT.concat(BUILDINGS_RIGHT);

        allBuildings.forEach((b, idx) => {
            const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
            const mat = new THREE.MeshStandardMaterial({ color: 0x09111e, roughness: 0.4, metalness: 0.8 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(b.x, b.h / 2, b.z);
            mesh.name = `Tower-${idx}`;
            this.buildingGroup.add(mesh);

            // Edge wireframe
            const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat.clone());
            wire.position.copy(mesh.position);
            this.buildingGroup.add(wire);

            // Window glow rows every 8 units of height
            for (let wy = 8; wy < b.h; wy += 8) {
                const winMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9, opacity: 0.6, transparent: true });
                const win = new THREE.Mesh(new THREE.BoxGeometry(b.w * 0.9, 1.2, b.d + 0.3), winMat);
                win.position.set(b.x, wy, b.z);
                this.buildingGroup.add(win);
            }

            // Rooftop antenna + blinking beacon on tall buildings
            if (b.h > 120) {
                const antennaMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
                const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 20, 8), antennaMat);
                antenna.position.set(b.x, b.h + 10, b.z);
                this.buildingGroup.add(antenna);

                const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
                const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), beaconMat);
                beacon.position.set(b.x, b.h + 21, b.z);
                this.buildingGroup.add(beacon);
                this.buildingBeacons.push(beacon);
            }

            this.buildings.push(mesh);
        });

        this.scene.add(this.buildingGroup);
    }


    toggleHoloWireframe() {
        this.isWireframeHolo = !this.isWireframeHolo;
        this.buildings.forEach(b => {
            b.material.wireframe = this.isWireframeHolo;
            b.material.color.setHex(this.isWireframeHolo ? 0x06b6d4 : 0x09111e);
        });
        if (this.flyoverMesh) {
            this.flyoverMesh.material.wireframe = this.isWireframeHolo;
        }
        return this.isWireframeHolo;
    }

    /* ==========================================================================
       8. DYNAMIC 3D TRAFFIC SIGNAL GANTRIES
       ========================================================================== */
    _buildTrafficSignals() {
        const gantryZPositions = [-180, -30, 160];

        gantryZPositions.forEach(z => {
            const gantry = new THREE.Group();
            gantry.position.set(0, 0, z);

            const trussMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
            const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 16, 8), trussMat);
            leftLeg.position.set(-21, 8, 0);
            gantry.add(leftLeg);

            const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 16, 8), trussMat);
            rightLeg.position.set(21, 8, 0);
            gantry.add(rightLeg);

            const crossbeam = new THREE.Mesh(new THREE.BoxGeometry(43, 1.2, 1.2), trussMat);
            crossbeam.position.set(0, 15.5, 0);
            gantry.add(crossbeam);

            const laneSignals = [];
            [-12, -4, 4, 12].forEach(laneX => {
                const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, 1.2), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
                box.position.set(laneX, 13.5, 0);

                const lensGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
                lensGeo.rotateX(Math.PI / 2);

                const redLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x330000 }));
                redLens.position.set(0, 1.2, 0.6);
                box.add(redLens);

                const amberLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x332200 }));
                amberLens.position.set(0, 0, 0.6);
                box.add(amberLens);

                const greenLens = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
                greenLens.position.set(0, -1.2, 0.6);
                box.add(greenLens);

                gantry.add(box);
                laneSignals.push({ red: redLens, amber: amberLens, green: greenLens });
            });

            const signalSpot = new THREE.SpotLight(0x10b981, 2.8, 40, Math.PI / 5, 0.5);
            signalSpot.position.set(0, 15, 2);
            signalSpot.target.position.set(0, 0, 12);
            gantry.add(signalSpot);
            gantry.add(signalSpot.target);

            this.signals.push({ gantry, laneSignals, spot: signalSpot, phase: 'green' });
            this.scene.add(gantry);
        });
    }

    setSignalPhase(phase) {
        const p = (phase || 'GREEN').toLowerCase();
        this.signalPhase = p.toUpperCase();
        this.isEmergencyAllRed = (p === 'red');
        this.signals.forEach(s => {
            s.phase = p;
            const isGreen = p === 'green';
            const isRed = p === 'red';
            const isAmber = p === 'amber';

            s.laneSignals.forEach(ls => {
                ls.green.material.color.setHex(isGreen ? 0x10b981 : 0x064e3b);
                ls.red.material.color.setHex(isRed ? 0xef4444 : 0x450a0a);
                ls.amber.material.color.setHex(isAmber ? 0xf59e0b : 0x451a03);
            });

            s.spot.color.setHex(isGreen ? 0x10b981 : (isRed ? 0xef4444 : 0xf59e0b));
        });
    }

    /* ==========================================================================
       9. 3D IRC:106 HIGH-FIDELITY VEHICLE FLEET & LANE MANAGEMENT
       ========================================================================== */
    _initVehicles() {
        this.vehicleGroup = new THREE.Group();
        this.scene.add(this.vehicleGroup);

        const laneConfigs = [
            { id: 0, x: -13.5, name: 'West Surface Outer', canFlyover: false },
            { id: 1, x: -4.5,  name: 'West Inner (Flyover Capable)', canFlyover: true },
            { id: 2, x:  4.5,  name: 'East Inner (Flyover Capable)', canFlyover: true },
            { id: 3, x:  13.5, name: 'East Surface Outer', canFlyover: false }
        ];

        // 48 evenly spaced, high-fidelity vehicles across 4 structured lanes
        const vehiclesPerLane = 12;
        let globalIdx = 0;

        laneConfigs.forEach(laneCfg => {
            for (let i = 0; i < vehiclesPerLane; i++) {
                const rand = Math.random();
                let type = 'car';
                if (rand < 0.35) type = '2w';
                else if (rand < 0.55) type = 'auto';
                else if (rand < 0.86) type = 'car';
                else type = 'bus';

                const vehicleData = this._createVehicleModel(type, globalIdx);
                const vehicleMesh = vehicleData.mesh;

                // Guaranteed non-overlapping initial longitudinal spacing (62m base spacing)
                const z = -380 + i * 62 + (Math.random() - 0.5) * 10;
                const useFlyover = laneCfg.canFlyover && (Math.random() < 0.65);

                this.vehicles.push({
                    id: `TS-09-${type.toUpperCase()}-${1000 + globalIdx}`,
                    mesh: vehicleMesh,
                    type: type,
                    lane: laneCfg.id,
                    baseLaneX: laneCfg.x,
                    currentLaneX: laneCfg.x,
                    targetLaneX: laneCfg.x,
                    z: z,
                    currentSpeed: 0.8,
                    targetSpeed: 0.8,
                    cruiseSpeedMultiplier: 0.92 + Math.random() * 0.20,
                    useFlyover: useFlyover,
                    isBraking: false,
                    isQueueLocked: false,
                    turnSignal: 'none',
                    tailLights: vehicleData.tailLights || [],
                    leftBlinker: vehicleData.leftBlinker,
                    rightBlinker: vehicleData.rightBlinker
                });

                this.vehicleGroup.add(vehicleMesh);
                globalIdx++;
            }
        });
    }

    _createVehicleModel(type, idx) {
        const v = new THREE.Group();
        v.name = `Vehicle #${idx} (${type.toUpperCase()})`;
        const tailLights = [];
        let leftBlinker = null;
        let rightBlinker = null;

        // Ground Contact Shadow Helper
        const addGroundShadow = (w, d) => {
            const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false });
            const s = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadowMat);
            s.rotation.x = -Math.PI / 2;
            s.position.y = 0.04;
            v.add(s);
        };

        // Realistic Wheel Helper (Cylinder tire + metallic hubcap)
        const addWheel = (x, y, z, radius = 0.45, width = 0.28) => {
            const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 16);
            tireGeo.rotateZ(Math.PI / 2);
            const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.position.set(x, y, z);

            const hubGeo = new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, width + 0.02, 12);
            hubGeo.rotateZ(Math.PI / 2);
            const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
            const hub = new THREE.Mesh(hubGeo, hubMat);
            tire.add(hub);
            v.add(tire);
        };

        if (type === '2w') {
            addGroundShadow(1.2, 2.6);
            // Motorcycle Frame
            const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 2.1), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 }));
            frame.position.y = 0.85;
            v.add(frame);

            // Rider Torso & Helmet
            const riderTorso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.7, 0.5), new THREE.MeshStandardMaterial({ color: 0x334155 }));
            riderTorso.position.set(0, 1.45, -0.1);
            v.add(riderTorso);

            const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2 }));
            helmet.position.set(0, 1.95, -0.05);
            v.add(helmet);

            // Wheels
            addWheel(0, 0.42, 0.85, 0.42, 0.16);
            addWheel(0, 0.42, -0.85, 0.42, 0.16);

            // Headlight
            const hl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            hl.position.set(0, 1.0, 1.12);
            v.add(hl);

            // Tail light
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl.position.set(0, 0.85, -1.08);
            v.add(tl);
            tailLights.push(tl);
        } else if (type === 'auto') {
            addGroundShadow(1.9, 3.1);
            // Green lower body
            const lower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 2.7), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.3 }));
            lower.position.y = 0.75;
            v.add(lower);

            // Yellow canopy
            const hood = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.0, 2.5), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 }));
            hood.position.y = 1.65;
            v.add(hood);

            // Windshield glass
            const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.65), new THREE.MeshBasicMaterial({ color: 0x38bdf8, opacity: 0.7, transparent: true }));
            glass.position.set(0, 1.65, 1.28);
            v.add(glass);

            // 3 Wheels (1 Front, 2 Rear)
            addWheel(0, 0.38, 1.15, 0.38, 0.22);
            addWheel(-0.72, 0.38, -0.95, 0.38, 0.22);
            addWheel(0.72, 0.38, -0.95, 0.38, 0.22);

            // Headlight
            const hl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            hl.position.set(0, 0.95, 1.38);
            v.add(hl);

            // Tail lights
            const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl1.position.set(-0.6, 0.75, -1.38);
            v.add(tl1);
            const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl2.position.set(0.6, 0.75, -1.38);
            v.add(tl2);
            tailLights.push(tl1, tl2);

            // Turn blinkers
            const bl1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e1202 }));
            bl1.position.set(-0.75, 0.95, 1.32);
            v.add(bl1);
            const bl2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e1202 }));
            bl2.position.set(0.75, 0.95, 1.32);
            v.add(bl2);
            leftBlinker = bl1;
            rightBlinker = bl2;
        } else if (type === 'bus') {
            addGroundShadow(3.2, 11.2);
            // Red TSRTC Express Bus
            const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.1, 10.6), new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35, metalness: 0.2 }));
            busBody.position.y = 2.0;
            v.add(busBody);

            // Cream / White Roof
            const roof = new THREE.Mesh(new THREE.BoxGeometry(2.82, 0.35, 10.62), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
            roof.position.y = 3.65;
            v.add(roof);

            // Tinted Windows (Side stripes)
            const winMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, opacity: 0.85, transparent: true });
            const winLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 9.6), winMat);
            winLeft.position.set(-1.43, 2.3, 0);
            v.add(winLeft);
            const winRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 9.6), winMat);
            winRight.position.set(1.43, 2.3, 0);
            v.add(winRight);

            // Windshield (Front & Rear)
            const frontShield = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), winMat);
            frontShield.position.set(0, 2.3, 5.32);
            v.add(frontShield);

            // 6 Wheels (2 front, 4 rear dual-axle)
            addWheel(-1.35, 0.55, 3.6, 0.55, 0.32);
            addWheel(1.35, 0.55, 3.6, 0.55, 0.32);
            addWheel(-1.35, 0.55, -2.8, 0.55, 0.32);
            addWheel(1.35, 0.55, -2.8, 0.55, 0.32);
            addWheel(-1.35, 0.55, -4.2, 0.55, 0.32);
            addWheel(1.35, 0.55, -4.2, 0.55, 0.32);

            // Headlights
            const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            hl1.position.set(-1.0, 1.1, 5.34);
            v.add(hl1);
            const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            hl2.position.set(1.0, 1.1, 5.34);
            v.add(hl2);

            // Tail lights
            const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl1.position.set(-1.0, 1.1, -5.34);
            v.add(tl1);
            const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.3, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl2.position.set(1.0, 1.1, -5.34);
            v.add(tl2);
            tailLights.push(tl1, tl2);

            // Turn blinkers
            const bl1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e1202 }));
            bl1.position.set(-1.38, 1.8, 5.2);
            v.add(bl1);
            const bl2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e1202 }));
            bl2.position.set(1.38, 1.8, 5.2);
            v.add(bl2);
            leftBlinker = bl1;
            rightBlinker = bl2;
        } else {
            // High-Performance Passenger Sedan / SUV
            addGroundShadow(2.4, 4.8);
            const colors = [0xf8fafc, 0x1e293b, 0x0284c7, 0x0d9488, 0x6366f1, 0xd97706];
            const carColor = colors[Math.floor(Math.random() * colors.length)];

            // Lower Chassis
            const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.75, 4.5), new THREE.MeshStandardMaterial({ color: carColor, roughness: 0.25, metalness: 0.6 }));
            chassis.position.y = 0.65;
            v.add(chassis);

            // Cabin & Greenhouse
            const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.68, 2.6), new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.2 }));
            cabin.position.set(0, 1.32, -0.2);
            v.add(cabin);

            // Windshield Glass
            const winMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, opacity: 0.75, transparent: true });
            const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.65), winMat);
            frontGlass.position.set(0, 1.34, 1.12);
            frontGlass.rotation.x = -Math.PI / 6;
            v.add(frontGlass);

            // 4 Wheels
            addWheel(-0.95, 0.42, 1.45, 0.42, 0.24);
            addWheel(0.95, 0.42, 1.45, 0.42, 0.24);
            addWheel(-0.95, 0.42, -1.45, 0.42, 0.24);
            addWheel(0.95, 0.42, -1.45, 0.42, 0.24);

            // Dual LED Headlights
            const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            hl1.position.set(-0.72, 0.72, 2.28);
            v.add(hl1);
            const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
            hl2.position.set(0.72, 0.72, 2.28);
            v.add(hl2);

            // Dual Responsive Tail Lights (dim red cruising, bright glowing red when braking)
            const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl1.position.set(-0.72, 0.75, -2.28);
            v.add(tl1);
            const tl2 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.08), new THREE.MeshBasicMaterial({ color: 0x4a0404 }));
            tl2.position.set(0.72, 0.75, -2.28);
            v.add(tl2);
            tailLights.push(tl1, tl2);

            // Turn blinkers
            const bl1 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e1202 }));
            bl1.position.set(-0.95, 0.72, 2.18);
            v.add(bl1);
            const bl2 = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0x1e1202 }));
            bl2.position.set(0.95, 0.72, 2.18);
            v.add(bl2);
            leftBlinker = bl1;
            rightBlinker = bl2;
        }

        return { mesh: v, tailLights, leftBlinker, rightBlinker };
    }

    /* ==========================================================================
       10. RAYCASTER CLICK-TO-INSPECT (Holographic Card)
       ========================================================================== */
    _initRaycaster() {
        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Targets: Vehicles, Cyber Towers, Flyover
            const clickableTargets = [];
            this.vehicles.forEach(v => clickableTargets.push(v.mesh));
            if (this.cyberTowers) clickableTargets.push(this.cyberTowers);
            if (this.flyoverMesh) clickableTargets.push(this.flyoverMesh);

            const intersects = this.raycaster.intersectObjects(clickableTargets, true);
            if (intersects.length > 0) {
                const hit = intersects[0];
                this._handleObjectClick(hit);
            }
        });
    }

    _handleObjectClick(hit) {
        this.playUiPing(1040, 0.09);

        // Find if vehicle
        let parentVehicle = null;
        let obj = hit.object;
        while (obj && obj.parent) {
            const found = this.vehicles.find(v => v.mesh === obj);
            if (found) {
                parentVehicle = found;
                break;
            }
            obj = obj.parent;
        }

        let detail = {};
        if (parentVehicle) {
            const v = parentVehicle;
            const weightMap = { '2w': '0.5 PCU', 'auto': '1.2 PCU', 'car': '1.0 PCU', 'bus': '3.0 PCU' };
            const typeMap = { '2w': 'Two-Wheeler (Motorbike)', 'auto': 'Auto-Rickshaw (3-Wheeler)', 'car': 'Sedan / Cab', 'bus': 'TSRTC Heavy Bus' };
            detail = {
                title: `VEHICLE ${v.id}`,
                badge: typeMap[v.type] || 'Vehicle',
                fields: [
                    { label: 'IRC:106 Weight', value: weightMap[v.type] || '1.0 PCU' },
                    { label: 'Speed', value: `${(this.corridorSpeed * v.speedMultiplier).toFixed(1)} km/h` },
                    { label: 'Lane', value: `Lane ${v.lane + 1} (${v.useFlyover ? 'Flyover Deck' : 'Surface Highway'})` },
                    { label: 'Telemetry Health', value: '100% Synced' }
                ]
            };
        } else if (hit.object.name && hit.object.name.includes('Flyover')) {
            detail = {
                title: 'INFRASTRUCTURE NODE: MINDSPACE FLYOVER',
                badge: 'GRADE-SEPARATED VIADUCT',
                fields: [
                    { label: 'Length', value: '240 Meters' },
                    { label: 'Grade Slope', value: '+4.2% Incline' },
                    { label: 'Design Speed', value: '50 km/h' },
                    { label: 'IRC Code', value: 'IRC:SP:41 Compliant' }
                ]
            };
        } else {
            detail = {
                title: 'JUNCTION: CYBER TOWERS (J-01)',
                badge: 'ARTERIAL LANDMARK',
                fields: [
                    { label: 'GPS Coords', value: '17.4504° N, 78.3808° E' },
                    { label: 'Design Capacity', value: '3,800 PCU/h' },
                    { label: 'Active Queue', value: '45 PCU' },
                    { label: 'Signal Status', value: `${this.signalPhase} (${this.signalSeconds}s)` }
                ]
            };
        }

        // Dispatch to DOM overlay
        window.dispatchEvent(new CustomEvent('nexraflow:3d_inspect', { detail }));
    }

    /* ==========================================================================
       11. WEATHER & MONSOON STORM
       ========================================================================== */
    _initWeatherEffects() {
        const rainCount = 3000;
        const rainGeo = new THREE.BufferGeometry();
        const rainPositions = new Float32Array(rainCount * 3);

        for (let i = 0; i < rainCount * 3; i += 3) {
            rainPositions[i] = (Math.random() - 0.5) * 420;
            rainPositions[i + 1] = Math.random() * 220;
            rainPositions[i + 2] = (Math.random() - 0.5) * 650;
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        this.rainSystem = new THREE.Points(rainGeo, new THREE.PointsMaterial({
            color: 0x7dd3fc,
            size: 0.65,
            transparent: true,
            opacity: 0.0
        }));
        this.scene.add(this.rainSystem);

        this.waterPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(38, 130),
            new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.85, transparent: true, opacity: 0.0 })
        );
        this.waterPlane.rotation.x = -Math.PI / 2;
        this.waterPlane.position.set(0, 0.35, 160);
        this.scene.add(this.waterPlane);
    }

    /* ==========================================================================
       12. SCENARIO CONTROLLER & INCIDENTS
       ========================================================================== */
    applyScenario(scenarioId) {
        this.scenarioId = scenarioId;

        while (this.incidentGroup.children.length > 0) {
            this.incidentGroup.remove(this.incidentGroup.children[0]);
        }

        if (this.rainSystem) this.rainSystem.material.opacity = 0.0;
        if (this.waterPlane) this.waterPlane.material.opacity = 0.0;
        this.scene.fog.color.setHex(0x040812);
        this.scene.fog.density = 0.002;

        // Reset and unlock all vehicles
        if (this.vehicles && this.vehicles.length > 0) {
            this.vehicles.forEach(v => {
                v.isQueueLocked = false;
                v.turnSignal = 'none';
                v.targetLaneX = v.baseLaneX;
            });
        }

        if (scenarioId === 'nominal') {
            this.corridorSpeed = 46.5;
            this.setSignalPhase('GREEN');
        } else if (scenarioId === 'tsrtcBreakdown') {
            this.corridorSpeed = 11.2;
            this._spawnStalledTSRTCBus();
        } else if (scenarioId === 'monsoonFlood') {
            this.corridorSpeed = 8.5;
            this._triggerMonsoonStorm();
        } else if (scenarioId === 'flyoverCollision') {
            this.corridorSpeed = 9.8;
            this._spawnFlyoverCrash();
        } else if (scenarioId === 'ambulanceCorridor') {
            this.corridorSpeed = 55.0;
            this.setSignalPhase('GREEN');
            this._spawnEmergencyAmbulance();
            this.playSirenChime();
        }

        const badge = document.getElementById('hud-scenario-name');
        if (badge) badge.textContent = scenarioId.toUpperCase();

        // Highlight scenario button in 3D HUD if present
        document.querySelectorAll('.scenario-btn-3d').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-3d-${scenarioId}`);
        if (activeBtn) activeBtn.classList.add('active');

        if (scenarioId === 'ambulanceCorridor') {
            setTimeout(() => {
                if (typeof this.setCameraMode === 'function') this.setCameraMode('ambulance');
            }, 300);
        } else if (scenarioId === 'tsrtcBreakdown') {
            setTimeout(() => {
                if (typeof this.setCameraMode === 'function') this.setCameraMode('flyover');
            }, 300);
        }
    }

    _spawnStalledTSRTCBus() {
        // Clear any vehicle currently located inside the breakdown zone
        if (this.vehicles) {
            this.vehicles.forEach(v => {
                if (v.useFlyover && v.currentLaneX > 0 && v.z >= -22 && v.z <= 26) {
                    v.z = 28; // Push ahead past the breakdown
                    v.targetLaneX = v.baseLaneX;
                    v.currentLaneX = v.baseLaneX;
                }
            });
        }

        const stalledBusData = this._createVehicleModel('bus', 999);
        const stalledBus = stalledBusData.mesh;
        stalledBus.position.set(4.5, 18.2, 10);
        stalledBus.name = 'Stalled TSRTC Express (TS-09-UB-4421)';
        this.incidentGroup.add(stalledBus);
        this.stalledVehicle = stalledBusData;

        // Pulsing Overhead Hazard Incident Spotlight
        const hazardLight = new THREE.PointLight(0xf59e0b, 6, 35);
        hazardLight.position.set(4.5, 22, 10);
        this.incidentGroup.add(hazardLight);

        // 4 Realistic Emergency Traffic Cones placed behind the bus
        const coneGeo = new THREE.ConeGeometry(0.5, 1.4, 12);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
        const whiteBandMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const coneOffsets = [3, -3, -9, -15];
        coneOffsets.forEach(oz => {
            const coneGroup = new THREE.Group();
            coneGroup.position.set(4.5, 18.2, oz);

            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.y = 0.7;
            coneGroup.add(cone);

            const band = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.35, 12), whiteBandMat);
            band.position.y = 0.7;
            coneGroup.add(band);

            const flasher = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
            flasher.position.y = 1.45;
            coneGroup.add(flasher);

            this.incidentGroup.add(coneGroup);
        });

        // Billowing Smoke Particles from Engine Bay
        const smokeGeo = new THREE.DodecahedronGeometry(1.2);
        const smokeMat = new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.55 });
        this.smokeParticles = [];
        for (let i = 0; i < 6; i++) {
            const sm = new THREE.Mesh(smokeGeo, smokeMat);
            sm.position.set(4.5 + (Math.random() - 0.5) * 1.6, 20.0 + i * 1.4, 15 + (Math.random() - 0.5) * 1.6);
            sm.userData = { baseY: 20.0 + i * 1.4, speedY: 0.4 + Math.random() * 0.3, offset: i };
            this.incidentGroup.add(sm);
            this.smokeParticles.push(sm);
        }
    }

    _triggerMonsoonStorm() {
        if (this.rainSystem) this.rainSystem.material.opacity = 0.85;
        if (this.waterPlane) this.waterPlane.material.opacity = 0.7;
        this.scene.fog.color.setHex(0x0a1628);
        this.scene.fog.density = 0.005;
        this.setSignalPhase('AMBER');
    }

    _spawnFlyoverCrash() {
        // Clear any vehicle currently in the crash zone
        if (this.vehicles) {
            this.vehicles.forEach(v => {
                if (v.useFlyover && v.currentLaneX < 0 && v.z >= -62 && v.z <= -25) {
                    v.z = -20; // Push ahead past the crash
                    v.targetLaneX = v.baseLaneX;
                    v.currentLaneX = v.baseLaneX;
                }
            });
        }

        const crashCar1Data = this._createVehicleModel('car', 888);
        const crashCar1 = crashCar1Data.mesh;
        crashCar1.position.set(-4.5, 15.2, -40);
        crashCar1.rotation.y = 0.45;
        this.incidentGroup.add(crashCar1);

        const crashCar2Data = this._createVehicleModel('car', 889);
        const crashCar2 = crashCar2Data.mesh;
        crashCar2.position.set(-2.5, 15.2, -36);
        crashCar2.rotation.y = -0.75;
        this.incidentGroup.add(crashCar2);

        const crashLight = new THREE.PointLight(0xef4444, 6, 32);
        crashLight.position.set(-3.5, 17, -38);
        this.incidentGroup.add(crashLight);

        // Emergency Cones behind crash
        const coneGeo = new THREE.ConeGeometry(0.45, 1.2, 12);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        [-46, -52, -58].forEach(oz => {
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.set(-4.5, 14.5, oz);
            this.incidentGroup.add(cone);
        });
    }

    _spawnEmergencyAmbulance() {
        const amb = new THREE.Group();
        amb.name = 'Emergency 108 Ambulance Unit';

        const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 6.2), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
        body.position.y = 1.5;
        amb.add(body);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.4, 6.22), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        stripe.position.y = 1.6;
        amb.add(stripe);

        const sirenRed = new THREE.PointLight(0xef4444, 7, 45);
        sirenRed.position.set(-0.8, 3.2, 1.5);
        amb.add(sirenRed);

        const sirenBlue = new THREE.PointLight(0x0284c7, 7, 45);
        sirenBlue.position.set(0.8, 3.2, 1.5);
        amb.add(sirenBlue);

        amb.position.set(0, 0.2, -380);
        this.ambulance = amb;
        this.incidentGroup.add(amb);
    }

    /* ==========================================================================
       13. CAMERA PRESETS & PRESENTATION TOUR
       ========================================================================== */
    setCameraMode(mode) {
        this.cameraMode = mode;
        this.playUiPing(780, 0.06);

        if (mode === 'tour') {
            this.startPresentationTour();
            return;
        }

        this.tourActive = false;

        if (mode === 'aerial') {
            this._startCameraTween(new THREE.Vector3(0, 240, 290), new THREE.Vector3(0, 15, 0), 1.2);
        } else if (mode === 'cybertowers') {
            this._startCameraTween(new THREE.Vector3(-45, 55, -150), new THREE.Vector3(-90, 45, -220), 1.2);
        } else if (mode === 'flyover') {
            // Focus directly on the flyover incident & corridor
            this._startCameraTween(new THREE.Vector3(26, 32, -35), new THREE.Vector3(2, 18, 10), 1.2);
        } else if (mode === 'ambulance') {
            // Handled dynamically in animate loop following the 108 ambulance
        }
    }

    _startCameraTween(targetPos, targetLookAt, duration = 1.2) {
        this.isTweeningCam = true;
        this.camStartPos = this.camera.position.clone();
        this.camEndPos = targetPos.clone();
        this.camStartLookAt = this.controls.target.clone();
        this.camEndLookAt = targetLookAt.clone();
        this.camTweenTime = 0;
        this.camTweenDuration = duration;
    }

    _updateCameraTween(delta) {
        if (!this.isTweeningCam) return;
        this.camTweenTime += delta;
        const progress = Math.min(1.0, this.camTweenTime / this.camTweenDuration);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

        this.camera.position.lerpVectors(this.camStartPos, this.camEndPos, ease);
        this.controls.target.lerpVectors(this.camStartLookAt, this.camEndLookAt, ease);
        this.controls.update();

        if (progress >= 1.0) {
            this.isTweeningCam = false;
        }
    }

    startPresentationTour() {
        this.tourActive = true;
        this.tourIndex = 0;
        this.tourTimer = 0;
        this.tourStops = [
            { pos: new THREE.Vector3(0, 280, 340), target: new THREE.Vector3(0, 10, 0), duration: 9 },       // Grand overview
            { pos: new THREE.Vector3(26, 32, -35), target: new THREE.Vector3(2, 18, 10), duration: 8 },      // Flyover close-up
            { pos: new THREE.Vector3(-45, 55, -150), target: new THREE.Vector3(-90, 45, -220), duration: 8 }, // Cyber Towers
            { pos: new THREE.Vector3(-25, 25, -120), target: new THREE.Vector3(0, 10, -70), duration: 7 },   // Street level approach
            { pos: new THREE.Vector3(80, 40, -280), target: new THREE.Vector3(0, 15, -200), duration: 8 },   // Far building skyline
            { pos: new THREE.Vector3(0, 15, -20), target: new THREE.Vector3(0, 8, 50), duration: 7 }          // Ground level through signals
        ];
        this._applyTourStop(0);
    }


    _applyTourStop(idx) {
        const stop = this.tourStops[idx];
        if (!stop) return;
        this._startCameraTween(stop.pos, stop.target, 2.0);
    }

    _updatePresentationTour(delta) {
        if (!this.tourActive || !this.tourStops || this.tourStops.length === 0) return;
        this.tourTimer += delta;
        const currentStop = this.tourStops[this.tourIndex];
        if (this.tourTimer >= (currentStop ? currentStop.duration : 8)) {
            this.tourTimer = 0;
            this.tourIndex = (this.tourIndex + 1) % this.tourStops.length;
            this._applyTourStop(this.tourIndex);
        }
    }

    _isLaneOccupiedAround(laneX, minZ, maxZ, excludeVehicle) {
        for (let i = 0; i < this.vehicles.length; i++) {
            const v = this.vehicles[i];
            if (v === excludeVehicle) continue;
            if (Math.abs(v.currentLaneX - laneX) < 2.5) {
                if (v.z >= minZ && v.z <= maxZ) {
                    return true;
                }
            }
        }
        return false;
    }

    /* ==========================================================================
       14. TELEMETRY BUS SYNC
       ========================================================================== */
    _initTelemetrySync() {
        if (!window.telemetryBus) return;

        window.telemetryBus.subscribe(packet => {
            if (packet.action === 'scenario_change' && packet.scenarioId && packet.scenarioId !== this.scenarioId) {
                this.applyScenario(packet.scenarioId);
            }
            if (packet.rawSpeedKmh) {
                this.corridorSpeed = packet.rawSpeedKmh;
            }
            if (packet.flowPCU) {
                this.flowPCU = packet.flowPCU;
            }

            // Real-time signal updates
            if (packet.type === 'signal_update' && packet.signalState) {
                this.signalPhase = packet.signalState.phase;
                this.signalSeconds = packet.signalState.secondsRemaining;
                this.setSignalPhase(this.signalPhase);

                const phaseTimerEl = document.getElementById('hud-signal-timer');
                if (phaseTimerEl) {
                    phaseTimerEl.textContent = `${this.signalPhase} (${this.signalSeconds}s)`;
                    phaseTimerEl.className = this.signalPhase === 'GREEN' ? 'text-emerald-400 font-bold' : (this.signalPhase === 'RED' ? 'text-red-400 font-bold' : 'text-amber-400 font-bold');
                }
            }

            // Demand throttle updates
            if (packet.type === 'demand_update') {
                if (packet.flowPCU) this.flowPCU = packet.flowPCU;
                if (packet.rawSpeedKmh) this.corridorSpeed = packet.rawSpeedKmh;
            }

            // Variable Message Sign Broadcasts
            if (packet.type === 'vms_broadcast' && packet.vmsText) {
                this.showVmsNotification(packet.vmsText);
            }

            const speedEl = document.getElementById('hud-speed');
            if (speedEl) speedEl.textContent = `${this.corridorSpeed.toFixed(1)} km/h`;

            const flowEl = document.getElementById('hud-flow');
            if (flowEl) flowEl.textContent = `${this.flowPCU} PCU/h`;
        });
    }

    showVmsNotification(text) {
        const banner = document.getElementById('twin-vms-banner');
        if (!banner) return;
        banner.textContent = text;
        banner.classList.remove('hidden');
        if (this.vmsTimeout) clearTimeout(this.vmsTimeout);
        this.vmsTimeout = setTimeout(() => {
            if (banner) banner.classList.add('hidden');
        }, 8000);
        this.playUiPing(750, 0.12);
    }

    /* ==========================================================================
       THEME & DAY/NIGHT LIGHTING
       ========================================================================== */
    setTheme(theme) {
        this.currentTheme = theme;
        const isDark = (theme === 'dark');
        const root = document.documentElement;

        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');

            // 3D Scene Night Atmosphere
            if (this.scene) {
                this.scene.background = new THREE.Color(0x040812);
                if (this.scene.fog) {
                    this.scene.fog.color = new THREE.Color(0x040812);
                    this.scene.fog.density = 0.002;
                }
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0x1a2942);
                this.ambientLight.intensity = 1.5;
            }
            if (this.dirLight) {
                this.dirLight.color.setHex(0x38bdf8);
                this.dirLight.intensity = 1.4;
            }
            if (this.fillLight) {
                this.fillLight.color.setHex(0x818cf8);
                this.fillLight.intensity = 0.7;
            }
            if (this.ground) {
                this.ground.material.color.setHex(0x060b16);
            }
            if (this.gridHelper) {
                this.gridHelper.visible = true;
            }
            if (this.starField) {
                this.starField.visible = true;
            }
        } else {
            root.classList.remove('dark');
            root.classList.add('light');

            // 3D Scene Daytime Atmosphere
            if (this.scene) {
                this.scene.background = new THREE.Color(0xd7e9f7);
                if (this.scene.fog) {
                    this.scene.fog.color = new THREE.Color(0xd7e9f7);
                    this.scene.fog.density = 0.0012;
                }
            }
            if (this.ambientLight) {
                this.ambientLight.color.setHex(0xffffff);
                this.ambientLight.intensity = 1.85;
            }
            if (this.dirLight) {
                this.dirLight.color.setHex(0xfffaec);
                this.dirLight.intensity = 1.8;
            }
            if (this.fillLight) {
                this.fillLight.color.setHex(0xcae3f8);
                this.fillLight.intensity = 0.85;
            }
            if (this.ground) {
                this.ground.material.color.setHex(0xe2e8f0);
            }
            if (this.gridHelper) {
                this.gridHelper.visible = false;
            }
            if (this.starField) {
                this.starField.visible = false;
            }
        }

        // Update Theme Button
        const toggleIcon = document.getElementById('theme-toggle-icon');
        const toggleText = document.getElementById('theme-toggle-text');
        if (toggleIcon) {
            toggleIcon.className = isDark ? 'fa-solid fa-sun text-amber-400' : 'fa-solid fa-moon text-indigo-600';
        }
        if (toggleText) {
            toggleText.textContent = isDark ? 'Day Mode' : 'Night Mode';
        }

        try {
            localStorage.setItem('nexraflow_theme_app3', theme);
        } catch(e) {}
    }

    toggleTheme() {
        const next = (this.currentTheme === 'dark') ? 'light' : 'dark';
        this.setTheme(next);
        this.playUiPing(next === 'dark' ? 520 : 880, 0.08);
    }

    /* ==========================================================================
       15. 60 FPS ADVANCED TRAFFIC PHYSICS & RENDER LOOP
       ========================================================================== */
    _animate() {
        if (!this.renderer || !this.scene || !this.camera) return;
        requestAnimationFrame(() => this._animate());

        const rawDelta = this.clock ? this.clock.getDelta() : 0.016;
        const delta = Math.min(rawDelta, 0.05); // Guard against huge delta leaps on tab refocus
        const time = this.clock ? this.clock.getElapsedTime() : Date.now() * 0.001;

        // Camera Transitions & Presentation Tour
        this._updateCameraTween(delta);
        this._updatePresentationTour(delta);

        // Cyber Towers Landmark Beacon Flash
        if (this.ctBeacon) {
            this.ctBeacon.material.color.setHex((Math.floor(time * 2) % 2 === 0) ? 0xef4444 : 0x330000);
        }

        // Animate rooftop beacons on tall buildings
        if (this.buildingBeacons && this.buildingBeacons.length > 0) {
            const bOn = (Math.floor(time * 1.5) % 2 === 0);
            this.buildingBeacons.forEach((b, i) => {
                b.material.color.setHex((bOn && (i % 2 === 0)) || (!bOn && (i % 2 !== 0)) ? 0xef4444 : 0x330000);
            });
        }


        // Billowing Smoke from Stalled Incident Vehicle
        if (this.smokeParticles && this.smokeParticles.length > 0) {
            this.smokeParticles.forEach(sm => {
                sm.position.y += sm.userData.speedY * delta * 7;
                sm.scale.multiplyScalar(1 + delta * 0.15);
                if (sm.position.y > 28) {
                    sm.position.y = sm.userData.baseY;
                    sm.scale.set(1, 1, 1);
                }
            });
        }

        // Base velocity conversion
        const speedKmh = Math.max(8, this.corridorSpeed);
        const baseStep = (speedKmh / 50) * 1.55 * (delta / 0.016);

        // Signal Gantry Z-Positions
        const signalGantriesZ = [-180, -30, 160];

        // -------------------------------------------------------------
        // CAR-FOLLOWING & DETERMINISTIC TRAFFIC PHYSICS
        // -------------------------------------------------------------
        let barrierActive = false;
        let barrierLaneX = 0;
        let barrierMinZ = 0;
        let barrierMaxZ = 0;
        let barrierStopZ = 0; // Hard clamp Z for blocked lane

        if (this.scenarioId === 'tsrtcBreakdown') {
            barrierActive = true;
            barrierLaneX = 4.5;
            barrierStopZ = -18; // Cones start at z = -15, absolute hard stop before cones
            barrierMinZ = -18;
            barrierMaxZ = 24;
        } else if (this.scenarioId === 'flyoverCollision') {
            barrierActive = true;
            barrierLaneX = -4.5;
            barrierStopZ = -55; // Flares start at z = -50, absolute hard stop before flares
            barrierMinZ = -55;
            barrierMaxZ = -15;
        }

        this.vehicles.forEach(v => {
            const onFlyover = (v.useFlyover && v.z >= -132 && v.z <= 132);
            let targetSpeed = baseStep * v.cruiseSpeedMultiplier;
            let isBraking = false;

            // 0. EMERGENCY ALL-RED OPERATOR OVERRIDE (Corridor-Wide Stop)
            if (this.isEmergencyAllRed) {
                isBraking = true;
                targetSpeed = 0;
            }

            // 1. TRAFFIC SIGNAL COMPLIANCE (Surface Only)
            if (!onFlyover && !this.isEmergencyAllRed) {
                for (let i = 0; i < signalGantriesZ.length; i++) {
                    const gZ = signalGantriesZ[i];
                    const distToGantry = gZ - v.z;
                    if (distToGantry > 0 && distToGantry < 50) {
                        const sig = this.signals[i];
                        if (sig && (sig.phase === 'red' || sig.phase === 'amber')) {
                            const stopLineZ = gZ - 8;
                            const distToStop = stopLineZ - v.z;
                            if (distToStop > 0 && distToStop < 42) {
                                isBraking = true;
                                targetSpeed = Math.min(targetSpeed, baseStep * (distToStop / 28) * 0.4);
                                if (distToStop <= 2.5) {
                                    targetSpeed = 0;
                                    v.currentSpeed = 0;
                                    v.z = Math.min(v.z, stopLineZ);
                                }
                            }
                        }
                        break;
                    }
                }
            }

            // 2. INCIDENT & OBSTACLE PHYSICAL LANE LOGIC (TSRTC Breakdown & Flyover Crash)
            if (barrierActive && onFlyover) {
                const inBlockedCorridor = Math.abs(v.currentLaneX - barrierLaneX) < 2.5 || Math.abs(v.targetLaneX - barrierLaneX) < 1.0;

                if (inBlockedCorridor) {
                    const distToBarrier = barrierStopZ - v.z;
                    const openLaneX = (barrierLaneX > 0) ? -4.5 : 4.5;
                    const canMerge = (distToBarrier > 45 && !v.isQueueLocked);

                    if (canMerge && !this._isLaneOccupiedAround(openLaneX, v.z - 14, v.z + 18, v)) {
                        // Clear to merge to open lane!
                        v.targetLaneX = openLaneX;
                        v.turnSignal = (openLaneX < 0) ? 'left' : 'right';
                        targetSpeed = Math.min(targetSpeed, baseStep * 0.55);
                    } else {
                        // Cannot merge: MUST queue behind obstacle or lead vehicle!
                        v.isQueueLocked = true;
                        v.targetLaneX = barrierLaneX;
                        v.turnSignal = 'none';

                        if (distToBarrier > 0) {
                            isBraking = true;
                            targetSpeed = Math.min(targetSpeed, baseStep * Math.min(1.0, distToBarrier / 25) * 0.5);
                            if (distToBarrier <= 2.5) {
                                targetSpeed = 0;
                                v.currentSpeed = 0;
                                v.z = Math.min(v.z, barrierStopZ);
                            }
                        } else {
                            // ABSOLUTE HARD STOP CLAMP: Zero speed, strictly clamped before obstacle!
                            targetSpeed = 0;
                            v.currentSpeed = 0;
                            v.z = Math.min(v.z, barrierStopZ);
                            isBraking = true;
                        }
                    }
                } else {
                    // In the open passing lane: crawl at safe bottleneck speed
                    if (v.z >= (barrierMinZ - 20) && v.z <= (barrierMaxZ + 15)) {
                        targetSpeed = Math.min(targetSpeed, baseStep * 0.38);
                        v.targetLaneX = (barrierLaneX > 0) ? -4.5 : 4.5; // Disallow entering blocked lane!
                    }
                }
            }

            // 3. 108 EMERGENCY AMBULANCE PREEMPTION (Yield Center to Ambulance)
            if (this.scenarioId === 'ambulanceCorridor' && this.ambulance && !onFlyover) {
                const ambZ = this.ambulance.position.z;
                if (v.z > (ambZ - 10) && (v.z - ambZ) < 85 && Math.abs(v.currentLaneX) < 8.0) {
                    v.targetLaneX = (v.baseLaneX < 0) ? -13.5 : 13.5;
                    v.turnSignal = (v.baseLaneX < 0) ? 'left' : 'right';
                    targetSpeed = Math.max(targetSpeed, baseStep * 1.15);
                }
            }

            // 4. INTELLIGENT DRIVER MODEL (IDM) & GAP REGULATION
            let nearestLeadGap = 9999;
            let leadSpeed = 9999;

            for (let j = 0; j < this.vehicles.length; j++) {
                const other = this.vehicles[j];
                if (other === v) continue;
                const otherOnFlyover = (other.useFlyover && other.z >= -132 && other.z <= 132);
                if (otherOnFlyover !== onFlyover) continue; // Different road levels

                // Check if in the same lane corridor
                const lateralDistance = Math.abs(other.currentLaneX - v.currentLaneX);
                if (lateralDistance < 2.8) {
                    const gap = other.z - v.z;
                    if (gap > 0 && gap < nearestLeadGap) {
                        nearestLeadGap = gap;
                        leadSpeed = other.currentSpeed;
                    }
                }
            }

            const minSafeGap = (v.type === 'bus' ? 14.0 : 10.0);
            if (nearestLeadGap < minSafeGap * 2.5) {
                isBraking = true;
                if (nearestLeadGap <= minSafeGap) {
                    targetSpeed = 0; // HARD STOP: Guarantees zero ramming!
                    if (nearestLeadGap < (minSafeGap - 1.5)) {
                        v.currentSpeed = 0;
                    }
                } else {
                    const ratio = (nearestLeadGap - minSafeGap) / (minSafeGap * 1.5);
                    targetSpeed = Math.min(targetSpeed, Math.max(0, leadSpeed * ratio));
                }
            }

            // 5. SMOOTH ACCELERATION / DECELERATION
            const rate = (targetSpeed < v.currentSpeed) ? 0.18 : 0.06;
            v.currentSpeed += (targetSpeed - v.currentSpeed) * rate;
            if (v.currentSpeed < 0.003) v.currentSpeed = 0;

            // 6. POSITION & SEAMLESS RECYCLING
            v.z += v.currentSpeed;

            if (v.z > 410) {
                const laneVehicles = this.vehicles.filter(o => o !== v && Math.abs(o.baseLaneX - v.baseLaneX) < 1.0);
                const minZInLane = laneVehicles.reduce((min, o) => Math.min(min, o.z), -380);
                v.z = Math.min(-410, minZInLane - 35);
                v.targetLaneX = v.baseLaneX;
                v.currentLaneX = v.baseLaneX;
                v.isQueueLocked = false;
                v.turnSignal = 'none';
                v.currentSpeed = baseStep * v.cruiseSpeedMultiplier;
            }

            // 7. LATERAL LANE CHANGE & STEERING YAW ANGLE
            const lateralDelta = (v.targetLaneX - v.currentLaneX);
            if (Math.abs(lateralDelta) > 0.02) {
                v.currentLaneX += lateralDelta * 0.065;
                v.mesh.rotation.y = lateralDelta * 0.20;
            } else {
                v.currentLaneX = v.targetLaneX;
                v.mesh.rotation.y = 0;
                if (v.turnSignal !== 'none' && Math.abs(v.currentLaneX - v.targetLaneX) < 0.05) {
                    v.turnSignal = 'none';
                }
            }

            // 8. FLYOVER VERTICAL ELEVATION & REALISTIC ROAD PITCH
            let y = 0.2;
            let pitch = 0;
            if (v.useFlyover && v.z >= -130 && v.z <= 130) {
                const norm = (v.z + 130) / 260;
                y = Math.sin(norm * Math.PI) * 18 + 0.2;
                pitch = Math.cos(norm * Math.PI) * (18 * Math.PI / 260);
            }
            v.mesh.rotation.x = -pitch;
            v.mesh.position.set(v.currentLaneX, y, v.z);

            // 9. DYNAMIC BRAKE LIGHTS & TURN BLINKERS
            const isStoppedOrBraking = (v.currentSpeed < 0.06 || isBraking);
            if (v.tailLights) {
                v.tailLights.forEach(tl => {
                    tl.material.color.setHex(isStoppedOrBraking ? 0xff1111 : 0x4a0404);
                });
            }
            if (v.leftBlinker && v.rightBlinker) {
                const blink = (Math.sin(time * 12) > 0);
                v.leftBlinker.material.color.setHex((v.turnSignal === 'left' && blink) ? 0xf59e0b : 0x1e1202);
                v.rightBlinker.material.color.setHex((v.turnSignal === 'right' && blink) ? 0xf59e0b : 0x1e1202);
            }
        });

        // -------------------------------------------------------------
        // EMERGENCY 108 AMBULANCE UNIT (With Strobe & Chase Camera)
        // -------------------------------------------------------------
        if (this.ambulance) {
            this.ambulance.position.z += 2.4;
            if (this.ambulance.position.z > 410) this.ambulance.position.z = -410;

            const strobe = Math.sin(time * 16) > 0;
            this.ambulance.children.forEach(c => {
                if (c.isPointLight) {
                    c.intensity = (c.color.r > 0.5 ? (strobe ? 8 : 0.6) : (strobe ? 0.6 : 8));
                }
            });

            if (this.cameraMode === 'ambulance') {
                const targetZ = this.ambulance.position.z - 38;
                const targetY = this.ambulance.position.y + 15;
                this.camera.position.set(0, targetY, targetZ);
                this.controls.target.set(0, this.ambulance.position.y + 2, this.ambulance.position.z + 24);
                this.controls.update();
            }
        }

        // -------------------------------------------------------------
        // MONSOON WEATHER PARTICLES
        // -------------------------------------------------------------
        if (this.rainSystem && this.rainSystem.material.opacity > 0) {
            const positions = this.rainSystem.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 4.8;
                if (positions[i] < 0) positions[i] = 200;
            }
            this.rainSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Orbit continuous rotation
        if (this.autoRotate && this.cameraMode !== 'ambulance' && !this.isTweeningCam && !this.tourActive) {
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = 0.8;
        } else {
            this.controls.autoRotate = false;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

window.NexraFlow3D = NexraFlow3D;
