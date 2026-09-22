from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
import app.crud as crud
import app.auth_endpoints as auth_endpoints
import app.admin_router as admin_router


app = FastAPI(
    title="BlogForge API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://blog-forge-eta.vercel.app/",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    init_db()


app.include_router(auth_endpoints.router)
app.include_router(crud.router)

# Admin routes
app.include_router(admin_router.router)