// ================================================================
// STUDYVERSE - Main App Script
// Handles:
// 1. Firebase Auth (Google, Apple, Microsoft, Email/Password)
// 2. User State (Nickname, Favorites, etc.)
// 3. Tool Launcher (Flashcards, Pomodoro, etc.)
// ================================================================

// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== Global State =====
const state = {
  currentView: 'dashboard',
  currentTool: null,
  user: null,
  userData: null,
  tools: [
    {
      id: 'flashcards',
      name: 'Flashcards',
      description: 'Create and study digital flashcards.',
      icon: '📚',
      type: 'built-in',
      modalContent: 'flashcards',
      color: 'blue'
    },
    {
      id: 'time-budgeter',
      name: 'Time Budgeter',
      description: 'Pomodoro timer for focused study sessions.',
      icon: '⏳',
      type: 'built-in',
      modalContent: 'pomodoro',
      color: 'violet'
    },
    {
      id: 'desmos',
      name: 'Desmos Graphing',
      description: 'Advanced graphing calculator.',
      icon: '📈',
      type: 'iframe',
      url: 'https://www.desmos.com/calculator',
      color: 'emerald'
    },
    {
      id: 'notebooklm',
      name: 'Google NotebookLM',
      description: 'AI-powered notebook for learning.',
      icon: '📓',
      type: 'external',
      url: 'https://notebooklm.google',
      color: 'amber'
    },
    {
      id: 'duolingo-tracker',
      name: 'Duolingo Tracker',
      description: 'Track your language learning progress.',
      icon: '🦉',
      type: 'mock-api',
      modalContent: 'duolingo',
      color: 'rose'
    },
  ],
  favorites: [],
};

// ===== DOM Elements =====
const appGrid = document.getElementById('appGrid');
const favoritesGrid = document.getElementById('favoritesGrid');
const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const modalClose = document.getElementById('modalClose');
const navItems = document.querySelectorAll('.nav-item');
const userGreeting = document.getElementById('userGreeting');

// ===== Initialize App =====
function init() {
  // Check auth state
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      state.user = user;
      // Fetch user data from Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      if (userDoc.exists) {
        state.userData = userDoc.data();
        state.favorites = state.userData.favorites || [];
      } else {
        // New user: prompt for nickname
        const nickname = prompt("Welcome to StudyVerse! Please choose a nickname:");
        if (nickname) {
          await db.collection('users').doc(user.uid).set({
            nickname: nickname,
            username: user.email.split('@')[0],
            avatar: "https://via.placeholder.com/150", // Default avatar
            favorites: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          state.userData = { nickname, username: user.email.split('@')[0], favorites: [] };
        }
      }
      // Update UI
      updateGreeting();
      renderAppGrid();
      renderFavoritesGrid();
      setupEventListeners();
    } else {
      // Not logged in: redirect to login
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
      }
    }
  });
}

// ===== Update Greeting =====
function updateGreeting() {
  if (state.userData?.nickname) {
    userGreeting.textContent = `Hi ${state.userData.nickname}!`;
  }
}

// ===== Firebase Auth Functions =====
// Login with Google
function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then((result) => handleNewUser(result.user))
    .catch((error) => console.error(error));
}

// Login with Apple
function loginWithApple() {
  const provider = new firebase.auth.OAuthProvider('apple.com');
  auth.signInWithPopup(provider)
    .then((result) => handleNewUser(result.user))
    .catch((error) => console.error(error));
}

// Login with Microsoft
function loginWithMicrosoft() {
  const provider = new firebase.auth.OAuthProvider('microsoft.com');
  auth.signInWithPopup(provider)
    .then((result) => handleNewUser(result.user))
    .catch((error) => console.error(error));
}

// Handle new user (check for nickname)
async function handleNewUser(user) {
  const userDoc = await db.collection('users').doc(user.uid).get();
  if (!userDoc.exists || !userDoc.data().nickname) {
    const nickname = prompt("Welcome to StudyVerse! Please choose a nickname:");
    if (nickname) {
      await db.collection('users').doc(user.uid).set({
        nickname: nickname,
        username: user.email.split('@')[0],
        avatar: "https://via.placeholder.com/150",
        favorites: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  window.location.href = 'index.html';
}

// Email/Password Login
document.addEventListener('DOMContentLoaded', () => {
  const emailForm = document.getElementById('emailLoginForm');
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = 'index.html')
        .catch((error) => alert(error.message));
    });
  }
});

// Sign Up with Email/Password
function showSignup() {
  const email = prompt("Enter your email:");
  const password = prompt("Enter a password:");
  if (email && password) {
    auth.createUserWithEmailAndPassword(email, password)
      .then((result) => handleNewUser(result.user))
      .catch((error) => alert(error.message));
  }
}

// Forgot Password
function forgotPassword() {
  const email = prompt("Enter your email to reset password:");
  if (email) {
    auth.sendPasswordResetEmail(email)
      .then(() => alert("Password reset email sent!"))
      .catch((error) => alert(error.message));
  }
}

// Logout
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'login.html';
  });
}

// ===== Settings Functions =====
// Update Nickname
async function updateNickname() {
  if (!state.user) return;
  const nickname = document.getElementById('nicknameInput').value;
  if (nickname) {
    await db.collection('users').doc(state.user.uid).update({
      nickname: nickname
    });
    state.userData.nickname = nickname;
    updateGreeting();
    alert("Nickname updated!");
  }
}

// Update Username
async function updateUsername() {
  if (!state.user) return;
  const username = document.getElementById('usernameInput').value;
  if (username) {
    await db.collection('users').doc(state.user.uid).update({
      username: username
    });
    state.userData.username = username;
    alert("Username updated!");
  }
}

// Update Avatar (Placeholder: No actual upload yet)
async function updateAvatar() {
  if (!state.user) return;
  const fileInput = document.getElementById('avatarInput');
  if (fileInput.files.length > 0) {
    // TODO: Implement Firebase Storage upload
    alert("Avatar upload coming soon! For now, we'll use a placeholder.");
    await db.collection('users').doc(state.user.uid).update({
      avatar: "https://via.placeholder.com/150" // Replace with actual URL later
    });
  }
}

// Change Password
async function changePassword() {
  if (!state.user) return;
  const newPassword = prompt("Enter new password:");
  if (newPassword) {
    try {
      await state.user.updatePassword(newPassword);
      alert("Password updated!");
    } catch (error) {
      alert(error.message);
    }
  }
}

// Set Theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Set Accent Color
function setAccent(accent) {
  document.documentElement.setAttribute('data-accent', accent);
  localStorage.setItem('accent', accent);
  // Update active class on swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.toggle('active', swatch.dataset.accent === accent);
  });
}

// ===== Existing Tool Functions (From Claude's Code) =====
// Render App Grid
function renderAppGrid() {
  if (!appGrid) return;
  appGrid.innerHTML = '';
  state.tools.forEach(tool => {
    const card = document.createElement('div');
    card.className = `app-card ${tool.color ? `color-${tool.color}` : ''}`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon ${tool.color ? `color-${tool.color}` : ''}">${tool.icon}</div>
        <button class="fav-btn ${state.favorites.includes(tool.id) ? 'active' : ''}"
                onclick="event.stopPropagation(); toggleFavorite('${tool.id}')">
          ❤️
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
    appGrid.appendChild(card);
  });
}

// Render Favorites Grid
function renderFavoritesGrid() {
  if (!favoritesGrid) return;
  favoritesGrid.innerHTML = '';
  const favoriteTools = state.tools.filter(tool => state.favorites.includes(tool.id));
  if (favoriteTools.length === 0) {
    favoritesGrid.innerHTML = '<div class="empty-state"><div class="empty-icon">⭐</div><p>No favorites yet. Add tools to your favorites from the Dashboard!</p></div>';
    return;
  }
  favoriteTools.forEach(tool => {
    const card = document.createElement('div');
    card.className = `app-card ${tool.color ? `color-${tool.color}` : ''}`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-icon ${tool.color ? `color-${tool.color}` : ''}">${tool.icon}</div>
        <button class="fav-btn active" onclick="event.stopPropagation(); toggleFavorite('${tool.id}')">❤️</button>
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
    favoritesGrid.appendChild(card);
  });
}

// Toggle Favorite
function toggleFavorite(toolId) {
  if (!state.user) {
    alert("Please log in to favorite tools!");
    return;
  }
  const index = state.favorites.indexOf(toolId);
  if (index > -1) {
    state.favorites.splice(index, 1);
  } else {
    state.favorites.push(toolId);
  }
  // Update Firestore
  db.collection('users').doc(state.user.uid).update({
    favorites: state.favorites
  });
  renderAppGrid();
  renderFavoritesGrid();
}

// Open Tool
function openTool(tool) {
  state.currentTool = tool;
  switch (tool.type) {
    case 'built-in':
      openModal(tool.modalContent);
      break;
    case 'iframe':
      openModal(`
        <div class="iframe-wrapper">
          <iframe src="${tool.url}" allowfullscreen></iframe>
        </div>
      `);
      break;
    case 'external':
      window.open(tool.url, '_blank');
      break;
    case 'mock-api':
      openModal(`
        <div class="duo-widget">
          <div class="duo-header">
            <div class="duo-avatar">🦉</div>
            <div>
              <div class="duo-username">${state.userData?.nickname || 'User'}</div>
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
              <div class="duo-bar-wrap"><div class="duo-bar" style="height: 30%;"></div><span class="duo-bar-day">Mon</span></div>
              <div class="duo-bar-wrap"><div class="duo-bar" style="height: 45%;"></div><span class="duo-bar-day">Tue</span></div>
              <div class="duo-bar-wrap"><div class="duo-bar" style="height: 60%;"></div><span class="duo-bar-day">Wed</span></div>
              <div class="duo-bar-wrap"><div class="duo-bar" style="height: 80%;"></div><span class="duo-bar-day">Thu</span></div>
              <div class="duo-bar-wrap"><div class="duo-bar" style="height: 50%;"></div><span class="duo-bar-day">Fri</span></div>
              <div class="duo-bar-wrap"><div class="duo-bar today" style="height: 90%;"></div><span class="duo-bar-day">Sat</span></div>
              <div class="duo-bar-wrap"><div class="duo-bar" style="height: 20%;"></div><span class="duo-bar-day">Sun</span></div>
            </div>
          </div>
          <div class="duo-connect-note">
            <span>🔗</span>
            <span>Connect your Duolingo account to sync real data.</span>
          </div>
        </div>
      `);
      break;
    default:
      console.error('Unknown tool type:', tool.type);
  }
}

// Open Modal
function openModal(content) {
  if (!modalOverlay || !modalContent) return;
  modalContent.innerHTML = content;
  modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  // Initialize tool-specific logic
  if (content === 'flashcards') renderFlashcards();
  else if (content === 'pomodoro') renderPomodoro();
}

// Close Modal
function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// Render Flashcards (Placeholder)
function renderFlashcards() {
  modalContent.innerHTML = `
    <div class="flashcard-tool">
      <div class="fc-controls">
        <input type="text" placeholder="Search decks...">
        <select>
          <option>My Decks</option>
          <option>Shared Decks</option>
        </select>
        <button class="btn-secondary">New Deck</button>
        <button class="btn-accent">Generate with AI</button>
      </div>
      <div class="fc-ai-status" id="aiStatus">
        <div class="fc-spinner"></div>
        <span>Generating flashcards...</span>
      </div>
      <div class="fc-deck-tabs">
        <button class="fc-deck-tab active">All</button>
        <button class="fc-deck-tab">Math</button>
        <button class="fc-deck-tab">Science</button>
        <button class="fc-deck-tab">History</button>
      </div>
      <div class="fc-card-stage">
        <div class="fc-card-inner" onclick="flipCard()">
          <div class="fc-card-face fc-front">
            <span class="fc-card-label">Question</span>
            <div class="fc-card-content">What is the capital of France?</div>
          </div>
          <div class="fc-card-face fc-back">
            <span class="fc-card-label">Answer</span>
            <div class="fc-card-content">Paris</div>
            <span class="fc-card-hint">Hint: City of Love 🇫🇷</span>
          </div>
        </div>
      </div>
      <div class="fc-nav">
        <button class="fc-nav-btn" onclick="prevCard()">←</button>
        <span class="fc-progress-text">1 / 10</span>
        <button class="fc-nav-btn" onclick="nextCard()">→</button>
      </div>
      <div class="fc-progress-bar">
        <div class="fc-progress-fill" style="width: 10%;"></div>
      </div>
      <div class="fc-publish-row">
        <input type="text" placeholder="Deck name...">
        <button class="btn-secondary">Save</button>
        <button class="btn-accent">Publish</button>
      </div>
    </div>
  `;
}

// Render Pomodoro (Placeholder)
function renderPomodoro() {
  modalContent.innerHTML = `
    <div class="pomodoro-tool">
      <div class="pom-tabs">
        <button class="pom-tab active" onclick="setPomSession('pomodoro')">Pomodoro</button>
        <button class="pom-tab" onclick="setPomSession('short')">Short Break</button>
        <button class="pom-tab" onclick="setPomSession('long')">Long Break</button>
      </div>
      <div class="pom-ring-wrap">
        <svg class="pom-svg" viewBox="0 0 100 100">
          <circle class="pom-track" cx="50" cy="50" r="45"></circle>
          <circle class="pom-fill" cx="50" cy="50" r="45" style="stroke-dashoffset: 0;"></circle>
        </svg>
        <div class="pom-time-label">
          <span class="pom-time" id="pomTime">25:00</span>
          <span class="pom-session-label" id="pomSessionLabel">Focus Time</span>
        </div>
      </div>
      <div class="pom-btns">
        <button class="pom-btn-secondary" onclick="resetPomodoro()">↻</button>
        <button class="pom-btn-main" onclick="togglePomodoro()">▶️</button>
        <button class="pom-btn-secondary" onclick="skipPomodoro()">⏭️</button>
      </div>
      <div class="pom-stats">
        <div class="pom-stat">
          <span class="pom-stat-val" id="pomSessions">0</span>
          <span class="pom-stat-lbl">Sessions</span>
        </div>
        <div class="pom-stat">
          <span class="pom-stat-val" id="pomFocusTime">0</span>
          <span class="pom-stat-lbl">Minutes Focused</span>
        </div>
      </div>
      <div class="pom-settings">
        <label>
          <span>Pomodoro (min)</span>
          <input type="number" value="25" min="1" max="60">
        </label>
        <label>
          <span>Short Break (min)</span>
          <input type="number" value="5" min="1" max="60">
        </label>
        <label>
          <span>Long Break (min)</span>
          <input type="number" value="15" min="1" max="60">
        </label>
      </div>
    </div>
  `;
}

// ===== View Switching =====
function setupEventListeners() {
  // Nav items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view) {
        state.currentView = view;
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        document.getElementById(view).classList.remove('hidden');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
      }
    });
  });

  // Modal close
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ===== Initialize on Load =====
document.addEventListener('DOMContentLoaded', init);

// ===== Load Theme/Accent from LocalStorage =====
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const savedAccent = localStorage.getItem('accent') || 'sky';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-accent', savedAccent);
  // Update active accent swatch
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.classList.toggle('active', swatch.dataset.accent === savedAccent);
  });
});