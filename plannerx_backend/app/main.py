from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.companies import router as companies_router
from app.api.routes.users import router as users_router

app = FastAPI(title="PlannerX API", version="0.1.0")

# (optional but recommended for frontend dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# IMPORTANT: auth_router already has prefix="/auth"
app.include_router(auth_router)

# These should NOT be prefixed twice either (only if their router has no prefix)
app.include_router(companies_router)
app.include_router(users_router)