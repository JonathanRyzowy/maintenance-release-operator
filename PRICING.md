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

## 4. GitHub App Pricing Tiers

### Free (Individuals & Public Repos)
- **$0/month**
- Automated enforcement on public repositories
- GitHub Checks integration
- Community support

**Target:** Open-source projects, individual developers

### Starter — $29/month
- **Up to 5 private repositories**
- Automated PR checks (blocks merge if noncompliant)
- GitHub Checks integration
- Email support (48-hour response)

**Target:** Small teams, early-stage startups (2–5 repos)

### Organization — $99/month
- **Up to 50 private repositories**
- Everything in Starter, plus:
  - Compliance dashboard (aggregated health scores)
  - Slack/Discord notifications
  - Email support (24-hour response)
  - Historical compliance tracking

**Target:** Growing teams (10–50 engineers, 10–50 repos)

### Enterprise — $500+/month
- **Unlimited private repositories**
- Everything in Organization, plus:
  - Self-hosted deployment option
  - Audit logs and compliance reporting
  - Custom policy exceptions
  - Dedicated Slack channel or email support
  - SLA guarantees (4-hour response)
  - SSO/SAML integration

**Target:** Large organizations (100+ engineers, security/compliance requirements)

---

### Add-On: Professional Support — $500/month
- Works with any tier (including free CLI)
- Priority bug fixes (24-hour turnaround)
- Feature requests escalated
- Direct email or Slack access
- Onboarding assistance

**Target:** Teams that depend on MRO in production CI/CD without using the GitHub App

---

## Current State

As of 2026-02-03:
- ✅ Free CLI is live and functional
- 🚧 GitHub App MVP is under development
- ⏳ Paid tiers will launch after GitHub App is tested
- ⏳ Payment infrastructure (Stripe) in progress

**When will paid features be available?**  
GitHub App MVP is the next priority. Paid tiers will launch once org-level enforcement is proven stable. Subscribe to GitHub releases for updates.

**Early access:** If you want to be an early customer and influence the GitHub App features, open an issue with the tag `github-app-early-access`.

---

## Questions?

If you're considering a paid tier and want to influence the roadmap, open a GitHub issue with the tag `pricing-feedback`. We read everything.

If you're an enterprise with urgent compliance needs, email pricing@maintenance-release-operator.dev (or file an issue if that email doesn't exist yet).

---

_This document is binding. If we violate these principles, hold us accountable._
