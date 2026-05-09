/* ProfileView — fit base + preferences */
/* eslint-disable */

function ProfileView({ prefs, setPrefs }) {
  const STYLES = ['Minimal','Smart casual','Classic','Streetwear','Neutral','Workwear'];
  const COLORS = [
    { hex:'#f3eee3', name:'Ivory' },
    { hex:'#22272d', name:'Black' },
    { hex:'#537182', name:'Slate' },
    { hex:'#b78a4e', name:'Tan' },
  ];

  const toggleStyle = (s) => {
    const next = prefs.styles.includes(s)
      ? prefs.styles.filter(x => x !== s)
      : [...prefs.styles, s];
    setPrefs({ ...prefs, styles: next });
  };
  const toggleColor = (c) => {
    const next = prefs.colors.includes(c)
      ? prefs.colors.filter(x => x !== c)
      : [...prefs.colors, c];
    setPrefs({ ...prefs, colors: next });
  };
  const togglePrivacy = (k) => setPrefs({ ...prefs, privacy: { ...prefs.privacy, [k]: !prefs.privacy[k] } });
  const setFit = (k, v) => setPrefs({ ...prefs, fit: { ...prefs.fit, [k]: v } });

  return (
    <div data-screen-label="Profile" className="main">
      <div className="head">
        <div>
          <h1>Profile and fit base</h1>
          <p>A clearer, more private setup for body photo and style preferences.</p>
        </div>
      </div>

      <div className="scroll">
        <div className="profile-grid">
          <div className="body-card">
            <div className="body-photo">
              <div className="figure">
                <Mannequin top="#263744" bottom="#2e3338" shoe="#1d2227" />
              </div>
              <div className="label">USED ONLY FOR MOCKUPS</div>
            </div>
            <div className="row">
              <div>
                <div className="ttl">Body photo ready</div>
                <div className="sub">Used only for outfit mockups</div>
              </div>
              <button className="btn btn-secondary btn-sm">Replace</button>
            </div>
          </div>

          <div className="profile-right">
            <div className="section">
              <h3>Style preferences</h3>
              <div className="sub">These steer suggestions before the model starts guessing.</div>
              <div>
                {STYLES.map(s => (
                  <span
                    key={s}
                    className={'style-tag' + (prefs.styles.includes(s) ? ' active' : '')}
                    onClick={() => toggleStyle(s)}
                  >{s}</span>
                ))}
              </div>
            </div>

            <div className="section-2col">
              <div className="subsection">
                <h4>Fit notes</h4>
                <div className="fit-row">Prefers relaxed shoulders</div>
                <div className="fit-bar"><div style={{ width: `${prefs.fit.shoulders}%` }}></div></div>
                <input
                  type="range" min="0" max="100" value={prefs.fit.shoulders}
                  onChange={e => setFit('shoulders', +e.target.value)}
                  style={{ width:'100%', marginTop: 6, accentColor:'#4bd8b8' }}
                />
                <div className="fit-row" style={{ marginTop: 12 }}>Avoids tight waistbands</div>
                <div className="fit-bar"><div style={{ width: `${prefs.fit.waist}%` }}></div></div>
                <input
                  type="range" min="0" max="100" value={prefs.fit.waist}
                  onChange={e => setFit('waist', +e.target.value)}
                  style={{ width:'100%', marginTop: 6, accentColor:'#4bd8b8' }}
                />
              </div>

              <div className="subsection">
                <h4>Color comfort</h4>
                <div className="swatches-row">
                  {COLORS.map(c => (
                    <div
                      key={c.hex}
                      className={'swatch-circle' + (prefs.colors.includes(c.hex) ? ' active' : '')}
                      style={{ background: c.hex }}
                      title={c.name}
                      onClick={() => toggleColor(c.hex)}
                    />
                  ))}
                </div>
                <div className="health-text" style={{ marginTop: 14 }}>
                  High confidence palette from wardrobe
                </div>
              </div>
            </div>

            <div className="section">
              <h3>Privacy controls</h3>
              <div className="sub">You stay in control of how images are used.</div>
              <div className="section-2col" style={{ marginTop: 4 }}>
                <div className="toggle-card">
                  <div className="info">
                    <div className="name">Mockups</div>
                    <div className="desc">Use body photo for try-ons</div>
                  </div>
                  <div
                    className={'toggle' + (prefs.privacy.mockups ? ' on' : '')}
                    onClick={() => togglePrivacy('mockups')}
                  ></div>
                </div>
                <div className="toggle-card">
                  <div className="info">
                    <div className="name">Local storage</div>
                    <div className="desc">Images stay on your server</div>
                  </div>
                  <div
                    className={'toggle' + (prefs.privacy.local ? ' on' : '')}
                    onClick={() => togglePrivacy('local')}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ProfileView = ProfileView;
