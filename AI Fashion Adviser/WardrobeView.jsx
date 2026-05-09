/* WardrobeView — grid of items with filters */
/* eslint-disable */

const { useState: useStateW } = React;

function WardrobeView({ wardrobe, addItem }) {
  const [filter, setFilter] = useStateW('all');
  const [selected, setSelected] = useStateW(null);
  const [drag, setDrag] = useStateW(false);

  const filtered = filter === 'all'
    ? wardrobe
    : wardrobe.filter(w => w.cat === filter);

  const counts = wardrobe.reduce((acc, it) => {
    acc.all = (acc.all || 0) + 1;
    acc[it.cat] = (acc[it.cat] || 0) + 1;
    return acc;
  }, {});

  const FILTERS = [
    { key:'all', label:'All items' },
    { key:'tops', label:'Tops' },
    { key:'bottoms', label:'Bottoms' },
    { key:'shoes', label:'Shoes' },
    { key:'outerwear', label:'Outerwear' },
    { key:'accessories', label:'Accessories' },
  ];

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    addItem();
  };

  return (
    <div data-screen-label="Wardrobe" className="main">
      <div className="head">
        <div>
          <h1>Wardrobe</h1>
          <p>Fast scan, smart tags, edit only what needs a human eye.</p>
        </div>
        <div className="right">
          <button className="btn btn-secondary btn-sm">Filter</button>
          <button className="btn btn-primary btn-sm" onClick={addItem}>Upload</button>
        </div>
      </div>

      <div className="scroll">
        <div
          className={'upload-strip' + (drag ? ' drag' : '')}
          onClick={addItem}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
        >
          <div className="plus">+</div>
          <div className="text">
            <h4>Drop new wardrobe photos</h4>
            <p>Bulk upload, auto-crop, AI tags, then quick review.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); addItem(); }}>
            Import from phone
          </button>
        </div>

        <div className="tags-row">
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={'tag' + (filter === f.key ? ' active' : '')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}{counts[f.key] != null ? ` ${counts[f.key]}` : ''}
            </button>
          ))}
        </div>

        <div className="grid">
          {filtered.map(it => (
            <div
              key={it.id}
              className={'item-card' + (selected === it.id ? ' selected' : '')}
              onClick={() => setSelected(s => s === it.id ? null : it.id)}
            >
              <div className="item-thumb">
                <ItemGraphic kind={it.svg} />
              </div>
              <div className="item-meta">
                <div className="name">{it.name}</div>
                <div className="sub">{it.cat} · {it.sub}</div>
                <div className="swatches">
                  {it.colors.map((c, i) => (
                    <span key={i} style={{ background: c }}></span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="footer-strip">
          <span>Review queue: {Math.min(3, wardrobe.length)} items need category confirmation</span>
          <button className="btn btn-secondary btn-sm">Review tags</button>
        </div>
      </div>
    </div>
  );
}

window.WardrobeView = WardrobeView;
