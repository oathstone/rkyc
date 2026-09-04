---
rkyc: "1.0"
site: "https://oasis-social-store.vercel.app"
site_name: "Oasis Social Store"
contact: "developers@oathstone.cloud"
registration_endpoint: "https://oasis-social-store.vercel.app/api/rkyc/register"
reauth_endpoint: "https://oasis-social-store.vercel.app/api/rkyc/reauth"
sovereign_ads: true
---

# Oasis Social Store — RKYC Integration

Oasis is a demo social ecommerce store integrated with Reusable KYC by Oathstone.
Users with an Oathstone Passport can sign in, like products, follow merchants,
and add to cart — without a sign-up form.

## Supported Flows

- **passport-relay** — Full handshake via Oathstone Passport or Chrome extension.
- **autonomous-fill** — Oathstone agent fills the sign-up form directly.

## Required Fields

| Field           | Scope          | Required |
|-----------------|----------------|----------|
| first_name      | identity.basic | yes      |
| last_name       | identity.basic | yes      |
| email           | identity.basic | yes      |
| identity_status | identity.basic | yes      |

## CAPTCHA Policy

none — verified Passport users bypass all CAPTCHAs automatically.
