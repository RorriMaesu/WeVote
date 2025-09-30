# Security Policy

## Supported Versions
The main branch is the active development line. No formal LTS yet; security fixes will land on main and should be pulled regularly.

## Reporting a Vulnerability
Please DO NOT open a public issue for exploitable vulnerabilities (ledger tampering, receipt forgery, privilege escalation, data exposure, etc.).

Instead, contact the project maintainer (GitHub: @RorriMaesu). Provide:
1. Description and potential impact
2. Steps to reproduce / proof of concept
3. Suggested mitigation if known

You will receive an acknowledgement within 72 hours. A coordinated disclosure timeline will be discussed as needed.

## Scope
In scope:
- Cloud Functions logic (vote tally, receipts, ledger, draft generation gating)
- Firestore security rule bypasses
- Manipulation of append-only structures (`transparency_ledger`, provenance fields)
- Rate limit bypass enabling abuse

Out of scope:
- Denial of service via excessive legitimate API usage (rate limits already in place)
- Self‑XSS from copying untrusted content into inputs
- Issues requiring root/GCP project access

## Handling Secrets
No private secrets should be in the repository. API keys for Firebase web are public but should be project‑scoped. Rotate any leaked non-public credentials immediately.