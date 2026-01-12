from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.companies import router as companies_router
from app.api.routes.users import router as users_router

app = FastAPI(title="PlannerX API", version="0.1.0")

# -------------------------
# CORS (frontend access)
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Health check
# -------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

# -------------------------
# Routers
# -------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(companies_router)
app.include_router(users_router)