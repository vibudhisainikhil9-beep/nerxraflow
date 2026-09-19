/**
 * NEXRAFLOW AI - Interactive Auto-Pilot Demo Tour Coordinator
 * Provides an autonomous, narrated 6-step walkthrough for Hackathon Judges.
 * Features smooth camera pans, panel spotlight highlighting, pause/resume, and step navigation.
 */

class AutoPilotTour {
    constructor(scadaApp) {
        this.app = scadaApp;
        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.timer = null;
        this.stepStartTime = 0;
        this.remainingDuration = 0;

        this.steps = [
            {
                stepNumber: 1,
                title: 'Step 1: Arterial Digital Twin & IRC:106 Mixed Traffic Stream',
                duration: 7500,
                focusCoord: [17.4470, 78.3792],
                zoom: 14,
                highlightId: 'panel-telemetry',
                hudNarration: 'Welcome to NEXRAFLOW AI. We are scanning the Cyber Towers ➔ Mindspace ➔ Bio-Diversity corridor. Notice the IRC:106 stream breakdown: 45% two-wheelers, 18% autos, 25% cars, and 12% TSRTC buses operating at nominal equilibrium.',
                action: () => {
                    this.app.loadScenario('nominal');
                    this.app.switchTab('radar');
                    if (window.tacticalAudio) window.tacticalAudio.playRadarPing();
                }
            },
            {
                stepNumber: 2,
                title: 'Step 2: TSRTC Bus Breakdown Incident',
                duration: 8000,
                focusCoord: [17.4435, 78.3772],
                zoom: 16,
                highlightId: 'panel-map',
                hudNarration: 'INCIDENT DETECTED! A heavy TSRTC Metro Express bus breaks down on the Mindspace Flyover incline (+4.2% gradient), instantly cutting corridor capacity by 55%. Watch the corridor turn RED as bottleneck density surges.',
                action: () => {
                    this.app.loadScenario('tsrtcBreakdown');
                    if (window.tacticalAudio) window.tacticalAudio.playIncidentKlaxon();
                }
            },
            {
                stepNumber: 3,
                title: 'Step 3: Lighthill-Whitham-Richards (LWR) Shockwave Calculus',
                duration: 8000,
                focusCoord: [17.4470, 78.3792],
                zoom: 15,
                highlightId: 'panel-shockwave',
                hudNarration: 'Unlike Google Maps which is purely reactive, NEXRAFLOW computes the backward kinematic shockwave velocity: w = (qB - qA)/(kB - kA) = -11.4 km/h. It predicts catastrophic spillback freezing Cyber Towers in exactly 9.4 minutes.',
                action: () => {
                    this.app.switchTab('radar');
                    if (window.tacticalAudio) window.tacticalAudio.playRadarPing();
                }
            },
            {
                stepNumber: 4,
                title: 'Step 4: Autonomous Webster Signal Preemption (+25s Flush)',
                duration: 8000,
                focusCoord: [17.4435, 78.3772],
                zoom: 16,
                highlightId: 'panel-signal-controller',
                hudNarration: 'NEXRAFLOW executes an automated closed-loop signal flush! Applying Webster’s formula: Delta_g = Q_acc / (s * N_open), extending green by +25s (45s -> 70s) to discharge 2,980 PCU/h while holding upstream ramps.',
                action: () => {
                    window.signalController.forcePreemption(25);
                    this.app.switchTab('radar');
                    if (window.tacticalAudio) window.tacticalAudio.playPreemptionChime();
                }
            },
            {
                stepNumber: 5,
                title: 'Step 5: Tactical Neon Cyan Bypass via Durgam Cheruvu',
                duration: 8000,
                focusCoord: [17.4350, 78.3880],
                zoom: 15,
                highlightId: 'tab-bypass',
                hudNarration: 'To purge 35% of bottleneck volume, NEXRAFLOW illuminates the tactical bypass via Durgam Cheruvu Cable Bridge ➔ Road No. 36 Jubilee Hills, saving 18.4 minutes per diverted vehicle.',
                action: () => {
                    this.app.showBypassRoute(true);
                    this.app.switchTab('bypass');
                    if (window.tacticalAudio) window.tacticalAudio.playRadarPing();
                }
            },
            {
                stepNumber: 6,
                title: 'Step 6: 1-Click WhatsApp Police Dispatch & Gemini 3.6 Core',
                duration: 9000,
                focusCoord: [17.4410, 78.3760],
                zoom: 14,
                highlightId: 'tab-briefing',
                hudNarration: 'Closed-loop completion: Gemini 3.6 synthesizes an inter-agency situational briefing and generates an encrypted WhatsApp dispatch payload directly to Cyberabad Traffic Police ACP with GPS tags and heavy tow-crane requisition.',
                action: () => {
                    this.app.switchTab('briefing');
                    if (window.tacticalAudio) window.tacticalAudio.playPreemptionChime();
                }
            }
        ];
    }

    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.currentStep = 0;
        this._showHud();
        this._executeCurrentStep();
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.timer) clearTimeout(this.timer);
        this._clearHighlights();
        this._hideHud();
    }

    togglePause() {
        if (!this.isRunning) return;

        const pauseBtn = document.getElementById('btn-hud-pause');
        if (this.isPaused) {
            // Resume
            this.isPaused = false;
            if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
            this.stepStartTime = Date.now();
            this.timer = setTimeout(() => {
                this.next();
            }, this.remainingDuration);
        } else {
            // Pause
            this.isPaused = true;
            if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> <span>Resume</span>';
            clearTimeout(this.timer);
            const elapsed = Date.now() - this.stepStartTime;
            const currentStepDef = this.steps[this.currentStep];
            this.remainingDuration = Math.max(1000, (currentStepDef ? currentStepDef.duration : 6000) - elapsed);
        }
    }

    next() {
        if (this.timer) clearTimeout(this.timer);
        this._clearHighlights();
        this.currentStep++;
        if (this.currentStep < this.steps.length) {
            this._executeCurrentStep();
        } else {
            this.finish();
        }
    }

    prev() {
        if (this.timer) clearTimeout(this.timer);
        this._clearHighlights();
        this.currentStep = Math.max(0, this.currentStep - 1);
        this._executeCurrentStep();
    }

    finish() {
        this.stop();
        if (window.tacticalAudio) window.tacticalAudio.playPreemptionChime();
        alert('🎉 Auto-Pilot Tour Complete! All 6 core capabilities demonstrated successfully.');
    }

    _executeCurrentStep() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        this.stepStartTime = Date.now();
        this.remainingDuration = step.duration;

        // Smooth Map Camera Fly
        if (this.app && this.app.map && step.focusCoord) {
            this.app.map.flyTo(step.focusCoord, step.zoom, {
                animate: true,
                duration: 1.2,
                easeLinearity: 0.25
            });
        }

        // Run step action
        step.action();

        // Apply visual spotlight highlight
        this._applyHighlight(step.highlightId);

        // Update HUD display
        this._updateHud(step);

        // Schedule Next Step
        if (!this.isPaused) {
            this.timer = setTimeout(() => {
                this.next();
            }, step.duration);
        }
    }

    _applyHighlight(elementId) {
        this._clearHighlights();
        if (!elementId) return;

        const el = document.getElementById(elementId);
        if (el) {
            el.classList.add('ring-2', 'ring-cyan-400', 'shadow-cyan-500/40', 'transition-all', 'duration-300');
        }
    }

    _clearHighlights() {
        document.querySelectorAll('.ring-cyan-400').forEach(el => {
            el.classList.remove('ring-2', 'ring-cyan-400', 'shadow-cyan-500/40');
        });
    }

    _showHud() {
        const hud = document.getElementById('autopilot-hud');
        if (hud) {
            hud.classList.remove('hidden');
            hud.classList.add('flex');
        }
        const pauseBtn = document.getElementById('btn-hud-pause');
        if (pauseBtn) pauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> <span>Pause</span>';
        if (this.app && this.app.map) {
            setTimeout(() => this.app.map.invalidateSize(), 150);
        }
    }

    _hideHud() {
        const hud = document.getElementById('autopilot-hud');
        if (hud) {
            hud.classList.add('hidden');
            hud.classList.remove('flex');
        }
        if (this.app && this.app.map) {
            setTimeout(() => this.app.map.invalidateSize(), 150);
        }
    }

    _updateHud(step) {
        const titleEl = document.getElementById('hud-step-title');
        const countEl = document.getElementById('hud-step-count');
        const textEl = document.getElementById('hud-narration-text');
        const progressEl = document.getElementById('hud-progress-bar');

        if (titleEl) titleEl.textContent = step.title;
        if (countEl) countEl.textContent = `Step ${step.stepNumber} of ${this.steps.length}`;
        if (textEl) textEl.textContent = step.hudNarration;
        if (progressEl) {
            const pct = ((step.stepNumber) / this.steps.length) * 100;
            progressEl.style.width = `${pct}%`;
        }
    }
}

window.AutoPilotTour = AutoPilotTour;
