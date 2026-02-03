# FUNNEL.md — Conversion Pipeline

## Funnel Stages

```
TRAFFIC → INSTALL → ACTIVATION → PAID
```

---

## Stage 1: Traffic

**Definition:** Unique visitors who view the repo or landing page.

**Measured by:** GitHub repo views + referral clicks (weekly)

### Levers to Improve
1. **Content distribution** — Post value-driven content on relevant forums/communities (HN, Reddit, Discord) with genuine engagement
2. **SEO/Discoverability** — Optimize README with keywords; add to relevant awesome-lists
3. **Word of mouth** — Make the tool so useful that users share it organically

---

## Stage 2: Install

**Definition:** User clones repo OR runs install command (`npm install`, `pnpm add`, etc.)

**Measured by:** npm download count + GitHub clones (weekly)

### Levers to Improve
1. **Friction reduction** — One-liner install; no config required for basic use
2. **Clear value prop** — README shows outcome in first 3 lines
3. **Trust signals** — Tests passing, CI green, version badge, star count visible

---

## Stage 3: Activation

**Definition:** User completes the core action that delivers value (e.g., runs first maintenance check, generates first release)

**Measured by:** Telemetry ping on core action (opt-in) OR GitHub issues/discussions from active users

### Levers to Improve
1. **Onboarding flow** — Guided first-run experience; `--init` wizard
2. **Quick win** — Deliver visible value in under 60 seconds
3. **Documentation** — Clear examples for common use cases

---

## Stage 4: Paid

**Definition:** User converts to paying customer (any tier)

**Measured by:** Stripe/payment provider dashboard

### Levers to Improve
1. **Value gate** — Free tier is useful; paid tier is 10x useful
2. **Pricing clarity** — Simple tiers, obvious upgrade path
3. **Nudges** — Usage-based prompts when user hits free limits (not annoying, just informative)

---

## Conversion Targets

| Stage | Target Rate |
|-------|-------------|
| Traffic → Install | 10% |
| Install → Activation | 30% |
| Activation → Paid | 15% |
| **Overall Traffic → Paid** | **0.45%** |
