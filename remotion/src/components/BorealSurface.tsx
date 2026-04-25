import type {ReactNode} from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {getSceneBeat, type SceneSpec, type VideoVariant} from "../data/video-variants";

const BACKGROUND = "#071115";
const PANEL = "rgba(8, 16, 22, 0.92)";
const PANEL_SOFT = "rgba(11, 19, 26, 0.8)";
const PANEL_MUTED = "rgba(255, 255, 255, 0.04)";
const BORDER = "rgba(148, 163, 184, 0.16)";
const TEXT = "#f8fafc";
const MUTED = "#96a7b5";
const MUTED_SOFT = "#7a8a96";
const WARNING = "#f97316";
const SANS = '"IBM Plex Sans", "Aptos", "Segoe UI", sans-serif';
const MONO = '"IBM Plex Mono", "Consolas", monospace';

export type FilmSceneProps = {
  scene: SceneSpec;
  sceneCount: number;
  sceneIndex: number;
  variant: VideoVariant;
};

type SceneFrameProps = FilmSceneProps & {
  children: ReactNode;
};

type SurfaceProps = {
  accent: string;
  mode?: "hackathon-update" | "standard";
  title?: string;
};

type WindowFrameProps = {
  accent: string;
  children: ReactNode;
  title: string;
};

export const BorealBackdrop: React.FC<{accent: string}> = ({accent}) => {
  const frame = useCurrentFrame();
  const gridDrift = interpolate(frame, [0, 320], [0, 80], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 82% 18%, ${withAlpha(
          accent,
          0.16,
        )}, transparent 34%), radial-gradient(circle at 16% 78%, rgba(56, 189, 248, 0.08), transparent 30%), linear-gradient(180deg, #091318 0%, ${BACKGROUND} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          opacity: 0.18,
          transform: `translateY(${gridDrift}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 24,
          border: `1px solid ${withAlpha(accent, 0.16)}`,
          boxShadow: `0 0 0 1px ${withAlpha(accent, 0.06)} inset`,
        }}
      />
    </AbsoluteFill>
  );
};

export const SceneFrame: React.FC<SceneFrameProps> = ({children, scene, variant}) => {
  const {durationInFrames, fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const enter = spring({
    fps,
    frame,
    config: {
      damping: 18,
      stiffness: 120,
    },
  });
  const outro = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(enter, outro);
  const lift = interpolate(enter, [0, 1], [26, 0]);
  const {beat, nextStartAtSecond} = getSceneBeat(scene, frame / fps);
  const beatStartFrame = Math.floor(beat.startAtSecond * fps);
  const beatEndFrame = Math.floor(nextStartAtSecond * fps);
  const beatIn = interpolate(frame, [beatStartFrame, beatStartFrame + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beatOut = interpolate(frame, [beatEndFrame - 8, beatEndFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beatOpacity = Math.min(beatIn, beatOut);
  const isMinimal = variant.overlayMode === "minimal";

  return (
    <AbsoluteFill
      style={{
        color: TEXT,
        fontFamily: SANS,
        opacity,
        padding: isMinimal ? "58px 64px 78px" : "60px 64px 88px",
        transform: `translateY(${lift}px)`,
      }}
    >
      <div style={{left: 64, position: "absolute", top: 52}}>
        <BrandBug accent={variant.accent} label="boreal.work" />
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flex: 1,
        }}
      >
        {children}
      </div>

      <div
        style={{
          bottom: isMinimal ? 54 : 58,
          left: 64,
          maxWidth: isMinimal ? 1180 : 940,
          opacity: beatOpacity,
          position: "absolute",
        }}
      >
        {!isMinimal ? (
          <div
            style={{
              color: variant.accent,
              fontFamily: MONO,
              fontSize: 13,
              letterSpacing: "0.18em",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            {variant.kicker}
          </div>
        ) : null}
        <div
          style={{
            fontSize: isMinimal ? 58 : 46,
            letterSpacing: "-0.05em",
            lineHeight: 0.98,
            textShadow: "0 10px 40px rgba(0,0,0,0.42)",
          }}
        >
          {beat.overlay}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ProblemPulseSurface: React.FC<SurfaceProps> = ({accent, mode = "standard"}) => {
  const frame = useCurrentFrame();
  const prompts = [
    {
      label: "Ask",
      progress: 0.82,
      text: "Need this done by Friday",
    },
    {
      label: "Search",
      progress: 0.62,
      text: "Find the best person or tool",
    },
    {
      label: "Chat",
      progress: 0.54,
      text: "Can someone handle this?",
    },
    {
      label: "Outcome",
      progress: 0.18,
      text: "Still unresolved",
      warning: true,
    },
  ];

  if (mode === "hackathon-update") {
    const heatmap = Array.from({length: 10}).map((_, row) =>
      Array.from({length: 18}).map((__, column) => {
        const intensity = Math.max(
          0.08,
          Math.sin((frame + row * 14 + column * 9) / 18) * 0.28 + 0.42,
        );
        return intensity;
      }),
    );

    return (
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.38fr 0.34fr 0.28fr",
          width: "100%",
        }}
      >
        <div
          style={{
            background: PANEL,
            border: `1px solid ${withAlpha(accent, 0.22)}`,
            minHeight: 420,
            padding: 24,
          }}
        >
          <div
            style={{
              color: MUTED,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.16em",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            Intent heatmap
          </div>
          <div
            style={{
              display: "grid",
              gap: 6,
              gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
            }}
          >
            {heatmap.flatMap((row, rowIndex) =>
              row.map((intensity, columnIndex) => (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  style={{
                    background:
                      intensity > 0.56
                        ? withAlpha(WARNING, intensity)
                        : withAlpha(accent, intensity),
                    height: 18,
                  }}
                />
              )),
            )}
          </div>
          <div
            style={{
              color: MUTED,
              fontSize: 16,
              lineHeight: 1.5,
              marginTop: 20,
            }}
          >
            Requests keep appearing across chat, search, and ops surfaces. Most still do not get routed to fulfillment.
          </div>
        </div>

        <div
          style={{
            background: PANEL,
            border: `1px solid ${withAlpha(accent, 0.22)}`,
            minHeight: 420,
            padding: 24,
          }}
        >
          <div
            style={{
              color: MUTED,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.16em",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            Dead logs
          </div>
          <div style={{display: "flex", flexDirection: "column", gap: 10}}>
            {[
              "Need an explainer video / still unresolved",
              "Looking for Manila supplier verifier / no route",
              "Package this service for checkout / stuck in draft",
              "Need a launch script this week / dead thread",
            ].map((line, index) => (
              <div
                key={line}
                style={{
                  background: index === 0 ? withAlpha(WARNING, 0.1) : PANEL_MUTED,
                  border: `1px solid ${index === 0 ? withAlpha(WARNING, 0.24) : BORDER}`,
                  color: MUTED,
                  fontSize: 15,
                  lineHeight: 1.45,
                  padding: 14,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: PANEL,
            border: `1px solid ${withAlpha(accent, 0.22)}`,
            minHeight: 420,
            padding: 24,
          }}
        >
          <div
            style={{
              color: MUTED,
              fontFamily: MONO,
              fontSize: 12,
              letterSpacing: "0.16em",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            Missing route
          </div>
          <div style={{fontSize: 56, letterSpacing: "-0.05em", lineHeight: 0.92}}>
            Unfulfilled demand
          </div>
          <div style={{color: MUTED, fontSize: 18, lineHeight: 1.48, marginTop: 16}}>
            The signal is obvious. The routing layer is what is missing.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gap: 18,
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        width: "100%",
      }}
    >
      {prompts.map((prompt, index) => {
        const reveal = spring({
          fps: 30,
          frame: frame - index * 4,
          config: {
            damping: 18,
            stiffness: 120,
          },
        });

        return (
          <div
            key={prompt.text}
            style={{
              background: PANEL,
              border: `1px solid ${withAlpha(accent, 0.22)}`,
              minHeight: 234,
              opacity: reveal,
              padding: 26,
              transform: `translateY(${interpolate(reveal, [0, 1], [18, 0])}px)`,
            }}
          >
            <div
              style={{
                color: prompt.warning ? WARNING : MUTED,
                fontFamily: MONO,
                fontSize: 13,
                letterSpacing: "0.16em",
                marginBottom: 18,
                textTransform: "uppercase",
              }}
            >
              {prompt.label}
            </div>
            <div
              style={{
                fontSize: prompt.warning ? 54 : 34,
                letterSpacing: "-0.04em",
                lineHeight: prompt.warning ? 0.92 : 1.04,
                marginBottom: 26,
                maxWidth: 480,
              }}
            >
              {prompt.text}
            </div>
            <ProgressBar
              accent={prompt.warning ? WARNING : accent}
              progress={prompt.progress}
            />
          </div>
        );
      })}
    </div>
  );
};

export const HomepageSurface: React.FC<SurfaceProps> = ({accent, title}) => {
  return (
    <WindowFrame accent={accent} title={title ?? "boreal.work"}>
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "1.08fr 0.92fr",
          height: 720,
          padding: 28,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
          <div>
            <Pill accent={accent} label="Commerce, headed north." />
            <div
              style={{
                fontSize: 62,
                letterSpacing: "-0.06em",
                lineHeight: 0.92,
                marginTop: 18,
                maxWidth: 760,
              }}
            >
              Turn intent into accountable work.
            </div>
            <div
              style={{
                color: MUTED,
                fontSize: 20,
                lineHeight: 1.52,
                marginTop: 18,
                maxWidth: 760,
              }}
            >
              Post the work. Match the right supply. Approve the route. Keep the
              result attached until it is fulfilled.
            </div>
            <div style={{display: "flex", gap: 12, marginTop: 24}}>
              <ActionButton accent={accent} label="Open Boreal" mode="solid" />
              <ActionButton accent={accent} label="Browse supply" mode="ghost" />
              <ActionButton accent={accent} label="Post a request" mode="ghost" />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            }}
          >
            <MetricTile label="Requests stay live" value="Tracked" />
            <MetricTile label="Supply stays visible" value="Searchable" />
            <MetricTile label="Results stay attached" value="Reviewable" />
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <FeatureShowcase accent={accent} />
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            }}
          >
            <CompactCard label="Requests" value="Demand becomes structured work" />
            <CompactCard label="Supply" value="People, agents, products, and tools" />
            <CompactCard label="Commerce" value="Checkout, payment, and fulfillment" />
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};

export const ChatWorkspaceSurface: React.FC<SurfaceProps> = ({
  accent,
  mode = "standard",
  title,
}) => {
  if (mode === "hackathon-update") {
    return (
      <WindowFrame accent={accent} title={title ?? "/chat"}>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.22fr 0.46fr 0.32fr",
            height: 720,
            padding: 22,
          }}
        >
          <SidebarPane subtitle="Tracked requests and route candidates" title="Intake">
            <SidebarItem
              active
              subtitle="video / motion graphics / 3 days / budget set"
              title="Explainer video for product launch"
            />
            <SidebarItem
              active={false}
              subtitle="physical verification / Manila / this week"
              title="Verify supplier facility"
            />
            <SidebarItem
              active={false}
              subtitle="product metadata / catalog / checkout"
              title="Package a digital product"
            />
          </SidebarPane>

          <div
            style={{
              background: PANEL_SOFT,
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${BORDER}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div style={{fontSize: 30, letterSpacing: "-0.04em"}}>
                    Explainer video for product launch
                  </div>
                  <div style={{color: MUTED, fontSize: 16, marginTop: 8}}>
                    Request drafted / matching engine running
                  </div>
                </div>
                <StatusChip accent={accent} label="Route ready" />
              </div>
              <div style={{marginTop: 18}}>
                <StageRail accent={accent} activeIndex={1} />
              </div>
            </div>

            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <MessageBubble
                role="user"
                text="I need a short explainer video for my product launch. Under 60 seconds, clean motion graphics, delivery in 3 days, budget $200."
              />
              <MessageBubble
                role="assistant"
                text="Structured. I’m scoring humans, agents, products, and provider-backed workflows against the request now."
              />
              <InlineDecisionCard
                accent={accent}
                title="Route selected"
                body="Boreal found a strong direct path first. If you want, this can still open to the market instead."
                primary="Approve direct route"
                secondary="Open swarm"
              />
              <InlineMatchStrip
                accent={accent}
                matches={[
                  "Provider-backed workflow / 97% / motion graphics / instant",
                  "Copywriter + video editor / 91% / proposal path",
                  "Research analyst / 76% / script support only",
                ]}
              />
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <InfoPanel title="Matching engine">
              <DataRow label="Top route" value="Provider-backed workflow" />
              <DataRow label="Fit" value="97% / output + speed + budget" />
              <DataRow label="Fallback" value="Open swarm / human + agent" />
              <DataRow label="Decision" value="Direct now, market optional" />
            </InfoPanel>

            <InfoPanel title="Score breakdown">
              <ScoreBreakdown accent={accent} rows={[
                {label: "Output fit", value: 0.98},
                {label: "Deadline fit", value: 0.95},
                {label: "Budget fit", value: 0.93},
                {label: "Route confidence", value: 0.97},
              ]} />
            </InfoPanel>
          </div>
        </div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame accent={accent} title={title ?? "/chat"}>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.23fr 0.47fr 0.3fr",
          height: 720,
          padding: 22,
        }}
      >
        <SidebarPane subtitle="Tracked asks and live workspaces" title="Requests">
          <SidebarItem
            active
            subtitle="Video / launch / proposals first"
            title="Launch video for Boreal"
          />
          <SidebarItem
            active={false}
            subtitle="Profile / skills / supply packaging"
            title="Publish a supply listing"
          />
          <SidebarItem
            active={false}
            subtitle="Product / metadata / checkout"
            title="Package a digital product"
          />
        </SidebarPane>

        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${BORDER}`,
              padding: "20px 22px 18px",
            }}
          >
            <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
              <div>
                <div style={{fontSize: 30, letterSpacing: "-0.04em"}}>
                  Launch video for Boreal
                </div>
                <div style={{color: MUTED, fontSize: 16, marginTop: 8}}>
                  Request workspace / proposals first
                </div>
              </div>
              <StatusChip accent={accent} label="Waiting for approval" />
            </div>
            <div style={{marginTop: 18}}>
              <StageRail accent={accent} activeIndex={1} />
            </div>
          </div>

          <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
            <MessageBubble
              role="user"
              text="We need a launch video for Boreal. Build the concept, route the work, and show the best suppliers or tools."
            />
            <MessageBubble
              role="assistant"
              text="Turning this into a request. I can clarify the scope, open it for proposals, or route it directly if the right supply is already known."
            />
            <InlineDecisionCard
              accent={accent}
              title="Prepare request"
              body="Approve Boreal to draft the request, or open this for worker proposals."
              primary="Approve Boreal"
              secondary="Open for proposals"
            />
            <InlineMatchStrip
              accent={accent}
              matches={[
                "Copywriter / strong for script and framing",
                "Research Analyst / strong for competitive framing",
              ]}
            />
            <ComposerCard />
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <InfoPanel title="Request routing">
            <DataRow label="Outcome" value="3-minute launch film" />
            <DataRow label="Route" value="Request workspace with proposals" />
            <DataRow label="Artifacts" value="Script / structure / supplier picks" />
          </InfoPanel>

          <InfoPanel title="Matched supply">
            <SupplyPathCard
              accent={accent}
              score="96% match"
              title="Copywriter"
              subtitle="Script, angle, hook, CTA"
            />
            <SupplyPathCard
              accent={accent}
              score="91% match"
              title="Research Analyst"
              subtitle="Evidence, messaging proof, positioning"
            />
          </InfoPanel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const SupplyMarketSurface: React.FC<SurfaceProps> = ({
  accent,
  mode = "standard",
  title,
}) => {
  if (mode === "hackathon-update") {
    return (
      <WindowFrame accent={accent} title={title ?? "Supply"}>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.54fr 0.46fr",
            height: 720,
            padding: 22,
          }}
        >
          <div
            style={{
              background: PANEL_SOFT,
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              padding: 20,
            }}
          >
            <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
              <div>
                <div style={{fontSize: 26, letterSpacing: "-0.04em"}}>Open requests</div>
                <div style={{color: MUTED, fontSize: 16, marginTop: 8}}>
                  When no direct route wins, Boreal opens the right market around the request.
                </div>
              </div>
              <Pill accent={accent} label="Swarm live" />
            </div>

            <div style={{marginTop: 16}}>
              <SearchBar placeholder="Search builders, agents, services, or requests" />
            </div>

            <div style={{display: "flex", flexDirection: "column", gap: 12, marginTop: 18}}>
              <RequestCard
                category="field ops"
                status="Open to propose"
                summary="Need someone physically present in Manila to verify a supplier facility this week."
                title="Verify supplier facility in Manila"
              />
              <MarketCard
                accent={accent}
                body="On-the-ground verification with timestamped evidence, supplier photos, and compliance notes."
                meta="human collective / proposal / Manila"
                score="94% swarm fit"
                subtitle="By Manila operator collective"
                title="Field verification collective"
              />
              <MarketCard
                accent={accent}
                body="Local operator plus remote agent coordination for checklist execution and evidence packaging."
                meta="human + agent / proposal / hybrid"
                score="92% swarm fit"
                subtitle="By hybrid operator pod"
                title="Operator pod with agent coordinator"
              />
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <InfoPanel title="Swarm response">
              <ProposalQueue accent={accent} />
            </InfoPanel>
            <InfoPanel title="What is live now">
              <CompactCard label="Profiles" value="Humans and agents are public supply" />
              <CompactCard label="Proposals" value="Price, ETA, and deliverables in-thread" />
              <CompactCard label="Matching" value="One engine across requests and supply" />
            </InfoPanel>
          </div>
        </div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame accent={accent} title={title ?? "Supply"}>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.56fr 0.44fr",
          height: 720,
          padding: 22,
        }}
      >
        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            padding: 20,
          }}
        >
          <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
            <div>
              <div style={{fontSize: 26, letterSpacing: "-0.04em"}}>Public supply</div>
              <div style={{color: MUTED, fontSize: 16, marginTop: 8}}>
                Search once. Route people, agents, tools, or products from the same market.
              </div>
            </div>
            <Pill accent={accent} label="Live directory" />
          </div>

          <div style={{marginTop: 16}}>
            <SearchBar placeholder="Search profiles, products, services, or requests" />
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 12, marginTop: 18}}>
            <MarketCard
              accent={accent}
              body="Launch and product messaging for pages, campaigns, and request workspaces."
              meta="human / fixed price / async"
              score="96% match"
              subtitle="By Copywriter"
              title="Copywriter for launch messaging"
            />
            <MarketCard
              accent={accent}
              body="Structured research that turns open questions into concise operator-ready memos."
              meta="agent / fixed price / async"
              score="91% match"
              subtitle="By Research Analyst"
              title="Research analyst for decision support"
            />
            <MarketCard
              accent={accent}
              body="Packaged digital product with searchable metadata, instant checkout, and immediate delivery."
              meta="product / instant / digital"
              score="88% match"
              subtitle="By Boreal Supply"
              title="Launch messaging starter pack"
            />
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <InfoPanel title="Profile spotlight">
            <ProfileSpotlight accent={accent} />
          </InfoPanel>
          <InfoPanel title="Open requests">
            <RequestCard
              category="content"
              status="Open to propose"
              summary="Need a short launch film, script options, and demo structure for a hackathon submission."
              title="Prepare a 3-minute launch video for Boreal"
            />
            <RequestCard
              category="commerce"
              status="Waiting for approval"
              summary="Package a provider-backed item with searchable metadata and payment-aware invocation."
              title="List a provider-backed service"
            />
          </InfoPanel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const LifecycleSurface: React.FC<SurfaceProps> = ({
  accent,
  mode = "standard",
  title,
}) => {
  if (mode === "hackathon-update") {
    return (
      <WindowFrame accent={accent} title={title ?? "Request workspace"}>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.58fr 0.42fr",
            height: 720,
            padding: 22,
          }}
        >
          <div
            style={{
              background: PANEL_SOFT,
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                borderBottom: `1px solid ${BORDER}`,
                padding: "20px 22px 18px",
              }}
            >
              <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
                <div>
                  <div style={{fontSize: 30, letterSpacing: "-0.04em"}}>
                    Verify supplier facility in Manila
                  </div>
                  <div style={{color: MUTED, fontSize: 16, marginTop: 8}}>
                    Swarm route / collective accepted / delivery in thread
                  </div>
                </div>
                <StatusChip accent={accent} label="In delivery" />
              </div>
              <div style={{marginTop: 18}}>
                <StageRail accent={accent} activeIndex={2} />
              </div>
            </div>

            <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
              <TimelineCard
                accent={accent}
                label="Proposal"
                title="Hybrid operator pod proposed a coordinated response"
              >
                <TagRow tags={["field operator", "agent coordinator", "2 days", "$180"]} />
              </TimelineCard>
              <TimelineCard
                accent={accent}
                label="Approval"
                title="Owner accepted the collective route"
              >
                <ParticipantRow names={["Owner", "Local operator", "Agent coordinator"]} />
              </TimelineCard>
              <TimelineCard
                accent={accent}
                label="Delivery"
                title="Evidence package lands on the request"
              >
                <div style={{display: "flex", gap: 10, marginTop: 4}}>
                  <FileChip label="facility-photos.zip" />
                  <FileChip label="verification-notes.md" />
                  <FileChip label="checklist.pdf" />
                </div>
              </TimelineCard>
            </div>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <InfoPanel title="Accountability thread">
              <DataRow label="Route" value="Open swarm / hybrid collective" />
              <DataRow label="Accepted by" value="Owner approval in-thread" />
              <DataRow label="Evidence" value="Files, notes, and timestamps attached" />
              <DataRow label="Closeout" value="Reviewable completion state" />
            </InfoPanel>

            <InfoPanel title="Why this matters">
              <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52}}>
                The same request model can handle instant digital fulfillment and harder real-world coordination without losing accountability.
              </div>
            </InfoPanel>
          </div>
        </div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame accent={accent} title={title ?? "Request workspace"}>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.6fr 0.4fr",
          height: 720,
          padding: 22,
        }}
      >
        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${BORDER}`,
              padding: "20px 22px 18px",
            }}
          >
            <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
              <div>
                <div style={{fontSize: 30, letterSpacing: "-0.04em"}}>
                  Prepare a 3-minute launch video for Boreal
                </div>
                <div style={{color: MUTED, fontSize: 16, marginTop: 8}}>
                  Proposal accepted / delivery in thread
                </div>
              </div>
              <StatusChip accent={accent} label="Delivered" />
            </div>
            <div style={{marginTop: 18}}>
              <StageRail accent={accent} activeIndex={3} />
            </div>
          </div>

          <div style={{display: "flex", flex: 1, flexDirection: "column", gap: 14, padding: 22}}>
            <TimelineCard
              accent={accent}
              label="Proposal"
              title="Copywriter proposed a fixed-price delivery"
            >
              <TagRow tags={["USD 45", "2 hours", "script", "hook", "CTA"]} />
            </TimelineCard>
            <TimelineCard
              accent={accent}
              label="Approval"
              title="Owner approved the route and the participant"
            >
              <ParticipantRow names={["Owner", "Copywriter", "Boreal Agent"]} />
            </TimelineCard>
            <TimelineCard
              accent={accent}
              label="Delivery"
              title="Work submission landed on the request"
            >
              <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52}}>
                Hero angle, launch hook, pacing notes, and CTA variants delivered into the
                same accountable thread.
              </div>
              <div style={{display: "flex", gap: 10, marginTop: 14}}>
                <FileChip label="launch-script.md" />
                <FileChip label="hook-options.md" />
                <FileChip label="cta-variants.md" />
              </div>
            </TimelineCard>
            <TimelineCard
              accent={accent}
              label="Review"
              title="The request closed with a visible rating"
            >
              <ReviewStars />
            </TimelineCard>
          </div>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <InfoPanel title="Accepted scope">
            <DataRow label="Supplier" value="Copywriter" />
            <DataRow label="Price" value="USD 45 fixed" />
            <DataRow label="ETA" value="2 hours" />
            <DataRow label="Deliverables" value="Hook / structure / script / CTA" />
          </InfoPanel>

          <InfoPanel title="Participants">
            <ParticipantRow names={["Owner", "Copywriter", "Boreal Agent"]} />
          </InfoPanel>

          <InfoPanel title="Outcome">
            <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52}}>
              Messages, files, rating, and resolution all stay attached to the same request.
            </div>
          </InfoPanel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const FulfillmentSurface: React.FC<SurfaceProps> = ({
  accent,
  mode = "standard",
  title,
}) => {
  if (mode === "hackathon-update") {
    return (
      <WindowFrame accent={accent} title={title ?? "Direct fulfillment"}>
        <div
          style={{
            display: "grid",
            gap: 18,
            gridTemplateColumns: "0.6fr 0.4fr",
            height: 720,
            padding: 22,
          }}
        >
          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <InfoPanel title="Instant route">
              <div style={{fontSize: 28, letterSpacing: "-0.04em"}}>
                Provider-backed explainer workflow
              </div>
              <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52, marginTop: 10}}>
                Boreal found a ready route for the request without opening the market first.
              </div>
              <div style={{marginTop: 14}}>
                <DataRow label="Match" value="97% / output + deadline + budget" />
                <DataRow label="ETA" value="4 minutes estimated" />
                <DataRow label="Path" value="Provider-backed execution" />
                <DataRow label="Proof" value="Artifacts and evidence attached to request" />
              </div>
            </InfoPanel>

            <InfoPanel title="Execution state">
              <ArtifactPipeline accent={accent} />
            </InfoPanel>
          </div>

          <div style={{display: "flex", flexDirection: "column", gap: 16}}>
            <InfoPanel title="Why it won">
              <ScoreBreakdown accent={accent} rows={[
                {label: "Motion fit", value: 0.98},
                {label: "Speed", value: 0.97},
                {label: "Budget", value: 0.94},
                {label: "Confidence", value: 0.97},
              ]} />
            </InfoPanel>

            <InfoPanel title="Attached result">
              <CompactCard label="Preview" value="Video thumbnail + timestamp" />
              <CompactCard label="Download" value="Attached to request thread" />
              <CompactCard label="Evidence" value="Execution trail preserved" />
            </InfoPanel>
          </div>
        </div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame accent={accent} title={title ?? "Direct fulfillment"}>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "1fr 0.42fr",
          height: 720,
          padding: 22,
        }}
      >
        <div style={{display: "grid", gap: 16, gridTemplateColumns: "repeat(3, minmax(0, 1fr))"}}>
          <ArtifactCard accent={accent} kind="image" title="Poster concept" />
          <ArtifactCard accent={accent} kind="audio" title="Voice note" />
          <ArtifactCard accent={accent} kind="video" title="Product walkthrough" />
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <InfoPanel title="Matched listing">
            <div style={{fontSize: 24, letterSpacing: "-0.04em"}}>Provider-backed creative pack</div>
            <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52, marginTop: 10}}>
              Known supply can move from request context into cart, checkout, and attached fulfillment
              without leaving the market surface.
            </div>
            <div style={{marginTop: 14}}>
              <DataRow label="Type" value="Digital service" />
              <DataRow label="Price" value="USD 29 fixed" />
              <DataRow label="Checkout" value="Payment-aware invocation" />
            </div>
          </InfoPanel>

          <InfoPanel title="Cart and delivery">
            <div style={{display: "flex", flexDirection: "column", gap: 12}}>
              <CompactCard label="Cart" value="1 ready item" />
              <CompactCard label="Checkout" value="Approve, pay, attach result" />
              <CompactCard label="Delivery" value="Result lands on the request" />
            </div>
            <div style={{display: "flex", gap: 10, marginTop: 16}}>
              <ActionButton accent={accent} label="Add to cart" mode="solid" />
              <ActionButton accent={accent} label="Preview" mode="ghost" />
            </div>
          </InfoPanel>
        </div>
      </div>
    </WindowFrame>
  );
};

export const SolanaSurface: React.FC<SurfaceProps> = ({accent, title}) => {
  return (
    <WindowFrame accent={accent} title={title ?? "Boreal x Solana"}>
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "0.38fr 0.62fr",
          height: 720,
          padding: 22,
        }}
      >
        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <InfoPanel title="Live today">
            <CompactCard label="Provider sync" value="External services enter supply" />
            <CompactCard label="Payment start" value="Privy-backed x402 flow" />
            <CompactCard label="Request trace" value="Evidence stays attached" />
          </InfoPanel>

          <InfoPanel title="Why Solana">
            <CompactCard label="Fast" value="Stay inside the product loop" />
            <CompactCard label="Programmable" value="Approvals and settlement can coordinate" />
            <CompactCard label="Verifiable" value="Trust can compound with evidence" />
          </InfoPanel>
        </div>

        <div
          style={{
            background: PANEL_SOFT,
            border: `1px solid ${BORDER}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 24,
          }}
        >
          <div>
            <div style={{fontSize: 30, letterSpacing: "-0.04em"}}>Request to settlement</div>
            <div style={{color: MUTED, fontSize: 17, lineHeight: 1.52, marginTop: 10, maxWidth: 760}}>
              The market loop does not end at chat. It ends when approval, payment, and outcome can
              be coordinated with trust.
            </div>
          </div>

          <FlowDiagram accent={accent} />

          <div style={{display: "flex", gap: 10}}>
            <Pill accent={accent} label="fast coordination" />
            <Pill accent={accent} label="programmable trust" />
            <Pill accent={accent} label="verifiable execution" />
          </div>
        </div>
      </div>
    </WindowFrame>
  );
};

export const ClosingMontageSurface: React.FC<SurfaceProps> = ({
  accent,
  mode = "standard",
  title,
}) => {
  if (mode === "hackathon-update") {
    return (
      <WindowFrame accent={accent} title={title ?? "Boreal"}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: 720,
            justifyContent: "space-between",
            padding: 28,
          }}
        >
          <div>
            <Pill accent={accent} label="Solana hackathon update" />
            <div
              style={{
                fontSize: 64,
                letterSpacing: "-0.06em",
                lineHeight: 0.92,
                marginTop: 18,
                maxWidth: 1120,
              }}
            >
              Matching engine live. Public supply live. Request-native coordination live.
            </div>
            <div style={{color: MUTED, fontSize: 20, lineHeight: 1.5, marginTop: 18, maxWidth: 980}}>
              Provider sync is wired. Accountable delivery is live. Boreal is closing in on launch.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            }}
          >
            <CompactCard label="Intent" value="Tracked" />
            <CompactCard label="Matching" value="Live" />
            <CompactCard label="Supply" value="Public" />
            <CompactCard label="Swarm" value="Open" />
            <CompactCard label="Checkout" value="Wired" />
            <CompactCard label="Launch" value="Close" />
          </div>

          <FeatureShowcase accent={accent} />
        </div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame accent={accent} title={title ?? "Boreal"}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: 720,
          justifyContent: "space-between",
          padding: 28,
        }}
      >
        <div>
          <Pill accent={accent} label="The missing layer" />
          <div
            style={{
              fontSize: 68,
              letterSpacing: "-0.06em",
              lineHeight: 0.92,
              marginTop: 20,
              maxWidth: 1160,
            }}
          >
            Search finds information. Boreal keeps work alive to fulfillment.
          </div>
        </div>

        <FeatureShowcase accent={accent} />

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          }}
        >
          <CompactCard label="Requests" value="Demand becomes structure" />
          <CompactCard label="Supply" value="Markets become searchable" />
          <CompactCard label="Commerce" value="Outcomes become accountable" />
        </div>
      </div>
    </WindowFrame>
  );
};

const BrandBug: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: withAlpha("#061116", 0.82),
        border: `1px solid ${withAlpha(accent, 0.28)}`,
        color: TEXT,
        display: "inline-flex",
        fontFamily: MONO,
        fontSize: 13,
        gap: 10,
        letterSpacing: "0.16em",
        padding: "10px 14px",
        textTransform: "uppercase",
      }}
    >
      <div
        style={{
          background: accent,
          boxShadow: `0 0 24px ${withAlpha(accent, 0.36)}`,
          height: 8,
          width: 8,
        }}
      />
      {label}
    </div>
  );
};

const WindowFrame: React.FC<WindowFrameProps> = ({accent, children, title}) => {
  return (
    <div
      style={{
        background: PANEL,
        border: `1px solid ${withAlpha(accent, 0.22)}`,
        boxShadow: `0 18px 80px ${withAlpha("#000000", 0.34)}`,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 18px",
        }}
      >
        <div style={{display: "flex", gap: 8}}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((color) => (
            <div
              key={color}
              style={{
                background: color,
                borderRadius: 999,
                height: 10,
                width: 10,
              }}
            />
          ))}
        </div>
        <div
          style={{
            color: MUTED,
            fontFamily: MONO,
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
};

const Pill: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        alignItems: "center",
        border: `1px solid ${withAlpha(accent, 0.38)}`,
        color: accent,
        display: "inline-flex",
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.16em",
        padding: "8px 12px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

const StatusChip: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        background: withAlpha(accent, 0.12),
        border: `1px solid ${withAlpha(accent, 0.26)}`,
        color: TEXT,
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.16em",
        padding: "10px 12px",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  );
};

const ActionButton: React.FC<{
  accent: string;
  label: string;
  mode: "ghost" | "solid";
}> = ({accent, label, mode}) => {
  return (
    <div
      style={{
        alignItems: "center",
        background: mode === "solid" ? accent : "transparent",
        border: `1px solid ${mode === "solid" ? accent : withAlpha(accent, 0.32)}`,
        color: mode === "solid" ? "#041017" : TEXT,
        display: "inline-flex",
        fontSize: 16,
        fontWeight: 600,
        justifyContent: "center",
        padding: "12px 16px",
      }}
    >
      {label}
    </div>
  );
};

const SidebarPane: React.FC<{children: ReactNode; subtitle: string; title: string}> = ({
  children,
  subtitle,
  title,
}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        padding: 18,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div style={{fontSize: 20, letterSpacing: "-0.03em", marginTop: 10}}>{subtitle}</div>
      <div style={{display: "flex", flexDirection: "column", gap: 10, marginTop: 16}}>
        {children}
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{active: boolean; subtitle: string; title: string}> = ({
  active,
  subtitle,
  title,
}) => {
  return (
    <div
      style={{
        background: active ? withAlpha("#ffffff", 0.08) : withAlpha("#ffffff", 0.03),
        border: `1px solid ${active ? withAlpha("#14b8a6", 0.36) : BORDER}`,
        padding: 14,
      }}
    >
      <div style={{fontSize: 17, lineHeight: 1.32}}>{title}</div>
      <div style={{color: MUTED, fontSize: 14, marginTop: 6}}>{subtitle}</div>
    </div>
  );
};

const MessageBubble: React.FC<{role: "assistant" | "user"; text: string}> = ({role, text}) => {
  return (
    <div
      style={{
        alignSelf: role === "user" ? "flex-end" : "flex-start",
        background: role === "user" ? withAlpha("#14b8a6", 0.14) : PANEL_MUTED,
        border: `1px solid ${role === "user" ? withAlpha("#14b8a6", 0.24) : BORDER}`,
        maxWidth: role === "user" ? "82%" : "92%",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {role}
      </div>
      <div style={{fontSize: 18, lineHeight: 1.52}}>{text}</div>
    </div>
  );
};

const StageRail: React.FC<{accent: string; activeIndex: number}> = ({accent, activeIndex}) => {
  const labels = ["Scope", "Approve", "Active", "Deliver"];

  return (
    <div
      style={{
        alignItems: "center",
        display: "grid",
        gap: 0,
        gridTemplateColumns: "auto 1fr auto 1fr auto 1fr auto",
      }}
    >
      {labels.map((label, index) => (
        <StageNode
          accent={accent}
          activeIndex={activeIndex}
          index={index}
          key={label}
          label={label}
          showConnector={index < labels.length - 1}
        />
      ))}
    </div>
  );
};

const StageNode: React.FC<{
  accent: string;
  activeIndex: number;
  index: number;
  label: string;
  showConnector: boolean;
}> = ({accent, activeIndex, index, label, showConnector}) => {
  const isComplete = index < activeIndex;
  const isCurrent = index === activeIndex;

  return (
    <>
      <div style={{alignItems: "center", display: "flex", flexDirection: "column", gap: 10}}>
        <div
          style={{
            alignItems: "center",
            background: isComplete ? accent : isCurrent ? withAlpha(accent, 0.14) : "transparent",
            border: `2px solid ${isComplete || isCurrent ? accent : withAlpha("#ffffff", 0.2)}`,
            borderRadius: 999,
            display: "flex",
            height: 22,
            justifyContent: "center",
            width: 22,
          }}
        >
          {isCurrent && !isComplete ? (
            <div
              style={{
                background: accent,
                borderRadius: 999,
                height: 8,
                width: 8,
              }}
            />
          ) : null}
        </div>
        <div
          style={{
            color: isComplete || isCurrent ? TEXT : MUTED_SOFT,
            fontFamily: MONO,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
      {showConnector ? (
        <div
          style={{
            background: index < activeIndex ? accent : withAlpha("#ffffff", 0.12),
            height: 2,
            marginBottom: 20,
            width: "100%",
          }}
        />
      ) : null}
    </>
  );
};

const InfoPanel: React.FC<{children: ReactNode; title: string}> = ({children, title}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${BORDER}`,
        padding: 18,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 14,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

const DataRow: React.FC<{label: string; value: string}> = ({label, value}) => {
  return (
    <div
      style={{
        borderTop: `1px solid ${BORDER}`,
        display: "grid",
        gap: 14,
        gridTemplateColumns: "130px 1fr",
        padding: "10px 0",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{fontSize: 15, lineHeight: 1.5}}>{value}</div>
    </div>
  );
};

const TagRow: React.FC<{tags: string[]}> = ({tags}) => {
  return (
    <div style={{display: "flex", flexWrap: "wrap", gap: 8}}>
      {tags.map((tag) => (
        <div
          key={tag}
          style={{
            border: `1px solid ${BORDER}`,
            color: MUTED,
            fontSize: 12,
            padding: "8px 10px",
            textTransform: "uppercase",
          }}
        >
          {tag}
        </div>
      ))}
    </div>
  );
};

const SearchBar: React.FC<{placeholder: string}> = ({placeholder}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        color: MUTED,
        fontSize: 16,
        padding: "12px 14px",
      }}
    >
      {placeholder}
    </div>
  );
};

const MarketCard: React.FC<{
  accent: string;
  body: string;
  meta: string;
  score: string;
  subtitle: string;
  title: string;
}> = ({accent, body, meta, score, subtitle, title}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        padding: 16,
      }}
    >
      <div style={{alignItems: "flex-start", display: "flex", gap: 12, justifyContent: "space-between"}}>
        <div style={{fontSize: 20, letterSpacing: "-0.03em", lineHeight: 1.28, maxWidth: 520}}>
          {title}
        </div>
        <MatchBadge accent={accent} label={score} />
      </div>
      <div style={{color: MUTED, fontSize: 14, marginTop: 6}}>{subtitle}</div>
      <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52, marginTop: 10}}>{body}</div>
      <div style={{color: MUTED_SOFT, fontFamily: MONO, fontSize: 12, marginTop: 14}}>
        {meta}
      </div>
    </div>
  );
};

const MetricTile: React.FC<{label: string; value: string}> = ({label, value}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        padding: 14,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.16em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{fontSize: 28, letterSpacing: "-0.04em", lineHeight: 1}}>{value}</div>
    </div>
  );
};

const RequestCard: React.FC<{
  category: string;
  status: string;
  summary: string;
  title: string;
}> = ({category, status, summary, title}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        marginTop: 10,
        padding: 16,
      }}
    >
      <div style={{fontSize: 20, letterSpacing: "-0.03em", lineHeight: 1.28}}>{title}</div>
      <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52, marginTop: 10}}>{summary}</div>
      <div
        style={{
          color: MUTED_SOFT,
          fontFamily: MONO,
          fontSize: 12,
          marginTop: 12,
          textTransform: "uppercase",
        }}
      >
        {category} / {status}
      </div>
    </div>
  );
};

const InlineDecisionCard: React.FC<{
  accent: string;
  body: string;
  primary: string;
  secondary: string;
  title: string;
}> = ({accent, body, primary, secondary, title}) => {
  return (
    <div
      style={{
        background: withAlpha(accent, 0.08),
        border: `1px solid ${withAlpha(accent, 0.24)}`,
        padding: 18,
      }}
    >
      <div style={{fontSize: 22, letterSpacing: "-0.03em"}}>{title}</div>
      <div style={{color: MUTED, fontSize: 16, lineHeight: 1.52, marginTop: 10}}>{body}</div>
      <div style={{display: "flex", gap: 10, marginTop: 16}}>
        <ActionButton accent={accent} label={primary} mode="solid" />
        <ActionButton accent={accent} label={secondary} mode="ghost" />
      </div>
    </div>
  );
};

const InlineMatchStrip: React.FC<{accent: string; matches: string[]}> = ({accent, matches}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 16,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Matched paths
      </div>
      {matches.map((match) => (
        <div
          key={match}
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
          }}
        >
          <div
            style={{
              background: accent,
              height: 6,
              width: 6,
            }}
          />
          <div style={{color: MUTED, fontSize: 15, lineHeight: 1.42}}>{match}</div>
        </div>
      ))}
    </div>
  );
};

const ComposerCard: React.FC = () => {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${BORDER}`,
        marginTop: "auto",
        padding: 18,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        Composer
      </div>
      <div style={{color: MUTED, fontSize: 17, lineHeight: 1.52}}>
        Start in natural language. Boreal decides whether this should become a request,
        a match, a checkout path, or a direct result.
      </div>
    </div>
  );
};

const SupplyPathCard: React.FC<{
  accent: string;
  score: string;
  subtitle: string;
  title: string;
}> = ({accent, score, subtitle, title}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        marginTop: 10,
        padding: 14,
      }}
    >
      <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
        <div style={{fontSize: 18, letterSpacing: "-0.03em"}}>{title}</div>
        <MatchBadge accent={accent} label={score} />
      </div>
      <div style={{color: MUTED, fontSize: 14, marginTop: 8}}>{subtitle}</div>
    </div>
  );
};

const ScoreBreakdown: React.FC<{
  accent: string;
  rows: Array<{label: string; value: number}>;
}> = ({accent, rows}) => {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 12}}>
      {rows.map((row) => (
        <div key={row.label}>
          <div style={{alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: 8}}>
            <div style={{color: MUTED, fontSize: 15}}>{row.label}</div>
            <div
              style={{
                color: accent,
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {Math.round(row.value * 100)}%
            </div>
          </div>
          <ProgressBar accent={accent} progress={row.value} />
        </div>
      ))}
    </div>
  );
};

const ProposalQueue: React.FC<{accent: string}> = ({accent}) => {
  const entries = [
    {
      eta: "2 days",
      price: "$180",
      title: "Manila operator collective",
      type: "human collective",
    },
    {
      eta: "36 hours",
      price: "$220",
      title: "Hybrid operator pod",
      type: "human + agent",
    },
    {
      eta: "3 days",
      price: "$160",
      title: "Local verifier",
      type: "human",
    },
  ];

  return (
    <div style={{display: "flex", flexDirection: "column", gap: 12}}>
      {entries.map((entry, index) => (
        <div
          key={entry.title}
          style={{
            background: index === 1 ? withAlpha(accent, 0.08) : PANEL_MUTED,
            border: `1px solid ${index === 1 ? withAlpha(accent, 0.26) : BORDER}`,
            padding: 14,
          }}
        >
          <div style={{alignItems: "center", display: "flex", justifyContent: "space-between"}}>
            <div style={{fontSize: 18, letterSpacing: "-0.03em"}}>{entry.title}</div>
            <MatchBadge accent={accent} label={index === 1 ? "selected path" : "proposal"} />
          </div>
          <div style={{color: MUTED, fontSize: 14, marginTop: 8}}>{entry.type}</div>
          <div style={{display: "flex", gap: 14, marginTop: 10}}>
            <div style={{color: MUTED_SOFT, fontFamily: MONO, fontSize: 12}}>{entry.price}</div>
            <div style={{color: MUTED_SOFT, fontFamily: MONO, fontSize: 12}}>{entry.eta}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TimelineCard: React.FC<{
  accent: string;
  children: ReactNode;
  label: string;
  title: string;
}> = ({accent, children, label, title}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${withAlpha(accent, 0.18)}`,
        padding: 16,
      }}
    >
      <div
        style={{
          color: accent,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1.28}}>{title}</div>
      <div style={{marginTop: 14}}>{children}</div>
    </div>
  );
};

const FileChip: React.FC<{label: string}> = ({label}) => {
  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        color: MUTED,
        fontFamily: MONO,
        fontSize: 12,
        padding: "8px 10px",
      }}
    >
      {label}
    </div>
  );
};

const ParticipantRow: React.FC<{names: string[]}> = ({names}) => {
  return (
    <div style={{display: "flex", gap: 12, flexWrap: "wrap"}}>
      {names.map((name, index) => (
        <div
          key={name}
          style={{
            alignItems: "center",
            display: "flex",
            gap: 10,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: index === 2 ? withAlpha("#14b8a6", 0.16) : PANEL_MUTED,
              border: `1px solid ${index === 2 ? withAlpha("#14b8a6", 0.32) : BORDER}`,
              borderRadius: 999,
              display: "flex",
              height: 34,
              justifyContent: "center",
              width: 34,
            }}
          >
            {name.charAt(0)}
          </div>
          <div style={{color: MUTED, fontSize: 15}}>{name}</div>
        </div>
      ))}
    </div>
  );
};

const ReviewStars: React.FC = () => {
  return (
    <div style={{display: "flex", gap: 8}}>
      {Array.from({length: 5}).map((_, index) => (
        <div
          key={index}
          style={{
            color: "#f59e0b",
            fontSize: 24,
          }}
        >
          *
        </div>
      ))}
    </div>
  );
};

const ArtifactPipeline: React.FC<{accent: string}> = ({accent}) => {
  const steps = [
    {
      body: "Matched workflow selected by the routing engine",
      title: "Route",
    },
    {
      body: "Approval starts the provider-backed execution",
      title: "Execute",
    },
    {
      body: "Preview, files, and timestamps attach to the request",
      title: "Attach",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
      }}
    >
      {steps.map((step, index) => (
        <div
          key={step.title}
          style={{
            background: index === 1 ? withAlpha(accent, 0.08) : PANEL_MUTED,
            border: `1px solid ${index === 1 ? withAlpha(accent, 0.24) : BORDER}`,
            minHeight: 150,
            padding: 14,
          }}
        >
          <div
            style={{
              color: accent,
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: "0.16em",
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            {step.title}
          </div>
          <div style={{color: MUTED, fontSize: 15, lineHeight: 1.45}}>{step.body}</div>
        </div>
      ))}
    </div>
  );
};

const ArtifactCard: React.FC<{accent: string; kind: "audio" | "image" | "video"; title: string}> = ({
  accent,
  kind,
  title,
}) => {
  const frame = useCurrentFrame();
  const progress = Math.min(1, frame / 60);
  const waveformBars = Array.from({length: 20}).map((_, index) => {
    const oscillation = Math.sin(frame / 4 + index * 0.8);
    return Math.max(12, 44 + oscillation * 28);
  });

  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${withAlpha(accent, 0.22)}`,
        display: "flex",
        flexDirection: "column",
        minHeight: 312,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          padding: "14px 16px",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div style={{flex: 1, padding: 16}}>
        {kind === "image" ? (
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(20, 184, 166, 0.24), rgba(56, 189, 248, 0.18), rgba(255,255,255,0.06))",
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              justifyContent: "flex-end",
              padding: 16,
            }}
          >
            <div style={{fontSize: 28, letterSpacing: "-0.04em", lineHeight: 1.04, maxWidth: 260}}>
              Poster concept ready for delivery
            </div>
          </div>
        ) : null}

        {kind === "audio" ? (
          <div
            style={{
              alignItems: "center",
              border: `1px solid ${BORDER}`,
              display: "flex",
              gap: 8,
              height: "100%",
              justifyContent: "center",
              padding: 18,
            }}
          >
            {waveformBars.map((height, index) => (
              <div
                key={index}
                style={{
                  background: index % 2 === 0 ? accent : "#38bdf8",
                  height,
                  width: 10,
                }}
              />
            ))}
          </div>
        ) : null}

        {kind === "video" ? (
          <div
            style={{
              border: `1px solid ${BORDER}`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              height: "100%",
              padding: 18,
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                fontSize: 18,
                justifyContent: "space-between",
              }}
            >
              <span>Status: rendering</span>
              <span>{Math.round(progress * 100)}%</span>
            </div>
            <ProgressBar accent={accent} progress={progress} />
            <div
              style={{
                background: PANEL_MUTED,
                border: `1px solid ${BORDER}`,
                color: MUTED,
                flex: 1,
                fontSize: 16,
                lineHeight: 1.52,
                padding: 16,
              }}
            >
              Video jobs, refresh states, and finished artifacts can stay on the same request.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ProfileSpotlight: React.FC<{accent: string}> = ({accent}) => {
  return (
    <div style={{display: "flex", flexDirection: "column", gap: 16}}>
      <div style={{alignItems: "center", display: "flex", gap: 16}}>
        <div
          style={{
            alignItems: "center",
            background: withAlpha(accent, 0.16),
            border: `1px solid ${withAlpha(accent, 0.28)}`,
            borderRadius: 999,
            display: "flex",
            height: 72,
            justifyContent: "center",
            width: 72,
          }}
        >
          BA
        </div>
        <div>
          <div style={{fontSize: 28, letterSpacing: "-0.04em"}}>Boreal Agent</div>
          <div style={{color: MUTED, fontSize: 16, marginTop: 6}}>
            Intent routing, market coordination, direct fulfillment
          </div>
        </div>
      </div>

      <TagRow tags={["routing", "matching", "media", "checkout"]} />
      <SparkBars accent={accent} values={[10, 16, 12, 20, 18, 24, 21, 26, 28, 30]} />
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        }}
      >
        <MetricTile label="Rating" value="4.9" />
        <MetricTile label="Fulfilled" value="128" />
        <MetricTile label="Active" value="17" />
        <MetricTile label="Avg ETA" value="2.1h" />
      </div>
    </div>
  );
};

const SparkBars: React.FC<{accent: string; values: number[]}> = ({accent, values}) => {
  return (
    <div
      style={{
        alignItems: "end",
        border: `1px solid ${BORDER}`,
        display: "grid",
        gap: 8,
        gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
        height: 124,
        padding: 14,
      }}
    >
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          style={{
            background: index === values.length - 1 ? accent : withAlpha(accent, 0.5),
            height: `${value * 2.3}px`,
          }}
        />
      ))}
    </div>
  );
};

const FlowDiagram: React.FC<{accent: string}> = ({accent}) => {
  const steps = [
    {
      body: "Chat, search, and requests become structured market demand.",
      title: "Intent",
    },
    {
      body: "Boreal matches people, agents, products, or provider-backed supply.",
      title: "Routing",
    },
    {
      body: "Approval and payment can stay explicit in the same loop.",
      title: "Approval",
    },
    {
      body: "Evidence, delivery, and settlement can compound trust.",
      title: "Settlement",
    },
  ];

  return (
    <div
      style={{
        alignItems: "center",
        display: "grid",
        gap: 14,
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      }}
    >
      {steps.map((step, index) => (
        <FlowNode
          accent={accent}
          body={step.body}
          isLast={index === steps.length - 1}
          key={step.title}
          title={step.title}
        />
      ))}
    </div>
  );
};

const FlowNode: React.FC<{
  accent: string;
  body: string;
  isLast: boolean;
  title: string;
}> = ({accent, body, isLast, title}) => {
  return (
    <>
      <div
        style={{
          background: PANEL_MUTED,
          border: `1px solid ${withAlpha(accent, 0.2)}`,
          gridColumn: "span 1",
          minHeight: 190,
          padding: 16,
        }}
      >
        <div
          style={{
            color: accent,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.16em",
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div style={{color: MUTED, fontSize: 16, lineHeight: 1.5}}>{body}</div>
      </div>
      {!isLast ? (
        <div
          style={{
            background: withAlpha(accent, 0.32),
            gridColumn: "span 1",
            height: 2,
          }}
        />
      ) : null}
    </>
  );
};

const FeatureShowcase: React.FC<{accent: string}> = ({accent}) => {
  return (
    <div
      style={{
        background: PANEL_SOFT,
        border: `1px solid ${withAlpha(accent, 0.2)}`,
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: 20,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 12,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Operating loop
      </div>
      <div style={{fontSize: 32, letterSpacing: "-0.04em", lineHeight: 1.04}}>
        Chat becomes a request. The market stays visible. The result lands back on the same thread.
      </div>
      <div
        style={{
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        }}
      >
        {["Chat", "Request", "Match", "Approve", "Deliver"].map((label, index) => (
          <div
            key={label}
            style={{
              background: index === 2 ? withAlpha(accent, 0.14) : PANEL_MUTED,
              border: `1px solid ${index === 2 ? withAlpha(accent, 0.28) : BORDER}`,
              padding: 14,
            }}
          >
            <div
              style={{
                color: index === 2 ? accent : MUTED,
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: "0.16em",
                marginBottom: 8,
                textTransform: "uppercase",
              }}
            >
              Step {index + 1}
            </div>
            <div style={{fontSize: 18, letterSpacing: "-0.03em"}}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CompactCard: React.FC<{label: string; value: string}> = ({label, value}) => {
  return (
    <div
      style={{
        background: PANEL_MUTED,
        border: `1px solid ${BORDER}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 92,
        padding: 14,
      }}
    >
      <div
        style={{
          color: MUTED,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{fontSize: 18, letterSpacing: "-0.03em", lineHeight: 1.35}}>{value}</div>
    </div>
  );
};

const MatchBadge: React.FC<{accent: string; label: string}> = ({accent, label}) => {
  return (
    <div
      style={{
        border: `1px solid ${withAlpha(accent, 0.3)}`,
        color: accent,
        fontFamily: MONO,
        fontSize: 12,
        letterSpacing: "0.14em",
        padding: "8px 10px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  );
};

const ProgressBar: React.FC<{accent: string; progress: number}> = ({accent, progress}) => {
  return (
    <div style={{background: withAlpha("#ffffff", 0.08), height: 8}}>
      <div
        style={{
          background: accent,
          height: "100%",
          width: `${Math.round(progress * 100)}%`,
        }}
      />
    </div>
  );
};

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
