# ⭐ StudyVerse — Your Educational Universe

A unified educational launcher hub. Clean, modular, and built to grow.
Deployed at **https://thestudyverse.pages.dev** via Cloudflare Pages.

---

## 📁 File Structure

```
studyverse/
├── index.html          ← Main dashboard (requires auth)
├── login.html          ← Login / Sign-up page
├── settings.html       ← User profile & appearance settings
├── styles/
│   └── main.css        ← All CSS variables, themes, components
├── scripts/
│   └── app.js          ← Firebase auth + tool logic (single file)
├── assets/             ← Future: avatars, logos
├── wrangler.jsonc      ← Optional: CLI deployment config
└── README.md
```

---

## 🔥 Firebase Setup (Required before deploying)

### 1. Create a Firebase project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `studyverse` → Continue

### 2. Enable Authentication providers
In the Firebase console: **Authentication → Sign-in method**
- Enable **Google**
- Enable **Email/Password**
- Enable **Microsoft** (requires Azure app registration)
- Enable **Apple** (requires Apple Developer account + Service ID)

Add `thestudyverse.pages.dev` to **Authorized domains**.

### 3. Create a Firestore database
1. Go to **Firestore Database → Create database**
2. Start in **test mode** (you'll tighten rules later)
3. Choose a region close to your users

### 4. Set Firestore security rules
In **Firestore → Rules**, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Copy your Firebase config into app.js
In **Project Settings → Your Apps → Web App**, copy your config and replace the placeholders in `scripts/app.js`:
```js
const firebaseConfig = {
  apiKey:            "AIzaSy...",
  authDomain:        "studyverse-xxxx.firebaseapp.com",
  projectId:         "studyverse-xxxx",
  storageBucket:     "studyverse-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abcdef"
};
```

---

## 🚀 Deploying to Cloudflare Pages

### Option A — GitHub (Recommended)
1. Push this folder to a GitHub repository
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a project**
3. Connect your GitHub repo
4. **Build settings:** leave blank (no build command, no output directory)
5. Click **Save and Deploy**
6. Under **Custom Domains**, add `thestudyverse.pages.dev`

### Option B — Wrangler CLI
```bash
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name=thestudyverse
```

---

## ➕ How to Add a New Tool

Open `scripts/app.js` and find the `state.tools` array. Append one object:

```js
{
  id:           'khan-academy',           // unique ID, no spaces
  name:         'Khan Academy',           // card title
  description:  'Free world-class education for anyone.',
  icon:         '🎓',                     // emoji
  type:         'external',              // 'built-in' | 'iframe' | 'external' | 'mock-api'
  url:          'https://khanacademy.org',// for iframe / external
  color:        'green',                 // color-blue|purple|green|orange|pink|amber|teal
}
```

For `type: 'built-in'`, also add a `modalContent: 'my-key'` field and a matching `renderMyKey()` function that populates `#modalContent`.

**That's it.** The grid re-renders automatically.

---

## 🎨 Themes & Accent Colors

Themes are stored in `localStorage` (`theme` and `accent` keys) and applied as `data-theme` / `data-accent` attributes on `<html>`.

**To add a new accent color:**
1. Add a CSS block in `styles/main.css`:
```css
[data-accent="mycolor"] {
  --accent:       #hexvalue;
  --accent-dim:   rgba(r, g, b, 0.12);
  --accent-hover: #lighterHex;
  --accent-glow:  rgba(r, g, b, 0.20);
}
```
2. Add a swatch button in `settings.html`:
```html
<button class="color-swatch" data-accent="mycolor"
        onclick="setAccent('mycolor')" style="background:#hexvalue;"></button>
```

---

## 🤖 AI Flashcard Generation

The flashcard tool has a "Generate with AI" button. To make it work:
1. Create a Cloudflare Worker that proxies requests to `api.anthropic.com/v1/messages`
2. Replace the placeholder `showToast(...)` in `renderFlashcards()` with a `fetch()` call to your Worker
3. Parse the returned JSON into `flashcardDeck` entries

A minimal Cloudflare Worker proxy is ~20 lines. Ask Claude for one when you're ready.

---

## 📋 Roadmap Ideas

- [ ] AI flashcard generation via Cloudflare Worker proxy
- [ ] Real-time Firestore deck storage (create/edit/delete decks)
- [ ] Spaced repetition algorithm (SM-2)
- [ ] Firebase Storage avatar uploads
- [ ] Community deck browser (public decks feed)
- [ ] Progress charts per subject
- [ ] Real Duolingo API connection
- [ ] Claude AI tutor chat panel in sidebar
- [ ] YouTube player embed tool
- [ ] Google Calendar integration
- [ ] Mobile app (Capacitor / Expo wrapper)

---

Built with vanilla HTML, CSS, and JavaScript. No frameworks. No build step.
