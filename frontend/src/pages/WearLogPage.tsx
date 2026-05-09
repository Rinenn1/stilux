import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { WardrobeItem, WearLog } from "../types";

export default function WearLogPage() {
  const [logs, setLogs] = useState<WearLog[]>([]);
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [logsRes, itemsRes] = await Promise.all([api.get("/wear-log/"), api.get("/wardrobe/items")]);
    setLogs(logsRes.data);
    setItems(itemsRes.data);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load wear history."));
  }, []);

  const itemMap = useMemo(() => {
    const map: Record<number, WardrobeItem> = {};
    items.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [items]);

  const rotation = Math.min(100, Math.round((new Set(logs.flatMap((log) => log.item_ids)).size / Math.max(items.length, 1)) * 100));

  async function logManual() {
    if (!selectedIds.length) return;
    await api.post("/wear-log/", { item_ids: selectedIds, note: note || null });
    setSelectedIds([]);
    setNote("");
    await load();
  }

  async function deleteLog(id: number) {
    await api.delete(`/wear-log/${id}`);
    setLogs((current) => current.filter((log) => log.id !== id));
  }

  function toggleItem(id: number) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <main className="main" data-screen-label="Wear log">
      <div className="head">
        <div>
          <h1>Wear log</h1>
          <p>A clean history that helps Stilux avoid repeats and learn what you actually wear.</p>
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 24 }}>
        {error && <div className="error-banner" style={{ marginBottom: 18 }}>{error}</div>}

        <div className="log-grid">
          <section className="log-panel">
            <h3>Log today</h3>
            <div className="sub">Select pieces or accept a suggestion from chat.</div>

            <div className="log-picker">
              {items.length === 0 && <div className="empty-state">Add wardrobe items before logging outfits.</div>}
              {items.map((item) => {
                const selected = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`log-row${selected ? "" : " off"}`}
                  >
                    <span>{item.name || item.original_name}</span>
                    <span className="x">{selected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>

            <textarea
              className="note-area"
              placeholder="How did it feel?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />

            <button className="btn btn-primary" type="button" style={{ width: "100%", minHeight: 48 }} onClick={logManual} disabled={!selectedIds.length}>
              Log outfit ({selectedIds.length} {selectedIds.length === 1 ? "piece" : "pieces"})
            </button>

            <div style={{ marginTop: 26 }}>
              <div className="health-label">Rotation health</div>
              <div className="health-bar">
                <div style={{ width: `${rotation}%` }} />
              </div>
              <div className="health-text">{rotation} percent of wardrobe used in recent history</div>
            </div>
          </section>

          <section className="history">
            <h3>Recent history</h3>
            {logs.length === 0 && <div className="empty-state">No outfits logged yet. Pick pieces on the left to start.</div>}

            {logs.map((log) => (
              <article key={log.id} className="entry">
                <div className="swatch" />
                <div className="body">
                  <div className="ttl">{titleFromLog(log, itemMap)}</div>
                  <div className="meta">
                    {new Date(log.worn_at).toLocaleDateString()} · {log.source}
                    {log.note ? ` · ${log.note}` : ""}
                  </div>
                </div>
                <span className="pcs">{log.item_ids.length} pcs</span>
                <span className="mood">{log.source === "suggestion" ? "Styled" : "Manual"}</span>
                <button className="rm" type="button" onClick={() => deleteLog(log.id)}>
                  Remove
                </button>
              </article>
            ))}

            <div className="insight">
              <div className="glyph">i</div>
              <div>
                <div className="ttl">Adviser insight</div>
                <div className="body">
                  Local preview: rotation insights will become smarter once preference and item analytics are stored.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function titleFromLog(log: WearLog, itemMap: Record<number, WardrobeItem>) {
  const names = log.item_ids.map((id) => itemMap[id]?.name || itemMap[id]?.original_name).filter(Boolean);
  if (names.length) return names.slice(0, 3).join(", ");
  if (log.item_ids.length === 1) return "Single-piece wear";
  if (log.item_ids.length === 3) return "Three-piece edit";
  if (log.item_ids.length >= 4) return "Layered combination";
  return "Logged outfit";
}
