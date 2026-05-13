import json
import anthropic
from app.config import settings

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

TAG_PROMPT = """You are a fashion expert. Analyze this clothing item photo and return ONLY a JSON object with these fields:
{
  "name": "short descriptive name (e.g. Navy slim-fit chinos)",
  "category": "one of: tops | bottoms | shoes | outerwear | accessories | full-outfit",
  "color": "primary color(s), comma-separated",
  "formality": "one of: casual | smart-casual | formal",
  "season": "comma-separated subset of: spring, summer, autumn, winter, all",
  "occasions": ["array of applicable: work, casual, date, workout, formal, travel"],
  "style_notes": "2-3 sentences on style, fit, material if visible, and what it pairs well with",
  "tags": ["array of 3-6 descriptive tags like 'slim-fit', 'cotton', 'neutral', 'patterned'"]
}
Return ONLY valid JSON, no markdown, no explanation."""


async def tag_wardrobe_item(image_url: str) -> dict:
    message = await client.messages.create(
        model="claude-opus-4-7",
        max_tokens=600,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "url", "url": image_url}},
                    {"type": "text", "text": TAG_PROMPT},
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()
    return json.loads(raw)
