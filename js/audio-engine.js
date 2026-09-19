/**
 * NEXRAFLOW AI - Native Web Audio API Tactical Sound Synthesizer
 * Generates military SCADA acoustic feedback directly in the browser (zero audio files needed).
 */

class TacticalAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initialized = false;
    }

    _init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.initialized = true;
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * High-tech Sonar / Radar Sweep Ping
     */
    playRadarPing() {
        if (this.isMuted) return;
        this._init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    /**
     * Urgent Dual-Tone SCADA Tactical Incident Alarm Klaxon
     */
    playIncidentKlaxon() {
        if (this.isMuted) return;
        this._init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const tones = [520, 680, 520, 680];
        tones.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + idx * 0.14;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.12, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 0.12);
        });
    }

    /**
     * Webster Preemption Green Flush Engagement Cyber Chime
     */
    playPreemptionChime() {
        if (this.isMuted) return;
        this._init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const chord = [440, 554.37, 659.25, 880]; // A Major 7th
        chord.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const start = now + (i * 0.06);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.09, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(start);
            osc.stop(start + 0.5);
        });
    }

    /**
     * Tactile Mechanical Click
     */
    playClick() {
        if (this.isMuted) return;
        this._init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }
}

window.tacticalAudio = new TacticalAudioEngine();
