import type { PersistedIntent } from "@/lib/boreal/schemas/intent";

type IntentResultCardProps = {
  intent: PersistedIntent;
};

export function IntentResultCard({ intent }: IntentResultCardProps) {
  return (
    <div className="border border-border p-4">
      <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <div className="min-w-32">
          <p className="text-muted-foreground">Intent</p>
          <p>{intent.intentType}</p>
        </div>
        <div className="min-w-32">
          <p className="text-muted-foreground">Primary mode</p>
          <p>{intent.generationSignals.primaryMode.replaceAll("_", " ")}</p>
        </div>
        <div className="min-w-32">
          <p className="text-muted-foreground">Resolution tier</p>
          <p>{intent.routing.resolutionTier}</p>
        </div>
        <div className="min-w-32">
          <p className="text-muted-foreground">Confidence</p>
          <p>{Math.round(intent.confidence * 100)}%</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
        <div>
          <p className="text-muted-foreground">Requested outputs</p>
          <ul className="mt-2 space-y-1">
            {intent.requestedOutputTypes.map((outputType: string) => (
              <li key={outputType}>{outputType.replaceAll("_", " ")}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground">Capability tags</p>
          <ul className="mt-2 space-y-1">
            {intent.capabilityTags.map((tag: string) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
