/* ================================================================
   STUDYVERSE — app.js
   ================================================================
   TABLE OF CONTENTS
   1.  TOOL REGISTRY      — Add / remove tools here. ONE object per tool.
   2.  APP STATE          — Central state object
   3.  APP CONTROLLER     — Core navigation & lifecycle
   4.  CARD RENDERER      — Builds the tool card grid
   5.  MODAL SYSTEM       — Open / close modals
   6.  TOOL: FLASHCARDS   — Full AI-powered flashcard tool
   7.  TOOL: POMODORO     — Countdown timer with rings
   8.  TOOL: DUOLINGO     — Mock stats tracker widget
   9.  THEME & PERSONA    — Toggle dark/light, personas, accent colors
   10. DECKS VIEW         — Lists saved card decks
   11. SETTINGS VIEW      — Color swatches + toggles
   12. TOAST SYSTEM       — Notifications
   13. INIT               — App startup
================================================================ */


/* ================================================================
   1. TOOL REGISTRY
   ─────────────────────────────────────────────────────────────────
   To ADD a new tool:
     1. Copy one object below, paste it at the end of the array.
     2. Give it a unique `id`.
     3. Set `type` to one of: 'builtin' | 'embed' | 'external' | 'widget'
     4. For 'builtin' tools, create a function in the TOOL sections
        below and reference it in `openFn`.
     5. That's it — the card renders automatically.
================================================================ */
const TOOLS = [
  {
    id:          'flashcards',
    title:       'Flashcards',
    description: 'AI-powered cards from your files. Drop a PDF or paste notes.',
    icon:        '🃏',
    iconColor:   'color-blue',
    type:        'builtin',        // opens a modal
    badge:       'Built-in',
    badgeClass:  'badge-builtin',
    openFn:      () => FlashcardTool.open(),
  },
  {
    id:          'pomodoro',
    title:       'Time Budgeter',
    description: 'Pomodoro timer to chunk your study sessions and protect focus.',
    icon:        '⏱',
    iconColor:   'color-orange',
    type:        'builtin',
    badge:       'Built-in',
    badgeClass:  'badge-builtin',
    openFn:      () => PomodoroTool.open(),
  },
  {
    id:          'desmos',
    title:       'Desmos Graphing',
    description: 'Full-featured graphing calculator embedded right in your hub.',
    icon:        '📈',
    iconColor:   'color-green',
    type:        'embed',          // opens in iframe view
    badge:       'Embedded',
    badgeClass:  'badge-embed',
    url:         'https://www.desmos.com/calculator',
  },
  {
    id:          'notebooklm',
    title:       'NotebookLM',
    description: 'Google\'s AI notebook. Deep-links you in without leaving focus.',
    icon:        '🔬',
    iconColor:   'color-purple',
    type:        'external',       // opens in new tab
    badge:       'Deep Link',
    badgeClass:  'badge-external',
    url:         'https://notebooklm.google',
  },
  {
    id:          'duolingo',
    title:       'Duolingo Tracker',
    description: 'Track your streak, XP, and weekly progress — API-ready.',
    icon:        '🦉',
    iconColor:   'color-amber',
    type:        'widget',         // opens a modal with widget UI
    badge:       'Mock API',
    badgeClass:  'badge-api',
    openFn:      () => DuolingoWidget.open(),
  },

  /* ── ADD NEW TOOLS BELOW THIS LINE ─────────────────────────── */

  // ── QUIZLET ─────────────────────────────────────────────────
  {
    id:          'quizlet',
    title:       'Quizlet',
    description: 'Paste any public Quizlet set link to study it right here — no tab switching.',
    icon:        '📇',
    iconColor:   'color-blue',
    type:        'builtin',
    badge:       'Embed',
    badgeClass:  'badge-embed',
    openFn:      () => QuizletTool.open(),
  },

  // ── NOTION ──────────────────────────────────────────────────
  {
    id:          'notion',
    title:       'Notion',
    description: 'Embed any public Notion page — syllabi, notes, databases — right in your hub.',
    icon:        '📝',
    iconColor:   'color-purple',
    type:        'builtin',
    badge:       'Embed',
    badgeClass:  'badge-embed',
    openFn:      () => NotionTool.open(),
  },

  // ── WOLFRAM ALPHA ────────────────────────────────────────────
  {
    id:          'wolfram',
    title:       'WolframAlpha',
    description: 'Step-by-step math, science, and computation. Paste any equation or question.',
    icon:        '🧮',
    iconColor:   'color-amber',
    type:        'builtin',
    badge:       'API',
    badgeClass:  'badge-api',
    openFn:      () => WolframTool.open(),
  },

  // ── GRAMMARLY ────────────────────────────────────────────────
  {
    id:          'grammarly',
    title:       'Grammarly Editor',
    description: 'Write and polish essays with live grammar, tone, and clarity suggestions.',
    icon:        '✍️',
    iconColor:   'color-green',
    type:        'builtin',
    badge:       'SDK',
    badgeClass:  'badge-builtin',
    openFn:      () => GrammarlyTool.open(),
  },

  // ── ZOTERO ───────────────────────────────────────────────────
  {
    id:          'zotero',
    title:       'Zotero Citations',
    description: 'Connect your Zotero library to browse sources and copy MLA/APA citations.',
    icon:        '🎓',
    iconColor:   'color-orange',
    type:        'builtin',
    badge:       'API',
    badgeClass:  'badge-api',
    openFn:      () => ZoteroTool.open(),
  },

  // ── ANKI ─────────────────────────────────────────────────────
  {
    id:          'anki',
    title:       'Anki',
    description: 'Open Anki\'s web interface for spaced-repetition flashcard study.',
    icon:        '🧠',
    iconColor:   'color-pink',
    type:        'external',
    badge:       'External',
    badgeClass:  'badge-external',
    url:         'https://ankiweb.net',
  },

  // ── NOTEBOOKLM ───────────────────────────────────────────────
  {
    id:          'notebooklm',
    title:       'NotebookLM',
    description: 'Google\'s AI notebook — upload PDFs and get auto-generated study guides.',
    icon:        '🔬',
    iconColor:   'color-purple',
    type:        'external',
    badge:       'External',
    badgeClass:  'badge-external',
    url:         'https://notebooklm.google',
  },
];

/* Accent color swatches available in Settings */
const ACCENT_COLORS = [
  { name: 'sky',     hex: '#38bdf8', label: 'Sky Blue'  },
  { name: 'violet',  hex: '#a78bfa', label: 'Violet'    },
  { name: 'emerald', hex: '#34d399', label: 'Emerald'   },
  { name: 'rose',    hex: '#fb7185', label: 'Rose'      },
  { name: 'amber',   hex: '#fbbf24', label: 'Amber'     },
  { name: 'coral',   hex: '#fb923c', label: 'Coral'     },
];

/* Demo flashcard decks loaded on first launch */
const DEMO_DECKS = [
  {
    id: 'biology-101',
    title: 'Biology 101',
    cards: [
      { q: 'What is the powerhouse of the cell?',              a: 'The mitochondria — it produces ATP through cellular respiration.' },
      { q: 'What is the basic unit of life?',                  a: 'The cell. All living organisms are made of one or more cells.' },
      { q: 'What process do plants use to make food?',         a: 'Photosynthesis — converting sunlight + CO₂ + water into glucose.' },
      { q: 'What carries oxygen in red blood cells?',          a: 'Hemoglobin — a protein that binds to oxygen molecules.' },
      { q: 'What is DNA\'s full name?',                        a: 'Deoxyribonucleic acid — the molecule carrying genetic information.' },
    ],
    isPublic: true,
    createdAt: '2025-01-10',
  },
  {
    id: 'algebra-basics',
    title: 'Algebra Basics',
    cards: [
      { q: 'What is the quadratic formula?',                   a: 'x = (-b ± √(b²-4ac)) / 2a — solves ax² + bx + c = 0.' },
      { q: 'What does PEMDAS stand for?',                      a: 'Parentheses, Exponents, Multiplication, Division, Addition, Subtraction.' },
      { q: 'What is a variable?',                              a: 'A symbol (usually a letter) representing an unknown number.' },
      { q: 'What is a coefficient?',                           a: 'The number multiplied by a variable. In 3x, the coefficient is 3.' },
    ],
    isPublic: false,
    createdAt: '2025-01-12',
  },
  {
    id: 'world-history',
    title: 'World History Highlights',
    cards: [
      { q: 'When did World War II end?',                       a: '1945 — with Germany surrendering in May and Japan in September.' },
      { q: 'What year did the Berlin Wall fall?',              a: '1989 — marking the symbolic end of the Cold War.' },
      { q: 'Who wrote the Declaration of Independence?',       a: 'Thomas Jefferson — drafted in 1776.' },
      { q: 'What empire was Cleopatra queen of?',             a: 'Ancient Egypt — she was the last active ruler of the Ptolemaic Kingdom.' },
      { q: 'What caused the Black Death?',                     a: 'The bacterium Yersinia pestis — spread via fleas on rats.' },
    ],
    isPublic: true,
    createdAt: '2025-01-08',
  },
];


/* ================================================================
   2. APP STATE
   Single source of truth for the entire application.
   Everything reads from and writes to this object.
================================================================ */
const State = {
  currentView:    'dashboard',
  currentTheme:   'dark',
  currentPersona: 'default',
  currentAccent:  'sky',
  favorites:      [],              // array of tool IDs
  decks:          [],              // array of deck objects
  searchQuery:    '',

  /* Persist state to localStorage */
  save() {
    try {
      localStorage.setItem('studyverse_state', JSON.stringify({
        theme:    this.currentTheme,
        persona:  this.currentPersona,
        accent:   this.currentAccent,
        favorites: this.favorites,
        decks:    this.decks,
      }));
    } catch(e) { /* localStorage unavailable — graceful fallback */ }
  },

  /* Load persisted state on startup */
  load() {
    try {
      const saved = JSON.parse(localStorage.getItem('studyverse_state') || '{}');
      if (saved.theme)    this.currentTheme   = saved.theme;
      if (saved.persona)  this.currentPersona = saved.persona;
      if (saved.accent)   this.currentAccent  = saved.accent;
      if (saved.favorites) this.favorites     = saved.favorites;
      if (saved.decks && saved.decks.length)  this.decks = saved.decks;
      else this.decks = [...DEMO_DECKS];  // load demo decks on first visit
    } catch(e) {
      this.decks = [...DEMO_DECKS];
    }
  },
};


/* ================================================================
   3. APP CONTROLLER
   Top-level navigation, view switching, and shared utilities.
================================================================ */
const App = {

  /* Sign out and return to login */
  async signOut() {
    try {
      if (window._fbAuth) await window._fbAuth.signOut();
    } catch(e) {}
    localStorage.removeItem('studyverse_state');
    window.location.href = 'login.html';
  },

  /* Load user profile from Firestore/window and apply to UI */
  loadUserProfile() {
    const p = window._userProfile;
    if (!p) return;

    // Apply nickname to greeting
    const greetingTitle = document.getElementById('greetingTitle');
    if (greetingTitle && p.nickname) {
      const hour = new Date().getHours();
      const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      greetingTitle.textContent = `${time}, ${p.nickname} 👋`;
    }

    // Show sidebar user chip
    const sidebarUser = document.getElementById('sidebarUser');
    const sidebarNickname = document.getElementById('sidebarNickname');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarUser) {
      sidebarUser.style.display = 'flex';
      if (sidebarNickname) sidebarNickname.textContent = p.nickname || 'Scholar';
      if (sidebarAvatar && p.avatarSVG) {
        sidebarAvatar.innerHTML = `<svg viewBox="0 0 120 120" width="32" height="32">${p.avatarSVG}</svg>`;
      }
    }

    // Apply accent color from profile
    if (p.accent) {
      const accentMap = {
        sky:      '#38bdf8', violet:  '#a78bfa', emerald: '#34d399',
        rose:     '#fb7185', amber:   '#fbbf24', coral:   '#fb923c',
        lavender: '#c4b5fd', mint:    '#6ee7b7', peach:   '#fca5a5',
      };
      const hex = accentMap[p.accent];
      if (hex) {
        document.documentElement.setAttribute('data-accent', p.accent);
        State.currentAccent = p.accent;
      }
    }
  },

  navigate(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

    // Show the target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove('hidden');

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewId);
    });

    State.currentView = viewId;

    // Run view-specific setup
    if (viewId === 'favorites') CardRenderer.renderFavorites();
    if (viewId === 'decks')     DecksView.render();
    if (viewId === 'settings')  SettingsView.render();
  },

  /* Open a tool from the registry */
  openTool(toolId) {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) return;

    if (tool.type === 'embed') {
      // Show iframe view
      document.getElementById('iframeTitle').textContent = tool.title;
      document.getElementById('toolIframe').src = tool.url;
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById('view-iframe').classList.remove('hidden');
    } else if (tool.type === 'external') {
      // Open in new tab with security best practices
      const win = window.open();
      win.opener = null;
      win.location = tool.url;
      Toast.show(`Opening ${tool.title} in a new tab ↗`, 'success');
    } else if (tool.openFn) {
      // Built-in modal tool
      tool.openFn();
    }
  },

  /* Close the iframe view and return to dashboard */
  closeIframe() {
    document.getElementById('toolIframe').src = '';
    this.navigate('dashboard');
  },

  /* Close modal when clicking the overlay background */
  closeModalOverlay(event) {
    if (event.target === document.getElementById('modalOverlay')) {
      ModalSystem.close();
    }
  },

  /* Close modal from the × button (always closes) */
  closeModal() {
    ModalSystem.close();
  },

  /* Filter tools by search query */
  filterTools(query) {
    State.searchQuery = query.toLowerCase();
    CardRenderer.renderDashboard();
  },

  /* Toggle dark / light theme */
  toggleTheme() {
    State.currentTheme = State.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', State.currentTheme);
    document.getElementById('themeIcon').textContent = State.currentTheme === 'dark' ? '☾' : '☀';

    const sw = document.getElementById('darkModeSwitch');
    if (sw) sw.classList.toggle('on', State.currentTheme === 'dark');

    State.save();
  },

  /* Set persona (kids | default | adult) */
  setPersona(persona) {
    State.currentPersona = persona;
    document.documentElement.setAttribute('data-persona', persona);

    document.querySelectorAll('.persona-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.persona === persona);
    });

    // Update greeting text per persona
    const greetings = {
      kids:    { title: 'Hey there! 🌟',    sub: 'Ready to learn something awesome?' },
      default: { title: 'Welcome back 👋',   sub: 'What are we studying today?' },
      adult:   { title: 'Good to see you.', sub: 'Ready to get to work?' },
    };
    const g = greetings[persona];
    const gt = document.getElementById('greetingTitle');
    const gs = document.getElementById('greetingSubtitle');
    if (gt) gt.textContent = g.title;
    if (gs) gs.textContent = g.sub;

    State.save();
  },

  /* Set accent color */
  setAccent(accentName) {
    State.currentAccent = accentName;
    document.documentElement.setAttribute('data-accent', accentName);

    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('active', sw.dataset.accent === accentName);
    });

    State.save();
  },

  /* Toggle favorite for a tool */
  toggleFavorite(toolId, event) {
    event.stopPropagation(); // don't open the tool
    const idx = State.favorites.indexOf(toolId);
    if (idx === -1) {
      State.favorites.push(toolId);
      Toast.show('Added to Favorites ♡', 'success');
    } else {
      State.favorites.splice(idx, 1);
      Toast.show('Removed from Favorites', '');
    }

    // Re-render hearts on dashboard without full re-render
    document.querySelectorAll('.fav-btn').forEach(btn => {
      if (btn.dataset.id === toolId) {
        btn.classList.toggle('active', State.favorites.includes(toolId));
        btn.textContent = State.favorites.includes(toolId) ? '♥' : '♡';
      }
    });

    State.save();
  },
};


/* ================================================================
   4. CARD RENDERER
   Builds and injects tool cards into the grid.
================================================================ */
const CardRenderer = {

  renderDashboard() {
    const grid = document.getElementById('toolsGrid');
    const query = State.searchQuery;

    const filtered = TOOLS.filter(tool =>
      !query ||
      tool.title.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔍</div>
          <p>No tools match "<strong>${query}</strong>"</p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(tool => this.buildCard(tool)).join('');
  },

  renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    const empty = document.getElementById('favoritesEmpty');
    const favTools = TOOLS.filter(t => State.favorites.includes(t.id));

    if (favTools.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      grid.innerHTML = favTools.map(tool => this.buildCard(tool)).join('');
    }
  },

  buildCard(tool) {
    const isFav = State.favorites.includes(tool.id);
    return `
      <article
        class="app-card"
        onclick="App.openTool('${tool.id}')"
        role="button"
        tabindex="0"
        aria-label="Open ${tool.title}"
        onkeydown="if(event.key==='Enter')App.openTool('${tool.id}')"
      >
        <div class="card-top">
          <div class="card-icon ${tool.iconColor}" aria-hidden="true">${tool.icon}</div>
          <button
            class="fav-btn ${isFav ? 'active' : ''}"
            data-id="${tool.id}"
            onclick="App.toggleFavorite('${tool.id}', event)"
            aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}"
          >${isFav ? '♥' : '♡'}</button>
        </div>

        <div class="card-body">
          <div class="card-title">${tool.title}</div>
          <div class="card-description">${tool.description}</div>
        </div>

        <div class="card-footer">
          <span class="card-badge ${tool.badgeClass}">${tool.badge}</span>
          <span class="card-arrow" aria-hidden="true">→</span>
        </div>
      </article>`;
  },
};


/* ================================================================
   5. MODAL SYSTEM
   Generic open/close for built-in tool modals.
================================================================ */
const ModalSystem = {

  open(title, contentHTML, maxWidth = '720px') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = contentHTML;
    document.getElementById('modalContainer').style.maxWidth = maxWidth;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('modalBody').innerHTML = '';
    document.body.style.overflow = '';

    // Stop Pomodoro if it's open (cleanup)
    if (PomodoroTool._interval) {
      clearInterval(PomodoroTool._interval);
    }
  },
};


/* ================================================================
   6. TOOL: FLASHCARDS
   AI-powered (Claude API) flashcard generator.
   Supports file drop, demo decks, card flip, and deck publishing.
================================================================ */
const FlashcardTool = {
  _activeDeckId: null,
  _currentIdx:   0,
  _flipped:      false,

  open() {
    ModalSystem.open('🃏 Flashcards', this.buildUI());
    this.bindEvents();
    this.loadDeck(State.decks[0]?.id || DEMO_DECKS[0].id);
  },

  buildUI() {
    const deckTabs = [...DEMO_DECKS, ...State.decks.filter(d => !DEMO_DECKS.find(dd => dd.id === d.id))]
      .map(deck => `
        <button class="fc-deck-tab" data-deck-id="${deck.id}" onclick="FlashcardTool.loadDeck('${deck.id}')">
          ${deck.title}
        </button>`).join('');

    return `
      <div class="flashcard-tool">

        <!-- File drop zone for AI generation -->
        <div class="fc-dropzone" id="fcDropzone">
          <input type="file" id="fcFileInput" accept=".txt,.pdf,.md,.csv" multiple />
          <div class="fc-drop-icon">📂</div>
          <div class="fc-drop-title">Drop your notes here to generate cards with AI</div>
          <div class="fc-drop-sub">Supports .txt, .pdf, .md, .csv — or paste text below</div>
        </div>

        <!-- Paste text option -->
        <textarea
          id="fcPasteInput"
          placeholder="…or paste your notes/study material here, then click Generate →"
          rows="3"
          style="width:100%;padding:10px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.86rem;outline:none;resize:vertical;font-family:inherit;margin-bottom:10px;"
        ></textarea>

        <!-- Deck name + generate button -->
        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <input type="text" id="fcNewDeckName" placeholder="New deck title…"
            style="flex:1;padding:9px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.86rem;outline:none;" />
          <button class="btn-accent" id="fcGenerateBtn" onclick="FlashcardTool.generateWithAI()">
            ✦ Generate with AI
          </button>
        </div>

        <!-- AI status indicator -->
        <div class="fc-ai-status" id="fcAiStatus">
          <div class="fc-spinner"></div>
          <span id="fcAiStatusText">Reading your notes…</span>
        </div>

        <!-- Deck selector tabs -->
        <div class="fc-deck-tabs" id="fcDeckTabs">${deckTabs}</div>

        <!-- Progress bar -->
        <div class="fc-progress-bar">
          <div class="fc-progress-fill" id="fcProgress" style="width:0%"></div>
        </div>

        <!-- Card stage (3D flip) -->
        <div class="fc-card-stage" id="fcCardStage" onclick="FlashcardTool.flip()">
          <div class="fc-card-inner" id="fcCardInner">
            <div class="fc-card-face fc-front">
              <div class="fc-card-label">Question</div>
              <div class="fc-card-content" id="fcFrontContent">Loading…</div>
              <div class="fc-card-hint">Click to reveal answer</div>
            </div>
            <div class="fc-card-face fc-back">
              <div class="fc-card-label">Answer</div>
              <div class="fc-card-content" id="fcBackContent"></div>
            </div>
          </div>
        </div>

        <!-- Prev / counter / next -->
        <div class="fc-nav">
          <button class="fc-nav-btn" id="fcPrevBtn" onclick="FlashcardTool.prev()" aria-label="Previous card">←</button>
          <span class="fc-progress-text" id="fcCounter">1 / 1</span>
          <button class="fc-nav-btn" id="fcNextBtn" onclick="FlashcardTool.next()" aria-label="Next card">→</button>
        </div>

        <!-- Publish deck row -->
        <div class="fc-publish-row">
          <input type="text" id="fcPublishName" placeholder="Deck title for sharing…" />
          <button class="btn-secondary" onclick="FlashcardTool.shuffleDeck()">🔀 Shuffle</button>
          <button class="btn-accent" onclick="FlashcardTool.publishDeck()">🌐 Publish</button>
        </div>

      </div>`;
  },

  bindEvents() {
    /* Drag & drop on the drop zone */
    const zone = document.getElementById('fcDropzone');
    if (!zone) return;

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length) this.handleFiles(files);
    });

    /* File input change */
    document.getElementById('fcFileInput')?.addEventListener('change', e => {
      if (e.target.files.length) this.handleFiles(e.target.files);
    });
  },

  /* Handle files dropped or selected */
  async handleFiles(files) {
    const texts = [];
    for (const file of files) {
      const text = await file.text();
      texts.push(`--- ${file.name} ---\n${text}`);
    }
    const combined = texts.join('\n\n');
    document.getElementById('fcPasteInput').value = combined;
    Toast.show(`${files.length} file(s) loaded — click Generate ✦`, 'success');
  },

  /* Load a deck into the card viewer */
  loadDeck(deckId) {
    const deck = [...State.decks, ...DEMO_DECKS].find(d => d.id === deckId);
    if (!deck) return;

    this._activeDeckId = deckId;
    this._currentIdx   = 0;
    this._flipped      = false;

    // Update active tab
    document.querySelectorAll('.fc-deck-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.deckId === deckId);
    });

    // Set publish name field
    const pub = document.getElementById('fcPublishName');
    if (pub) pub.value = deck.title;

    this.renderCard();
  },

  renderCard() {
    const deck = [...State.decks, ...DEMO_DECKS].find(d => d.id === this._activeDeckId);
    if (!deck || !deck.cards.length) return;

    const card = deck.cards[this._currentIdx];
    const total = deck.cards.length;

    document.getElementById('fcFrontContent').textContent = card.q;
    document.getElementById('fcBackContent').textContent  = card.a;
    document.getElementById('fcCounter').textContent      = `${this._currentIdx + 1} / ${total}`;

    // Reset flip
    this._flipped = false;
    document.getElementById('fcCardInner').classList.remove('flipped');

    // Update progress bar
    const pct = ((this._currentIdx + 1) / total * 100).toFixed(0);
    document.getElementById('fcProgress').style.width = pct + '%';

    // Disable/enable nav buttons
    document.getElementById('fcPrevBtn').disabled = this._currentIdx === 0;
    document.getElementById('fcNextBtn').disabled = this._currentIdx === total - 1;
  },

  flip() {
    this._flipped = !this._flipped;
    document.getElementById('fcCardInner').classList.toggle('flipped', this._flipped);
  },

  prev() {
    if (this._currentIdx > 0) { this._currentIdx--; this.renderCard(); }
  },

  next() {
    const deck = [...State.decks, ...DEMO_DECKS].find(d => d.id === this._activeDeckId);
    if (deck && this._currentIdx < deck.cards.length - 1) {
      this._currentIdx++;
      this.renderCard();
    }
  },

  shuffleDeck() {
    const deck = State.decks.find(d => d.id === this._activeDeckId)
               || DEMO_DECKS.find(d => d.id === this._activeDeckId);
    if (!deck) return;

    // Fisher-Yates shuffle
    for (let i = deck.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck.cards[i], deck.cards[j]] = [deck.cards[j], deck.cards[i]];
    }
    this._currentIdx = 0;
    this.renderCard();
    Toast.show('Deck shuffled! 🔀', 'success');
  },

  /* Publish deck — saves to State with public flag */
  publishDeck() {
    const nameInput = document.getElementById('fcPublishName');
    const name = nameInput?.value.trim();
    if (!name) { Toast.show('Enter a deck title to publish.', 'warning'); return; }

    const deck = [...State.decks, ...DEMO_DECKS].find(d => d.id === this._activeDeckId);
    if (!deck) return;

    // Mark as public and save
    deck.isPublic = true;
    deck.title = name;
    if (!State.decks.find(d => d.id === deck.id)) {
      State.decks.push(deck);
    }
    State.save();
    Toast.show(`"${name}" published to the community! 🌐`, 'success');
  },

  /* ─── AI GENERATION VIA CLAUDE API ─────────────────────────────
     Sends the pasted/dropped text to Claude and parses flashcards.
     The API key is handled by the Anthropic artifact environment.
  ──────────────────────────────────────────────────────────────── */
  async generateWithAI() {
    const text    = document.getElementById('fcPasteInput')?.value.trim();
    const dkName  = document.getElementById('fcNewDeckName')?.value.trim() || 'My AI Deck';

    if (!text || text.length < 20) {
      Toast.show('Paste some study material first!', 'warning');
      return;
    }

    // Show loading state
    const statusEl = document.getElementById('fcAiStatus');
    const statusTxt = document.getElementById('fcAiStatusText');
    const btn = document.getElementById('fcGenerateBtn');
    statusEl.classList.add('active');
    btn.disabled = true;

    const steps = ['Reading your notes…', 'Finding key concepts…', 'Writing questions…', 'Building your deck…'];
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      statusTxt.textContent = steps[Math.min(stepIdx++, steps.length - 1)];
    }, 2500);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a study assistant. Create flashcards from the following study material.

Return ONLY a valid JSON array. No markdown, no code blocks, no explanation. Format:
[{"q":"question here","a":"answer here"},...]

Generate 6–10 concise flashcards that test key facts, definitions, and concepts.
Keep questions clear, answers 1–3 sentences max.

Study material:
${text.slice(0, 4000)}`
          }],
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) throw new Error(`API error ${response.status}`);

      const data = await response.json();
      const raw  = data.content?.map(b => b.text || '').join('') || '';

      // Strip any accidental markdown fences before parsing
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const cards   = JSON.parse(cleaned);

      if (!Array.isArray(cards) || cards.length === 0) throw new Error('No cards returned');

      // Build new deck and inject it
      const newDeck = {
        id:        'ai-' + Date.now(),
        title:     dkName,
        cards,
        isPublic:  false,
        createdAt: new Date().toISOString().split('T')[0],
      };

      State.decks.push(newDeck);
      State.save();

      // Add tab and load deck
      const tabsEl = document.getElementById('fcDeckTabs');
      if (tabsEl) {
        tabsEl.insertAdjacentHTML('beforeend', `
          <button class="fc-deck-tab" data-deck-id="${newDeck.id}"
            onclick="FlashcardTool.loadDeck('${newDeck.id}')">
            ${newDeck.title}
          </button>`);
      }

      this.loadDeck(newDeck.id);
      Toast.show(`✦ ${cards.length} cards generated for "${dkName}"!`, 'success');

    } catch (err) {
      clearInterval(stepInterval);
      console.error('AI generation error:', err);
      Toast.show('Could not generate cards — check your content and try again.', 'error');
    } finally {
      statusEl.classList.remove('active');
      btn.disabled = false;
    }
  },
};


/* ================================================================
   7. TOOL: POMODORO TIMER
   Classic Pomodoro with animated SVG ring, session tracking,
   and customizable durations.
================================================================ */
const PomodoroTool = {
  _interval:    null,
  _running:     false,
  _remaining:   25 * 60,
  _total:       25 * 60,
  _sessions:    0,
  _sessionType: 'focus',   // 'focus' | 'short' | 'long'

  _durations: {
    focus: 25 * 60,
    short: 5  * 60,
    long:  15 * 60,
  },

  open() {
    ModalSystem.open('⏱ Time Budgeter', this.buildUI(), '480px');
    this.updateDisplay();
  },

  buildUI() {
    return `
      <div class="pomodoro-tool">

        <!-- Session type tabs -->
        <div class="pom-tabs">
          <button class="pom-tab active" data-type="focus" onclick="PomodoroTool.switchType('focus')">Focus</button>
          <button class="pom-tab"        data-type="short" onclick="PomodoroTool.switchType('short')">Short Break</button>
          <button class="pom-tab"        data-type="long"  onclick="PomodoroTool.switchType('long')">Long Break</button>
        </div>

        <!-- Animated ring -->
        <div class="pom-ring-wrap">
          <svg class="pom-svg" viewBox="0 0 200 200" aria-hidden="true">
            <circle class="pom-track" cx="100" cy="100" r="90" />
            <circle class="pom-fill"  cx="100" cy="100" r="90" id="pomRing" />
          </svg>
          <div class="pom-time-label">
            <span class="pom-time" id="pomTime">25:00</span>
            <span class="pom-session-label" id="pomSessionLabel">Focus Session</span>
          </div>
        </div>

        <!-- Controls -->
        <div class="pom-btns">
          <button class="pom-btn-secondary" onclick="PomodoroTool.reset()" aria-label="Reset timer">↺</button>
          <button class="pom-btn-main" id="pomPlayBtn" onclick="PomodoroTool.toggle()" aria-label="Start/pause timer">▶</button>
          <button class="pom-btn-secondary" onclick="PomodoroTool.skip()" aria-label="Skip session">⏭</button>
        </div>

        <!-- Session stats -->
        <div class="pom-stats">
          <div>
            <span class="pom-stat-val" id="pomSessions">0</span>
            <span class="pom-stat-lbl">Sessions</span>
          </div>
          <div>
            <span class="pom-stat-val" id="pomFocusTime">0m</span>
            <span class="pom-stat-lbl">Focused</span>
          </div>
        </div>

        <!-- Custom durations -->
        <div class="pom-settings">
          <label>
            <span>Focus (min)</span>
            <input type="number" id="pomFocusDur" value="25" min="1" max="90"
              onchange="PomodoroTool.setDuration('focus', this.value)" />
          </label>
          <label>
            <span>Short Break</span>
            <input type="number" id="pomShortDur" value="5" min="1" max="30"
              onchange="PomodoroTool.setDuration('short', this.value)" />
          </label>
          <label>
            <span>Long Break</span>
            <input type="number" id="pomLongDur" value="15" min="1" max="60"
              onchange="PomodoroTool.setDuration('long', this.value)" />
          </label>
        </div>

      </div>`;
  },

  toggle() {
    if (this._running) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    this._running = true;
    document.getElementById('pomPlayBtn').textContent = '⏸';
    this._interval = setInterval(() => this.tick(), 1000);
  },

  pause() {
    this._running = false;
    document.getElementById('pomPlayBtn').textContent = '▶';
    clearInterval(this._interval);
  },

  reset() {
    this.pause();
    this._remaining = this._durations[this._sessionType];
    this._total     = this._remaining;
    this.updateDisplay();
  },

  skip() {
    this.pause();
    this.completeSession();
  },

  tick() {
    if (this._remaining <= 0) {
      this.completeSession();
      return;
    }
    this._remaining--;
    this.updateDisplay();
  },

  completeSession() {
    this.pause();
    if (this._sessionType === 'focus') {
      this._sessions++;
      document.getElementById('pomSessions').textContent = this._sessions;
      const focused = Math.round(this._durations.focus / 60) * this._sessions;
      document.getElementById('pomFocusTime').textContent = focused + 'm';

      Toast.show('🎉 Focus session complete! Take a break.', 'success');

      // Auto-switch to short break
      this.switchType(this._sessions % 4 === 0 ? 'long' : 'short');
    } else {
      Toast.show('Break over — time to focus! 💪', 'success');
      this.switchType('focus');
    }
  },

  switchType(type) {
    this._sessionType = type;
    this._remaining   = this._durations[type];
    this._total       = this._remaining;
    this._running     = false;
    clearInterval(this._interval);

    document.querySelectorAll('.pom-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.type === type);
    });

    const labels = { focus: 'Focus Session', short: 'Short Break', long: 'Long Break' };
    const labelEl = document.getElementById('pomSessionLabel');
    if (labelEl) labelEl.textContent = labels[type];

    const playBtn = document.getElementById('pomPlayBtn');
    if (playBtn) playBtn.textContent = '▶';

    this.updateDisplay();
  },

  setDuration(type, minutes) {
    const mins = Math.max(1, parseInt(minutes) || 1);
    this._durations[type] = mins * 60;
    if (this._sessionType === type) this.reset();
  },

  updateDisplay() {
    const mins = String(Math.floor(this._remaining / 60)).padStart(2, '0');
    const secs = String(this._remaining % 60).padStart(2, '0');
    const timeEl = document.getElementById('pomTime');
    if (timeEl) timeEl.textContent = `${mins}:${secs}`;

    // Update SVG ring
    const circumference = 2 * Math.PI * 90; // 565.49
    const progress = this._total > 0 ? this._remaining / this._total : 1;
    const offset   = circumference * (1 - progress);
    const ring = document.getElementById('pomRing');
    if (ring) ring.style.strokeDashoffset = offset;

    // Page title update
    document.title = this._running ? `${mins}:${secs} — StudyVerse` : 'StudyVerse';
  },
};


/* ================================================================
   8. TOOL: DUOLINGO TRACKER (Mock API Widget)
   Demonstrates how a real Duolingo API integration would look.
   Replace the mock data with real API calls when the key is ready.
================================================================ */
const DuolingoWidget = {
  _mockData: {
    username: 'studyverse_user',
    league:   'Obsidian League 💎',
    streak:   47,
    xpToday:  220,
    totalXP:  18540,
    weekXP:   [80, 150, 200, 220, 175, 0, 0],  // Mon → Sun
  },

  open() {
    ModalSystem.open('🦉 Duolingo Tracker', this.buildUI(), '560px');
    this.animateBars();
  },

  buildUI() {
    const d   = this._mockData;
    const days = ['M','T','W','T','F','S','S'];
    const max  = Math.max(...d.weekXP, 1);
    const today = new Date().getDay(); // 0=Sun,1=Mon…
    const dayIdx = today === 0 ? 6 : today - 1;

    const bars = d.weekXP.map((xp, i) => {
      const heightPct = Math.round((xp / max) * 100);
      const isToday = i === dayIdx;
      return `
        <div class="duo-bar-wrap">
          <div class="duo-bar ${isToday ? 'today' : ''}"
            id="duoBar${i}"
            style="height:0%;transition:height 0.5s ease ${i * 0.08}s"
            data-final="${heightPct}%"
            aria-label="${days[i]}: ${xp} XP">
          </div>
          <span class="duo-bar-day">${days[i]}</span>
        </div>`;
    }).join('');

    return `
      <div class="duo-widget">

        <!-- User header -->
        <div class="duo-header">
          <div class="duo-avatar" aria-hidden="true">🦉</div>
          <div>
            <div class="duo-username">${d.username}</div>
            <div class="duo-league">${d.league}</div>
          </div>
        </div>

        <!-- Stat cards -->
        <div class="duo-stats-grid">
          <div class="duo-stat-card">
            <div class="duo-stat-icon">🔥</div>
            <span class="duo-stat-val">${d.streak}</span>
            <span class="duo-stat-lbl">Day Streak</span>
          </div>
          <div class="duo-stat-card">
            <div class="duo-stat-icon">⚡</div>
            <span class="duo-stat-val">${d.xpToday}</span>
            <span class="duo-stat-lbl">XP Today</span>
          </div>
          <div class="duo-stat-card">
            <div class="duo-stat-icon">🏆</div>
            <span class="duo-stat-val">${d.totalXP.toLocaleString()}</span>
            <span class="duo-stat-lbl">Total XP</span>
          </div>
        </div>

        <!-- Weekly XP chart -->
        <div class="duo-week">
          <div class="duo-week-title">Weekly XP — This Week</div>
          <div class="duo-bars">${bars}</div>
        </div>

        <!-- API note -->
        <div class="duo-connect-note">
          ⚠️ This is a mock widget. Connect a real Duolingo API key in Settings to load live stats.
        </div>

      </div>`;
  },

  animateBars() {
    // Animate bars in after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('[id^="duoBar"]').forEach(bar => {
          bar.style.height = bar.dataset.final;
        });
      }, 100);
    });
  },
};


/* ================================================================
   14. TOOL: QUIZLET EMBEDDER
   Paste a Quizlet set URL → extracts set ID → renders iframe.
================================================================ */
const QuizletTool = {
  open() {
    ModalSystem.open('📇 Quizlet', this.buildUI(), '760px');
  },

  buildUI() {
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5">
          Paste the URL of any <strong>public</strong> Quizlet set below.
          Example: <code style="font-size:0.8rem;background:var(--bg-subtle);padding:2px 6px;border-radius:4px">https://quizlet.com/123456789/my-set-flash-cards/</code>
        </p>
        <div style="display:flex;gap:10px">
          <input id="quizletUrl" type="url" placeholder="https://quizlet.com/…"
            style="flex:1;padding:10px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.9rem;outline:none;" />
          <button class="btn-accent" onclick="QuizletTool.load()">Load Set →</button>
        </div>
        <div id="quizletError" style="color:var(--danger);font-size:0.85rem;display:none"></div>
        <div id="quizletFrame" style="display:none">
          <iframe id="quizletIframe" src="" height="500" width="100%"
            style="border:0;border-radius:var(--ui-radius,10px)" allowfullscreen></iframe>
        </div>
      </div>`;
  },

  load() {
    const url = document.getElementById('quizletUrl').value.trim();
    const errEl = document.getElementById('quizletError');
    errEl.style.display = 'none';

    // Extract set ID from URL like https://quizlet.com/123456789/set-name/...
    const match = url.match(/quizlet\.com\/(\d+)\//);
    if (!match) {
      errEl.textContent = 'Could not find a Quizlet set ID in that URL. Make sure it\'s a public set link.';
      errEl.style.display = 'block';
      return;
    }

    const setId = match[1];
    const embedUrl = `https://quizlet.com/${setId}/flashcards/embedv2`;
    document.getElementById('quizletIframe').src = embedUrl;
    document.getElementById('quizletFrame').style.display = 'block';
  },
};


/* ================================================================
   15. TOOL: NOTION EMBEDDER
   Paste a public Notion share link → renders iframe.
================================================================ */
const NotionTool = {
  open() {
    ModalSystem.open('📝 Notion', this.buildUI(), '900px');
  },

  buildUI() {
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5">
          In Notion, click <strong>Share → Share to web</strong>, then paste the public link below.
        </p>
        <div style="display:flex;gap:10px">
          <input id="notionUrl" type="url" placeholder="https://notion.so/…"
            style="flex:1;padding:10px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.9rem;outline:none;" />
          <button class="btn-accent" onclick="NotionTool.load()">Load Page →</button>
        </div>
        <div id="notionError" style="color:var(--danger);font-size:0.85rem;display:none"></div>
        <div id="notionFrame" style="display:none">
          <iframe id="notionIframe" src="" height="600" width="100%"
            style="border:0;border-radius:var(--ui-radius,10px)" allowfullscreen></iframe>
        </div>
      </div>`;
  },

  load() {
    const url = document.getElementById('notionUrl').value.trim();
    const errEl = document.getElementById('notionError');
    errEl.style.display = 'none';

    if (!url.includes('notion.so') && !url.includes('notion.site')) {
      errEl.textContent = 'Please enter a valid Notion share link (notion.so or notion.site).';
      errEl.style.display = 'block';
      return;
    }

    document.getElementById('notionIframe').src = url;
    document.getElementById('notionFrame').style.display = 'block';
  },
};


/* ================================================================
   16. TOOL: WOLFRAM ALPHA
   Uses the WolframAlpha Simple API to render answer images.
   Sign up free at https://developer.wolframalpha.com to get an App ID.
================================================================ */
const WolframTool = {
  // Replace with your free WolframAlpha App ID from developer.wolframalpha.com
  APP_ID: 'REPLACE_WITH_WOLFRAM_APP_ID',

  open() {
    ModalSystem.open('🧮 WolframAlpha', this.buildUI(), '760px');
  },

  buildUI() {
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5">
          Type any math equation, science question, or conversion. Powered by WolframAlpha.
        </p>
        <div style="display:flex;gap:10px">
          <input id="wolframInput" type="text" placeholder="e.g. x^2 + 3x - 4 = 0  or  distance from Earth to Moon"
            style="flex:1;padding:10px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.9rem;outline:none;"
            onkeydown="if(event.key==='Enter')WolframTool.query()" />
          <button class="btn-accent" onclick="WolframTool.query()">Solve →</button>
        </div>
        <div id="wolframResult" style="display:none;text-align:center">
          <div id="wolframSpinner" style="padding:20px;color:var(--text-secondary)">Computing…</div>
          <img id="wolframImg" src="" alt="WolframAlpha result" style="max-width:100%;border-radius:var(--ui-radius,10px);display:none" />
          <div id="wolframError" style="color:var(--danger);font-size:0.85rem;display:none"></div>
        </div>
        ${this.APP_ID === 'REPLACE_WITH_WOLFRAM_APP_ID' ? `
          <div style="background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);padding:12px 14px;font-size:0.83rem;color:var(--text-secondary)">
            ⚠️ <strong>Setup needed:</strong> Get a free App ID at
            <a href="https://developer.wolframalpha.com" target="_blank" rel="noopener" style="color:var(--accent)">developer.wolframalpha.com</a>
            and replace <code>REPLACE_WITH_WOLFRAM_APP_ID</code> in app.js.
          </div>` : ''}
      </div>`;
  },

  async query() {
    const q = document.getElementById('wolframInput').value.trim();
    if (!q) return;
    if (this.APP_ID === 'REPLACE_WITH_WOLFRAM_APP_ID') {
      Toast.show('Add your WolframAlpha App ID in app.js first.', 'warning');
      return;
    }

    const resultEl = document.getElementById('wolframResult');
    const spinner  = document.getElementById('wolframSpinner');
    const img      = document.getElementById('wolframImg');
    const errEl    = document.getElementById('wolframError');

    resultEl.style.display = 'block';
    spinner.style.display  = 'block';
    img.style.display      = 'none';
    errEl.style.display    = 'none';

    // WolframAlpha Simple API returns an image directly
    const url = `https://api.wolframalpha.com/v1/simple?appid=${this.APP_ID}&i=${encodeURIComponent(q)}&width=600`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No result');
      const blob = await res.blob();
      img.src = URL.createObjectURL(blob);
      img.style.display = 'block';
      spinner.style.display = 'none';
    } catch(e) {
      spinner.style.display = 'none';
      errEl.textContent = 'No result found. Try rephrasing your query.';
      errEl.style.display = 'block';
    }
  },
};


/* ================================================================
   17. TOOL: GRAMMARLY EDITOR
   Grammarly Editor SDK auto-enhances any textarea on the page.
   The SDK script is injected once when this tool first opens.
   Note: Grammarly SDK requires their domain allowlist — add
   your deployment domain at app.grammarly.com/sdk-setup.
================================================================ */
const GrammarlyTool = {
  _sdkLoaded: false,

  open() {
    ModalSystem.open('✍️ Grammarly Editor', this.buildUI(), '760px');
    this._initSDK();
  },

  buildUI() {
    return `
      <div style="display:flex;flex-direction:column;gap:14px">
        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5">
          Write or paste your essay below. Grammarly will underline grammar, tone, and clarity issues inline.
          You need a free <a href="https://app.grammarly.com" target="_blank" rel="noopener" style="color:var(--accent)">Grammarly account</a> to see suggestions.
        </p>
        <grammarly-editor-plugin>
          <textarea id="grammarlyTextarea"
            placeholder="Start writing here…"
            style="width:100%;min-height:320px;padding:14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.95rem;line-height:1.6;outline:none;resize:vertical;font-family:inherit;"></textarea>
        </grammarly-editor-plugin>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-secondary" onclick="navigator.clipboard.writeText(document.getElementById('grammarlyTextarea').value);Toast.show('Copied!','success')">📋 Copy</button>
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted)">
          Grammarly suggestions appear as underlines directly in the text area. Click any underline to see the fix.
        </div>
      </div>`;
  },

  _initSDK() {
    if (this._sdkLoaded) return;
    this._sdkLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/@grammarly/editor-sdk@1?clientId=client_REPLACE_WITH_GRAMMARLY_CLIENT_ID';
    s.async = true;
    document.head.appendChild(s);
  },
};


/* ================================================================
   18. TOOL: ZOTERO CITATIONS
   Uses the Zotero Web API to browse the user's public library
   and copy formatted MLA/APA citations.
   Get your User ID + API key at https://www.zotero.org/settings/keys
================================================================ */
const ZoteroTool = {
  open() {
    ModalSystem.open('🎓 Zotero Citations', this.buildUI(), '760px');
  },

  buildUI() {
    return `
      <div style="display:flex;flex-direction:column;gap:16px">
        <p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.5">
          Enter your Zotero User ID and API key to browse your library and copy citations.
          Find both at <a href="https://www.zotero.org/settings/keys" target="_blank" rel="noopener" style="color:var(--accent)">zotero.org/settings/keys</a>.
        </p>
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
          <input id="zoteroUserId" type="text" placeholder="User ID (numbers)"
            style="padding:10px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.9rem;outline:none;" />
          <input id="zoteroApiKey" type="password" placeholder="API Key"
            style="padding:10px 14px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.9rem;outline:none;" />
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <select id="zoteroFormat" style="padding:9px 12px;background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);color:var(--text-primary);font-size:0.9rem;outline:none">
            <option value="apa">APA 7th</option>
            <option value="mla">MLA 9th</option>
            <option value="chicago-note-bibliography">Chicago</option>
          </select>
          <button class="btn-accent" onclick="ZoteroTool.fetch()">Load Library →</button>
        </div>
        <div id="zoteroError" style="color:var(--danger);font-size:0.85rem;display:none"></div>
        <div id="zoteroResults" style="display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto"></div>
      </div>`;
  },

  async fetch() {
    const userId = document.getElementById('zoteroUserId').value.trim();
    const apiKey = document.getElementById('zoteroApiKey').value.trim();
    const format = document.getElementById('zoteroFormat').value;
    const errEl  = document.getElementById('zoteroError');
    const resEl  = document.getElementById('zoteroResults');

    errEl.style.display = 'none';
    resEl.innerHTML = '<div style="color:var(--text-secondary);padding:10px">Loading library…</div>';

    if (!userId || !apiKey) {
      errEl.textContent = 'Please enter both your User ID and API Key.';
      errEl.style.display = 'block';
      resEl.innerHTML = '';
      return;
    }

    try {
      const res = await fetch(
        `https://api.zotero.org/users/${userId}/items?format=json&include=bib&style=${format}&limit=25`,
        { headers: { 'Zotero-API-Key': apiKey } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = await res.json();

      if (!items.length) {
        resEl.innerHTML = '<div style="color:var(--text-secondary);padding:10px">No items found in your library.</div>';
        return;
      }

      resEl.innerHTML = items.map((item, i) => {
        const bib = item.bib || '';
        // Strip HTML tags for clipboard
        const plain = bib.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        const title = item.data?.title || 'Untitled';
        return `
          <div style="background:var(--bg-subtle);border:1px solid var(--border-default);border-radius:var(--ui-radius,10px);padding:12px 14px">
            <div style="font-size:0.85rem;font-weight:500;margin-bottom:6px;color:var(--text-primary)">${title}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5;margin-bottom:8px">${bib || plain}</div>
            <button class="btn-secondary" style="font-size:0.8rem;padding:5px 10px"
              onclick="navigator.clipboard.writeText(${JSON.stringify(plain)});Toast.show('Citation copied!','success')">
              📋 Copy Citation
            </button>
          </div>`;
      }).join('');
    } catch(e) {
      errEl.textContent = 'Could not load library. Check your User ID and API Key.';
      errEl.style.display = 'block';
      resEl.innerHTML = '';
    }
  },
};


/* ================================================================
   9. THEME & PERSONA
   Applies persisted settings on load.
================================================================ */
const ThemeSystem = {
  apply() {
    const { currentTheme, currentPersona, currentAccent } = State;

    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-persona', currentPersona);
    document.documentElement.setAttribute('data-accent', currentAccent);

    // Sync sidebar icon
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.textContent = currentTheme === 'dark' ? '☾' : '☀';

    // Sync dark mode toggle in settings
    const sw = document.getElementById('darkModeSwitch');
    if (sw) sw.classList.toggle('on', currentTheme === 'dark');

    // Sync persona pills
    document.querySelectorAll('.persona-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.persona === currentPersona);
    });

    // Apply greeting for persona
    App.setPersona(currentPersona);
  },
};


/* ================================================================
   10. DECKS VIEW
   Lists all user decks with metadata and public/private status.
================================================================ */
const DecksView = {
  render() {
    const list = document.getElementById('decksList');
    const allDecks = [...DEMO_DECKS, ...State.decks.filter(d => !DEMO_DECKS.find(dd => dd.id === d.id))];

    if (!allDecks.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🃏</div><p>No decks yet — create one from the Flashcards tool!</p></div>`;
      return;
    }

    list.innerHTML = allDecks.map(deck => `
      <div class="deck-card" onclick="App.openTool('flashcards'); setTimeout(()=>FlashcardTool.loadDeck('${deck.id}'),300)">
        <div class="deck-card-title">${deck.title}</div>
        <div class="deck-card-meta">
          <span>🃏 ${deck.cards.length} cards</span>
          <span>📅 ${deck.createdAt}</span>
        </div>
        ${deck.isPublic ? '<span class="deck-tag-public">🌐 Public</span>' : ''}
      </div>`).join('');
  },
};


/* ================================================================
   11. SETTINGS VIEW
   Color swatches, toggles, and info panel.
================================================================ */
const SettingsView = {
  render() {
    const container = document.getElementById('colorSwatches');
    if (!container) return;

    container.innerHTML = ACCENT_COLORS.map(c => `
      <div
        class="color-swatch ${State.currentAccent === c.name ? 'active' : ''}"
        style="background:${c.hex}"
        data-accent="${c.name}"
        onclick="App.setAccent('${c.name}')"
        title="${c.label}"
        role="button"
        aria-label="Set accent color to ${c.label}"
        tabindex="0"
      ></div>`).join('');

    // Sync dark mode toggle
    const sw = document.getElementById('darkModeSwitch');
    if (sw) sw.classList.toggle('on', State.currentTheme === 'dark');
  },
};


/* ================================================================
   12. TOAST SYSTEM
   Lightweight notification system.
   Usage: Toast.show('Message', 'success' | 'warning' | 'error' | '')
================================================================ */
const Toast = {
  show(message, type = '', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  },
};


/* ================================================================
   13. INIT
   Bootstraps the app on DOMContentLoaded.
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Load persisted state
  State.load();

  // 2. Apply theme, persona, accent
  ThemeSystem.apply();

  // 3. Render the dashboard tool cards
  CardRenderer.renderDashboard();

  // 4. Navigate to dashboard (default view)
  App.navigate('dashboard');

  // 5. Load Firebase user profile once auth resolves (avoids race condition)
  if (window._fbAuth) {
    window._fbAuth.onAuthStateChanged(async (user) => {
      if (user && !window._userProfile) {
        try {
          const doc = await window._fbDb.collection('users').doc(user.uid).get();
          if (doc.exists) { window._userProfile = doc.data(); App.loadUserProfile(); }
        } catch(e) {}
      } else if (window._userProfile) {
        App.loadUserProfile();
      }
    });
  }

  // 6. Keyboard shortcut: Escape closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') ModalSystem.close();
  });

  console.log(
    '%c✦ StudyVerse Loaded',
    'color:#38bdf8;font-size:16px;font-weight:700;',
    '\nAdd tools in the TOOLS array at the top of app.js.',
    '\nDeploy to: Cloudflare Pages → studyverse.dev'
  );
});