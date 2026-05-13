from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, wardrobe, chat, profile, wear_log, pinterest

app = FastAPI(title="AI Fashion Adviser")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(wardrobe.router)
app.include_router(chat.router)
app.include_router(profile.router)
app.include_router(wear_log.router)
app.include_router(pinterest.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
