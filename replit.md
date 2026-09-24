# AI Friend

AI Friend is a privacy-first Expo mobile companion for local-first chat, study help, creative media prompts, and permission-controlled device features.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-friend/app/(tabs)/` — Home, Chat, Create, and Settings screens.
- `artifacts/ai-friend/context/AppContext.tsx` — local AsyncStorage-backed settings and conversation state.
- `artifacts/ai-friend/constants/colors.ts` — companion palette and semantic theme tokens.
- `artifacts/ai-friend/assets/images/` — app icon and generated creative-story imagery.
- `artifacts/api-server/` — shared Express server reserved for future synced accounts and cloud AI routes.

## Architecture decisions

- The first mobile build is frontend-first and local-first: AsyncStorage keeps the core experience useful without internet.
- Online/offline mode is explicit and visible; future cloud AI must not silently receive private content.
- Location, email, voice, earbuds, calls, and social connections are opt-in capabilities controlled by the device OS and supported APIs.
- Expo Router tabs keep the main companion flows one tap away while leaving deeper integrations modular.

## Product

- Home provides a warm companion entry point, offline privacy status, shortcuts, and a saved story preview.
- Chat supports persistent local text conversation, study prompts, emotional check-ins, and creation prompts.
- Create supports Image, Video, and Story intent selection, prompt drafting, creative edit intents, and local gallery previews.
- Settings exposes the online/offline switch and explicit controls for location check-ins, email check-ins, voice commands, and earbud controls.

## User preferences

- The user wants an AI friend that feels friendly and human, supports romantic or friendly conversation, helps with coding and study, and can work with or without internet.
- The user wants future support for image editing, clothing/background/body-measurement changes, story and short-video creation, voice commands, earbuds, location, phone actions, and supported social apps.

## Gotchas

- Do not present phone control, tracking, microphone, email, call answering, or social integrations as active until their native permissions and supported APIs are implemented.
- Expo preview can log a non-blocking React Native DevTools `libglib-2.0.so.0` warning in this environment; Metro can still run normally.
- Keep the local-first behavior intact when adding online AI; mode changes should remain user-controlled.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
