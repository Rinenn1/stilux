/* App — Even shell, navigation, shared state */
/* eslint-disable */

const { useState: useStateApp, useEffect: useEffectApp } = React;

function Sidebar({ view, setView }) {
  const items = [
    { key:'chat',     label:'Chat',     icon: <ChatIcon />, badge: 'New' },
    { key:'wardrobe', label:'Wardrobe', icon: <HangerIcon /> },
    { key:'wearlog',  label:'Wear Log', icon: <CalIcon /> },
    { key:'profile',  label:'Profile',  icon: <UserIcon /> },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">Ä</div>
        <div className="brand-name">Av<em>ё</em>n</div>
      </div>
      <div className="nav-label">STYLE OS</div>
      <nav className="nav">
        {items.map(it => (
          <button
            key={it.key}
            className={'nav-item' + (view === it.key ? ' active' : '')}
            onClick={() => setView(it.key)}
          >
            <span className="ico">{it.icon}</span>
            <span>{it.label}</span>
            {it.badge && view !== it.key && <span className="badge">{it.badge}</span>}
          </button>
        ))}
      </nav>
      <div className="tonight-card">
        <div className="label">● Tonight</div>
        <div className="body">Dinner, 22°C, dry</div>
        <div className="meta">3 looks ready</div>
      </div>
    </aside>
  );
}

/* Tiny line icons */
function ChatIcon() { return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);}
function HangerIcon() { return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8 V12"/><circle cx="12" cy="6" r="2"/><path d="M12 12 L3 18 L21 18 L12 12"/></svg>
);}
function CalIcon() { return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10 H21 M8 3 V7 M16 3 V7"/></svg>
);}
function UserIcon() { return (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21 a8 8 0 0 1 16 0"/></svg>
);}

function App() {
  const [view, setView] = useStateApp('chat');
  const [wardrobe, setWardrobe] = useStateApp(WARDROBE);
  const [wearLog, setWearLog] = useStateApp(INITIAL_LOG);
  const [previewSugg, setPreviewSugg] = useStateApp(null);
  const [toast, setToast] = useStateApp(null);
  const [prefs, setPrefs] = useStateApp({
    styles: ['Minimal','Neutral'],
    colors: ['#f3eee3','#22272d'],
    fit: { shoulders: 72, waist: 86 },
    privacy: { mockups: true, local: true },
  });

  const navigate = (v) => setView(v);

  const onWearThis = (sugg) => setPreviewSugg(sugg);

  const logSuggestion = (sugg) => {
    const entry = {
      id: 'L' + Date.now(),
      title: sugg.title,
      when: 'Just now',
      src: 'suggestion',
      occasion: sugg.occasion[0] || 'logged',
      items: sugg.pieces,
      mood: 'loved',
    };
    setWearLog(prev => [entry, ...prev]);
    setPreviewSugg(null);
    setToast(`Logged: ${sugg.title}`);
    setView('wearlog');
  };

  const logToday = (entry) => {
    const e = { id: 'L' + Date.now(), ...entry };
    setWearLog(prev => [e, ...prev]);
    setToast(`Logged ${entry.items.length} pieces`);
  };

  const removeEntry = (id) => {
    setWearLog(prev => prev.filter(e => e.id !== id));
    setToast('Entry removed');
  };

  const addItem = () => {
    const palette = [
      { svg:'tee-grey',     name:'Stone marl tee',  cat:'tops',    sub:'casual',       colors:['#9aa0a6','#4bd8b8'] },
      { svg:'trouser-beige',name:'Sand chino',      cat:'bottoms', sub:'smart casual', colors:['#bda57b','#4bd8b8'] },
      { svg:'sneaker-white',name:'Court sneaker',   cat:'shoes',   sub:'casual',       colors:['#ece7dc','#26313b'] },
      { svg:'jacket-ink',   name:'Navy overshirt',  cat:'outerwear',sub:'casual',      colors:['#27384c','#e0ba72'] },
    ];
    const choice = palette[Math.floor(Math.random() * palette.length)];
    const id = 'wn' + Date.now();
    setWardrobe(prev => [{ id, ...choice }, ...prev]);
    setToast(`Added ${choice.name}`);
  };

  useEffectApp(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="app">
      <div className="app-frame">
        <Sidebar view={view} setView={setView} />
        {view === 'chat'     && <ChatView wardrobeCount={wardrobe.length} onWearThis={onWearThis} navigate={navigate} />}
        {view === 'wardrobe' && <WardrobeView wardrobe={wardrobe} addItem={addItem} />}
        {view === 'wearlog'  && <WearLogView wearLog={wearLog} removeEntry={removeEntry} logToday={logToday} wardrobe={wardrobe} />}
        {view === 'profile'  && <ProfileView prefs={prefs} setPrefs={setPrefs} />}
      </div>

      {previewSugg && (
        <OutfitModal
          sugg={previewSugg}
          onClose={() => setPreviewSugg(null)}
          onLog={logSuggestion}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
