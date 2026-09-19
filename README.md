# NEXRAFLOW AI — Autonomous Smart City Traffic & Incident Intelligence SCADA
### NeuraX 3.0 Hackathon • Domain 1: AI in Smart Cities
**Geographic Focus:** Hyderabad High-Density Arterial Corridor (Cyber Towers ➔ Mindspace ➔ Bio-Diversity ➔ Inorbit Mall ➔ Gachibowli)

---

## 🚀 Quick Launch (Localhost)

Both web applications are 100% self-contained, requiring zero installation, zero build steps, and zero npm packages.

### Method 1: Local HTTP Server (Recommended)
In this directory, start any static web server:
```bash
python -m http.server 8080
```
Then open:
- **Main SCADA Command Cockpit (App 1):** [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Autonomous IoT Telemetry Generator (App 2):** [http://localhost:8080/simulator.html](http://localhost:8080/simulator.html)

### Method 2: Direct File Open
You can also directly double-click `index.html` and `simulator.html` in any browser!

---

## ⚡ Dual-App Architecture (2-Second Real-Time Pub-Sub Sync)

```
┌──────────────────────────────────────────────┐          2-Second Heartbeat          ┌──────────────────────────────────────────────┐
│   APP 2: IoT Edge Simulator (simulator.html) │ ───────────────────────────────────> │  APP 1: Master SCADA Cockpit (index.html)    │
│  • 100% Hands-Free Autonomous Telemetry      │      BroadcastChannel API +          │  • Interactive Road-Snapped GIS Digital Twin │
│  • 14 Roadside IoT Sensors (ANPR, Radar)     │      LocalStorage Storage Sync       │  • LWR Shockwave Calculus (-11.4 km/h)       │
│  • IRC:106 Vehicle Stream Synthesis          │                                      │  • NTCIP-1202 Signal Preemption (+25s Flush) │
│  • Real-Time JSON Transmission Monitor       │                                      │  • 1-Click Cyberabad ACP WhatsApp Dispatch   │
└──────────────────────────────────────────────┘                                      └──────────────────────────────────────────────┘
```

1. **Zero-Configuration Bus (`js/telemetry-bus.js`)**:
   Uses the HTML5 `BroadcastChannel` API with `localStorage` event sync. Both browser windows communicate instantly across tabs/windows without any backend or WebSocket server.
2. **Autonomous Fail-Safe**:
   If App 2 is not open, App 1 automatically runs its internal 2-second telemetry clock, displaying `[AUTONOMOUS INTERNAL CLOCK (2s)]`. When App 2 is launched, it seamlessly shifts to `[● IOT SIMULATOR: 2.0s LIVE SYNC]`.

---

## 🧠 Scientific & Mathematical Core

1. **IRC:106 PCU Standardization:**
   Converts mixed Indian traffic into Passenger Car Units per hour:
   - Two-Wheelers: $0.5$
   - Auto-Rickshaws: $1.2$
   - Passenger Cars: $1.0$
   - Heavy TSRTC Buses: $3.0$
   - Computes Volume-to-Capacity ratio ($V/C$) and Level of Service ($LOS\ A$ to $F$).

2. **Lighthill-Whitham-Richards (LWR) Kinematic Shockwave Calculus:**
   $$w = \frac{q_B - q_A}{k_B - k_A}$$
   Predicts backward-propagating wave velocity ($-11.4\text{ km/h}$) and exact spillback arrival countdown to upstream junctions ($1.8\text{ km}$ to Cyber Towers in $9.4\text{ mins}$).

3. **Webster's Minimum Delay Signal Preemption ("Signal Flush"):**
   $$\Delta g = \frac{Q_{\text{accumulated}}}{s \cdot N_{\text{open\_lanes}}}$$
   Dynamically extends arterial green time by $+25\text{s}$ (from $45\text{s}$ to $70\text{s}$) to purge bottleneck queues at $2,980\text{ PCU/h}$.

4. **1D Recursive Kalman Denoising Filter:**
   Absorbs up to $30\%$ roadside sensor packet dropouts and weather radar jitter, preventing false incident alarms.

---

## 🌟 Hackathon Demo Highlights (Judges Presentation)

1. **One-Click Auto-Pilot Tour:**
   Click `[ ▶️ Run Auto-Pilot Tour ]` in the header. An interactive HUD banner slides down and autonomously guides the judges through all 6 capabilities with automated camera fly-to, incident injection, shockwave computation, signal preemption, bypass illumination, and police dispatch.
2. **Realistic 3-Lens Traffic Light Head:**
   Animated NTCIP-1202 controller with physical visors, pulsing LED glow, dynamic phase split comparison bar, and manual override (`[ ⚡ Force +25s Flush ]`).
3. **Tactical Bypass Generator:**
   Illuminates a neon cyan bypass route via Durgam Cheruvu Cable Bridge ➔ Road No. 36 Jubilee Hills, saving $18.4\text{ mins/car}$.
4. **1-Click WhatsApp Police Dispatch:**
   Formulates an encrypted telemetry payload with GPS tags, severity, and crane requisition directly to Cyberabad Traffic Police ACP.
5. **IRC:SP:41 CAD Infrastructure Planner:**
   Micro-simulation comparing existing at-grade geometry with proposed elevated U-turns showing a $-78\%$ queue drop and $2.31$-year Capex payback.
