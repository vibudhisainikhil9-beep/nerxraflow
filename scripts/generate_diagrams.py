import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('assets/diagrams', exist_ok=True)

# 1. System Architecture Flowchart
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
fig.patch.set_facecolor('#060b16')
ax.set_facecolor('#060b16')

# Define blocks
boxes = [
    {"title": "1. Field Sensing & Edge IoT", "sub": "• Radar Speed Traps\n• ANPR Cameras\n• TSRTC GPS Beacons", "x": 0.05, "y": 0.35, "w": 0.18, "h": 0.45, "col": "#0284c7"},
    {"title": "2. NexraFlow Core", "sub": "• Kalman Filter (Q=0.08)\n• LWR PDE Shockwave\n• NeuraX RF (R²: 0.86)", "x": 0.28, "y": 0.35, "w": 0.20, "h": 0.45, "col": "#2563eb"},
    {"title": "3. ICCC Supervisory Twin", "sub": "• 2D GIS Satellite SCADA\n• 3D WebGL Digital Twin\n• NTCIP-1202 Signal Deck", "x": 0.53, "y": 0.35, "w": 0.20, "h": 0.45, "col": "#7c3aed"},
    {"title": "4. Field Actuation Loop", "sub": "• Overhead VMS Gantries\n• 108 Green Wave Corridor\n• Police 1-Click WhatsApp", "x": 0.77, "y": 0.35, "w": 0.18, "h": 0.45, "col": "#059669"}
]

for b in boxes:
    rect = patches.FancyBboxPatch((b["x"], b["y"]), b["w"], b["h"],
                                  boxstyle="round,pad=0.02,rounding_size=0.02",
                                  edgecolor=b["col"], facecolor="#0c1527", linewidth=2)
    ax.add_patch(rect)
    ax.text(b["x"] + b["w"]/2, b["y"] + b["h"] - 0.08, b["title"], color="white", weight="bold",
            fontsize=9.5, ha="center", va="center", fontfamily="sans-serif")
    ax.text(b["x"] + 0.02, b["y"] + b["h"]/2 - 0.04, b["sub"], color="#cbd5e1",
            fontsize=8.5, ha="left", va="center", fontfamily="monospace", linespacing=1.6)

# Arrows
arrow_style = dict(arrowstyle="->,head_length=0.4,head_width=0.3", color="#38bdf8", lw=2.5)
ax.annotate('', xy=(0.28, 0.57), xytext=(0.23, 0.57), arrowprops=arrow_style)
ax.annotate('', xy=(0.53, 0.57), xytext=(0.48, 0.57), arrowprops=arrow_style)
ax.annotate('', xy=(0.77, 0.57), xytext=(0.73, 0.57), arrowprops=arrow_style)

# Telemetry bus banner
bus_rect = patches.FancyBboxPatch((0.05, 0.12), 0.90, 0.14,
                                  boxstyle="round,pad=0.02,rounding_size=0.01",
                                  edgecolor="#38bdf8", facecolor="#082f49", linewidth=1.5, linestyle="--")
ax.add_patch(bus_rect)
ax.text(0.50, 0.19, "INTER-PROCESS TELEMETRY BUS (BROADCASTCHANNEL < 16ms LATENCY)",
        color="#7dd3fc", weight="bold", fontsize=9, ha="center", va="center", fontfamily="monospace")

ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
plt.tight_layout()
plt.savefig('assets/diagrams/architecture_flowchart.png', facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()

# 2. Human-in-the-Loop Sequence Flowchart
fig2, ax2 = plt.subplots(figsize=(10, 5), dpi=300)
fig2.patch.set_facecolor('#060b16')
ax2.set_facecolor('#060b16')

steps = [
    {"num": "STEP 1", "title": "Incident Detected", "desc": "TSRTC breakdown identified\nShockwave choke predicted", "x": 0.06, "col": "#ef4444"},
    {"num": "STEP 2", "title": "AI Route Suggestion", "desc": "3 Candidate routes computed\n-18.4 min delay reduction", "x": 0.29, "col": "#f59e0b"},
    {"num": "STEP 3", "title": "Operator Authorization", "desc": "Human selects feasible route\nDigital authorization seal applied", "x": 0.52, "col": "#3b82f6"},
    {"num": "STEP 4", "title": "Field Dispatch", "desc": "VMS Gantry broadcast\n1-Click WhatsApp to Traffic ACP", "x": 0.75, "col": "#10b981"}
]

for s in steps:
    rect = patches.FancyBboxPatch((s["x"], 0.28), 0.19, 0.50,
                                  boxstyle="round,pad=0.02,rounding_size=0.02",
                                  edgecolor=s["col"], facecolor="#0c1527", linewidth=2)
    ax2.add_patch(rect)
    ax2.text(s["x"] + 0.095, 0.70, s["num"], color=s["col"], weight="bold",
             fontsize=9, ha="center", va="center", fontfamily="monospace")
    ax2.text(s["x"] + 0.095, 0.58, s["title"], color="white", weight="bold",
             fontsize=9.5, ha="center", va="center", fontfamily="sans-serif")
    ax2.text(s["x"] + 0.015, 0.42, s["desc"], color="#94a3b8",
             fontsize=8, ha="left", va="center", fontfamily="sans-serif", linespacing=1.5)

# Connectors
for i in range(3):
    start_x = steps[i]["x"] + 0.19
    end_x = steps[i+1]["x"]
    ax2.annotate('', xy=(end_x, 0.53), xytext=(start_x, 0.53),
                 arrowprops=dict(arrowstyle="->,head_length=0.4,head_width=0.3", color="#cbd5e1", lw=2))

ax2.text(0.5, 0.12, "GOVERNMENT SCADA COMPLIANCE: AI PROPOSES → HUMAN DECIDES → POLICE ENFORCE",
         color="#facc15", weight="bold", fontsize=9.5, ha="center", va="center", fontfamily="sans-serif")

ax2.set_xlim(0, 1)
ax2.set_ylim(0, 1)
ax2.axis('off')
plt.tight_layout()
plt.savefig('assets/diagrams/police_workflow_flowchart.png', facecolor=fig2.get_facecolor(), edgecolor='none')
plt.close()

print("Flowcharts generated successfully.")
