---
name: Managed AI availability
description: Runtime behavior when Replit-managed AI provider variables are unavailable
---

The mobile companion must treat cloud AI as an opt-in capability: it can call the server only in Online mode, and it must preserve a useful on-device response when the managed provider is unavailable.

**Why:** This workspace can have no active AI integration even while the app is being developed, so a missing provider must not turn into a crash, silent data loss, or a misleading success state.

**How to apply:** Keep provider credentials server-side, return an explicit unavailable response, and show the user that the app used the offline path instead.