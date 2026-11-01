# Rebuild Bharat

A runnable industrial asset marketplace and operations workspace, built from the supplied handoff and visual references. The public interface uses blue/white/navy; internal workspaces use frosted blue surfaces, charcoal navigation and lime accents.

**Status:** functional local development system with persistent data and tested workflows. **Not yet approved for a public production launch.** See [production requirements](docs/PRODUCTION.md). No deployment, environment publication or external messaging was performed.

## Run

Requires Node.js **24 or newer** (native `node:sqlite`). There are no third-party runtime dependencies and no build step.

```sh
cd /workspace/rebuild-barath
npm run seed:demo   # optional; only seeds an otherwise empty database
npm start          # port 3000; HOST and PORT can override the bind address
```

Open the running application in your development browser. Route `/#/` is the marketplace; `/#/login` opens sign-in. The server binds `0.0.0.0` by default. A restricted execution sandbox may require permission to bind a local port.

### Development demonstration

The login screen provides workspace shortcuts that fill the form. **Sign in** still needs to be pressed.

| Workspace | Email |
| --- | --- |
| Super Admin | `admin@demo.rebuild.test` |
| Seller | `customer@demo.rebuild.test` |
| Buyer | `buyer@demo.rebuild.test` |
| Inspector | `inspector@demo.rebuild.test` |
| Refurbishment | `refurbisher@demo.rebuild.test` |
| Logistics | `logistics@demo.rebuild.test` |
| Sales/operations | `operations@demo.rebuild.test` |
| Finance | `finance@demo.rebuild.test` |
| Auctions | `auction@demo.rebuild.test` |

All demo accounts use `RebuildDemo!2026`. These are deliberately public, local-only demonstration credentials. Production mode refuses to start against a database marked as demo. The seed contains sample data, with no real equipment, verification claims or commercial offers. Reference imagery is a visual placeholder; real listings support uploaded photographs.

### Clean database and real administrator

Do not promote the demonstration database. Select a separate path; keep existing demo data intact if you still want it.

```sh
export DATABASE_PATH="$PWD/.data/real.sqlite"
export ADMIN_EMAIL="your-address@example.com"
read -r -s -p 'New admin password (12+ characters): ' ADMIN_PASSWORD
export ADMIN_PASSWORD
npm run admin:create
unset ADMIN_PASSWORD
npm start
```

This creates an administrator without printing or saving its password in source. All categories and extra services start **off** in a clean database. This bootstrap is for development/staging until the production requirements below are completed.

## What works

- Customer registration, scrypt password hashing, HTTP-only session cookies, sign-in/out, password changes, session revocation and login attempt throttling.
- One customer account supports buying and selling; company memberships support multiple companies. Company owners can add already registered members. Admin can review companies, change permission bundles and disable users.
- Ten initial top-level category groups plus nested subcategories. Super Admin can create arbitrary additional categories, edit hierarchy/order/icons, archive safely, and toggle visibility without deployment. Turning off a parent hides every descendant and its listings publicly, blocks new submissions, and preserves company-side history.
- Dynamic specification builder: text, numeric, measurement/unit, dropdown, multi-select, boolean, date and private-document reference types. Required fields/options/ranges are validated on the server. Category definitions are versioned. Brands/models are configurable.
- Persistent assets and distinct listing records; draft editing, moderation, publishing, withdrawal, sale and archive transitions; seller photo uploads; public category/search/location/price/brand/condition/specification filters; saved equipment and comparison of up to three assets.
- Company-scoped enquiries, offers/counteroffers, offer responses and immutable audit events.
- Inspection requests, scheduling, assignment, partner findings, limitations and reviewer approval. Explicitly approved public certificate summaries, public status verification, revocation and printable reports (browser “Save as PDF”).
- Refurbishment, logistics, CRM, business mandates, transaction milestones and manual invoice/payment-reference tracking. These are persisted operational workflows, not external service integrations or a full accounting system.
- Confidential business data rooms: company-owned document attachment, registered-buyer access grants, externally signed NDA references, expiry/revocation and audited downloads.
- Optional auctions: independent Super Admin launch switch, schedules, reserve prices, manual participant approval, server-time validation, atomic minimum bids, two-minute anti-sniping extension and manager-recorded results. Refresh updates current bid values; WebSocket streaming is not included.
- Optional rentals: independent launch switch, daily rates/terms/deposit records, date requests, inclusive-day totals, conflict-checked confirmations and pickup/return states. No deposit collection.
- In-app notifications, role-specific dashboard counts, CMS homepage copy, private company document vault and append-only audit logs.
- Responsive layouts, semantic forms, labelled controls, dialog keyboard focus trapping, reduced-motion support and mobile navigation.

## Validation

```sh
npm run check
npm test
```

The automated backend suite runs against an isolated temporary SQLite database. It verifies real HTTP requests and persistence, permission boundaries, category visibility, listing transitions, private files, offer flows, partner access, auction bid races, rental overlap conflicts, NDA access expiry/revocation, certificate privacy and password/session changes.

Optional real-browser acceptance test (Playwright and Chromium must already be installed):

```sh
PLAYWRIGHT_MODULE=/path/to/playwright \
CHROMIUM_PATH=/usr/bin/chromium \
SCREENSHOT_DIR=/tmp/rebuild-screenshots \
node scripts/browser-check.cjs
```

The browser script creates and deletes its own temporary demo database and never changes the running application's records. It exercises seller drafting/submission, admin publication, buyer enquiry/offer and seller acceptance, category controls, dynamic attribute creation, auction/rental creation, every internal page, desktop/mobile layouts and browser errors. Representative captures are in [docs/screenshots](docs/screenshots).

## Structure and technical choice

- `src/server.js`: HTTP application, authentication, authorisation, marketplace and service routes.
- `src/store.js`: SQLite schema, additive local migrations, category visibility, permissions, typed validation and password helpers.
- `src/exchange.js`: auction and rental rules and endpoints.
- `src/admin.js`, `src/seed.js`: administrator bootstrap and explicit demonstration setup.
- `public/`: responsive client, design system, local SVG icons and reference imagery.
- `tests/`: isolated HTTP/business-rule regression suite.
- `scripts/browser-check.cjs`: optional browser acceptance test.

The supplied handoff proposed Next.js/NestJS/PostgreSQL subject to technical review. The repository was empty and its network proxy refused connections, so installing those packages was unavailable. This implementation uses Node’s HTTP, crypto and SQLite modules plus browser-native JavaScript to remain fully runnable offline. It is a single-process modular application; a PostgreSQL migration and infrastructure review are required for multi-instance production scale. It does not claim framework compatibility with the proposed stack.

`.data/` contains the database and private uploads, is ignored by Git, and must be retained across server restarts. Live processes must be restarted in a new cloud task. Reuse the current isolated checkout; no Git worktree is needed.

Configuration variables are documented in [.env.example](.env.example). The application reads the process environment; it does not automatically parse `.env` files. There are no required API secrets for local use.
