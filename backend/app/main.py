from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
import crud
import auth_endpoints
import admin_router


app = FastAPI(
    title="BlogForge API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://blog-forge-eta.vercel.app"],
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