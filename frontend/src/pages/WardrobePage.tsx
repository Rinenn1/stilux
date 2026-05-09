import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDropzone } from "react-dropzone";
import api from "../lib/api";
import { WardrobeItem } from "../types";
import { swatchesFor, WardrobeThumb } from "../components/FashionVisuals";

const FILTERS = [
  { key: "all", label: "All items" },
  { key: "tops", label: "Tops" },
  { key: "bottoms", label: "Bottoms" },
  { key: "shoes", label: "Shoes" },
  { key: "outerwear", label: "Outerwear" },
  { key: "accessories", label: "Accessories" },
  { key: "full-outfit", label: "Full outfits" },
];

const CATEGORIES = ["tops", "bottoms", "shoes", "outerwear", "accessories", "full-outfit"];
const FORMALITIES = ["casual", "smart-casual", "formal"];
const OCCASIONS = ["work", "casual", "date", "workout", "formal", "travel"];

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/wardrobe/items");
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => setError("Could not load wardrobe items."));
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      if (accepted.length === 1) {
        form.append("file", accepted[0]);
        await api.post("/wardrobe/upload", form);
      } else {
        accepted.forEach((file) => form.append("files", file));
        await api.post("/wardrobe/upload-bulk", form);
      }
      await load();
    } catch {
      setError("Upload failed. Check file type, size, and your session.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
  });

  const counts = useMemo(
    () =>
      items.reduce<Record<string, number>>(
        (acc, item) => {
          acc.all += 1;
          acc[item.category || "uncategorized"] = (acc[item.category || "uncategorized"] || 0) + 1;
          return acc;
        },
        { all: 0 }
      ),
    [items]
  );

  const filtered = filter === "all" ? items : items.filter((item) => item.category === filter);
  const reviewCount = items.filter((item) => !item.tagging_complete || !item.category).length;

  async function deleteItem(id: number) {
    await api.delete(`/wardrobe/items/${id}`);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function saveEdit() {
    if (!editing) return;
    await api.patch(`/wardrobe/items/${editing.id}`, {
      name: editing.name,
      category: editing.category,
      color: editing.color,
      formality: editing.formality,
      season: editing.season,
      occasions: editing.occasions,
      style_notes: editing.style_notes,
      tags: editing.tags,
    });
    setEditing(null);
    await load();
  }

  return (
    <main className="main" data-screen-label="Wardrobe">
      <div className="head">
        <div>
          <h1>Wardrobe</h1>
          <p>Fast scan, smart tags, edit only what needs a human eye.</p>
        </div>
        <div className="right">
          <button className="btn btn-secondary btn-sm" type="button">
            Filter
          </button>
          <button className="btn btn-primary btn-sm" type="button" onClick={() => document.getElementById("wardrobe-upload")?.click()}>
            Upload
          </button>
        </div>
      </div>

      <div className="scroll">
        {error && <div className="error-banner" style={{ marginBottom: 18 }}>{error}</div>}

        <div {...getRootProps()} className={`upload-strip${isDragActive ? " drag" : ""}`}>
          <input {...getInputProps({ id: "wardrobe-upload" })} />
          <div className="plus">+</div>
          <div className="text">
            <h4>{uploading ? "Uploading wardrobe photos" : "Drop new wardrobe photos"}</h4>
            <p>Bulk upload, AI tags, then quick review. Uploaded photos remain the source of truth.</p>
          </div>
          <button className="btn btn-secondary btn-sm" type="button">
            Import from phone
          </button>
        </div>

        <div className="tags-row" style={{ marginBottom: 24 }}>
          {FILTERS.map((item) => (
            <button
              key={item.key}
              className={`tag${filter === item.key ? " active" : ""}`}
              type="button"
              onClick={() => setFilter(item.key)}
            >
              {item.label} {counts[item.key] ?? 0}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">No wardrobe items in this view yet.</div>
        ) : (
          <div className="grid">
            {filtered.map((item) => (
              <article key={item.id} className="item-card">
                <WardrobeThumb item={item} />
                <div className="item-meta">
                  <div className="name">{item.name || item.original_name}</div>
                  <div className="sub">
                    {item.category || "uncategorized"} · {item.formality || "needs review"}
                  </div>
                  <div className="swatches">
                    {swatchesFor(item).map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </div>
                  <div className="outfit-actions" style={{ marginTop: 14 }}>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => setEditing(item)}>
                      Edit
                    </button>
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => deleteItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="footer-strip">
          <span>Review queue: {reviewCount} items need category confirmation</span>
          <button className="btn btn-secondary btn-sm" type="button">
            Review tags
          </button>
        </div>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" style={{ width: "min(720px, 92vw)" }} onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h2>Edit item</h2>
                <p>Keep AI tags useful by correcting the details that matter.</p>
              </div>
              <button className="modal-close" type="button" onClick={() => setEditing(null)}>
                x
              </button>
            </div>
            <div className="modal-body" style={{ gridTemplateColumns: "1fr" }}>
              <div className="section" style={{ display: "grid", gap: 14 }}>
                <Field label="Name">
                  <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
                </Field>
                <Field label="Category">
                  <select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
                    {CATEGORIES.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Color">
                  <input value={editing.color} onChange={(event) => setEditing({ ...editing, color: event.target.value })} />
                </Field>
                <Field label="Formality">
                  <select value={editing.formality} onChange={(event) => setEditing({ ...editing, formality: event.target.value })}>
                    {FORMALITIES.map((formality) => (
                      <option key={formality}>{formality}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Season">
                  <input value={editing.season} onChange={(event) => setEditing({ ...editing, season: event.target.value })} />
                </Field>
                <Field label="Occasions">
                  <div className="tags-row">
                    {OCCASIONS.map((occasion) => (
                      <button
                        key={occasion}
                        className={`tag${editing.occasions.includes(occasion) ? " active" : ""}`}
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            occasions: editing.occasions.includes(occasion)
                              ? editing.occasions.filter((item) => item !== occasion)
                              : [...editing.occasions, occasion],
                          })
                        }
                      >
                        {occasion}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Style notes">
                  <textarea rows={3} value={editing.style_notes} onChange={(event) => setEditing({ ...editing, style_notes: event.target.value })} />
                </Field>
                <Field label="Tags">
                  <input
                    value={editing.tags.join(", ")}
                    onChange={(event) =>
                      setEditing({
                        ...editing,
                        tags: event.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
                <div className="outfit-actions">
                  <button className="btn btn-primary" type="button" onClick={saveEdit}>
                    Save
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}
