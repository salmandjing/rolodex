# Rolodex

A mobile-first personal CRM — a modern phone book for managing professional relationships.

## Features

- **Instant fuzzy search** across names, companies, tags, notes, and more
- **Filter by** tags, company, state, favorites
- **Rich contact profiles** with phone, email, social links, relationship metadata
- **Tagging system** with autocomplete from existing tags
- **Relationship tracking** — how you met, strength rating, last contacted
- **Dark mode first** with light mode toggle
- **PWA** — installable, works fully offline
- **Local-first** — all data in IndexedDB, no server needed

## Tech Stack

React 18 + TypeScript, Vite, Dexie.js (IndexedDB), Fuse.js (fuzzy search), Lucide icons, CSS Modules, vite-plugin-pwa

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app seeds 8 sample contacts on first launch.

## Build

```bash
npm run build
npm run preview
```
