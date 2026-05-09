/* Shared data + helpers for Även */
/* eslint-disable */

const WARDROBE = [
  { id:'w1', name:'Ivory ribbed knit',  cat:'tops',       sub:'smart casual', colors:['#e8ddca','#4bd8b8'], svg:'knit-ivory' },
  { id:'w2', name:'Charcoal trousers',  cat:'bottoms',    sub:'formal',       colors:['#505963','#d5ac64'], svg:'trouser-charcoal' },
  { id:'w3', name:'Tan suede loafers',  cat:'shoes',      sub:'smart casual', colors:['#d5ac64','#5bd2bb'], svg:'loafer-tan' },
  { id:'w4', name:'Ink chore jacket',   cat:'outerwear',  sub:'casual',       colors:['#4e748b','#e0ba72'], svg:'jacket-ink' },
  { id:'w5', name:'Black leather belt', cat:'accessories',sub:'formal',       colors:['#1e2022','#d5ac64'], svg:'belt-black' },
  { id:'w6', name:'White oxford shirt', cat:'tops',       sub:'formal',       colors:['#f3eee8','#26313b'], svg:'shirt-oxford' },
  { id:'w7', name:'Olive cargo pants',  cat:'bottoms',    sub:'casual',       colors:['#5e6a45','#d5ac64'], svg:'cargo-olive' },
  { id:'w8', name:'White sneakers',     cat:'shoes',      sub:'casual',       colors:['#ece7dc','#a3a8af'], svg:'sneaker-white' },
  { id:'w9', name:'Navy crewneck',      cat:'tops',       sub:'casual',       colors:['#27384c','#e8ddca'], svg:'knit-navy' },
  { id:'w10',name:'Beige chinos',       cat:'bottoms',    sub:'smart casual', colors:['#bda57b','#4bd8b8'], svg:'trouser-beige' },
  { id:'w11',name:'Heather grey tee',   cat:'tops',       sub:'casual',       colors:['#9aa0a6','#26313b'], svg:'tee-grey' },
  { id:'w12',name:'Brown derby shoes',  cat:'shoes',      sub:'formal',       colors:['#5b3a25','#d5ac64'], svg:'derby-brown' },
];

const INITIAL_LOG = [
  { id:'L1', title:'Quiet dinner polish', when:'Today',    src:'suggestion', occasion:'dinner', items:['w1','w2','w3'], mood:'loved' },
  { id:'L2', title:'Work meeting layers', when:'Yesterday',src:'manual',     occasion:'work',    items:['w6','w2','w12','w5'], mood:'warm' },
  { id:'L3', title:'Travel uniform',      when:'May 6',    src:'manual',     occasion:'travel',  items:['w9','w10','w8','w4','w11'], mood:'comfy' },
];

const QUICK_PROMPTS = [
  'What should I wear to a casual dinner tonight?',
  'I need a work-appropriate look for a 22°C day.',
  'Suggest something for travel — comfy but put-together.',
  'A first-date outfit, not too dressed up.',
];

/* Tiny inline-SVG renderer for wardrobe item thumbnails */
function ItemGraphic({ kind, size = 184 }) {
  const wrap = (bg, content) => (
    <svg viewBox="0 0 200 200" className="mann-svg" style={{ background: bg, borderRadius: 18 }}>
      {content}
    </svg>
  );
  switch (kind) {
    case 'knit-ivory':
      return wrap('#ddd5c8', <rect x="40" y="32" width="120" height="140" rx="40" fill="#f3eee3"/>);
    case 'knit-navy':
      return wrap('#1f2a36', <rect x="40" y="32" width="120" height="140" rx="40" fill="#27384c"/>);
    case 'shirt-oxford':
      return wrap('#dfe2e6', <g><rect x="40" y="32" width="120" height="140" rx="32" fill="#f3eee8"/><rect x="94" y="32" width="12" height="140" fill="#dfdcd4"/></g>);
    case 'tee-grey':
      return wrap('#7c828a', <rect x="40" y="40" width="120" height="124" rx="28" fill="#9aa0a6"/>);
    case 'trouser-charcoal':
      return wrap('#292f36', <g><rect x="68" y="42" width="38" height="138" rx="14" fill="#2f3439"/><rect x="116" y="42" width="38" height="138" rx="14" fill="#24292f"/></g>);
    case 'trouser-beige':
      return wrap('#a89674', <g><rect x="68" y="42" width="38" height="138" rx="14" fill="#bda57b"/><rect x="116" y="42" width="38" height="138" rx="14" fill="#a89674"/></g>);
    case 'cargo-olive':
      return wrap('#4a5436', <g><rect x="68" y="42" width="38" height="138" rx="14" fill="#5e6a45"/><rect x="116" y="42" width="38" height="138" rx="14" fill="#525e3c"/><rect x="74" y="100" width="22" height="20" rx="3" fill="#3d4530"/><rect x="124" y="100" width="22" height="20" rx="3" fill="#3d4530"/></g>);
    case 'loafer-tan':
      return wrap('#d0a45e', <g><ellipse cx="100" cy="112" rx="64" ry="26" fill="#6b4b2a"/><ellipse cx="122" cy="128" rx="58" ry="22" fill="#8b6334"/></g>);
    case 'sneaker-white':
      return wrap('#ece7dc', <g><ellipse cx="100" cy="120" rx="68" ry="22" fill="#fff"/><rect x="40" y="116" width="120" height="14" rx="6" fill="#cfcabe"/></g>);
    case 'derby-brown':
      return wrap('#5b3a25', <g><ellipse cx="100" cy="120" rx="64" ry="22" fill="#7a4f31"/><path d="M50 120 q50 -34 100 0" stroke="#3a2515" strokeWidth="3" fill="none"/></g>);
    case 'jacket-ink':
      return wrap('#536674', <g><rect x="55" y="42" width="110" height="132" rx="32" fill="#294052"/><rect x="98" y="42" width="4" height="132" fill="#1c2a36"/></g>);
    case 'belt-black':
      return wrap('#e8e0d0', <g><circle cx="100" cy="100" r="54" fill="none" stroke="#191919" strokeWidth="14"/><rect x="92" y="60" width="16" height="14" fill="#d5ac64"/></g>);
    default:
      return wrap('#2a3742', null);
  }
}

/* Mannequin */
function Mannequin({ top='#f3eee8', bottom='#252a30', shoe='#9d6b39', skin='#87684e', big=false }) {
  const w = big ? 1 : 1;
  return (
    <svg viewBox="0 0 200 280" className="mann-svg" style={{ width:'100%', height:'100%' }}>
      <ellipse cx="100" cy="46" rx="28" ry="32" fill={skin}/>
      <rect x="70" y="80" width="60" height="100" rx="22" fill={top}/>
      <rect x="58" y="170" width="34" height="86" rx="14" fill={bottom}/>
      <rect x="108" y="170" width="34" height="86" rx="14" fill={bottom}/>
      <rect x="56" y="252" width="40" height="14" rx="7" fill={shoe}/>
      <rect x="106" y="252" width="40" height="14" rx="7" fill={shoe}/>
    </svg>
  );
}

/* Outfit metadata for chat suggestions */
const SUGGESTION_TEMPLATES = [
  {
    occasion: ['dinner','date','restaurant','casual dinner'],
    title:'Quiet dinner polish',
    kicker:'OUTFIT 1',
    headline:'Ivory knit, charcoal trouser, tan loafer',
    desc:'Soft contrast, dinner-appropriate, and still casual enough for a relaxed room. The tan shoe warms up the monochrome base without getting loud.',
    pieces:['w1','w2','w3'],
    confidence: 87,
    why: ['Balanced contrast', 'No recently worn pieces', 'Lightweight enough for evening'],
    palette: { top:'#f3eee8', bottom:'#252a30', shoe:'#9d6b39' },
  },
  {
    occasion:['work','meeting','office'],
    title:'Composed weekday',
    kicker:'OUTFIT 1',
    headline:'Oxford shirt, charcoal trouser, brown derby',
    desc:'Crisp up top, dark below, polished at the floor. Reads serious without feeling like a uniform.',
    pieces:['w6','w2','w12','w5'],
    confidence: 91,
    why:['Reads professional', 'Comfortable seated', 'Pairs with a layer if it cools'],
    palette: { top:'#f3eee8', bottom:'#252a30', shoe:'#5b3a25' },
  },
  {
    occasion:['travel','flight','airport','plane'],
    title:'Travel uniform',
    kicker:'OUTFIT 1',
    headline:'Navy crew, beige chinos, white sneaker',
    desc:'Soft layers that wear long hours and still photograph fine on arrival. The chore jacket adds warmth without weight.',
    pieces:['w9','w10','w8','w4'],
    confidence: 84,
    why:['Comfort over hours', 'Wrinkle-tolerant', 'Layer up or down easily'],
    palette: { top:'#27384c', bottom:'#bda57b', shoe:'#ece7dc' },
  },
  {
    occasion:['date','first date','drinks'],
    title:'Easy intentional',
    kicker:'OUTFIT 1',
    headline:'Navy crew, beige chinos, brown derby',
    desc:'Warmer, slightly more put-together than weekend wear. Reads like you tried, but not too hard.',
    pieces:['w9','w10','w12'],
    confidence: 88,
    why:['Warm color story', 'No repeats this week', 'Easy to walk in'],
    palette: { top:'#27384c', bottom:'#bda57b', shoe:'#5b3a25' },
  },
  {
    occasion:['casual','weekend','coffee','default'],
    title:'Weekend baseline',
    kicker:'OUTFIT 1',
    headline:'Heather tee, olive cargo, white sneaker',
    desc:'Nothing precious. Quietly textured neutrals you can move in all day.',
    pieces:['w11','w7','w8'],
    confidence: 79,
    why:['Easy to move', 'Survives spills', 'Pairs with the chore jacket'],
    palette: { top:'#9aa0a6', bottom:'#5e6a45', shoe:'#ece7dc' },
  },
];

function pickSuggestion(prompt) {
  const p = (prompt || '').toLowerCase();
  for (const t of SUGGESTION_TEMPLATES) {
    if (t.occasion.some(o => p.includes(o))) return t;
  }
  return SUGGESTION_TEMPLATES[SUGGESTION_TEMPLATES.length - 1]; // default casual
}

function itemById(id) {
  return WARDROBE.find(w => w.id === id);
}

Object.assign(window, {
  WARDROBE, INITIAL_LOG, QUICK_PROMPTS,
  ItemGraphic, Mannequin,
  SUGGESTION_TEMPLATES, pickSuggestion, itemById
});
