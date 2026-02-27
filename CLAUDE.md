# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start React frontend (port 3000)
npm start

# Start Express backend (port 3001)
node server.js

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
npm test -- --testPathPattern=<filename>
```

Both the frontend and backend must run simultaneously for order submission to work.

## Architecture

This is a React flower shop app (Create React App) with a Node.js/Express backend that sends orders to Telegram.

**Frontend** (`src/`):
- `index.js` → `App.jsx` — entry point, sets up React Router with two routes
- Route `/` → `pages/FlowerListPage.jsx` — shows all flowers with search
- Route `/flower/:id` → `pages/FlowerDetailPage.jsx` — detail view with pricing calculator and order button
- `components/FlowerCard.jsx` — clickable card used in list, navigates to detail page
- `components/SearchBar.jsx` — controlled input that filters by name or latin name
- `components/OrderPopup.jsx` — modal for order checkout; offers Telegram direct message or phone callback via API
- `data/flowers.js` — static array of flower objects (all product data lives here)

**Backend** (`server.js`):
- Express server on port 3001
- Single endpoint: `POST /api/order` — validates fields, sends a Telegram message via `node-telegram-bot-api`
- Credentials (`BOT_TOKEN`, `CHAT_ID`) are hardcoded — move to environment variables before deploying

**Pricing logic** (in `FlowerDetailPage.jsx`):
- Each flower has `supplierPrice`, `packSize`, and `markup`
- Orders under one pack: customer pays for the full pack (leftover cost included)
- Orders over one pack: full-pack pricing applied per pack, with partial-pack remainder logic
- `MIN_QUANTITY` is hardcoded to 10 stems

**Adding new flowers**: edit `src/data/flowers.js` — add an object with `id`, `name`, `latin`, `supplierPrice`, `packSize`, `markup`, `image`, `description`.

**Styling**: all styles are in `src/index.css` using plain CSS class names (no CSS modules or Tailwind).
