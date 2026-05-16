// ================================================================
// STUDYVERSE — app.js
// Single-file logic: Firebase Auth, Firestore, Tools, UI
// ================================================================

// ─── Apply theme/accent BEFORE Firebase loads (prevents flash) ──
(function () {
  const t = localStorage.getItem('theme')  || 'dark';
  const a = localStorage.getItem('accent') || 'sky';
  document.documentElement.setAttribute('data-theme',  t);
  document.documentElement.setAttribute('data-accent', a);
})();

// ================================================================
// FIREBASE CONFIG — replace placeholders with your project values
// ================================================================
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_AUTH_DOMAIN",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();

// ================================================================
// PAGE DETECTION — determines which code path to run
// ================================================================
const IS_LOGIN    = window.location.pathname.includes('login.html')
                 || window.location.pathname === '/'
                 || window.location.pathname.endsWith('/');
const IS_SETTINGS = window.location.pathname.includes('settings.html');
const IS_DASHBOARD = !IS_LOGIN && !IS_SETTINGS;

// ================================================================
// GLOBAL STATE
// ================================================================
const state = {
  currentView: 'dashboard',
  currentTool: null,
  user:        null,
  userData:    null,
  favorites:   [],

  // ── TOOL CATALOG ──────────────────────────────────────────────
  // To add a tool: append one object here. That's it.
  // Types: 'built-in' | 'iframe' | 'external' | 'mock-api'
  // ─────────────────────────────────────────────────────────────
  tools: [
    {
      id:           'flashcards',
      name:         'Flashcards',
      description:  'Create and study digital flashcards with flip animations.',
      icon:         '📚',
      type:         'built-in',
      modalContent: 'flashcards',
      color:        'blue'
    },
    {
      id:           'time-budgeter',
      name:         'Time Budgeter',
      description:  'Pomodoro timer for deep, focused study sessions.',
      icon:         '⏳',
      type:         'built-in',
      modalContent: 'pomodoro',
      color:        'violet'
    },
    {
      id:           'desmos',
      name:         'Desmos Graphing',
      description:  'Powerful graphing calculator — equations, tables, stats.',
      icon:         '📈',
      type:         'iframe',
      url:          'https://www.desmos.com/calculator',
      color:        'green'
    },
    {
      id:           'notebooklm',
      name:         'NotebookLM',
      description:  'AI-powered notebook. Upload docs, ask questions, get insights.',
      icon:         '📓',
      type:         'external',
      url:          'https://notebooklm.google',
      color:        'amber'
    },
    {
      id:           'duolingo-tracker',
      name:         'Duolingo Tracker',
      description:  'Check your language-learning streak and weekly XP.',
      icon:         '🦉',
      type:         'mock-api',
      modalContent: 'duolingo',
      color:        'pink'
    },
    {
      id:           'wolfram',
      name:         'Wolfram Alpha',
      description:  'Computational answers for math, science, and everything else.',
      icon:         '🔬',
      type:         'iframe',
      url:          'https://www.wolframalpha.com',
      color:        'teal'
    },
    {
      id:           'khan-academy',
      name:         'Khan Academy',
      description:  'Free world-class lessons for every subject and grade level.',
      icon:         '🎓',
      type:         'external',
      url:          'https://www.khanacademy.org',
      color:        'orange'
    },
    {
      id:           'todo-list',
      name:         'Study To-Do',
      description:  'Quick task list to track what you need to finish today.',
      icon:         '✅',
      type:         'built-in',
      modalContent: 'todo',
      color:        'green'
    },
    {
      id:           'quizlet',
      name:         'Quizlet',
      description:  'Millions of study sets. Flashcards, games, and practice tests.',
      icon:         '🃏',
      type:         'external',
      url:          'https://quizlet.com',
      color:        'blue'
    },
    {
      id:           'google-scholar',
      name:         'Google Scholar',
      description:  'Search academic papers, theses, books, and court opinions.',
      icon:         '🔍',
      type:         'iframe',
      url:          'https://scholar.google.com',
      color:        'amber'
    },
  ]
};

// ================================================================
// TOAST NOTIFICATIONS  (replaces all alert() calls)
// ================================================================
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ================================================================
// AUTH — FIREBASE
// ================================================================

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(r => handleNewUser(r.user))
    .catch(e => showToast(e.message, 'error'));
}

function loginWithApple() {
  const provider = new firebase.auth.OAuthProvider('apple.com');
  auth.signInWithPopup(provider)
    .then(r => handleNewUser(r.user))
    .catch(e => showToast('Apple Sign-In requires Apple Developer setup. ' + e.message, 'error'));
}

function loginWithMicrosoft() {
  const provider = new firebase.auth.OAuthProvider('microsoft.com');
  auth.signInWithPopup(provider)
    .then(r => handleNewUser(r.user))
    .catch(e => showToast(e.message, 'error'));
}

function emailLogin() {
  const email    = document.getElementById('email')?.value?.trim();
  const password = document.getElementById('password')?.value;
  if (!email || !password) { showToast('Please enter email and password.', 'warning'); return; }
  auth.signInWithEmailAndPassword(email, password)
    .then(r => handleNewUser(r.user))
    .catch(e => showToast(e.message, 'error'));
}

function emailSignup() {
  const email   = document.getElementById('signupEmail')?.value?.trim();
  const pass    = document.getElementById('signupPassword')?.value;
  const confirm = document.getElementById('signupPasswordConfirm')?.value;
  if (!email || !pass) { showToast('Please fill in all fields.', 'warning'); return; }
  if (pass !== confirm) { showToast('Passwords do not match.', 'error'); return; }
  if (pass.length < 8)  { showToast('Password must be at least 8 characters.', 'error'); return; }
  auth.createUserWithEmailAndPassword(email, pass)
    .then(r => handleNewUser(r.user))
    .catch(e => showToast(e.message, 'error'));
}

function showSignup() {
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('signupForm').style.display = 'flex';
  document.getElementById('formTitle').textContent    = 'Create your account';
  document.getElementById('formTogglePrompt').innerHTML =
    'Already have an account? <a href="#" onclick="event.preventDefault(); showLogin()">Log In</a>';
}

function showLogin() {
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginForm').style.display  = 'flex';
  document.getElementById('formTitle').textContent    = 'Welcome to StudyVerse';
  document.getElementById('formTogglePrompt').innerHTML =
    'New here? <a href="#" onclick="event.preventDefault(); showSignup()">Sign Up</a>';
}

function forgotPassword() {
  const email = document.getElementById('email')?.value?.trim()
             || document.getElementById('signupEmail')?.value?.trim();
  if (!email) { showToast('Enter your email address first.', 'warning'); return; }
  auth.sendPasswordResetEmail(email)
    .then(() => showToast('Password reset email sent!', 'success'))
    .catch(e  => showToast(e.message, 'error'));
}

function logout() {
  auth.signOut().then(() => { window.location.href = 'login.html'; });
}

// Called after every successful sign-in/sign-up
async function handleNewUser(user) {
  try {
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists || !doc.data().nickname) {
      // New user — redirect to dashboard where the nickname overlay will show
      window.location.href = 'index.html';
    } else {
      window.location.href = 'index.html';
    }
  } catch {
    window.location.href = 'index.html';
  }
}

// ================================================================
// NICKNAME SETUP (shown in the overlay modal on index.html)
// ================================================================
async function submitNickname() {
  const input    = document.getElementById('nicknameSetupInput');
  const nickname = input?.value?.trim();
  if (!nickname) { showToast('Please enter a nickname.', 'warning'); return; }
  if (nickname.length < 2) { showToast('Nickname must be at least 2 characters.', 'warning'); return; }
  if (!state.user) return;
  try {
    const email    = state.user.email || '';
    const username = email.split('@')[0] || 'user';
    await db.collection('users').doc(state.user.uid).set({
      nickname,
      username,
      avatar:    JSON.stringify({ base: 'book', eyes: 'happy', hair: 'none', smile: 'smile', hat: 'none' }),
      favorites: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    state.userData = { nickname, username, avatar: null, favorites: [] };
    state.favorites = [];
    document.getElementById('nicknameOverlay')?.classList.add('hidden');
    updateGreeting();
    renderAppGrid();
    renderFavoritesGrid();
    showToast(`Welcome, ${nickname}! 🚀`, 'success');
  } catch (e) {
    showToast('Could not save nickname: ' + e.message, 'error');
  }
}

// ================================================================
// GREETING
// ================================================================
function updateGreeting() {
  const el = document.getElementById('userGreeting');
  if (el && state.userData?.nickname) {
    el.textContent = `Hi ${state.userData.nickname}!`;
  }
}

// ================================================================
// DASHBOARD INIT
// ================================================================
function initDashboard() {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    state.user = user;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists && doc.data().nickname) {
        state.userData = doc.data();
        state.favorites = state.userData.favorites || [];
        updateGreeting();
        renderAppGrid();
        renderFavoritesGrid();
        setupDashboardListeners();
      } else {
        // Show nickname overlay for new users
        state.userData = { nickname: '', username: '', favorites: [] };
        renderAppGrid();
        renderFavoritesGrid();
        setupDashboardListeners();
        document.getElementById('nicknameOverlay')?.classList.remove('hidden');
      }
    } catch {
      // Firestore might be unreachable — still show dashboard
      renderAppGrid();
      renderFavoritesGrid();
      setupDashboardListeners();
    }
  });
}

// ================================================================
// SETTINGS INIT
// ================================================================
function initSettings() {
  auth.onAuthStateChanged(async user => {
    if (!user) {
      window.location.replace('login.html');
      return;
    }
    state.user = user;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        state.userData = doc.data();
        // Pre-fill inputs
        const ni = document.getElementById('nicknameInput');
        const ui = document.getElementById('usernameInput');
        if (ni) ni.value = state.userData.nickname || '';
        if (ui) ui.value = state.userData.username || '';
        updateGreeting();
        // Render avatar builder with saved config
        renderAvatarBuilder(state.userData.avatar);
      }
    } catch { /* offline */ }
    // Mark active accent swatch
    const saved = localStorage.getItem('accent') || 'sky';
    document.querySelectorAll('.color-swatch').forEach(s => {
      s.classList.toggle('active', s.dataset.accent === saved);
    });
  });
}

// ================================================================
// LOGIN INIT
// ================================================================
function initLogin() {
  auth.onAuthStateChanged(user => {
    // If already logged in, go straight to dashboard
    if (user) window.location.replace('index.html');
  });
}

// ================================================================
// SETTINGS FUNCTIONS
// ================================================================
async function updateNickname() {
  if (!state.user) return;
  const val = document.getElementById('nicknameInput')?.value?.trim();
  if (!val) { showToast('Enter a nickname first.', 'warning'); return; }
  await db.collection('users').doc(state.user.uid).update({ nickname: val });
  state.userData.nickname = val;
  updateGreeting();
  showToast('Nickname updated!', 'success');
}

async function updateUsername() {
  if (!state.user) return;
  const val = document.getElementById('usernameInput')?.value?.trim();
  if (!val) { showToast('Enter a username first.', 'warning'); return; }
  await db.collection('users').doc(state.user.uid).update({ username: val });
  state.userData.username = val;
  showToast('Username updated!', 'success');
}

function updateAvatar() {
  showToast('Choose an avatar style below and click Save Avatar!', 'info');
}

async function changePassword() {
  if (!state.user || !state.user.email) {
    showToast('Password reset only works for email accounts.', 'warning');
    return;
  }
  auth.sendPasswordResetEmail(state.user.email)
    .then(() => showToast('Password reset email sent!', 'success'))
    .catch(e  => showToast(e.message, 'error'));
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  showToast(`${theme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode enabled`, 'success');
}

function setAccent(accent) {
  document.documentElement.setAttribute('data-accent', accent);
  localStorage.setItem('accent', accent);
  document.querySelectorAll('.color-swatch').forEach(s =>
    s.classList.toggle('active', s.dataset.accent === accent));
}

// ================================================================
// AVATAR BUILDER
// ================================================================

// Available options per slot
const AVATAR_OPTIONS = {
  base:  ['book', 'library', 'paper', 'project'],
  eyes:  ['happy', 'cool', 'sleepy'],
  hair:  ['none', 'short', 'long', 'curly'],
  smile: ['smile', 'grin', 'neutral'],
  hat:   ['none', 'cap', 'graduation', 'beanie']
};

const AVATAR_LABELS = {
  base:  { book: '📚 Book', library: '🏛️ Library', paper: '📄 Test Paper', project: '🗂️ Project' },
  eyes:  { happy: '😊 Happy', cool: '😎 Cool', sleepy: '😴 Sleepy' },
  hair:  { none: 'None', short: 'Short', long: 'Long', curly: 'Curly' },
  smile: { smile: '🙂 Smile', grin: '😁 Grin', neutral: '😐 Neutral' },
  hat:   { none: 'None', cap: '🧢 Cap', graduation: '🎓 Grad Cap', beanie: '🪖 Beanie' }
};

let avatarConfig = { base: 'book', eyes: 'happy', hair: 'none', smile: 'smile', hat: 'none' };

function parseAvatarConfig(saved) {
  if (!saved) return { base: 'book', eyes: 'happy', hair: 'none', smile: 'smile', hat: 'none' };
  try { return JSON.parse(saved); } catch { return { base: 'book', eyes: 'happy', hair: 'none', smile: 'smile', hat: 'none' }; }
}

function renderAvatarBuilder(saved) {
  const container = document.getElementById('avatarBuilderContainer');
  if (!container) return;
  avatarConfig = parseAvatarConfig(saved);

  container.innerHTML = `
    <div class="avatar-builder">
      <div class="avatar-preview-wrap">
        <div class="avatar-preview" id="avatarPreviewSvg">${buildAvatarSVG(avatarConfig)}</div>
        <button class="btn-accent" style="margin-top:12px;" onclick="saveAvatar()">Save Avatar</button>
      </div>
      <div class="avatar-options">
        ${renderAvatarSection('base',  'Body')}
        ${renderAvatarSection('eyes',  'Eyes')}
        ${renderAvatarSection('hair',  'Hair')}
        ${renderAvatarSection('smile', 'Smile')}
        ${renderAvatarSection('hat',   'Hat')}
      </div>
    </div>
  `;
}

function renderAvatarSection(slot, label) {
  const opts = AVATAR_OPTIONS[slot];
  const labels = AVATAR_LABELS[slot];
  return `
    <div class="avatar-section">
      <div class="avatar-section-label">${label}</div>
      <div class="avatar-option-row">
        ${opts.map(opt => `
          <button class="avatar-opt-btn ${avatarConfig[slot] === opt ? 'active' : ''}"
                  onclick="setAvatarOption('${slot}','${opt}')">
            ${labels[opt]}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function setAvatarOption(slot, value) {
  avatarConfig[slot] = value;
  // Re-render the whole builder to update active states + preview
  renderAvatarBuilder(JSON.stringify(avatarConfig));
}

async function saveAvatar() {
  if (!state.user) return;
  const json = JSON.stringify(avatarConfig);
  await db.collection('users').doc(state.user.uid).update({ avatar: json });
  if (state.userData) state.userData.avatar = json;
  showToast('Avatar saved! 🎨', 'success');
}

// Build a simple SVG avatar based on config
function buildAvatarSVG(cfg) {
  const c = cfg || avatarConfig;

  // Base backgrounds
  const bases = {
    book:    '#3b82f6',
    library: '#8b5cf6',
    paper:   '#f59e0b',
    project: '#10b981'
  };
  const bg = bases[c.base] || '#3b82f6';

  // Base icon
  const baseIcon = { book: '📚', library: '🏛️', paper: '📄', project: '🗂️' }[c.base] || '📚';

  // Eyes SVG paths
  const eyeSVG = {
    happy: `<circle cx="38" cy="52" r="4" fill="#1e293b"/><circle cx="62" cy="52" r="4" fill="#1e293b"/>
            <circle cx="39.5" cy="50.5" r="1.5" fill="white"/><circle cx="63.5" cy="50.5" r="1.5" fill="white"/>`,
    cool:  `<rect x="30" y="49" width="16" height="6" rx="3" fill="#1e293b"/>
            <rect x="54" y="49" width="16" height="6" rx="3" fill="#1e293b"/>
            <line x1="46" y1="52" x2="54" y2="52" stroke="#1e293b" stroke-width="2"/>`,
    sleepy:`<path d="M34 52 Q38 48 42 52" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M58 52 Q62 48 66 52" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>`
  };

  // Smile SVG
  const smileSVG = {
    smile:   `<path d="M38 68 Q50 76 62 68" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    grin:    `<path d="M36 67 Q50 80 64 67" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M38 67 Q50 74 62 67" stroke="none" fill="#1e293b" opacity="0.1"/>`,
    neutral: `<line x1="40" y1="70" x2="60" y2="70" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>`
  };

  // Hair SVG (drawn above the face circle)
  const hairSVG = {
    none:  '',
    short: `<ellipse cx="50" cy="36" rx="20" ry="8" fill="#92400e"/>`,
    long:  `<ellipse cx="50" cy="35" rx="20" ry="8" fill="#1e293b"/>
            <rect x="30" y="40" width="8" height="22" rx="4" fill="#1e293b"/>
            <rect x="62" y="40" width="8" height="22" rx="4" fill="#1e293b"/>`,
    curly: `<ellipse cx="50" cy="34" rx="22" ry="10" fill="#b45309"/>
            <circle cx="30" cy="44" r="7" fill="#b45309"/>
            <circle cx="70" cy="44" r="7" fill="#b45309"/>
            <circle cx="40" cy="30" r="6" fill="#b45309"/>
            <circle cx="60" cy="30" r="6" fill="#b45309"/>`
  };

  // Hat SVG
  const hatSVG = {
    none:       '',
    cap:        `<rect x="28" y="38" width="44" height="10" rx="5" fill="#ef4444"/>
                 <rect x="22" y="44" width="56" height="5" rx="2.5" fill="#dc2626"/>`,
    graduation: `<rect x="26" y="40" width="48" height="8" rx="2" fill="#1e293b"/>
                 <polygon points="50,24 20,40 80,40" fill="#1e293b"/>
                 <circle cx="50" cy="24" r="3" fill="#fbbf24"/>
                 <line x1="50" y1="24" x2="68" y2="32" stroke="#fbbf24" stroke-width="1.5"/>`,
    beanie:     `<ellipse cx="50" cy="37" rx="21" ry="14" fill="#6366f1"/>
                 <ellipse cx="50" cy="37" rx="21" ry="7" fill="#4f46e5"/>
                 <circle cx="50" cy="24" r="4" fill="#a5b4fc"/>`
  };

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="120" height="120">
    <!-- Background circle with base color -->
    <circle cx="50" cy="50" r="48" fill="${bg}" opacity="0.15"/>
    <circle cx="50" cy="50" r="44" fill="${bg}" opacity="0.1"/>
    <!-- Base icon (centered, large) -->
    <text x="50" y="95" font-size="11" text-anchor="middle" fill="${bg}" opacity="0.4" font-family="system-ui">${baseIcon}</text>
    <!-- Face circle -->
    <circle cx="50" cy="58" r="26" fill="#fde68a"/>
    <!-- Hair (behind features) -->
    ${hairSVG[c.hair] || ''}
    <!-- Hat -->
    ${hatSVG[c.hat] || ''}
    <!-- Eyes -->
    ${eyeSVG[c.eyes] || eyeSVG.happy}
    <!-- Smile -->
    ${smileSVG[c.smile] || smileSVG.smile}
    <!-- Cheeks -->
    <circle cx="36" cy="63" r="4" fill="#fca5a5" opacity="0.5"/>
    <circle cx="64" cy="63" r="4" fill="#fca5a5" opacity="0.5"/>
  </svg>`;
}

// Small avatar for sidebar (no builder, just SVG)
function getSidebarAvatarSVG() {
  const cfg = parseAvatarConfig(state.userData?.avatar);
  return buildAvatarSVG(cfg);
}

// ================================================================
// TOOL CARD RENDERING
// ================================================================
function makeCard(tool) {
  const isFav = state.favorites.includes(tool.id);
  const card  = document.createElement('div');
  card.className = `app-card ${tool.color ? `color-${tool.color}` : ''}`;
  card.innerHTML = `
    <div class="card-top">
      <div class="card-icon ${tool.color ? `color-${tool.color}` : ''}">${tool.icon}</div>
      <button class="fav-btn ${isFav ? 'active' : ''}"
              onclick="event.stopPropagation(); toggleFavorite('${tool.id}')"
              title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
        ${isFav ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="card-body">
      <div class="card-title">${tool.name}</div>
      <div class="card-description">${tool.description}</div>
    </div>
    <div class="card-footer">
      <span class="card-badge badge-${tool.type}">${tool.type}</span>
      <span class="card-arrow">→</span>
    </div>
  `;
  card.addEventListener('click', () => openTool(tool));
  return card;
}

function renderAppGrid() {
  const grid = document.getElementById('appGrid');
  if (!grid) return;
  grid.innerHTML = '';
  state.tools.forEach(t => grid.appendChild(makeCard(t)));
}

function renderFavoritesGrid() {
  const grid = document.getElementById('favoritesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const favs = state.tools.filter(t => state.favorites.includes(t.id));
  if (favs.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⭐</div>
      <p>No favorites yet. Heart any tool from the Dashboard to pin it here.</p>
    </div>`;
    return;
  }
  favs.forEach(t => grid.appendChild(makeCard(t)));
}

function filterTools(query) {
  const grid = document.getElementById('appGrid');
  if (!grid) return;
  const q = query.toLowerCase().trim();
  grid.innerHTML = '';
  const filtered = q
    ? state.tools.filter(t =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    : state.tools;
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No tools match "${query}"</p></div>`;
    return;
  }
  filtered.forEach(t => grid.appendChild(makeCard(t)));
}

// ================================================================
// FAVORITES TOGGLE
// ================================================================
async function toggleFavorite(toolId) {
  if (!state.user) { showToast('Log in to save favorites.', 'warning'); return; }
  const idx = state.favorites.indexOf(toolId);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
    showToast('Removed from favorites', 'info');
  } else {
    state.favorites.push(toolId);
    showToast('Added to favorites ❤️', 'success');
  }
  try {
    await db.collection('users').doc(state.user.uid).update({ favorites: state.favorites });
  } catch { /* offline */ }
  renderAppGrid();
  renderFavoritesGrid();
}

// ================================================================
// TOOL LAUNCHER
// ================================================================
function openTool(tool) {
  state.currentTool = tool;
  switch (tool.type) {
    case 'built-in':
      openModal(tool.modalContent);
      break;
    case 'iframe':
      openModal('__iframe__', tool.url, tool.name);
      break;
    case 'external':
      window.open(tool.url, '_blank');
      break;
    case 'mock-api':
      openModal(tool.modalContent);
      break;
    default:
      showToast('Unknown tool type.', 'error');
  }
}

// ================================================================
// MODAL
// ================================================================
function openModal(contentKey, iframeUrl, toolName) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  if (!overlay || !content) return;

  if (contentKey === '__iframe__') {
    content.innerHTML = `
      <div class="iframe-modal-header">
        <strong>${toolName}</strong>
        <a href="${iframeUrl}" target="_blank" class="btn-secondary" style="font-size:0.78rem;padding:6px 12px;">
          Open in new tab ↗
        </a>
      </div>
      <div class="iframe-wrapper">
        <iframe src="${iframeUrl}" allowfullscreen loading="lazy"></iframe>
      </div>`;
  } else {
    switch (contentKey) {
      case 'flashcards': renderFlashcards(content); break;
      case 'pomodoro':   renderPomodoro(content);   break;
      case 'duolingo':   renderDuolingo(content);   break;
      case 'todo':       renderTodo(content);        break;
      default:           content.innerHTML = `<p>Tool not found.</p>`;
    }
  }

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  // Stop any running pomodoro timer
  if (window._pomInterval) { clearInterval(window._pomInterval); window._pomInterval = null; }
  overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ================================================================
// BUILT-IN TOOL: FLASHCARDS
// ================================================================
const flashcardDeck = [
  { q: 'What is the capital of France?',           a: 'Paris',              hint: 'City of Love 🇫🇷' },
  { q: 'What is 2 + 2?',                           a: '4',                  hint: 'Basic math' },
  { q: 'What planet is closest to the Sun?',       a: 'Mercury',            hint: 'Inner solar system' },
  { q: 'Who wrote Romeo and Juliet?',              a: 'William Shakespeare', hint: 'The Bard' },
  { q: 'What is H₂O?',                             a: 'Water',              hint: 'Two hydrogen, one oxygen' },
  { q: 'In what year did WWII end?',               a: '1945',               hint: 'VE Day & VJ Day' },
  { q: 'What is the speed of light (approx)?',     a: '~300,000 km/s',      hint: 'Einstein\'s constant c' },
  { q: 'What is the powerhouse of the cell?',      a: 'Mitochondria',       hint: 'Biology meme 😄' },
  { q: 'What is the square root of 144?',          a: '12',                 hint: '12 × 12' },
  { q: 'What language is spoken in Brazil?',       a: 'Portuguese',         hint: 'Not Spanish!' },
];

let fcIndex = 0;

function renderFlashcards(container) {
  fcIndex = 0;
  container.innerHTML = `
    <div class="flashcard-tool">
      <div class="fc-controls">
        <input type="text" id="fcSearch" placeholder="Search cards..." oninput="fcFilter(this.value)">
        <button class="btn-accent" onclick="fcShuffle()">🔀 Shuffle</button>
      </div>
      <div class="fc-deck-tabs">
        <button class="fc-deck-tab active">All (${flashcardDeck.length})</button>
        <button class="fc-deck-tab" onclick="showToast('Custom decks coming soon!','info')">Math</button>
        <button class="fc-deck-tab" onclick="showToast('Custom decks coming soon!','info')">Science</button>
      </div>
      <div class="fc-card-stage" onclick="flipCard()">
        <div class="fc-card-inner" id="fcCardInner">
          <div class="fc-card-face fc-front">
            <span class="fc-card-label">Question</span>
            <div class="fc-card-content" id="fcQuestion">${flashcardDeck[0].q}</div>
          </div>
          <div class="fc-card-face fc-back">
            <span class="fc-card-label">Answer</span>
            <div class="fc-card-content" id="fcAnswer">${flashcardDeck[0].a}</div>
            <span class="fc-card-hint" id="fcHint">${flashcardDeck[0].hint}</span>
          </div>
        </div>
      </div>
      <div class="fc-nav">
        <button class="fc-nav-btn" onclick="fcPrev()">←</button>
        <span class="fc-progress-text" id="fcProgress">1 / ${flashcardDeck.length}</span>
        <button class="fc-nav-btn" onclick="fcNext()">→</button>
      </div>
      <div class="fc-progress-bar">
        <div class="fc-progress-fill" id="fcProgressFill" style="width:${100/flashcardDeck.length}%"></div>
      </div>
    </div>`;
}

function fcUpdateCard() {
  const card = flashcardDeck[fcIndex];
  document.getElementById('fcQuestion').textContent = card.q;
  document.getElementById('fcAnswer').textContent   = card.a;
  document.getElementById('fcHint').textContent     = card.hint;
  document.getElementById('fcProgress').textContent = `${fcIndex + 1} / ${flashcardDeck.length}`;
  document.getElementById('fcProgressFill').style.width = `${((fcIndex + 1) / flashcardDeck.length) * 100}%`;
  const inner = document.getElementById('fcCardInner');
  if (inner) inner.classList.remove('flipped');
}

function flipCard() {
  document.getElementById('fcCardInner')?.classList.toggle('flipped');
}

function fcNext() { fcIndex = (fcIndex + 1) % flashcardDeck.length; fcUpdateCard(); }
function fcPrev() { fcIndex = (fcIndex - 1 + flashcardDeck.length) % flashcardDeck.length; fcUpdateCard(); }
function fcShuffle() {
  for (let i = flashcardDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flashcardDeck[i], flashcardDeck[j]] = [flashcardDeck[j], flashcardDeck[i]];
  }
  fcIndex = 0; fcUpdateCard();
  showToast('Deck shuffled! 🔀', 'success');
}
function fcFilter(q) {
  // Just a UX hint for now
  if (q) showToast(`Searching for "${q}"…`, 'info', 1200);
}

// ================================================================
// BUILT-IN TOOL: POMODORO
// ================================================================
const pomSessions = { pomodoro: 25 * 60, short: 5 * 60, long: 15 * 60 };
let pomState = { session: 'pomodoro', remaining: 25 * 60, running: false, totalSessions: 0, totalFocus: 0 };

function renderPomodoro(container) {
  pomState = { session: 'pomodoro', remaining: 25 * 60, running: false, totalSessions: 0, totalFocus: 0 };
  container.innerHTML = `
    <div class="pomodoro-tool">
      <div class="pom-tabs">
        <button class="pom-tab active" id="ptPomodoro" onclick="setPomSession('pomodoro')">Pomodoro</button>
        <button class="pom-tab" id="ptShort"    onclick="setPomSession('short')">Short Break</button>
        <button class="pom-tab" id="ptLong"     onclick="setPomSession('long')">Long Break</button>
      </div>
      <div class="pom-ring-wrap">
        <svg class="pom-svg" viewBox="0 0 100 100">
          <circle class="pom-track" cx="50" cy="50" r="45"/>
          <circle class="pom-fill"  cx="50" cy="50" r="45" id="pomFill"/>
        </svg>
        <div class="pom-time-label">
          <span class="pom-time" id="pomTime">25:00</span>
          <span class="pom-session-label" id="pomLabel">Focus Time</span>
        </div>
      </div>
      <div class="pom-btns">
        <button class="pom-btn-secondary" onclick="resetPomodoro()" title="Reset">↺</button>
        <button class="pom-btn-main" id="pomPlayBtn" onclick="togglePomodoro()">▶</button>
        <button class="pom-btn-secondary" onclick="skipPomodoro()" title="Skip">⏭</button>
      </div>
      <div class="pom-stats">
        <div class="pom-stat">
          <span class="pom-stat-val" id="pomSessions">0</span>
          <span class="pom-stat-lbl">Sessions</span>
        </div>
        <div class="pom-stat">
          <span class="pom-stat-val" id="pomFocusMin">0</span>
          <span class="pom-stat-lbl">Mins Focused</span>
        </div>
      </div>
    </div>`;
  pomRenderTime();
}

function pomRenderTime() {
  const m = Math.floor(pomState.remaining / 60);
  const s = pomState.remaining % 60;
  const el = document.getElementById('pomTime');
  if (el) el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const total    = pomSessions[pomState.session];
  const progress = 1 - pomState.remaining / total;
  const circ     = 2 * Math.PI * 45; // 282.74
  const fill     = document.getElementById('pomFill');
  if (fill) fill.style.strokeDashoffset = circ * (1 - progress);
}

function setPomSession(session) {
  if (window._pomInterval) { clearInterval(window._pomInterval); window._pomInterval = null; }
  pomState.session   = session;
  pomState.remaining = pomSessions[session];
  pomState.running   = false;
  const labels = { pomodoro: 'Focus Time', short: 'Short Break', long: 'Long Break' };
  const labelEl = document.getElementById('pomLabel');
  if (labelEl) labelEl.textContent = labels[session];
  const btn = document.getElementById('pomPlayBtn');
  if (btn) btn.textContent = '▶';
  document.querySelectorAll('.pom-tab').forEach(t => t.classList.remove('active'));
  const map = { pomodoro: 'ptPomodoro', short: 'ptShort', long: 'ptLong' };
  document.getElementById(map[session])?.classList.add('active');
  pomRenderTime();
}

function togglePomodoro() {
  pomState.running = !pomState.running;
  const btn = document.getElementById('pomPlayBtn');
  if (btn) btn.textContent = pomState.running ? '⏸' : '▶';
  if (pomState.running) {
    window._pomInterval = setInterval(() => {
      pomState.remaining--;
      if (pomState.session === 'pomodoro') pomState.totalFocus++;
      pomRenderTime();
      const focEl = document.getElementById('pomFocusMin');
      if (focEl) focEl.textContent = Math.floor(pomState.totalFocus / 60);
      if (pomState.remaining <= 0) {
        clearInterval(window._pomInterval);
        window._pomInterval = null;
        pomState.running = false;
        if (pomState.session === 'pomodoro') {
          pomState.totalSessions++;
          const sEl = document.getElementById('pomSessions');
          if (sEl) sEl.textContent = pomState.totalSessions;
          showToast('🎉 Session complete! Take a break.', 'success', 5000);
          setPomSession('short');
        } else {
          showToast('Break over — back to work! 💪', 'info', 3000);
          setPomSession('pomodoro');
        }
      }
    }, 1000);
  } else {
    if (window._pomInterval) { clearInterval(window._pomInterval); window._pomInterval = null; }
  }
}

function resetPomodoro() {
  if (window._pomInterval) { clearInterval(window._pomInterval); window._pomInterval = null; }
  pomState.remaining = pomSessions[pomState.session];
  pomState.running   = false;
  const btn = document.getElementById('pomPlayBtn');
  if (btn) btn.textContent = '▶';
  pomRenderTime();
}

function skipPomodoro() {
  if (window._pomInterval) { clearInterval(window._pomInterval); window._pomInterval = null; }
  pomState.running = false;
  pomState.remaining = 0;
  pomRenderTime();
  setTimeout(() => {
    if (pomState.session === 'pomodoro') {
      pomState.totalSessions++;
      const sEl = document.getElementById('pomSessions');
      if (sEl) sEl.textContent = pomState.totalSessions;
      setPomSession('short');
    } else {
      setPomSession('pomodoro');
    }
  }, 300);
}

// ================================================================
// BUILT-IN TOOL: DUOLINGO TRACKER (mock)
// ================================================================
function renderDuolingo(container) {
  const nick = state.userData?.nickname || 'Learner';
  container.innerHTML = `
    <div class="duo-widget">
      <div class="duo-header">
        <div class="duo-avatar">🦉</div>
        <div>
          <div class="duo-username">${nick}</div>
          <div class="duo-league">Diamond League</div>
        </div>
      </div>
      <div class="duo-stats-grid">
        <div class="duo-stat-card">
          <div class="duo-stat-icon">🔥</div>
          <div class="duo-stat-val">12</div>
          <div class="duo-stat-lbl">Day Streak</div>
        </div>
        <div class="duo-stat-card">
          <div class="duo-stat-icon">⭐</div>
          <div class="duo-stat-val">1,250</div>
          <div class="duo-stat-lbl">XP</div>
        </div>
        <div class="duo-stat-card">
          <div class="duo-stat-icon">📚</div>
          <div class="duo-stat-val">5</div>
          <div class="duo-stat-lbl">Lessons Today</div>
        </div>
      </div>
      <div class="duo-week">
        <div class="duo-week-title">Weekly XP</div>
        <div class="duo-bars">
          ${[['Mon',30],['Tue',45],['Wed',60],['Thu',80],['Fri',50],['Sat',90],['Sun',20]].map(
            ([day, pct], i) => `
            <div class="duo-bar-wrap">
              <div class="duo-bar ${i === 5 ? 'today' : ''}" style="height:${pct}%"></div>
              <span class="duo-bar-day">${day}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="duo-connect-note">
        <span>🔗</span><span>Connect your Duolingo account to sync real data.</span>
      </div>
    </div>`;
}

// ================================================================
// BUILT-IN TOOL: STUDY TO-DO
// ================================================================
let todos = JSON.parse(localStorage.getItem('sv_todos') || '[]');

function renderTodo(container) {
  function refresh() {
    const list = document.getElementById('todoList');
    if (!list) return;
    list.innerHTML = todos.length === 0
      ? `<div class="empty-state" style="padding:24px"><div class="empty-icon">✅</div><p>Nothing to do!</p></div>`
      : todos.map((item, i) => `
          <div class="todo-item ${item.done ? 'done' : ''}">
            <button class="todo-check" onclick="todoDone(${i})">${item.done ? '✅' : '⬜'}</button>
            <span class="todo-text">${item.text}</span>
            <button class="todo-del" onclick="todoDel(${i})">🗑️</button>
          </div>`).join('');
  }

  container.innerHTML = `
    <div class="todo-tool">
      <div class="todo-add-row">
        <input type="text" id="todoInput" class="settings-input" style="flex:1;width:auto;"
               placeholder="Add a task…" onkeydown="if(event.key==='Enter')todoAdd()">
        <button class="btn-accent" onclick="todoAdd()">Add</button>
      </div>
      <div id="todoList"></div>
      <div class="todo-footer">
        <span id="todoDoneCount"></span>
        <button class="btn-secondary" onclick="todoClearDone()" style="font-size:0.78rem;padding:6px 12px;">
          Clear done
        </button>
      </div>
    </div>`;

  function updateFooter() {
    const done = todos.filter(t => t.done).length;
    const el   = document.getElementById('todoDoneCount');
    if (el) el.textContent = `${done} / ${todos.length} done`;
  }

  window.todoAdd = () => {
    const inp = document.getElementById('todoInput');
    const txt = inp?.value?.trim();
    if (!txt) return;
    todos.push({ text: txt, done: false });
    localStorage.setItem('sv_todos', JSON.stringify(todos));
    inp.value = '';
    refresh(); updateFooter();
  };
  window.todoDone = (i) => {
    todos[i].done = !todos[i].done;
    localStorage.setItem('sv_todos', JSON.stringify(todos));
    refresh(); updateFooter();
  };
  window.todoDel = (i) => {
    todos.splice(i, 1);
    localStorage.setItem('sv_todos', JSON.stringify(todos));
    refresh(); updateFooter();
  };
  window.todoClearDone = () => {
    todos = todos.filter(t => !t.done);
    localStorage.setItem('sv_todos', JSON.stringify(todos));
    refresh(); updateFooter();
  };

  refresh(); updateFooter();
}

// ================================================================
// VIEW SWITCHING (dashboard)
// ================================================================
function setupDashboardListeners() {
  // Nav items with data-view
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      const view = item.dataset.view;
      if (!view) return;
      state.currentView = view;
      document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
      document.getElementById(view)?.classList.remove('hidden');
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Modal close
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('modalOverlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ================================================================
// BOOT — runs based on which page we're on
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme/accent to swatches on settings page
  if (IS_SETTINGS) {
    const saved = localStorage.getItem('accent') || 'sky';
    document.querySelectorAll('.color-swatch').forEach(s =>
      s.classList.toggle('active', s.dataset.accent === saved));
  }

  if (IS_LOGIN)    initLogin();
  else if (IS_SETTINGS) initSettings();
  else             initDashboard();
});
