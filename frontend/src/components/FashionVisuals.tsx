import type { WardrobeItem } from "../types";

const categoryColors: Record<string, string[]> = {
  tops: ["#f3eee3", "#4bd8b8"],
  bottoms: ["#505963", "#d5ac64"],
  shoes: ["#d5ac64", "#5bd2bb"],
  outerwear: ["#4e748b", "#e0ba72"],
  accessories: ["#1e2022", "#d5ac64"],
  "full-outfit": ["#f3eee3", "#252a30"],
};

export function swatchesFor(item: WardrobeItem): string[] {
  if (item.color) {
    const lower = item.color.toLowerCase();
    const mapped = [
      lower.includes("black") && "#1e2022",
      lower.includes("white") && "#f3eee8",
      lower.includes("ivory") && "#f3eee3",
      lower.includes("navy") && "#27384c",
      lower.includes("blue") && "#537182",
      lower.includes("charcoal") && "#505963",
      lower.includes("grey") && "#9aa0a6",
      lower.includes("gray") && "#9aa0a6",
      lower.includes("tan") && "#d5ac64",
      lower.includes("brown") && "#5b3a25",
      lower.includes("olive") && "#5e6a45",
      lower.includes("green") && "#4f7a5f",
      lower.includes("red") && "#9a4b45",
    ].filter(Boolean) as string[];
    if (mapped.length) return mapped.slice(0, 2);
  }
  return categoryColors[item.category] || ["#2a3742", "#4bd8b8"];
}

export function ItemFallback({ category }: { category?: string }) {
  switch (category) {
    case "bottoms":
      return (
        <svg viewBox="0 0 200 200" className="mann-svg" style={{ background: "#292f36", borderRadius: 18 }}>
          <rect x="68" y="42" width="38" height="138" rx="14" fill="#2f3439" />
          <rect x="116" y="42" width="38" height="138" rx="14" fill="#24292f" />
        </svg>
      );
    case "shoes":
      return (
        <svg viewBox="0 0 200 200" className="mann-svg" style={{ background: "#d0a45e", borderRadius: 18 }}>
          <ellipse cx="100" cy="112" rx="64" ry="26" fill="#6b4b2a" />
          <ellipse cx="122" cy="128" rx="58" ry="22" fill="#8b6334" />
        </svg>
      );
    case "outerwear":
      return (
        <svg viewBox="0 0 200 200" className="mann-svg" style={{ background: "#536674", borderRadius: 18 }}>
          <rect x="55" y="42" width="110" height="132" rx="32" fill="#294052" />
          <rect x="98" y="42" width="4" height="132" fill="#1c2a36" />
        </svg>
      );
    case "accessories":
      return (
        <svg viewBox="0 0 200 200" className="mann-svg" style={{ background: "#e8e0d0", borderRadius: 18 }}>
          <circle cx="100" cy="100" r="54" fill="none" stroke="#191919" strokeWidth="14" />
          <rect x="92" y="60" width="16" height="14" fill="#d5ac64" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 200" className="mann-svg" style={{ background: "#ddd5c8", borderRadius: 18 }}>
          <rect x="40" y="32" width="120" height="140" rx="40" fill="#f3eee3" />
        </svg>
      );
  }
}

export function Mannequin({
  top = "#f3eee8",
  bottom = "#252a30",
  shoe = "#9d6b39",
  skin = "#87684e",
}: {
  top?: string;
  bottom?: string;
  shoe?: string;
  skin?: string;
}) {
  return (
    <svg viewBox="0 0 200 280" className="mann-svg">
      <ellipse cx="100" cy="46" rx="28" ry="32" fill={skin} />
      <rect x="70" y="80" width="60" height="100" rx="22" fill={top} />
      <rect x="58" y="170" width="34" height="86" rx="14" fill={bottom} />
      <rect x="108" y="170" width="34" height="86" rx="14" fill={bottom} />
      <rect x="56" y="252" width="40" height="14" rx="7" fill={shoe} />
      <rect x="106" y="252" width="40" height="14" rx="7" fill={shoe} />
    </svg>
  );
}

export function WardrobeThumb({ item }: { item: WardrobeItem }) {
  return (
    <div className="item-thumb" style={{ position: "relative" }}>
      {item.image_url ? (
        <img
          className="item-photo"
          src={item.image_url}
          alt={item.name || item.original_name}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <ItemFallback category={item.category} />
      {!item.tagging_complete && <span className="tagging-pill">Tagging</span>}
    </div>
  );
}
