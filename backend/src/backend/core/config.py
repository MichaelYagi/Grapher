import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    # API Settings
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 3000
    
    # CORS Settings
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000"]
    
    # Cache Settings
    REDIS_URL: Optional[str] = None
    CACHE_TTL: int = 3600  # 1 hour default
    
    # Security Settings
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Performance Settings
    MAX_EXPRESSION_LENGTH: int = 1000
    MAX_BATCH_SIZE: int = 100
    COMPUTATION_TIMEOUT: float = 5.0  # seconds
    MAX_POINTS_PER_GRAPH: int = 10000
    
model_config = ConfigDict(env_file=".env", env_file_encoding='utf-8')

settings = Settings()