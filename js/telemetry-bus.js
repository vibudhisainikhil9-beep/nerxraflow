/**
 * NEXRAFLOW AI - Real-Time Inter-App Telemetry Bus
 * Implements zero-config Pub-Sub using BroadcastChannel with LocalStorage fallback.
 * Synchronizes App 2 (IoT Simulator) with App 1 (SCADA Cockpit) every 2.0 seconds.
 */

class TelemetryBus {
    constructor(channelName = 'nexraflow_telemetry_bus') {
        this.channelName = channelName;
        this.subscribers = [];
        this.lastPacket = null;
        this.lastPacketTime = 0;
        this.isConnected = false;

        // Initialize Native BroadcastChannel
        if (typeof BroadcastChannel !== 'undefined') {
            try {
                this.channel = new BroadcastChannel(this.channelName);
                this.channel.onmessage = (event) => {
                    this._handleIncoming(event.data);
                };
            } catch (e) {
                console.warn('BroadcastChannel init failed, using localStorage fallback:', e);
                this.channel = null;
            }
        }

        // Storage Event Fallback (Cross-Tab / Cross-Window Sync)
        window.addEventListener('storage', (event) => {
            if (event.key === this.channelName && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    this._handleIncoming(data);
                } catch (e) {
                    console.error('Failed to parse telemetry from storage:', e);
                }
            }
        });

        // Periodic Liveness Monitor (Checks if 2s feed is active)
        setInterval(() => {
            const now = Date.now();
            const wasConnected = this.isConnected;
            this.isConnected = (now - this.lastPacketTime) < 4500; // Active within 4.5s
            if (wasConnected !== this.isConnected) {
                this._notifyConnectionStatus(this.isConnected);
            }
        }, 1000);
    }

    publish(payload) {
        const packet = {
            ...payload,
            busTimestamp: Date.now(),
            busSequence: ((this.lastPacket && this.lastPacket.busSequence) || 0) + 1
        };

        this.lastPacket = packet;
        this.lastPacketTime = Date.now();

        // 1. Broadcast via native BroadcastChannel
        if (this.channel) {
            try {
                this.channel.postMessage(packet);
            } catch (e) {
                console.warn('Channel postMessage failed:', e);
            }
        }

        // 2. Broadcast via LocalStorage (cross-window reliable fallback)
        try {
            localStorage.setItem(this.channelName, JSON.stringify(packet));
        } catch (e) {
            // Storage quota or privacy mode
        }

        return packet;
    }

    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
            // If we already have a recent packet (<2.5s old), notify immediately
            if (this.lastPacket && (Date.now() - this.lastPacketTime) < 3000) {
                callback(this.lastPacket);
            }
        }
    }

    _handleIncoming(packet) {
        if (!packet || typeof packet !== 'object') return;
        this.lastPacket = packet;
        this.lastPacketTime = Date.now();
        this.isConnected = true;

        this.subscribers.forEach(cb => {
            try {
                cb(packet);
            } catch (err) {
                console.error('Error in telemetry subscriber callback:', err);
            }
        });
    }

    _notifyConnectionStatus(connected) {
        window.dispatchEvent(new CustomEvent('nexraflow:bus_status', {
            detail: { connected, lastPacketTime: this.lastPacketTime }
        }));
    }

    getLatestPacket() {
        if (this.lastPacket && (Date.now() - this.lastPacketTime) < 4000) {
            return this.lastPacket;
        }
        // Attempt load from localStorage
        try {
            const raw = localStorage.getItem(this.channelName);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Date.now() - parsed.busTimestamp < 4000) {
                    this.lastPacket = parsed;
                    this.lastPacketTime = parsed.busTimestamp;
                    return parsed;
                }
            }
        } catch (e) {}
        return null;
    }
}

// Global Singleton Instance
window.telemetryBus = new TelemetryBus();
