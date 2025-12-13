from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from backend.api.endpoints import router
from backend.core.config import settings
from backend.core.cache import init_cache

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize cache on startup
    await init_cache()
    yield
    # Cleanup on shutdown

app = FastAPI(
    title="Grapher API",
    description="Mathematical expression evaluation and graphing API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
except RuntimeError:
    # Static files directory doesn't exist or is empty
    pass

# Include API routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/app")
async def serve_frontend():
    return FileResponse("static/index.html")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    load_dotenv()
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )