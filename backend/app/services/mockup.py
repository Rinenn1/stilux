import asyncio
import base64
import uuid
from pathlib import Path
import httpx
from app.config import settings

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent"


def _encode_image(path: str) -> tuple[str, str]:
    data = Path(path).read_bytes()
    suffix = Path(path).suffix.lower()
    mime_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
    mime = mime_map.get(suffix, "image/jpeg")
    return base64.standard_b64encode(data).decode(), mime


async def generate_mockup(
    body_photo_path: str,
    outfit_item_paths: list[str],
    outfit_description: str,
    occasion: str,
) -> str | None:
    """Generate a photorealistic mockup of the user wearing the outfit. Returns saved file path or None."""
    body_b64, body_mime = _encode_image(body_photo_path)

    parts = [
        {
            "inline_data": {
                "mime_type": body_mime,
                "data": body_b64,
            }
        },
    ]

    for item_path in outfit_item_paths[:4]:  # Gemini supports up to ~4 ref images
        b64, mime = _encode_image(item_path)
        parts.append({"inline_data": {"mime_type": mime, "data": b64}})

    parts.append({
        "text": (
            f"Using the person in the first image as the subject, generate a photorealistic full-body portrait "
            f"of them wearing this outfit: {outfit_description}. "
            f"The clothing items are shown in the subsequent images — replicate their exact colors, patterns, and style. "
            f"Place the person against a clean, neutral light grey studio background. "
            f"Occasion: {occasion}. "
            f"Show the complete outfit from head to toe. Maintain the person's face, skin tone, and body proportions exactly."
        )
    })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]},
    }

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GEMINI_API_URL,
            params={"key": settings.gemini_api_key},
            json=payload,
        )

    if resp.status_code != 200:
        return None

    data = resp.json()
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            if "inlineData" in part and part["inlineData"]["mimeType"].startswith("image/"):
                img_bytes = base64.b64decode(part["inlineData"]["data"])
                upload_dir = Path(settings.upload_dir) / "mockups"
                upload_dir.mkdir(parents=True, exist_ok=True)
                out_path = upload_dir / f"{uuid.uuid4().hex}.png"
                out_path.write_bytes(img_bytes)
                return str(out_path)

    return None


async def generate_all_mockups(
    body_photo_path: str,
    outfits: list[dict],  # each: {item_ids, outfit_description, occasion, item_paths}
) -> list[str | None]:
    """Generate all 5 mockups in parallel."""
    tasks = [
        generate_mockup(
            body_photo_path,
            o["item_paths"],
            o["outfit_description"],
            o["occasion"],
        )
        for o in outfits
    ]
    return await asyncio.gather(*tasks)
