import uuid
from pathlib import Path
import httpx
from app.config import settings

BUCKET_WARDROBE = "wardrobe"
BUCKET_PROFILE = "profile"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "apikey": settings.supabase_service_role_key,
    }


def public_url(bucket: str, filename: str) -> str:
    return f"{settings.supabase_url}/storage/v1/object/public/{bucket}/{filename}"


async def upload(bucket: str, original_name: str, file_bytes: bytes, content_type: str) -> tuple[str, str]:
    ext = Path(original_name).suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.supabase_url}/storage/v1/object/{bucket}/{filename}",
            content=file_bytes,
            headers={
                **_headers(),
                "Content-Type": content_type,
                "x-upsert": "true",
            },
        )
        resp.raise_for_status()

    return filename, public_url(bucket, filename)


async def delete(bucket: str, filename: str) -> None:
    async with httpx.AsyncClient() as client:
        await client.delete(
            f"{settings.supabase_url}/storage/v1/object/{bucket}",
            json={"prefixes": [filename]},
            headers=_headers(),
        )
