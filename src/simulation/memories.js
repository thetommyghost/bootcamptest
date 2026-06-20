/**
 * KAWADER · Memory of Places
 *
 * A narrative-driven memory system for the bootcamp simulation.
 * Each zone can hold a "Memory Card" — an image, a quote, a short
 * story, and a participant contribution — revealed on first visit.
 *
 * Design philosophy (from spec):
 *   "This place has a story… and I am now part of it."
 *   NOT: "You unlocked a reward."
 *
 * State: undiscovered → discovered (memory shown) → completed
 * Persisted in localStorage under 'kawader_memories_v1'.
 */

;(function(){
'use strict';

/* Storage key */
var STORAGE_KEY = 'kawader_memories_v1';

/* ---------- memory data ----------
   At least 3 zones with rich, cinematic memories. */
var MEMORIES = {
  /* ===== ROOFTOP ===== */
  z05_roof: {
    zoneTitle: 'Rooftop · السطّح',
    image: '../../assets/photos/thumb/IMG_4958.jpg',
    quote: 'The roof doesn\'t just look at Birzeit — it listens to it.',
    story: 'On the third evening, the cohort gathered on the rooftop as the call to prayer drifted across the valley. Someone had brought tea. Someone else, an oud. For twenty minutes, nobody spoke — they just watched the sun paint the stone mountain in amber, then violet, then nothing at all.',
    contribution: '"I didn\'t realize how quiet the world could be until I heard it from up here. The wind, the distant traffic, someone laughing in the courtyard below. It felt like the whole town was breathing." — Sara, participant'
  },

  /* ===== GRAND PIANO HALL ===== */
  z06_music_hall_grand_piano: {
    zoneTitle: 'Grand Piano Studio',
    image: '../../assets/photos/thumb/IMG_4976.jpg',
    quote: 'Some keys were never meant to leave this room.',
    story: 'The piano had been in that hall since 2004. It had seen hundreds of hands — tentative, confident, trembling, joyful. On the second day of bootcamp, a participant who had never played before sat down and, with one finger, picked out a melody their grandmother used to sing. The room listened.',
    contribution: '"I pressed middle C and it sounded exactly like the morning of my first recital. Same weight. Same wood smell. Same fear. Same joy." — Kamal, participant'
  },

  /* ===== COURTYARD & GARDEN ===== */
  z11_outdoor_courtyard_garden: {
    zoneTitle: 'Courtyard & Garden',
    image: '../../assets/photos/thumb/IMG_4948.jpg',
    quote: 'Every revolution starts in a courtyard.',
    story: 'Between workshops, the courtyard was the lung of the camp. People sat on stone ledges, shared earphones, sketched on scrap paper, argued about scenes and scores and whether the olive tree in the corner was older than the building. It was. By a lot.',
    contribution: '"I found a stray cat sleeping on a stack of scripts. Nobody moved it. We just worked around it for three days like it was a producer." — Leila, participant'
  }
};

/* ---------- state helpers ---------- */
function loadState(){
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e){}
  return {};
}

function saveState(st){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); } catch(e){}
}

/* ---------- public API ---------- */

var memoryVisible = false;  // guard against multiple simultaneous cards

var API = {
  /** Return memory data for a zone, or null. */
  getMemory: function(zoneId){
    return MEMORIES[zoneId] || null;
  },

  /** Return state string: 'undiscovered' | 'discovered' | 'completed'. */
  getState: function(zoneId){
    if (!MEMORIES[zoneId]) return null;
    var st = loadState();
    var s = st[zoneId];
    if (!s) return 'undiscovered';
    if (s === 'completed') return 'completed';
    return 'discovered';
  },

  /** Mark a memory as discovered (shown once). */
  markDiscovered: function(zoneId){
    if (!MEMORIES[zoneId]) return;
    var st = loadState();
    if (!st[zoneId]) st[zoneId] = 'discovered';
    saveState(st);
  },

  /** Mark a memory as permanently accessible. */
  markCompleted: function(zoneId){
    if (!MEMORIES[zoneId]) return;
    var st = loadState();
    st[zoneId] = 'completed';
    saveState(st);
  },

  /** Return all zone states as { zoneId: 'undiscovered'|... }. */
  getAllStates: function(){
    var st = loadState();
    var out = {};
    for (var id in MEMORIES){
      if (MEMORIES.hasOwnProperty(id)){
        out[id] = st[id] || 'undiscovered';
      }
    }
    return out;
  },

  /**
   * If the zone has a memory and it hasn't been unlocked yet,
   * mark it discovered and show the memory card after `delay` ms.
   * Only fires on first unlock.
   */
  showMemory: function(zoneId, delay){
    delay = delay || 1000;
    var mem = MEMORIES[zoneId];
    if (!mem) return;

    var st = loadState();
    if (st[zoneId]) return;  // already unlocked

    // Mark discovered immediately
    st[zoneId] = 'discovered';
    saveState(st);

    // Show card after delay
    setTimeout(function(){
      API._showCard(zoneId, mem);
    }, delay);
  },

  /** Internal: build and animate the memory card into the DOM. */
  _showCard: function(zoneId, mem){
    if (memoryVisible) return;
    memoryVisible = true;

    /* Build elements */
    var overlay = document.createElement('div');
    overlay.id = 'km-overlay';

    var card = document.createElement('div');
    card.id = 'km-card';

    card.innerHTML =
      '<div class="km-header">' +
        '<div class="km-badge">✦ MEMORY UNLOCKED</div>' +
        '<button class="km-close" id="km-close-btn" aria-label="Close memory">✕</button>' +
      '</div>' +
      '<div class="km-image-wrap">' +
        '<img class="km-image" src="' + API._escapeAttr(mem.image) + '" alt="" loading="lazy" />' +
      '</div>' +
      '<div class="km-content">' +
        '<div class="km-zone">' + API._escapeHtml(mem.zoneTitle) + '</div>' +
        '<div class="km-quote">' + API._escapeHtml(mem.quote) + '</div>' +
        '<div class="km-story">' + API._escapeHtml(mem.story) + '</div>' +
        '<div class="km-contribution">' + API._escapeHtml(mem.contribution) + '</div>' +
      '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    /* Animate in with staggered delays (respects prefers-reduced-motion) */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var baseDelay = reduceMotion ? 0 : 50;

    requestAnimationFrame(function(){
      overlay.classList.add('km-visible');

      var img = card.querySelector('.km-image');
      var quote = card.querySelector('.km-quote');
      var story = card.querySelector('.km-story');
      var contrib = card.querySelector('.km-contribution');
      var badge = card.querySelector('.km-badge');

      setTimeout(function(){ img.classList.add('km-visible'); }, baseDelay + 200);
      setTimeout(function(){ quote.classList.add('km-visible'); }, baseDelay + 600);
      setTimeout(function(){ story.classList.add('km-visible'); }, baseDelay + 1000);
      setTimeout(function(){ contrib.classList.add('km-visible'); }, baseDelay + 1400);
      setTimeout(function(){ badge.classList.add('km-visible'); }, baseDelay + 1800);
    });

    /* Close handlers */
    var closeBtn = document.getElementById('km-close-btn');
    function closeMemory(){
      if (!memoryVisible) return;
      memoryVisible = false;
      overlay.classList.remove('km-visible');
      overlay.classList.add('km-fading');
      setTimeout(function(){
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        API.markCompleted(zoneId);
      }, 300);
    }

    if (closeBtn) closeBtn.onclick = closeMemory;
    overlay.addEventListener('click', function(e){
      if (e.target === overlay) closeMemory();
    });
    document.addEventListener('keydown', function _onKey(e){
      if (e.key === 'Escape') { closeMemory(); document.removeEventListener('keydown', _onKey); }
    });
  },

  _escapeHtml: function(s){
    if (typeof s !== 'string') return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  },

  _escapeAttr: function(s){
    if (typeof s !== 'string') return '';
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
};

window.KawaderMemories = API;

/* ---------- CSS injection ---------- */
var styleEl = document.createElement('style');
styleEl.textContent =
'#km-overlay{' +
  'position:fixed;inset:0;z-index:3000;' +
  'background:rgba(0,0,0,0.65);' +
  'display:flex;align-items:center;justify-content:center;' +
  'opacity:0;transition:opacity 0.3s ease;' +
  'padding:24px;' +
  'backdrop-filter:blur(2px);' +
'}' +
'#km-overlay.km-visible{opacity:1;}' +
'#km-overlay.km-fading{opacity:0;}' +
'' +
'#km-card{' +
  'background:#14181d;border:1px solid #2a313a;border-radius:12px;' +
  'max-width:520px;width:100%;max-height:90vh;overflow-y:auto;' +
  'box-shadow:0 32px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(255,181,71,0.08) inset;' +
  'transform:scale(0.92) translateY(12px);opacity:0;' +
  'transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),opacity 0.35s ease;' +
'}' +
'#km-overlay.km-visible #km-card{transform:none;opacity:1;}' +
'' +
'.km-header{' +
  'display:flex;align-items:center;justify-content:space-between;' +
  'padding:16px 20px 0;' +
'}' +
'.km-badge{' +
  'font-family:var(--font-mono,"JetBrains Mono",monospace);' +
  'font-size:10px;letter-spacing:0.12em;text-transform:uppercase;' +
  'color:#ffb547;opacity:0;transform:translateY(-6px);' +
  'transition:opacity 0.35s ease,transform 0.35s ease;' +
'}' +
'.km-badge.km-visible{opacity:1;transform:none;}' +
'' +
'.km-close{' +
  'background:none;border:none;color:#5a6370;font-size:18px;' +
  'cursor:pointer;padding:4px 8px;border-radius:4px;line-height:1;' +
  'transition:color 0.15s,background 0.15s;' +
'}' +
'.km-close:hover{color:#e6ebf2;background:rgba(255,255,255,0.06);}' +
'' +
'.km-image-wrap{' +
  'margin:16px 20px 0;border-radius:8px;overflow:hidden;' +
  'background:#0b0d10;aspect-ratio:4/3;' +
  'display:flex;align-items:center;justify-content:center;' +
'}' +
'.km-image{' +
  'display:block;width:100%;height:100%;object-fit:cover;' +
  'opacity:0;transition:opacity 0.5s ease;' +
  'will-change:opacity;' +
'}' +
'.km-image.km-visible{opacity:1;}' +
'' +
'.km-content{' +
  'padding:20px;display:flex;flex-direction:column;gap:16px;' +
'}' +
'.km-zone{' +
  'font-family:var(--font-display,"Bebas Neue",sans-serif);' +
  'font-size:14px;letter-spacing:0.06em;color:#8a93a0;' +
  'margin-bottom:-4px;' +
'}' +
'.km-quote{' +
  'font-family:var(--font-body,"Inter Tight",system-ui,sans-serif);' +
  'font-size:18px;font-weight:500;line-height:1.4;' +
  'color:#e6ebf2;font-style:italic;padding-left:16px;' +
  'border-left:2px solid #ffb547;' +
  'opacity:0;transform:translateX(-6px);' +
  'transition:opacity 0.4s ease,transform 0.4s ease;' +
'}' +
'.km-quote.km-visible{opacity:1;transform:none;}' +
'' +
'.km-story{' +
  'font-family:var(--font-body,"Inter Tight",system-ui,sans-serif);' +
  'font-size:14px;line-height:1.6;color:#c8cdd6;' +
  'opacity:0;transition:opacity 0.45s ease;' +
'}' +
'.km-story.km-visible{opacity:1;}' +
'' +
'.km-contribution{' +
  'font-family:var(--font-body,"Inter Tight",system-ui,sans-serif);' +
  'font-size:13px;line-height:1.5;color:#8a93a0;' +
  'padding:12px 16px;background:#0b0d10;border-radius:8px;' +
  'border:1px solid #1c2128;' +
  'opacity:0;transition:opacity 0.45s ease;' +
'}' +
'.km-contribution.km-visible{opacity:1;}' +
'' +
'@media (prefers-reduced-motion: reduce){' +
  '#km-overlay,#km-card,.km-badge,.km-quote,.km-story,.km-contribution,.km-image{' +
    'transition:none!important;transform:none!important;opacity:1!important;' +
  '}' +
  '#km-overlay:not(.km-visible),#km-overlay.km-fading{opacity:0!important;}' +
  '#km-overlay:not(.km-visible) #km-card{opacity:0!important;}' +
'}';

document.head.appendChild(styleEl);

})();
