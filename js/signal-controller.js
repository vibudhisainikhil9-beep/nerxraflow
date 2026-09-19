/**
 * NEXRAFLOW AI - NTCIP-1202 Dynamic Signal Controller & Lane Preemption Engine
 * Manages 3-lens traffic light head, phase transitions, Webster +25s flush, and upstream metering.
 */

class SignalController {
    constructor() {
        this.nominalCycle = 90; // Standard 90s cycle
        this.baseGreen = 45;    // Standard 45s arterial green
        this.baseAmber = 5;     // Standard 5s amber
        this.baseRed = 40;      // Standard 40s cross-street green / arterial red

        // Dynamic State
        this.isPreempted = false;
        this.extensionSeconds = 25; // Webster +25s Flush
        this.activeGreen = this.baseGreen;
        this.activeAmber = this.baseAmber;
        this.activeRed = this.baseRed;

        this.currentPhase = 'GREEN'; // 'GREEN' | 'AMBER' | 'RED'
        this.phaseSecondsRemaining = this.baseGreen;
        this.elapsedCycleSeconds = 0;
        this.meteringHoldActive = false;
        this.isManualOverride = false;

        this.listeners = [];
        this._startClock();
    }

    _startClock() {
        setInterval(() => {
            this._tick();
        }, 1000);
    }

    _tick() {
        if (this.isManualOverride) {
            // In manual override, hold current phase indefinitely unless user switches it
            this._notify();
            return;
        }

        this.phaseSecondsRemaining--;
        this.elapsedCycleSeconds = (this.elapsedCycleSeconds + 1) % this.getTotalCycle();

        if (this.phaseSecondsRemaining <= 0) {
            this._advancePhase();
        }

        this._notify();
    }

    _advancePhase() {
        if (this.currentPhase === 'GREEN') {
            this.currentPhase = 'AMBER';
            this.phaseSecondsRemaining = this.activeAmber;
        } else if (this.currentPhase === 'AMBER') {
            this.currentPhase = 'RED';
            // If upstream ramp metering is active, add +15s hold
            const redHold = this.meteringHoldActive ? (this.activeRed + 15) : this.activeRed;
            this.phaseSecondsRemaining = redHold;
        } else {
            this.currentPhase = 'GREEN';
            this.phaseSecondsRemaining = this.activeGreen;
        }
    }

    getTotalCycle() {
        return this.activeGreen + this.activeAmber + this.activeRed + (this.meteringHoldActive ? 15 : 0);
    }

    /**
     * Operator Manual Phase Override (NTCIP-1202 Level 4 Supervisory Control)
     */
    forcePhase(phase) {
        const p = (phase || 'GREEN').toUpperCase();
        this.isManualOverride = true;
        this.currentPhase = p;
        this.phaseSecondsRemaining = 99; // Continuous hold indicator

        if (window.tacticalAudio) {
            if (p === 'RED') window.tacticalAudio.playAlertChime();
            else if (p === 'GREEN') window.tacticalAudio.playPreemptionChime();
            else window.tacticalAudio.playClick();
        }

        this._notify();
    }

    /**
     * Set Dynamic Green Split Duration (15s to 90s)
     */
    setGreenSplit(greenSec) {
        const g = Math.max(15, Math.min(90, parseInt(greenSec) || 45));
        this.baseGreen = g;
        this.activeGreen = g;
        this.activeRed = Math.max(15, this.nominalCycle - this.activeGreen - this.activeAmber);
        if (this.currentPhase === 'GREEN' && !this.isManualOverride) {
            this.phaseSecondsRemaining = Math.min(this.phaseSecondsRemaining, this.activeGreen);
        }
        this._notify();
    }

    /**
     * Trigger Webster +25s Signal Preemption Flush
     */
    forcePreemption(extension = 25) {
        this.isPreempted = true;
        this.isManualOverride = false;
        this.extensionSeconds = extension;
        this.activeGreen = this.baseGreen + extension; // 70s
        this.activeRed = Math.max(15, this.nominalCycle - this.activeGreen - this.activeAmber); // 15s
        this.meteringHoldActive = true;

        // If currently in RED or AMBER, force immediate snap to GREEN flush
        if (this.currentPhase !== 'GREEN') {
            this.currentPhase = 'GREEN';
            this.phaseSecondsRemaining = this.activeGreen;
        } else {
            // Extend existing green
            this.phaseSecondsRemaining += extension;
        }

        if (window.tacticalAudio) {
            window.tacticalAudio.playPreemptionChime();
        }

        this._notify();
    }

    /**
     * Reset to standard 90s balanced cycle (Release Manual Override)
     */
    resetNominal() {
        this.isManualOverride = false;
        this.isPreempted = false;
        this.extensionSeconds = 0;
        this.activeGreen = this.baseGreen; // 45s
        this.activeAmber = this.baseAmber; // 5s
        this.activeRed = this.baseRed;     // 40s
        this.meteringHoldActive = false;
        if (this.currentPhase === 'GREEN') {
            this.phaseSecondsRemaining = this.activeGreen;
        } else if (this.currentPhase === 'RED') {
            this.phaseSecondsRemaining = this.activeRed;
        } else {
            this.phaseSecondsRemaining = this.activeAmber;
        }

        if (window.tacticalAudio) {
            window.tacticalAudio.playUiChime(640, 0.08);
        }

        this._notify();
    }

    subscribe(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
            callback(this.getState());
        }
    }

    _notify() {
        const state = this.getState();
        this.listeners.forEach(fn => fn(state));

        if (window.telemetryBus) {
            window.telemetryBus.publish({
                type: 'signal_update',
                signalState: state
            });
        }
    }

    getState() {
        return {
            phase: this.currentPhase,
            secondsRemaining: this.phaseSecondsRemaining,
            isPreempted: this.isPreempted,
            isManualOverride: this.isManualOverride,
            extensionSeconds: this.extensionSeconds,
            activeGreen: this.activeGreen,
            activeAmber: this.activeAmber,
            activeRed: this.activeRed,
            nominalGreen: this.baseGreen,
            nominalRed: this.baseRed,
            meteringHoldActive: this.meteringHoldActive,
            standardSplitText: '45s / 45s (50% : 50%)',
            preemptedSplitText: `${this.activeGreen}s / ${this.activeRed + this.activeAmber}s (${Math.round((this.activeGreen / this.getTotalCycle()) * 100)}% : ${Math.round(((this.activeRed + this.activeAmber) / this.getTotalCycle()) * 100)}%)`,
            purgeRatePCU: this.isPreempted ? 2980 : 1800
        };
    }
}

window.signalController = new SignalController();
