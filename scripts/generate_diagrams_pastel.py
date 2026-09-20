import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('assets/diagrams', exist_ok=True)

# Elegant Pastel Theme Colors
BG_PASTEL = "#FAF7F2"       # Warm linen cream
BOX_BG = "#FFFFFF"          # Pure white cards
BORDER_COLOR = "#E2D9CE"    # Soft warm border
TEXT_DARK = "#2D3748"       # Deep slate for high readability
TEXT_MUTED = "#718096"      # Soft grey

# 1. Pastel Architecture Flowchart
fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
fig.patch.set_facecolor(BG_PASTEL)
ax.set_facecolor(BG_PASTEL)

boxes = [
    {"title": "1. Field Sensing & Edge IoT", "sub": "• Radar Speed Traps\n• ANPR Cameras\n• TSRTC GPS Beacons", "x": 0.05, "y": 0.35, "w": 0.18, "h": 0.45, "col": "#93C5FD", "accent": "#BFDBFE"},  # Pastel Blue
    {"title": "2. NexraFlow Core", "sub": "• Kalman Filter (Q=0.08)\n• LWR PDE Shockwave\n• NeuraX RF (R²: 0.86)", "x": 0.28, "y": 0.35, "w": 0.20, "h": 0.45, "col": "#A7F3D0", "accent": "#BBF7D0"},  # Pastel Mint
    {"title": "3. ICCC Supervisory Twin", "sub": "• 2D GIS Satellite SCADA\n• 3D WebGL Digital Twin\n• NTCIP-1202 Signal Deck", "x": 0.53, "y": 0.35, "w": 0.20, "h": 0.45, "col": "#DDD6FE", "accent": "#E9D5FF"},  # Pastel Lavender
    {"title": "4. Field Actuation Loop", "sub": "• Overhead VMS Gantries\n• 108 Green Wave Corridor\n• Police 1-Click WhatsApp", "x": 0.77, "y": 0.35, "w": 0.18, "h": 0.45, "col": "#FED7AA", "accent": "#FFEDD5"}   # Pastel Peach
]

for b in boxes:
    # Outer Card
    rect = patches.FancyBboxPatch((b["x"], b["y"]), b["w"], b["h"],
                                  boxstyle="round,pad=0.02,rounding_size=0.02",
                                  edgecolor=b["col"], facecolor=BOX_BG, linewidth=2.0)
    ax.add_patch(rect)
    
    # Title Tag Header pill
    tag = patches.FancyBboxPatch((b["x"] + 0.01, b["y"] + b["h"] - 0.10), b["w"] - 0.02, 0.08,
                                 boxstyle="round,pad=0.01,rounding_size=0.015",
                                 edgecolor="none", facecolor=b["accent"])
    ax.add_patch(tag)
    
    ax.text(b["x"] + b["w"]/2, b["y"] + b["h"] - 0.06, b["title"], color=TEXT_DARK, weight="bold",
            fontsize=8.8, ha="center", va="center", fontfamily="sans-serif")
    ax.text(b["x"] + 0.02, b["y"] + b["h"]/2 - 0.05, b["sub"], color=TEXT_MUTED,
            fontsize=8.5, ha="left", va="center", fontfamily="sans-serif", linespacing=1.6)

# Arrows in soft steel grey
arrow_style = dict(arrowstyle="->,head_length=0.4,head_width=0.3", color="#94A3B8", lw=2.2)
ax.annotate('', xy=(0.28, 0.57), xytext=(0.23, 0.57), arrowprops=arrow_style)
ax.annotate('', xy=(0.53, 0.57), xytext=(0.48, 0.57), arrowprops=arrow_style)
ax.annotate('', xy=(0.77, 0.57), xytext=(0.73, 0.57), arrowprops=arrow_style)

# Telemetry bus banner
bus_rect = patches.FancyBboxPatch((0.05, 0.12), 0.90, 0.14,
                                  boxstyle="round,pad=0.02,rounding_size=0.015",
                                  edgecolor="#93C5FD", facecolor="#EFF6FF", linewidth=1.5, linestyle="--")
ax.add_patch(bus_rect)
ax.text(0.50, 0.19, "INTER-PROCESS TELEMETRY BUS (BROADCASTCHANNEL < 16ms LATENCY)",
        color="#1E40AF", weight="bold", fontsize=9, ha="center", va="center", fontfamily="sans-serif")

ax.set_xlim(0, 1)
ax.set_ylim(0, 1)
ax.axis('off')
plt.tight_layout()
plt.savefig('assets/diagrams/architecture_flowchart_pastel.png', facecolor=fig.get_facecolor(), edgecolor='none')
plt.close()


# 2. Pastel Human-in-the-Loop Sequence Flowchart
fig2, ax2 = plt.subplots(figsize=(10, 5), dpi=300)
fig2.patch.set_facecolor(BG_PASTEL)
ax2.set_facecolor(BG_PASTEL)

steps = [
    {"num": "STEP 1", "title": "Incident Detected", "desc": "TSRTC breakdown identified\nShockwave choke predicted", "x": 0.06, "col": "#FECACA", "pill": "#FEE2E2", "text": "#991B1B"},  # Pastel Rose
    {"num": "STEP 2", "title": "AI Route Suggestion", "desc": "3 Candidate routes computed\n-18.4 min delay reduction", "x": 0.29, "col": "#FED7AA", "pill": "#FFEDD5", "text": "#9A3412"},  # Pastel Apricot
    {"num": "STEP 3", "title": "Operator Authorization", "desc": "Human selects feasible route\nDigital authorization seal applied", "x": 0.52, "col": "#BAE6FD", "pill": "#E0F2FE", "text": "#075985"},  # Pastel Sky
    {"num": "STEP 4", "title": "Field Dispatch", "desc": "VMS Gantry broadcast\n1-Click WhatsApp to Traffic ACP", "x": 0.75, "col": "#BBF7D0", "pill": "#DCFCE7", "text": "#166534"}   # Pastel Sage
]

for s in steps:
    rect = patches.FancyBboxPatch((s["x"], 0.28), 0.19, 0.50,
                                  boxstyle="round,pad=0.02,rounding_size=0.02",
                                  edgecolor=s["col"], facecolor=BOX_BG, linewidth=2.0)
    ax2.add_patch(rect)
    
    # Step pill
    tag = patches.FancyBboxPatch((s["x"] + 0.015, 0.67), 0.16, 0.08,
                                 boxstyle="round,pad=0.01,rounding_size=0.015",
                                 edgecolor="none", facecolor=s["pill"])
    ax2.add_patch(tag)
    ax2.text(s["x"] + 0.095, 0.71, s["num"], color=s["text"], weight="bold",
             fontsize=8.5, ha="center", va="center", fontfamily="sans-serif")
    
    ax2.text(s["x"] + 0.095, 0.58, s["title"], color=TEXT_DARK, weight="bold",
             fontsize=9.2, ha="center", va="center", fontfamily="sans-serif")
    ax2.text(s["x"] + 0.015, 0.42, s["desc"], color=TEXT_MUTED,
             fontsize=8.2, ha="left", va="center", fontfamily="sans-serif", linespacing=1.5)

# Connectors
for i in range(3):
    start_x = steps[i]["x"] + 0.19
    end_x = steps[i+1]["x"]
    ax2.annotate('', xy=(end_x, 0.53), xytext=(start_x, 0.53),
                 arrowprops=dict(arrowstyle="->,head_length=0.4,head_width=0.3", color="#94A3B8", lw=2))

ax2.text(0.5, 0.12, "GOVERNMENT SCADA COMPLIANCE: AI PROPOSES → HUMAN DECIDES → POLICE ENFORCE",
         color="#334155", weight="bold", fontsize=9.5, ha="center", va="center", fontfamily="sans-serif")

ax2.set_xlim(0, 1)
ax2.set_ylim(0, 1)
ax2.axis('off')
plt.tight_layout()
plt.savefig('assets/diagrams/police_workflow_flowchart_pastel.png', facecolor=fig2.get_facecolor(), edgecolor='none')
plt.close()

print("Pastel flowcharts generated successfully.")
