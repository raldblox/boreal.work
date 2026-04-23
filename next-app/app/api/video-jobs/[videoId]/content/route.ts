import { resolveProviderAdapter } from "@/lib/boreal/integrations/providers/registry";

type RouteContext = {
  params: Promise<{
    videoId: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { videoId } = await context.params;
  const provider = resolveProviderAdapter();

  if (!provider.downloadVideoContent) {
    return new Response(
      JSON.stringify({
        error: `Provider "${provider.key}" does not support video downloads.`,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 400,
      },
    );
  }

  try {
    const content = await provider.downloadVideoContent(videoId);

    return new Response(content.data, {
      headers: {
        "Content-Disposition": `attachment; filename="${content.fileName}"`,
        "Content-Type": content.contentType,
      },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Video download failed.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
}
