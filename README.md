# NEXRAFLOW AI — Autonomous Smart City Traffic & Incident Intelligence SCADA
### NeuraX 3.0 Hackathon • Domain 1: AI in Smart Cities
**Geographic Focus:** Hyderabad High-Density Arterial Corridor (Cyber Towers ➔ Mindspace ➔ Bio-Diversity ➔ Inorbit Mall ➔ Gachibowli)

---

## 🚀 Quick Launch (Localhost & Cloud)

- **Production Live URL:** [https://nexraflow.vercel.app](https://nexraflow.vercel.app)
- **3D Arterial Digital Twin:** [https://nexraflow.vercel.app/twin3d.html](https://nexraflow.vercel.app/twin3d.html)
- **NeuraX AI & Computer Vision Center:** [https://nexraflow.vercel.app/simulator.html](https://nexraflow.vercel.app/simulator.html)

### Local HTTP Server:
```bash
python -m http.server 8080
```
- **Main SCADA Command Cockpit:** [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **NeuraX AI Hub & Defect Scanner:** [http://localhost:8080/simulator.html](http://localhost:8080/simulator.html)
- **3D Arterial Digital Twin:** [http://localhost:8080/twin3d.html](http://localhost:8080/twin3d.html)

---

## 🤖 Genuine AI & Machine Learning Core (No Synthetic Fakes)

NEXRAFLOW is powered by three real machine learning models trained on proprietary smart city and academic datasets:

```
┌─────────────────────────────────────────────────────────────┐        2-Second Heartbeat       ┌─────────────────────────────────────────────────────────────┐
│  NeuraX AI Engine & Defect Center (simulator.html)          │ ──────────────────────────────> │  Master SCADA Cockpit (index.html)                          │
│  • Multi-Output Traffic Regression (R² = 0.8623)            │     BroadcastChannel API +      │  • Real-Time NeuraX Corridor Inferences                     │
│  • Trained on 200,000 observations (436 Cyberabad Segments) │     TelemetryBus Pub/Sub        │  • LWR Shockwave Calculus (-11.4 km/h)                      │
│  • PyTorch Deep CNN Road Defect Classifier (69.5% Acc)      │                                 │  • Interactive Road-Snapped GIS Digital Twin                │
│  • Mendeley DES Arena Queuing Model (R² = 0.9885)           │                                 │  • Embedded 3D Digital Twin Viewport                        │
│  • Multi-Stage Bottleneck Saturation & Spillback Prediction │                                 │  • NTCIP-1202 Signal Preemption (+25s Flush)                │
└─────────────────────────────────────────────────────────────┘                                 └─────────────────────────────────────────────────────────────┘
```

1. **NeuraX Smart Cities Traffic Multi-Output Regressor:**
   - **Training Data:** `NEURAX_SMART_CITIES_TRAINING_V2.zip` (1.88M rows, 436 road segments, sampled 200,000 for training).
   - **Performance:** Flow $R^2 = 0.8623$ (MAE: 153.7 PCU/h), Speed $R^2 = 0.8216$ (MAE: 3.27 km/h), Occupancy $R^2 = 0.8113$.
   - **Features:** Segment capacity (46.4% importance), Diurnal hour (37.1%), Peak flag (9.0%), Importance weight (6.7%).

2. **PyTorch Road Infrastructure Defect Vision CNN:**
   - **Training Data:** `train.zip` (12,000+ infrastructure images, 1,000 sampled across 5 defect classes).
   - **Performance:** **69.50% Validation Accuracy** on unseen road defect imagery.
   - **Inspection Categories:** Crack (IRC:SP:84), Hole/Pothole (IRC:82-2015), Rust (IRC:24-2010), Scratch (IRC:110-2018), Normal (Optimal Serviceability).

3. **Mendeley Discrete-Event Queuing & Bottleneck AI (Arena Simulation):**
   - **Training Data:** [Mendeley Data 10.17632/3rw227zxt7.2](https://data.mendeley.com/datasets/3rw227zxt7/2) (6,000 discrete simulation runs across Model 1 & Model 2).
   - **Performance:** Bottleneck Queue Delay $R^2 = 0.9885$ (MAE: 5.86 min), Bottleneck Utilization $R^2 = 0.9998$, Throughput Rate $R^2 = 1.0000$.
   - **Application:** Evaluates multi-stage queue buildup (Cyber Towers Inbound $U_1 \to$ Mindspace Merge $U_2 \to$ Bio-Diversity Bottleneck $U_3$) with non-linear saturation choke alarms when $U_3 \ge 98\%$.

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
