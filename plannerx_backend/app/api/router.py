from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.admin_companies import router as admin_companies_router
from app.api.routes.admin_users import router as admin_users_router
from app.api.routes.company_settings import router as company_settings_router
from app.api.routes.dimensions import router as dimensions_router 
from app.api.routes.dimensions_import import router as dimensions_import_router


api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(admin_companies_router)
api_router.include_router(admin_users_router)
api_router.include_router(company_settings_router)
api_router.include_router(dimensions_router)
api_router.include_router(dimensions_import_router)