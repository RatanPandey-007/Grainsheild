from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

from app.config import settings
from app.router import router
from app.simulator import simulator

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="GrainShield AI - Operational Analytics & Spoilage Prediction Engine",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include APIs
app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "GRAINSHIELD AI CONTROL INFRASTRUCTURE",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Connection manager for WebSockets
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle dead connections silently
                pass

manager = ConnectionManager()

@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Generate and fetch current simulated telemetry
            sensor_telemetry = simulator.update_sensor_readings()
            
            # Broadcast the live system readings
            payload = {
                "system_status": "ONLINE",
                "active_sensors": len(sensor_telemetry),
                "timestamp": str(asyncio.get_event_loop().time()),
                "sensors": sensor_telemetry,
                "override_active": simulator.override_active
            }
            
            await websocket.send_text(json.dumps(payload))
            
            # Throttle broadcast interval
            await asyncio.sleep(settings.SIMULATION_INTERVAL_SEC)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)
        print(f"WS Exception: {e}")
