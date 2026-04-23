import { query } from "./_generated/server";
import { v } from "convex/values";

export const listRecent = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const intents = await ctx.db.query("intents").order("desc").take(args.limit);

    return intents.map((intent) => ({
      _creationTime: intent._creationTime,
      _id: intent._id,
      category: intent.category,
      generationSignals: intent.generationSignals,
      requestedOutputTypes: intent.requestedOutputTypes,
      routing: intent.routing,
      summary: intent.summary,
      title: intent.title,
    }));
  },
});

