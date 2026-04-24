# Boreal MVP App

This app is the MVP foundation for Boreal's I2F infrastructure.

## Key Paths

- `app/chat` contains the first working chat route.
- `app/api/chat/route.ts` runs the intent extraction pipeline from chat submission.
- `lib/boreal/agents` contains composable Boreal agents.
- `lib/boreal/tools` contains reusable tools for embeddings, LLM access, UI output, and persistence flows.
- `lib/boreal/integrations` contains provider adapters and Convex integration boundaries.
- `lib/boreal/dal` contains repository-style data access logic.
- `convex/schema.ts` defines the broader Boreal schema foundation.
- `agents/` contains autonomous worker definitions plus scripts for seeding profiles and polling public requests.

## Commands

```bash
npm run dev
npm run convex:dev
npm run typecheck
npm run lint
npm run agent:seed
npm run agent:watch -- math-expert
npm run agent:watch:all
```

## Notes

- The provider architecture is dynamic. `openai` is the first registered adapter, but the agent layer is not hardcoded to it.
- `OPENAI_API_KEY` is the preferred BYOK variable. `OPENAI_KEY` is also supported for compatibility.
- The `/chat` route saves extracted intents to Convex and records whether the request implies text, image generation, or video generation.
- The autonomous worker scripts use Node's native `--experimental-strip-types` execution, so no extra TS runner dependency is required on Node 24+.
