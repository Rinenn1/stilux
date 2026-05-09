import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "../lib/api";
import { Mannequin } from "../components/FashionVisuals";

const STYLES = ["Minimal", "Smart casual", "Classic", "Streetwear", "Neutral", "Workwear"];
const COLORS = [
  { hex: "#f3eee3", name: "Ivory" },
  { hex: "#22272d", name: "Black" },
  { hex: "#537182", name: "Slate" },
  { hex: "#b78a4e", name: "Tan" },
];

export default function ProfilePage() {
  const [hasPhoto, setHasPhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ts, setTs] = useState(Date.now());
  const [styles, setStyles] = useState<string[]>(["Minimal", "Neutral"]);
  const [colors, setColors] = useState<string[]>(["#f3eee3", "#22272d"]);
  const [fit, setFit] = useState({ shoulders: 72, waist: 86 });
  const [privacy, setPrivacy] = useState({ mockups: true, local: true });
  const [error, setError] = useState("");
  const [pinterestStatus, setPinterestStatus] = useState<{ connected: boolean; configured: boolean } | null>(null);
  const [pinterestLoading, setPinterestLoading] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api
      .get("/profile/")
      .then((response) => {
        const data = response.data;
        setHasPhoto(data.has_body_photo);
        if (data.style_preferences?.length) setStyles(data.style_preferences);
        if (data.color_comfort?.length) setColors(data.color_comfort);
        if (data.fit_preferences && Object.keys(data.fit_preferences).length) {
          setFit((prev) => ({ ...prev, ...data.fit_preferences }));
        }
      })
      .catch(() => setError("Could not load profile."));

    api.get("/pinterest/status").then((res) => setPinterestStatus(res.data)).catch(() => {});
  }, []);

  async function disconnectPinterest() {
    setPinterestLoading(true);
    try {
      await api.post("/pinterest/disconnect");
      setPinterestStatus((prev) => prev ? { ...prev, connected: false } : null);
    } catch {
      setError("Could not disconnect Pinterest.");
    } finally {
      setPinterestLoading(false);
    }
  }

  function savePreferences(nextStyles: string[], nextColors: string[], nextFit: { shoulders: number; waist: number }) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api
        .patch("/profile/preferences", {
          style_preferences: nextStyles,
          color_comfort: nextColors,
          fit_preferences: nextFit,
        })
        .catch(() => setError("Could not save preferences."));
    }, 600);
  }

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", files[0]);
      await api.post("/profile/body-photo", form);
      setHasPhoto(true);
      setTs(Date.now());
    } catch {
      setError("Body photo upload failed. Use a JPEG, PNG, or WebP image.");
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxFiles: 1,
  });

  function toggleStyle(style: string) {
    const next = styles.includes(style) ? styles.filter((s) => s !== style) : [...styles, style];
    setStyles(next);
    savePreferences(next, colors, fit);
  }

  function toggleColor(color: string) {
    const next = colors.includes(color) ? colors.filter((c) => c !== color) : [...colors, color];
    setColors(next);
    savePreferences(styles, next, fit);
  }

  function updateFit(next: { shoulders: number; waist: number }) {
    setFit(next);
    savePreferences(styles, colors, next);
  }

  return (
    <main className="main" data-screen-label="Profile">
      <div className="head">
        <div>
          <h1>Profile and fit base</h1>
          <p>A clearer, more private setup for body photo and style preferences.</p>
        </div>
      </div>

      <div className="scroll">
        {error && <div className="error-banner" style={{ marginBottom: 18 }}>{error}</div>}

        <div className="profile-grid">
          <section className="body-card">
            <div className="body-photo">
              {hasPhoto ? (
                <img src={`/profile/body-photo?t=${ts}`} alt="Your body photo" />
              ) : (
                <div className="figure">
                  <Mannequin top="#263744" bottom="#2e3338" shoe="#1d2227" />
                </div>
              )}
              <div className="label">USED ONLY FOR MOCKUPS</div>
            </div>
            <div className="row" {...getRootProps()}>
              <input {...getInputProps()} />
              <div>
                <div className="ttl">{hasPhoto ? "Body photo ready" : "Body photo needed"}</div>
                <div className="sub">{uploading ? "Uploading..." : "Used only for outfit mockups"}</div>
              </div>
              <button className="btn btn-secondary btn-sm" type="button">
                {hasPhoto ? "Replace" : "Upload"}
              </button>
            </div>
          </section>

          <div className="profile-right">
            <section className="section">
              <h3>Style preferences</h3>
              <div>
                {STYLES.map((style) => (
                  <span key={style} className={`style-tag${styles.includes(style) ? " active" : ""}`} onClick={() => toggleStyle(style)}>
                    {style}
                  </span>
                ))}
              </div>
            </section>

            <div className="section-2col">
              <section className="subsection">
                <h4>Fit notes</h4>
                <div className="fit-row">Prefers relaxed shoulders</div>
                <div className="fit-bar">
                  <div style={{ width: `${fit.shoulders}%` }} />
                </div>
                <input
                  className="range"
                  type="range"
                  min="0"
                  max="100"
                  value={fit.shoulders}
                  onChange={(event) => updateFit({ ...fit, shoulders: Number(event.target.value) })}
                />
                <div className="fit-row">Avoids tight waistbands</div>
                <div className="fit-bar">
                  <div style={{ width: `${fit.waist}%` }} />
                </div>
                <input
                  className="range"
                  type="range"
                  min="0"
                  max="100"
                  value={fit.waist}
                  onChange={(event) => updateFit({ ...fit, waist: Number(event.target.value) })}
                />
              </section>

              <section className="subsection">
                <h4>Color comfort</h4>
                <div className="swatches-row">
                  {COLORS.map((color) => (
                    <div
                      key={color.hex}
                      className={`swatch-circle${colors.includes(color.hex) ? " active" : ""}`}
                      style={{ background: color.hex }}
                      title={color.name}
                      onClick={() => toggleColor(color.hex)}
                    />
                  ))}
                </div>
                <div className="health-text">High confidence palette from wardrobe</div>
              </section>
            </div>

            <section className="section">
              <h3>Pinterest inspiration</h3>
              <p className="sub" style={{ marginBottom: 16 }}>
                Connect your Pinterest to let Stilux reference your saved pins when building outfits and spotting wardrobe gaps.
              </p>
              {pinterestStatus === null ? (
                <div style={{ color: "var(--text-5)", fontSize: 13 }}>Checking connection…</div>
              ) : !pinterestStatus.configured ? (
                <div className="pinterest-unconfigured">
                  <div style={{ color: "var(--text-3)", fontSize: 13.5, marginBottom: 12 }}>
                    Pinterest integration is not configured yet. Add <code>PINTEREST_CLIENT_ID</code> and{" "}
                    <code>PINTEREST_CLIENT_SECRET</code> to <code>.env</code>, then restart the backend.
                  </div>
                </div>
              ) : pinterestStatus.connected ? (
                <div className="pinterest-connected">
                  <div className="pinterest-badge">
                    <PinterestIcon />
                    <span>Pinterest connected</span>
                    <span className="connected-dot" />
                  </div>
                  <p style={{ color: "var(--text-4)", fontSize: 13, margin: "10px 0 16px" }}>
                    Stilux will reference your pinned styles when suggesting outfits and identifying what to add to your wardrobe.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={disconnectPinterest}
                    disabled={pinterestLoading}
                  >
                    {pinterestLoading ? "Disconnecting…" : "Disconnect Pinterest"}
                  </button>
                </div>
              ) : (
                <div>
                  <a className="btn btn-pinterest" href="/pinterest/auth">
                    <PinterestIcon />
                    Connect Pinterest
                  </a>
                  <p style={{ color: "var(--text-5)", fontSize: 12, marginTop: 10 }}>
                    You'll be redirected to Pinterest to authorise access to your boards and saved pins.
                  </p>
                </div>
              )}
            </section>

            <section className="section">
              <h3>Privacy controls</h3>
              <div className="section-2col" style={{ marginTop: 4 }}>
                <ToggleCard
                  title="Mockups"
                  desc="Use body photo for try-ons"
                  on={privacy.mockups}
                  onClick={() => setPrivacy({ ...privacy, mockups: !privacy.mockups })}
                />
                <ToggleCard
                  title="Local storage"
                  desc="Images stay on your server"
                  on={privacy.local}
                  onClick={() => setPrivacy({ ...privacy, local: !privacy.local })}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function PinterestIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

function ToggleCard({ title, desc, on, onClick }: { title: string; desc: string; on: boolean; onClick: () => void }) {
  return (
    <div className="toggle-card">
      <div className="info">
        <div className="name">{title}</div>
        <div className="desc">{desc}</div>
      </div>
      <button className={`toggle${on ? " on" : ""}`} type="button" onClick={onClick} aria-label={title} />
    </div>
  );
}
