/* WearLogView — log today's outfit + browse history */
/* eslint-disable */

function WearLogView({ wearLog, removeEntry, logToday, wardrobe }) {
  const [picked, setPicked] = React.useState(['w1','w2','w3']);
  const [note, setNote] = React.useState('Dinner, felt great');

  const togglePick = (id) => {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleLog = () => {
    if (picked.length === 0) return;
    logToday({
      title: titleFromPieces(picked),
      when: 'Just now',
      src: 'manual',
      occasion: 'logged',
      items: picked,
      mood: 'loved',
      note,
    });
    setPicked([]);
    setNote('');
  };

  const rotation = Math.min(100, Math.round((wearLog.length / 5) * 72));

  return (
    <div data-screen-label="Wear log" className="main">
      <div className="head">
        <div>
          <h1>Wear log</h1>
          <p>A clean history that helps the adviser avoid repeats and learn what you actually wear.</p>
        </div>
      </div>

      <div className="scroll" style={{ paddingBottom: 24 }}>
        <div className="log-grid">
          <div className="log-panel">
            <h3>Log today</h3>
            <div className="sub">Select pieces or accept a suggestion.</div>

            <div style={{ flex: 1, overflowY: 'auto', marginRight: -10, paddingRight: 10 }}>
              {wardrobe.map(w => {
                const on = picked.includes(w.id);
                return (
                  <div
                    key={w.id}
                    onClick={() => togglePick(w.id)}
                    className="log-row"
                    style={ on ? {} : {
                      background:'#0f171e',
                      color:'var(--text-4)',
                      border:'1px solid var(--stroke-2)',
                      fontWeight:500,
                    }}
                  >
                    <span>{w.name}</span>
                    <span className="x">{on ? '✓' : '+'}</span>
                  </div>
                );
              })}
            </div>

            <textarea
              className="note-area"
              placeholder="How did it feel?"
              value={note}
              onChange={e => setNote(e.target.value)}
            />

            <button
              className="btn btn-primary"
              style={{ width:'100%', height: 48 }}
              onClick={handleLog}
              disabled={picked.length === 0}
            >
              Log outfit ({picked.length} {picked.length === 1 ? 'piece' : 'pieces'})
            </button>

            <div style={{ marginTop: 26 }}>
              <div className="health-label">Rotation health</div>
              <div className="health-bar"><div style={{ width: `${rotation}%` }}></div></div>
              <div className="health-text">{rotation} percent of wardrobe used this month</div>
            </div>
          </div>

          <div className="history">
            <h3>Recent history</h3>
            {wearLog.length === 0 && (
              <div className="empty-state">No outfits logged yet. Pick pieces on the left to start.</div>
            )}
            {wearLog.map(e => (
              <div key={e.id} className="entry">
                <div className="swatch"></div>
                <div className="body">
                  <div className="ttl">{e.title}</div>
                  <div className="meta">{e.when} · {e.src} · {e.occasion}</div>
                </div>
                <span className="pcs">{e.items.length} pcs</span>
                <span className={`mood ${e.mood}`}>{moodLabel(e.mood)}</span>
                <button className="rm" onClick={() => removeEntry(e.id)}>Remove</button>
              </div>
            ))}

            <div className="insight">
              <div className="glyph">i</div>
              <div>
                <div className="ttl">Adviser insight</div>
                <div className="body">
                  You repeat charcoal bottoms often. Add one lighter trouser to unlock more warm-weather looks.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function moodLabel(m) {
  return ({ loved:'Loved', warm:'Warm', comfy:'Comfy', cool:'Cool' })[m] || m;
}
function titleFromPieces(picked) {
  if (picked.length <= 2) return 'Quick look';
  if (picked.length === 3) return 'Three-piece edit';
  if (picked.length === 4) return 'Layered combination';
  return 'Full outfit';
}

window.WearLogView = WearLogView;
