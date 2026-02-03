# POLICY.md — Guardrails & Safety

## Marketing Constraints

### Prohibited
- ❌ **No spam** — No unsolicited bulk messages (email, DM, comments)
- ❌ **No mass DM** — No automated or semi-automated direct messages to users
- ❌ **No credential harvesting** — Never collect passwords, tokens, or secrets beyond what's required for core function
- ❌ **No deceptive practices** — No fake reviews, fake stars, or astroturfing

### Requires Approval
- ⚠️ **Paid advertising** — Any spend requires explicit human approval with budget cap
- ⚠️ **Influencer/partnership deals** — Must be disclosed; requires approval
- ⚠️ **Pricing changes** — Any price increase/decrease requires human approval

### Allowed
- ✅ Genuine community participation (answering questions, sharing knowledge)
- ✅ Organic content creation (blog posts, tutorials, documentation)
- ✅ Responding to inbound inquiries
- ✅ Publishing to package registries (npm, etc.)
- ✅ Submitting to curated lists (awesome-lists) with genuine value

---

## Engineering Safety

### Auto-Merge Rules
- ❌ **No auto-merge** on paths:
  - `**/pricing**`
  - `**/billing**`
  - `**/auth**`
  - `**/secrets**`
  - `.github/workflows/**`
  - `package.json` (dependency changes)

### CI Requirements
- ✅ All tests must pass before merge
- ✅ Linting must pass
- ✅ No merge to `main` without PR (enforce branch protection)

### Human Approval Required
- Pricing/billing logic changes
- Authentication flow changes
- CI/CD pipeline changes
- Dependency major version bumps
- Any change touching user data handling

---

## Data Handling

- Collect minimum necessary data
- No analytics without opt-in disclosure
- No selling or sharing user data
- Clear data deletion path if requested

---

## Incident Response

If any policy is violated:
1. Immediately halt the violating action
2. Log the incident with timestamp and details
3. Notify maintainer
4. Do not attempt to cover up or minimize

---

_Last updated: 2026-02-03_
