export interface WardrobeItem {
  id: number;
  name: string;
  category: string;
  color: string;
  formality: string;
  season: string;
  occasions: string[];
  style_notes: string;
  tags: string[];
  tagging_complete: boolean;
  original_name: string;
  created_at: string;
  image_url: string;
}

export interface OutfitSuggestion {
  id: number;
  index: number;
  item_ids: number[];
  occasion: string;
  reasoning: string;
  mockup_url: string | null;
  cautions: string | null;
  _accepted?: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  suggestions?: OutfitSuggestion[];
}

export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
}

export interface WearLog {
  id: number;
  item_ids: number[];
  source: string;
  worn_at: string;
  note: string | null;
}
