from fastapi import APIRouter

from app.api.routes.dimensions import router as dimensions_router

api_router = APIRouter()
api_router.include_router(dimensions_router)