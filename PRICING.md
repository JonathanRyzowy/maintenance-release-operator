# PRICING.md — Economic Boundaries

This document declares what is free, what is not, and why.

---

## 1. What is Free (Always)

The following capabilities are free forever and will never be paywalled:

- **Local CLI usage** — Run `mro check` and `mro release` on your machine
- **Core commands** — All base functionality (check, release, init)
- **OSS transparency** — Full source code visibility and audit rights
- **Community support** — GitHub issues, discussions, bug reports
- **Self-hosting** — Deploy and run on your own infrastructure

**Why this matters:** These capabilities represent the core utility. If you can run it locally, you own it. No bait-and-switch.

---

## 2. What is Not Free

The following capabilities require payment because they introduce leverage, authority, or organizational scale:

- **GitHub App (org-level enforcement)** — Automated checks on all repos in an organization
- **Policy exceptions** — Custom rule sets beyond default checks
- **Audit history** — Compliance logging and historical reporting
- **Team reporting** — Aggregated insights across multiple repos
- **Priority support** — Response SLA and direct communication channels

**Why this matters:** Authority over multiple repos and compliance needs represent business value. Teams that enforce policy at scale should pay for that leverage.

---

## 3. Pricing Philosophy (Non-Negotiables)

### No Per-Seat Nickel-and-Diming
Pay for **authority**, not headcount. If you have 5 engineers or 50, the price is the same. We're not in the business of charging per human.

### Small Teams Subsidized by Large Ones
A 3-person startup pays less than a 500-person enterprise. Revenue should come from those who extract the most leverage, not those who need it most.

### No Ads, No Dark Telemetry
This tool will never:
- Show advertisements
- Collect usage data without explicit opt-in
- Sell data to third parties
- Inject tracking pixels

### Sponsorship ≠ Support ≠ Pricing
- **Sponsorship** (GitHub Sponsors) — Voluntary support, no expectation of features
- **Support** — Paid SLA for response time and priority fixes
- **Pricing** — Payment for specific capabilities (GitHub App, enterprise features)

These are separate. Don't confuse them.

---

## 4. Placeholder SKUs (Future Revenue)

These are not live yet, but represent the monetization roadmap:

### GitHub App — $29–$99/org/month
- Org-level automated checks on push
- Policy enforcement across all repos
- Slack/Discord notifications
- Team dashboard with aggregated health scores

**Target customer:** 10–100 person engineering teams with 20+ repos

### Enterprise — "Talk to us"
- Self-hosted deployment with support
- SSO/SAML integration
- Custom compliance rules
- Dedicated Slack channel or email support
- SLA guarantees (4-hour response)

**Target customer:** 500+ person orgs with security/compliance requirements

### Professional Support — $500/month
- Priority bug fixes (48-hour turnaround)
- Feature requests escalated
- Direct email or Slack access
- Works with any tier (including free)

**Target customer:** Teams that depend on this tool in production CI/CD

---

## Current State

As of 2026-02-03:
- ✅ Free CLI is live and functional
- ⏳ GitHub App is under development
- ⏳ Enterprise features are planned but not built
- ⏳ Payment infrastructure is not yet live

**When will paid features be available?**  
When they're built and tested. No timelines, no promises. Subscribe to GitHub releases for updates.

---

## Questions?

If you're considering a paid tier and want to influence the roadmap, open a GitHub issue with the tag `pricing-feedback`. We read everything.

If you're an enterprise with urgent compliance needs, email pricing@maintenance-release-operator.dev (or file an issue if that email doesn't exist yet).

---

_This document is binding. If we violate these principles, hold us accountable._
