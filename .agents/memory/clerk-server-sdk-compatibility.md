---
name: Clerk server SDK compatibility
description: The installed Clerk Express SDK may not expose the newer host-aware middleware helpers shown in generic setup examples.
---

Use the installed `@clerk/express` and `@clerk/shared` type declarations as the source of truth before copying Clerk server snippets. In this workspace, the stable Express setup is `clerkMiddleware()` with environment-provided keys; host-aware publishable-key helpers may not exist in the installed package version.

**Why:** The canonical setup reference can target a newer SDK than the package already pinned in the workspace, causing type errors if copied verbatim.

**How to apply:** Check the local declaration files when adding or changing Clerk server middleware, and keep the production proxy middleware mounted before body parsing.