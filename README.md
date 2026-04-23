# boreal.work

`WHITEPAPER.md` is the product and architecture source of truth.

## Workspace

- `next-app/` contains the Next.js MVP for Boreal's I2F infrastructure.
- `next-app/app/chat` is the first working route for chat-native intent extraction.
- `next-app/lib/boreal` holds the scalable Boreal foundation: agents, tools, integrations, DAL, and shared schemas.
- `next-app/convex` defines the broader Convex schema and the MVP chat/intent functions.

## Commands

From `next-app/`:

- `npm run dev` starts the Next.js app.
- `npm run convex:dev` starts the Convex dev loop and syncs schema/functions.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run lint` runs ESLint.

## MVP Scope

The current MVP focuses on Boreal's first Layer 2 primitive:

- accept chat input at `/chat`
- extract structured intent
- detect text, image generation, and video generation demand
- persist the result to Convex for downstream routing
