import os

class Config:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./grainshield.db")
    PROJECT_NAME: str = "GrainShield AI Backend"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: list = ["*"]
    
    # Simulation Configs
    SIMULATION_INTERVAL_SEC: float = 2.0
    NUM_SENSORS: int = 12

settings = Config()
