---
name: Expo workspace dependencies
description: Dependency-install behavior and workspace configuration protection in this monorepo
---

Use an app-scoped dependency install for Expo packages rather than adding them at the workspace root. The package-management helper currently targets the root and is rejected by pnpm's workspace-root guard; an app-scoped install succeeds but may add an unrelated `[nix]` stanza to `.replit`.

**Why:** The extra workspace configuration is unrelated to the app and can create noisy or unintended project changes.

**How to apply:** After any app dependency change, inspect `.replit` and use the validated config replacement flow if an unrelated Nix stanza was added. Do not run another package install after restoring it.