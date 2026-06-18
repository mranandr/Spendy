from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import ai, auth, brokers, finance, groww, health, zerodha


def create_app() -> FastAPI:
    app = FastAPI(
        title="ExpenseIQ API",
        description="FastAPI backend — broker proxies, AI orchestrator, encrypted token vault",
        version="2.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api = FastAPI()
    api.include_router(health.router)
    api.include_router(auth.router)
    api.include_router(finance.router)
    api.include_router(zerodha.router)
    api.include_router(groww.router)
    api.include_router(ai.router)
    api.include_router(brokers.router)

    app.mount("/api", api)

    @app.get("/")
    def root():
        return {"service": "ExpenseIQ API", "docs": "/docs", "health": "/api/health"}

    return app


app = create_app()
