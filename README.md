# Trade Market — Hype Site

A single-page "hype site" announcing **Trade Market**, a trading platform concept built by a small student engineering team. The site's job is to sell the *engineering* behind the product, not just the product idea: it walks visitors through the architecture, the tech choices and why they were made, the honest risks the team hasn't solved yet, a build timeline, and the people doing the work.

## Concept

Most hype/landing pages sell a vision. This one leads with a system diagram. The pitch is "trading made easy, for meme coin speculators and serious investors alike," but the bulk of the page is a transparent engineering pitch aimed at readers who care how the thing is actually built:

- **Show the stack, layer by layer** — frontend → network → backend → data — with a short justification for every technology, not just a logo wall.
- **Be honest about what's unsolved** — a dedicated "Risks & Open Questions" section calls out real unknowns (live data source, UX for first-time traders, cross-service security, testing a system where prices never stop moving) instead of pretending everything is figured out.
- **Show real project management** — a phased build timeline from database design through deployment.
- **Introduce the team** — five named engineers, each with an icon avatar.
- **Have personality** — floating coin emojis, wiggle/hover animations, and two full visual themes, because it's still a hype site.

Nothing on the page is a live product. No trading is functional; there's no backend behind the page. It is a pitch/recruiting/vision artifact for a platform still in development.

## Visual identity: two themes, one layout

The whole page is theme-aware via a `data-theme` attribute on `<html>`, toggled with one click (persisted in `localStorage`) and driven entirely by CSS custom properties — same HTML and layout, different mood:

| | Dark mode (default) | Light mode |
|---|---|---|
| Feel | Gothic, serious, "real money" | Soft, friendly, approachable |
| Palette | Near-black, deep purple/blood red, gold accents | Pink/lavender pastels |
| Type | Cinzel (serif display) | Quicksand (rounded display) |
| Shape | Sharp corners, 4px radius | Rounded corners, 20px radius |
| Extra motion | Subtle candle-flicker glow | Floating sparkle accents |

## Page sections

1. **Navbar** — brand, section links, theme toggle.
2. **Hero** — headline, subheadline, CTA buttons, floating coin/rocket/dog/gem emojis.
3. **Architecture** — business outcome blurb, then a four-layer stack (Frontend → Network → Backend → Data layer) with a tech tile per tool, plus a card row for supporting dev tools (Docker, Jenkins, AWS).
4. **Risks & Open Questions** — an honest list of unresolved problems the team is actively working through.
5. **Timeline** — a phased roadmap from database design to deployment.
6. **Team** — Ivan, Tiffany, Arjun, Mihir, Shadi, each with an icon avatar.
7. **Footer** — disclaimer (no live trading, not financial advice) and credits.

## The stack being pitched (not the stack of this site)

The architecture section describes the platform Trade Market intends to build:

- **Frontend:** Angular + TypeScript, chosen for strict component structure and RxJS handling of constant WebSocket price streams.
- **Backend:** Java + Spring Boot for order processing and REST endpoints — mature, well-tested for financial systems.
- **Auth:** a separate NestJS microservice, isolated from the trading engine so login changes can't risk core trading logic.
- **Database:** PostgreSQL for ACID guarantees on accounts, orders, and balances.
- **Analytics:** Python (pandas/NumPy/scikit-learn) reading from the database or a replica.
- **Networking:** WebSockets for live price/order-book updates, hosted on AWS (EC2/ECS, RDS, S3).
- **CI/CD:** GitHub for source control, Jenkins for build/test/deploy.

## How this site itself is built

This is intentionally *not* a framework app:

- Everything — HTML, CSS, and JS — lives in one file: [`index.html`](index.html).
- **Bootstrap 5** (CDN) for responsive grid/layout.
- **Lineicons** (CDN) for all icons.
- **Google Fonts** (Cinzel + Quicksand + Inter) for display and body type.
- No build step, no bundler, no dependencies to install. Open `index.html` in a browser, or serve the folder with any static file server.

See [`plan.md`](plan.md) for the original planning document this page was built from.

## Status

Concept/pitch stage. No trading functionality exists yet — the platform described here is aspirational and under active design.
