# Oasis Social Store

A demo social ecommerce store built to show how RKYC integrates into a real Next.js + Convex app.

**Live demo:** [oasis-social-store.vercel.app](https://oasis-social-store.vercel.app)

Users can like products, add to cart, follow and unfollow merchants, sign up and sign in — and with the Oathstone extension installed, skip sign-up entirely via one-tap RKYC verification.

---

## What this demonstrates

| Feature | How |
|---|---|
| Sign up / sign in | Convex Auth — email + password |
| RKYC one-tap login | Extension detects Passport, fills form, POSTs JWT to `/api/rkyc/register` |
| Like products | `products.toggleLike` mutation, real-time count |
| Add to cart | `cart.add` mutation, cart badge in navbar |
| Follow / unfollow merchants | `merchants.toggleFollow` mutation, follower count |
| RKYC discovery | `/.well-known/rkyc.md` served from `public/` |
| JWT verification | `POST /api/rkyc/register` — no API key, uses public JWKS |

---

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Convex** — database, auth, real-time queries
- **Convex Auth** — email/password sign-up and sign-in
- **RKYC** — Oathstone extension integration for passwordless sign-in
- **jose** — JWT verification using public JWKS

---

## Project structure

```
social-store/
├── convex/
│   ├── schema.ts          ← users, merchants, products, likes, follows, cart
│   ├── auth.ts            ← Convex Auth (email/password)
│   ├── auth.config.ts
│   ├── http.ts            ← /api/rkyc/register Convex HTTP action
│   ├── users.ts           ← currentUser, linkRkycVerification
│   ├── merchants.ts       ← list, toggleFollow, isFollowing
│   ├── products.ts        ← list, toggleLike, isLiked
│   ├── cart.ts            ← get, add, remove, clear
│   └── seed.ts            ← demo data seeding
├── src/
│   ├── app/
│   │   ├── layout.tsx     ← root layout with Navbar + WebMCP script tag
│   │   ├── page.tsx       ← home: products + merchants
│   │   ├── auth/          ← sign in / sign up page with RKYC banner
│   │   ├── cart/          ← cart page
│   │   ├── merchants/     ← all merchants
│   │   ├── seed/          ← seed demo data UI
│   │   └── api/
│   │       └── rkyc/
│   │           ├── register/route.ts  ← JWT verify endpoint
│   │           └── reauth/route.ts    ← silent re-login endpoint
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── MerchantRow.tsx
│   │   ├── RkycBanner.tsx
│   │   └── ConvexClientProvider.tsx
│   └── lib/
│       ├── rkyc.ts        ← probeExtension, registerWithBackend helpers
│       ├── convex.ts      ← ConvexReactClient singleton
│       └── format.ts      ← formatPrice, formatDate
├── public/
│   └── .well-known/
│       └── rkyc.md        ← RKYC discovery file
├── .env.local.example
├── middleware.ts           ← Convex Auth middleware
└── vercel.json
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/oathstone/rkyc.git
cd rkyc/sample/social-store
npm install
```

### 2. Create a Convex project

```bash
npx convex dev
```

This opens a browser to create a new project on [dashboard.convex.dev](https://dashboard.convex.dev). After login it writes your deployment URL to `.env.local` automatically.

### 3. Configure env vars

```bash
cp .env.local.example .env.local
```

Your `.env.local` should look like this (Convex fills the first two automatically):

```
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_RKYC_ISSUER=https://business.oathstone.cloud
NEXT_PUBLIC_RKYC_JWKS_URL=https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json
```

The last two are already set to the correct Oathstone values — no changes needed unless you're self-hosting.

### 4. Push the schema

```bash
npx convex dev
```

Leave this running. It watches for changes and hot-reloads functions. Open a second terminal for the Next.js dev server.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Seed demo data

Navigate to [http://localhost:3000/seed](http://localhost:3000/seed) and click **Run seed**. This adds 3 merchants and 6 products.

---

## Testing RKYC

### Scenario 1 — Standard sign-up / sign-in

1. Go to `/auth`
2. Click **Create account**, fill in email + password
3. You're signed in — like products, add to cart, follow merchants

### Scenario 2 — RKYC one-tap (extension active)

1. Install the Oathstone extension:
   - Download [oathstone-extension.zip](https://business.oathstone.cloud/oathstone-extension.zip)
   - Unzip → Chrome → `chrome://extensions` → Developer mode ON → Load unpacked
2. Pair it: [business.oathstone.cloud/admin/passport/pair](https://business.oathstone.cloud/admin/passport/pair)
3. Open [http://localhost:3000](http://localhost:3000)
4. The RKYC banner appears: "Welcome back, [Name] ✓"
5. On the `/auth` page, a green "Continue with Oathstone ✓" button appears — one tap signs you in
6. Check DevTools → Network → `/api/rkyc/register` — the JWT is posted, verified, and the nullifier stored

### Scenario 3 — Verify the JWT endpoint directly

```bash
# The JWKS (public key) — no auth needed
curl https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json

# Verify a real token (get it from the Network tab after RKYC approval)
curl -X POST http://localhost:3000/api/rkyc/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jwt":"your.rkyc.jwt"}'

# Bad token — should return 401
curl -X POST http://localhost:3000/api/rkyc/register \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"jwt":"invalid"}'
# → { "success": false, "error": "..." }
```

---

## Deploy to Vercel

### 1. Push to GitHub

Create a new GitHub repo and push:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/oasis-social-store.git
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no build config needed
4. Set these environment variables in the Vercel dashboard:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | from your Convex dashboard |
| `NEXT_PUBLIC_RKYC_ISSUER` | `https://business.oathstone.cloud` |
| `NEXT_PUBLIC_RKYC_JWKS_URL` | `https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json` |

5. Click Deploy

### 3. Point Convex to production

```bash
npx convex deploy --prod
```

### 4. Update rkyc.md

Edit `public/.well-known/rkyc.md` and replace `oasis-social-store.vercel.app` with your actual Vercel domain. Commit and push — Vercel redeploys automatically.

### 5. Seed production data

Visit `https://your-domain.vercel.app/seed` and click **Run seed**.

---

## How RKYC is wired in (the short version)

There are exactly 4 things this app does to support RKYC:

**1. `/.well-known/rkyc.md`** — tells the extension which fields you need and where to send the JWT.

**2. `oathstone-webmcp.js` script tag** in `layout.tsx` — registers the 13 WebMCP tools the extension calls.

**3. `POST /api/rkyc/register`** in `src/app/api/rkyc/register/route.ts` — verifies the ES256 JWT using the public JWKS. No API key. ~30 lines.

**4. `probeExtension()` in `src/lib/rkyc.ts`** — sends `OATHSTONE_PROBE` on page load and listens for the extension response to show the RKYC banner.

Everything else — form fill, CAPTCHA bypass, silent re-login — is handled by the extension automatically once those 4 pieces are in place.

---

## Links

- [Live demo](https://oasis-social-store.vercel.app)
- [RKYC protocol](https://business.oathstone.cloud/reusable-kyc)
- [RKYC integration guide](https://business.oathstone.cloud/RKYC-README.md)
- [Extension download](https://business.oathstone.cloud/oathstone-extension.zip)
- [JWKS endpoint](https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json)
