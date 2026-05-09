# Stilux — AI Fashion Adviser

A personal, self-hosted fashion adviser that knows your wardrobe. Upload your clothes, ask what to wear for any occasion, and get outfit suggestions built exclusively from items you actually own. Optionally connect Pinterest to pull in style inspirations from your saved pins.

---

## Features

- **Multi-session chat** — Persistent conversations with the AI adviser. Start new chats and return to previous ones from the sessions panel.
- **Outfit suggestions** — The AI generates up to 5 complete outfit combinations per request, pulling only from your uploaded wardrobe items and excluding anything worn in the last 7 days.
- **Swap ideas** — Regenerate any individual outfit suggestion with a single click, excluding the items already proposed.
- **Outfit preview & wear log** — Preview a suggestion in a modal, then log it as worn. Logged outfits feed back into the recently-worn exclusion window.
- **Wardrobe management** — Upload individual items or bulk-upload a zip of photos. Each item is tagged automatically by the AI (category, colour, formality, occasions, season).
- **Pinterest inspiration** — Connect your Pinterest account via OAuth. The adviser fetches your saved pins and references your pinned aesthetic when building outfits and identifying wardrobe gaps.
- **Profile & fit preferences** — Set style preferences, fit notes, and colour comfort. Upload a body photo for outfit mockup generation.
- **Outfit mockups** — If a body photo is uploaded and a Gemini API key is configured, the app generates a visual mockup for each outfit suggestion.
- **AI fallback** — If Anthropic credits are exhausted, the app transparently falls back to DeepSeek for all chat and swap requests.
- **Single-user, access-controlled** — Authentication is via Google OAuth. Only the email address set in `ALLOWED_EMAIL` can log in.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| Database | PostgreSQL 16, SQLAlchemy 2 (async), Alembic |
| Frontend | React 18, TypeScript, Vite, React Router v6, Axios |
| AI (primary) | Anthropic Claude (`claude-opus-4-7`) |
| AI (fallback) | DeepSeek (`deepseek-chat`) |
| Mockups | Google Gemini API |
| Auth | Google OAuth 2.0, JWT session cookies |
| Pinterest | Pinterest API v5, OAuth 2.0 |
| Deployment | Docker Compose (3 containers), Nginx |

---

## Prerequisites

- Docker Desktop (with WSL2 backend on Windows, or native on Linux/macOS)
- A Google Cloud project with OAuth 2.0 credentials
- An Anthropic API key
- A Gemini API key (optional — mockup generation only)
- A DeepSeek API key (optional — used as fallback if Anthropic credits run out)
- A Pinterest Developer app (optional — Pinterest inspiration feature)

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd ai-adviser
```

### 2. Configure the backend environment

Create `backend/.env`:

```env
# Database (filled automatically by Docker Compose — do not change)
DATABASE_URL=postgresql+asyncpg://adviser:adviser@db:5432/ai_adviser

# App security
SECRET_KEY=your-random-secret-key-here
ALLOWED_EMAIL=you@example.com

# Google OAuth
# Create credentials at https://console.cloud.google.com/apis/credentials
# Add http://localhost:8000/auth/callback as an Authorised redirect URI
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback

# AI
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...          # optional — needed for outfit mockup images
DEEPSEEK_API_KEY=sk-...         # optional — fallback if Anthropic credits run out

# Pinterest (optional)
# Create an app at https://developers.pinterest.com/apps/
# Add http://localhost:8000/pinterest/callback as a redirect URI
# Request scopes: boards:read, boards:read_secret, pins:read
PINTEREST_CLIENT_ID=
PINTEREST_CLIENT_SECRET=
PINTEREST_REDIRECT_URI=http://localhost:8000/pinterest/callback

# Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10

# Frontend URL (used for post-login redirect)
FRONTEND_URL=http://localhost:3000
```

### 3. Build and start

```bash
docker compose up --build
```

This starts three containers:

| Container | Port | Role |
|---|---|---|
| `db` | 5432 | PostgreSQL 16 database |
| `backend` | 8000 | FastAPI app + Alembic migrations |
| `frontend` | 3000 | React app served via Nginx |

Alembic migrations run automatically on backend startup.

### 4. Open the app

Navigate to `http://localhost:3000`. You will be redirected to Google to sign in.

**Windows + WSL2 note:** If `localhost` refuses to connect after a restart, add this to `C:\Users\<you>\.wslconfig` and run `wsl --shutdown` to permanently fix port forwarding:

```ini
[wsl2]
networkingMode=mirrored
```

---

## Usage

### Chat

Ask the adviser in plain language — for example:
- *"What should I wear to a casual dinner tonight?"*
- *"I need a work-appropriate look for a warm day."*

The adviser responds with a natural language recommendation plus up to 5 outfit cards, each built from items in your wardrobe. Each card shows:
- Occasion and reasoning
- Why it works (recent-wear check, occasion fit)
- **Preview outfit** — opens a modal with a mockup (if available), the item list, and a confidence gauge
- **Swap ideas** — replaces that slot with a fresh suggestion, excluding the current items
- **Log as worn** — records the outfit in the wear log

Previous chat sessions are listed in the left panel. Click **+ New chat** to start a fresh conversation.

### Wardrobe

Upload clothes via drag-and-drop (individual images or a zip archive). Each uploaded item is automatically tagged by the AI with category, colour, formality, occasions, and season. Tagged items become available to the adviser immediately.

### Wear Log

Manually log outfits worn on a given day. Items logged here (and outfits accepted from chat) are excluded from suggestions for 7 days.

### Profile

- Upload a body photo for outfit mockup generation (stored locally, never sent externally except to the Gemini API for mockup rendering).
- Set style preferences, fit notes, and colour comfort palette — these are saved automatically and inform the adviser's suggestions.
- **Connect Pinterest** to give the adviser access to your pinned styles. The adviser will reference your saved pins when building outfits and flag items you pin but don't own.

---

## Project Structure

```
ai-adviser/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, chat, wardrobe, profile, wear_log, pinterest)
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # adviser.py, tagger.py, mockup.py, pinterest.py
│   │   ├── config.py     # Pydantic settings (reads from .env)
│   │   ├── database.py   # Async engine and session
│   │   └── main.py       # FastAPI app + CORS + router registration
│   ├── migrations/       # Alembic migration versions
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/        # ChatPage, WardrobePage, WearLogPage, ProfilePage
│   │   ├── components/   # Layout, FashionVisuals
│   │   ├── lib/          # Axios instance (api.ts)
│   │   ├── types/        # Shared TypeScript interfaces
│   │   └── index.css     # All styles (custom CSS, design tokens)
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## API Overview

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/login` | Redirect to Google OAuth |
| `GET` | `/auth/callback` | OAuth callback, sets session cookie |
| `POST` | `/auth/logout` | Clear session cookie |
| `GET` | `/chat/sessions` | List all chat sessions |
| `POST` | `/chat/` | Send a message (creates session if none given) |
| `GET` | `/chat/history?session_id=` | Load messages for a session |
| `POST` | `/chat/accept` | Log an outfit suggestion as worn |
| `POST` | `/chat/swap` | Regenerate a single outfit slot |
| `GET` | `/chat/mockup/{id}` | Serve a generated outfit mockup image |
| `GET` | `/wardrobe/` | List wardrobe items |
| `POST` | `/wardrobe/upload` | Upload a single item |
| `POST` | `/wardrobe/bulk-upload` | Upload a zip of items |
| `GET` | `/profile/` | Get profile and preferences |
| `PATCH` | `/profile/preferences` | Save style/fit/colour preferences |
| `POST` | `/profile/body-photo` | Upload body photo |
| `GET` | `/wear-log/` | List wear log entries |
| `POST` | `/wear-log/` | Add a wear log entry |
| `GET` | `/pinterest/status` | Check Pinterest connection |
| `GET` | `/pinterest/auth` | Start Pinterest OAuth flow |
| `POST` | `/pinterest/disconnect` | Revoke Pinterest access |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL async connection string |
| `SECRET_KEY` | Yes | JWT signing key |
| `ALLOWED_EMAIL` | Yes | The only email address permitted to log in |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Yes | Must match Google Cloud Console setting |
| `ANTHROPIC_API_KEY` | Yes | Primary AI provider |
| `GEMINI_API_KEY` | No | Outfit mockup image generation |
| `DEEPSEEK_API_KEY` | No | AI fallback when Anthropic credits are exhausted |
| `PINTEREST_CLIENT_ID` | No | Pinterest OAuth app ID |
| `PINTEREST_CLIENT_SECRET` | No | Pinterest OAuth app secret |
| `PINTEREST_REDIRECT_URI` | No | Must match Pinterest Developer app setting |
| `UPLOAD_DIR` | No | Local path for uploaded files (default: `./uploads`) |
| `MAX_UPLOAD_SIZE_MB` | No | Max file upload size in MB (default: `10`) |
| `FRONTEND_URL` | No | Post-login redirect destination (default: `http://localhost:3000`) |
