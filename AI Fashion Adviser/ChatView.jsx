/* ChatView — Even fashion adviser chat */
/* eslint-disable */

const { useState, useRef, useEffect } = React;

function ChatView({ wardrobeCount, onWearThis, navigate }) {
  const [messages, setMessages] = useState([
    {
      role: 'user',
      text: 'What should I wear to a casual dinner tonight?',
    },
    {
      role: 'bot',
      text: 'I would keep it relaxed but intentional: clean knitwear, tailored trousers, and one warm accent. I avoided anything you wore this week.',
      lead: 'Start with polished ease.',
      suggestion: pickSuggestion('casual dinner'),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, busy]);

  const send = async (txt) => {
    const text = (txt ?? draft).trim();
    if (!text || busy) return;
    setMessages(m => [...m, { role:'user', text }]);
    setDraft('');
    setBusy(true);

    // Simulate adviser response
    await new Promise(r => setTimeout(r, 900));
    const sugg = pickSuggestion(text);
    const lead = leadFor(sugg);
    const reply = replyFor(sugg, text);
    setMessages(m => [...m, {
      role:'bot',
      text: reply,
      lead,
      suggestion: sugg,
    }]);
    setBusy(false);
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div data-screen-label="Chat" className="main">
      <div className="head">
        <div>
          <h1>Personal adviser</h1>
          <p>Ask for an occasion. Get outfits from your actual wardrobe.</p>
        </div>
        <div className="right">
          <button className="pill" onClick={() => navigate('wardrobe')}>
            <span className="dot"></span>
            <span>{wardrobeCount} wardrobe items indexed</span>
          </button>
        </div>
      </div>

      <div className="chat-wrap">
        <div className="chat-stream" ref={streamRef}>
          {messages.map((m, i) => (
            <ChatMessage key={i} msg={m} onWearThis={onWearThis} />
          ))}
          {busy && (
            <div className="msg bot">
              <div className="bubble" style={{ display:'inline-block' }}>
                <div className="typing"><span></span><span></span><span></span></div>
              </div>
              <div className="role">Adviser is thinking…</div>
            </div>
          )}
        </div>

        <div className="prompts">
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => send(p)} disabled={busy}>{p}</button>
          ))}
        </div>

        <div className="composer">
          <input
            type="text"
            placeholder="Ask your fashion adviser..."
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={onKey}
            disabled={busy}
          />
          <button className="send" onClick={() => send()} disabled={busy || !draft.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, onWearThis }) {
  if (msg.role === 'user') {
    return (
      <div className="msg user">
        <div className="bubble"><p>{msg.text}</p></div>
        <div className="role">You</div>
      </div>
    );
  }
  return (
    <div className="msg bot">
      <div className="bubble">
        {msg.lead && <div className="lead">{msg.lead}</div>}
        <p>{msg.text}</p>
      </div>
      {msg.suggestion && (
        <div style={{ marginTop: 18 }}>
          <OutfitSuggestionCard sugg={msg.suggestion} onWearThis={onWearThis} />
        </div>
      )}
    </div>
  );
}

function OutfitSuggestionCard({ sugg, onWearThis }) {
  const [swapped, setSwapped] = useState(false);
  const palette = swapped
    ? { ...sugg.palette, shoe: '#5b3a25' } // swap to derby
    : sugg.palette;

  return (
    <div className="outfit-card">
      <div className="outfit-mannequin">
        <Mannequin top={palette.top} bottom={palette.bottom} shoe={palette.shoe} />
      </div>
      <div className="outfit-body">
        <div className="kicker">{sugg.kicker}</div>
        <h3>{sugg.headline}</h3>
        <p className="desc">{sugg.desc}</p>
        <div className="outfit-actions">
          <button className="btn btn-primary" onClick={() => onWearThis(sugg)}>Wear this</button>
          <button className="btn btn-secondary" onClick={() => setSwapped(s => !s)}>
            {swapped ? 'Undo swap' : 'Swap shoes'}
          </button>
        </div>
      </div>
      <div className="why">
        <div className="head-mini">WHY IT WORKS</div>
        <ul>
          {sugg.why.map(w => <li key={w}>{w}</li>)}
        </ul>
      </div>
    </div>
  );
}

function leadFor(sugg) {
  const map = {
    'Quiet dinner polish':'Start with polished ease.',
    'Composed weekday':'Read serious, stay comfortable.',
    'Travel uniform':'Long hours, easy lines.',
    'Easy intentional':'Warmer, a little more on purpose.',
    'Weekend baseline':'Nothing precious, all you.',
  };
  return map[sugg.title] ?? 'Here is what I would do.';
}
function replyFor(sugg, prompt) {
  return `Based on your wardrobe and what you wore this week, I'd build it around the ${sugg.headline.toLowerCase()}. ${sugg.desc}`;
}

window.ChatView = ChatView;
