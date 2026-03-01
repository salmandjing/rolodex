# Rolodex — Design Document

A mobile-first personal CRM disguised as a modern phone book. Built for people who treat their network as their most valuable asset.

---

## 1. App Architecture

### Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **React 18** + **TypeScript** | Type safety, ecosystem, component model |
| Build | **Vite** | Instant HMR, fast builds, first-class PWA plugin |
| Styling | **CSS Modules** with CSS custom properties | Zero runtime cost, scoped styles, easy theming |
| Storage | **Dexie.js** (IndexedDB wrapper) | Local-first, indexed queries, reactive hooks |
| Search | **Fuse.js** | Client-side fuzzy search, weighted fields |
| PWA | **vite-plugin-pwa** (Workbox) | Service worker generation, precaching, offline |
| Icons | **Lucide React** | Consistent, lightweight, tree-shakeable |
| IDs | **nanoid** | Compact, URL-safe, collision-resistant |
| Routing | **React Router v6** | Lightweight, nested routes |

### Principles

- **Local-first**: All data lives in IndexedDB. No server. No account. No loading spinners.
- **Offline by default**: The entire app is cached. Works on airplane mode.
- **Zero config**: Open it, start adding people. No onboarding flow.
- **Fast**: Sub-100ms search. Instant transitions. No skeleton screens for local data.

### Data Flow

```
User Action → React State → Dexie.js → IndexedDB
                ↑                          |
                └──── useLiveQuery() ──────┘
```

Dexie's `useLiveQuery` hook gives us reactive reads — when data changes in IndexedDB, components re-render automatically. No state management library needed.

---

## 2. Data Model

### Contact

```typescript
interface Contact {
  id: string;              // nanoid

  // Core identity
  firstName: string;       // required
  lastName: string;        // optional
  company: string;         // optional
  title: string;           // optional

  // Contact methods
  phone: string;           // optional
  email: string;           // optional

  // Location
  city: string;            // optional
  state: string;           // optional
  country: string;         // optional — defaults to "US"

  // Social
  linkedin: string;        // optional — just the handle/URL
  twitter: string;         // optional
  website: string;         // optional

  // Relationship metadata
  tags: string[];          // e.g. ["investor", "founder", "friend"]
  howWeMet: string;        // free text: "YC W24 batch", "Intro from Alex"
  notes: string;           // free text, markdown-ish

  // Tracking
  favorite: boolean;       // pinned to top
  lastContacted: number | null;  // timestamp
  relationshipStrength: 1 | 2 | 3 | 4 | 5;  // 1=weak, 5=strong

  // System
  createdAt: number;       // timestamp
  updatedAt: number;       // timestamp
}
```

### IndexedDB Indexes

```
id           — primary key
firstName    — for alphabetical listing
lastName     — for search
company      — for company filter
state        — for location filter
*tags        — multi-entry index for tag queries
favorite     — for favorites filter
updatedAt    — for "recently updated" sort
lastContacted — for "reach out" reminders
```

### Why These Fields

- **howWeMet**: The single most useful field in a personal CRM. Three months later, you'll forget where you met someone. This field solves that.
- **relationshipStrength**: A gut-check rating. Not computed, just your honest assessment. Useful for filtering "who do I actually know well at Company X?"
- **lastContacted**: Manual for now. Tap to mark "I talked to this person today." Enables "people I haven't reached out to in a while" views.
- **tags over categories**: Tags are more flexible. One person can be `["investor", "advisor", "friend"]`. Categories force a single choice.

---

## 3. Screens & UX Flow

### Screen Map

```
┌─────────────────────────────┐
│         Home / List         │  ← Main screen. Search bar + contact list.
│  ┌───────────────────────┐  │
│  │     Search Bar        │  │  ← Always visible. Tap to focus.
│  ├───────────────────────┤  │
│  │  Filter Chips         │  │  ← Tags, favorites, company, state
│  ├───────────────────────┤  │
│  │                       │  │
│  │   Contact Cards       │  │  ← Scrollable list, grouped alphabetically
│  │   Contact Cards       │  │
│  │   Contact Cards       │  │
│  │                       │  │
│  └───────────────────────┘  │
│              [+]            │  ← FAB: Add new contact
└─────────────────────────────┘
         │           │
         ▼           ▼
┌──────────────┐  ┌──────────────┐
│ Contact View │  │ Add / Edit   │
│              │  │   Contact    │
│  Name, Title │  │              │
│  Company     │  │  Form with   │
│  Contact info│  │  sections    │
│  Tags        │  │              │
│  Notes       │  │              │
│  How we met  │  │              │
│              │  │              │
│  [Edit] [Del]│  │ [Save] [Back]│
└──────────────┘  └──────────────┘
```

### Navigation

- **Home → Contact Detail**: Tap a contact card
- **Home → Add Contact**: Tap FAB (+)
- **Contact Detail → Edit**: Tap edit button
- **Back**: Standard back gesture / button. No hamburger menus. No tabs.

### UX Philosophy

The app is a **single-column list with a powerful search bar**. That's it. No dashboard. No analytics. No graph view. The search bar is the primary interface — you open the app, type a few letters, find who you need.

---

## 4. Search & Filtering

### Search Behavior

The search bar is the hero of this app.

1. **Instant results**: Fuse.js runs on every keystroke. No debounce needed for <1000 contacts.
2. **Fuzzy matching**: Typo-tolerant. "jhon" finds "John". "gogle" finds "Google".
3. **Multi-field search**: Searches across name, company, title, tags, notes, howWeMet, city, state.
4. **Weighted fields**: Name matches rank highest, then company, then everything else.

```typescript
const fuseOptions = {
  keys: [
    { name: 'firstName', weight: 3 },
    { name: 'lastName', weight: 3 },
    { name: 'company', weight: 2 },
    { name: 'title', weight: 1.5 },
    { name: 'tags', weight: 1.5 },
    { name: 'city', weight: 1 },
    { name: 'state', weight: 1 },
    { name: 'notes', weight: 0.5 },
    { name: 'howWeMet', weight: 0.5 },
    { name: 'email', weight: 1 },
  ],
  threshold: 0.35,
  includeScore: true,
};
```

### Filter Chips

Below the search bar, horizontal scrollable chips:

- **Favorites** — toggle to show only starred contacts
- **Tags** — dynamically generated from all tags in the DB. Tap to filter.
- **Company** — filter by company (shown if you have 3+ contacts at same company)
- **State** — filter by state

Filters combine with search. You can search "engineer" while filtering by tag "startup".

### Default Sort

- **Favorites first**, then alphabetical by first name
- When searching, results are sorted by relevance score

---

## 5. Key Interactions

### Adding a Contact (< 10 seconds for a quick add)

Only **firstName** is required. Everything else is optional.

The add form has collapsible sections:
1. **Basic** (always visible): First name, Last name, Company, Title
2. **Contact** (collapsed): Phone, Email
3. **Location** (collapsed): City, State
4. **Social** (collapsed): LinkedIn, Twitter, Website
5. **Relationship** (collapsed): Tags, How we met, Relationship strength, Notes

Quick add flow: Open → type name → tap Save. Done.
Full add flow: Open → fill out sections as needed → Save.

### Editing

Same form as add, but pre-filled. Edit button on the contact detail screen.

### Quick Actions on Contact Detail

- **Call**: Tap phone number → opens dialer
- **Email**: Tap email → opens mail client
- **Mark contacted**: "I talked to them today" button that updates lastContacted
- **Favorite/Unfavorite**: Star toggle in header
- **Delete**: With confirmation modal

### Tagging

Tags are entered as comma-separated text, displayed as chips. Autocomplete suggests existing tags as you type.

---

## 6. Visual Design Direction

### Theme: Dark Mode First

The app defaults to dark mode. A toggle in the header switches to light mode. Preference is persisted in localStorage.

### Color Palette

```
Dark Mode:
  --bg-primary:     #0a0a0f      (near-black with slight blue)
  --bg-secondary:   #12121a      (cards, elevated surfaces)
  --bg-tertiary:    #1a1a2e      (inputs, hover states)
  --border:         #2a2a3e      (subtle borders)
  --text-primary:   #e8e8f0      (main text, high contrast)
  --text-secondary: #8888a0      (labels, hints)
  --accent:         #6366f1      (indigo — primary actions, links)
  --accent-hover:   #818cf8      (lighter indigo on hover)
  --success:        #22c55e      (green — confirmations)
  --danger:         #ef4444      (red — delete, errors)
  --favorite:       #f59e0b      (amber — star color)

Light Mode:
  --bg-primary:     #fafafa
  --bg-secondary:   #ffffff
  --bg-tertiary:    #f0f0f5
  --border:         #e0e0e8
  --text-primary:   #1a1a2e
  --text-secondary: #6b7280
  --accent:         #4f46e5
  (... complementary light values)
```

### Typography

- **Font**: System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`). No web fonts to load.
- **Scale**: 14px base on mobile. Names at 16px semibold. Headings at 20-24px.
- **Letter spacing**: Slight tracking on uppercase labels (+0.05em).

### Spacing

- **Base unit**: 4px. Everything is multiples of 4.
- **Card padding**: 16px
- **Section gaps**: 24px
- **Touch targets**: Minimum 44px height (Apple HIG)

### Design Feel

Think: **Linear meets Apple Contacts**. Clean lines, generous whitespace, subtle borders (not shadows), smooth transitions. The app should feel like a precision tool, not a toy.

- No rounded-everything. Border radius: 8px for cards, 6px for inputs, 20px for chips.
- Transitions: 150ms ease for all interactive states.
- No animations on page load. Instant content.

---

## 7. PWA Features

### Web App Manifest

```json
{
  "name": "Rolodex",
  "short_name": "Rolodex",
  "description": "Your personal CRM",
  "theme_color": "#0a0a0f",
  "background_color": "#0a0a0f",
  "display": "standalone",
  "start_url": "/",
  "icons": [...]
}
```

### Service Worker Strategy

- **Precache**: All app shell assets (HTML, CSS, JS, icons)
- **Runtime cache**: None needed — all data is in IndexedDB, not fetched from a server
- **Update flow**: When a new version is deployed, prompt user to refresh

### Offline

100% offline. The entire app works without internet. There is no server to talk to.

### Install Prompt

A subtle banner at the top on first visit: "Add Rolodex to your home screen for quick access." Dismissible, shown once.

### Share Target

Register as a share target so users can share text from other apps into Rolodex (e.g., share a LinkedIn profile URL and it pre-fills the add contact form). This is a stretch goal.

---

## 8. Future Ideas (Not in v1)

- **Interaction log**: Track every time you meet/call/email someone. Build a timeline per contact.
- **Reminders**: "You haven't talked to [Name] in 30 days" notifications.
- **Import from contacts**: Read the phone's contact book and selectively import.
- **Import from LinkedIn**: Parse a LinkedIn connections export CSV.
- **Export**: Export all contacts as CSV or vCard (.vcf).
- **Relationship graph**: Visual map of who introduced you to whom.
- **Quick notes from home screen**: Widget / shortcut to add a quick note about someone.
- **Sync across devices**: Optional cloud sync via a simple backend or CRDTs.
- **Contact photos**: Store a photo per contact (stored as blob in IndexedDB).
- **Smart groups**: Auto-generated groups like "People at Google", "Investors", "Haven't contacted in 60+ days".

---

## Design Decisions Log

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| No backend | Local-only IndexedDB | Privacy, speed, simplicity. A personal phone book shouldn't need an account. |
| No tabs/drawer | Single list + search | The fastest UX is: open → search → find. Tabs add friction. |
| firstName only required | Low friction entry | You often meet someone and only catch their first name. Let them add the rest later. |
| Fuse.js over custom search | Proven fuzzy search | Battle-tested, configurable weights, fast for <10k items. |
| CSS Modules over Tailwind | Cleaner component code | For a small app, CSS Modules keep styles colocated without utility class noise. |
| System fonts | Zero FOUT, instant text | Web fonts add latency and layout shift. System fonts are beautiful enough. |
| Indigo accent | Professional, not corporate | Blue is too generic. Indigo feels modern and distinctive without being loud. |
