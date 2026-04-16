# Engineering Townhall — Demo Plan
## Plugin-Based MFE + Monorepo Presentation

---

## Services to Start

```bash
pnpm devtools   # DevTools API :5001 + UI :5173
pnpm dev        # Builds remotes, then shell :3000 + previews :3001-3004
```

| Service | URL | Purpose |
|---|---|---|
| Shell | http://localhost:3000 | Host app — loads all plugins |
| Plugin 1 (SMS) | http://localhost:3001 | Independent remote |
| Plugin 2 (QCA) | http://localhost:3002 | Independent remote |
| Plugin 3 (CMS) | http://localhost:3003 | Independent remote |
| Plugin 4 (MAM) | http://localhost:3004 | Independent remote |
| DevTools API | http://localhost:5001 | Registry + build API |
| DevTools UI | http://localhost:5173 | Dashboard + Presentation |

---

## Demo Flow

### 1. Presentation — Slides 1–6 (~5 min)
Open DevTools at **http://localhost:5173** → click **▶ Present**

- **Slide 1:** Title — set the stage
- **Slide 2:** The Problem — pain points every team has felt. Let it land.
- **Slide 3:** The Concept — shell loads plugins at runtime, like browser extensions. Show the diagram.
- **Slide 4:** How It Works — click the `vite.config.ts` block first, explain `@originjs/vite-plugin-federation` and `remoteEntry.js`. Then click `registry.json` — this is the deployment mechanism. "Change this URL, new version is live."
- **Slide 5:** Code Splitting — walk through `React.lazy()` + `Suspense`. Watch the bar chart animate. "Only the code for the current route is fetched."
- **Slide 6:** Monorepo — one repo, shared UI package, standardised tooling.

**Presenter note:** Slides 4–5 are where engineers in the audience lean in. Slow down, point at the code, be specific.

**Goal:** audience understands the mechanism before they see it live.

---

### 2. Live Shell — Plugins Running (~2 min)
Alt-tab to **http://localhost:3000**

- Navigate between plugins from the sidebar
- Each plugin loads independently — no page reload
- Key line: *"Each of these is a separate app, built and deployed independently. The shell just reads a URL from a JSON file."*

---

### 3. DevTools — One Killer Operation (~3 min)
Alt-tab to **http://localhost:5173**

1. **Dashboard** — show all plugins green + built ✓
2. **Build & Compare** — build one plugin → take snapshot → show chunk diff. Point out unchanged chunks (CDN cache hits) vs changed ones.
3. **Registry Manager** — show the URL field. *"This controls which version of a plugin the shell loads. Update this URL, done. No redeploy of the shell."*

Key line: *"This is how you deploy without taking down the platform."*

---

### 4. Presentation — Slides 8–13 (~5 min)
Back to fullscreen presentation, resume from slide 8:

- **Slide 8:** Zero Downtime — before/after deployment comparison. The numbers speak.
- **Slide 9:** DevTools — 60-second scaffold. Fill the form, generate the whole plugin.
- **Slide 10:** Build Intelligence — chunk diff, CDN invalidation per chunk only.
- **Slide 11:** AI-Native — `.clinerules` gives any AI agent instant context. Fewer tokens, correct code first pass.
- **Slide 12:** Proven at Scale — Netflix, DAZN, Zalando, Spotify are doing this in production. We have it running today.
- **Slide 13:** The Ask — one team, one feature, 2–3 weeks. Everything is ready.

**End on slide 13:** *"The infrastructure is ready. The demo is live. Let's talk."*

---

## If Asked "Can you add a new app?"
DevTools → **New Plugin** → fill in ID / label / port / color → Create Plugin → show the generated files and the updated registry.json entry.

## If Something Breaks
- Shell blank: refresh. Registry loads from http://localhost:5001/api/registry
- Remote not loading: check terminal, run `pnpm build:mfe` then restart preview
- DevTools UI blank: restart with `pnpm devtools`

---

## Arc

> **Slides 1–6** (problem → concept → technical depth)
> → **Shell live** (it works, right now)
> → **DevTools live** (here's how you operate it)
> → **Slides 8–13** (deployment + DX + ask)
