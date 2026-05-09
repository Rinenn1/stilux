import { useEffect, useRef, useState, type CSSProperties } from "react";
import api from "../lib/api";
import { ChatMessage, ChatSession, OutfitSuggestion } from "../types";
import { ItemFallback, Mannequin } from "../components/FashionVisuals";

const QUICK_PROMPTS = [
  "What should I wear to a casual dinner tonight?",
  "I need a work-appropriate look for a warm day.",
  "Suggest something for travel, comfy but put-together.",
  "A first-date outfit, not too dressed up.",
];

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<OutfitSuggestion | null>(null);
  const [swappingIds, setSwappingIds] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    api.get("/chat/sessions").then((res) => {
      const list: ChatSession[] = res.data;
      setSessions(list);
      if (list.length > 0) {
        loadSession(list[0].id);
      }
    }).catch(() => {
      setError("Could not load chat sessions.");
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function loadSession(sessionId: number) {
    setActiveSessionId(sessionId);
    setMessages([]);
    setError("");
    api.get(`/chat/history?session_id=${sessionId}`)
      .then((res) => setMessages(res.data))
      .catch(() => setError("Could not load chat history."));
  }

  function startNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setError("");
    setInput("");
  }

  async function send(text = input) {
    const content = text.trim();
    if (!content || loading) return;
    const userMsg: ChatMessage = { role: "user", content };

    setMessages((current) => [...current, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/chat/", {
        message: content,
        session_id: activeSessionId,
      });

      // If this created a new session, add it to the list and set active
      if (!activeSessionId) {
        setActiveSessionId(data.session_id);
        const sessRes = await api.get("/chat/sessions");
        setSessions(sessRes.data);
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.reply,
          suggestions: data.suggestions,
        },
      ]);
    } catch {
      setError("The adviser could not respond. Check the backend and API keys, then try again.");
    } finally {
      setLoading(false);
    }
  }

  async function acceptOutfit(suggestion: OutfitSuggestion) {
    await api.post("/chat/accept", { suggestion_id: suggestion.id });
    setPreview(null);
    setMessages((current) =>
      current.map((message) => ({
        ...message,
        suggestions: message.suggestions?.map((item) =>
          item.id === suggestion.id ? { ...item, _accepted: true } : item
        ),
      }))
    );
  }

  async function swapOutfit(suggestion: OutfitSuggestion) {
    setSwappingIds((prev) => new Set(prev).add(suggestion.id));
    try {
      const { data } = await api.post("/chat/swap", { suggestion_id: suggestion.id });
      setMessages((current) =>
        current.map((message) => ({
          ...message,
          suggestions: message.suggestions?.map((item) =>
            item.id === suggestion.id ? { ...data } : item
          ),
        }))
      );
    } catch {
      setError("Could not generate an alternative outfit. Try again.");
    } finally {
      setSwappingIds((prev) => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }
  }

  return (
    <main className="main" data-screen-label="Chat">
      <div className="chat-page-inner">
        {/* Sessions panel */}
        <aside className="sessions-panel">
          <button className="new-chat-btn" type="button" onClick={startNewChat}>
            <span className="plus-ico">+</span>
            New chat
          </button>
          <div className="sessions-list">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`session-item${session.id === activeSessionId ? " active" : ""}`}
                onClick={() => loadSession(session.id)}
              >
                <div className="session-title">{session.title}</div>
                <div className="session-date">{formatSessionDate(session.created_at)}</div>
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="sessions-empty">No previous chats</div>
            )}
          </div>
        </aside>

        {/* Chat content */}
        <div className="chat-content">
          <div className="head">
            <div>
              <h1>Personal adviser</h1>
              <p>Ask for an occasion. Get outfits from your actual wardrobe.</p>
            </div>
            <div className="right">
              <button className="pill" type="button">
                <span className="dot" />
                <span>Wardrobe-aware recommendations</span>
              </button>
            </div>
          </div>

          <div className="chat-wrap">
            {error && <div className="error-banner">{error}</div>}

            <div className="chat-stream">
              {messages.length === 0 && !loading && (
                <div className="empty-state">
                  Ask Stilux what to wear. It will use your wardrobe and wear history.
                </div>
              )}

              {messages.map((message, index) => (
                <ChatBubble
                  key={`${message.role}-${index}`}
                  message={message}
                  onPreview={setPreview}
                  onSwap={swapOutfit}
                  swappingIds={swappingIds}
                />
              ))}

              {loading && (
                <div className="msg bot">
                  <div className="bubble" style={{ display: "inline-block" }}>
                    <div className="typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                  <div className="role">Stilux is thinking</div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => send(prompt)} disabled={loading}>
                  {prompt}
                </button>
              ))}
            </div>

            <div className="composer">
              <input
                placeholder="Ask your fashion adviser..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                disabled={loading}
              />
              <button className="send" type="button" onClick={() => send()} disabled={loading || !input.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <OutfitModal suggestion={preview} onClose={() => setPreview(null)} onLog={() => acceptOutfit(preview)} />
      )}
    </main>
  );
}

function ChatBubble({
  message,
  onPreview,
  onSwap,
  swappingIds,
}: {
  message: ChatMessage;
  onPreview: (s: OutfitSuggestion) => void;
  onSwap: (s: OutfitSuggestion) => void;
  swappingIds: Set<number>;
}) {
  if (message.role === "user") {
    return (
      <div className="msg user">
        <div className="bubble">
          <p>{message.content}</p>
        </div>
        <div className="role">You</div>
      </div>
    );
  }

  return (
    <div className="msg bot">
      <div className="bubble">
        <div className="lead">Stilux recommendation</div>
        <p>{message.content}</p>
      </div>
      {message.suggestions?.map((suggestion) => (
        <div key={suggestion.id} style={{ marginTop: 18 }}>
          <OutfitSuggestionCard
            suggestion={suggestion}
            onPreview={() => onPreview(suggestion)}
            onSwap={() => onSwap(suggestion)}
            swapping={swappingIds.has(suggestion.id)}
          />
        </div>
      ))}
    </div>
  );
}

function OutfitSuggestionCard({
  suggestion,
  onPreview,
  onSwap,
  swapping,
}: {
  suggestion: OutfitSuggestion & { _accepted?: boolean };
  onPreview: () => void;
  onSwap: () => void;
  swapping: boolean;
}) {
  return (
    <div className="outfit-card">
      <div className="outfit-visual">
        {suggestion.mockup_url ? (
          <img src={suggestion.mockup_url} alt={`Outfit ${suggestion.index}`} />
        ) : (
          <Mannequin />
        )}
      </div>

      <div className="outfit-body">
        <div className="kicker">Outfit {suggestion.index}</div>
        <h3>{suggestion.occasion || "Ready-to-wear look"}</h3>
        <p className="desc">{suggestion.reasoning || "A balanced look built from your wardrobe."}</p>
        <div className="outfit-actions">
          <button className="btn btn-primary" type="button" onClick={onPreview} disabled={suggestion._accepted || swapping}>
            {suggestion._accepted ? "Logged as worn" : "Preview outfit"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onSwap} disabled={swapping || suggestion._accepted}>
            {swapping ? "Finding alternatives..." : "Swap ideas"}
          </button>
        </div>
      </div>

      <div className="why">
        <div className="head-mini">WHY IT WORKS</div>
        <ul>
          <li>Built from uploaded wardrobe items</li>
          <li>Checks recent wear history</li>
          {suggestion.cautions ? <li>{suggestion.cautions}</li> : <li>Occasion-aware styling</li>}
        </ul>
      </div>
    </div>
  );
}

function OutfitModal({
  suggestion,
  onClose,
  onLog,
}: {
  suggestion: OutfitSuggestion;
  onClose: () => void;
  onLog: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Outfit preview</h2>
            <p>See the recommendation before you commit it to the wear log.</p>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>
            x
          </button>
        </div>
        <div className="modal-body">
          <div className="preview-figure">
            <div className="canvas">
              {suggestion.mockup_url ? <img src={suggestion.mockup_url} alt="Generated outfit mockup" /> : <Mannequin />}
            </div>
            <div className="footer">
              <span>{suggestion.mockup_url ? "Generated mockup" : "Fallback preview"}</span>
              <span>Studio view</span>
            </div>
          </div>

          <div className="preview-side">
            <div className="preview-info">
              <div className="kicker">Outfit {suggestion.index}</div>
              <h3>{suggestion.occasion || "Recommended look"}</h3>
              <p>{suggestion.reasoning}</p>
            </div>

            <div className="pieces-card">
              <h4>Pieces</h4>
              <div className="pieces-grid">
                {suggestion.item_ids.map((id) => (
                  <div className="piece" key={id}>
                    <div className="pgraphic">
                      <ItemFallback />
                    </div>
                    <div className="pname">Wardrobe item #{id}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="metrics">
              <div className="metric-card">
                <h4>Confidence</h4>
                <div className="gauge">
                  <div className="ring" style={{ "--p": 86 } as CSSProperties}>
                    <div className="num">86</div>
                  </div>
                  <div>
                    <div>Strong match for the occasion</div>
                    <div className="health-text">No repeated items this week</div>
                  </div>
                </div>
              </div>
              <div className="metric-card">
                <h4>Actions</h4>
                <button className="btn btn-primary" type="button" style={{ width: "100%", minHeight: 44 }} onClick={onLog}>
                  Log as worn
                </button>
                <button className="btn btn-secondary btn-sm" type="button" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>
                  Regenerate later
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
