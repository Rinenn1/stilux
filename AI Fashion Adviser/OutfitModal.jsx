/* OutfitModal — outfit preview & log overlay */
/* eslint-disable */

function OutfitModal({ sugg, onClose, onLog }) {
  if (!sugg) return null;
  const pieceItems = sugg.pieces.map(id => itemById(id)).filter(Boolean);
  const palette = sugg.palette;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2>Outfit preview</h2>
            <p>See the recommendation before you commit it to the wear log.</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="preview-figure">
            <div className="canvas">
              <div style={{
                position:'absolute', inset:0,
                display:'flex', alignItems:'center', justifyContent:'center'
              }}>
                <div style={{ width:'58%', height:'82%' }}>
                  <Mannequin top={palette.top} bottom={palette.bottom} shoe={palette.shoe} />
                </div>
              </div>
            </div>
            <div className="footer">
              <span>Generated mockup</span>
              <span>Studio view</span>
            </div>
          </div>
          <div className="preview-side">
            <div className="preview-info">
              <div className="kicker">{sugg.kicker}</div>
              <h3>{sugg.title}</h3>
              <p>{sugg.desc}</p>
            </div>

            <div className="pieces-card">
              <h4>Pieces</h4>
              <div className="pieces-grid">
                {pieceItems.map(p => (
                  <div className="piece" key={p.id}>
                    <div className="pgraphic">
                      <div style={{ width:'100%', height:64 }}>
                        <ItemGraphic kind={p.svg} />
                      </div>
                    </div>
                    <div className="pname">{p.name}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="metrics">
              <div className="metric-card">
                <h4>Confidence</h4>
                <div className="gauge">
                  <div className="ring" style={{ '--p': sugg.confidence }}>
                    <div className="num">{sugg.confidence}</div>
                  </div>
                  <div>
                    <div className="body">Strong match for the occasion</div>
                    <div className="sub2">No repeated items this week</div>
                  </div>
                </div>
              </div>
              <div className="metric-card">
                <h4>Actions</h4>
                <button
                  className="btn btn-primary"
                  style={{ width:'100%', height: 44, marginBottom: 10 }}
                  onClick={() => onLog(sugg)}
                >Log as worn</button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width:'100%' }}
                  onClick={onClose}
                >Regenerate</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.OutfitModal = OutfitModal;
