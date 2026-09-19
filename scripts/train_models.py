"""
NEXRAFLOW AI - NeuraX Smart Cities & Infrastructure Defect Model Training
Trained on:
1. NeuraX Smart Cities Dataset v2 (NEURAX_SMART_CITIES_TRAINING_V2.zip)
2. Road Infrastructure Surface Defect Dataset (train.zip)
"""

import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import zipfile
import json
import time
import io
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from PIL import Image

NEURAX_ZIP = 'C:/Users/Sahithi/Downloads/NEURAX_SMART_CITIES_TRAINING_V2.zip'
VISION_ZIP  = 'C:/Users/Sahithi/Downloads/train.zip'
OUTPUT_DIR  = 'data'
ASSETS_DIR  = 'assets/defect_samples'

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

print("=" * 70)
print("🚀 STARTING NEXRAFLOW AI NEURAX & COMPUTER VISION TRAINING PIPELINE")
print("=" * 70)

# ==============================================================================
# 1. NEURAX SMART CITIES TRAFFIC INTELLIGENCE MODEL
# ==============================================================================
print("\n[PHASE 1] Loading NeuraX Smart Cities Dataset v2...")

with zipfile.ZipFile(NEURAX_ZIP, 'r') as z:
    # 1. Load Road Network
    with z.open('network.csv') as f:
        network_df = pd.read_csv(f)
    print(f"  ✓ Road Network loaded: {len(network_df)} segments")

    # 2. Load Signal Plans
    with z.open('signal_plans.csv') as f:
        signals_df = pd.read_csv(f)
    print(f"  ✓ Signal Plans loaded: {len(signals_df)} signal nodes")

    # 3. Load Nodes
    with z.open('nodes.csv') as f:
        nodes_df = pd.read_csv(f)
    print(f"  ✓ Nodes loaded: {len(nodes_df)} intersection coordinates")

    # 4. Load Incidents
    with z.open('incidents_train.csv') as f:
        incidents_df = pd.read_csv(f)
    print(f"  ✓ Training Incidents loaded: {len(incidents_df)} historical incidents")

    # 5. Load Stratified Sample of Traffic Observations
    print("  ⏳ Reading traffic observation records (streaming 200,000 rows)...")
    with z.open('traffic_train.csv') as f:
        traffic_df = pd.read_csv(f, nrows=200000)
    print(f"  ✓ Traffic Observations loaded: {len(traffic_df):,} rows")

# Feature Engineering
print("\n[PHASE 2] Feature Engineering & Network Topology Fusion...")
traffic_df['timestamp'] = pd.to_datetime(traffic_df['timestamp'])
traffic_df['hour'] = traffic_df['timestamp'].dt.hour
traffic_df['day_of_week'] = traffic_df['timestamp'].dt.dayofweek
traffic_df['is_peak'] = traffic_df['hour'].isin([8, 9, 10, 17, 18, 19, 20]).astype(int)

# Merge Network Specs
merged = traffic_df.merge(
    network_df[['segment_id', 'lanes', 'free_flow_speed_kmh', 'capacity_vph', 'length_km', 'importance', 'peak_capacity_factor']],
    on='segment_id',
    how='left'
)

# Merge Incidents
incident_segments = set(incidents_df['segment_id'].unique())
merged['incident_active'] = merged['segment_id'].isin(incident_segments).astype(int)
merged['incident_severity'] = merged['incident_active'] * 1
merged['lanes_blocked'] = merged['incident_active'] * 1

features = [
    'lanes', 'free_flow_speed_kmh', 'capacity_vph', 'length_km', 
    'importance', 'hour', 'is_peak', 'incident_active', 'incident_severity', 'lanes_blocked'
]
targets = ['speed_kmh', 'flow_vph', 'occupancy_pct', 'delay_min', 'queue_length_veh', 'congestion_index']

# Drop NaN values if any
merged = merged.dropna(subset=features + targets)

X = merged[features].values
y = merged[targets].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)
print(f"  ✓ Training sample size: {len(X_train):,}, Validation sample size: {len(X_test):,}")

print("\n[PHASE 3] Training NeuraX Multi-Output Gradient Regressor...")
t0 = time.time()
rf_model = RandomForestRegressor(
    n_estimators=45,
    max_depth=14,
    min_samples_leaf=4,
    n_jobs=-1,
    random_state=42
)
rf_model.fit(X_train, y_train)
train_time = time.time() - t0
print(f"  ✓ Model trained in {train_time:.2f} seconds")

# Evaluation
y_pred = rf_model.predict(X_test)
metrics = {}
for i, target in enumerate(targets):
    r2 = r2_score(y_test[:, i], y_pred[:, i])
    mae = mean_absolute_error(y_test[:, i], y_pred[:, i])
    rmse = np.sqrt(mean_squared_error(y_test[:, i], y_pred[:, i]))
    metrics[target] = {'r2': round(float(r2), 4), 'mae': round(float(mae), 4), 'rmse': round(float(rmse), 4)}
    print(f"  - {target.upper()}: R² = {r2:.4f} | MAE = {mae:.4f} | RMSE = {rmse:.4f}")

# Extract Feature Importances
importances = dict(zip(features, [round(float(v), 4) for v in rf_model.feature_importances_]))
print(f"  ✓ Top Feature Importances: {sorted(importances.items(), key=lambda x: x[1], reverse=True)[:5]}")

# Precompute segment-level profiles for ultra-fast browser inference
segment_profiles = {}
for _, row in network_df.head(50).iterrows():
    seg_id = row['segment_id']
    base_feat = [
        row['lanes'], row['free_flow_speed_kmh'], row['capacity_vph'],
        row['length_km'], row['importance'], 18, 1, 0, 0, 0
    ]
    inc_feat = [
        row['lanes'], row['free_flow_speed_kmh'], row['capacity_vph'],
        row['length_km'], row['importance'], 18, 1, 1, 2, 1
    ]
    pred_nominal = rf_model.predict([base_feat])[0]
    pred_incident = rf_model.predict([inc_feat])[0]
    segment_profiles[seg_id] = {
        'segment_id': seg_id,
        'road_class': row.get('road_class', 'primary'),
        'lanes': int(row['lanes']),
        'capacity_vph': int(row['capacity_vph']),
        'free_flow_speed_kmh': float(row['free_flow_speed_kmh']),
        'length_km': float(row['length_km']),
        'importance': float(row['importance']),
        'nominal': {
            'speed_kmh': round(float(pred_nominal[0]), 1),
            'flow_vph': int(pred_nominal[1]),
            'occupancy_pct': round(float(pred_nominal[2]), 1),
            'delay_min': round(float(pred_nominal[3]), 2),
            'queue_veh': int(pred_nominal[4]),
            'congestion_index': round(float(pred_nominal[5]), 3)
        },
        'incident': {
            'speed_kmh': round(float(pred_incident[0]), 1),
            'flow_vph': int(pred_incident[1]),
            'occupancy_pct': round(float(pred_incident[2]), 1),
            'delay_min': round(float(pred_incident[3]), 2),
            'queue_veh': int(pred_incident[4]),
            'congestion_index': round(float(pred_incident[5]), 3)
        }
    }

neurax_model_export = {
    'model_name': 'NeuraX-TrafficFlow-v2.0',
    'trained_at': datetime.now().isoformat(),
    'dataset_version': 'NeuraX Smart Cities Training Dataset v2',
    'total_training_observations': len(traffic_df),
    'evaluated_observations': len(X_test),
    'features': features,
    'targets': targets,
    'metrics': metrics,
    'feature_importances': importances,
    'segment_profiles': segment_profiles,
    'corridor_weights': {
        'nominal_speed_kmh': round(float(np.mean(y[:, 0])), 1),
        'nominal_flow_vph': int(np.mean(y[:, 1])),
        'nominal_occupancy_pct': round(float(np.mean(y[:, 2])), 1),
        'nominal_queue_veh': int(np.mean(y[:, 4])),
        'nominal_congestion_index': round(float(np.mean(y[:, 5])), 3)
    }
}

with open(os.path.join(OUTPUT_DIR, 'neurax_traffic_model.json'), 'w') as f:
    json.dump(neurax_model_export, f, indent=2)
print("  ✓ Saved NeuraX Traffic Intelligence model to data/neurax_traffic_model.json")


# ==============================================================================
# 2. COMPUTER VISION ROAD DAMAGE & INFRASTRUCTURE DEFECT CLASSIFIER
# ==============================================================================
print("\n[PHASE 4] Loading Road Surface Defect Dataset (train.zip)...")

class RoadDefectCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(RoadDefectCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 32x32

            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 16x16

            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2), # 8x8
        )
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(64 * 8 * 8, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = x.view(x.size(0), -1)
        x = self.classifier(x)
        return x

categories = ['crack', 'hole', 'normal', 'rust', 'scratch']
cat_to_idx = {c: i for i, c in enumerate(categories)}

print("  ⏳ Extracting balanced image training subset (300 per category)...")
image_data = []
sample_extracted = {c: [] for c in categories}

with zipfile.ZipFile(VISION_ZIP, 'r') as z:
    all_files = z.namelist()
    for cat in categories:
        cat_files = [f for f in all_files if f.startswith(f'train/{cat}/') and f.endswith(('.png', '.jpg'))]
        # Pick 200 for training
        selected = cat_files[:200]
        for fpath in selected:
            try:
                img_bytes = z.read(fpath)
                img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
                img_resized = img.resize((64, 64))
                arr = np.array(img_resized, dtype=np.float32) / 255.0
                arr = np.transpose(arr, (2, 0, 1)) # C, H, W
                image_data.append((arr, cat_to_idx[cat]))
            except Exception:
                continue

        # Save 1 sample image per category for frontend demonstration
        if len(cat_files) > 0:
            sample_img_bytes = z.read(cat_files[0])
            with open(os.path.join(ASSETS_DIR, f'{cat}_sample.png'), 'wb') as sf:
                sf.write(sample_img_bytes)
            sample_extracted[cat] = f'assets/defect_samples/{cat}_sample.png'

print(f"  ✓ Processed {len(image_data)} road infrastructure training images across 5 classes")

# PyTorch Training Loop
print("\n[PHASE 5] Training PyTorch Road Defect Vision Model...")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"  ✓ Training Device: {device}")

model = RoadDefectCNN(num_classes=5).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.002)

X_imgs = np.array([item[0] for item in image_data])
y_labels = np.array([item[1] for item in image_data])

X_train_img, X_val_img, y_train_lbl, y_val_lbl = train_test_split(X_imgs, y_labels, test_size=0.2, random_state=42)

train_tensor_x = torch.tensor(X_train_img, dtype=torch.float32)
train_tensor_y = torch.tensor(y_train_lbl, dtype=torch.long)
val_tensor_x   = torch.tensor(X_val_img, dtype=torch.float32)
val_tensor_y   = torch.tensor(y_val_lbl, dtype=torch.long)

train_dataset = torch.utils.data.TensorDataset(train_tensor_x, train_tensor_y)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

model.train()
epochs = 8
for epoch in range(epochs):
    running_loss = 0.0
    for inputs, labels in train_loader:
        inputs, labels = inputs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * inputs.size(0)
    epoch_loss = running_loss / len(train_dataset)

# Validation Accuracy
model.eval()
with torch.no_grad():
    val_outputs = model(val_tensor_x.to(device))
    _, preds = torch.max(val_outputs, 1)
    val_acc = (preds == val_tensor_y.to(device)).sum().item() / len(val_tensor_y)

print(f"  ✓ Vision Model trained ({epochs} epochs) - Final Validation Accuracy: {val_acc * 100:.2f}%")

vision_model_export = {
    'model_name': 'NeuraX-RoadDefect-CNN-v1',
    'trained_at': datetime.now().isoformat(),
    'categories': categories,
    'accuracy': round(float(val_acc), 4),
    'num_training_images': len(image_data),
    'defect_severities': {
        'hole': {'severity': 'CRITICAL', 'urgency': 'Immediate 24h Pothole Patch', 'color': '#ef4444', 'irc_code': 'IRC:82-2015 Clause 4.3'},
        'crack': {'severity': 'HIGH', 'urgency': 'Resurfacing Required (3 Days)', 'color': '#f97316', 'irc_code': 'IRC:SP:84-2019'},
        'scratch': {'severity': 'MODERATE', 'urgency': 'Surface Milling Scheduled', 'color': '#eab308', 'irc_code': 'IRC:110-2018'},
        'rust': {'severity': 'HIGH', 'urgency': 'Flyover Rail Anti-Corrosion Treatment', 'color': '#f43f5e', 'irc_code': 'IRC:24-2010'},
        'normal': {'severity': 'NOMINAL', 'urgency': 'Optimal Highway Quality', 'color': '#10b981', 'irc_code': 'Satisfactory Serviceability'}
    },
    'sample_images': sample_extracted
}

with open(os.path.join(OUTPUT_DIR, 'road_defect_model.json'), 'w') as f:
    json.dump(vision_model_export, f, indent=2)
print("  ✓ Saved Road Defect Vision Model to data/road_defect_model.json")

print("\n" + "=" * 70)
print("✅ ALL MODELS TRAINED & EXPORTED SUCCESSFULLY!")
print(f"  - NeuraX Traffic Intelligence Model: {os.path.join(OUTPUT_DIR, 'neurax_traffic_model.json')}")
print(f"  - Road Defect Vision Model:          {os.path.join(OUTPUT_DIR, 'road_defect_model.json')}")
print("=" * 70)
