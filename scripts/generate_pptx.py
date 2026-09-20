import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Color Palette
BG_COLOR = RGBColor(6, 11, 22)
CARD_BG = RGBColor(12, 21, 39)
CARD_BORDER = RGBColor(30, 58, 138)
ACCENT_BLUE = RGBColor(56, 189, 248)
ACCENT_GREEN = RGBColor(74, 222, 128)
ACCENT_AMBER = RGBColor(251, 191, 36)
TEXT_WHITE = RGBColor(241, 245, 249)
TEXT_MUTED = RGBColor(148, 163, 184)

def set_slide_background(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_COLOR

def add_header(slide, title_text, subtitle_text):
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.5), Inches(11.7), Inches(1.2))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.name = 'Inter'
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    
    p2 = tf.add_paragraph()
    p2.text = subtitle_text
    p2.font.name = 'Inter'
    p2.font.size = Pt(12)
    p2.font.color.rgb = ACCENT_BLUE

def add_card(slide, left, top, width, height, title, content_lines, border_color=CARD_BORDER):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = CARD_BG
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1.5)
    
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.2)
    tf.margin_right = Inches(0.2)
    tf.margin_top = Inches(0.2)
    tf.margin_bottom = Inches(0.2)
    
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Inter'
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = TEXT_WHITE
    
    for line in content_lines:
        p_sub = tf.add_paragraph()
        p_sub.text = line
        p_sub.font.name = 'Inter'
        p_sub.font.size = Pt(10)
        p_sub.font.color.rgb = TEXT_MUTED

# ================= SLIDE 1 =================
blank_slide_layout = prs.slide_layouts[6]
slide1 = prs.slides.add_slide(blank_slide_layout)
set_slide_background(slide1)
add_header(slide1, "NEXRAFLOW ICCC: Smart City Traffic & Incident SCADA",
           "GOVERNMENT OF TELANGANA SMART CITIES MISSION // CYBERABAD ARTERIAL CORRIDOR")

add_card(slide1, Inches(0.8), Inches(2.0), Inches(3.6), Inches(3.4),
         "Arterial Saturation",
         ["• Corridor Capacity: >3,800 PCU/hr",
          "• Peak Link: Cyber Towers to Mindspace",
          "• High mixed composition: 45% 2W, 18% Auto",
          "• Severe bottleneck queue propagation"],
         RGBColor(239, 68, 68))

add_card(slide1, Inches(4.8), Inches(2.0), Inches(3.6), Inches(3.4),
         "Incident Latency Problem",
         ["• Conventional Detection: 18.4 mins lag",
          "• Manual Phone/Radio Dispatch delays",
          "• LWR Shockwave choke forms in 4.2 mins",
          "• Results in gridlock across 5 junctions"],
         ACCENT_AMBER)

add_card(slide1, Inches(8.8), Inches(2.0), Inches(3.7), Inches(3.4),
         "NexraFlow Solution",
         ["• Real-time Kalman-denoised LWR Kinematics",
          "• Level-4 ICCC SCADA Cockpit with 3D Twin",
          "• AI Computes 3 Diversion Bypass Routes",
          "• 1-Click WhatsApp Directive to Traffic Police"],
         ACCENT_GREEN)

# Deployment banner
banner = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.8), Inches(11.7), Inches(0.8))
banner.fill.solid()
banner.fill.fore_color.rgb = RGBColor(15, 23, 42)
banner.line.color.rgb = ACCENT_BLUE
btf = banner.text_frame
btf.paragraphs[0].text = "LIVE PRODUCTION DEPLOYMENT ACTIVE: https://nexraflow.vercel.app  |  ZERO INSTALLATION REQUIRED"
btf.paragraphs[0].font.size = Pt(11)
btf.paragraphs[0].font.bold = True
btf.paragraphs[0].font.color.rgb = TEXT_WHITE
btf.paragraphs[0].alignment = PP_ALIGN.CENTER

# ================= SLIDE 2 =================
slide2 = prs.slides.add_slide(blank_slide_layout)
set_slide_background(slide2)
add_header(slide2, "End-to-End SCADA Pipeline & Telemetry Data Flow",
           "ARCHITECTURE FLOWCHART // ZERO LATENCY BROADCASTCHANNEL PIPELINE")

slide2.shapes.add_picture('assets/diagrams/architecture_flowchart.png', Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.2))

footer_text = slide2.shapes.add_textbox(Inches(0.8), Inches(6.2), Inches(11.7), Inches(0.8))
ftf = footer_text.text_frame
ftf.paragraphs[0].text = "STANDARDS COMPLIANCE: Indian Road Congress (IRC:106 PCU equivalency) & NTCIP-1202 Signal Preemption Protocols"
ftf.paragraphs[0].font.size = Pt(10)
ftf.paragraphs[0].font.color.rgb = ACCENT_BLUE

# ================= SLIDE 3 =================
slide3 = prs.slides.add_slide(blank_slide_layout)
set_slide_background(slide3)
add_header(slide3, "Physics-Informed Kinematics & AI Analytical Engine",
           "MATHEMATICAL RIGOR // KALMAN DENOISING, LWR SHOCKWAVE & RANDOM FOREST")

add_card(slide3, Inches(0.8), Inches(1.9), Inches(5.6), Inches(2.3),
         "1. Kalman Denoising Filter (Q=0.08, R=3.5)",
         ["• Mathematical Model: x̂_k = x̂_k⁻ + K_k(z_k - Hx̂_k⁻)",
          "• Strips sensor noise, GPS dropout & road jitter (<30% tolerance)",
          "• Provides clean denoised velocity to the traffic controller"],
         RGBColor(34, 197, 94))

add_card(slide3, Inches(6.8), Inches(1.9), Inches(5.7), Inches(2.3),
         "2. LWR Shockwave Theory (w = Δq / Δk)",
         ["• Mathematical Model: w = (q_jam - q_free) / (k_jam - k_crit)",
          "• Computes backward wave propagation speed in real time",
          "• Calculates exact Choke ETA before queue spills back onto arterials"],
         RGBColor(56, 189, 248))

add_card(slide3, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.3),
         "3. NeuraX Multi-Output RF Model (R²: 0.86)",
         ["• Trained on 1.88M observations across 436 road segments",
          "• Volume Flow R²: 0.8623 | Speed Velocity R²: 0.8216",
          "• Features: Capacity, Peak Rush Factor, Diurnal Temporal Cycle"],
         RGBColor(168, 85, 247))

add_card(slide3, Inches(6.8), Inches(4.5), Inches(5.7), Inches(2.3),
         "4. Mendeley Discrete-Event Queuing Model",
         ["• Trained on 6,000 Rockwell Arena simulation runs (DOI: 10.17632)",
          "• Non-linear Kleinrock queuing delay formula: W_q = λ / (μ(μ - λ))",
          "• Predicts 3-stage bottleneck queue buildup across Cyberabad links"],
         RGBColor(245, 158, 11))

# ================= SLIDE 4 =================
slide4 = prs.slides.add_slide(blank_slide_layout)
set_slide_background(slide4)
add_header(slide4, "3D Spatial Digital Twin with True Z-Axis Depth",
           "THREE.JS WEBGL ENGINE // PROCEDURAL CYBERABAD METROPOLITAN CORRIDOR")

add_card(slide4, Inches(0.8), Inches(2.0), Inches(3.6), Inches(4.5),
         "Deterministic Skyline & Z-Depth",
         ["• 32 deterministic skyscraper towers",
          "• Deep avenues from Z=-340 to +340",
          "• Window glow illumination every 8 floors",
          "• 1.5Hz alternating aviation beacons",
          "• 1,200 stars celestial night sphere",
          "• High-sheen reflective asphalt surface"],
         RGBColor(56, 189, 248))

add_card(slide4, Inches(4.8), Inches(2.0), Inches(3.6), Inches(4.5),
         "Physical Vehicle Micro-Dynamics",
         ["• 48 vehicles obeying IDM car-following",
          "• Zero-clipping longitudinal safe gaps",
          "• Dynamic brake light illuminations",
          "• Realistic lane-change yaw angles",
          "• 4 Classes: 2W, Auto, Car, TSRTC Bus",
          "• Raycaster click-to-inspect telemetry"],
         RGBColor(74, 222, 128))

add_card(slide4, Inches(8.8), Inches(2.0), Inches(3.7), Inches(4.5),
         "Incident & Landmark Simulation",
         ["• Cyber Towers 90-unit multi-tower core",
          "• 20m elevated Mindspace Flyover Viaduct",
          "• Durgam Cheruvu Cable Bridge & Pylons",
          "• Stalled TSRTC bus with hazard smoke",
          "• Monsoon storm rain & flood puddles",
          "• 6-Stop automated cinematic jury tour"],
         RGBColor(168, 85, 247))

# ================= SLIDE 5 =================
slide5 = prs.slides.add_slide(blank_slide_layout)
set_slide_background(slide5)
add_header(slide5, "Human-in-the-Loop: Operator Authorization & Police Dispatch",
           "SOVEREIGN OVERSIGHT WORKFLOW // AI PROPOSES → HUMAN DECIDES → POLICE ENFORCE")

slide5.shapes.add_picture('assets/diagrams/police_workflow_flowchart.png', Inches(0.8), Inches(1.8), Inches(11.7), Inches(4.2))

add_card(slide5, Inches(0.8), Inches(6.1), Inches(11.7), Inches(0.9),
         "OPERATIONAL ADVANTAGE",
         ["Eliminates 15+ minutes of voice radio lag by providing ACP Cyberabad with structured, encrypted WhatsApp deployment orders."])

# ================= SLIDE 6 =================
slide6 = prs.slides.add_slide(blank_slide_layout)
set_slide_background(slide6)
add_header(slide6, "Measurable City Impact, Scalability & Civic ROI",
           "IRC:SP:41 MICRO-SIMULATION REPORT // TELANGANA SMART CITIES MISSION")

add_card(slide6, Inches(0.8), Inches(2.0), Inches(3.6), Inches(3.4),
         "Transit Delay Reduction",
         ["• -34.2% Average Corridor Delay",
          "• ~18.4 minutes saved per commuter",
          "• Rapid bottleneck dissipation",
          "• Reduced idle vehicular emissions"],
         ACCENT_GREEN)

add_card(slide6, Inches(4.8), Inches(2.0), Inches(3.6), Inches(3.4),
         "108 Green Corridor Preemption",
         ["• 3.05x Faster Emergency Transit",
          "• Speed increased from 18 to 55 km/h",
          "• NTCIP-1202 Green Wave preemption",
          "• Critical life-saving window secured"],
         ACCENT_BLUE)

add_card(slide6, Inches(8.8), Inches(2.0), Inches(3.7), Inches(3.4),
         "Civil Capex Payback Period",
         ["• 2.31 Years Capital Payback",
          "• Proposed Capex: ₹42.5 Crores",
          "• Annual Fuel Savings: ₹18.4 Cr/yr",
          "• Grade-separated slip roads verified"],
         ACCENT_AMBER)

# Final footer summary
closing = slide6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(5.7), Inches(11.7), Inches(1.0))
closing.fill.solid()
closing.fill.fore_color.rgb = RGBColor(15, 23, 42)
closing.line.color.rgb = ACCENT_GREEN
ctf = closing.text_frame
ctf.paragraphs[0].text = "READY FOR MUNICIPAL DEPLOYMENT // COMPATIBLE WITH ANY SMART CAMERA, RADAR OR SCADA SENSOR VENDOR"
ctf.paragraphs[0].font.size = Pt(11)
ctf.paragraphs[0].font.bold = True
ctf.paragraphs[0].font.color.rgb = ACCENT_GREEN
ctf.paragraphs[0].alignment = PP_ALIGN.CENTER

prs.save('NexraFlow_ICCC_Executive_Deck.pptx')
print("PowerPoint presentation generated: NexraFlow_ICCC_Executive_Deck.pptx")
