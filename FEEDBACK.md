# Feedback tracker — polish round 1

> **STATE AS OF 7/6 ~11pm (fully reconciled by Cowork Claude — no stale lines; previous Q&A history removed, only decisions remain).**
> Legend: ✅ done on the page · 🔨 decided, waiting for CLI to apply. Live preview: http://localhost:8788

| # | Item | Status | Decision |
|---|------|--------|----------|
| 1 | Hero / tagline | ✅ | Applied: spaced fragment lines, no credo/rule/roles; toggle removed. |
| 2 | Missing socials | ✅ | Facebook + Instagram restored. |
| 3 | About section | ✅ | Applied: LinkedIn About copy (4 paragraphs), in index.html + content/about.md. |
| 4 | Section spacing | ✅ | Uniform gaps (min-height removed). |
| 5 | SoundCloud embed | ✅ | Removed from Contact; icon stays in social row. |
| 6 | Tardis | ✅ | Applied: continuous always-on spin (reduced-motion still disables it). CSS SVG version. |
| 7 | 2024 archive | ✅ | `git rm -r .2024` done (recoverable via history); removed from tests. Docs still mention it — see note below. |
| 8 | Background panorama | ✅ | Restored + optimized, frosted-glass text panels, both themes. |

## CLI: apply these four things (1, 3, 6, 7), then this round is closed.

---

### 1 — Hero (FINAL, Luke 7/6)

```
LUKE HORNOF
AI Engineering Leader
Founder, researcher, agentic engineer.
Vision: amazing teams, successful products, happy customers.
```

Format like the ORIGINAL site's hero: short spaced fragment lines, generous line spacing. No horizontal rule, no italic credo (the credo lives in the About copy below — do not duplicate it in the hero), no role strip. Remove the A/B toggle.

### 3 — About (FINAL, Luke 7/6 — identical to his live LinkedIn About)

> AI is changing how engineering teams are built and run, and the companies that adapt fastest will pull ahead. The best engineering leaders will combine traditional management with their own hands-on agentic engineering.
>
> I've built and managed engineering organizations for over a decade — finding great engineers, creating a culture where they do their best work, and scaling teams that consistently ship.
>
> At Nervana, I founded the software team from scratch and grew it to 10 engineers. After the Intel acquisition, I scaled the team to 150 across the US, Poland, India, and Israel — without losing the quality and culture that made us worth acquiring. As co-founder of Luminide, I led product, engineering, and go-to-market — through acquisition by Akridata. Most recently, as CTO at ThirdLaw, I built runtime safety and observability for LLM and agent behavior.
>
> Underneath it all: 20+ years of hands-on engineering and research, a Ph.D. in CS, and published work at NeurIPS. I know how engineers think because I am one — these days, an agentic one.

Use as-is. One allowed adaptation: since the hero does NOT carry the credo, the full first paragraph belongs on the site too — no trimming needed.

---

*History note: earlier Q&A text (option debates, investigation notes) was removed in this reconciliation. It lives in git history of this file if ever needed.*
