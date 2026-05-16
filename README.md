# ✦ StudyVerse — Your Study Universe

A unified educational launcher hub. Clean, modular, and built to grow.

---

## 🚀 Recommended Deployment: Cloudflare Pages

**studyverse.dev** is a perfect domain for this. Here's why Cloudflare Pages is the best free choice over GitHub Pages:

| Feature               | Cloudflare Pages | GitHub Pages |
|-----------------------|-----------------|--------------|
| Free custom domain    | ✅ Yes           | ✅ Yes        |
| Global CDN (200+ PoPs)| ✅ Yes           | ⚠️ Limited   |
| Unlimited bandwidth   | ✅ Yes           | ⚠️ Capped    |
| Instant cache purge   | ✅ Yes           | ❌ No         |
| Deploy from Git       | ✅ Yes           | ✅ Yes        |
| Deploy time           | ~10 seconds     | ~1-2 minutes |
| Free SSL              | ✅ Yes           | ✅ Yes        |

### Deploy Steps
1. Push your 3 files (`index.html`, `styles.css`, `app.js`) to a GitHub repo.
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com) → **Create a Project** → Connect GitHub.
3. Select your repo. Leave build settings blank (it's static HTML).
4. Deploy. Done.
5. Add your custom domain `studyverse.dev` in the Cloudflare Pages dashboard.

---

## 📁 File Structure

```
studyverse/
├── index.html    — App shell, layout, all views
├── styles.css    — All CSS variables, themes, components
├── app.js        — All logic, tools, state management
└── README.md     — This file
```

---

## ➕ How to Add a New Tool

Open `app.js` and find the `TOOLS` array at the top. Add one object:

```js
{
  id:          'khan-academy',          // Unique ID, no spaces
  title:       'Khan Academy',          // Card title
  description: 'Free world-class education for anyone.', // Card subtitle
  icon:        '🎓',                    // Emoji icon
  iconColor:   'color-green',           // See colors below
  type:        'external',              // 'builtin' | 'embed' | 'external' | 'widget'
  badge:       'Deep Link',             // Badge label on card
  badgeClass:  'badge-external',        // 'badge-builtin' | 'badge-embed' | 'badge-external' | 'badge-api'
  url:         'https://khanacademy.org', // For 'embed' and 'external' types
},
```

Available `iconColor` values:
`color-blue` `color-purple` `color-green` `color-orange` `color-pink` `color-amber` `color-teal`

---

## 🎨 Changing the Default Theme

In `app.js`, find `State`:
```js
currentTheme:   'dark',    // 'dark' | 'light'
currentPersona: 'default', // 'kids' | 'default' | 'adult'
currentAccent:  'sky',     // 'sky' | 'violet' | 'emerald' | 'rose' | 'amber' | 'coral'
```

To add a new accent color, add to `ACCENT_COLORS` in `app.js` and add a CSS block in `styles.css`:
```css
[data-accent="mycolor"] {
  --accent:       #hexvalue;
  --accent-dim:   rgba(r,g,b,0.12);
  --accent-hover: #lighterHex;
  --accent-glow:  rgba(r,g,b,0.20);
}
```

---

## 🤖 AI Flashcard Generation

The flashcard tool calls the Claude API to generate cards from pasted text or dropped files.

In production:
- The API call in `FlashcardTool.generateWithAI()` uses `fetch` to `api.anthropic.com`.
- You'll need a backend proxy (Cloudflare Worker, or a small Node.js server) to keep your API key secret.
- A Cloudflare Worker for this is ~15 lines of code. Ask Claude for one when you're ready.

---

## 🌐 Adding Real Duolingo / External API

In `app.js`, find `DuolingoWidget._mockData`. Replace the static values with a real `fetch()` call to your API endpoint. The UI will render whatever data you return.

---

## 📋 Roadmap Ideas

- [ ] User accounts (Cloudflare D1 database)
- [ ] Community deck browser (public decks feed)
- [ ] Spaced repetition algorithm (SM-2)
- [ ] Progress charts per subject
- [ ] Mobile app (wrap in Capacitor or Expo)
- [ ] Real Duolingo API connection
- [ ] Claude AI tutor chat panel
- [ ] YouTube player embed tool
- [ ] Google Calendar integration

---

Built with vanilla HTML, CSS, and JavaScript. No frameworks. No build step.
