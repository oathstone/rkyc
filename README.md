# Reusable KYC by Oathstone (RKYC)

> **An open identity protocol. Verify once. Use everywhere.**  
> No API keys. No registration. No admin intervention.

RKYC lets users with an Oathstone Passport skip registration and login forms on any compatible site. Third-party sites verify identity proofs cryptographically — using a public key anyone can fetch — without calling Oathstone's servers.

---

## How it works

```
User has Oathstone Passport
       ↓
Visits your site with the Oathstone Chrome Extension
       ↓
Extension reads /.well-known/rkyc.md (your discovery file)
       ↓
One-tap approval popup — user approves the fields you declared
       ↓
Extension fills your form, bypasses CAPTCHA, submits
       ↓
Your server receives an ES256 JWT — not PII
       ↓
You verify the JWT with Oathstone's public key (JWKS)
  OR verify on-chain against the Celo RKYCRegistry contract
       ↓
Done — no API key, no registration, no Oathstone dependency
```

---

## Integration: 3 steps

### Step 1 — Publish `/.well-known/rkyc.md`

Create this file at the root of your public directory. The extension reads it automatically.

**Minimal:**
```markdown
---
rkyc: "1.0"
site: "https://yoursite.com"
site_name: "Your Site"
contact: "developers@yoursite.com"
registration_endpoint: "https://yoursite.com/api/rkyc/register"
reauth_endpoint: "https://yoursite.com/api/rkyc/reauth"
---

## Required Fields
| first_name      | identity.basic | yes |
| last_name       | identity.basic | yes |
| email           | identity.basic | yes |
| identity_status | identity.basic | yes |

## CAPTCHA Policy
none
```

Framework paths:

| Framework | Path |
|---|---|
| Next.js | `public/.well-known/rkyc.md` |
| Vite | `public/.well-known/rkyc.md` |
| SvelteKit | `static/.well-known/rkyc.md` |
| Nuxt | `public/.well-known/rkyc.md` |
| Express | serve from `express.static('public')` |
| Plain HTML | any directory served at your domain root |

### Step 2 — Add the script tag

```html
<script src="https://business.oathstone.cloud/oathstone-webmcp.js" defer></script>
```

That's it. 13 WebMCP tools register automatically. The extension handles form fill, CAPTCHA bypass, and silent re-login.

### Step 3 — Verify tokens on your server (pick one)

**Option A — Local JWT verification (recommended)**

No calls to Oathstone after the first JWKS fetch. Cache the public key and verify every token locally.

```javascript
import { createRemoteJWKSet, jwtVerify } from "jose"; // npm i jose

const JWKS = createRemoteJWKSet(
  new URL("https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json")
);

async function verifyRkycToken(jwt, siteOrigin) {
  const { payload } = await jwtVerify(jwt, JWKS, {
    issuer: "https://business.oathstone.cloud",
    audience: siteOrigin, // must be YOUR site's exact origin
  });
  // payload.sub            = site-scoped nullifier (safe user ID, no PII)
  // payload.approvedFields = ["first_name", "email", ...]
  return payload;
}
```

**Option B — Server-side verify endpoint (no JWT library)**

```javascript
const res = await fetch(
  "https://enduring-salmon-903.convex.site/api/rkyc/verify-jwt",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt, siteOrigin: "https://yoursite.com" }),
  }
);
const { success, approvedFields, nullifier } = await res.json();
// No API key required.
```

**Option C — On-chain verification (fully trustless, no Oathstone servers)**

```javascript
import { createPublicClient, http } from "viem";
import { celo } from "viem/chains";

const client = createPublicClient({ chain: celo, transport: http() });

// Get registry address — public, no auth
const registry = await fetch(
  "https://enduring-salmon-903.convex.site/.well-known/rkyc-registry.json"
).then(r => r.json());

const verified = await client.readContract({
  address: registry.contractAddress,
  abi: registry.abi,
  functionName: "isVerified",
  args: ["0x" + nullifierFromJwt], // jwt.payload.sub
});
// verified = true/false — no API key, no Oathstone, just Celo
```

---

## Public endpoints (no auth, no API key)

All hosted at `https://enduring-salmon-903.convex.site`:

| Endpoint | What it returns |
|---|---|
| `GET /.well-known/rkyc-jwks.json` | ES256 public key for JWT verification (cache 24h) |
| `GET /.well-known/rkyc-registry.json` | Celo contract address + ABI + verification examples |
| `POST /api/rkyc/verify-jwt` | Server-side JWT verify — body: `{ jwt, siteOrigin }` |
| `GET /api/rkyc/check-onchain?nullifier=<hex>` | On-chain nullifier lookup |

---

## JWT structure

Tokens are standard ES256 JWTs. You can verify them with any JWT library.

```json
{
  "alg": "ES256",
  "typ": "JWT",
  "kid": "rkyc-v1"
}
.
{
  "iss": "https://business.oathstone.cloud",
  "sub": "<site-scoped-nullifier>",
  "aud": "https://yoursite.com",
  "iat": 1234567890,
  "exp": 1234568790,
  "jti": "<uuid>",
  "approvedFields": ["first_name", "last_name", "email", "identity_status"],
  "scope": "identity.basic"
}
```

Key claims:
- `sub` — `sha256(passportNullifierHash|siteOrigin)`. Site-scoped, safe to store as a user ID.
- `aud` — locked to your site's exact origin. Token is cryptographically invalid on any other site.
- `approvedFields` — list of verified field names. No PII, no values — just confirmation.
- `exp` — 15 minutes from issuance. The extension handles refresh automatically.

---

## On-chain verification (Solidity)

Use the nullifier from the JWT `sub` claim to verify directly in a Solidity contract:

```solidity
interface IRKYCRegistry {
    function isVerified(bytes32 nullifier) external view returns (bool);
}

contract YourContract {
    IRKYCRegistry constant registry = IRKYCRegistry(REGISTRY_ADDRESS);

    modifier onlyRkycVerified(bytes32 nullifier) {
        require(registry.isVerified(nullifier), "RKYC: not verified");
        _;
    }
}
```

Get `REGISTRY_ADDRESS` from `/.well-known/rkyc-registry.json`.

---

## Field scope reference

| Scope | Fields |
|---|---|
| `identity.basic` | first_name, last_name, email, identity_status |
| `identity.full` | + phone, gender, dob, country |
| `identity.government` | + credential type hash (no raw value) |
| `identity.biometric` | + liveness_verified (boolean only) |

---

## Security

- Always verify the JWT signature using JWKS. Never trust the payload without it.
- The `aud` claim must match your site's exact origin — tokens are cryptographically site-locked.
- `sub` (the nullifier) is derived per-site — it cannot be used to track users across sites.
- No PII in the JWT. No PII on Oathstone's servers. Credentials live encrypted on the user's device.
- On-chain verification is optional and fully trustless — no dependency on Oathstone at all.

---

## Sample demo

The `sample/` directory contains a fully working demo:

```
sample/
  README.md              ← how to run it
  social-store/
    index.html           ← standalone demo, no framework required
    .well-known/
      rkyc.md            ← example discovery file
    api/
      rkyc-register.js   ← example verify endpoint (Express + Next.js)
```

Run it locally in 10 seconds:
```bash
cd rkyc/sample/social-store
python -m http.server 8080
# Open http://localhost:8080
```

---

## Links

- [Live demo](https://business.oathstone.cloud/social-store)
- [RKYC landing page](https://business.oathstone.cloud/reusable-kyc)
- [Reference rkyc.md](https://business.oathstone.cloud/.well-known/rkyc.md)
- [JWKS](https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json)
- [Registry info](https://enduring-salmon-903.convex.site/.well-known/rkyc-registry.json)
- [Full integration guide](https://business.oathstone.cloud/RKYC-README.md)

---

*Built on Celo. Zero PII stored. Open protocol.*
