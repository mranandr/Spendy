"""Uvicorn entrypoint: uvicorn main:app --host 0.0.0.0 --port 5050 --reload"""
from app.main import app

__all__ = ["app"]
