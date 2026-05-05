# Boreal Submission Demo

Use this as the canonical submission demo script.

Purpose:

- live product walkthrough
- not the category pitch

Runtime target:

- `2:10` to `2:40`
- hard cap: `<= 3:00`

## Spoken Script

```text
This demo starts with a few asks that show the wall.

Organize a side event. Run an on-site venue check. Coordinate a debate room with a moderator, two debaters, and a judge.

These are the kinds of requests advanced AI can help plan, but normal chat still cannot carry through to fulfillment.

For the live run, I use one prompt that maps directly to a shipped Boreal team flow.

I paste: debate: Everyone on earth takes a private vote by pressing a red or blue button. If more than 50 percent of people press the blue button, everyone survives. If less than 50 percent press the blue button, only the people who pressed red survive. Which button would you press? Be honest.

Right away, Boreal recognizes that this should go to a preset team instead of a single specialist. You can see Debate and Verdict appear as the matched route.

Now I take that route.

Boreal turns the ask into a tracked request. This request is the working object. The route, status, approvals, evidence, delivery, and review stay attached here.

Next, the request moves into payment required.

The quote is visible. The seller is visible. And the exact request that will resume after payment is visible too.

Then the owner signs.

Boreal verifies that approval against a real Solana mainnet transaction before work starts.

Once verification lands, the same request resumes. There is no rematch, no second workflow, and no detached checkout path that breaks context.

From here, the team works on the same thread. Mara moderates the motion. Avery argues one side. Blake argues the other side. Jordan closes with the verdict. The reasoning trail stays attached to the same request.

And the same loop extends beyond this one team flow. If the request needs one specialist, Boreal can route there. If no strong direct lock exists, the owner can open the request to the market so humans and agents can propose on the same thread.

So whether the request needs one specialist, a preset agent team, or a broader market route, Boreal keeps the same core loop: one request, one route, one funded thread, through fulfillment.

That is Boreal.
```

## Delivery Notes

- Open with fast flashed prompts, not long typing.
- Keep the live run centered on one real shipped route.
- Let Debate and Verdict prove the team mechanic visually.
- Emphasize `matched route`, `tracked request`, `funding boundary`, `Solana mainnet transaction`, and `same request resumes`.
- Land the closing line about `one specialist`, `preset agent team`, and `broader market route` clearly.

## Complex Prompt Bank

Use these as flash-only prompts unless noted otherwise.

### Flash-only prompts

- `Organize a side event during TOKEN2049 Singapore for 200 founders. I need venue options, sponsor outreach, speaker coordination, a videographer, and local on-site support.`
- `I need an on-site visit near the ETHDenver venue area tomorrow. Verify foot traffic, capture photos, check nearby sponsor activations, and summarize whether the location is worth using for a side event.`
- `Help me prepare and run a live debate room during Solana Breakpoint. I need a moderator, two debaters, a judge, topic framing, and a final verdict report.`
- `Find and coordinate five bilingual local operators for a conference booth during Consensus Toronto, including setup coverage, creator outreach, and daily recap delivery.`
- `An agent needs help finishing a launch checklist for Devconnect week. Route research, design fixes, outreach, and a human runner for last-mile execution.`

### Live run prompt

- `debate: Everyone on earth takes a private vote by pressing a red or blue button. If more than 50 percent of people press the blue button, everyone survives. If less than 50 percent press the blue button, only the people who pressed red survive. Which button would you press? Be honest.`
