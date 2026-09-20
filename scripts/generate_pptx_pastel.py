import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Premium Pastel Color Palette
BG_COLOR = RGBColor(250, 247, 242)        # Soft Linen Cream
CARD_BG = RGBColor(255, 255, 255)         # Crisp White
CARD_BORDER = RGBColor(226, 217, 206)     # Soft Warm Taupe Border
TEXT_PRIMARY = RGBColor(45, 55, 72)       # Slate Charcoal for crisp readability
TEXT_SECONDARY = RGBColor(100, 116, 139)  # Subtle Cool Grey
HEADER_TAG_BG = RGBColor(238, 242, 255)   # Pastel Indigo Tint

# Pastel Accents
PASTEL_BLUE = RGBColor(147, 197, 253)     # Soft Powder Blue
PASTEL_GREEN = RGBColor(167, 243, 208)    # Gentle Mint
PASTEL_ROSE = RGBColor(254, 202, 202)     # Soft Coral Pink
PASTEL_AMBER = RGBColor(254, 215, 170)    # Soft Apricot
PASTEL_PURPLE = RGBColor(221, 214, 254)   # Gentle Lilac

def set_slide_background(slide):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = BG_COLOR

def add_header(slide, title_text, category_text):
    # Category tag pill
    tag_shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.45), Inches(3.2), Inches(0.35))
    tag_shape.fill.solid()
    tag_shape.fill.fore_color.rgb = RGBColor(224, 231, 255)
    tag_shape.line.color.rgb = RGBColor(199, 210, 254)
    ttf = tag_shape.text_frame
    ttf.paragraphs[0].text = category_text
    ttf.paragraphs[0].font.name = 'Inter'
    ttf.paragraphs[0].font.size = Pt(9)
    ttf.paragraphs[0].font.bold = True
    ttf.paragraphs[0].font.color.rgb = RGBColor(67, 56, 202)
    ttf.paragraphs[0].alignment = PP_ALIGN.CENTER
    
    # Title Text
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.85), Inches(11.7), Inches(0.8))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.name = 'Inter'
    p.font.size = Pt(22)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY

def add_card(slide, left, top, width, height, title, content_lines, accent_color=PASTEL_BLUE, bg_tint=CARD_BG):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_tint
    shape.line.color.rgb = accent_color
    shape.line.width = Pt(1.75)
    
    tf = shape.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.25)
    tf.margin_right = Inches(0.25)
    tf.margin_top = Inches(0.25)
    tf.margin_bottom = Inches(0.25)
    
    p = tf.paragraphs[0]
    p.text = title
    p.font.name = 'Inter'
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY
    
    for line in content_lines:
        p_sub = tf.add_paragraph()
        p_sub.text = line
        p_sub.font.name = 'Inter'
        p_sub.font.size = Pt(10.5)
        p_sub.font.color.rgb = TEXT_SECONDARY

# ================= SLIDE 1: PROBLEM & SOLUTION =================
blank_layout = prs.slide_layouts[6]
slide1 = prs.slides.add_slide(blank_layout)
set_slide_background(slide1)
add_header(slide1, "Autonomous Smart City Traffic & Incident Intelligence SCADA",
           "NEXRAFLOW ICCC // TELANGANA SMART CITIES")

add_card(slide1, Inches(0.8), Inches(1.8), Inches(3.6), Inches(3.6),
         "Arterial Saturation",
         ["• Peak Corridor Volume: >3,800 PCU/h",
          "• HiTec to Mindspace choke points",
          "• Mixed traffic: 45% 2W, 18% Auto-Rickshaw",
          "• High susceptibility to gridlock"],
         PASTEL_ROSE, RGBColor(255, 245, 245))

add_card(slide1, Inches(4.8), Inches(1.8), Inches(3.6), Inches(3.6),
         "Incident Latency Problem",
         ["• Conventional Detection: 18.4 mins lag",
          "• Manual Phone/Radio Dispatch delays",
          "• LWR Shockwave choke forms in 4.2 mins",
          "• Upstream spillback paralyzes 5 junctions"],
         PASTEL_AMBER, RGBColor(255, 251, 245))

add_card(slide1, Inches(8.8), Inches(1.8), Inches(3.7), Inches(3.6),
         "NexraFlow SCADA Solution",
         ["• Real-time Kalman-denoised LWR Kinematics",
          "• Level-4 ICCC Cockpit with 3D Spatial Twin",
          "• AI Computes 3 Diversion Bypass Routes",
          "• 1-Click WhatsApp Directive to Traffic ACP"],
         PASTEL_GREEN, RGBColor(245, 255, 250))

# Live deployment banner
banner = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.7), Inches(11.7), Inches(0.8))
banner.fill.solid()
banner.fill.fore_color.rgb = RGBColor(240, 249, 255)
banner.line.color.rgb = PASTEL_BLUE
btf = banner.text_frame
btf.paragraphs[0].text = "LIVE PRODUCTION DEPLOYMENT ACTIVE: https://nexraflow.vercel.app  (ZERO EXTERNAL PLUGINS)"
btf.paragraphs[0].font.size = Pt(11)
btf.paragraphs[0].font.bold = True
btf.paragraphs[0].font.color.rgb = RGBColor(3, 105, 161)
btf.paragraphs[0].alignment = PP_ALIGN.CENTER

# ================= SLIDE 2: ARCHITECTURE FLOWCHART =================
slide2 = prs.slides.add_slide(blank_layout)
set_slide_background(slide2)
add_header(slide2, "End-to-End SCADA Pipeline & Telemetry Data Flow",
           "SYSTEM ARCHITECTURE // TELEMETRY PIPELINE")

slide2.shapes.add_picture('assets/diagrams/architecture_flowchart_pastel.png', Inches(0.8), Inches(1.7), Inches(11.7), Inches(4.3))

footer_text = slide2.shapes.add_textbox(Inches(0.8), Inches(6.2), Inches(11.7), Inches(0.6))
ftf = footer_text.text_frame
ftf.paragraphs[0].text = "STANDARDS COMPLIANCE: Indian Road Congress (IRC:106 PCU equivalency) & NTCIP-1202 Signal Preemption Protocols"
ftf.paragraphs[0].font.size = Pt(10)
ftf.paragraphs[0].font.color.rgb = TEXT_SECONDARY

# ================= SLIDE 3: MATHEMATICAL RIGOR =================
slide3 = prs.slides.add_slide(blank_layout)
set_slide_background(slide3)
add_header(slide3, "Physics-Informed Kinematics & AI Analytical Engine",
           "MATHEMATICAL FOUNDATION // NEURAX AI CORE")

add_card(slide3, Inches(0.8), Inches(1.8), Inches(5.6), Inches(2.4),
         "1. Kalman Denoising Filter (Q=0.08, R=3.5)",
         ["• Mathematical Model: x̂_k = x̂_k⁻ + K_k(z_k - Hx̂_k⁻)",
          "• Strips sensor noise, GPS dropout & road jitter (<30% tolerance)",
          "• Delivers smooth, un-jittered speed to traffic controller"],
         PASTEL_GREEN, CARD_BG)

add_card(slide3, Inches(6.8), Inches(1.8), Inches(5.7), Inches(2.4),
         "2. LWR Shockwave Theory (w = Δq / Δk)",
         ["• Mathematical Model: w = (q_jam - q_free) / (k_jam - k_crit)",
          "• Computes backward wave propagation speed in real time",
          "• Accurately forecasts exact Choke ETA before queue spillback"],
         PASTEL_BLUE, CARD_BG)

add_card(slide3, Inches(0.8), Inches(4.5), Inches(5.6), Inches(2.4),
         "3. NeuraX Multi-Output RF Model (R²: 0.86)",
         ["• Trained on 1.88M observations across 436 road segments",
          "• Volume Flow R²: 0.8623 | Speed Velocity R²: 0.8216",
          "• Key Features: Capacity, Peak Rush Factor, Diurnal Cycle"],
         PASTEL_PURPLE, CARD_BG)

add_card(slide3, Inches(6.8), Inches(4.5), Inches(5.7), Inches(2.4),
         "4. Mendeley Discrete-Event Queuing Model",
         ["• Trained on 6,000 Rockwell Arena simulation runs (DOI: 10.17632)",
          "• Non-linear Kleinrock queuing delay: W_q = λ / (μ(μ - λ))",
          "• Models 3-stage bottleneck queue buildup across Cyberabad links"],
         PASTEL_AMBER, CARD_BG)

# ================= SLIDE 4: 3D DIGITAL TWIN =================
slide4 = prs.slides.add_slide(blank_layout)
set_slide_background(slide4)
add_header(slide4, "3D Spatial Digital Twin with True Z-Axis Depth",
           "SPATIAL RECONSTRUCTION // THREE.JS ENGINE")

add_card(slide4, Inches(0.8), Inches(1.9), Inches(3.6), Inches(4.7),
         "Deterministic Skyline & Z-Depth",
         ["• 32 deterministic skyscraper towers",
          "• Deep avenues from Z=-340 to +340",
          "• Window glow illumination rows",
          "• 1.5Hz alternating aviation beacons",
          "• 1,200 stars celestial night sphere",
          "• High-sheen reflective asphalt road"],
         PASTEL_BLUE, CARD_BG)

add_card(slide4, Inches(4.8), Inches(1.9), Inches(3.6), Inches(4.7),
         "Physical Vehicle Micro-Dynamics",
         ["• 48 vehicles obeying IDM car-following",
          "• Zero-clipping longitudinal safe gaps",
          "• Dynamic brake light illuminations",
          "• Realistic lane-change yaw angles",
          "• 4 Classes: 2W, Auto, Car, TSRTC Bus",
          "• Raycaster click-to-inspect telemetry"],
         PASTEL_GREEN, CARD_BG)

add_card(slide4, Inches(8.8), Inches(1.9), Inches(3.7), Inches(4.7),
         "Incident & Landmark Simulation",
         ["• Cyber Towers 90-unit multi-tower core",
          "• 20m elevated Mindspace Flyover Viaduct",
          "• Durgam Cheruvu Cable Bridge & Pylons",
          "• Stalled TSRTC bus with hazard smoke",
          "• Monsoon storm rain & flood puddles",
          "• 6-Stop automated cinematic tour"],
         PASTEL_PURPLE, CARD_BG)

# ================= SLIDE 5: HUMAN-IN-THE-LOOP FLOWCHART =================
slide5 = prs.slides.add_slide(blank_layout)
set_slide_background(slide5)
add_header(slide5, "Human-in-the-Loop: Operator Authorization & Police Dispatch",
           "SOVEREIGN OVERSIGHT WORKFLOW // AI PROPOSES → HUMAN DECIDES")

slide5.shapes.add_picture('assets/diagrams/police_workflow_flowchart_pastel.png', Inches(0.8), Inches(1.7), Inches(11.7), Inches(4.2))

add_card(slide5, Inches(0.8), Inches(6.05), Inches(11.7), Inches(0.9),
         "OPERATIONAL ADVANTAGE",
         ["Eliminates 15+ minutes of voice radio lag by providing ACP Cyberabad with structured, encrypted WhatsApp deployment orders."])

# ================= SLIDE 6: CIVIC & INFRASTRUCTURE ROI =================
slide6 = prs.slides.add_slide(blank_layout)
set_slide_background(slide6)
add_header(slide6, "Measurable City Impact, Scalability & Civic ROI",
           "INFRASTRUCTURE FEASIBILITY // IRC:SP:41 AUDIT REPORT")

add_card(slide6, Inches(0.8), Inches(1.9), Inches(3.6), Inches(3.5),
         "Transit Delay Reduction",
         ["• -34.2% Average Corridor Delay",
          "• ~18.4 minutes saved per commuter",
          "• Rapid bottleneck wave dissipation",
          "• Significant fuel & emission savings"],
         PASTEL_GREEN, RGBColor(245, 255, 250))

add_card(slide6, Inches(4.8), Inches(1.9), Inches(3.6), Inches(3.5),
         "108 Green Corridor Preemption",
         ["• 3.05x Faster Emergency Transit",
          "• Speed increased from 18 to 55 km/h",
          "• NTCIP-1202 Green Wave preemption",
          "• Critical life-saving window secured"],
         PASTEL_BLUE, RGBColor(240, 249, 255))

add_card(slide6, Inches(8.8), Inches(1.9), Inches(3.7), Inches(3.5),
         "Civil Capex Payback Period",
         ["• 2.31 Years Capital Payback",
          "• Proposed Capex: ₹42.5 Crores",
          "• Annual Fuel Savings: ₹18.4 Cr/yr",
          "• Grade-separated slip roads verified"],
         PASTEL_AMBER, RGBColor(255, 251, 245))

closing = slide6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(5.65), Inches(11.7), Inches(1.0))
closing.fill.solid()
closing.fill.fore_color.rgb = RGBColor(240, 253, 250)
closing.line.color.rgb = PASTEL_GREEN
ctf = closing.text_frame
ctf.paragraphs[0].text = "READY FOR MUNICIPAL DEPLOYMENT // COMPATIBLE WITH ANY SMART CAMERA, RADAR OR SCADA SENSOR VENDOR"
ctf.paragraphs[0].font.size = Pt(11)
ctf.paragraphs[0].font.bold = True
ctf.paragraphs[0].font.color.rgb = RGBColor(15, 118, 110)
ctf.paragraphs[0].alignment = PP_ALIGN.CENTER

prs.save('NexraFlow_ICCC_Pastel_Executive_Deck.pptx')
print("Pastel PowerPoint presentation generated successfully.")
