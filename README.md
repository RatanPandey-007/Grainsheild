<div align="center">

# 🌾 GrainShield AI
### Real-Time Post-Harvest Silo Analytics & Spoilage Prediction Platform

<br/>

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_+_Three.js-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![WebSockets](https://img.shields.io/badge/Telemetry-Realtime_WebSockets-00F3FF?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Three.js](https://img.shields.io/badge/3D_Twin-Three.js_Warehouse-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)

</div>

---

## 🌾 1. Operational Overview

Post-harvest grain spoilage during storage costs developing agricultural economies billions annually due to undetected moisture pockets, fungal mycotoxin outbreaks, and temperature spikes inside silos.

**GrainShield AI** is an IoT-ready digital twin and telemetry prediction platform designed for grain elevator operators and cold-storage managers. It combines:
1. **Real-time IoT Sensor Ingestion**: Multi-level temperature, relative humidity, $\text{CO}_2$ concentration, and grain moisture metrics streamed over low-latency WebSockets.
2. **3D Warehouse Digital Twin**: Interactive spatial Three.js warehouse rendering individual grain silos with color-coded risk heatmaps.
3. **Automated Spoilage Risk Engine**: Predicts remaining safe storage duration before mycotoxin thresholds trigger.

---

## 🏗️ 2. Architecture & Microservices

```mermaid
flowchart LR
    subgraph IoTStream ["IoT Telemetry Simulator (backend/app/)"]
        Sensors["Silo Sensor Nodes<br/>(Temp, RH%, CO2, Moisture)"]
        Simulator["simulator.py<br/>(Dynamic degradation models)"]
    end

    subgraph BackendEngine ["FastAPI Service (backend/)"]
        Main["FastAPI Gateway (main.py)"]
        WS["WebSocket Telemetry Server (/ws)"]
        ML["ML Risk Engine (ml_engine.py)"]
        DB["SQLite Database (database.py)"]
    end

    subgraph SpatialHUD ["3D Frontend HUD (frontend/)"]
        Twin["Three.js Warehouse Scene (WarehouseScene.jsx)"]
        HUD["Dashboard HUD & Telemetry Stream (DashboardHUD.jsx)"]
        Map["Network Node Map (NetworkMap.jsx)"]
    end

    Sensors --> Simulator
    Simulator --> WS
    WS --> ML
    ML --> DB
    WS <-->|Bidirectional Stream| SpatialHUD
```

---

## 🛠️ 3. Technology Stack

* **Backend**: Python 3.10+, FastAPI, Uvicorn, WebSockets, SQLite, Pydantic.
* **Frontend**: React 18, Vite, Three.js (@react-three/fiber), Tailwind CSS, Lucide Icons.

---

## 🚀 4. Quickstart

### 1. Backend Service
```bash
cd Grainsheild/backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
python start_backend.py
```

### 2. Frontend 3D Dashboard
```bash
cd Grainsheild/frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** to interact with the 3D grain silo digital twin.

---

## 🏷️ Repository Topics
`iot-telemetry` • `threejs` • `fastapi` • `agriculture-ai` • `digital-twin` • `websockets` • `react` • `spoilage-prediction`
